import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { productAPI, stockAPI } from '../services/api';
import { Product, Pagination } from '../types';
import { Modal } from '../components/Modal';
import { Search, Plus, Edit, AlertTriangle, ArrowUpRight, ArrowDownRight, Package, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add / Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Peripherals',
    unitPrice: 1000,
    currentStock: 10,
    minStockAlert: 5,
    location: 'Rack A-01',
  });
  const [productError, setProductError] = useState('');

  // Manual Stock Adjust Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantityChanged: 5,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: 'Stock Audit / Restock Shipment',
  });
  const [stockError, setStockError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await productAPI.getProducts({
        page,
        limit: 10,
        search,
        category: categoryFilter || undefined,
        lowStock: lowStockFilter,
      });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, categoryFilter, lowStockFilter]);

  const handleOpenProductModal = (product?: Product) => {
    setProductError('');
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
        currentStock: product.currentStock,
        minStockAlert: product.minStockAlert,
        location: product.location,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        sku: '',
        category: 'Peripherals',
        unitPrice: 1000,
        currentStock: 10,
        minStockAlert: 5,
        location: 'Rack A-01',
      });
    }
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');
    setSubmitting(true);

    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct.id, productForm);
      } else {
        await productAPI.createProduct(productForm);
      }
      setIsProductModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      setProductError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockError('');
    setStockForm({
      quantityChanged: 5,
      movementType: 'IN',
      reason: 'Warehouse Restock',
    });
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setStockError('');
    setSubmitting(true);

    try {
      await stockAPI.adjustStock({
        productId: selectedProduct.id,
        quantityChanged: Number(stockForm.quantityChanged),
        movementType: stockForm.movementType,
        reason: stockForm.reason,
      });
      setIsStockModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      setStockError(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const isWarehouseOrAdmin = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Product & Inventory Module</h1>
          <p className="page-subtitle">Manage SKU catalog, current stock counts, and threshold alerts.</p>
        </div>

        {isWarehouseOrAdmin && (
          <button className="btn btn-primary" onClick={() => handleOpenProductModal()}>
            <Plus size={16} />
            <span>Add New Product</span>
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
            placeholder="Search by product name, SKU, category, warehouse location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Displays">Displays</option>
          <option value="Peripherals">Peripherals</option>
          <option value="Accessories">Accessories</option>
        </select>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: lowStockFilter ? '#fbbf24' : 'var(--text-muted)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: lowStockFilter ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            border: lowStockFilter ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
          }}
        >
          <input
            type="checkbox"
            checked={lowStockFilter}
            onChange={(e) => setLowStockFilter(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-warning)' }}
          />
          <AlertTriangle size={16} />
          <span>Low Stock Alerts Only</span>
        </label>
      </div>

      {/* Products Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Product & SKU</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Current Stock</th>
              <th>Min Alert Qty</th>
              <th>Location</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isLowStock = p.currentStock <= p.minStockAlert;
              return (
                <tr key={p.id} style={{ backgroundColor: isLowStock ? 'rgba(245, 158, 11, 0.04)' : undefined }}>
                  <td>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{p.name}</span>
                      {isLowStock && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            color: '#fbbf24',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                          }}
                        >
                          <AlertTriangle size={12} /> LOW STOCK
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{p.category}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: isLowStock ? '#fbbf24' : 'var(--accent-success)',
                      }}
                    >
                      {p.currentStock} units
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>{p.minStockAlert} units</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Warehouse size={14} />
                      <span>{p.location}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      {isWarehouseOrAdmin && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenStockModal(p)}
                            title="Manual Stock Adjust (IN/OUT)"
                            style={{ color: 'var(--accent-info)' }}
                          >
                            <Package size={14} />
                            <span>Adjust Stock</span>
                          </button>

                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenProductModal(p)} title="Edit Product">
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No products found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div>
          Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total products)
        </div>
        <div className="pagination-controls">
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchProducts(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchProducts(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        {productError && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1rem' }}>
            <span>{productError}</span>
          </div>
        )}

        <form onSubmit={handleProductSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-input"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
                placeholder="e.g. UltraSharp 27 Monitor"
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU Code</label>
              <input
                type="text"
                className="form-input"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                required
                placeholder="DISP-MON-001"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                required
                placeholder="Displays / Peripherals / Accessories"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Initial / Current Stock</label>
              <input
                type="number"
                className="form-input"
                value={productForm.currentStock}
                onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Alert Qty</label>
              <input
                type="number"
                className="form-input"
                value={productForm.minStockAlert}
                onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Warehouse Location</label>
              <input
                type="text"
                className="form-input"
                value={productForm.location}
                onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                required
                placeholder="Rack A-12"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjust Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Stock Level - ${selectedProduct?.name || ''}`}
      >
        {stockError && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1rem' }}>
            <span>{stockError}</span>
          </div>
        )}

        <form onSubmit={handleStockSubmit}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              Current Stock Balance: <strong style={{ color: 'var(--accent-success)' }}>{selectedProduct?.currentStock} units</strong>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Location: {selectedProduct?.location}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type</label>
              <select
                className="form-select"
                value={stockForm.movementType}
                onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value as 'IN' | 'OUT' })}
              >
                <option value="IN">IN (Stock Addition)</option>
                <option value="OUT">OUT (Stock Deduction / Write-off)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity to {stockForm.movementType}</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={stockForm.quantityChanged}
                onChange={(e) => setStockForm({ ...stockForm, quantityChanged: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Stock Adjustment</label>
            <input
              type="text"
              className="form-input"
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              required
              placeholder="e.g. Vendor shipment received, Damaged goods removal, Inventory recount"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStockModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Applying Adjustment...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
