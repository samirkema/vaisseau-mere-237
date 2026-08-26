'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useRef, useCallback } from 'react';

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const params      = useSearchParams();
  const [, startTransition] = useTransition();
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value.trim();
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const next = new URLSearchParams(params.toString());
        if (q) {
          next.set('q', q);
        } else {
          next.delete('q');
        }
        startTransition(() => {
          router.replace(`${pathname}?${next.toString()}`);
        });
      }, 350);
    },
    [pathname, params, router],
  );

  return (
    <div className="relative w-full max-w-xl">
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Rechercher un manga, webtoon ou BD…"
        aria-label="Recherche d'œuvres"
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    </div>
  );
}
