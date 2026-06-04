import { getAdminSession } from '@/lib/auth';
import { getShopById } from '@/lib/shops';
import CrmClient from './CrmClient';

export default async function CrmPage() {
  const session = await getAdminSession();
  const shop = session ? await getShopById(session.shop_id) : null;

  return (
    <CrmClient
      shopName={shop?.nom ?? 'Mon Shop'}
      userName={session?.nom ?? 'Admin'}
      userRole={session?.role ?? 'Administrateur'}
    />
  );
}
