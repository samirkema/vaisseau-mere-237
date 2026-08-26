import { createServiceClient } from '@/lib/supabase/server';

export default async function AdminAnalyticsPage() {
  const svc = createServiceClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalUsersRes, freeRes, subscriberRes, nftRes,
    totalWorksRes, publishedRes,
    revenueRes, topWorksRes, recentPaymentsRes,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'free'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'subscriber'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'nft'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }).eq('published', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('payments').select('amount').eq('status', 'completed').gte('created_at', startOfMonth.toISOString()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('id, title, kind, views_count').eq('published', true).order('views_count', { ascending: false }).limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('payments').select('id, amount, currency, method, status, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstErr = ([totalUsersRes, freeRes, subscriberRes, nftRes, totalWorksRes, publishedRes, revenueRes, topWorksRes, recentPaymentsRes] as any[]).find(r => r.error);
  if (firstErr) throw new Error(`Erreur DB analytics : ${firstErr.error.message}`);

  const revenueThisMonth = (revenueRes.data ?? []).reduce(
    (sum: number, p: { amount: number }) => sum + (p.amount ?? 0), 0,
  );

  const topWorks: { id: string; title: string; kind: string; views_count: number }[] = topWorksRes.data ?? [];
  const recentPayments: { id: string; amount: number; currency: string; method: string; status: string; created_at: string }[] = recentPaymentsRes.data ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Utilisateurs */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Utilisateurs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',    value: totalUsersRes.count ?? 0 },
            { label: 'Gratuit', value: freeRes.count        ?? 0 },
            { label: 'Abonnés', value: subscriberRes.count  ?? 0 },
            { label: 'NFT',     value: nftRes.count         ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{value.toLocaleString('fr')}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Catalogue + Revenus */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Catalogue & Revenus</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Œuvres publiées', value: `${publishedRes.count ?? 0} / ${totalWorksRes.count ?? 0}` },
            { label: 'Revenus (mois)',  value: `${revenueThisMonth.toFixed(2)} €` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top œuvres */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Top œuvres (vues)</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Titre</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Vues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topWorks.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">Aucune donnée</td></tr>
              )}
              {topWorks.map((w, i) => (
                <tr key={w.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{i + 1}. {w.title}</td>
                  <td className="px-4 py-2 text-gray-500 capitalize">{w.kind}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{w.views_count.toLocaleString('fr')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Derniers paiements */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Derniers paiements</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Méthode</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Statut</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPayments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">Aucun paiement</td></tr>
              )}
              {recentPayments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString('fr')}
                  </td>
                  <td className="px-4 py-2 text-gray-700 capitalize">{p.method}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700'
                      : p.status === 'failed'   ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                    {p.amount.toFixed(2)} {p.currency.toUpperCase()}
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
