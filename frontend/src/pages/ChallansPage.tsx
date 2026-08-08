import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { challanAPI, customerAPI, productAPI } from '../services/api';
import { Challan, Customer, Product, Pagination } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Search, Plus, Download, Eye, Trash2, AlertTriangle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChallansPage: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Challan Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanStatus, setChallanStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');

  // Dynamic Product Items
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchChallans = async (page = 1) => {
    setLoading(true);
    try {
      const res = await challanAPI.getChallans({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
      });
      setChallans(res.data.challans);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load sales challans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans(1);
  }, [search, statusFilter]);

  const handleOpenModal = async () => {
    setFormError('');
    setItems([{ productId: '', quantity: 1 }]);
    setChallanStatus('DRAFT');

    try {
      const [custRes, prodRes] = await Promise.all([
        customerAPI.getCustomers({ limit: 100 }),
        productAPI.getProducts({ limit: 100 }),
      ]);
      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);

      if (custRes.data.customers.length > 0) {
        setSelectedCustomerId(custRes.data.customers[0].id);
      }
      if (prodRes.data.products.length > 0) {
        setItems([{ productId: prodRes.data.products[0].id, quantity: 1 }]);
      }
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load modal drop-down data', err);
    }
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await challanAPI.createChallan({
        customerId: selectedCustomerId,
        status: challanStatus,
        items,
      });
      setIsModalOpen(false);
      fetchChallans(pagination.page);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create sales challan';
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors)) {
        setFormError(`${msg}: ${errors.join('; ')}`);
      } else {
        setFormError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';

  // Calculate estimated total amount for modal
  const calculatedTotal = items.reduce((sum, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return sum + (p ? p.unitPrice * (item.quantity || 0) : 0);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Sales Challan Module</h1>
          <p className="page-subtitle">Generate official delivery challans, enforce stock validation, and export PDF invoices.</p>
        </div>

        {isSalesOrAdmin && (
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={16} />
            <span>Create Sales Challan</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by challan number (e.g. CHLN-2026...), customer name, business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Challans Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Challan Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total Qty</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Created By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
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
                  <div style={{ fontWeight: 700 }}>{c.customer?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.customer?.businessName}</div>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td>{c.totalQuantity} pcs</td>
                <td style={{ fontWeight: 700 }}>₹{c.totalAmount.toLocaleString('en-IN')}</td>
                <td>
                  <Badge type={c.status} />
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.createdBy}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                    <Link to={`/challans/${c.id}`} className="btn btn-secondary btn-sm" title="View Detail Page">
                      <Eye size={14} />
                      <span>Details</span>
                    </Link>
                    <a
                      href={challanAPI.getPDFUrl(c.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Download PDF Invoice"
                      style={{ color: 'var(--accent-success)' }}
                    >
                      <Download size={14} />
                      <span>PDF</span>
                    </a>
                  </div>
                </td>
              </tr>
            ))}

            {challans.length === 0 && !loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No sales challans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div>
          Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total challans)
        </div>
        <div className="pagination-controls">
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchChallans(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchChallans(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Create Sales Challan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Sales Challan"
      >
        {formError && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Customer</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.businessName}) - {c.customerType}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Challan Status</label>
            <select
              className="form-select"
              value={challanStatus}
              onChange={(e) => setChallanStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
            >
              <option value="DRAFT">Save as Draft (No stock deduction yet)</option>
              <option value="CONFIRMED">Save as Confirmed (Instantly deduct stock)</option>
            </select>
          </div>

          {/* Product Items Table */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Product Items (Snapshots)</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                <Plus size={14} />
                <span>Add Product Row</span>
              </button>
            </div>

            {items.map((item, index) => {
              const selectedProd = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 1fr auto',
                    gap: '0.75rem',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    padding: '0.65rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <select
                      className="form-select"
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku}) - Stock: {p.currentStock} units @ ₹{p.unitPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      placeholder="Qty"
                      required
                    />
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'right' }}>
                    ₹{((selectedProd?.unitPrice || 0) * (item.quantity || 0)).toLocaleString('en-IN')}
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={items.length <= 1}
                      style={{ padding: '0.35rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Estimated Grand Total:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              ₹{calculatedTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Generating Challan...' : 'Generate Sales Challan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
