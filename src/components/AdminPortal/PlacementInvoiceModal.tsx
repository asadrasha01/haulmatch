import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import type { DriverProfile } from '../../types';

interface PlacementInvoiceModalProps {
  driver: DriverProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const AMBER = '#f0a23b';
const RULE = 'rgba(18,19,21,0.15)';
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace";
const BODY = "'Barlow', system-ui, sans-serif";

const getInitialDates = () => {
  const now = new Date();
  const issue = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const due = new Date(now.getTime() + 15 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return { issueDate: issue, dueDate: due };
};

export const PlacementInvoiceModal: React.FC<PlacementInvoiceModalProps> = ({
  driver,
  isOpen,
  onClose
}) => {
  const [dates] = useState(getInitialDates);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !driver) return null;

  const invoiceNumber = `HM-INV-${driver.id.replace(/\D/g, '') || '8921'}`;
  const { issueDate, dueDate } = dates;
  const carrierName = driver.placementDetails?.carrierName || driver.unlockedByCarrier || 'Swiftline Global Logistics LLC';
  const carrierContact = driver.placementDetails?.carrierContact || 'Robert Miller (Director of Safety)';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(12, 13, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto',
        fontFamily: BODY
      }}
    >
      <div
        className="hm-invoice-print-area"
        style={{
          width: '100%',
          maxWidth: 780,
          background: '#fff',
          border: `1px solid ${INK}`,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          position: 'relative',
          padding: 'clamp(24px, 4vw, 44px)',
          color: INK
        }}
      >
        {/* Modal Top Actions (Hidden when printing) */}
        <div
          className="hm-no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 14,
            borderBottom: `1px solid ${RULE}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#047857', fontWeight: 600 }}>
            <CheckCircle size={16} /> Placement Fee Invoice Generator
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: AMBER,
                color: INK,
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${INK}`,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: INK,
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, letterSpacing: '0.02em', color: INK }}>
              HAULMATCH AI
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: '#5a5d62', textTransform: 'uppercase', marginTop: 2 }}>
              Freight Workforce Contingency Placement Agency
            </div>
            <div style={{ fontSize: 13, color: '#5a5d62', marginTop: 6, lineHeight: 1.4 }}>
              1200 Pacific Avenue, Suite 400<br />
              Dallas, TX 75201 · accounting@haulmatch.ai
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 36, textTransform: 'uppercase', color: INK }}>
              INVOICE
            </div>
            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: '#b86c0d', marginTop: 2 }}>
              #{invoiceNumber}
            </div>
            <div style={{ fontSize: 13, color: '#5a5d62', marginTop: 4 }}>
              Issued: <strong>{issueDate}</strong><br />
              Terms: <strong>Net 15</strong> (Due: {dueDate})
            </div>
          </div>
        </div>

        {/* Bill To & Candidate Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, padding: '16px 20px', background: '#f8fafc', border: `1px solid ${RULE}`, marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: '#5a5d62', textTransform: 'uppercase', marginBottom: 4 }}>
              BILL TO (CARRIER)
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: INK }}>{carrierName}</div>
            <div style={{ fontSize: 13.5, color: '#475569', marginTop: 2 }}>Attn: {carrierContact}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Authorized Officer / Fleet Recruiting Dept</div>
          </div>

          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: '#5a5d62', textTransform: 'uppercase', marginBottom: 4 }}>
              PLACED DRIVER DETAILS
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: INK }}>{driver.fullName}</div>
            <div style={{ fontSize: 13.5, color: '#475569', marginTop: 2 }}>Candidate ID: {driver.id} · {driver.cdlClass}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Equipment: {driver.equipment.slice(0, 2).join(', ')}</div>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: DEEP, color: '#fff', textAlign: 'left', fontFamily: MONO, fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px' }}>Item & Milestone Description</th>
              <th style={{ padding: '10px 14px', width: '100px', textAlign: 'center' }}>Rate</th>
              <th style={{ padding: '10px 14px', width: '120px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: 13.5 }}>
            <tr style={{ borderBottom: `1px solid ${RULE}` }}>
              <td style={{ padding: '14px' }}>
                <div style={{ fontWeight: 600, color: INK }}>Contingency Placement Fee — Initial Milestone (50%)</div>
                <div style={{ fontSize: 12, color: '#5a5d62', marginTop: 3 }}>
                  Invoiced upon driver accepted offer & first dispatch orientation. Includes FMCSA 49 CFR Part 391 verified DQ package.
                </div>
              </td>
              <td style={{ padding: '14px', textAlign: 'center', fontFamily: MONO }}>$2,250.00</td>
              <td style={{ padding: '14px', textAlign: 'right', fontFamily: MONO, fontWeight: 600 }}>$2,250.00</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${RULE}` }}>
              <td style={{ padding: '14px' }}>
                <div style={{ fontWeight: 600, color: INK }}>90-Day Retention Milestone Fee (50%)</div>
                <div style={{ fontSize: 12, color: '#5a5d62', marginTop: 3 }}>
                  Invoiced upon candidate completing 90 continuous days. Includes 100% Free Replacement Warranty.
                </div>
              </td>
              <td style={{ padding: '14px', textAlign: 'center', fontFamily: MONO }}>$2,250.00</td>
              <td style={{ padding: '14px', textAlign: 'right', fontFamily: MONO, fontWeight: 600 }}>$2,250.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={{ padding: '14px', textAlign: 'right', fontWeight: 600, fontSize: 14 }}>
                Total Contingency Placement Fee:
              </td>
              <td style={{ padding: '14px', textAlign: 'right', fontFamily: MONO, fontWeight: 800, fontSize: 18, color: INK }}>
                $4,500.00
              </td>
            </tr>
            <tr style={{ background: '#fef3c7', color: '#92400e' }}>
              <td colSpan={2} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12.5, fontWeight: 600 }}>
                Initial 50% Balance Due Now (Net 15):
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: MONO, fontWeight: 800, fontSize: 16 }}>
                $2,250.00
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Remittance & Wire Instructions */}
        <div style={{ padding: '16px 20px', border: `1px dashed ${RULE}`, fontSize: 12.5, color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
          <strong style={{ color: INK }}>Payment Remittance Instructions (ACH / Fedwire):</strong><br />
          Bank Name: JPMorgan Chase Bank, N.A. · Account Name: HaulMatch AI Inc.<br />
          Routing (ABA): 111000614 · Account Number: 849201948 · Reference: #{invoiceNumber}<br />
          Credit Card / Escrow Lock: Contact accounting@haulmatch.ai to pay via encrypted merchant portal.
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontFamily: MONO }}>
          HAULMATCH AI INC. · THANK YOU FOR YOUR BUSINESS · CARRIER PLACEMENT ESCROW SYSTEM
        </div>
      </div>
    </div>
  );
};
