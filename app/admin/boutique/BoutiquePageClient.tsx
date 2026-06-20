'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BoutiqueDataLoader from '@/components/boutique/BoutiqueDataLoader';
import NewSaleModal, { type SaleConfirmPayload } from '@/components/admin/NewSaleModal';
import { SaleConfirmation } from '@/components/boutique/SaleConfirmation';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function BoutiquePageClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();
  const [saleOpen,  setSaleOpen]  = useState(false);
  const [lastSale,  setLastSale]  = useState<SaleConfirmPayload | null>(null);

  const handleSubmitted = useCallback((payload?: SaleConfirmPayload) => {
    if (payload) setLastSale(payload);
  }, []);

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
        onSubmitted={handleSubmitted}
      />
      <SaleConfirmation
        sale={lastSale}
        onDismiss={() => setLastSale(null)}
      />
    </>
  );
}
