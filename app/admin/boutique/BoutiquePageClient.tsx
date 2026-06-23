'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BoutiqueDataLoader from '@/components/boutique/BoutiqueDataLoader';
import NewSaleModal, { type SaleConfirmPayload } from '@/components/admin/NewSaleModal';
import { SaleConfirmation } from '@/components/boutique/SaleConfirmation';
import { AdminSSEProvider } from '@/components/admin/useAdminSSE';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function BoutiquePageClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();
  const [saleOpen,  setSaleOpen]  = useState(false);
  const [lastSale,  setLastSale]  = useState<SaleConfirmPayload | null>(null);
  const refreshFacturesRef = useRef<(() => void) | null>(null);

  const handleSubmitted = useCallback((payload?: SaleConfirmPayload) => {
    if (payload) setLastSale(payload);
    refreshFacturesRef.current?.();
  }, []);

  return (
    <AdminSSEProvider>
      <BoutiqueDataLoader
        shopName={shopName}
        userName={userName}
        userRole={userRole}
        onSwitchWorkspace={() => router.push('/admin')}
        onNewSale={() => setSaleOpen(true)}
        onRequestTransfer={() => router.push('/admin/magasin')}
        refreshRef={refreshFacturesRef}
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
    </AdminSSEProvider>
  );
}
