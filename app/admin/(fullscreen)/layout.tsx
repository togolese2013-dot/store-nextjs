import { getAdminSession } from "@/lib/auth";
import OrderNotifier from "@/components/admin/OrderNotifier";

export default async function FullscreenLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) return <>{children}</>;

  return (
    <>
      {children}
      <OrderNotifier />
    </>
  );
}
