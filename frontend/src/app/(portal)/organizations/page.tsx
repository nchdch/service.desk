import { apiFetch } from '@/lib/api';
import { AccessDenied } from '@/components/AccessDenied';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';

interface OrganizationListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const columns: DataTableColumn<OrganizationListItem>[] = [
  { key: 'name', header: 'Название' },
  {
    key: 'createdAt',
    header: 'Дата создания',
    render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU'),
  },
];

export default async function OrganizationsPage() {
  const res = await apiFetch('/organizations');

  if (res.status === 403) {
    return <AccessDenied />;
  }

  if (!res.ok) {
    throw new Error(`Не удалось загрузить организации: ${res.status}`);
  }

  const organizations = (await res.json()) as OrganizationListItem[];

  return (
    <DataTable
      columns={columns}
      rows={organizations}
      rowKey={(row) => row.id}
    />
  );
}
