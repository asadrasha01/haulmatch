import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  FileCheck,
  Shield,
  Unlock
} from 'lucide-react';
import type { DriverProfile } from '../../types';

interface PlacementContractModalProps {
  driver: DriverProfile | null;
  onClose: () => void;
  onContractSigned: (driverId: string, carrierName: string, signerName: string, signerTitle: string) => void;
}

export const PlacementContractModal: React.FC<PlacementContractModalProps> = ({
  driver,
  onClose,
  onContractSigned
}) => {
  const [carrierCompany, setCarrierCompany] = useState('Swiftline Global Logistics LLC');
  const [repName, setRepName] = useState('Robert Miller');
  const [repTitle, setRepTitle] = useState('Director of Fleet Safety & Recruiting');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!driver) return null;

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms || !carrierCompany || !repName) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onContractSigned(driver.id, carrierCompany, repName, repTitle);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });
    }, 1000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#121315',
                borderTop: '2px solid #f0a23b',
                color: '#f0a23b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Contingency Placement Agreement</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Unlock Candidate ID: <strong style={{ color: 'var(--text-primary)' }}>{driver.id}</strong> ({driver.anonymizedTitle})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Contract Terms Highlights Box */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '0.82rem',
            lineHeight: 1.5
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--primary-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={15} /> Standard Contingency Fee & 90-Day Retention Terms
          </div>

          <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <strong>Total Contingent Fee:</strong> $4,500 per successfully placed commercial driver.
            </li>
            <li>
              <strong>Milestone Schedule:</strong> 50% ($2,250) invoiced upon driver first dispatch; 50% ($2,250) balance invoiced upon driver completing <strong>90 continuous calendar days</strong>.
            </li>
            <li>
              <strong>100% Free Replacement Warranty:</strong> If the candidate leaves or is discharged for safety violation within 90 days, HaulMatch provides an immediate replacement driver at zero extra cost.
            </li>
            <li>
              <strong>Driver Retention Reward:</strong> HaulMatch disburses a direct $1,500 retention bonus to the driver upon 90 days to align longevity.
            </li>
            <li>
              <strong>Non-Circumvention:</strong> 12-month protection against unauthorized direct hiring without fee settlement.
            </li>
          </ul>
        </div>

        {/* Digital Signature Form */}
        <form onSubmit={handleSign}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">Carrier Company Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={carrierCompany}
                onChange={(e) => setCarrierCompany(e.target.value)}
                placeholder="e.g. Swiftline Logistics LLC"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Authorized Representative</label>
              <input
                type="text"
                required
                className="form-input"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Job Title / Department</label>
            <input
              type="text"
              required
              className="form-input"
              value={repTitle}
              onChange={(e) => setRepTitle(e.target.value)}
              placeholder="e.g. VP of Safety & Fleet Recruiting"
            />
          </div>

          {/* Agreement Checkbox */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <input
              type="checkbox"
              id="agreeCheck"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="agreeCheck" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              I am an authorized officer of <strong>{carrierCompany || 'Carrier'}</strong>. I acknowledge and agree to the 90-day contingent placement fee of $4,500 and the 12-month non-circumvention terms.
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!agreedToTerms || isSubmitting}
              className="btn-gold"
              style={{ padding: '12px 24px', opacity: agreedToTerms ? 1 : 0.6 }}
            >
              {isSubmitting ? (
                'Executing Digital Contract...'
              ) : (
                <>
                  <Unlock size={16} /> E-Sign & Unlock Candidate Contact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
