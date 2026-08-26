import { createServiceClient } from '@/lib/supabase/server';
import { MangaAdminPanel } from '@/components/admin/MangaAdminPanel';

export default async function AdminMangaPage() {
  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: works } = await (svc as any)
    .from('manga_works')
    .select('id, title, kind, language, published, views_count, cover_url, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return <MangaAdminPanel initialWorks={works ?? []} />;
}
