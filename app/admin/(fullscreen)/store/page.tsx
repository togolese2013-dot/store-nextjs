'use client';
import { useRouter } from 'next/navigation';
import StoreShell from '@/components/store/StoreShell';

export default function Page() {
  const router = useRouter();
  return (
    <StoreShell
      onSwitchWorkspace={() => router.push('/admin')}
      onCreateOrder={() => router.push('/admin/orders/new')}
    />
  );
}
