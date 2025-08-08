# Bookmark Summarizer

A minimal web app that lets you save links and instantly get short, readable summaries.

## What it does

- Sign in with Google (Supabase Auth).
- Save any URL and automatically:
  - Fetch the page title and favicon.
  - Fetch readable article text via Jina Reader.
  - Generate a concise summary on the server.
- Organize with tags and search (by title or summary).
- View, filter, and delete your bookmarks.

## How it works (high level)

1. You sign in with Google using Supabase Auth (client-side).
2. The client includes your access token when calling backend API routes.
3. The server verifies your identity with Supabase, then:
   - Scrapes metadata (title, favicon).
   - Calls Jina Reader (`r.jina.ai`) server-side to get readable text.
   - Generates or returns a concise summary.
4. The bookmark (URL, title, favicon, summary, tags) is stored and listed back to you.

## API (simplified)

- `POST /api/bookmarks` — Create a bookmark (fetch metadata + summary).
- `GET /api/bookmarks` — List your bookmarks (supports `q` and `tags` filters).
- `GET /api/bookmarks/:id` — Get one bookmark.
- `PUT /api/bookmarks/:id` — Update title, tags, summary, order.
- `DELETE /api/bookmarks/:id` — Delete a bookmark.
- `POST /api/summary` — Summarize arbitrary text (optional helper).
- `GET /api/auth/me` — Return the current user.

All protected routes require an Authorization header (`Bearer <access_token>`).

## Data model (conceptual)

Bookmark:
- `id`: string/uuid
- `userId`: string
- `url`: string
- `title`: string
- `favicon`: string (URL)
- `summary`: text
- `tags`: string[]
- `createdAt`, `updatedAt`: datetime
- `orderIndex`: number (for drag-drop)

## UI

- Top bar: Google sign-in, “Save URL”, search, tag filters.
- List view: favicon, title, one-line summary, tags, delete action.
- Dialog to add new bookmark (URL, optional tags and title override).

## Security & privacy

- Google login via Supabase; server validates each request.
- Jina API key and any other secrets are used only on the server.
- Fetched content is summarized and stored to improve recall; favicons are stored as URLs.
