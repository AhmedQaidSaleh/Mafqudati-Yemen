import { Router } from "express";
import { getGeminiClient } from "../ai/gemini";
import { z } from "zod";

const router = Router();

const candidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  governorate: z.string().nullable().optional(),
});

const searchAiSchema = z.object({
  description: z.string().min(3).max(2000),
  type: z.enum(["lost", "found"]).optional(),
  governorate: z.string().optional(),
  category: z.string().optional(),
  candidates: z.array(candidateSchema).max(60),
});

export type AiMatch = {
  id: string;
  score: number;
  reasons: string[];
};

// Heuristic fallback matching for when Gemini API key is invalid or unavailable
function fallbackSearchMatching(
  query: string,
  candidates: z.infer<typeof candidateSchema>[],
  governorate?: string,
  category?: string,
): AiMatch[] {
  const queryTokens = query
    .toLowerCase()
    .split(/[\s,،.\-_/]+/)
    .filter((t) => t.length >= 2);

  return candidates
    .map((c) => {
      let score = 0;
      const reasons: string[] = [];

      // Check governorate match
      if (
        governorate &&
        c.governorate &&
        (c.governorate.includes(governorate) || governorate.includes(c.governorate))
      ) {
        score += 25;
        reasons.push("تطابق في المحافظة");
      }

      // Check category match
      if (
        category &&
        c.category &&
        (c.category.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(c.category.toLowerCase()))
      ) {
        score += 25;
        reasons.push("تطابق في التصنيف");
      }

      // Check token match in title and description
      const targetText = `${c.title} ${c.description || ""}`.toLowerCase();
      let matchedTokensCount = 0;
      for (const token of queryTokens) {
        if (targetText.includes(token)) {
          matchedTokensCount++;
        }
      }

      if (queryTokens.length > 0) {
        const tokenScore = Math.min(
          50,
          Math.round((matchedTokensCount / Math.max(1, Math.min(queryTokens.length, 6))) * 50),
        );
        if (tokenScore > 0) {
          score += tokenScore;
          reasons.push(`تطابق في الكلمات المفتاحية (${matchedTokensCount} كلمات)`);
        }
      }

      if (score === 0) {
        score = 10;
        reasons.push("بلاغ ذو صلة محتملة");
      }

      return {
        id: c.id,
        score: Math.min(100, score),
        reasons: reasons.slice(0, 3),
      };
    })
    .sort((a, b) => b.score - a.score);
}

router.post("/search-score", async (req, res) => {
  try {
    const data = searchAiSchema.parse(req.body);
    if (data.candidates.length === 0) return res.json({ matches: [] });

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback directly if Gemini client is not initialized
      const matches = fallbackSearchMatching(
        data.description,
        data.candidates,
        data.governorate,
        data.category,
      );
      return res.json({ matches });
    }

    const system =
      "أنت مساعد ذكي لمنصة مفقودات يمنية. مهمتك مطابقة وصف مستخدم مع بلاغات مرشحة وإعطاء درجة تطابق 0-100 لكل بلاغ، مع أسباب قصيرة بالعربية (مثال: نفس المحافظة، وصف مشابه، نفس التصنيف، لون مشابه).";
    const userText = `النوع: ${data.type ?? "غير محدد"}\nالمحافظة: ${data.governorate ?? "غير محدد"}\nالتصنيف: ${data.category ?? "غير محدد"}\nوصف المستخدم:\n${data.description}\n\nالبلاغات المرشحة (JSON):\n${JSON.stringify(data.candidates)}`;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: system + "\n\n" + userText }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              matches: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    score: { type: "NUMBER" },
                    reasons: { type: "ARRAY", items: { type: "STRING" } },
                  },
                  required: ["id", "score", "reasons"],
                },
              },
            },
            required: ["matches"],
          },
        },
      });

      if (!result.text) {
        const matches = fallbackSearchMatching(
          data.description,
          data.candidates,
          data.governorate,
          data.category,
        );
        return res.json({ matches });
      }

      const parsed = JSON.parse(result.text) as { matches: AiMatch[] };
      const matches = (parsed.matches ?? [])
        .map((m) => ({
          id: m.id,
          score: Math.max(0, Math.min(100, Math.round(m.score))),
          reasons: (m.reasons ?? []).slice(0, 4),
        }))
        .sort((a, b) => b.score - a.score);

      return res.json({ matches });
    } catch (geminiError: unknown) {
      console.warn("Gemini Search failed, falling back to heuristic search:", geminiError);
      const matches = fallbackSearchMatching(
        data.description,
        data.candidates,
        data.governorate,
        data.category,
      );
      return res.json({ matches });
    }
  } catch (error: unknown) {
    console.error("AI Search Error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "Internal Server Error", details: errMessage });
  }
});

const extractAiSchema = z.object({
  description: z.string().min(5).max(3000),
  type: z.enum(["lost", "found"]).optional(),
  categories: z.array(z.object({ slug: z.string(), name_ar: z.string() })).optional(),
  governorates: z.array(z.object({ name_ar: z.string() })).optional(),
});

export type ExtractedReport = {
  title: string;
  category_slug: string | null;
  color: string | null;
  governorate_name: string | null;
  district_name: string | null;
  location_text: string | null;
  incident_date: string | null;
  brand: string | null;
  keywords: string[];
  notes: string | null;
};

// Heuristic fallback extractor for when Gemini is unavailable or key is invalid
function fallbackHeuristicExtraction(
  description: string,
  type?: "lost" | "found",
): ExtractedReport {
  const words = description.trim().split(/\s+/);
  const title = words.slice(0, 7).join(" ");

  // Common Yemen Governorates
  const GOVERNORATES = [
    "أمانة العاصمة",
    "صنعاء",
    "عدن",
    "تعز",
    "إب",
    "الحديدة",
    "ذمار",
    "حضرموت",
    "مأرب",
    "صعدة",
    "حجة",
    "المهرة",
    "شبوة",
    "أبين",
    "لحج",
    "الضالع",
    "عمران",
    "البيضاء",
    "ريمة",
    "الجوف",
    "سقطرى",
    "المحويت",
  ];
  let foundGov: string | null = null;
  for (const gov of GOVERNORATES) {
    if (description.includes(gov)) {
      foundGov = gov;
      break;
    }
  }

  // Common Categories
  let foundCat: string | null = null;
  const lower = description.toLowerCase();
  if (
    lower.includes("جوال") ||
    lower.includes("تلفون") ||
    lower.includes("هاتف") ||
    lower.includes("ايفون") ||
    lower.includes("سامسونج") ||
    lower.includes("لابتوب")
  ) {
    foundCat = "electronics";
  } else if (
    lower.includes("محفظة") ||
    lower.includes("شنطة") ||
    lower.includes("حقيبة") ||
    lower.includes("بوك")
  ) {
    foundCat = "wallets-bags";
  } else if (
    lower.includes("بطاقة") ||
    lower.includes("جواز") ||
    lower.includes("رخصة") ||
    lower.includes("وثيقة") ||
    lower.includes("شهادة")
  ) {
    foundCat = "documents";
  } else if (
    lower.includes("مفتاح") ||
    lower.includes("مفاتيح") ||
    lower.includes("سويتش") ||
    lower.includes("ريموت")
  ) {
    foundCat = "keys";
  } else if (
    lower.includes("ذهب") ||
    lower.includes("ساعة") ||
    lower.includes("خاتم") ||
    lower.includes("سلس") ||
    lower.includes("مجوهرات")
  ) {
    foundCat = "jewelry-watches";
  } else if (
    lower.includes("سيارة") ||
    lower.includes("دراجة") ||
    lower.includes("متر") ||
    lower.includes("باص")
  ) {
    foundCat = "vehicles";
  }

  // Common colors
  const COLORS = [
    "أسود",
    "أبيض",
    "أحمر",
    "أزرق",
    "كحلي",
    "بني",
    "فضي",
    "ذهبي",
    "رمادي",
    "رصاصي",
    "أخضر",
    "بيج",
  ];
  let foundColor: string | null = null;
  for (const col of COLORS) {
    if (description.includes(col)) {
      foundColor = col;
      break;
    }
  }

  const keywords = words
    .map((w) => w.replace(/[.,،!?/\\()]/g, "").trim())
    .filter(
      (w) => w.length >= 3 && !["الذي", "التي", "هذا", "هذه", "في", "على", "من", "إلى"].includes(w),
    )
    .slice(0, 6);

  return {
    title: title || (type === "lost" ? "بلاغ مفقود جديد" : "بلاغ معثور عليه جديد"),
    category_slug: foundCat,
    color: foundColor,
    governorate_name: foundGov,
    district_name: null,
    location_text: null,
    incident_date: new Date().toISOString().split("T")[0],
    brand: null,
    keywords,
    notes: null,
  };
}

router.post("/extract", async (req, res) => {
  try {
    const data = extractAiSchema.parse(req.body);
    const ai = getGeminiClient();

    if (!ai) {
      const extracted = fallbackHeuristicExtraction(data.description, data.type);
      return res.json({ extracted, fallback: true });
    }

    const system = `أنت مساعد ذكي لمنصة "مفقوداتي" في اليمن.
مهمتك استخراج حقول منظمة من نص حر كتبه مستخدم يبلغ عن مفقود أو معثور عليه.
قواعد الاستخراج:
1. title: عنوان مختصر وجذاب باللغة العربية (3-7 كلمات) مثل: "جوال سامسونج A52 أسود مفقود في شميلة".
2. category_slug: اختر الأنسب من هذه القائمة بدقة (electronics, documents, wallets-bags, keys, jewelry-watches, pets, vehicles, clothes-accessories, other).
3. color: اللون الأساسي إن وجد (مثل: أسود، فضي، كحلي).
4. governorate_name: المحافظة اليمنية إن ذُكرت (صنعاء، عدن، تعز، إب، حضرموت، الحديدة، ذمار، مأرب، شبوة، حجة، البيضاء، صعدة، لحج، أبين، المهرة، عمران، الضالع، ريمة، المحويت، سقطرى، الجوف).
5. district_name: المديرية إن ذُكرت (مثل: التحرير، المعلا، القاهرة، المكلا، الحوك، الصافية، السبعين، كريتر).
6. location_text: تفاصيل المكان المحدد (مثل: شارع حدة أمام مول الكميم، فرزة تعز، جولة الرويشان).
7. incident_date: تاريخ الفقدان/العثور بصيغة YYYY-MM-DD إن أمكن تحديده، وإلا null.
8. brand: الماركة أو العلامة التجارية (مثل: Samsung, Apple, Toyota, Toyota Hilux, Al-Kuraimi).
9. keywords: مصفوفة كلمات مفتاحية للبحث (3-8 كلمات).
10. notes: علامات فارقة أو أرقام تسلسلية إن وجدت.`;

    const userContent = `نوع البلاغ: ${data.type ?? "غير محدد"}\nالنص:\n${data.description}`;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: system + "\n\n" + userContent }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              category_slug: { type: "STRING" },
              color: { type: "STRING" },
              governorate_name: { type: "STRING" },
              district_name: { type: "STRING" },
              location_text: { type: "STRING" },
              incident_date: { type: "STRING" },
              brand: { type: "STRING" },
              keywords: { type: "ARRAY", items: { type: "STRING" } },
              notes: { type: "STRING" },
            },
            required: ["title", "keywords"],
          },
        },
      });

      if (!result.text) {
        const extracted = fallbackHeuristicExtraction(data.description, data.type);
        return res.json({ extracted, fallback: true });
      }

      const parsed = JSON.parse(result.text) as Partial<ExtractedReport>;
      const extracted: ExtractedReport = {
        title: parsed.title ?? "",
        category_slug: parsed.category_slug ?? null,
        color: parsed.color ?? null,
        governorate_name: parsed.governorate_name ?? null,
        district_name: parsed.district_name ?? null,
        location_text: parsed.location_text ?? null,
        incident_date: parsed.incident_date ?? null,
        brand: parsed.brand ?? null,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
        notes: parsed.notes ?? null,
      };

      return res.json({ extracted });
    } catch (geminiError: unknown) {
      console.warn("Gemini extraction failed, using heuristic extraction fallback:", geminiError);
      const extracted = fallbackHeuristicExtraction(data.description, data.type);
      return res.json({ extracted, fallback: true });
    }
  } catch (error: unknown) {
    console.error("AI Extraction Error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "Internal Server Error", details: errMessage });
  }
});

export default router;
