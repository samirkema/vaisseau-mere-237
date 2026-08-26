import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Callback Supabase Auth : échange le code PKCE contre une session httpOnly.
export async function GET(request: Request) {
  const url      = new URL(request.url);
  const code     = url.searchParams.get('code');
  const rawNext  = url.searchParams.get('next') ?? '/';
  const next     = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
  const origin   = url.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
}
