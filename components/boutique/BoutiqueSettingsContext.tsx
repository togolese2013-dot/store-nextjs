'use client';

import React, { createContext, useContext } from 'react';
import type { StoreState } from './settings/types';

export interface BoutiqueConfig {
  symbol:       string;   // e.g. 'FCFA'
  symPos:       string;   // 'Avant' | 'Après'
  sep1k:        string;   // 'Espace' | 'Point' | 'Virgule'
  sepDec:       string;   // 'Virgule' | 'Point'
  decimales:    number;
  seuilGlobal:  number;
  bloquerVente: boolean;
  payMethods:   string[]; // ['especes', 'wave', ...]
  tvaActive:    boolean;
  tvaTaux:      number;
}

export function buildConfig(s: Partial<StoreState>): BoutiqueConfig {
  return {
    symbol:      s.symbole    ?? 'FCFA',
    symPos:      s.symPos     ?? 'Après',
    sep1k:       s.sep1k      ?? 'Espace',
    sepDec:      s.sepDec     ?? 'Virgule',
    decimales:   parseInt(s.decimales    ?? '0', 10) || 0,
    seuilGlobal: parseInt(s.seuil_global ?? '5', 10) || 5,
    bloquerVente: s.bloquer_vente ?? false,
    payMethods: [
      s.pay_especes !== false ? 'especes'  : null,
      s.pay_wave              ? 'wave'     : null,
      s.pay_orange            ? 'orange'   : null,
      s.pay_moov              ? 'moov'     : null,
      s.pay_mixx              ? 'mixx'     : null,
      s.pay_carte             ? 'carte'    : null,
      s.pay_virement          ? 'virement' : null,
    ].filter(Boolean) as string[],
    tvaActive: s.tva_active ?? false,
    tvaTaux:   parseFloat(s.tva_taux ?? '0') || 0,
  };
}

export function fmtNum(amount: number, cfg: BoutiqueConfig): string {
  const sep = cfg.sep1k === 'Point' ? '.' : cfg.sep1k === 'Virgule' ? ',' : ' ';
  const sdec = cfg.sepDec === 'Point' ? '.' : ',';
  const rounded = Math.round(Math.abs(amount));
  let str = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  if (cfg.decimales > 0) str += sdec + '00';
  return amount < 0 ? '-' + str : str;
}

export function fmtAmount(amount: number, cfg: BoutiqueConfig): string {
  const num = fmtNum(amount, cfg);
  return cfg.symPos === 'Avant' ? `${cfg.symbol} ${num}` : `${num} ${cfg.symbol}`;
}

interface CtxVal { cfg: BoutiqueConfig; refresh: () => void; }
const DEFAULT_CFG = buildConfig({});
const Ctx = createContext<CtxVal>({ cfg: DEFAULT_CFG, refresh: () => {} });

export function BoutiqueSettingsProvider({
  cfg, refresh, children,
}: { cfg: BoutiqueConfig; refresh: () => void; children: React.ReactNode }) {
  return <Ctx.Provider value={{ cfg, refresh }}>{children}</Ctx.Provider>;
}

export function useBoutiqueConfig(): BoutiqueConfig {
  return useContext(Ctx).cfg;
}

export function useRefreshBoutiqueSettings(): () => void {
  return useContext(Ctx).refresh;
}
