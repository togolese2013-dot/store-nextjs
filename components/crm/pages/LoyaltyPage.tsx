import React from 'react';
import { PageHead } from '../primitives';
import { AwardIcon, PlusIcon, CogIcon } from '../icons';
import styles from '../Crm.module.css';

export default function LoyaltyPage() {
  return (
    <>
      <PageHead
        eyebrow="CRM · Fidélité" title="Programme de" serif="fidélité"
        sub="Configurez un programme de points et de récompenses pour vos clients"
      >
        <button type="button" className={styles.btn}><CogIcon size={14} /> Configurer</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><PlusIcon /> Récompense</button>
      </PageHead>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(200,150,42,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AwardIcon size={28} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Programme de fidélité non configuré</div>
        <div style={{ fontSize: 14, color: 'var(--muted-2)', maxWidth: 380 }}>
          Créez des niveaux (Bronze, Argent, Or…) et attribuez des points à vos clients pour les fidéliser.
        </div>
        <button type="button" className={`${styles.btn} ${styles.pri}`} style={{ marginTop: 8 }}>
          <PlusIcon /> Créer un programme
        </button>
      </div>
    </>
  );
}
