import type { BadgeTone } from '@/components/ui/Badge';

export type UserRole = 'CLIENT' | 'ENGINEER' | 'MANAGER' | 'ADMIN';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: 'Клиент',
  ENGINEER: 'Инженер',
  MANAGER: 'Руководитель',
  ADMIN: 'Администратор',
};

export const ROLE_BADGE_TONE: Record<UserRole, BadgeTone> = {
  CLIENT: 'neutral',
  ENGINEER: 'info',
  MANAGER: 'accent',
  ADMIN: 'warning',
};
