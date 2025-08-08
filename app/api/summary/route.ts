import 'server-only';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase-server';
import { summarizeText } from '@/lib/jina-client';

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { text } = body as { text?: string };
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

  const summary = await summarizeText(text);
  return NextResponse.json({ summary });
}
