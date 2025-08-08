import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const jar = cookies();
  jar.set('token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
