import { createServiceClient } from '@/lib/supabase/server';
import { TableauxAdminPanel } from '@/components/admin/TableauxAdminPanel';

export default async function AdminTableauxPage() {
  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tableaux } = await (svc as any)
    .from('tableaux')
    .select('id, title, artist, thumbnail, price_eur, formats, images, available, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return <TableauxAdminPanel initialTableaux={tableaux ?? []} />;
}
