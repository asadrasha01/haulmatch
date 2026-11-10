import React from 'react';
import {
  Truck,
  ShieldCheck,
  Video,
  Lock,
  Unlock,
  MapPin,
  DollarSign,
  FileText
} from 'lucide-react';
import type { DriverProfile } from '../../types';

interface DriverCardProps {
  driver: DriverProfile;
  onOpenDetails: (driver: DriverProfile) => void;
  onUnlockClick: (driver: DriverProfile) => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const PAPER = '#f3f0e9';
const AMBER = '#f0a23b';
const AMBER_TEXT = '#b86d0e';
const MUTED = '#5d5f63';
const RULE = 'rgba(18, 19, 21, 0.14)';

export const DriverCard: React.FC<DriverCardProps> = ({ driver, onOpenDetails, onUnlockClick }) => {
  const isUnlocked = driver.status === 'unlocked' || driver.status === 'placed' || driver.status === 'milestone_90';

  return (
    <div
      className="glass-panel lift-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        height: '100%',
        borderTop: `3px solid ${isUnlocked ? '#059669' : INK}`
      }}
    >
      {/* Card Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#ffffff',
                  background: INK,
                  padding: '3px 8px'
                }}
              >
                {driver.id}
              </span>

              {driver.cleanMvr && (
                <span className="badge badge-emerald">
                  <ShieldCheck size={12} /> Clean 3-Yr MVR
                </span>
              )}

              {driver.bonusEligible && (
                <span className="badge badge-gold">
                  <DollarSign size={12} /> $1.5k Bonus
                </span>
              )}
            </div>

            <h3
              className="display-heading"
              style={{ fontSize: '1.5rem', marginBottom: '4px', lineHeight: 1.02 }}
            >
              {isUnlocked ? driver.fullName : driver.anonymizedTitle}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: MUTED }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> {driver.location.city}, {driver.location.state}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={13} /> {driver.yearsExperience} Yrs Exp ({driver.cdlClass})
              </span>
            </div>
          </div>

          {/* AI Fluency Badge */}
          <div
            style={{
              textAlign: 'center',
              padding: '8px 12px',
              background: DEEP,
              border: `1px solid ${INK}`,
              borderTop: `2px solid ${AMBER}`,
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 800,
                lineHeight: 1,
                color: AMBER
              }}
            >
              {driver.aiFluencyScore}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.58rem',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: 2
              }}
            >
              AI Score
            </div>
          </div>
        </div>

        {/* Endorsements and Equipment Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {driver.endorsements.map((end) => (
            <span
              key={end}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                background: INK,
                color: AMBER
              }}
            >
              {end}
            </span>
          ))}

          {driver.equipment.map((eq) => (
            <span
              key={eq}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                background: PAPER,
                color: INK,
                border: `1px solid ${RULE}`
              }}
            >
              {eq}
            </span>
          ))}
        </div>

        {/* Video Interview Mini Preview Banner */}
        <div
          onClick={() => onOpenDetails(driver)}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            background: PAPER,
            border: `1px solid ${RULE}`,
            borderLeft: `3px solid ${AMBER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                background: INK,
                color: AMBER,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Video size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: INK }}>
                Recorded Video Interview ({driver.videoInterview.duration})
              </div>
              <div style={{ fontSize: '0.72rem', color: MUTED }}>
                3 clips: Experience, Safety & Expectations
              </div>
            </div>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: AMBER_TEXT,
              fontWeight: 700
            }}
          >
            Watch →
          </span>
        </div>

        {/* Compensation & Hometime */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '0.8rem',
            paddingBottom: '16px',
            borderBottom: `1px solid ${RULE}`,
            marginBottom: '16px'
          }}
        >
          <div>
            <span style={{ color: MUTED }}>Target Pay:</span>{' '}
            <strong style={{ color: INK }}>{driver.payExpectation}</strong>
          </div>
          <div>
            <span style={{ color: MUTED }}>Home-time:</span>{' '}
            <strong style={{ color: INK }}>{driver.hometime}</strong>
          </div>
        </div>
      </div>

      {/* Card Actions & Unlock Status */}
      <div>
        {isUnlocked ? (
          <div>
            <div
              style={{
                padding: '8px 12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderLeft: '3px solid #059669',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700 }}>
                <Unlock size={14} /> Unlocked under Agreement
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: INK }}>{driver.phone}</span>
            </div>
            <button
              onClick={() => onOpenDetails(driver)}
              className="btn-primary"
              style={{ width: '100%', padding: '11px' }}
            >
              <FileText size={16} /> View Full DQ & Contact File
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onOpenDetails(driver)}
              className="btn-secondary"
              style={{ flex: 1, padding: '11px', fontSize: '0.84rem' }}
            >
              Review Video
            </button>
            <button
              onClick={() => onUnlockClick(driver)}
              className="btn-gold"
              style={{ flex: 1.3, padding: '11px', fontSize: '0.84rem' }}
            >
              <Lock size={14} /> Unlock Candidate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
