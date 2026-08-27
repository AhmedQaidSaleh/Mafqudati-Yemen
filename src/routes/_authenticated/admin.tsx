import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "لوحة الإدارة والأمان | مفقوداتي" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  return <AdminDashboard />;
}
