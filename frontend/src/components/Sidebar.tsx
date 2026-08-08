import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, History, FileText } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Customer CRM', path: '/customers', icon: Users },
    { label: 'Products & Stock', path: '/products', icon: Package },
    { label: 'Stock Movement Logs', path: '/stock-logs', icon: History },
    { label: 'Sales Challans', path: '/challans', icon: FileText },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          padding: '0 0.75rem 1rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Main Navigation
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'white' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};
