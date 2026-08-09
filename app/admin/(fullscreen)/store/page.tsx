import { getAdminSession } from '@/lib/auth';
import { getShopById } from '@/lib/shops';
import StorePageClient from './StorePageClient';

export default async function Page() {
  const session = await getAdminSession();
  const shop = session ? await getShopById(session.shop_id).catch(() => null) : null;
  return (
    <StorePageClient
      shopName={shop?.nom ?? ''}
      userName={session?.nom ?? ''}
      userRole={session?.role ?? ''}
    />
  );
}
