'use client';
import MagasinDataLoader from '@/components/magasin/MagasinDataLoader';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  return (
    <MagasinDataLoader
      onSwitchWorkspace={() => router.push('/admin')}
      onCreateProduct={() => router.push('/admin/magasin/new')}
    />
  );
}
