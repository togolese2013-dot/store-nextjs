'use client';

import { useEffect, useState } from 'react';
import BoutiqueSettings from './settings/BoutiqueSettings';
import type { StoreState } from './settings/types';

interface Props {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  shopName?: string;
  userName?: string;
  userRole?: string;
}

export default function SettingsPage({ onBack, onNavigate, shopName, userName, userRole }: Props) {
  const [initialState, setInitialState] = useState<Partial<StoreState> | undefined>(undefined);

  useEffect(() => {
    fetch('/api/admin/boutique/settings')
      .then(r => r.json())
      .then((data: Record<string, Partial<StoreState>>) => {
        const merged: Partial<StoreState> = {};
        for (const v of Object.values(data)) Object.assign(merged, v);
        if (shopName) merged.nom = shopName;
        setInitialState(merged);
      })
      .catch(() => {
        if (shopName) setInitialState({ nom: shopName });
      });
  }, [shopName]);

  async function handleSave(section: string, state: StoreState) {
    try {
      await fetch('/api/admin/boutique/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, state }),
      });
    } catch {
      // toast already shown by BoutiqueSettings
    }
  }

  return (
    <BoutiqueSettings
      onBack={onBack}
      onNavigate={onNavigate}
      onSave={handleSave}
      initialState={initialState}
      shopName={shopName}
      userName={userName}
      userRole={userRole}
    />
  );
}
