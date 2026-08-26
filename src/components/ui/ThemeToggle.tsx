'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('vm237_theme') as 'dark' | 'light') ?? 'dark';
    setTheme(saved);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vm237_theme', next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '20px',
        zIndex: 9999,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '2px solid rgba(249,115,22,0.35)',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
      className="theme-toggle-btn"
    >
      <span className="emoji">{theme === 'dark' ? '☀️' : '🌙'}</span>
      <style>{`
        .theme-toggle-btn:hover {
          border-color: #f97316 !important;
          transform: scale(1.1);
          box-shadow: 0 0 14px rgba(249,115,22,0.3) !important;
        }
      `}</style>
    </button>
  );
}
