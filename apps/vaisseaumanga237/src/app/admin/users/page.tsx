import { getProfile } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { UsersAdminPanel } from '@/components/admin/UsersAdminPanel';

export default async function AdminUsersPage() {
  const [profile, svc] = [await getProfile(), createServiceClient()];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users, count } = await (svc as any)
    .from('profiles')
    .select(
      'id, pseudo, role, subscription_tier, subscription_expires_at, wallet_address, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <UsersAdminPanel
      initialUsers={users ?? []}
      total={count ?? 0}
      isSuperAdmin={profile?.role === 'superadmin'}
    />
  );
}
