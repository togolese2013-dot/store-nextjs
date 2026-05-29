'use client';
import { useRouter } from 'next/navigation';
import BoutiqueShell from '@/components/boutique/BoutiqueShell';

export default function Page() {
  const router = useRouter();
  return (
    <BoutiqueShell
      onSwitchWorkspace={() => router.push('/admin')}
      onNewSale={() => router.push('/admin/ventes')}
    />
  );
}
