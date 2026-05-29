'use client';
import { useRouter } from 'next/navigation';
import AdminWsShell from '@/components/admin-ws/AdminWsShell';

export default function Page() {
  const router = useRouter();
  return (
    <AdminWsShell
      onSwitchWorkspace={() => router.push('/admin')}
      onInvite={() => router.push('/admin/users')}
    />
  );
}
