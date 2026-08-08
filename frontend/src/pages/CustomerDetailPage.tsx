import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerAPI, challanAPI } from '../services/api';
import { Customer } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building, Phone, Mail, MapPin, Calendar, FileText, MessageSquare, Plus, Download } from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCustomerDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await customerAPI.getCustomerById(id);
      setCustomer(res.data);
    } catch (err) {
      console.error('Failed to load customer detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetail();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;

    setSubmittingNote(true);
    try {
      await customerAPI.addFollowUpNote(id, newNote);
      setNewNote('');
      fetchCustomerDetail();
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customer record...</div>;
  }

  if (!customer) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Customer Not Found</h2>
        <Link to="/customers" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Customer CRM
        </Link>
      </div>
    );
  }

  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/customers" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Customers</span>
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1>{customer.name}</h1>
            <Badge type={customer.status} />
            <span className="badge badge-sales">{customer.customerType}</span>
          </div>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
            <Building size={16} />
            <span>{customer.businessName}</span>
            {customer.gstNumber && <span>• GSTIN: {customer.gstNumber}</span>}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Contact Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Contact & Overview
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
              <div>
                <span className="form-label">Phone Mobile</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  <Phone size={16} />
                  <span>{customer.mobile}</span>
                </div>
              </div>

              <div>
                <span className="form-label">Email Address</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <Mail size={16} style={{ color: 'var(--text-dim)' }} />
                  <span>{customer.email}</span>
                </div>
              </div>

              <div>
                <span className="form-label">Address</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <MapPin size={16} style={{ color: 'var(--text-dim)', flexShrink: 0, marginTop: '0.2rem' }} />
                  <span>{customer.address}</span>
                </div>
              </div>

              <div>
                <span className="form-label">Next Scheduled Follow-up</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-warning)', fontWeight: 700 }}>
                  <Calendar size={16} />
                  <span>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'No follow-up set'}</span>
                </div>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Account Notes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Follow-up Activity & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Notes Section */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <MessageSquare size={20} style={{ color: 'var(--accent-primary)' }} />
              <h3>CRM Follow-Up Notes & Interactions</h3>
            </div>

            {isSalesOrAdmin && (
              <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <textarea
                    className="form-textarea"
                    placeholder="Log a new phone call summary, email exchange, or follow-up note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingNote}>
                    <Plus size={14} />
                    <span>{submittingNote ? 'Saving Note...' : 'Add Follow-up Note'}</span>
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {customer.followUpNotes && customer.followUpNotes.length > 0 ? (
                customer.followUpNotes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.875rem 1rem',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.775rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{n.createdBy}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{n.note}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No follow-up notes logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Sales Challan History */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <FileText size={20} style={{ color: 'var(--accent-secondary)' }} />
              <h3>Sales Challans History</h3>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.challans && customer.challans.length > 0 ? (
                    customer.challans.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link to={`/challans/${c.id}`} style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>
                            {c.challanNumber}
                          </Link>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge type={c.status} />
                        </td>
                        <td>{c.totalQuantity} pcs</td>
                        <td style={{ fontWeight: 700 }}>₹{c.totalAmount.toLocaleString('en-IN')}</td>
                        <td>
                          <a
                            href={challanAPI.getPDFUrl(c.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                            <Download size={13} />
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                        No sales challans recorded for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
