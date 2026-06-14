import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SuperAdmin from '@/components/super-admin/SuperAdmin';

export default async function SaasPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'super_admin') redirect('/admin');
  return (
    <SuperAdmin
      userName={session.nom}
      userRole={session.role}
    />
  );
}
