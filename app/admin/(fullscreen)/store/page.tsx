'use client';
import { useRouter } from 'next/navigation';
import StoreDataLoader from '@/components/store/StoreDataLoader';

export default function Page() {
  const router = useRouter();
  return (
    <StoreDataLoader
      onSwitchWorkspace={() => router.push('/admin')}
    />
  );
}
