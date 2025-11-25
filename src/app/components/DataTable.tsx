import React from 'react';

interface DataTableProps {
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  data: any[];
  striped?: boolean;
  hover?: boolean;
  responsive?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Reusable Data Table Component
 * Displays tabular data with Bootstrap styling
 *
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email' },
 *     { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} label={val} /> }
 *   ]}
 *   data={users}
 *   hover
 *   striped
 * />
 */
export default function DataTable({
  columns,
  data,
  striped = true,
  hover = true,
  responsive = true,
  loading = false,
  emptyMessage = 'No data available',
}: DataTableProps) {
  const tableClass = [
    'table',
    striped && 'table-striped',
    hover && 'table-hover',
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
          <p className="text-muted">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const wrapper = responsive ? (
    <div className="table-responsive rounded-3">
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="fw-semibold bg-light">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key} className="py-3">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <table className={tableClass}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="fw-semibold bg-light">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.key} className="py-3">
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="card-body p-0">{wrapper}</div>
    </div>
  );
}
