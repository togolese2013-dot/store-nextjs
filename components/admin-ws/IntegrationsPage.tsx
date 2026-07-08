/**
 * IntegrationsPage — real connections only.
 * WhatsApp Business is the only genuine, connectable integration in this app
 * (backend/lib/whatsapp.ts already reads wa_phone_number_id/wa_access_token
 * per shop). Wave/Orange Money/DHL/Mailchimp/QuickBooks were mock cards with
 * zero backend behind them — removed rather than left as decorative fiction.
 */
'use client';
import React, { useEffect, useState } from 'react';
import styles from './Admin.module.css';
import { useT } from '@/lib/i18n/use-admin-ws-lang';

interface WhatsAppStatus {
  connected: boolean;
  phone_number_id: string | null;
}

export default function IntegrationsPage() {
  const t = useT();
  const [wa, setWa] = useState<WhatsAppStatus | null>(null);
  const [form, setForm] = useState(false);
  const [phoneId, setPhoneId] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    fetch('/api/admin/integrations', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setWa(d.whatsapp); })
      .catch(() => {});
  };

  useEffect(load, []);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const connect = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/integrations/whatsapp', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number_id: phoneId, access_token: token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t('integrations.wa.error_generic')); return; }
      setForm(false); setPhoneId(''); setToken('');
      flash(t('integrations.wa.connected_toast'));
      load();
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    await fetch('/api/admin/integrations/whatsapp', { method: 'DELETE', credentials: 'include' });
    flash(t('integrations.wa.disconnected_toast'));
    load();
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>{t('integrations.eyebrow')}</div>
          <h1 className={styles.title}>{t('integrations.title.main')} <span className={styles.serif}>{t('integrations.title.serif')}</span></h1>
          <p className={styles.subtitle}>{t('integrations.subtitle')}</p>
        </div>
      </div>

      <div className={styles.intGrid} style={{ gridTemplateColumns: 'minmax(0,420px)' }}>
        <div className={styles.intCard}>
          <div className={styles.intTop}>
            <div className={styles.intLogo} style={{ background: '#DDEBE2', color: '#2D6A4F' }}>W</div>
            {wa && (
              <span className={styles.status} style={{ color: wa.connected ? 'var(--ok)' : 'var(--muted)' }}>
                <span className={styles.d} style={{ background: wa.connected ? 'var(--ok)' : 'var(--muted-2)' }} />
                {wa.connected ? t('integrations.status.connected') : t('integrations.status.disconnected')}
              </span>
            )}
          </div>
          <div>
            <div className={styles.intName}>WhatsApp Business</div>
            <div className={styles.intCat}>{t('integrations.wa.cat')}</div>
          </div>
          <div className={styles.intDesc}>{t('integrations.wa.desc')}</div>

          {wa?.connected && !form && (
            <div className={styles.intFoot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t('integrations.wa.phone_id_label')} : <code style={{ fontFamily: 'Geist Mono, monospace' }}>{wa.phone_number_id}</code>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={styles.btn} onClick={() => setForm(true)}>{t('integrations.wa.edit_btn')}</button>
                <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={disconnect}>{t('integrations.wa.disconnect_btn')}</button>
              </div>
            </div>
          )}

          {!wa?.connected && !form && (
            <div className={styles.intFoot}>
              <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setForm(true)}>
                {t('integrations.wa.connect_btn')}
              </button>
            </div>
          )}

          {form && (
            <div className={styles.intFoot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('integrations.wa.phone_id_label')}</label>
                <input className={styles.settingsInput} value={phoneId} onChange={e => setPhoneId(e.target.value)}
                  placeholder="1234567890123456" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('integrations.wa.token_label')}</label>
                <input className={styles.settingsInput} type="password" value={token} onChange={e => setToken(e.target.value)}
                  placeholder="EAAG..." style={{ width: '100%', fontFamily: '"Geist Mono", monospace' }} />
              </div>
              {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={styles.btn} onClick={() => { setForm(false); setError(''); }}>{t('common.cancel')}</button>
                <button type="button" className={`${styles.btn} ${styles.primary}`} disabled={saving} onClick={connect}>
                  {saving ? t('integrations.wa.testing') : t('integrations.wa.save_btn')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 300, padding: '11px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 11, fontSize: 13, fontWeight: 500 }}>
          {toast}
        </div>
      )}
    </>
  );
}
