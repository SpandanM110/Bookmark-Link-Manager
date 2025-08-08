'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, LogIn, LogOut, Trash2, Bookmark, Tags, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Bookmark as BookmarkType } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

type SupaUser = { id: string; email?: string | null };
type TokenBundle = { access_token: string | null };

export default function HomePage() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<SupaUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Observe auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function authFetch(input: RequestInfo, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers, cache: 'no-store' });
  }

  async function fetchBookmarks() {
    if (!user) return setBookmarks([]);
    setLoading(true);
    const params = new URLSearchParams();
    if (tagFilter.length) params.set('tags', tagFilter.join(','));
    if (query) params.set('q', query);
    const res = await authFetch(`/api/bookmarks?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data.items || []);
    } else {
      setBookmarks([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchBookmarks();
    else setBookmarks([]);
  }, [user, query, tagFilter]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    bookmarks.forEach((b) => b.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [bookmarks]);

  async function handleDelete(id: string) {
    const res = await authFetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-emerald-600" />
          <h1 className="text-xl font-semibold">Bookmark Summarizer</h1>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Save URL
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={loginWithGoogle}>
              <LogIn className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          )}
        </div>
      </header>

      <Separator className="my-6" />

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by title or summary..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search bookmarks"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tags className="h-4 w-4 text-muted-foreground" aria-hidden />
          {allTags.length === 0 ? (
            <span className="text-sm text-muted-foreground">No tags</span>
          ) : (
            allTags.map((t) => {
              const active = tagFilter.includes(t);
              return (
                <Badge
                  key={t}
                  variant={active ? 'default' : 'secondary'}
                  className={cn('cursor-pointer')}
                  onClick={() =>
                    setTagFilter((prev) =>
                      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                    )
                  }
                >
                  {t}
                </Badge>
              );
            })
          )}
          {tagFilter.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setTagFilter([])}>
              Clear
            </Button>
          )}
        </div>
      </section>

      {!user ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {'Sign in with Google to save and summarize bookmarks.'}
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : bookmarks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {'No bookmarks yet. Click "Save URL" to add your first one.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bookmarks.map((b) => (
            <article key={b.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex items-start gap-3 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.favicon || "/placeholder.svg?height=32&width=32&query=favicon%20placeholder"}
                  alt=""
                  className="mt-1 h-6 w-6 rounded"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {b.title}
                  </a>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.summary || 'No summary yet.'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {b.tags?.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete bookmark"
                    onClick={() => handleDelete(b.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add Bookmark Dialog */}
      <AddBookmarkDialog
        open={addOpen}
        setOpen={setAddOpen}
        creating={creating}
        onCreate={async (payload) => {
          try {
            setCreating(true);
            const res = await authFetch('/api/bookmarks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              await fetchBookmarks();
              setAddOpen(false);
            } else {
              const err = await res.json().catch(() => ({}));
              alert(err?.error || 'Failed to create bookmark');
            }
          } finally {
            setCreating(false);
          }
        }}
      />
    </main>
  );
}

function AddBookmarkDialog({
  open = false,
  setOpen = () => {},
  onCreate = async (_: { url: string; tags?: string[]; titleOverride?: string }) => {},
  creating = false,
}: {
  open?: boolean;
  setOpen?: (v: boolean) => void;
  onCreate?: (payload: { url: string; tags?: string[]; titleOverride?: string }) => Promise<void> | void;
  creating?: boolean;
}) {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [titleOverride, setTitleOverride] = useState('');

  function reset() {
    setUrl('');
    setTags('');
    setTitleOverride('');
  }

  async function submit() {
    await onCreate({
      url,
      titleOverride: titleOverride || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save a bookmark</DialogTitle>
          <DialogDescription>{'Paste a URL. We will fetch metadata and a short summary.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="reading, ai, research"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="titleOverride">Title override (optional)</Label>
            <Input
              id="titleOverride"
              placeholder="Custom title"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={creating || !url}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
