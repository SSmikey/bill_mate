import React from 'react';

interface AlertBoxProps {
  type: 'success' | 'danger' | 'warning' | 'info';
  title?: string;
  message: string;
  icon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Reusable Alert Box Component
 * Displays alerts with Bootstrap styling
 *
 * @example
 * <AlertBox
 *   type="success"
 *   title="Success"
 *   message="Operation completed successfully"
 *   dismissible
 * />
 */
export default function AlertBox({
  type,
  title,
  message,
  icon = true,
  dismissible = false,
  onDismiss,
}: AlertBoxProps) {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const alertClass = `alert alert-${type}`;
  const iconMap = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill',
  };

  return (
    <div className={`${alertClass} rounded-3 d-flex align-items-start gap-3 ${dismissible ? 'alert-dismissible fade show' : ''}`} role="alert">
      {icon && <i className={`bi ${iconMap[type]} flex-shrink-0 mt-1`}></i>}
      <div className="flex-grow-1">
        {title && <h6 className="mb-1 fw-semibold">{title}</h6>}
        <p className="mb-0">{message}</p>
      </div>
      {dismissible && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={handleDismiss}
        ></button>
      )}
    </div>
  );
}
