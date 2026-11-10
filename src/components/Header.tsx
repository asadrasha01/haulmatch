import { Truck, Users, BarChart3, Scale, DollarSign, Database, Briefcase, LogOut } from 'lucide-react';
import type { UserRole, UserProfile } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeDriverCount: number;
  isSupabaseActive: boolean;
  onOpenDatabaseModal: () => void;
  profile: UserProfile | null;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeDriverCount,
  isSupabaseActive,
  onOpenDatabaseModal,
  profile,
  onSignOut
}) => {
  // Staff see every internal tab. Signed-out visitors also see every tab
  // (clicking one routes them to AuthGate, which is how they discover these
  // features exist). Signed-in carrier clients only get the Carrier ATS —
  // the 90-Day Tracker, Carrier Sales Packet, and Legal tabs are internal
  // HaulMatch tools, so they're hidden rather than shown-then-denied.
  const showStaffOnlyTabs = !profile || profile.role === 'staff';
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(7, 11, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px'
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => onRoleChange('driver')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.45)'
            }}
          >
            <Truck size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                HaulMatch<span style={{ color: '#38bdf8' }}>.AI</span>
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                LIVE
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              US CDL-A Placement & 90-Day Retention Platform
            </div>
          </div>
        </div>

        {/* Navigation Tabs / Role Switcher */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px'
          }}
        >
          <button
            onClick={() => onRoleChange('driver')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: currentRole === 'driver' ? 'var(--primary-gradient)' : 'transparent',
              color: currentRole === 'driver' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: currentRole === 'driver' ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
            }}
          >
            <Truck size={15} /> Driver Funnel ($1.5k Bonus)
          </button>

          <button
            onClick={() => onRoleChange('carrier')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: currentRole === 'carrier' ? 'var(--primary-gradient)' : 'transparent',
              color: currentRole === 'carrier' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: currentRole === 'carrier' ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
            }}
          >
            <Users size={15} /> Carrier ATS ({activeDriverCount})
          </button>

          {showStaffOnlyTabs && (
            <button
              onClick={() => onRoleChange('tracker')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: currentRole === 'tracker' ? 'var(--primary-gradient)' : 'transparent',
                color: currentRole === 'tracker' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: currentRole === 'tracker' ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <BarChart3 size={15} /> 90-Day Tracker & ROI
            </button>
          )}

          {showStaffOnlyTabs && (
            <button
              onClick={() => onRoleChange('packet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: currentRole === 'packet' ? 'var(--primary-gradient)' : 'transparent',
                color: currentRole === 'packet' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: currentRole === 'packet' ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Briefcase size={15} /> Carrier Sales Packet
            </button>
          )}

          {showStaffOnlyTabs && (
            <button
              onClick={() => onRoleChange('legal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: currentRole === 'legal' ? 'var(--primary-gradient)' : 'transparent',
                color: currentRole === 'legal' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: currentRole === 'legal' ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Scale size={15} /> Legal & FMCSA
            </button>
          )}
        </nav>

        {/* Right CTA & DB Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Signed-in account pill (only rendered once a profile has loaded) */}
          {profile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 6px 6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {profile.companyName || profile.email}
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                  {' '}
                  · {profile.role === 'staff' ? 'Staff' : 'Carrier'}
                </span>
              </span>
              <button
                onClick={onSignOut}
                className="btn-icon"
                title="Sign out"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Database & Cloud Storage Pill Button */}
          <button
            onClick={onOpenDatabaseModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: isSupabaseActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              border: isSupabaseActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: isSupabaseActive ? '#34d399' : '#60a5fa',
              cursor: 'pointer'
            }}
            title="Click to configure Supabase or Cloudflare R2 video storage"
          >
            <Database size={13} />
            <span>{isSupabaseActive ? 'Supabase Live' : 'Storage: Local'}</span>
          </button>

          {currentRole !== 'driver' ? (
            <button
              onClick={() => onRoleChange('driver')}
              className="btn-gold"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <DollarSign size={15} /> Driver Apply Demo
            </button>
          ) : (
            <button
              onClick={() => onRoleChange('carrier')}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Users size={15} /> Switch to Carrier View
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
