'use client';

import { useState } from 'react';
import { MangaPagesManager } from './MangaPagesManager';
import { DisplayConfigEditor } from './DisplayConfigEditor';
import { PermissionsManager } from './PermissionsManager';
import type { DisplayConfig } from '@/lib/supabase/types';

interface MangaPage {
  id:          string;
  page_number: number;
  image_url:   string;
}

interface MangaWork {
  id:             string;
  title:          string;
  kind:           string;
  language:       string;
  published:      boolean;
  description:    string | null;
  cover_url:      string | null;
  display_config: DisplayConfig | null;
}

interface Permission {
  id:         string;
  user_id:    string;
  granted_by: string | null;
  created_at: string;
  profiles:   { pseudo: string } | null;
}

interface AdminUser {
  id:     string;
  pseudo: string;
  role:   string;
}

interface Props {
  work:                MangaWork;
  initialPages:        MangaPage[];
  initialPermissions:  Permission[];
  allAdmins:           AdminUser[];
  hasDisplayPermission: boolean;
}

type Tab = 'planches' | 'affichage';

export function MangaWorkEditor({
  work,
  initialPages,
  initialPermissions,
  allAdmins,
  hasDisplayPermission,
}: Props) {
  const [tab, setTab] = useState<Tab>('planches');

  return (
    <div className="space-y-0">
      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6" aria-label="Sections de l'œuvre">
          {(['planches', 'affichage'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t === 'planches' ? 'Planches' : 'Affichage'}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'planches' && (
        <MangaPagesManager work={work} initialPages={initialPages} />
      )}

      {tab === 'affichage' && (
        <div className="space-y-8">
          {hasDisplayPermission ? (
            <>
              <section>
                <h2 className="text-base font-semibold text-gray-900 mb-4">Configuration d'affichage</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <DisplayConfigEditor workId={work.id} initialConfig={work.display_config} />
                </div>
              </section>
              <section>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <PermissionsManager
                    workId={work.id}
                    initialPermissions={initialPermissions}
                    allAdmins={allAdmins}
                  />
                </div>
              </section>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
              Vous n'avez pas la permission de modifier la configuration d'affichage de cette œuvre.
              Contactez le créateur de l'œuvre ou un superadmin.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
