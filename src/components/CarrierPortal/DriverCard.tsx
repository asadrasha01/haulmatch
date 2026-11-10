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

export const DriverCard: React.FC<DriverCardProps> = ({ driver, onOpenDetails, onUnlockClick }) => {
  const isUnlocked = driver.status === 'unlocked' || driver.status === 'placed' || driver.status === 'milestone_90';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'all 0.25s ease'
      }}
    >
      {/* Card Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--primary-light)',
                  background: 'rgba(59, 130, 246, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}
              >
                {driver.id}
              </span>

              {driver.cleanMvr && (
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                  <ShieldCheck size={12} /> Clean 3-Yr MVR
                </span>
              )}

              {driver.bonusEligible && (
                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                  <DollarSign size={12} /> $1.5k Bonus Eligible
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '2px', color: '#f8fafc' }}>
              {isUnlocked ? driver.fullName : driver.anonymizedTitle}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
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
              padding: '6px 10px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
              {driver.aiFluencyScore}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              AI Score
            </div>
          </div>
        </div>

        {/* Endorsements and Equipment Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {driver.endorsements.map((end) => (
            <span
              key={end}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#c084fc',
                border: '1px solid rgba(139, 92, 246, 0.25)'
              }}
            >
              {end}
            </span>
          ))}

          {driver.equipment.map((eq) => (
            <span
              key={eq}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#cbd5e1'
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
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            transition: 'border-color 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Video size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                Recorded Video Interview ({driver.videoInterview.duration})
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                3 questions: Experience, Safety & Expectations
              </div>
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}>
            Watch Preview →
          </span>
        </div>

        {/* Compensation & Hometime */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '0.78rem',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '16px'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Target Pay:</span>{' '}
            <strong style={{ color: '#f8fafc' }}>{driver.payExpectation}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Home-time:</span>{' '}
            <strong style={{ color: '#f8fafc' }}>{driver.hometime}</strong>
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
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600 }}>
                <Unlock size={14} /> Unlocked under Agreement
              </div>
              <span style={{ color: '#94a3b8' }}>{driver.phone}</span>
            </div>
            <button
              onClick={() => onOpenDetails(driver)}
              className="btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              <FileText size={16} /> View Full DQ & Contact File
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onOpenDetails(driver)}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
            >
              Review Video
            </button>
            <button
              onClick={() => onUnlockClick(driver)}
              className="btn-gold"
              style={{ flex: 1.3, padding: '10px', fontSize: '0.85rem' }}
            >
              <Lock size={15} /> Unlock Candidate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
