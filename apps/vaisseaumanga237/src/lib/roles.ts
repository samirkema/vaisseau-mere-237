import type { Role, SubscriptionTier } from './supabase/types';

export const ROLES = {
  USER: 'user' as Role,
  ADMIN: 'admin' as Role,
  SUPERADMIN: 'superadmin' as Role,
} as const;

export const TIERS = {
  FREE: 'free' as SubscriptionTier,
  SUBSCRIBER: 'subscriber' as SubscriptionTier,
  NFT: 'nft' as SubscriptionTier,
} as const;

export function isAdmin(role: Role | undefined | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
}

export function isSuperAdmin(role: Role | undefined | null): boolean {
  return role === ROLES.SUPERADMIN;
}

export function isSubscriber(
  tier: SubscriptionTier | undefined | null,
  expiresAt: string | null | undefined,
): boolean {
  if (tier === TIERS.NFT) return true;
  if (tier === TIERS.SUBSCRIBER) {
    if (!expiresAt) return true;
    return new Date(expiresAt) > new Date();
  }
  return false;
}

export function isNftHolder(tier: SubscriptionTier | undefined | null): boolean {
  return tier === TIERS.NFT;
}
