import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  Building2,
  Gift,
  PhoneCall,
  Search,
  Lock,
  Unlock
} from 'lucide-react';
import type { DriverProfile } from '../../types';

interface DriverStatusModalProps {
  driverId?: string;
  drivers: DriverProfile[];
  isOpen: boolean;
  onClose: () => void;
  onSelectDriverId?: (id: string) => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const PAPER = '#f4f1ea';
const AMBER = '#f0a23b';
const AMBER_TEXT = '#b86c0d';
const MUTED = '#5a5d62';
const RULE = 'rgba(18,19,21,0.15)';
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace";
const BODY = "'Barlow', system-ui, sans-serif";

const monoLabel = (size = 11, color = MUTED, track = '0.08em'): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  letterSpacing: track,
  textTransform: 'uppercase',
  color
});

export const DriverStatusModal: React.FC<DriverStatusModalProps> = ({
  driverId,
  drivers,
  isOpen,
  onClose,
  onSelectDriverId
}) => {
  const [searchQuery, setSearchQuery] = useState(driverId || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);

  if (!isOpen) return null;

  // Find driver by exact ID or phone or fallback to first available
  const activeDriver =
    drivers.find(
      (d) =>
        d.id.toLowerCase() === searchQuery.trim().toLowerCase() ||
        d.phone.replace(/\D/g, '') === searchQuery.replace(/\D/g, '') ||
        d.fullName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) ||
    drivers.find((d) => d.id === driverId) ||
    drivers[0];

  const handleCopyMagicLink = () => {
    if (!activeDriver) return;
    const url = `${window.location.origin}${window.location.pathname}?driverStatus=${activeDriver.id}`;
    void navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeDriver && onSelectDriverId) {
      onSelectDriverId(activeDriver.id);
    }
  };

  const isUnlocked =
    activeDriver?.status === 'unlocked' ||
    activeDriver?.status === 'placed' ||
    activeDriver?.status === 'milestone_90';

  const isPlaced =
    activeDriver?.status === 'placed' ||
    activeDriver?.status === 'milestone_90' ||
    Boolean(activeDriver?.placementDetails);

  const daysCompleted = activeDriver?.placementDetails?.daysCompleted ?? (isPlaced ? 1 : 0);
  const targetDays = activeDriver?.placementDetails?.targetDays ?? 90;
  const daysRemaining = Math.max(0, targetDays - daysCompleted);
  const bonusProgressPercent = Math.min(100, Math.round((daysCompleted / targetDays) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(12, 13, 15, 0.82)',
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
        style={{
          width: '100%',
          maxWidth: 880,
          background: '#fff',
          border: `1px solid ${INK}`,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          position: 'relative',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Editorial Status Bar */}
        <div
          style={{
            background: DEEP,
            color: '#fff',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `2px solid ${AMBER}`,
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, background: AMBER, display: 'inline-block' }} />
            <span style={monoLabel(11, AMBER, '0.12em')}>
              DRIVER APPLICANT STATUS PORTAL · REAL-TIME PLACEMENT TRACKER
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close status portal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Lookup Header */}
        <div
          style={{
            padding: '16px 24px',
            background: PAPER,
            borderBottom: `1px solid ${RULE}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px' }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                color={MUTED}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Enter Candidate ID (e.g. CDL-1001) or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  fontFamily: MONO,
                  fontSize: 13,
                  border: `1px solid ${RULE}`,
                  background: '#fff',
                  color: INK,
                  outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                ...monoLabel(11, INK),
                padding: '9px 16px',
                background: AMBER,
                border: `1px solid ${INK}`,
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Lookup
            </button>
          </form>

          {activeDriver && (
            <button
              type="button"
              onClick={handleCopyMagicLink}
              style={{
                ...monoLabel(11, INK),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 14px',
                background: '#fff',
                border: `1px solid ${RULE}`,
                cursor: 'pointer'
              }}
            >
              {copiedLink ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Magic Status Link'}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        {activeDriver ? (
          <div style={{ padding: 'clamp(20px, 3vw, 32px)', overflowY: 'auto' }}>
            {/* Candidate Header Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
                paddingBottom: 24,
                borderBottom: `1px solid ${RULE}`
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      ...monoLabel(11, '#fff'),
                      background: INK,
                      padding: '3px 8px',
                      display: 'inline-block'
                    }}
                  >
                    ID: {activeDriver.id}
                  </span>
                  <span
                    style={{
                      ...monoLabel(11, isPlaced ? '#15803d' : isUnlocked ? AMBER_TEXT : '#2563eb'),
                      background: isPlaced ? '#dcfce7' : isUnlocked ? '#fef3c7' : '#eff6ff',
                      padding: '3px 8px',
                      fontWeight: 600
                    }}
                  >
                    {isPlaced
                      ? '● Placement Active · Running Safe'
                      : isUnlocked
                      ? '● Profile Unlocked · Offer Pending'
                      : '● Profile Live in Fleet Talent Pool'}
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 'clamp(28px, 4vw, 42px)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    margin: 0,
                    color: INK
                  }}
                >
                  {activeDriver.fullName}
                </h2>
                <div style={{ fontSize: 15, color: MUTED, marginTop: 4 }}>
                  {activeDriver.cdlClass} Driver · {activeDriver.yearsExperience} Yrs Experience · Domicile: {activeDriver.location.city}, {activeDriver.location.state}
                </div>
              </div>

              {/* Verified Badges Pill Box */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  alignItems: 'flex-end',
                  textAlign: 'right'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                  <ShieldCheck size={16} />
                  <span>CDL & DOT Med Card Verified</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: INK }}>
                  <Sparkles size={14} color={AMBER_TEXT} />
                  <span>AI Fluency Score: {activeDriver.aiFluencyScore || 88}/100</span>
                </div>
                <div style={{ ...monoLabel(11, MUTED) }}>
                  Clean MVR · {activeDriver.equipment.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>

            {/* 4-Step Visual Hiring Pipeline */}
            <div style={{ margin: '28px 0 32px' }}>
              <div style={{ ...monoLabel(11, MUTED), marginBottom: 12 }}>
                PLACEMENT PIPELINE MILESTONES
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12
                }}
              >
                {[
                  {
                    step: '01',
                    title: 'Profile Live',
                    desc: 'Shielded candidate in fleet pool',
                    done: true,
                    active: activeDriver.status === 'available'
                  },
                  {
                    step: '02',
                    title: 'Carrier Unlock',
                    desc: isUnlocked
                      ? `Unlocked by ${activeDriver.unlockedByCarrier || activeDriver.placementDetails?.carrierName || 'Fleet'}`
                      : 'Pending carrier agreement',
                    done: isUnlocked,
                    active: activeDriver.status === 'unlocked'
                  },
                  {
                    step: '03',
                    title: 'Offer Accepted',
                    desc: isPlaced ? 'Contingency fee locked in escrow' : 'Pending dispatch hire',
                    done: isPlaced,
                    active: activeDriver.status === 'placed'
                  },
                  {
                    step: '04',
                    title: 'Day 90 Payout',
                    desc: `${daysRemaining} days to $1,500 bonus`,
                    done: activeDriver.status === 'milestone_90',
                    active: activeDriver.status === 'milestone_90'
                  }
                ].map((s) => (
                  <div
                    key={s.step}
                    style={{
                      padding: '14px 16px',
                      background: s.active ? '#fff9e6' : s.done ? '#f8fafc' : '#fafafa',
                      border: `1px solid ${s.active ? AMBER : s.done ? INK : 'rgba(18,19,21,0.12)'}`,
                      borderTop: `3px solid ${s.active ? AMBER : s.done ? '#16a34a' : 'transparent'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={monoLabel(10, s.active ? AMBER_TEXT : MUTED)}>STEP {s.step}</span>
                      {s.done ? (
                        <CheckCircle2 size={14} color="#16a34a" />
                      ) : (
                        <Clock size={14} color={MUTED} />
                      )}
                    </div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, color: INK, textTransform: 'uppercase' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.35 }}>
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two Column Grid: Carrier Activity & Retention Bonus Escrow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20 }}>
              {/* Carrier Interest & Contact Masking Box */}
              <div style={{ background: PAPER, padding: 22, border: `1px solid ${RULE}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={monoLabel(11, INK)}>Carrier Engagement Status</span>
                  {isUnlocked ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                      <Unlock size={14} /> Contact Released
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: MUTED, fontSize: 12 }}>
                      <Lock size={14} /> Privacy Masked
                    </span>
                  )}
                </div>

                <div style={{ background: '#fff', padding: '14px 16px', border: `1px solid ${RULE}`, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Building2 size={16} color={AMBER_TEXT} />
                    <span style={{ fontWeight: 600, fontSize: 15, color: INK }}>
                      {activeDriver.placementDetails?.carrierName || activeDriver.unlockedByCarrier || 'In Active Review by 3 Fleets'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
                    {isUnlocked
                      ? `Carrier has signed the placement agreement. Direct contact details released to fleet dispatch.`
                      : `Your profile has been reviewed by vetted carrier fleets in Texas and the Southwest corridor.`}
                  </div>
                </div>

                <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
                  <strong>Notice to Driver:</strong> Your phone ({activeDriver.phone.slice(0, 5)}•••) and email are protected by our cryptographic privacy shield. Only bonded carriers who legally commit to the HaulMatch contingency contract can contact you.
                </div>
              </div>

              {/* Day-90 Retention Bonus Escrow Card */}
              <div style={{ background: DEEP, color: '#fff', padding: 22, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={monoLabel(11, AMBER)}>Day-90 Escrow Bonus</span>
                  <Gift size={16} color={AMBER} />
                </div>

                <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, lineHeight: 0.95, color: AMBER, marginBottom: 8 }}>
                  $1,500.00
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
                  Direct deposit bonus paid straight to you upon completing 90 days with your matched carrier.
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Day {daysCompleted} of 90</span>
                    <span style={{ fontFamily: MONO, color: AMBER }}>{daysRemaining} Days Left</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(4, bonusProgressPercent)}%`,
                        height: '100%',
                        background: AMBER,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                <div style={{ ...monoLabel(10, 'rgba(255,255,255,0.45)'), lineHeight: 1.4 }}>
                  Automated weekly SMS retention check-ins via HaulMatch Edge Sentinel.
                </div>
              </div>
            </div>

            {/* Recruiter Support & Callback Footer CTA */}
            <div
              style={{
                marginTop: 24,
                padding: '16px 20px',
                background: PAPER,
                border: `1px solid ${RULE}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: INK }}>
                  Have questions about your application or route preferences?
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                  HaulMatch recruiting staff is standing by to adjust your preferred home-time or equipment.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCallbackRequested(true)}
                disabled={callbackRequested}
                style={{
                  ...monoLabel(11, INK),
                  padding: '10px 18px',
                  background: callbackRequested ? '#dcfce7' : '#fff',
                  border: `1px solid ${callbackRequested ? '#16a34a' : INK}`,
                  color: callbackRequested ? '#15803d' : INK,
                  cursor: callbackRequested ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 600
                }}
              >
                <PhoneCall size={14} />
                <span>{callbackRequested ? 'Recruiter Callback Scheduled!' : 'Request Staff Callback'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>
            <p style={{ fontSize: 16 }}>No candidate found matching &ldquo;{searchQuery}&rdquo;.</p>
            <p style={{ fontSize: 13 }}>Please check your Driver ID (e.g. CDL-1001) or registered phone number.</p>
          </div>
        )}
      </div>
    </div>
  );
};
