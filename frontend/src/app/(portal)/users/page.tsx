import { apiFetch } from '@/lib/api';
import { ROLE_BADGE_TONE, ROLE_LABELS } from '@/lib/auth';
import type { UserRole } from '@/lib/auth';
import { AccessDenied } from '@/components/AccessDenied';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';

interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const columns: DataTableColumn<UserListItem>[] = [
  { key: 'name', header: 'Имя' },
  { key: 'email', header: 'Email' },
  {
    key: 'role',
    header: 'Роль',
    render: (row) => <Badge tone={ROLE_BADGE_TONE[row.role]}>{ROLE_LABELS[row.role]}</Badge>,
  },
  {
    key: 'organizationName',
    header: 'Организация',
    render: (row) => row.organizationName ?? '—',
  },
  {
    key: 'isActive',
    header: 'Статус',
    render: (row) =>
      row.isActive ? <Badge tone="success">Активен</Badge> : <Badge tone="neutral">Отключён</Badge>,
  },
];

export default async function UsersPage() {
  const res = await apiFetch('/users');

  if (res.status === 403) {
    return <AccessDenied />;
  }

  if (!res.ok) {
    throw new Error(`Не удалось загрузить пользователей: ${res.status}`);
  }

  const users = (await res.json()) as UserListItem[];

  return <DataTable columns={columns} rows={users} rowKey={(row) => row.id} />;
}
