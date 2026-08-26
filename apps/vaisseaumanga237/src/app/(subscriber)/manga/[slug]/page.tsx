// Niveau 2 de sécurité : Server Component vérifie l'abonnement avant de générer
// les URLs signées. Les images du bucket privé ne quittent jamais le serveur
// sans que l'abonnement soit confirmé ici.
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProfile } from '@/lib/auth';
import { isNftHolder } from '@/lib/roles';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getMangaPageUrl } from '@/lib/supabase/storage';
import { MangaReader } from '@/components/manga/MangaReader';
import type { DisplayConfig } from '@/lib/supabase/types';
import { ResumePromptWrapper } from '@/components/manga/ResumePromptWrapper';
import type { Database } from '@/lib/supabase/types';

type WorkRow     = Database['public']['Tables']['manga_works']['Row'];
type PageRow     = Database['public']['Tables']['manga_pages']['Row'];
type ProgressRow = Database['public']['Tables']['reading_progress']['Row'];

// Types locaux pour les casts post-requête (contournement du type inference partiel)
type WorkSelect     = Pick<WorkRow,     'id' | 'title' | 'kind' | 'published' | 'display_config'>;
type PageSelect     = Pick<PageRow,     'page_number' | 'image_url'>;
type ProgressSelect = Pick<ProgressRow, 'page_number'>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: workId } = await params;
  const supabase = await createClient();
  const res = await (supabase
    .from('manga_works')
    .select('title')
    .eq('id', workId)
    .eq('published', true)
    .single() as unknown as Promise<{ data: Pick<WorkRow, 'title'> | null; error: unknown }>);
  return { title: res.data ? `${res.data.title} — Vaisseau Manga 237` : 'Lecteur — Vaisseau Manga 237' };
}

export default async function MangaReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: workId } = await params;

  // ── Garde niveau 2 ────────────────────────────────────────────────────────
  const profile = await getProfile();
  if (!profile || !isNftHolder(profile.subscription_tier)) {
    redirect('/compte');
  }

  const supabase = await createClient();

  // Casts explicites sur chaque résultat : le client Supabase ne peut pas inférer
  // le type depuis un select partiel avec nos types manuels (résolu via `supabase gen types`).
  type WorkRes     = { data: WorkSelect     | null; error: { message: string } | null };
  type PagesRes    = { data: PageSelect[]   | null; error: { message: string } | null };
  type ProgressRes = { data: ProgressSelect | null; error: { message: string } | null };

  const [rawWork, rawPages, rawProgress] = await Promise.all([
    supabase.from('manga_works').select('id, title, kind, published, display_config').eq('id', workId).eq('published', true).single(),
    supabase.from('manga_pages').select('page_number, image_url').eq('work_id', workId).order('page_number', { ascending: true }),
    supabase.from('reading_progress').select('page_number').eq('work_id', workId).eq('user_id', profile.id).maybeSingle(),
  ]);

  const workRes     = rawWork     as unknown as WorkRes;
  const pagesRes    = rawPages    as unknown as PagesRes;
  const progressRes = rawProgress as unknown as ProgressRes;

  if (workRes.error || !workRes.data) notFound();

  const work      = workRes.data;
  const pages     = pagesRes.data ?? [];
  const savedPage = progressRes.data?.page_number ?? 1;

  if (!pages.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Aucune page disponible pour cette œuvre.</p>
        <Link href="/manga" className="text-indigo-600 hover:underline">← Retour au catalogue</Link>
      </div>
    );
  }

  // ── URLs signées — générées côté serveur, bucket privé, expiration 1h ─────
  const signedUrls = await Promise.all(
    pages.map((p) => getMangaPageUrl(p.image_url)),
  );

  // ── Incrément atomique du compteur de vues (fire & forget) ────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  void Promise.resolve((createServiceClient() as any)
    .rpc('increment_views_count', { work_id: workId }))
    .catch(() => {});

  const hasProgress = savedPage > 1;

  return (
    <>
      <div className="bg-gray-900 text-gray-300 px-4 py-2 text-sm flex items-center gap-3">
        <Link href="/manga" className="hover:text-white transition-colors" aria-label="Retour au catalogue">
          ← Catalogue
        </Link>
        <span className="text-gray-600" aria-hidden="true">/</span>
        <span className="text-white font-medium truncate">{work.title}</span>
      </div>

      {hasProgress && (
        <ResumePromptWrapper savedPage={savedPage} total={pages.length} title={work.title} />
      )}

      <MangaReader
        pages={signedUrls}
        kind={work.kind}
        workId={workId}
        initialPage={hasProgress ? savedPage : 1}
        title={work.title}
        displayConfig={work.display_config as DisplayConfig | null}
      />
    </>
  );
}
