// Niveau 2 de sécurité : Server Component vérifie l'abonnement indépendamment du proxy.
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { isNftHolder } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { WorkCard } from '@/components/catalogue/WorkCard';
import type { MangaKind, Database } from '@/lib/supabase/types';

export const metadata = { title: 'Catalogue Manga — Vaisseau Manga 237' };

type WorkRow = Pick<
  Database['public']['Tables']['manga_works']['Row'],
  'id' | 'title' | 'description' | 'cover_url' | 'kind' | 'views_count'
>;

const KIND_TABS: { kind: MangaKind | 'all'; label: string }[] = [
  { kind: 'all',           label: 'Tout' },
  { kind: 'manga',         label: 'Mangas' },
  { kind: 'webtoon',       label: 'Webtoons' },
  { kind: 'bd',            label: 'BD' },
  { kind: 'artbook', label: 'Artbooks' },
];

export default async function MangaPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const profile = await getProfile();
  if (!profile || !isNftHolder(profile.subscription_tier)) {
    redirect('/compte');
  }

  const { kind: kindParam } = await searchParams;
  const activeKind = KIND_TABS.map((t) => t.kind).includes(kindParam as MangaKind)
    ? (kindParam as MangaKind)
    : 'all';

  const supabase = await createClient();

  let query = supabase
    .from('manga_works')
    .select('id, title, description, cover_url, kind, views_count')
    .eq('published', true)
    .order('views_count', { ascending: false });

  if (activeKind !== 'all') {
    query = query.eq('kind', activeKind) as typeof query;
  }

  const { data: rawWorks, error } = await query;
  if (error) console.error('[MangaPage] Supabase error:', error.message);
  const works = (rawWorks ?? []) as WorkRow[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catalogue</h1>

      {/* Tabs par catégorie */}
      <nav aria-label="Filtrer par catégorie" className="flex gap-2 mb-8 flex-wrap">
        {KIND_TABS.map(({ kind, label }) => {
          const isActive = kind === activeKind;
          return (
            <Link
              key={kind}
              href={kind === 'all' ? '/manga' : `/manga?kind=${kind}`}
              aria-current={isActive ? 'page' : undefined}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {works.length === 0 ? (
        <p className="text-gray-400 text-center py-20">Aucune œuvre disponible pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  );
}
