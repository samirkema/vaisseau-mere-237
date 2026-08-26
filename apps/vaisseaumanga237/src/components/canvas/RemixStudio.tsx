'use client';
import { useState, useEffect, useRef } from 'react';
import { useCanvas, type CanvasState } from './useCanvas';
import { DrawingCanvas } from './DrawingCanvas';
import { Toolbar } from './Toolbar';
import type { RemixData } from './RemixClientPage';

interface Tableau {
  id:        string;
  title:     string;
  thumbnail: string;
}

interface Props {
  tableaux:  Tableau[];
  onCreated: (remix: RemixData) => void;
}

const DEFAULT_STATE: CanvasState = { tool: 'pen', color: '#000000', brushSize: 5 };

export function RemixStudio({ tableaux, onCreated }: Props) {
  const {
    canvasRef, startDraw, draw, endDraw, undo, clear, getBlob,
    canUndo, zoom, resetZoom, hasDrawnRef, loadPhoto, photoLoading,
  } = useCanvas();
  const [toolState, setToolState] = useState<CanvasState>(DEFAULT_STATE);
  const [photoId,   setPhotoId]   = useState(tableaux[0]?.id ?? '');
  const [sharing,   setSharing]   = useState(false);
  const [msg,       setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const mountedRef  = useRef(false);

  // Charge la photo sur le canvas à chaque changement de sélection
  useEffect(() => {
    if (!photoId) return;
    const tableau = tableaux.find(t => t.id === photoId);
    if (!tableau) return;

    if (!mountedRef.current) {
      // Premier rendu — attendre que le canvas soit monté
      const timer = setTimeout(() => { loadPhoto(tableau.thumbnail); }, 50);
      mountedRef.current = true;
      return () => clearTimeout(timer);
    }
    loadPhoto(tableau.thumbnail);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  async function share() {
    if (!photoId) {
      setMsg({ ok: false, text: 'Sélectionnez une photo à remixer.' });
      return;
    }
    if (!hasDrawnRef.current) {
      setMsg({ ok: false, text: 'Dessinez quelque chose avant de partager.' });
      return;
    }
    setSharing(true);
    setMsg(null);

    const blob = await getBlob();
    if (!blob) {
      setMsg({ ok: false, text: 'Erreur lors de la lecture du canvas.' });
      setSharing(false);
      return;
    }

    const form = new FormData();
    form.set('file',    new File([blob], 'remix.png', { type: 'image/png' }));
    form.set('photoId', photoId);

    const res  = await fetch('/api/remixes', { method: 'POST', body: form });
    const json = await res.json() as { remix?: RemixData; error?: string };

    if (!res.ok || !json.remix) {
      setMsg({ ok: false, text: json.error ?? 'Erreur lors du partage.' });
      setSharing(false);
      return;
    }

    setMsg({ ok: true, text: 'Remix partagé !' });
    setSharing(false);
    onCreated(json.remix);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Sélecteur de photo */}
      {tableaux.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>
            Photo source
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {tableaux.map(t => (
              <button
                key={t.id}
                onClick={() => setPhotoId(t.id)}
                aria-pressed={photoId === t.id}
                style={{
                  background: photoId === t.id ? 'rgba(249,115,22,0.08)' : '#0a0a0a',
                  border: `2px solid ${photoId === t.id ? '#f97316' : '#1a1a1a'}`,
                  borderRadius: '12px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'border-color 0.15s, background 0.15s',
                  outline: 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.thumbnail}
                  alt={t.title}
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                />
                <span style={{
                  fontSize: '0.68rem',
                  color: photoId === t.id ? '#f97316' : '#555',
                  maxWidth: '72px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: photoId === t.id ? 700 : 400,
                }}>
                  {t.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <DrawingCanvas
        canvasRef={canvasRef}
        state={toolState}
        zoom={zoom}
        loading={photoLoading}
        onStart={e => startDraw(e, toolState)}
        onMove={e  => draw(e, toolState)}
        onEnd={endDraw}
      />

      {/* Barre d'outils */}
      <Toolbar
        state={toolState}
        canUndo={canUndo}
        zoom={zoom}
        onChange={setToolState}
        onUndo={undo}
        onClear={clear}
        onShare={share}
        sharing={sharing}
        onZoomReset={resetZoom}
      />

      {msg && (
        <p role="status" style={{ fontSize: '0.85rem', color: msg.ok ? '#4ade80' : '#f87171', textAlign: 'center' }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
