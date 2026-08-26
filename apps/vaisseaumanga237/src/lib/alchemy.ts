// Vérifie qu'un wallet détient le NFT requis du contrat configuré.
// Appelé uniquement côté serveur — ALCHEMY_API_KEY n'est jamais exposé client.
// Utilise getNFTsForOwner (endpoint stable NFT API v3) pour les deux cas :
// token spécifique (NFT_REQUIRED_TOKEN_ID défini) ou n'importe quel token de la collection.
export async function checkNftOwnership(walletAddress: string): Promise<boolean> {
  const apiKey          = process.env.ALCHEMY_API_KEY!;
  const contract        = process.env.NFT_CONTRACT_ADDRESS!;
  const requiredTokenId = process.env.NFT_REQUIRED_TOKEN_ID;

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
    throw new Error(`Alchemy API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { ownedNfts?: { tokenId: string }[] };
  const owned = data.ownedNfts ?? [];

  if (requiredTokenId) {
    return owned.some(nft => nft.tokenId === requiredTokenId);
  }

  return owned.length > 0;
}
