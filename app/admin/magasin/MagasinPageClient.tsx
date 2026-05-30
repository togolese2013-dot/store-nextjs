'use client';
import { useRouter } from 'next/navigation';
import MagasinDataLoader from '@/components/magasin/MagasinDataLoader';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function MagasinPageClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();
  return (
    <MagasinDataLoader
      shopName={shopName}
      userName={userName}
      userRole={userRole}
      onSwitchWorkspace={() => router.push('/admin')}
      onCreateProduct={() => router.push('/admin/magasin/nouveau')}
    />
  );
}
