import { apiFetch } from './api';

export type UserRole = 'CLIENT' | 'ENGINEER' | 'MANAGER' | 'ADMIN';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await apiFetch('/auth/me');

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as CurrentUser;
}
