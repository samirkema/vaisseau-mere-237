import { createServiceClient } from './server';

// Génère une URL signée pour une page manga (bucket privé, expiration 1h).
// À appeler côté serveur uniquement, après vérification de l'abonnement.
export async function getMangaPageUrl(path: string): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from('manga')
    .createSignedUrl(path, 3600);

  if (error || !data) {
    throw new Error(`URL signée manga indisponible : ${error?.message ?? 'erreur inconnue'}`);
  }
  return data.signedUrl;
}

export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const supabase = createServiceClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
