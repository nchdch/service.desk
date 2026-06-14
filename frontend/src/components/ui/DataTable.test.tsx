import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: string;
  name: string;
  email: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Имя' },
  { key: 'email', header: 'Email' },
];

describe('DataTable', () => {
  it('renders rows with column values', () => {
    const rows: Row[] = [
      { id: '1', name: 'Иван Инженеров', email: 'engineer@virtualoff.local' },
      { id: '2', name: 'Анна Админова', email: 'admin@virtualoff.local' },
    ];

    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByText('Иван Инженеров')).toBeInTheDocument();
    expect(screen.getByText('admin@virtualoff.local')).toBeInTheDocument();
  });

  it('shows "Список пуст" when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} />);

    expect(screen.getByText('Список пуст')).toBeInTheDocument();
  });
});
