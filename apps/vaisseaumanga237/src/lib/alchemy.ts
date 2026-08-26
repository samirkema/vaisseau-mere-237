// Vérifie qu'un wallet détient le NFT requis du contrat configuré.
// Appelé uniquement côté serveur — ALCHEMY_API_KEY n'est jamais exposé client.
// Utilise getNFTsForOwner (endpoint stable NFT API v3) pour les deux cas :
// token spécifique (NFT_REQUIRED_TOKEN_ID défini) ou n'importe quel token de la collection.
export async function checkNftOwnership(walletAddress: string): Promise<boolean> {
  const apiKey          = process.env.ALCHEMY_API_KEY;
  const contract        = process.env.NFT_CONTRACT_ADDRESS;
  const requiredTokenId = process.env.NFT_REQUIRED_TOKEN_ID;

  // Échec explicite plutôt qu'une URL contenant "undefined" : sans contrat
  // valide, Alchemy pourrait répondre sur l'ensemble des NFT du wallet et
  // transformer ce contrôle en simple « possède au moins un NFT ».
  if (!apiKey || !contract) {
    throw new Error(
      'Configuration NFT incomplète : ALCHEMY_API_KEY et NFT_CONTRACT_ADDRESS sont requis',
    );
  }

  const url = new URL(
    `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`,
  );
  url.searchParams.set('owner', walletAddress);
  url.searchParams.append('contractAddresses[]', contract);
  url.searchParams.set('withMetadata', 'false');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    // Le corps de réponse n'est pas repris : il peut réfléchir l'URL appelée,
    // qui contient ALCHEMY_API_KEY, et finirait alors dans les journaux.
    throw new Error(`Alchemy API error ${res.status}`);
  }

  const data = (await res.json()) as { ownedNfts?: { tokenId: string }[] };
  const owned = data.ownedNfts ?? [];

  if (requiredTokenId) {
    return owned.some(nft => nft.tokenId === requiredTokenId);
  }

  return owned.length > 0;
}
