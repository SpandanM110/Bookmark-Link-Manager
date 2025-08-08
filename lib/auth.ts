import 'server-only';
import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';
import { getUserById } from './store';
import type { User } from './types';

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = await verifyJWT<{ sub?: string }>(token);
  if (!payload?.sub) return null;
  const user = await getUserById(payload.sub);
  return user;
}
