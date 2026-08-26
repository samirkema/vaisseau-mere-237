'use client';
import { type RefObject } from 'react';
import type { CanvasState } from './useCanvas';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  state:     CanvasState;
  zoom:      number;
  loading:   boolean;
  onStart:   (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  onMove:    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  onEnd:     () => void;
}

export function DrawingCanvas({ canvasRef, state, zoom, loading, onStart, onMove, onEnd }: Props) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #1a1a1a', background: '#050505' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        aria-label="Canvas de dessin — roulette souris pour zoomer"
        tabIndex={0}
        style={{
          width: '100%',
          display: 'block',
          touchAction: 'none',
          background: '#fff',
          aspectRatio: '4/3',
          maxHeight: '60vh',
          cursor: loading ? 'wait' : state.tool === 'eraser' ? 'cell' : 'crosshair',
          ...(zoom !== 1 && {
            transform:       `scale(${zoom})`,
            transformOrigin: 'top left',
          }),
        }}
        onMouseDown={loading ? undefined : onStart}
        onMouseMove={loading ? undefined : onMove}
        onMouseUp={loading ? undefined : onEnd}
        onMouseLeave={loading ? undefined : onEnd}
        onTouchStart={loading ? undefined : onStart}
        onTouchMove={loading ? undefined : onMove}
        onTouchEnd={loading ? undefined : onEnd}
      />
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '12px',
        }}>
          <span style={{ color: '#f97316', fontSize: '0.85rem', letterSpacing: '2px', fontFamily: "'Segoe UI', sans-serif" }}>
            Chargement…
          </span>
        </div>
      )}
    </div>
  );
}
