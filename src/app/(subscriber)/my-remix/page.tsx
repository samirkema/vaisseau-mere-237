// Niveau 2 de sécurité : Server Component vérifie l'abonnement indépendamment du proxy.
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { isNftHolder } from '@/lib/roles';
import { createServiceClient } from '@/lib/supabase/server';
import { RemixClientPage, type RemixData } from '@/components/canvas/RemixClientPage';

export const metadata = { title: 'My Remix — Otaku Shop Studio' };

const STATIC_BASES = [
  { id: 'static-1', title: 'Mosquée au Caire',     thumbnail: '/remix-bases/1000044869.jpg' },
  { id: 'static-2', title: 'Remix #4',             thumbnail: '/remix-bases/IMG_1389.jpg' },
  { id: 'static-3', title: 'Théâtre à Dunhuang',   thumbnail: '/remix-bases/IMG_2329.jpeg' },
  { id: 'static-4', title: "L'Eau c'est la Vie",   thumbnail: '/remix-bases/Tableau-3-leau.jpg' },
];

export default async function MyRemixPage() {
  const profile = await getProfile();
  if (!profile || !isNftHolder(profile.subscription_tier)) {
    redirect('/compte');
  }

  const svc = createServiceClient();

  const [tableauxRes, remixesRes, votesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from('tableaux')
      .select('id, title, thumbnail')
      .eq('available', true)
      .order('created_at', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from('remixes')
      .select('id, user_id, photo_id, image_path, votes_count, created_at, profiles:user_id(pseudo)')
      .order('votes_count', { ascending: false })
      .limit(50),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from('votes')
      .select('photo_id')
      .eq('voter_id', profile.id),
  ]);

  const dbTableaux = (tableauxRes.data ?? []).map(
    (t: { id: string; title: string; thumbnail: string }) => ({
      id:        t.id,
      title:     t.title,
      thumbnail: svc.storage.from('tableaux').getPublicUrl(t.thumbnail).data.publicUrl,
    }),
  );

  const tableaux = [...STATIC_BASES, ...dbTableaux];

  const initialRemixes: RemixData[] = (remixesRes.data ?? []).map(
    (r: { image_path: string; [key: string]: unknown }) => ({
      ...r,
      image_url: svc.storage.from('remixes').getPublicUrl(r.image_path as string).data.publicUrl,
    }),
  );

  const votedPhotoIds: string[] = (votesRes.data ?? []).map(
    (v: { photo_id: string }) => v.photo_id,
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <p style={{ color: '#333', fontSize: '0.7rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' }}>
          Zone créative · NFT
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '6px',
          color: '#f97316',
          textShadow: '0 0 30px rgba(249,115,22,0.35)',
          margin: '0 0 14px',
        }}>
          MY REMIX
        </h1>
        <div style={{ width: '40px', height: '1px', background: '#f97316', margin: '0 auto 14px', opacity: 0.6 }} />
        <p style={{ color: '#444', fontSize: '0.85rem' }}>
          Dessinez sur nos photos · Soumettez · Votez pour les meilleures créations
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 80px' }}>
        <RemixClientPage
          tableaux={tableaux}
          initialRemixes={initialRemixes}
          votedPhotoIds={votedPhotoIds}
          currentUserId={profile.id}
        />
      </div>
    </div>
  );
}
