import { cookies } from 'next/headers';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const session = (await cookies()).get('session')?.value;

  const headers = new Headers(init.headers);
  if (session) {
    headers.set('Authorization', `Bearer ${session}`);
  }

  return fetch(`${process.env.BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}
