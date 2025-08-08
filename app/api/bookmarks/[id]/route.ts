import 'server-only';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase-server';
import { deleteBookmark, getBookmarkById, updateBookmark } from '@/lib/store';

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bm = await getBookmarkById(params.id);
  if (!bm || bm.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(bm);
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bm = await getBookmarkById(params.id);
  if (!bm || bm.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteBookmark(params.id);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bm = await getBookmarkById(params.id);
  if (!bm || bm.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { title, tags, orderIndex, summary } = body as {
    title?: string;
    tags?: string[];
    orderIndex?: number;
    summary?: string;
  };

  const updated = await updateBookmark(params.id, { title, tags, orderIndex, summary });
  return NextResponse.json(updated);
}
