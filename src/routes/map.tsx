import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { GoogleMapView } from "@/components/map/GoogleMapView";
import { reportsQuery, governoratesQuery, categoriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "الخريطة التفاعلية | مفقوداتي" }] }),
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(reportsQuery({ limit: 100 })),
      queryClient.ensureQueryData(governoratesQuery),
      queryClient.ensureQueryData(categoriesQuery),
    ]);
  },
  component: MapPage,
});

function MapPage() {
  const { data: reports } = useSuspenseQuery(reportsQuery({ limit: 100 }));
  const { data: governorates } = useSuspenseQuery(governoratesQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);

  return (
    <PageShell
      title="الخريطة التفاعلية للمفقودات والمعثورات"
      subtitle="تصفح مواقع البلاغات في مختلف محافظات الجمهورية اليمنية عبر خرائط Google Maps Platform"
    >
      <GoogleMapView reports={reports} governorates={governorates} categories={categories} />
    </PageShell>
  );
}
