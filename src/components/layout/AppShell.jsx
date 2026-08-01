import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on mobile when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full bg-[#0F0F10] overflow-hidden">
      {/* Mobile overlay */}
      <div
        id="mobile-overlay"
        onClick={closeMobileSidebar}
        className={`fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm transition-opacity ${
          isMobileOpen ? '' : 'hidden'
        }`}
      />

      {/* Sidebar */}
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileOpen}
        onToggle={toggleSidebar}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main content — pass toggleSidebar via render prop pattern */}
      <main className="flex-1 flex flex-col relative bg-[#0F0F10] w-full min-w-0 h-full overflow-hidden">
        {typeof children === 'function' ? children({ toggleSidebar }) : children}
      </main>
    </div>
  );
}
