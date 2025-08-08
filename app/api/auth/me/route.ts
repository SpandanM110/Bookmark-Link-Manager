import 'server-only';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user });
}
