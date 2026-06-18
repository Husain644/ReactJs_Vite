import { useEffect, useRef } from 'react';
import './Common.css';

// ─── Loader ───────────────────────────────────────────────────────────────────
export function Loader({ size = 24, center = false }) {
  return (
    <div className={center ? 'loader-center' : ''}>
      <div className="loader" style={{ width: size, height: size }} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', title = 'No data', desc = '', action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
      {action}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, variant='primary', size='md', loading, icon, ...props }) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} disabled={loading || props.disabled} {...props}>
      {loading ? <div className="loader" style={{width:14,height:14}} /> : icon ? <span>{icon}</span> : null}
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'blue' }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, title, action, className = '', style }) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = '#2563eb', sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '18', color }}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────
export function DataTable({ columns, data, loading, onRow }) {
  if (loading) return <Loader center />;
  if (!data?.length) return <Empty />;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i} onClick={() => onRow?.(row)} className={onRow ? 'clickable' : ''}>
              {columns.map(c => (
                <td key={c.key}>
                  {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal fade-in"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
export function Drawer({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="modal-backdrop" onClick={onClose} />}
      <div className={`drawer ${open ? 'open' : ''}`} style={{ width }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm'} width={420}>
      <p style={{ color: 'var(--gray-700)', marginBottom: 20 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={onConfirm} loading={loading}>Delete</Btn>
      </div>
    </Modal>
  );
}

// ─── FormInput ────────────────────────────────────────────────────────────────
export function FormInput({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {props.type === 'textarea'
        ? <textarea className={`form-input ${error ? 'error' : ''}`} rows={3} {...props} />
        : <input    className={`form-input ${error ? 'error' : ''}`} {...props} />
      }
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────────────
export function SelectInput({ label, options = [], error, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={`form-input ${error ? 'error' : ''}`} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')}>✕</button>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <Btn variant="ghost" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Prev</Btn>
      <span className="pagination-info">Page {page} / {totalPages}</span>
      <Btn variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next →</Btn>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, desc, action }) {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">{title}</h2>
        {desc && <p className="page-desc">{desc}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ h = 20, w = '100%', radius = 6 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: radius }} />;
}
