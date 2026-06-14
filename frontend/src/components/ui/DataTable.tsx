import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: keyof T & string;
  header: string;
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

export function DataTable<T>({ columns, rows, rowKey }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="vds-datatable__empty">Список пуст</p>;
  }

  return (
    <div className="vds-datatable-wrap">
      <table className="vds-datatable">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="vds-datatable__head">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="vds-datatable__row">
              {columns.map((column) => (
                <td key={column.key} className="vds-datatable__cell">
                  {column.render ? column.render(row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
