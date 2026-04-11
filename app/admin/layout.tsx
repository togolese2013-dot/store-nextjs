import { getAdminSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import OrderNotifier from "@/components/admin/OrderNotifier";

export const metadata = { title: { template: "%s — Admin", default: "Admin — Togolese Shop" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  /* No session = login page (middleware already handles redirecting other pages) */
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar nom={session.nom} role={session.role} />
      <div className="lg:pl-60 xl:pl-64 pt-14 lg:pt-0">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {/* Real-time order notifications (SSE) */}
      <OrderNotifier />
    </div>
  );
}
