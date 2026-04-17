import { getAdminSession } from "@/lib/auth";
import AdminTopBar from "@/components/admin/AdminTopBar";
import OrderNotifier from "@/components/admin/OrderNotifier";

export default async function FullscreenLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminTopBar nom={session.nom} role={session.role} />
      <main className="min-h-screen pt-14 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <OrderNotifier />
    </div>
  );
}
