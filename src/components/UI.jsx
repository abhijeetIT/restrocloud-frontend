import React from 'react'
import styles from './UI.module.css'

// ─── BUTTON ─────────────────────────────────────────────
export function Button({ children, variant = 'gold', size = 'md', full, loading, className = '', ...props }) {
  return (
    <button
      className={[
        styles.btn,
        styles[`btn_${variant}`],
        styles[`btn_${size}`],
        full ? styles.btn_full : '',
        className
      ].join(' ')}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className={styles.spinner_sm} /> : children}
    </button>
  )
}

// ─── INPUT ──────────────────────────────────────────────
export function Input({ label, error, ...props }) {
  return (
    <div className={styles.form_group}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.input_error : ''}`} {...props} />
      {error && <span className={styles.error_msg}>{error}</span>}
    </div>
  )
}

// ─── TEXTAREA ───────────────────────────────────────────
export function Textarea({ label, error, ...props }) {
  return (
    <div className={styles.form_group}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={`${styles.input} ${styles.textarea} ${error ? styles.input_error : ''}`} {...props} />
      {error && <span className={styles.error_msg}>{error}</span>}
    </div>
  )
}

// ─── SELECT ─────────────────────────────────────────────
export function Select({ label, error, children, ...props }) {
  return (
    <div className={styles.form_group}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={`${styles.input} ${styles.select} ${error ? styles.input_error : ''}`} {...props}>
        {children}
      </select>
      {error && <span className={styles.error_msg}>{error}</span>}
    </div>
  )
}

// ─── BADGE ──────────────────────────────────────────────
export function Badge({ children, bg, color }) {
  return (
    <span className={styles.badge} style={{ background: bg, color }}>
      {children}
    </span>
  )
}

// ─── CARD ───────────────────────────────────────────────
export function Card({ children, className = '', style = {} }) {
  return <div className={`${styles.card} ${className}`} style={style}>{children}</div>
}

export function CardTitle({ children, icon }) {
  return (
    <div className={styles.card_title}>
      {icon && <span>{icon}</span>}
      {children}
    </div>
  )
}

// ─── MODAL ──────────────────────────────────────────────
export function Modal({ title, onClose, children, size = 'md' }) {
  React.useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles[`modal_${size}`]}`}>
        <div className={styles.modal_header}>
          <h2 className={styles.modal_title}>{title}</h2>
          <button className={styles.modal_close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modal_body}>{children}</div>
      </div>
    </div>
  )
}

// ─── SPINNER ────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  return (
    <div className={styles.spinner_wrap}>
      <span className={`${styles.spinner} ${styles[`spinner_${size}`]}`} />
    </div>
  )
}

// ─── EMPTY STATE ────────────────────────────────────────
export function Empty({ icon = '📭', text = 'No data found', children }) {
  return (
    <div className={styles.empty}>
      <div className={styles.empty_icon}>{icon}</div>
      <div className={styles.empty_text}>{text}</div>
      {children}
    </div>
  )
}

// ─── PAGE HEADER ────────────────────────────────────────
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className={styles.page_header}>
      <div>
        <h1 className={styles.page_title}>{title}</h1>
        {subtitle && <p className={styles.page_subtitle}>{subtitle}</p>}
      </div>
      {children && <div className={styles.page_actions}>{children}</div>}
    </div>
  )
}

// ─── STAT CARD ──────────────────────────────────────────
export function StatCard({ label, value, icon, accent = 'gold', prefix = '', suffix = '' }) {
  return (
    <div className={`${styles.stat_card} ${styles[`accent_${accent}`]}`}>
      <div className={styles.stat_icon}>{icon}</div>
      <div className={styles.stat_label}>{label}</div>
      <div className={styles.stat_value}>{prefix}{value}{suffix}</div>
    </div>
  )
}

// ─── TABLE ──────────────────────────────────────────────
export function Table({ children }) {
  return (
    <div className={styles.table_wrap}>
      <table className={styles.table}>{children}</table>
    </div>
  )
}
export const Th = ({ children }) => <th className={styles.th}>{children}</th>
export const Td = ({ children, ...p }) => <td className={styles.td} {...p}>{children}</td>

// ─── GRID ───────────────────────────────────────────────
export function Grid({ cols = 2, gap = 16, children, style = {} }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, ...style }}>
      {children}
    </div>
  )
}

// ─── CHECKBOX ───────────────────────────────────────────
export function Checkbox({ label, ...props }) {
  return (
    <label className={styles.checkbox_label}>
      <input type="checkbox" className={styles.checkbox} {...props} />
      {label}
    </label>
  )
}

// ─── DIVIDER ────────────────────────────────────────────
export function Divider() {
  return <div className={styles.divider} />
}

// ─── PAGINATION ──────────────────────────────────────────
export function Pagination({ page, totalPages, totalElements, size, onPageChange }) {
  if (totalPages <= 1) return null
  const displayPage = page + 1  // backend is 0-based, show 1-based to user

  const pages = []
  const start = Math.max(0, page - 2)
  const end   = Math.min(totalPages - 1, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className={styles.pagination}>
      <div className={styles.pag_info}>
        Page {displayPage} of {totalPages} · {totalElements} total
      </div>
      <div className={styles.pag_btns}>
        <button className={styles.pag_btn} onClick={() => onPageChange(0)} disabled={page === 0}>««</button>
        <button className={styles.pag_btn} onClick={() => onPageChange(page - 1)} disabled={page === 0}>‹</button>
        {pages.map(p => (
          <button key={p} className={`${styles.pag_btn} ${p === page ? styles.active : ''}`} onClick={() => onPageChange(p)}>
            {p + 1}
          </button>
        ))}
        <button className={styles.pag_btn} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>›</button>
        <button className={styles.pag_btn} onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1}>»»</button>
      </div>
    </div>
  )
}
