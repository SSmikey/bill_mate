import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'pending' | 'danger' | 'warning' | 'info' | 'secondary';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

/**
 * Reusable Status Badge Component
 * Displays status with color coding
 *
 * @example
 * <StatusBadge status="success" label="Verified" />
 * <StatusBadge status="pending" label="Pending" size="lg" rounded />
 */
export default function StatusBadge({
  status,
  label,
  size = 'md',
  rounded = true,
}: StatusBadgeProps) {
  const statusMap: { [key: string]: string } = {
    success: 'bg-success',
    pending: 'bg-warning text-dark',
    danger: 'bg-danger',
    warning: 'bg-warning text-dark',
    info: 'bg-info',
    secondary: 'bg-secondary',
  };

  const sizeClass = {
    sm: 'badge-sm px-2 py-1 text-xs',
    md: 'px-3 py-2',
    lg: 'px-4 py-2 text-sm',
  }[size];

  const roundedClass = rounded ? 'rounded-pill' : 'rounded-2';

  return (
    <span className={`badge ${statusMap[status]} ${sizeClass} ${roundedClass} fw-medium`}>
      {label}
    </span>
  );
}
