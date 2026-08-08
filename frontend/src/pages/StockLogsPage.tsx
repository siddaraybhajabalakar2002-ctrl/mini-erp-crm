import React, { useEffect, useState } from 'react';
import { stockAPI } from '../services/api';
import { StockLog, Pagination } from '../types';
import { Badge } from '../components/Badge';
import { History, ArrowUpRight, ArrowDownRight, UserCheck } from 'lucide-react';

export const StockLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [movementFilter, setMovementFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStockLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await stockAPI.getStockLogs({
        page,
        limit: 15,
        movementType: movementFilter || undefined,
      });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load stock audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockLogs(1);
  }, [movementFilter]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Stock Movement Audit Logs</h1>
          <p className="page-subtitle">Track all historical stock IN/OUT transactions, challans, and manual inventory adjustments.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <History size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Filter Movement Type:</span>
        </div>

        <select
          className="form-select"
          style={{ width: '200px' }}
          value={movementFilter}
          onChange={(e) => setMovementFilter(e.target.value)}
        >
          <option value="">All Movement Types</option>
          <option value="IN">IN (Stock Added)</option>
          <option value="OUT">OUT (Stock Reduced)</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product & SKU</th>
              <th>Type</th>
              <th>Quantity Changed</th>
              <th>Reason / Trigger</th>
              <th>Executed By</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(log.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{log.product?.name || 'Deleted Product'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SKU: {log.product?.sku}</div>
                </td>
                <td>
                  <Badge type={log.movementType} />
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      color: log.movementType === 'IN' ? 'var(--accent-success)' : 'var(--accent-danger)',
                    }}
                  >
                    {log.movementType === 'IN' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {log.movementType === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`} units
                  </span>
                </td>
                <td style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{log.reason}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    <UserCheck size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span>{log.createdBy}</span>
                  </div>
                </td>
              </tr>
            ))}

            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No stock movement logs recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div>
          Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total movement logs)
        </div>
        <div className="pagination-controls">
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchStockLogs(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchStockLogs(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
