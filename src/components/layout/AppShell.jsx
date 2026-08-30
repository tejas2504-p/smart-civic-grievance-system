import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../store/AuthContext';
import { Toaster } from 'sonner';

export default function AppShell() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header
        onMenuToggle={() => setMobileOpen(o => !o)}
        sidebarOpen={mobileOpen}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {user && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(c => !c)}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />
        )}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: user ? '24px' : '0',
            background: 'var(--color-bg)',
          }}
        >
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: '0.875rem',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
          }
        }}
      />
    </div>
  );
}

// Public layout (no sidebar)
export function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="bottom-right" toastOptions={{ style: { fontSize: '0.875rem', borderRadius: 6 } }} />
      <Outlet />
    </div>
  );
}
