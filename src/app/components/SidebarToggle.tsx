'use client';

import { useState, useEffect, ReactNode, ReactElement, cloneElement } from 'react';

interface SidebarToggleProps {
  children: ReactNode;
}

export default function SidebarToggle({ children }: SidebarToggleProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {isMobile && (
        <button
          className="btn btn-link text-dark border-0 p-2 me-2"
          onClick={toggleSidebar}
          style={{ textDecoration: 'none' }}
        >
          <i className="bi bi-list fs-4"></i>
        </button>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay show"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Clone children and add mobile classes */}
      {children && typeof children === 'object' && 'type' in children ? (
        cloneElement(children as ReactElement<any>, {
          className: `${(children as ReactElement<any>).props.className || ''} ${isMobile && sidebarOpen ? 'show' : ''}`
        })
      ) : (
        children
      )}
    </>
  );
}