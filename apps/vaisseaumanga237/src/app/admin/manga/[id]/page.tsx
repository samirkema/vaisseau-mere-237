import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import { MangaWorkEditor } from '@/components/admin/MangaWorkEditor';
import type { DisplayConfig } from '@/lib/supabase/types';
import { checkDisplayPermission } from '@/lib/display-guard';

interface Props { params: Promise<{ id: string }> }

export default async function AdminMangaDetailPage({ params }: Props) {
  const { id } = await params;
  const [profile, svc] = [await getProfile(), createServiceClient()];

  const [workRes, pagesRes, permRes, adminsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from('manga_works')
      .select('id, title, description, kind, language, published, cover_url, display_config, created_by')
      .eq('id', id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from('manga_pages')
      .select('id, page_number, image_url')
      .eq('work_id', id)
      .order('page_number', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from('manga_display_permissions')
      .select('id, user_id, granted_by, created_at, profiles:user_id(pseudo)')
      .eq('work_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from('profiles')
      .select('id, pseudo, role')
      .in('role', ['admin', 'superadmin'])
      .order('pseudo'),
  ]);

  if (!workRes.data) notFound();

  type WorkData = {
    id: string; title: string; description: string | null;
    kind: string; language: string; published: boolean;
    cover_url: string | null; display_config: DisplayConfig | null;
    created_by: string | null;
  };
  const work = workRes.data as WorkData;

  // Permission d'affichage : superadmin | admin créateur | admin délégué
  type AdminRow = { id: string; pseudo: string; role: string };

  const rawPerms   = permRes.data ?? [];
  const hasExplicit = rawPerms.some((p: { user_id: string }) => p.user_id === profile?.id);
  const hasDisplayPermission = checkDisplayPermission(
    profile?.role, work.created_by, profile?.id ?? '', hasExplicit,
  );

  // Exclure l'utilisateur courant : de la liste d'octroi ET de la liste affichée
  // (évite l'auto-révocation accidentelle via PermissionsManager)
  const displayPermissions = rawPerms.filter((p: { user_id: string }) => p.user_id !== profile?.id);
  const allAdmins = (adminsRes.data ?? [] as AdminRow[]).filter((a: AdminRow) => a.id !== profile?.id);

  return (
    <MangaWorkEditor
      work={work}
      initialPages={pagesRes.data ?? []}
      initialPermissions={displayPermissions}
      allAdmins={allAdmins}
      hasDisplayPermission={hasDisplayPermission}
    />
  );
}
