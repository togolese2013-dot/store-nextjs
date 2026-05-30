import { getAdminSession } from '@/lib/auth';
import { getShopById } from '@/lib/shops';
import BoutiquePageClient from './BoutiquePageClient';

export default async function BoutiquePage() {
  const session = await getAdminSession();
  const shop = session ? await getShopById(session.shop_id).catch(() => null) : null;
  return (
    <BoutiquePageClient
      shopName={shop?.nom ?? ''}
      userName={session?.nom ?? ''}
      userRole={session?.role ?? ''}
    />
  );
}
