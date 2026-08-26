import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ImageGallery } from '@/components/galerie/ImageGallery';
import { TableauCheckout } from '@/components/galerie/TableauCheckout';

export const metadata = { title: 'Galerie — Vaisseau Manga 237' };

export default async function GalerieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Requête ciblée : 1 ligne au lieu de toute la table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw } = await (supabase as any)
    .from('tableaux')
    .select('id, title, thumbnail, main_image, price_eur, formats, images, created_at')
    .eq('id', id)
    .eq('available', true)
    .single();

  if (!raw) notFound();

  type FormatEntry = { label: string; price_eur: number };
  type TableauRow = { id: string; title: string; thumbnail: string; main_image: string; price_eur: number | null; formats: FormatEntry[] | null; images: string[] | null; created_at: string };
  const row = raw as TableauRow;

  // thumbnail / main_image peut être une URL complète ou un path storage
  function resolveStorageUrl(val: string) {
    return val.startsWith('http')
      ? val
      : supabase.storage.from('tableaux').getPublicUrl(val).data.publicUrl;
  }

  const thumbnailUrl = resolveStorageUrl(row.thumbnail);
  const mainImageUrl = resolveStorageUrl(row.main_image);
  const imgSrc       = mainImageUrl || thumbnailUrl;

  const formats: FormatEntry[] = Array.isArray(row.formats) && row.formats.length > 0
    ? row.formats
    : [];

  // Toutes les images dans l'ordre : principale d'abord, puis supplémentaires
  const extraImages: string[] = Array.isArray(row.images)
    ? (row.images as string[]).map(resolveStorageUrl).filter(Boolean)
    : [];
  const allImages = [imgSrc, ...extraImages];

  const tableau = { ...row, thumbnail: thumbnailUrl, main_image: mainImageUrl };

  // Navigation prev/next : 2 requêtes légères (id + title uniquement)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prevRes, nextRes] = await Promise.all([
    (supabase as any).from('tableaux').select('id, title').eq('available', true)
      .lt('created_at', row.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    (supabase as any).from('tableaux').select('id, title').eq('available', true)
      .gt('created_at', row.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle(),
  ]);

  const prev = prevRes.data as { id: string; title: string } | null;
  const next = nextRes.data as { id: string; title: string } | null;

  return (
    <>
      <style>{`
        .order-btn:hover { background: rgba(249,115,22,0.15) !important; border-color: rgba(249,115,22,0.6) !important; }
        .nav-btn:hover { border-color: rgba(249,115,22,0.3) !important; color: #f97316 !important; }
      `}</style>

      <div style={{ background: '#000', minHeight: '100vh', padding: '40px 20px 80px', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <Link href="/galerie" style={{ color: '#444', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block', marginBottom: '32px' }}>
            ← Retour à la galerie
          </Link>

          {/* GALERIE D'IMAGES */}
          <div style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a',
            borderRadius: '18px', overflow: 'hidden', marginBottom: '24px',
          }}>
            <ImageGallery images={allImages} title={tableau.title} />
          </div>

          {/* INFOS + COMMANDE */}
          <div style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a',
            borderRadius: '18px', padding: '28px', marginBottom: '24px',
          }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '3px', color: '#fff', margin: '0 0 20px' }}>
              {tableau.title.toUpperCase()}
            </h1>

            {formats.length === 0 && tableau.price_eur != null ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '24px' }}>
                <span style={{ color: '#555' }}>Prix</span>
                <span style={{ color: '#f97316', fontWeight: 700 }}>À partir de {tableau.price_eur} €</span>
              </div>
            ) : null}

            <TableauCheckout
              tableauId={tableau.id}
              formats={formats}
              priceEur={tableau.price_eur ?? null}
            />
          </div>

          {/* NAVIGATION */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {prev ? (
              <Link href={`/galerie/${prev.id}`} className="nav-btn" style={{
                flex: 1, textAlign: 'center',
                background: '#0a0a0a', border: '1px solid #1a1a1a',
                borderRadius: '10px', padding: '12px',
                color: '#555', fontSize: '0.8rem', textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s',
              }}>
                ← {prev.title}
              </Link>
            ) : <div style={{ flex: 1 }} />}
            {next ? (
              <Link href={`/galerie/${next.id}`} className="nav-btn" style={{
                flex: 1, textAlign: 'center',
                background: '#0a0a0a', border: '1px solid #1a1a1a',
                borderRadius: '10px', padding: '12px',
                color: '#555', fontSize: '0.8rem', textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s',
              }}>
                {next.title} →
              </Link>
            ) : <div style={{ flex: 1 }} />}
          </div>

        </div>
      </div>
    </>
  );
}
