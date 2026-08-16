import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { ReportGrid, EmptyState } from "@/components/reports/ReportCard";
import { reportsQuery } from "@/lib/queries";
import { Loader2 } from "lucide-react";

function FoundPage() {
  const { data, isLoading } = useQuery(reportsQuery({ type: "found", sort: "newest" }));
  return (
    <PageShell title="المعثورات" subtitle="ممتلكات وجدها آخرون - قد تكون لك!">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : data && data.length > 0 ? (
        <ReportGrid reports={data as never} />
      ) : (
        <EmptyState />
      )}
    </PageShell>
  );
}

export const Route = createFileRoute("/found")({
  head: () => ({ meta: [{ title: "المعثورات | مفقوداتي" }] }),
  component: FoundPage,
});
