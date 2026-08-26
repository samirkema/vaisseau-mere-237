import { createServiceClient } from '@/lib/supabase/server';

export default async function AdminAnalyticsPage() {
  const svc = createServiceClient();

  const [
    totalUsersRes, freeRes, nftRes,
    totalWorksRes, publishedRes,
    mangaKindRes, webtoonKindRes, bdKindRes,
    topWorksRes, recentUsersRes,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'free'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'nft'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }).eq('published', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }).eq('kind', 'manga').eq('published', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }).eq('kind', 'webtoon').eq('published', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }).eq('kind', 'bd').eq('published', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('id, title, kind, views_count').eq('published', true).order('views_count', { ascending: false }).limit(10),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('id, pseudo, subscription_tier, wallet_address, created_at').order('created_at', { ascending: false }).limit(8),
  ]);

  const topWorks: { id: string; title: string; kind: string; views_count: number }[] = topWorksRes.data ?? [];
  const recentUsers: { id: string; pseudo: string; subscription_tier: string; wallet_address: string | null; created_at: string }[] = recentUsersRes.data ?? [];

  const totalViews = topWorks.reduce((acc, w) => acc + (w.views_count || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Plateforme</h1>
        <p className="text-gray-500 text-sm mt-1">
          Statistiques d&apos;audience, catalogue manga et engagement des utilisateurs.
        </p>
      </div>

      {/* SECTION UTILISATEURS */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Audience & Utilisateurs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Utilisateurs inscrits', value: (totalUsersRes.count ?? 0).toLocaleString('fr-FR'), color: 'text-gray-900' },
            { label: 'Comptes Gratuits',       value: (freeRes.count       ?? 0).toLocaleString('fr-FR'), color: 'text-gray-600' },
            { label: 'Détenteurs NFT (VIP)',   value: (nftRes.count        ?? 0).toLocaleString('fr-FR'), color: 'text-orange-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION CATALOGUE MANGA */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Catalogue Manga & Vues</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Œuvres publiées', value: `${publishedRes.count ?? 0} / ${totalWorksRes.count ?? 0}` },
            { label: 'Mangas',          value: (mangaKindRes.count   ?? 0).toString() },
            { label: 'Webtoons',        value: (webtoonKindRes.count ?? 0).toString() },
            { label: 'Bandes Dessinées', value: (bdKindRes.count      ?? 0).toString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION TOP ŒUVRES */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Top Œuvres Manga (Par nombre de lectures)</h2>
          <span className="text-xs text-gray-400">Total vues cumulées top : {totalViews.toLocaleString('fr-FR')}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rang & Titre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Format</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Lectures / Vues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topWorks.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">Aucune œuvre enregistrée</td></tr>
              )}
              {topWorks.map((w, i) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span className="text-orange-500 font-bold mr-2">#{i + 1}</span> {w.title}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 font-medium">
                      {w.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {(w.views_count ?? 0).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION DERNIERS UTILISATEURS */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Dernières Inscriptions</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Pseudo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Accès NFT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Wallet</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Date d&apos;inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentUsers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">Aucun utilisateur</td></tr>
              )}
              {recentUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.pseudo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      u.subscription_tier === 'nft'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.subscription_tier === 'nft' ? 'NFT Actif' : 'Gratuit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {u.wallet_address ? `${u.wallet_address.slice(0, 6)}…${u.wallet_address.slice(-4)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
