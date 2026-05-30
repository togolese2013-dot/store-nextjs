import { getAdminSession } from '@/lib/auth';
import SaasShell from '@/components/saas/SaasShell';

export const metadata = { title: 'Super-Admin — SaaS' };

export default async function SaasPage() {
  const session = await getAdminSession();
  return <SaasShell userName={session?.nom ?? 'Admin'} />;
}
