import 'server-only';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase-server';
import { createBookmark, listBookmarks } from '@/lib/store';
import { fetchMeta } from '@/lib/fetch-meta';
import { fetchReadableViaJina, summarizeText } from '@/lib/jina-client';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tagsParam = searchParams.get('tags') || '';
  const q = (searchParams.get('q') || '').toLowerCase();
  const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const items = (await listBookmarks(user.id)).filter((b) => {
    const matchesTags = tags.length ? tags.every((t) => b.tags?.includes(t)) : true;
    const matchesQuery = q
      ? (b.title?.toLowerCase().includes(q) || b.summary?.toLowerCase().includes(q))
      : true;
    return matchesTags && matchesQuery;
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { url, tags, titleOverride } = body as {
    url?: string;
    tags?: string[];
    titleOverride?: string;
  };

  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const meta = await fetchMeta(url);
  const title = titleOverride || meta.title || url;

  // Try to fetch cleaned article text via Jina Reader (server-side, with API key).
  const readable = await fetchReadableViaJina(url);

  const summary = await summarizeText(
    readable && readable.length > 50 ? readable.slice(0, 15000) : `${title} — ${url}`
  );

  const bookmark = await createBookmark({
    userId: user.id,
    url,
    title,
    favicon: meta.favicon,
    summary,
    tags: Array.isArray(tags) ? tags : [],
  });

  return NextResponse.json(bookmark, { status: 201 });
}
