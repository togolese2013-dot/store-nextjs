'use client';

import { useRouter } from 'next/navigation';
import Crm from '@/components/crm/Crm';
import type { CrmPageId } from '@/components/crm/types';

export default function CrmPage() {
  const router = useRouter();

  return (
    <Crm
      onBack={() => router.push('/admin')}
      onPageChange={(p: CrmPageId) => router.push(`/admin/crm#${p}`)}
    />
  );
}
