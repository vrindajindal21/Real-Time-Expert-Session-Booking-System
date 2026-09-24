import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, CheckCircle, Clock, AlertCircle,
  XCircle, TrendingUp, DollarSign, Filter, Search, Eye
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',    color: '#94a3b8', bg: '#f1f5f9', icon: FileText },
  sent:      { label: 'Sent',     color: '#0ea5e9', bg: '#e0f2fe', icon: Clock },
  paid:      { label: 'Paid',     color: '#22c55e', bg: '#dcfce7', icon: CheckCircle },
  overdue:   { label: 'Overdue',  color: '#ef4444', bg: '#fee2e2', icon: AlertCircle },
  cancelled: { label: 'Cancelled',color: '#94a3b8', bg: '#f1f5f9', icon: XCircle },
  refunded:  { label: 'Refunded', color: '#8b5cf6', bg: '#ede9fe', icon: TrendingUp },
};

const InvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem('token');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = user?.role === 'admin' || user?.providerType === 'company'
        ? `${API_CONFIG.baseUrl}/invoices/company`
        : `${API_CONFIG.baseUrl}/invoices/mine`;

      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;

      const { data } = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setInvoices(data.data?.invoices || data.data || []);
      setSummary(data.data?.summary || {});
      setTotalPages(data.data?.pagination?.pages || 1);
    } catch (err) {
      toast.error('Could not load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [page, filterStatus]);

  const handleMarkPaid = async (invoiceId) => {
    try {
      await axios.patch(
        `${API_CONFIG.baseUrl}/invoices/${invoiceId}/mark-paid`,
        { paymentMethod: 'bank_transfer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Invoice marked as paid');
      fetchInvoices();
      setSelectedInvoice(null);
    } catch { toast.error('Failed to update invoice'); }
  };

  const filtered = invoices.filter(inv =>
    (inv.clientDetails?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: 'Total Revenue', value: `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: '#22c55e', bg: '#dcfce7' },
    { label: 'Paid Invoices', value: summary.paidCount || 0, icon: CheckCircle, color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Pending', value: summary.pendingCount || 0, icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Overdue', value: summary.overdueCount || 0, icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)', padding: '40px 32px', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            Invoices & Billing
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: '0.9rem' }}>
            Manage all your invoices, track payments, and download records
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                padding: '24px', borderRadius: '20px', background: 'white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: '16px'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={s.color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{s.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or invoice no..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} color="#94a3b8" />
          {['', 'paid', 'sent', 'overdue', 'draft'].map(s => (
            <button key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              style={{
                padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', border: 'none',
                background: filterStatus === s ? '#6366f1' : '#f1f5f9',
                color: filterStatus === s ? 'white' : '#64748b',
                transition: 'all 0.15s'
              }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 100px', gap: '0', padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          {['Invoice #', 'Client', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No invoices found</p>
          </div>
        ) : (
          filtered.map((inv, i) => {
            const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
            const StatusIcon = sc.icon;
            return (
              <motion.div
                key={inv._id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 100px',
                  gap: '0', padding: '18px 24px', borderBottom: '1px solid #f8fafc',
                  alignItems: 'center', transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: '#6366f1' }}>
                  {inv.invoiceNumber}
                </span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{inv.clientDetails?.name || '—'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{inv.clientDetails?.email || ''}</p>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN') : '—'}
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '100px',
                  background: sc.bg, color: sc.color, fontSize: '0.75rem', fontWeight: 700, width: 'fit-content'
                }}>
                  <StatusIcon size={11} /> {sc.label}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    style={{ padding: '6px', background: 'rgba(99,102,241,0.08)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#6366f1' }}
                    title="View Invoice"
                  >
                    <Eye size={15} />
                  </button>
                  {inv.status === 'sent' && (
                    <button
                      onClick={() => handleMarkPaid(inv._id)}
                      style={{ padding: '6px', background: 'rgba(34,197,94,0.08)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#22c55e' }}
                      title="Mark as Paid"
                    >
                      <CheckCircle size={15} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, background: p === page ? '#6366f1' : '#f1f5f9', color: p === page ? 'white' : '#64748b' }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div
            onClick={() => setSelectedInvoice(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '560px', maxWidth: '95vw', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}
            >
              {/* Invoice Header */}
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '28px 32px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Invoice</p>
                    <h2 style={{ margin: '6px 0 0', fontSize: '1.6rem', fontWeight: 900, fontFamily: 'monospace' }}>{selectedInvoice.invoiceNumber}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Issued</p>
                    <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{new Date(selectedInvoice.issueDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '28px 32px' }}>
                {/* Bill To */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>From</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedInvoice.providerDetails?.name || 'Provider'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>{selectedInvoice.providerDetails?.email}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Bill To</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedInvoice.clientDetails?.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>{selectedInvoice.clientDetails?.email}</p>
                    {selectedInvoice.clientDetails?.companyName && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>{selectedInvoice.clientDetails.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ background: '#f8fafc', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    {['Service', 'Qty', 'Rate', 'Amount'].map(h => (
                      <span key={h} style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>
                  {(selectedInvoice.lineItems || []).map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.description}</span>
                      <span style={{ fontSize: '0.88rem', color: '#64748b' }}>{item.quantity}</span>
                      <span style={{ fontSize: '0.88rem', color: '#64748b' }}>₹{item.unitPrice?.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>₹{item.amount?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '16px' }}>
                  {[
                    { label: 'Subtotal', value: selectedInvoice.subtotal },
                    { label: `CGST (${(selectedInvoice.taxBreakdown?.cgst / selectedInvoice.subtotal * 100 || 9).toFixed(0)}%)`, value: selectedInvoice.taxBreakdown?.cgst },
                    { label: `SGST (${(selectedInvoice.taxBreakdown?.sgst / selectedInvoice.subtotal * 100 || 9).toFixed(0)}%)`, value: selectedInvoice.taxBreakdown?.sgst },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#64748b' }}>
                      <span>{row.label}</span>
                      <span>₹{(row.value || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #f1f5f9', marginTop: '8px' }}>
                    <span>Total</span>
                    <span>₹{(selectedInvoice.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  {selectedInvoice.status === 'sent' && (
                    <button
                      onClick={() => handleMarkPaid(selectedInvoice._id)}
                      style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      ✓ Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoicesPage;
