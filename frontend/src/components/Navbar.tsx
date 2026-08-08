import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Badge } from './Badge';
import { LogOut, UserCheck, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();

  if (!user) return null;

  const roles: Role[] = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'];

  return (
    <>
      <div className="role-switcher-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Evaluation Quick Role Switcher:</span>
        </div>
        <div className="role-chips">
          {roles.map((r) => (
            <button
              key={r}
              className={`role-chip ${user.role === r ? 'active' : ''}`}
              onClick={() => quickSwitchRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <header
        style={{
          height: '64px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📦</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            MINI ERP <span style={{ color: 'var(--accent-primary)' }}>+</span> CRM
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <span>{user.name}</span>
              <Badge type={user.role} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={logout} title="Sign Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>
    </>
  );
};
