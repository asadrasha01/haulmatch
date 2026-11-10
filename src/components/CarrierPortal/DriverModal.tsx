import React, { useState } from 'react';
import {
  X,
  Video,
  Play,
  Pause,
  CheckCircle,
  Lock,
  Unlock,
  Phone,
  Mail,
  Sparkles,
  Download
} from 'lucide-react';
import type { DriverProfile } from '../../types';

interface DriverModalProps {
  driver: DriverProfile | null;
  onClose: () => void;
  onUnlockClick: (driver: DriverProfile) => void;
}

export const DriverModal: React.FC<DriverModalProps> = ({ driver, onClose, onUnlockClick }) => {
  const [activeQuestionTab, setActiveQuestionTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!driver) return null;

  const isUnlocked = driver.status === 'unlocked' || driver.status === 'placed' || driver.status === 'milestone_90';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '960px', padding: '0', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.95)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--primary-light)',
                background: 'rgba(59, 130, 246, 0.15)',
                padding: '4px 10px',
                borderRadius: '6px'
              }}
            >
              {driver.id}
            </span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                {isUnlocked ? driver.fullName : driver.anonymizedTitle}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {driver.location.city}, {driver.location.state} • {driver.yearsExperience} Yrs Exp • {driver.cdlClass}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isUnlocked ? (
              <span className="badge badge-emerald">
                <Unlock size={13} /> Unlocked
              </span>
            ) : (
              <span className="badge badge-amber">
                <Lock size={13} /> Anonymized Candidate
              </span>
            )}
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.3fr) minmax(280px, 1fr)',
            gap: '0',
            maxHeight: 'calc(88vh - 75px)',
            overflowY: 'auto'
          }}
        >
          {/* Left Column: Video Player & Transcripts */}
          <div style={{ padding: '24px', borderRight: '1px solid var(--border-subtle)', background: 'rgba(11, 17, 32, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} color="var(--primary-light)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Async Video Screening</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Duration: {driver.videoInterview.duration}
              </span>
            </div>

            {/* Video Viewport */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '16/10',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#030712',
                border: '1px solid var(--border-card)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {driver.videoInterview.videoBlobUrl ? (
                <video
                  src={driver.videoInterview.videoBlobUrl}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at center, #1e293b 0%, #030712 100%)',
                    padding: '20px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '2px solid rgba(59, 130, 246, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause size={28} color="#60a5fa" /> : <Play size={28} color="#60a5fa" style={{ marginLeft: '4px' }} />}
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: '4px' }}>
                    Candidate Video Response Audio & Visual Stream
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Question {activeQuestionTab + 1}: {driver.videoInterview.transcripts[activeQuestionTab]?.question || 'Introduction'}
                  </p>
                </div>
              )}
            </div>

            {/* Question Selector Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {driver.videoInterview.transcripts.map((_t, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveQuestionTab(idx)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: activeQuestionTab === idx ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: activeQuestionTab === idx ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                    color: activeQuestionTab === idx ? '#60a5fa' : 'var(--text-secondary)'
                  }}
                >
                  Question {idx + 1}
                </button>
              ))}
            </div>

            {/* Transcript Card */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  {driver.videoInterview.transcripts[activeQuestionTab]?.question}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {driver.videoInterview.transcripts[activeQuestionTab]?.timestamp}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{driver.videoInterview.transcripts[activeQuestionTab]?.answer}"
              </p>
            </div>

            {/* AI Screening Analysis Box */}
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={16} color="#06b6d4" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
                  AI Screening & Fluency Summary (Score: {driver.aiFluencyScore}/100)
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                {driver.aiSummary}
              </p>
            </div>
          </div>

          {/* Right Column: DQ File & Contact Actions */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Unlock / Protected Status Banner */}
              {isUnlocked ? (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, marginBottom: '6px' }}>
                    <Unlock size={18} /> Candidate Contact Unlocked
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                    {driver.fullName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '2px' }}>
                    <Phone size={14} /> {driver.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <Mail size={14} /> {driver.email}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>
                    <Lock size={16} /> Privacy Protected Candidate
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    Direct contact details and unmasked DQ records unlock immediately upon electronic signing of the Contingency Placement Agreement.
                  </p>
                </div>
              )}

              {/* Driver Qualification (DQ) Checklist */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#f8fafc' }}>
                FMCSA Driver Qualification (DQ) File
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span>Commercial Driver License ({driver.cdlClass})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isUnlocked ? driver.licenseNumber : 'Verified Active'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span>DOT Medical Examiner Cert (MCSA-5876)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                    Valid exp {driver.dotMedCardExpiry}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span>3-Year Motor Vehicle Record (MVR)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                    Clean (0 Violations)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span>FMCSA Drug & Alcohol Clearinghouse</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                    Consent & Query Passed
                  </span>
                </div>
              </div>

              {/* Endorsements & Lanes */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Endorsements:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {driver.endorsements.map((e) => (
                    <span key={e} className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                      {e}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Equipment Experience:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {driver.equipment.map((eq) => (
                    <span key={eq} className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              {isUnlocked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href={`tel:${driver.phone}`}
                    className="btn-primary"
                    style={{ textDecoration: 'none', width: '100%' }}
                  >
                    <Phone size={16} /> Call Driver Directly ({driver.phone})
                  </a>
                  <button
                    className="btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => alert(`Full Driver Qualification Package for ${driver.fullName} downloaded (PDF). Contains CDL, Medical Examiner Cert, MVR, and Clearinghouse Consent.`)}
                  >
                    <Download size={16} /> Download Full DQ Package (PDF)
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onUnlockClick(driver);
                  }}
                  className="btn-gold"
                  style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
                >
                  <Lock size={16} /> Sign Agreement & Unlock Candidate ($4,500)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
