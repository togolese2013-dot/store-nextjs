'use client';

import { useRouter } from 'next/navigation';
import Crm from '@/components/crm/Crm';

interface Props {
  shopName: string;
  userName: string;
  userRole: string;
}

export default function CrmClient({ shopName, userName, userRole }: Props) {
  const router = useRouter();

  return (
    <Crm
      shopName={shopName}
      userName={userName}
      userRole={userRole}
      onBack={() => router.push('/admin')}
    />
  );
}
