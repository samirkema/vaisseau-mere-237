import Link from 'next/link';

const navItems = [
  { href: '/admin',            label: 'Dashboard' },
  { href: '/admin/manga',      label: 'Mangas' },
  { href: '/admin/tableaux',   label: 'Tableaux' },
  { href: '/admin/users',      label: 'Utilisateurs' },
  { href: '/admin/analytics',  label: 'Analytics' },
  { href: '/admin/jeux',       label: 'Jeux' },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 px-3 gap-1 shrink-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-3">
        Administration
      </p>
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          {label}
        </Link>
      ))}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-700">
          ← Site
        </Link>
      </div>
    </aside>
  );
}
