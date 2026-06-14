import { apiFetch } from './api';
import type { CurrentUser } from './roles';

export type { UserRole, CurrentUser } from './roles';
export { ROLE_LABELS, ROLE_BADGE_TONE } from './roles';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await apiFetch('/auth/me');

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as CurrentUser;
}
