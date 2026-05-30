'use client';
import { useRouter } from 'next/navigation';
import AdminWsDataLoader from '@/components/admin-ws/AdminWsDataLoader';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function AdminWsPageClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();
  return (
    <AdminWsDataLoader
      shopName={shopName}
      userName={userName}
      userRole={userRole}
      onSwitchWorkspace={() => router.push('/admin')}
      onInvite={() => router.push('/admin/users')}
    />
  );
}
