import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /api/reading-progress — upsert la position de lecture de l'utilisateur.
// Appelé par le client MangaReader avec debounce 1s.
export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { workId, pageNumber } = body as Record<string, unknown>;

  if (
    typeof workId !== 'string'   || !UUID_RE.test(workId) ||
    typeof pageNumber !== 'number' || !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 10_000
  ) {
    return Response.json({ error: 'Paramètres invalides' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Cast nécessaire : nos types manuels ne permettent pas au client Supabase
  // d'inférer correctement le type d'upsert pour reading_progress.
  // Résolu lors de l'exécution de `supabase gen types typescript`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('reading_progress') as any).upsert(
    {
      user_id:    user.id,
      work_id:    workId,
      page_number: pageNumber,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,work_id' },
  );

  if (error) {
    return Response.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
