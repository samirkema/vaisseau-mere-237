'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'otaku_cookie_notice_ack';

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9998,
      background: 'rgba(10,10,10,0.97)',
      borderTop: '1px solid rgba(249,115,22,0.3)',
      padding: '16px 20px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    }}>
      <p style={{ color: '#999', fontSize: '0.8rem', maxWidth: '560px', margin: 0, lineHeight: 1.6 }}>
        Ce site utilise uniquement des cookies strictement nécessaires à votre connexion (aucun traceur
        publicitaire ni cookie d&apos;analyse tiers). Détails dans notre{' '}
        <a href="/politique-de-confidentialite" style={{ color: '#f97316' }}>politique de confidentialité</a>.
      </p>
      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: '1.5px solid #f97316',
          color: '#f97316',
          padding: '8px 20px',
          borderRadius: '20px',
          fontWeight: 600,
          fontSize: '0.8rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Compris
      </button>
    </div>
  );
}
