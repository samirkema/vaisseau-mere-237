import { describe, it, expect } from 'vitest';
import { isSubscriber, isAdmin, isSuperAdmin, isNftHolder } from '@/lib/roles';

describe('isSubscriber', () => {
  it('retourne true pour tier subscriber sans date expiration', () => {
    expect(isSubscriber('subscriber', null)).toBe(true);
  });

  it('retourne true pour tier subscriber avec expiration future', () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    expect(isSubscriber('subscriber', future)).toBe(true);
  });

  it('retourne false pour tier subscriber avec expiration passée', () => {
    const past = new Date(Date.now() - 86400_000).toISOString();
    expect(isSubscriber('subscriber', past)).toBe(false);
  });

  it('retourne true pour tier nft peu importe la date d\'expiration', () => {
    const past = new Date(Date.now() - 86400_000).toISOString();
    expect(isSubscriber('nft', past)).toBe(true);
    expect(isSubscriber('nft', null)).toBe(true);
  });

  it('retourne false pour tier free', () => {
    expect(isSubscriber('free', null)).toBe(false);
  });

  it('retourne false pour tier null ou undefined', () => {
    expect(isSubscriber(null, null)).toBe(false);
    expect(isSubscriber(undefined, null)).toBe(false);
  });
});

describe('isAdmin', () => {
  it('retourne true pour role admin', () => {
    expect(isAdmin('admin')).toBe(true);
  });

  it('retourne true pour role superadmin', () => {
    expect(isAdmin('superadmin')).toBe(true);
  });

  it('retourne false pour role user', () => {
    expect(isAdmin('user')).toBe(false);
  });

  it('retourne false pour null et undefined', () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  it('retourne true uniquement pour role superadmin', () => {
    expect(isSuperAdmin('superadmin')).toBe(true);
    expect(isSuperAdmin('admin')).toBe(false);
    expect(isSuperAdmin('user')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe('isNftHolder', () => {
  it('retourne true uniquement pour tier nft', () => {
    expect(isNftHolder('nft')).toBe(true);
  });

  it('retourne false pour tier subscriber', () => {
    expect(isNftHolder('subscriber')).toBe(false);
  });

  it('retourne false pour tier free', () => {
    expect(isNftHolder('free')).toBe(false);
  });

  it('retourne false pour null et undefined', () => {
    expect(isNftHolder(null)).toBe(false);
    expect(isNftHolder(undefined)).toBe(false);
  });
});
