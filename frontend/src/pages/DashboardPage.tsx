import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { customerAPI, productAPI, challanAPI } from '../services/api';
import { Customer, Product, Challan } from '../types';
import { Users, Package, FileText, AlertTriangle, ArrowRight, Download, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes, chlnRes] = await Promise.all([
          customerAPI.getCustomers({ limit: 100 }),
          productAPI.getProducts({ limit: 100 }),
          challanAPI.getChallans({ limit: 5 }),
        ]);

        setCustomers(custRes.data.customers);
        setProducts(prodRes.data.products);
        setChallans(chlnRes.data.challans);
      } catch (err) {
        console.error('Error loading dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);
  const totalRevenue = challans
    .filter((c) => c.status === 'CONFIRMED')
    .reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <span>Overview Dashboard</span>
          </h1>
          <p className="page-subtitle">Welcome back, {user?.name}. Here is your operations summary.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <Link to="/challans" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Challan</span>
            </Link>
          )}
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="alert-banner alert-banner-warning">
          <AlertTriangle size={20} />
          <div style={{ flex: 1 }}>
            <strong>Low Stock Alert!</strong> {lowStockProducts.length} product(s) have fallen below their minimum threshold alert quantity (e.g. {lowStockProducts[0].name} has only {lowStockProducts[0].currentStock} left).
          </div>
          <Link to="/products?lowStock=true" className="btn btn-secondary btn-sm" style={{ color: '#fbbf24' }}>
            View Low Stock
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle={`${customers.filter((c) => c.status === 'ACTIVE').length} Active Accounts`}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Inventory Items"
          value={products.length}
          subtitle={`${lowStockProducts.length} Low Stock Alert`}
          icon={Package}
          color="#10b981"
        />
        <StatCard
          title="Confirmed Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle={`${challans.filter((c) => c.status === 'CONFIRMED').length} Confirmed Challans`}
          icon={FileText}
          color="#6366f1"
        />
      </div>

      {/* Tables & Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3>Recent Sales Challans</h3>
            <Link to="/challans" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`} style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td>
                      <div>{c.customer?.name || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.customer?.businessName}</div>
                    </td>
                    <td>{c.totalQuantity} pcs</td>
                    <td style={{ fontWeight: 700 }}>₹{c.totalAmount.toLocaleString('en-IN')}</td>
                    <td>
                      <Badge type={c.status} />
                    </td>
                    <td>
                      <a
                        href={challanAPI.getPDFUrl(c.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="Download Invoice PDF"
                      >
                        <Download size={14} />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
                {challans.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No sales challans recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Role & Workflow Notes */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Active Role Capabilities</h3>
            <div style={{ marginBottom: '1rem' }}>
              <Badge type={user?.role || 'SALES'} />
            </div>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.7' }}>
              {user?.role === 'ADMIN' && (
                <>
                  <li>Full administrative access across all modules.</li>
                  <li>Manage customers, products, stock, and sales challans.</li>
                  <li>Perform manual stock adjustments.</li>
                </>
              )}
              {user?.role === 'SALES' && (
                <>
                  <li>Manage Customer leads and active accounts.</li>
                  <li>Add customer follow-up notes.</li>
                  <li>Create Draft and Confirmed Sales Challans.</li>
                </>
              )}
              {user?.role === 'WAREHOUSE' && (
                <>
                  <li>Manage Product catalog & warehouse locations.</li>
                  <li>Perform Stock adjustments (IN / OUT).</li>
                  <li>View Stock audit logs and inventory levels.</li>
                </>
              )}
              {user?.role === 'ACCOUNTS' && (
                <>
                  <li>View Customer billing information & GSTIN.</li>
                  <li>Review Sales Challans & revenue.</li>
                  <li>Download & print PDF Invoice Documents.</li>
                </>
              )}
            </ul>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Automated Business Logic</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
              Confirming a sales challan automatically verifies product stock availability, prevents negative stock, reduces stock balance, and logs an OUT stock movement entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
