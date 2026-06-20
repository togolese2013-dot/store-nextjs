'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BoutiqueDataLoader from '@/components/boutique/BoutiqueDataLoader';
import NewSaleModal from '@/components/admin/NewSaleModal';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function BoutiquePageClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();
  const [saleOpen, setSaleOpen] = useState(false);
  return (
    <>
      <BoutiqueDataLoader
        shopName={shopName}
        userName={userName}
        userRole={userRole}
        onSwitchWorkspace={() => router.push('/admin')}
        onNewSale={() => setSaleOpen(true)}
        onRequestTransfer={() => router.push('/admin/magasin')}
      />
      <NewSaleModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
      />
    </>
  );
}
