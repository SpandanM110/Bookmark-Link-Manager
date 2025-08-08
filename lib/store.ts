import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import type { Bookmark, User } from './types';

// In-memory store for preview/demo. Swap with Prisma in production.
const users = new Map<string, User>();
const usersByEmail = new Map<string, User>();
const bookmarksByUser = new Map<string, Bookmark[]>();
const bookmarksById = new Map<string, Bookmark>();

function nowISO() {
  return new Date().toISOString();
}

export async function createUser(input: { id: string; email: string; passwordHash: string }): Promise<User> {
  const user: User = {
    id: input.id,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  users.set(user.id, user);
  usersByEmail.set(user.email, user);
  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return usersByEmail.get(email.toLowerCase()) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  return users.get(id) || null;
}

export async function createBookmark(input: {
  userId: string;
  url: string;
  title: string;
  favicon: string;
  summary: string;
  tags: string[];
}): Promise<Bookmark> {
  const id = uuidv4();
  const existing = bookmarksByUser.get(input.userId) || [];
  const orderIndex = existing.length;
  const bm: Bookmark = {
    id,
    userId: input.userId,
    url: input.url,
    title: input.title,
    favicon: input.favicon,
    summary: input.summary,
    tags: input.tags,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    orderIndex,
  };
  bookmarksById.set(id, bm);
  bookmarksByUser.set(input.userId, [...existing, bm]);
  return bm;
}

export async function listBookmarks(userId: string): Promise<Bookmark[]> {
  const arr = bookmarksByUser.get(userId) || [];
  // Stable sort by orderIndex then createdAt
  return [...arr].sort((a, b) => (a.orderIndex - b.orderIndex) || (a.createdAt.localeCompare(b.createdAt)));
}

export async function getBookmarkById(id: string): Promise<Bookmark | null> {
  return bookmarksById.get(id) || null;
}

export async function deleteBookmark(id: string): Promise<void> {
  const bm = bookmarksById.get(id);
  if (!bm) return;
  const arr = bookmarksByUser.get(bm.userId) || [];
  bookmarksByUser.set(bm.userId, arr.filter((x) => x.id !== id));
  bookmarksById.delete(id);
}

export async function updateBookmark(
  id: string,
  patch: Partial<Pick<Bookmark, 'title' | 'tags' | 'orderIndex' | 'summary'>>
): Promise<Bookmark> {
  const bm = bookmarksById.get(id);
  if (!bm) throw new Error('Not found');
  const next: Bookmark = {
    ...bm,
    ...patch,
    updatedAt: nowISO(),
  };
  bookmarksById.set(id, next);
  const arr = bookmarksByUser.get(bm.userId) || [];
  const idx = arr.findIndex((x) => x.id === id);
  if (idx >= 0) {
    const copy = [...arr];
    copy[idx] = next;
    bookmarksByUser.set(bm.userId, copy);
  }
  return next;
}
