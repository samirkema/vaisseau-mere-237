import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const profile = await getProfile();
  const svc = createServiceClient();

  const [usersRes, nftRes, publishedRes, worksRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'nft'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }).eq('published', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('views_count').eq('published', true),
  ]);

  const totalViews = (worksRes.data ?? []).reduce(
    (sum: number, w: { views_count: number }) => sum + (w.views_count ?? 0), 0,
  );

  const stats = [
    { label: 'Mangas publiés',    value: (publishedRes.count ?? 0).toLocaleString('fr-FR'), href: '/admin/manga' },
    { label: 'Vues totales manga', value: totalViews.toLocaleString('fr-FR'),                href: '/admin/analytics' },
    { label: 'Utilisateurs',      value: (usersRes.count     ?? 0).toLocaleString('fr-FR'), href: '/admin/users' },
    { label: 'Détenteurs NFT',    value: (nftRes.count       ?? 0).toLocaleString('fr-FR'), href: '/admin/users' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Administration</h1>
      <p className="text-gray-500 text-sm mb-8">
        Connecté en tant que <strong>{profile?.pseudo}</strong> — rôle : <span className="uppercase text-orange-600 font-semibold">{profile?.role}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-400 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
