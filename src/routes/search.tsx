import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { ReportGrid, EmptyState } from "@/components/reports/ReportCard";
import { reportsQuery, categoriesQuery, governoratesQuery } from "@/lib/queries";
import { Search as SearchIcon, Loader2, Gift } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "البحث | مفقوداتي" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<"" | "lost" | "found">("");
  const [catId, setCatId] = useState<number | "">("");
  const [govId, setGovId] = useState<number | "">("");
  const [onlyRewards, setOnlyRewards] = useState(false);
  const [filter, setFilter] = useState<{
    keyword?: string;
    type?: "lost" | "found";
    category_id?: number;
    governorate_id?: number;
  }>({});
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: govs = [] } = useQuery(governoratesQuery);
  const { data, isLoading } = useQuery(reportsQuery(filter));

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({
      keyword: keyword || undefined,
      type: type || undefined,
      category_id: typeof catId === "number" ? catId : undefined,
      governorate_id: typeof govId === "number" ? govId : undefined,
    });
  };

  const filteredData = (data ?? []).filter((r: any) => {
    if (onlyRewards && (!r.reward_amount || Number(r.reward_amount) <= 0)) {
      return false;
    }
    return true;
  });

  return (
    <PageShell title="البحث الذكي" subtitle="ابحث في جميع بلاغات المفقودات والمعثورات">
      <form
        onSubmit={apply}
        className="card-soft max-w-4xl mx-auto rounded-2xl p-4 space-y-3"
      >
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3">
            <SearchIcon className="size-4 text-primary" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ابحث باسم الغرض أو الكلمات المفتاحية..."
              className="flex-1 bg-transparent text-sm outline-none py-2.5"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "" | "lost" | "found")}
            className="input"
          >
            <option value="">الكل</option>
            <option value="lost">مفقود</option>
            <option value="found">معثور</option>
          </select>
          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value ? Number(e.target.value) : "")}
            className="input"
          >
            <option value="">التصنيف</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
          <select
            value={govId}
            onChange={(e) => setGovId(e.target.value ? Number(e.target.value) : "")}
            className="input"
          >
            <option value="">المحافظة</option>
            {govs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name_ar}
              </option>
            ))}
          </select>
          <button className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-bold">بحث</button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border/60">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-primary-dark select-none">
            <input
              type="checkbox"
              checked={onlyRewards}
              onChange={(e) => setOnlyRewards(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary size-4"
            />
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Gift className="size-3.5" /> عرض البلاغات التي تتضمن مكافأة مالية فقط
            </span>
          </label>
        </div>
      </form>
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : filteredData.length > 0 ? (
          <ReportGrid reports={filteredData as never} />
        ) : (
          <EmptyState />
        )}
      </div>
    </PageShell>
  );
}
