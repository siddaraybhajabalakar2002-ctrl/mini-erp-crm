import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, roleCredentials } from '../context/AuthContext';
import { Role } from '../types';
import { LogIn, UserPlus, ShieldAlert, Sparkles, Eye, EyeOff, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, token } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@minierp.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<Role>('ADMIN');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setError('');
    setLoading(true);

    try {
      await login(loginEmail, loginPass);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify backend server is running on port 5000.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password, role });
      navigate('/', { replace: true });
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify backend server is running on port 5000.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      handleRegister(e);
    } else {
      handleLogin(email, password);
    }
  };

  const fillDemoRole = (demoRole: Role) => {
    const creds = roleCredentials[demoRole];
    setIsRegistering(false);
    setEmail(creds.email);
    setPassword('password123');
    handleLogin(creds.email, 'password123');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b1120',
        padding: '1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              fontSize: '2rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            📦
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Mini ERP + CRM Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Enterprise Wholesale & Distribution Management
          </p>
        </div>

        <div className="card">
          {/* Mode Switch Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-input)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError('');
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: !isRegistering ? 'var(--accent-primary)' : 'transparent',
                color: !isRegistering ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError('');
                if (!name) setName(email.split('@')[0] || 'New User');
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isRegistering ? 'var(--accent-primary)' : 'transparent',
                color: isRegistering ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.25rem', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
              {!isRegistering && error.toLowerCase().includes('invalid') && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)', width: '100%', fontSize: '0.8rem' }}>
                  Need an account for <strong>{email}</strong>?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setName(email.split('@')[0]);
                      setError('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                  >
                    Click here to Register
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Alex Smith"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Assign Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="ADMIN">ADMIN - Full Access (Customers, Stock, Challans)</option>
                  <option value="SALES">SALES - Manage Leads, Customers & Sales Challans</option>
                  <option value="WAREHOUSE">WAREHOUSE - Inventory Catalog & Stock Adjustments</option>
                  <option value="ACCOUNTS">ACCOUNTS - Review Invoices & GST Details</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
              <span>
                {loading
                  ? isRegistering
                    ? 'Creating Account...'
                    : 'Signing in...'
                  : isRegistering
                  ? 'Register & Enter Dashboard'
                  : 'Sign In'}
              </span>
            </button>
          </form>

          {/* 1-Click Demo Accounts Section */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--accent-warning)' }} />
              <span>OR USE 1-CLICK DEMO ACCOUNTS:</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fillDemoRole(r)}
                  disabled={loading}
                  style={{ fontSize: '0.75rem' }}
                >
                  {r} Role
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


