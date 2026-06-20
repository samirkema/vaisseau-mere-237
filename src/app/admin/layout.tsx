import { requireRole } from '@/lib/auth';
import { Sidebar } from '@/components/admin/Sidebar';

export const metadata = { title: 'Administration — Otaku Shop' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Double vérification serveur (le proxy filtre déjà, mais on vérifie aussi ici)
  await requireRole('admin');

  return (
    <div className="flex min-h-screen admin-layout">
      <Sidebar />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
