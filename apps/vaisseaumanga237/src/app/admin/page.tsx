import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const profile = await getProfile();
  const svc = createServiceClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [usersRes, publishedRes, revenueRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('profiles').select('*', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('manga_works').select('*', { count: 'exact', head: true }).eq('published', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).from('payments').select('amount').eq('status', 'completed').gte('created_at', startOfMonth.toISOString()),
  ]);

  const revenueThisMonth = (revenueRes.data ?? []).reduce(
    (sum: number, p: { amount: number }) => sum + (p.amount ?? 0), 0,
  );

  const stats = [
    { label: 'Mangas publiés',  value: (publishedRes.count ?? 0).toString(), href: '/admin/manga' },
    { label: 'Utilisateurs',    value: (usersRes.count    ?? 0).toString(), href: '/admin/users' },
    { label: 'Revenus ce mois', value: `${revenueThisMonth.toFixed(2)} €`, href: '/admin/analytics' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">
        Connecté en tant que <strong>{profile?.pseudo}</strong> — rôle : {profile?.role}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, href }) => (
          <Link key={href} href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 transition-colors">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
