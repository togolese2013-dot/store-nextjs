import React from 'react';
import { PageHead } from '../primitives';
import { GiftIcon, CogIcon, CopyIcon } from '../icons';
import styles from '../Crm.module.css';

export default function ReferralPage() {
  return (
    <>
      <PageHead
        eyebrow="CRM · Parrainage" title="Programme de" serif="parrainage"
        sub="Permettez à vos clients de parrainer leurs proches et gagnez de nouveaux acheteurs"
      >
        <button type="button" className={styles.btn}><CopyIcon size={14} /> Lien d'invitation</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><CogIcon size={14} /> Configurer</button>
      </PageHead>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(92,74,136,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GiftIcon size={28} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Programme de parrainage non configuré</div>
        <div style={{ fontSize: 14, color: 'var(--muted-2)', maxWidth: 380 }}>
          Mettez en place un système de parrainage pour que vos clients fidèles recrutent de nouveaux acheteurs.
        </div>
        <button type="button" className={`${styles.btn} ${styles.pri}`} style={{ marginTop: 8 }}>
          <GiftIcon size={14} /> Créer un programme
        </button>
      </div>
    </>
  );
}
