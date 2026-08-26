'use client';
import { useRef, useState, useCallback, useEffect } from 'react';

export type Tool = 'pen' | 'eraser';

export interface CanvasState {
  tool:      Tool;
  color:     string;
  brushSize: number;
}

export function useCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const historyRef   = useRef<ImageData[]>([]);
  const hasDrawnRef  = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [zoom, setZoom]       = useState(1);
  const [photoLoading, setPhotoLoading] = useState(false);

  function getCtx(): CanvasRenderingContext2D | null {
    return canvasRef.current?.getContext('2d') ?? null;
  }

  function saveSnapshot() {
    const c = canvasRef.current;
    const g = getCtx();
    if (!c || !g) return;
    historyRef.current.push(g.getImageData(0, 0, c.width, c.height));
    if (historyRef.current.length > 50) historyRef.current.shift();
    setCanUndo(true);
  }

  function eventPos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    c: HTMLCanvasElement,
  ): { x: number; y: number } {
    const rect   = c.getBoundingClientRect();
    const scaleX = c.width  / rect.width;
    const scaleY = c.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function applyStyle(g: CanvasRenderingContext2D, s: CanvasState) {
    g.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
    g.strokeStyle = s.tool === 'eraser' ? 'rgba(0,0,0,1)' : s.color;
    g.lineWidth   = s.brushSize;
    g.lineCap     = 'round';
    g.lineJoin    = 'round';
  }

  const loadPhoto = useCallback((src: string) => {
    const c = canvasRef.current;
    const g = getCtx();
    if (!c || !g || !src) return;

    setPhotoLoading(true);
    historyRef.current = [];
    hasDrawnRef.current = false;
    setCanUndo(false);

    const img = new Image();
    img.onload = () => {
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, c.width, c.height);

      // Cover : remplit le canvas en gardant les proportions
      const scaleW = c.width  / img.width;
      const scaleH = c.height / img.height;
      const scale  = Math.max(scaleW, scaleH);
      const x = (c.width  - img.width  * scale) / 2;
      const y = (c.height - img.height * scale) / 2;
      g.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Premier état de l'historique = photo chargée (undo ne peut pas effacer la photo)
      historyRef.current.push(g.getImageData(0, 0, c.width, c.height));
      setPhotoLoading(false);
    };
    img.onerror = () => {
      // Fond blanc si l'image échoue
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, c.width, c.height);
      setPhotoLoading(false);
    };
    img.src = src;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDraw = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    s: CanvasState,
  ) => {
    const c = canvasRef.current;
    const g = getCtx();
    if (!c || !g) return;
    saveSnapshot();
    hasDrawnRef.current = true;
    isDrawingRef.current = true;
    const { x, y } = eventPos(e, c);
    applyStyle(g, s);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y);
    g.stroke();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    s: CanvasState,
  ) => {
    if (!isDrawingRef.current) return;
    const c = canvasRef.current;
    const g = getCtx();
    if (!c || !g) return;
    const { x, y } = eventPos(e, c);
    applyStyle(g, s);
    g.lineTo(x, y);
    g.stroke();
  }, []);

  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
    getCtx()?.beginPath();
  }, []);

  const undo = useCallback(() => {
    const c = canvasRef.current;
    const g = getCtx();
    if (!c || !g || historyRef.current.length === 0) return;
    g.putImageData(historyRef.current.pop()!, 0, 0);
    setCanUndo(historyRef.current.length > 0);
  }, []);

  const clear = useCallback(() => {
    const c = canvasRef.current;
    const g = getCtx();
    if (!c || !g) return;
    saveSnapshot();
    hasDrawnRef.current = false;
    // Recharger la photo depuis l'historique (premier snapshot = photo)
    if (historyRef.current.length > 0) {
      const base = historyRef.current[0];
      g.putImageData(base, 0, 0);
      historyRef.current = [base];
    } else {
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, c.width, c.height);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBlob = (): Promise<Blob | null> =>
    new Promise(resolve => canvasRef.current?.toBlob(resolve, 'image/png'));

  const resetZoom = useCallback(() => setZoom(1), []);

  // Listener non-passif pour permettre e.preventDefault() sur la roulette
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(prev => {
        const next = prev + (e.deltaY < 0 ? 0.1 : -0.1);
        return parseFloat(Math.min(3, Math.max(0.5, next)).toFixed(1));
      });
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef, startDraw, draw, endDraw, undo, clear, getBlob,
    canUndo, zoom, resetZoom, hasDrawnRef, loadPhoto, photoLoading,
  };
}
