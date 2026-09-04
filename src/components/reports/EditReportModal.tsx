import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Tag,
  Gift,
  ShieldCheck,
  Phone,
  Camera,
  HeartHandshake,
  FileText,
  Save,
} from "lucide-react";
import { api } from "@/client/api/client";
import { governoratesQuery, districtsQuery, categoriesQuery } from "@/lib/queries";
import { ImageUploader, type UploadedImage } from "@/components/reports/ImageUploader";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { Report } from "@/types/models";

interface EditReportModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditReportModal({ report, isOpen, onClose, onUpdated }: EditReportModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [status, setStatus] = useState<"active" | "resolved" | "closed">(
    (report.status as "active" | "resolved" | "closed") || "active"
  );
  const [title, setTitle] = useState(report.title || "");
  const [description, setDescription] = useState(report.description || "");
  const [categoryId, setCategoryId] = useState<number>(report.category_id || 1);
  const [governorateId, setGovernorateId] = useState<number>(report.governorate_id || 1);
  const [districtId, setDistrictId] = useState<number | null>(report.district_id || null);
  const [locationText, setLocationText] = useState(report.location_text || "");
  const [rewardAmount, setRewardAmount] = useState<string>(
    report.reward_amount ? String(report.reward_amount) : ""
  );
  const [contactPreference, setContactPreference] = useState<string>(
    report.contact_preference || "in_app"
  );
  const [notes, setNotes] = useState(report.notes || "");
  const [secretMark, setSecretMark] = useState(report.secret_verification_mark || "");

  // Humanitarian fields
  const [isHumanitarian, setIsHumanitarian] = useState<boolean>(
    Boolean(
      report.is_humanitarian ||
      report.category_id === 9 ||
      report.categories?.slug === "missing-persons"
    )
  );
  const [age, setAge] = useState(report.age || "");
  const [gender, setGender] = useState(report.gender || "");
  const [clothesDescription, setClothesDescription] = useState(report.clothes_description || "");
  const [healthCondition, setHealthCondition] = useState(report.health_condition || "");
  const [emergencyPhone, setEmergencyPhone] = useState(report.emergency_phone || "");

  // Images state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [saving, setSaving] = useState(false);

  // Queries for select dropdowns
  const { data: governorates = [] } = useQuery(governoratesQuery);
  const { data: districts = [] } = useQuery(districtsQuery(governorateId));
  const { data: categories = [] } = useQuery(categoriesQuery);

  // Synchronize state when report changes or modal opens
  useEffect(() => {
    if (isOpen && report) {
      setStatus((report.status as "active" | "resolved" | "closed") || "active");
      setTitle(report.title || "");
      setDescription(report.description || "");
      setCategoryId(report.category_id || 1);
      setGovernorateId(report.governorate_id || 1);
      setDistrictId(report.district_id || null);
      setLocationText(report.location_text || "");
      setRewardAmount(report.reward_amount ? String(report.reward_amount) : "");
      setContactPreference(report.contact_preference || "in_app");
      setNotes(report.notes || "");
      setSecretMark(report.secret_verification_mark || "");
      setIsHumanitarian(
        Boolean(
          report.is_humanitarian ||
          report.category_id === 9 ||
          report.categories?.slug === "missing-persons"
        )
      );
      setAge(report.age || "");
      setGender(report.gender || "");
      setClothesDescription(report.clothes_description || "");
      setHealthCondition(report.health_condition || "");
      setEmergencyPhone(report.emergency_phone || "");

      const currentImgs: UploadedImage[] = (report.report_images || []).map((img, i) => ({
        url: img.url,
        path: `existing-${i}-${img.url}`,
      }));
      setImages(currentImgs);
    }
  }, [isOpen, report]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان البلاغ مطلوب");
      return;
    }
    if (!description.trim()) {
      toast.error("وصف البلاغ مطلوب");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        status,
        category_id: categoryId,
        governorate_id: governorateId,
        district_id: districtId,
        location_text: locationText.trim() || null,
        reward_amount: rewardAmount ? Number(rewardAmount) : null,
        contact_preference: contactPreference,
        notes: notes.trim() || null,
        secret_verification_mark: secretMark.trim() || null,
        is_humanitarian: isHumanitarian || categoryId === 9,
        age: age.trim() || null,
        gender: gender || null,
        clothes_description: clothesDescription.trim() || null,
        health_condition: healthCondition.trim() || null,
        emergency_phone: emergencyPhone.trim() || null,
        images: images.map((img, idx) => ({
          url: img.url,
          public_id: img.path,
          sort_order: idx,
        })),
      };

      await api.patch(`/reports/${report.id}`, payload);

      toast.success("تم تحديث البلاغ بنجاح!");
      qc.invalidateQueries({ queryKey: ["report", report.id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["my-reports"] });
      qc.invalidateQueries({ queryKey: ["emergency-active-reports"] });
      qc.invalidateQueries({ queryKey: ["app-stats"] });

      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Edit report error:", err);
      toast.error("فشل حفظ التعديلات. يرجى المحاولة مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-background border border-border shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">تعديل بيانات البلاغ</h2>
              <p className="text-xs text-muted-foreground">رقم البلاغ: #{report.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* Status Selector with Live Notice */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
              حالة البلاغ الحالية
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { id: "active", label: "نشط (قيد البحث)", icon: AlertCircle, color: "text-amber-600", activeBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700" },
                { id: "resolved", label: "تم العثور عليه", icon: CheckCircle2, color: "text-emerald-600", activeBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700" },
                { id: "closed", label: "مغلق / مؤرشف", icon: X, color: "text-slate-600", activeBg: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as never)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                    status === s.id
                      ? `${s.activeBg} ${s.color} border-2 shadow-xs font-black`
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <s.icon className="size-4 shrink-0" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {status === "resolved" && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  <strong>تهانينا!</strong> بتغيير الحالة إلى «تم العثور عليه»، سيتم وضع علامة النجاح على البلاغ وحجب أرقام الاتصال صوناً لخصوصيتك.
                </span>
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-1.5">
                عنوان البلاغ <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input"
                placeholder="مثال: فقدان محفظة جلدية سوداء أو طفل مفقود..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                التصنيف <span className="text-destructive">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCategoryId(val);
                  if (val === 9) setIsHumanitarian(true);
                }}
                className="input"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                المكافأة التشجيعية (اختياري بالريال)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="0"
                  className="input pe-14"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  ر.ي
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-1.5">
                الوصف التفصيلي <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="input resize-none"
                placeholder="تفاصيل دقيقة تساعد في التعرف على الغرض أو المفقود..."
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-black flex items-center gap-1.5 text-foreground">
              <MapPin className="size-4 text-primary" /> تفاصيل الموقع والمحافظة
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">المحافظة</label>
                <select
                  value={governorateId}
                  onChange={(e) => {
                    setGovernorateId(Number(e.target.value));
                    setDistrictId(null);
                  }}
                  className="input text-xs"
                >
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">المديرية</label>
                <select
                  value={districtId ?? ""}
                  onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : null)}
                  className="input text-xs"
                >
                  <option value="">اختر المديرية (اختياري)</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  الشارع / الحي أو مكان المعالم القريبة
                </label>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="input text-xs"
                  placeholder="مثال: شارع الزبيري - بالقرب من المستشفى الجمهوري"
                />
              </div>
            </div>
          </div>

          {/* Humanitarian Emergency Special Fields */}
          {(isHumanitarian || categoryId === 9) && (
            <div className="rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <HeartHandshake className="size-5" />
                <h3 className="text-sm font-black">بيانات النداء الإنساني والمفقودين</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                تظهر هذه البيانات مباشرة في ملصق البحث وتساعد المجتمع في التعرف على الشخص المفقود.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">العمر التقديري</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="مثال: 7 سنوات أو 65 سنة"
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">الجنس</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="">غير محدد</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    الملابس والمظهر وقت الاختفاء
                  </label>
                  <input
                    type="text"
                    value={clothesDescription}
                    onChange={(e) => setClothesDescription(e.target.value)}
                    placeholder="مثال: ثوب رصاصي وشال أبيض أو قميص أزرق وبنطال جينز..."
                    className="input text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    الحالة الصحية أو النفسية (تنبيه طبي)
                  </label>
                  <input
                    type="text"
                    value={healthCondition}
                    onChange={(e) => setHealthCondition(e.target.value)}
                    placeholder="مثال: يعاني من ضعف ذاكرة / يحتاج دواء سكري يومي..."
                    className="input text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    رقم هاتف الطوارئ المباشر للاتصال بالأسرة
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="مثال: 771234567"
                    className="input text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Verification Security */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-black flex items-center gap-1.5 text-foreground">
              <ShieldCheck className="size-4 text-emerald-600" /> التحقق وخصوصية التواصل
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  تفضيل التواصل
                </label>
                <select
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value)}
                  className="input text-xs"
                >
                  <option value="in_app">عبر رسائل المنصة فقط (الأكثر أماناً)</option>
                  <option value="phone">عبر رقم الهاتف</option>
                  <option value="both">كلاهما (الرسائل ورقم الهاتف)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  العلامة السرية للتحقق (مخفية عن العامة)
                </label>
                <input
                  type="text"
                  value={secretMark}
                  onChange={(e) => setSecretMark(e.target.value)}
                  placeholder="سر أو خدش مميز للتأكد من المعثور عليه"
                  className="input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-black flex items-center gap-1.5 text-foreground">
              <Camera className="size-4 text-primary" /> الصور المرفقة
            </h3>
            {user && (
              <ImageUploader
                userId={user.id}
                value={images}
                onChange={setImages}
                max={5}
              />
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/40 p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary transition disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>حفظ التعديلات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
