'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface ActiveNavLinkProps {
  href: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  label?: string;
}

export default function ActiveNavLink({ href, children, icon, label }: ActiveNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded-3 ${
        isActive
          ? 'text-white'
          : 'text-dark'
      }`}
      style={{
        backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
        color: isActive ? 'white' : 'inherit',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 4px 12px rgba(33, 53, 85, 0.15)' : 'none',
      }}
    >
      {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
      <span>{label || children}</span>
    </Link>
  );
}
