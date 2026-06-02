import { getAdminSession } from '@/lib/auth';
import SuperAdmin from '@/components/super-admin/SuperAdmin';

export default async function SaasPage() {
  const session = await getAdminSession();
  return (
    <SuperAdmin
      userName={session?.nom ?? 'Admin'}
      userRole={session?.role ?? 'Super Admin'}
    />
  );
}
