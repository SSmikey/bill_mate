import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  bgClass?: string;
  textClass?: string;
  animate?: boolean;
}

/**
 * Reusable Stat Card Component
 * Displays a statistic with icon, title, and value
 *
 * @example
 * <StatCard
 *   title="Total Rooms"
 *   value={25}
 *   icon="bi-house-fill"
 *   bgClass="bg-primary"
 * />
 */
export default function StatCard({
  title,
  value,
  icon,
  bgClass = 'bg-primary',
  textClass = 'text-white',
  animate = true,
}: StatCardProps) {
  const animationClass = animate ? 'animate-slide-in-left' : '';

  return (
    <div className={`card border-0 h-100 overflow-hidden shadow-lg ${animationClass}`}>
      <div className={`${bgClass} ${textClass}`}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-2 opacity-75">{title}</h6>
              <h2 className="mb-0 fw-bold">{value}</h2>
            </div>
            <div className="rounded-circle p-3 bg-white bg-opacity-25 d-flex align-items-center justify-content-center">
              <i className={`bi ${icon} fs-3`}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
