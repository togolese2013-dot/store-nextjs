'use client';
import { useRouter } from 'next/navigation';
import StoreDataLoader from '@/components/store/StoreDataLoader';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function StorePageClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();
  return (
    <StoreDataLoader
      shopName={shopName}
      userName={userName}
      userRole={userRole}
      onSwitchWorkspace={() => router.push('/admin')}
    />
  );
}
