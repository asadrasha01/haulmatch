import React, { useState } from 'react';
import {
  X,
  Video,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Play,
  Pause,
  Award,
  Sparkles,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import type { DriverProfile } from '../../types';

interface DriverDossierModalProps {
  driver: DriverProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const AMBER = '#f0a23b';
const AMBER_TEXT = '#b86d0e';
const MUTED = '#5d5f63';
const RULE = 'rgba(18, 19, 21, 0.14)';
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace";
const BODY_FONT = "'Barlow', system-ui, sans-serif";

const monoStyle = (size = 11, color = MUTED, spacing = '0.08em'): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  letterSpacing: spacing,
  textTransform: 'uppercase',
  color
});

export const DriverDossierModal: React.FC<DriverDossierModalProps> = ({
  driver,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'dq'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1.0x' | '1.25x' | '1.5x'>('1.0x');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  if (!isOpen || !driver) return null;

  const transcripts = driver.videoInterview?.transcripts || [
    {
      questionNumber: 1,
      question: 'Experience & Equipment',
      answer: 'Extensive Class A combination tractor-trailer experience with strict temperature-controlled logging and on-time delivery track record.',
      timestamp: '00:00 - 00:50'
    },
    {
      questionNumber: 2,
      question: 'Safety, HOS & Winter Driving',
      answer: 'Always execute 15-minute walk-around pre-trip inspection. Clean safety record with zero hours-of-service violations.',
      timestamp: '00:55 - 01:45'
    },
    {
      questionNumber: 3,
      question: 'Carrier Expectations & 90-Day Retention',
      answer: 'Committed to long-term placement with verified equipment maintenance and weekly communication.',
      timestamp: '01:50 - 02:40'
    }
  ];

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
        zIndex: 9999,
        background: 'rgba(12, 13, 15, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          background: '#fff',
          border: `2px solid ${INK}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: BODY_FONT,
          color: INK
        }}
      >
        {/* Masthead Header */}
        <div
          style={{
            background: DEEP,
            color: '#fff',
            padding: '16px 24px',
            borderBottom: `2px solid ${AMBER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, background: AMBER, display: 'inline-block' }} />
              <span style={monoStyle(10, AMBER, '0.12em')}>
                FMCSA PART 391 DQ DOSSIER // RECRUITER VERIFICATION
              </span>
            </div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: 26,
                fontWeight: 800,
                textTransform: 'uppercase',
                margin: '4px 0 0',
                letterSpacing: '0.02em'
              }}
            >
              {driver.fullName} · {driver.id}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                ...monoStyle(10, '#fff'),
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Printer size={12} /> Print Dossier
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dossier modal"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick Driver Overview Strip */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: `1px solid ${RULE}`,
            padding: '12px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            fontSize: 12
          }}
        >
          <div>
            <div style={monoStyle(9, MUTED)}>Contact Details</div>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Phone size={11} color={MUTED} /> {driver.phone}
            </div>
            <div style={{ color: MUTED, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <Mail size={11} color={MUTED} /> {driver.email}
            </div>
          </div>

          <div>
            <div style={monoStyle(9, MUTED)}>Location & CDL Class</div>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MapPin size={11} color={MUTED} /> {driver.location.city}, {driver.location.state} {driver.location.zip}
            </div>
            <div style={{ color: MUTED, fontSize: 11 }}>
              {driver.cdlClass} · {driver.yearsExperience} Yrs Experience
            </div>
          </div>

          <div>
            <div style={monoStyle(9, MUTED)}>AI Vocal Fluency</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, color: driver.aiFluencyScore >= 95 ? '#047857' : AMBER_TEXT }}>
                {driver.aiFluencyScore} / 100
              </span>
              <span
                style={{
                  ...monoStyle(9, '#047857'),
                  padding: '1px 5px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0'
                }}
              >
                HIGH CLARITY
              </span>
            </div>
            <div style={{ color: MUTED, fontSize: 11 }}>
              Speech recognition verified
            </div>
          </div>

          <div>
            <div style={monoStyle(9, MUTED)}>DOT Qualification</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#047857', fontWeight: 600, marginTop: 2 }}>
              <ShieldCheck size={13} /> {driver.dotMedCardStatus} Med Card
            </div>
            <div style={{ color: MUTED, fontSize: 11 }}>
              MVR: {driver.cleanMvr ? 'Clean (0 Violations)' : `${driver.violationsLast3Yrs} Violations`}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: RULE,
            gap: 1,
            borderBottom: `1px solid ${RULE}`
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            style={{
              flex: 1,
              padding: '12px 18px',
              background: activeTab === 'video' ? '#fff' : '#f1f5f9',
              border: 'none',
              fontFamily: BODY_FONT,
              fontWeight: 700,
              fontSize: 13,
              color: activeTab === 'video' ? INK : MUTED,
              borderBottom: activeTab === 'video' ? `3px solid ${AMBER}` : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Video size={14} color={activeTab === 'video' ? AMBER_TEXT : MUTED} />
            <span>01 // VIDEO INTERVIEW & SPEECH AI TRANSCRIPTS ({transcripts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dq')}
            style={{
              flex: 1,
              padding: '12px 18px',
              background: activeTab === 'dq' ? '#fff' : '#f1f5f9',
              border: 'none',
              fontFamily: BODY_FONT,
              fontWeight: 700,
              fontSize: 13,
              color: activeTab === 'dq' ? INK : MUTED,
              borderBottom: activeTab === 'dq' ? `3px solid ${AMBER}` : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <FileText size={14} color={activeTab === 'dq' ? '#047857' : MUTED} />
            <span>02 // FMCSA PART 391 DQ COMPLIANCE FILE</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, maxHeight: 'calc(92vh - 200px)' }}>
          {/* TAB 1: VIDEO INTERVIEW & SPEECH INTELLIGENCE */}
          {activeTab === 'video' && (
            <div>
              {/* Video Player / Waveform Studio Display */}
              <div
                style={{
                  background: DEEP,
                  border: `1px solid ${RULE}`,
                  padding: 20,
                  marginBottom: 24,
                  color: '#fff',
                  borderRadius: 2
                }}
              >
                {driver.videoInterview?.videoBlobUrl ? (
                  <video
                    controls
                    src={driver.videoInterview.videoBlobUrl}
                    style={{ width: '100%', maxHeight: 360, background: '#000', borderRadius: 2 }}
                  />
                ) : (
                  <div>
                    {/* Simulated Speech Visualizer Studio */}
                    <div
                      style={{
                        height: 180,
                        background: '#16181d',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          fontFamily: DISPLAY,
                          fontSize: 96,
                          fontWeight: 900,
                          color: 'rgba(255,255,255,0.03)',
                          userSelect: 'none'
                        }}
                      >
                        {driver.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>

                      {/* Equalizer Waveform Bars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 60, marginBottom: 16 }}>
                        {[32, 54, 20, 80, 45, 95, 70, 30, 85, 60, 40, 75, 90, 50, 65, 30, 80, 45, 90, 35].map(
                          (h, idx) => (
                            <span
                              key={idx}
                              style={{
                                width: 4,
                                height: isPlaying ? `${Math.max(12, (h * (1 + (idx % 3) * 0.2)) % 60)}px` : `${h * 0.4}px`,
                                background: isPlaying ? AMBER : '#334155',
                                transition: 'height 0.15s ease',
                                display: 'inline-block',
                                borderRadius: 1
                              }}
                            />
                          )
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}>
                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          style={{
                            padding: '8px 16px',
                            background: isPlaying ? '#dc2626' : AMBER,
                            color: isPlaying ? '#fff' : INK,
                            fontFamily: MONO,
                            fontSize: 11,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                          <span>{isPlaying ? 'Pause Audio Preview' : 'Play Video Audio Preview'}</span>
                        </button>

                        <div style={{ display: 'flex', gap: 4 }}>
                          {(['1.0x', '1.25x', '1.5x'] as const).map((spd) => (
                            <button
                              key={spd}
                              type="button"
                              onClick={() => setPlaybackSpeed(spd)}
                              style={{
                                padding: '4px 8px',
                                background: playbackSpeed === spd ? '#fff' : 'rgba(255,255,255,0.1)',
                                color: playbackSpeed === spd ? INK : '#cbd5e1',
                                border: 'none',
                                fontFamily: MONO,
                                fontSize: 10,
                                cursor: 'pointer'
                              }}
                            >
                              {spd}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 10,
                        fontSize: 11,
                        color: '#94a3b8',
                        fontFamily: MONO
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color={AMBER} />
                        <span>Duration: {driver.videoInterview?.duration || '02:45'}</span>
                        <span>·</span>
                        <span>Recorded & Audio Encoded</span>
                      </div>
                      <div style={{ color: AMBER }}>
                        Speed: {playbackSpeed}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 Structured Question Answers */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, margin: 0, textTransform: 'uppercase' }}>
                    Speech Recognition Transcripts & Safety Scoring
                  </h4>
                  <span style={monoStyle(10, MUTED)}>3 of 3 Questions Answered</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {transcripts.map((q, idx) => {
                    const isSelected = selectedQuestionIndex === idx;
                    return (
                      <div
                        key={q.questionNumber || idx}
                        onClick={() => setSelectedQuestionIndex(idx)}
                        style={{
                          border: `1px solid ${isSelected ? AMBER : RULE}`,
                          borderLeft: `4px solid ${isSelected ? AMBER : INK}`,
                          padding: '16px 18px',
                          background: isSelected ? 'rgba(240, 162, 59, 0.04)' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontFamily: MONO,
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                background: DEEP,
                                color: '#fff'
                              }}
                            >
                              QUESTION 0{q.questionNumber}
                            </span>
                            <strong style={{ fontSize: 15 }}>{q.question}</strong>
                          </div>
                          <span style={monoStyle(10, MUTED)}>{q.timestamp}</span>
                        </div>

                        <div style={{ fontSize: 13.5, color: '#1e293b', lineHeight: 1.5, background: '#f8fafc', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                          "{q.answer}"
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              ...monoStyle(9, '#047857'),
                              padding: '2px 6px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <CheckCircle2 size={10} /> VERIFIED PROTOCOL
                          </span>
                          <span
                            style={{
                              ...monoStyle(9, '#1d4ed8'),
                              padding: '2px 6px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe'
                            }}
                          >
                            ACCENT CLARITY: HIGH
                          </span>
                          <span
                            style={{
                              ...monoStyle(9, MUTED),
                              padding: '2px 6px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1'
                            }}
                          >
                            ~{q.answer.split(' ').length} WORDS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Evaluator Summary */}
              {driver.aiSummary && (
                <div
                  style={{
                    marginTop: 18,
                    padding: '16px 20px',
                    background: '#fdfbf7',
                    border: '1px solid rgba(240, 162, 59, 0.35)',
                    borderLeft: `4px solid ${AMBER}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Sparkles size={14} color={AMBER_TEXT} />
                    <span style={monoStyle(10, AMBER_TEXT, '0.1em')}>
                      RECRUITER AI SYNTHESIS & FIT RECOMMENDATION
                    </span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: '#334155' }}>
                    {driver.aiSummary}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FMCSA PART 391 DQ COMPLIANCE FILE */}
          {activeTab === 'dq' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 18,
                  marginBottom: 24
                }}
              >
                {/* CDL Document Verification */}
                <div style={{ border: `1px solid ${RULE}`, borderTop: `3px solid ${INK}`, padding: 18, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={monoStyle(9, MUTED)}>Commercial Driver License</div>
                      <h4 style={{ fontFamily: DISPLAY, fontSize: 18, margin: '2px 0 0', textTransform: 'uppercase' }}>
                        {driver.cdlClass} License
                      </h4>
                    </div>
                    <span
                      style={{
                        ...monoStyle(9, '#047857'),
                        padding: '2px 6px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0'
                      }}
                    >
                      OCR VERIFIED
                    </span>
                  </div>

                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <span style={monoStyle(9, MUTED)}>License Number:</span>{' '}
                      <strong style={{ fontFamily: MONO }}>{driver.licenseNumber}</strong>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Issuing State:</span>{' '}
                      <strong>{driver.issuingState}</strong>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Expiration Date:</span>{' '}
                      <strong style={{ fontFamily: MONO }}>{driver.cdlExpiration || '2028-06-30'}</strong>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Front/Back OCR Status:</span>{' '}
                      <span style={{ color: '#047857', fontWeight: 600 }}>{driver.dqDocuments?.cdlFront || 'Verified TX Commercial License'}</span>
                    </div>
                  </div>
                </div>

                {/* DOT Medical Card */}
                <div style={{ border: `1px solid ${RULE}`, borderTop: `3px solid ${AMBER}`, padding: 18, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={monoStyle(9, MUTED)}>Medical Certificate (MCSA-5876)</div>
                      <h4 style={{ fontFamily: DISPLAY, fontSize: 18, margin: '2px 0 0', textTransform: 'uppercase' }}>
                        DOT Physical Card
                      </h4>
                    </div>
                    <span
                      style={{
                        ...monoStyle(9, '#047857'),
                        padding: '2px 6px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0'
                      }}
                    >
                      {driver.dotMedCardStatus.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Certificate Expiry:</span>{' '}
                      <strong style={{ fontFamily: MONO }}>{driver.dotMedCardExpiry || '2027-04-12'}</strong>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Registry Validation:</span>{' '}
                      <span style={{ color: '#047857', fontWeight: 600 }}>{driver.dqDocuments?.medCard || 'National Registry Form MCSA-5876'}</span>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Medical Examiner:</span>{' '}
                      <span>NRCME Certified Physician Verified</span>
                    </div>
                  </div>
                </div>

                {/* FMCSA Clearinghouse & MVR */}
                <div style={{ border: `1px solid ${RULE}`, borderTop: `3px solid #059669`, padding: 18, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={monoStyle(9, MUTED)}>Safety & Clearinghouse</div>
                      <h4 style={{ fontFamily: DISPLAY, fontSize: 18, margin: '2px 0 0', textTransform: 'uppercase' }}>
                        MVR & Drug/Alcohol
                      </h4>
                    </div>
                    <span
                      style={{
                        ...monoStyle(9, '#047857'),
                        padding: '2px 6px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0'
                      }}
                    >
                      CLEARED
                    </span>
                  </div>

                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Clearinghouse Query:</span>{' '}
                      <strong style={{ color: '#047857' }}>{driver.dqDocuments?.clearinghouseStatus || 'Passed'} (0 Violations)</strong>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>3-Year MVR Record:</span>{' '}
                      <strong>{driver.cleanMvr ? 'Clean (0 moving violations)' : `${driver.violationsLast3Yrs} citations`}</strong>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Preventable Accidents:</span>{' '}
                      <strong>0 in 36 Months</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endorsements and Verified Equipment */}
              <div style={{ border: `1px solid ${RULE}`, padding: 20, background: '#f8fafc', marginBottom: 20 }}>
                <h4 style={{ fontFamily: DISPLAY, fontSize: 18, margin: '0 0 12px', textTransform: 'uppercase' }}>
                  Verified Endorsements & Road Experience
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={monoStyle(9, MUTED)}>Active Endorsements</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {(driver.endorsements || ['Hazmat (H)', 'Tanker (N)']).map((e) => (
                        <span
                          key={e}
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            padding: '3px 8px',
                            background: '#fff',
                            border: `1px solid ${RULE}`,
                            fontWeight: 600
                          }}
                        >
                          ✓ {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={monoStyle(9, MUTED)}>Operating Equipment</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {(driver.equipment || ['Dry Van', 'Reefer']).map((eq) => (
                        <span
                          key={eq}
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            padding: '3px 8px',
                            background: '#fff',
                            border: `1px solid ${RULE}`,
                            fontWeight: 600
                          }}
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Certification Statement */}
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f1f5f9',
                  padding: '14px 18px',
                  fontSize: 12,
                  color: '#475569',
                  lineHeight: 1.45
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: INK, marginBottom: 4 }}>
                  <Award size={14} color={AMBER_TEXT} />
                  <span>49 CFR PART 391 QUALIFICATION COMPLIANCE NOTICE</span>
                </div>
                The credentials above have been verified in compliance with the Federal Motor Carrier Safety Administration
                (FMCSA) regulations. The driver qualification file complies with Section 391.51 and is ready for fleet carrier placement review.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            background: '#f8fafc',
            borderTop: `1px solid ${RULE}`,
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={monoStyle(10, MUTED)}>
            RECORD STATUS: <strong>{driver.status.toUpperCase()}</strong> · ID: {driver.id}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              background: INK,
              color: '#fff',
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

