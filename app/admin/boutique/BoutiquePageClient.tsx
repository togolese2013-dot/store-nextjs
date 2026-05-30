'use client';
import { useRouter } from 'next/navigation';
import BoutiqueDataLoader from '@/components/boutique/BoutiqueDataLoader';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function BoutiquePageClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();
  return (
    <BoutiqueDataLoader
      shopName={shopName}
      userName={userName}
      userRole={userRole}
      onSwitchWorkspace={() => router.push('/admin')}
      onNewSale={() => router.push('/admin/ventes')}
    />
  );
}
