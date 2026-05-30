import { getAdminSession } from '@/lib/auth';
import { getShopById } from '@/lib/shops';
import AdminWsPageClient from './AdminWsPageClient';

export default async function AdminWsPage() {
  const session = await getAdminSession();
  const shop = session ? await getShopById(session.shop_id).catch(() => null) : null;
  return (
    <AdminWsPageClient
      shopName={shop?.nom ?? ''}
      userName={session?.nom ?? ''}
      userRole={session?.role ?? ''}
    />
  );
}
