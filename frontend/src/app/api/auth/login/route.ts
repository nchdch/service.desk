import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface LoginRequestBody {
  email: string;
  password: string;
}

interface BackendLoginResponse {
  accessToken: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginRequestBody;

  const backendRes = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: 'Неверный email или пароль' },
      { status: backendRes.status },
    );
  }

  const { accessToken } = (await backendRes.json()) as BackendLoginResponse;

  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Number(process.env.SESSION_MAX_AGE_SECONDS ?? 28800),
    path: '/',
  });

  return response;
}
