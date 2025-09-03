import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar - Always visible */}
      <Navbar />

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        )}

        {/* Main Content */}
        <main className={clsx(
          "flex-1 transition-all duration-300 ease-in-out",
          isMobile
            ? "pt-24 pb-20" // Account for fixed mobile navbar (top) and bottom navigation (bottom)
            : "pt-20" // Account for fixed desktop navbar
        )}>
          <div className={clsx(
            "transition-all duration-300 ease-in-out",
            !isMobile && (
              isSidebarCollapsed
                ? "ml-16" // Collapsed sidebar width
                : "ml-64" // Full sidebar width
            )
          )}>
            <div className="p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};