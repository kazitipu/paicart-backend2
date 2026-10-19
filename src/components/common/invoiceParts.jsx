/* ─────────────────────────────────────────────────────────────────────────
 * Paicart invoice building blocks — SHARED, byte-for-byte, by:
 *   paicart-nextjs15  src/components/invoice/InvoiceParts.jsx
 *   paicart-backend2  src/components/common/invoiceParts.jsx
 * Edit one, copy it over the other, so the customer's invoice and the admin's
 * printed copy stay the same document.
 *
 * Inline styles with hex colours only, on purpose: "Download PDF" rasterises
 * the sheet with html2canvas, which cannot parse Tailwind v4's oklch()
 * colours (and the admin app has no Tailwind at all). Plain function
 * components, no hooks — the admin app runs React 16.8.
 * ───────────────────────────────────────────────────────────────────────── */
import React from 'react';

export const INVOICE_COLORS = {
  brand: '#FF6A00',
  brandSoft: '#FFF4EC',
  ink: '#111827',
  text: '#374151',
  muted: '#6B7280',
  subtle: '#9CA3AF',
  line: '#EEF0F3',
  soft: '#F9FAFB',
  green: '#16A34A',
  greenSoft: '#ECFDF3',
  red: '#DC2626',
  redSoft: '#FEF2F2',
};
const C = INVOICE_COLORS;

export const INVOICE_COMPANY = {
  name: 'Paicart',
  tagline: 'China Cross-Border Sourcing & Shipping',
  address: [
    'Suite#F2, (2nd floor) Tropical Razia Shopping Complex',
    '26/1 Chamelibagh, Shantinagar, Dhaka 1217',
  ],
  phone: '+88-01629773885',
  email: 'support@paicart.com',
  web: 'www.paicart.com',
};

/* ৳ amounts, whole taka */
export const tk = (n) => `৳${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

/* Payment state of an order / request / shipment, as one status pill */
export const invoiceStatusOf = (record) => {
  const s = String(record?.paymentStatus || '').toLowerCase();
  if (s === 'paid') return { label: 'Paid', tone: 'green' };
  if (s === 'partially paid') return { label: 'Partially Paid', tone: 'brand' };
  if (s === 'pending') return { label: 'Payment Under Review', tone: 'amber' };
  return { label: 'Unpaid', tone: 'gray' };
};

/* Carton numbers, shipping marks and tracking numbers are arrays on newer
   records and comma strings on older ones. */
export const toInvoiceList = (value) => {
  const parts = Array.isArray(value) ? value : String(value || '').split(',');
  return parts.map((p) => String(p || '').trim()).filter(Boolean);
};

/* "0" is the placeholder written when no tracking number exists yet */
export const isInvoicePlaceholder = (value) => value === '0';

const TONES = {
  gray: { bg: '#F3F4F6', fg: '#4B5563' },
  brand: { bg: C.brandSoft, fg: C.brand },
  green: { bg: C.greenSoft, fg: C.green },
  emerald: { bg: C.greenSoft, fg: C.green },
  orange: { bg: C.brandSoft, fg: C.brand },
  amber: { bg: '#FFFBEB', fg: '#B45309' },
  red: { bg: C.redSoft, fg: C.red },
};

export function InvoiceBadge({ children, color = 'gray' }) {
  const t = TONES[color] || TONES.gray;
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '4px 10px',
      borderRadius: 999, background: t.bg, color: t.fg, letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  );
}

/* ── Sheet chrome ── */

export function InvoiceHeader({ logo, docType, docId, docDate, status }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', paddingBottom: 22, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ minWidth: 0 }}>
        <img src={logo} alt="Paicart" style={{ height: 34, width: 'auto', display: 'block', marginBottom: 10 }} />
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          {INVOICE_COMPANY.address.map((l) => <div key={l}>{l}</div>)}
          <div>{INVOICE_COMPANY.phone} · {INVOICE_COMPANY.email}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.14em', color: C.ink, lineHeight: 1 }}>INVOICE</div>
        <div style={{ fontSize: 12, color: C.brand, fontWeight: 700, marginTop: 6 }}>{docType}</div>
        <table style={{ marginTop: 12, marginLeft: 'auto', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            <tr>
              <td style={{ color: C.subtle, padding: '2px 12px 2px 0', textAlign: 'right' }}>Invoice No</td>
              <td style={{ color: C.ink, fontWeight: 700, textAlign: 'right' }}>#{docId}</td>
            </tr>
            {docDate && (
              <tr>
                <td style={{ color: C.subtle, padding: '2px 12px 2px 0', textAlign: 'right' }}>Date</td>
                <td style={{ color: C.ink, fontWeight: 600, textAlign: 'right' }}>{docDate}</td>
              </tr>
            )}
          </tbody>
        </table>
        {status && <div style={{ marginTop: 10 }}><InvoiceBadge color={status.tone}>{status.label}</InvoiceBadge></div>}
      </div>
    </div>
  );
}

export function InvoiceFooter() {
  return (
    <div style={{ marginTop: 36, paddingTop: 16, borderTop: `1px solid ${C.line}`, textAlign: 'center', fontSize: 11, color: C.subtle, lineHeight: 1.7 }}>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>Thank you for choosing Paicart!</div>
      <div>{INVOICE_COMPANY.phone} · {INVOICE_COMPANY.email} · {INVOICE_COMPANY.web}</div>
      <div>This is a computer-generated invoice and needs no signature.</div>
    </div>
  );
}

/* Faint rotated stamp once nothing is owed */
export function InvoicePaidStamp() {
  return (
    <div style={{
      position: 'absolute', top: 150, right: 40, transform: 'rotate(-14deg)',
      border: `3px solid ${C.green}`, color: C.green, opacity: 0.18,
      fontSize: 34, fontWeight: 800, letterSpacing: '0.2em', padding: '4px 18px',
      borderRadius: 10, pointerEvents: 'none',
    }}>
      PAID
    </div>
  );
}

/* Printing: the sheet's own padding is the page margin, so the browser's is
   zeroed (overriding any global @page rule) and the screen-only shadow and
   rounding go. A <style> inside the sheet travels with react-to-print's copy;
   html2canvas ignores it. */
const INVOICE_PRINT_CSS = `
@media print {
  @page { size: A4; margin: 0; }
  .invoice-sheet { box-shadow: none !important; border-radius: 0 !important; min-height: auto !important; width: 100% !important; }
  .invoice-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/* The white A4 sheet. Sized in mm so screen, print and PDF are one width. */
export function InvoiceSheet({ sheetRef, paid, children }) {
  return (
    <div ref={sheetRef} className="invoice-sheet" style={{
      position: 'relative', background: '#FFFFFF', color: C.text,
      width: '210mm', maxWidth: '100%', minHeight: '297mm', margin: '0 auto',
      boxSizing: 'border-box', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(17,24,39,0.08), 0 8px 24px rgba(17,24,39,0.04)',
      fontFamily: 'inherit',
    }}>
      <style>{INVOICE_PRINT_CSS}</style>
      <div style={{ height: 6, background: C.brand }} />
      <div style={{ padding: '12mm 14mm' }}>
        {paid && <InvoicePaidStamp />}
        {children}
      </div>
    </div>
  );
}

/* ── Content blocks ── */

export function InvoiceSection({ title, children, style }) {
  return (
    <div style={{ marginTop: 26, ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 3, height: 12, borderRadius: 2, background: C.brand, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: C.ink, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/* Total / Paid / Balance Due at a glance. due == null → bill not set yet. */
export function InvoiceSummary({ total, paid, due, totalLabel = 'Total Bill' }) {
  const pending = due == null;
  const settled = !pending && due <= 0;
  const card = (label, value, highlight) => (
    <div style={{
      flex: 1, minWidth: 0, borderRadius: 10, padding: '12px 14px',
      background: highlight && !pending ? (settled ? C.greenSoft : C.brandSoft) : C.soft,
      border: `1px solid ${highlight && !pending ? (settled ? '#BBF7D0' : '#FFD8BF') : C.line}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: highlight && !pending ? (settled ? C.green : C.brand) : C.subtle, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4, color: highlight && !pending ? (settled ? C.green : C.brand) : C.ink }}>{value}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
      {card(totalLabel, pending ? 'Pending' : tk(total))}
      {card('Paid', tk(paid))}
      {card(settled ? 'Paid in Full' : 'Balance Due', pending ? 'Pending' : tk(settled ? 0 : due), true)}
    </div>
  );
}

/* Billed To  |  Invoice Details */
export function InvoiceParties({ billTo, details = [], detailsTitle = 'Invoice Details' }) {
  const heading = (t) => (
    <div style={{ fontSize: 10, fontWeight: 800, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{t}</div>
  );
  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 26 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {heading('Billed To')}
        {billTo ? (
          <div style={{ fontSize: 12, lineHeight: 1.65, color: C.muted }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{billTo.name || '—'}</div>
            {(billTo.lines || []).filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
            {billTo.phone && <div>{billTo.phone}</div>}
            {billTo.email && <div>{billTo.email}</div>}
          </div>
        ) : <div style={{ fontSize: 12, color: C.subtle }}>—</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {heading(detailsTitle)}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {details.filter((d) => d && (d.value || d.value === 0)).map((d) => (
              <tr key={d.label}>
                <td style={{ color: C.muted, padding: '3px 12px 3px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{d.label}</td>
                <td style={{ color: C.ink, fontWeight: 600, padding: '3px 0', textAlign: 'right', wordBreak: 'break-word' }}>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* # | Item | Qty | Unit Price | Amount */
export function InvoiceItemsTable({ items }) {
  const th = (label, align = 'left', width) => (
    <th style={{ textAlign: align, width, padding: '9px 10px', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${C.line}` }}>{label}</th>
  );
  const td = { padding: '10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.line}`, verticalAlign: 'top' };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.line}`, borderRadius: 10 }}>
      <thead style={{ background: C.soft }}>
        <tr>{th('#', 'left', 28)}{th('Item')}{th('Qty', 'right', 50)}{th('Unit Price', 'right', 90)}{th('Amount', 'right', 100)}</tr>
      </thead>
      <tbody>
        {items.map((it, i) => (
          <tr key={i}>
            <td style={{ ...td, color: C.subtle }}>{i + 1}</td>
            <td style={td}>
              <div style={{ fontWeight: 700, color: C.ink }}>{it.name || '—'}</div>
              {it.meta && <div style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>{it.meta}</div>}
            </td>
            <td style={{ ...td, textAlign: 'right' }}>{it.qty ?? '—'}</td>
            <td style={{ ...td, textAlign: 'right' }}>{it.unitPrice != null ? tk(it.unitPrice) : '—'}</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: C.ink }}>{it.amount != null ? tk(it.amount) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* Totals column, right-aligned under the items */
export function InvoiceTotals({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
      <div style={{ width: 320, maxWidth: '100%' }}>{children}</div>
    </div>
  );
}

export function InvoiceRow({ label, value, bold, tone, hint }) {
  const color = tone === 'green' ? C.green : tone === 'due' ? C.brand : C.ink;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '5px 0' }}>
      <span style={{ fontSize: 12, color: bold ? C.ink : C.muted, fontWeight: bold ? 700 : 400 }}>
        {label}
        {hint && <span style={{ marginLeft: 6, fontSize: 10, color: C.subtle }}>{hint}</span>}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{value}</span>
    </div>
  );
}

export function InvoiceDivider() {
  return <div style={{ borderTop: `1px dashed ${C.line}`, margin: '6px 0' }} />;
}

/* The bottom line: Balance Due (or Paid in Full) in its own band.
   due == null → the bill is not set yet. */
export function InvoiceDueRow({ due }) {
  const pending = due == null;
  const settled = !pending && due <= 0;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
      padding: '11px 14px', borderRadius: 10,
      background: pending ? C.soft : settled ? C.greenSoft : C.brand,
      color: pending ? C.muted : settled ? C.green : '#FFFFFF',
      border: pending ? `1px solid ${C.line}` : 'none',
    }}>
      <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{settled ? 'Paid in Full' : 'Balance Due'}</span>
      <span style={{ fontSize: 17, fontWeight: 800 }}>{pending ? 'Pending' : tk(settled ? 0 : due)}</span>
    </div>
  );
}

/* Date | Method | Amount */
export function InvoicePayments({ payments }) {
  if (!payments || !payments.length) return null;
  const cell = { padding: '8px 10px', fontSize: 12, borderBottom: `1px solid ${C.line}` };
  return (
    <InvoiceSection title="Payment History">
      <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.line}` }}>
        <thead style={{ background: C.soft }}>
          <tr>
            {['Date', 'Method', 'Amount'].map((h, i) => (
              <th key={h} style={{ ...cell, textAlign: i === 2 ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr key={i}>
              <td style={{ ...cell, color: C.text }}>{p.date || '—'}</td>
              <td style={{ ...cell, color: C.text }}>{p.method || 'Payment'}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700, color: C.green }}>+{tk(p.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </InvoiceSection>
  );
}

/* Key/value cells in a 2- or 3-column grid */
export function InvoiceGrid({ children, columns = 2 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '12px 18px' }}>{children}</div>;
}

export function InvoiceField({ label, value, capitalize }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, textTransform: capitalize ? 'capitalize' : 'none', wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  );
}

export function InvoiceChip({ children }) {
  return (
    <span style={{ display: 'inline-block', background: C.soft, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 700, marginRight: 6, marginBottom: 6 }}>
      {children}
    </span>
  );
}

export function InvoiceChipRow({ label, items }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</div>
      <div>{items.map((item, i) => <InvoiceChip key={i}>{item}</InvoiceChip>)}</div>
    </div>
  );
}

/* One row per carton — marks and carton numbers pair up positionally */
export function InvoiceCartonTable({ cartons, marks }) {
  const cell = { padding: '8px 10px', fontSize: 12, borderBottom: `1px solid ${C.line}` };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.line}` }}>
      <thead style={{ background: C.soft }}>
        <tr>
          {['#', 'Carton No', 'Shipping Mark'].map((h, i) => (
            <th key={h} style={{ ...cell, textAlign: 'left', width: i === 0 ? 28 : 'auto', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cartons.map((carton, i) => (
          <tr key={i}>
            <td style={{ ...cell, color: C.subtle }}>{i + 1}</td>
            <td style={{ ...cell, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>{carton}</td>
            <td style={{ ...cell, color: C.text }}>{marks[i] || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* Notes from the record + the standing terms */
export function InvoiceNotes({ notes = [], terms = [] }) {
  const n = notes.filter(Boolean);
  if (!n.length && !terms.length) return null;
  return (
    <InvoiceSection title="Notes & Terms">
      <div style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 14px', fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
        {n.map((t, i) => <div key={`n${i}`} style={{ color: C.text, marginBottom: 4 }}>{t}</div>)}
        {terms.map((t, i) => <div key={`t${i}`}>• {t}</div>)}
      </div>
    </InvoiceSection>
  );
}

/* Standing terms printed on every invoice */
export const INVOICE_TERMS = [
  'China-to-Bangladesh shipping is charged on the actual weight measured when the parcel arrives.',
  'Refunds follow the Paicart Return & Refund Policy (www.paicart.com/pages/refund-policy).',
];

/* Billed-To block from a delivery address or a user profile */
export const billToFromAddress = (a) => (a ? {
  name: a.name,
  lines: [a.address, [a.thana, a.district, a.division].filter(Boolean).join(', ')],
  phone: a.mobileNo,
} : null);

export const billToFromUser = (u) => {
  if (!u) return null;
  const book = Array.isArray(u.addressBook) ? u.addressBook : [];
  const a = book.find((x) => x && x.defaultShipping) || book[0];
  return {
    name: (a && a.name) || u.displayName,
    lines: a ? [a.address, [a.thana, a.district, a.division].filter(Boolean).join(', ')] : [],
    phone: (a && a.mobileNo) || u.mobileNo,
    email: u.email,
  };
};
