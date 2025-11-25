import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
}

/**
 * Reusable Page Header Component
 * Displays a page title, subtitle, icon, and optional action button
 *
 * @example
 * <PageHeader
 *   title="User Management"
 *   subtitle="Manage all users in the system"
 *   icon="bi-people"
 *   action={<button className="btn btn-primary">Add User</button>}
 * />
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
      <div className="d-flex align-items-center gap-3">
        {icon && (
          <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-flex align-items-center justify-content-center text-primary">
            <i className={`bi ${icon} fs-4`}></i>
          </div>
        )}
        <div>
          <h1 className="mb-0 fw-bold">{title}</h1>
          {subtitle && <p className="text-muted mb-0 small">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
