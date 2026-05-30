import { getAdminSession } from '@/lib/auth';
import { getShopById } from '@/lib/shops';
import MagasinPageClient from './MagasinPageClient';

export default async function MagasinPage() {
  const session = await getAdminSession();
  const shop = session ? await getShopById(session.shop_id).catch(() => null) : null;
  return (
    <MagasinPageClient
      shopName={shop?.nom ?? ''}
      userName={session?.nom ?? ''}
      userRole={session?.role ?? ''}
    />
  );
}
