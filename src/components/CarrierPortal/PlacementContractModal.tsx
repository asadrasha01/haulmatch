import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  FileCheck,
  Shield,
  Unlock,
  Phone,
  Mail,
  Calendar,
  Send,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import type { DriverProfile } from '../../types';
import { logActivityEvent, createInterviewProposal } from '../../services/activityEvents';

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
  const [step, setStep] = useState<'contract' | 'interview'>('contract');
  const [carrierCompany, setCarrierCompany] = useState('Swiftline Global Logistics LLC');
  const [repName, setRepName] = useState('Robert Miller');
  const [repTitle, setRepTitle] = useState('Director of Fleet Safety & Recruiting');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interview Slot State
  const [slot1, setSlot1] = useState('Tomorrow, 10:00 AM CST');
  const [slot2, setSlot2] = useState('Tomorrow, 2:30 PM CST');
  const [slot3, setSlot3] = useState('Friday, 9:00 AM CST');
  const [interviewNotes, setInterviewNotes] = useState('Discussing Texas regional route options and immediate dispatch.');
  const [interviewSent, setInterviewSent] = useState(false);

  if (!driver) return null;

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms || !carrierCompany || !repName) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onContractSigned(driver.id, carrierCompany, repName, repTitle);

      logActivityEvent(
        'carrier_unlocked',
        `${carrierCompany} (${repName})`,
        `${driver.fullName} (${driver.id})`,
        `Signed 90-Day Contingency Placement Contract. $2,250 upfront fee locked in escrow.`
      );

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });

      // Transition to interview slot proposer step
      setStep('interview');
    }, 800);
  };

  const handleSendInterviewSlots = (e: React.FormEvent) => {
    e.preventDefault();
    const slots = [slot1, slot2, slot3].filter((s) => Boolean(s.trim()));
    createInterviewProposal(
      driver.id,
      driver.fullName,
      carrierCompany,
      repName,
      driver.phone,
      slots,
      interviewNotes
    );
    setInterviewSent(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px', padding: '28px' }}
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
              {step === 'contract' ? <FileCheck size={20} /> : <Calendar size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {step === 'contract' ? 'Contingency Placement Agreement' : 'Candidate Contact Unlocked & Interview Proposer'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Candidate: <strong style={{ color: 'var(--text-primary)' }}>{driver.fullName}</strong> ({driver.id})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {step === 'contract' ? (
          <>
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
          </>
        ) : (
          /* Step 2: Unmasked Contact & Interview Slot Proposer */
          <div>
            {/* Unlocked Contact Box */}
            <div
              style={{
                background: '#121315',
                color: '#fff',
                padding: '18px 20px',
                borderLeft: '4px solid #f0a23b',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', textTransform: 'uppercase', color: '#f0a23b' }}>
                  CONTACT DETAILS UNLOCKED & SENT TO DISPATCH
                </span>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> Agreement Executed
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="#f0a23b" />
                  <strong style={{ fontSize: '1.05rem', letterSpacing: '0.04em' }}>{driver.phone}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#f0a23b" />
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>{driver.email}</span>
                </div>
              </div>
            </div>

            {interviewSent ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #16a34a',
                  padding: '20px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}
              >
                <CheckCircle size={32} color="#16a34a" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ color: '#15803d', fontSize: '1.1rem', margin: '0 0 6px', fontWeight: 700 }}>
                  Interview Invitation Dispatched via SMS & Email!
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#166534', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {driver.fullName} has been notified that {carrierCompany} unlocked their qualifications. The 3 proposed time slots have been sent directly to their phone.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-gold"
                  style={{ padding: '10px 24px' }}
                >
                  Done & Return to Talent Pool
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInterviewSlots}>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#f0a23b" /> Propose 3 Quick Phone Interview Slots
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Keep the transaction tracked on-platform. The driver receives an instant SMS alert with these 3 options to confirm.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', width: '50px', color: 'var(--text-muted)' }}>SLOT 1</span>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={slot1}
                      onChange={(e) => setSlot1(e.target.value)}
                      placeholder="e.g. Tomorrow at 10:00 AM CST"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', width: '50px', color: 'var(--text-muted)' }}>SLOT 2</span>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={slot2}
                      onChange={(e) => setSlot2(e.target.value)}
                      placeholder="e.g. Tomorrow at 2:30 PM CST"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', width: '50px', color: 'var(--text-muted)' }}>SLOT 3</span>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={slot3}
                      onChange={(e) => setSlot3(e.target.value)}
                      placeholder="e.g. Friday at 9:00 AM CST"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Recruiter Note to Driver</label>
                  <input
                    type="text"
                    className="form-input"
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    placeholder="e.g. Discussing dedicated route and equipment specs."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button type="button" onClick={onClose} className="btn-secondary">
                    Skip & Call Directly
                  </button>
                  <button type="submit" className="btn-gold" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={15} /> Send Interview Slots & SMS Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
