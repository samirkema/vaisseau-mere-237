import { describe, it, expect } from 'vitest';
import { checkDisplayPermission } from '@/lib/display-guard';

const SUPERADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ADMIN_ID      = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHER_ID      = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('checkDisplayPermission', () => {
  describe('superadmin', () => {
    it('a toujours accès, quelle que soit l\'œuvre ou la permission explicite', () => {
      expect(checkDisplayPermission('superadmin', OTHER_ID, SUPERADMIN_ID, false)).toBe(true);
      expect(checkDisplayPermission('superadmin', OTHER_ID, SUPERADMIN_ID, true)).toBe(true);
      expect(checkDisplayPermission('superadmin', null, SUPERADMIN_ID, false)).toBe(true);
    });
  });

  describe('admin créateur', () => {
    it('a accès à sa propre œuvre', () => {
      expect(checkDisplayPermission('admin', ADMIN_ID, ADMIN_ID, false)).toBe(true);
    });

    it('n\'a pas accès à une œuvre dont il n\'est pas créateur et sans permission explicite', () => {
      expect(checkDisplayPermission('admin', OTHER_ID, ADMIN_ID, false)).toBe(false);
    });

    it('a accès à une œuvre si une permission explicite lui a été accordée', () => {
      expect(checkDisplayPermission('admin', OTHER_ID, ADMIN_ID, true)).toBe(true);
    });
  });

  describe('rôles non-admin', () => {
    it('retourne false pour role user', () => {
      expect(checkDisplayPermission('user', ADMIN_ID, ADMIN_ID, true)).toBe(false);
    });

    it('retourne false pour role undefined ou null', () => {
      expect(checkDisplayPermission(undefined, ADMIN_ID, ADMIN_ID, true)).toBe(false);
      expect(checkDisplayPermission(null as unknown as string, ADMIN_ID, ADMIN_ID, true)).toBe(false);
    });
  });

  describe('œuvre sans créateur', () => {
    it('admin n\'a pas accès si created_by est null et aucune permission explicite', () => {
      expect(checkDisplayPermission('admin', null, ADMIN_ID, false)).toBe(false);
    });

    it('admin a accès si created_by est null mais permission explicite accordée', () => {
      expect(checkDisplayPermission('admin', null, ADMIN_ID, true)).toBe(true);
    });
  });
});
