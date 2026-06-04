import React from 'react';
import { PageHead } from '../primitives';
import { SendIcon, DownloadIcon } from '../icons';
import styles from '../Crm.module.css';

export default function CampaignsPage() {
  return (
    <>
      <PageHead
        eyebrow="CRM · Campagnes" title="Newsletter &" serif="WhatsApp"
        sub="Créez et envoyez des campagnes Email ou WhatsApp à vos clients"
      >
        <button type="button" className={styles.btn}><DownloadIcon /> Statistiques</button>
        <button type="button" className={`${styles.btn} ${styles.pri}`}><SendIcon size={14} /> Nouvelle campagne</button>
      </PageHead>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59,106,143,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SendIcon size={28} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Aucune campagne</div>
        <div style={{ fontSize: 14, color: 'var(--muted-2)', maxWidth: 380 }}>
          Lancez votre première campagne Email ou WhatsApp pour communiquer avec vos clients directement depuis le CRM.
        </div>
        <button type="button" className={`${styles.btn} ${styles.pri}`} style={{ marginTop: 8 }}>
          <SendIcon size={14} /> Créer une campagne
        </button>
      </div>
    </>
  );
}
