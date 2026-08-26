'use client';
import type { CanvasState, Tool } from './useCanvas';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
] as const;

const SIZES = [2, 5, 10, 20] as const;

interface Props {
  state:       CanvasState;
  canUndo:     boolean;
  zoom:        number;
  onChange:    (s: CanvasState) => void;
  onUndo:      () => void;
  onClear:     () => void;
  onShare:     () => void;
  sharing:     boolean;
  onZoomReset: () => void;
}

const sep = <div style={{ width: '1px', height: '24px', background: '#222', flexShrink: 0 }} aria-hidden="true" />;

export function Toolbar({ state, canUndo, zoom, onChange, onUndo, onClear, onShare, sharing, onZoomReset }: Props) {
  const patch = (p: Partial<CanvasState>) => onChange({ ...state, ...p });

  const btnBase: React.CSSProperties = {
    background: '#111',
    border: '1px solid #222',
    color: '#aaa',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
    fontFamily: 'inherit',
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: 'rgba(249,115,22,0.12)',
    border: '1px solid rgba(249,115,22,0.5)',
    color: '#f97316',
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '10px',
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '12px',
      padding: '12px 16px',
    }}>

      {/* Outil */}
      <div style={{ display: 'flex', gap: '6px' }} role="group" aria-label="Outil de dessin">
        {(['pen', 'eraser'] as Tool[]).map(t => (
          <button
            key={t}
            onClick={() => patch({ tool: t })}
            aria-pressed={state.tool === t}
            style={state.tool === t ? btnActive : btnBase}
          >
            {t === 'pen' ? '✏️ Crayon' : '◻ Gomme'}
          </button>
        ))}
      </div>

      {sep}

      {/* Couleurs */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} role="group" aria-label="Couleur">
        {COLORS.map(c => (
          <button
            key={c}
            title={c}
            onClick={() => patch({ color: c, tool: 'pen' })}
            aria-pressed={state.color === c && state.tool === 'pen'}
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: c,
              border: state.color === c && state.tool === 'pen'
                ? '2px solid #f97316'
                : '2px solid #333',
              cursor: 'pointer',
              transform: state.color === c && state.tool === 'pen' ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.12s, border-color 0.12s',
              flexShrink: 0,
              outline: 'none',
            }}
          />
        ))}
      </div>

      {sep}

      {/* Taille */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} role="group" aria-label="Taille du pinceau">
        {SIZES.map(s => (
          <button
            key={s}
            onClick={() => patch({ brushSize: s })}
            title={`${s}px`}
            aria-pressed={state.brushSize === s}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: state.brushSize === s ? 'rgba(249,115,22,0.12)' : '#111',
              border: `1px solid ${state.brushSize === s ? 'rgba(249,115,22,0.4)' : '#222'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.12s, border-color 0.12s',
              outline: 'none',
            }}
          >
            <span
              style={{
                display: 'block',
                borderRadius: '50%',
                background: '#fff',
                width: Math.min(s * 1.6, 20),
                height: Math.min(s * 1.6, 20),
              }}
            />
          </button>
        ))}
      </div>

      {sep}

      {/* Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.72rem', color: '#444', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(zoom * 100)}%
        </span>
        {zoom !== 1 && (
          <button onClick={onZoomReset} title="Réinitialiser le zoom" style={btnBase}>
            1:1
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{ ...btnBase, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'not-allowed' }}
        >
          ↩ Annuler
        </button>
        <button onClick={onClear} style={btnBase}>
          Effacer
        </button>
        <button
          onClick={onShare}
          disabled={sharing}
          style={{
            ...btnBase,
            background: sharing ? '#111' : 'rgba(249,115,22,0.12)',
            border: '1px solid rgba(249,115,22,0.4)',
            color: '#f97316',
            fontWeight: 700,
            opacity: sharing ? 0.6 : 1,
            cursor: sharing ? 'not-allowed' : 'pointer',
          }}
        >
          {sharing ? 'Partage…' : '↑ Partager'}
        </button>
      </div>

    </div>
  );
}
