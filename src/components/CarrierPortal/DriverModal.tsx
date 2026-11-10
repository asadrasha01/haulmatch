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
  Download,
  ExternalLink
} from 'lucide-react';
import type { DriverProfile } from '../../types';
import { fetchDriverSignedDocuments } from '../../services/supabase';

interface DriverModalProps {
  driver: DriverProfile | null;
  onClose: () => void;
  onUnlockClick: (driver: DriverProfile) => void;
}

export const DriverModal: React.FC<DriverModalProps> = ({ driver, onClose, onUnlockClick }) => {
  const [activeQuestionTab, setActiveQuestionTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingDq, setDownloadingDq] = useState(false);
  const [signedDocs, setSignedDocs] = useState<{ cdlFrontUrl?: string; medCardUrl?: string }>({});

  if (!driver) return null;

  const isUnlocked = driver.status === 'unlocked' || driver.status === 'placed' || driver.status === 'milestone_90';

  const handleDownloadDqPackage = async () => {
    setDownloadingDq(true);
    try {
      const urls = await fetchDriverSignedDocuments(driver.id, driver.dqDocumentPaths);
      setSignedDocs(urls);

      const dossierText = [
        '==============================================================================',
        'HAULMATCH AI — FMCSA 49 CFR PART 391 DRIVER QUALIFICATION (DQ) DOSSIER',
        '==============================================================================',
        `Generated At:         ${new Date().toISOString()}`,
        `Candidate ID:         ${driver.id}`,
        `Full Legal Name:      ${driver.fullName}`,
        `Direct Phone:         ${driver.phone}`,
        `Email Address:        ${driver.email}`,
        `Domicile Location:    ${driver.location.city}, ${driver.location.state} ${driver.location.zip}`,
        '',
        '--- COMMERCIAL DRIVER LICENSE (CDL) & ENDORSEMENTS ---',
        `CDL Class:            ${driver.cdlClass}`,
        `License Number:       ${driver.licenseNumber} (${driver.issuingState})`,
        `CDL Expiration:       ${driver.cdlExpiration}`,
        `Verified Experience:  ${driver.yearsExperience} Years`,
        `Endorsements:         ${driver.endorsements.join(', ') || 'None'}`,
        `Equipment Operated:   ${driver.equipment.join(', ')}`,
        '',
        '--- DOT SAFETY & COMPLIANCE CHECKLIST ---',
        `DOT Medical Card:     ${driver.dotMedCardStatus} (Expires ${driver.dotMedCardExpiry})`,
        `3-Year MVR Status:    ${driver.cleanMvr ? 'Clean (0 Moving Violations)' : `${driver.violationsLast3Yrs} Violation(s)`}`,
        `FMCSA Clearinghouse:  ${driver.dqDocuments.clearinghouseStatus}`,
        `AI Fluency Score:     ${driver.aiFluencyScore}/100`,
        `AI Screening Summary: ${driver.aiSummary}`,
        urls.cdlFrontUrl ? `Signed CDL Image URL: ${urls.cdlFrontUrl}` : '',
        urls.medCardUrl ? `Signed Med Card URL:  ${urls.medCardUrl}` : '',
        '',
        '--- ASYNC VIDEO INTERVIEW TRANSCRIPTS ---',
        ...driver.videoInterview.transcripts.map(
          (t) => `[Q${t.questionNumber} | ${t.timestamp}] ${t.question}\n"${t.answer}"\n`
        ),
        '=============================================================================='
      ]
        .filter(Boolean)
        .join('\n');

      const blob = new Blob([dossierText], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${driver.id}_${driver.fullName.replace(/\s+/g, '_')}_DQ_Dossier.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloadingDq(false);
    }
  };

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
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0c0d0f',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#121315',
                background: '#f0a23b',
                padding: '4px 10px'
              }}
            >
              {driver.id}
            </span>
            <div>
              <h2
                className="display-heading"
                style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0 }}
              >
                {isUnlocked ? driver.fullName : driver.anonymizedTitle}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
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
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '0',
            maxHeight: 'calc(88vh - 75px)',
            overflowY: 'auto'
          }}
        >
          {/* Left Column: Video Player & Transcripts */}
          <div style={{ padding: '24px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
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
                    padding: '9px 10px',
                    borderRadius: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    background: activeQuestionTab === idx ? '#121315' : '#ffffff',
                    border: activeQuestionTab === idx ? '1px solid #121315' : '1px solid var(--border-subtle)',
                    color: activeQuestionTab === idx ? '#f0a23b' : 'var(--text-secondary)'
                  }}
                >
                  Question {idx + 1}
                </button>
              ))}
            </div>

            {/* Transcript Card */}
            <div
              style={{
                background: 'var(--bg-primary)',
                padding: '16px',
                border: '1px solid var(--border-subtle)',
                borderLeft: '3px solid #121315',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {driver.videoInterview.transcripts[activeQuestionTab]?.question}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {driver.videoInterview.transcripts[activeQuestionTab]?.timestamp}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{driver.videoInterview.transcripts[activeQuestionTab]?.answer}"
              </p>
            </div>

            {/* AI Screening Analysis Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderLeft: '3px solid #f0a23b',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={15} color="#b86d0e" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#b86d0e' }}>
                  AI Screening & Fluency Summary (Score: {driver.aiFluencyScore}/100)
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
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
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 700, marginBottom: '6px' }}>
                    <Unlock size={18} /> Candidate Contact Unlocked
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {driver.fullName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    <Phone size={14} /> {driver.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Mail size={14} /> {driver.email}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, marginBottom: '4px' }}>
                    <Lock size={16} /> Privacy Protected Candidate
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Direct contact details and unmasked DQ records unlock immediately upon electronic signing of the Contingency Placement Agreement.
                  </p>
                </div>
              )}

              {/* Driver Qualification (DQ) Checklist */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                FMCSA Driver Qualification (DQ) File
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span>Commercial Driver License ({driver.cdlClass})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isUnlocked ? driver.licenseNumber : 'Verified Active'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span>DOT Medical Examiner Cert (MCSA-5876)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                    Valid exp {driver.dotMedCardExpiry}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span>3-Year Motor Vehicle Record (MVR)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                    Clean (0 Violations)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span>FMCSA Drug & Alcohol Clearinghouse</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
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
                    disabled={downloadingDq}
                    onClick={() => void handleDownloadDqPackage()}
                  >
                    <Download size={16} />{' '}
                    {downloadingDq ? 'Generating DQ Dossier...' : 'Download Full DQ Dossier'}
                  </button>
                  {(signedDocs.cdlFrontUrl || signedDocs.medCardUrl) && (
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', marginTop: '4px' }}>
                      {signedDocs.cdlFrontUrl && (
                        <a
                          href={signedDocs.cdlFrontUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ flex: 1, padding: '8px', fontSize: '0.76rem' }}
                        >
                          <ExternalLink size={13} /> View Signed CDL Scan
                        </a>
                      )}
                      {signedDocs.medCardUrl && (
                        <a
                          href={signedDocs.medCardUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ flex: 1, padding: '8px', fontSize: '0.76rem' }}
                        >
                          <ExternalLink size={13} /> View Signed Med Card
                        </a>
                      )}
                    </div>
                  )}
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
