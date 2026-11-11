import React from 'react';
import { Truck, Users, BarChart3, Scale, Database, Briefcase, LogOut, ShieldAlert, ShieldCheck, Play } from 'lucide-react';
import type { UserRole, UserProfile } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeDriverCount: number;
  isSupabaseActive: boolean;
  onOpenDatabaseModal: () => void;
  profile: UserProfile | null;
  onSignOut: () => void;
  onStartTour?: () => void;
  isTourActive?: boolean;
}

interface NavTab {
  role: UserRole;
  code: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
  staffOnly: boolean;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const AMBER = '#f0a23b';
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace";
const BODY_FONT = "'Barlow', system-ui, sans-serif";

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeDriverCount,
  isSupabaseActive,
  onOpenDatabaseModal,
  profile,
  onSignOut,
  onStartTour,
  isTourActive
}) => {
  const showStaffOnlyTabs = !profile || profile.role === 'staff';

  const tabs: NavTab[] = [
    { role: 'driver', code: '01', label: 'Apply', icon: Truck, staffOnly: false },
    { role: 'cabin', code: '02', label: 'Driver Cabin', icon: ShieldCheck, staffOnly: false },
    { role: 'carrier', code: '03', label: `Carrier ATS (${activeDriverCount})`, icon: Users, staffOnly: false },
    { role: 'tracker', code: '04', label: '90-Day Tracker', icon: BarChart3, staffOnly: true },
    { role: 'packet', code: '05', label: 'Sales Packet', icon: Briefcase, staffOnly: true },
    { role: 'legal', code: '06', label: 'Legal', icon: Scale, staffOnly: true },
    { role: 'admin', code: '07', label: 'Admin Ops', icon: ShieldAlert, staffOnly: true }
  ];

  const visibleTabs = tabs.filter((t) => !t.staffOnly || showStaffOnlyTabs);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(12, 13, 15, 0.96)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: `3px solid ${AMBER}`,
        fontFamily: BODY_FONT
      }}
    >
      <div
        className="hm-portal-header-inner"
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '12px clamp(20px, 4vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        {/* Brand Logo — identical to DriverHome top bar */}
        <div
          onClick={() => onRoleChange('driver')}
          style={{ display: 'flex', alignItems: 'baseline', gap: 10, cursor: 'pointer', color: '#fff' }}
        >
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: '0.02em',
              color: '#fff'
            }}
          >
            HAULMATCH
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.55)'
            }}
          >
            CDL-A
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '2px 7px',
              background: 'rgba(240, 162, 59, 0.16)',
              border: `1px solid ${AMBER}`,
              color: AMBER,
              marginLeft: 4
            }}
          >
            PORTAL
          </span>
        </div>

        {/* Architectural Navigation Tabs */}
        <nav
          className="hm-portal-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            background: DEEP,
            flexWrap: 'wrap'
          }}
        >
          {visibleTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = currentRole === tab.role;
            return (
              <button
                key={tab.role}
                onClick={() => onRoleChange(tab.role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 15px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? INK : 'rgba(255, 255, 255, 0.78)',
                  background: isActive ? AMBER : 'transparent',
                  borderRight:
                    idx < visibleTabs.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease'
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    color: isActive ? 'rgba(18, 19, 21, 0.65)' : 'rgba(255, 255, 255, 0.4)'
                  }}
                >
                  {tab.code}
                </span>
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Account + DB Status + Driver Apply CTA */}
        <div className="hm-portal-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {profile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.16)'
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.05em',
                  color: '#fff'
                }}
              >
                {profile.companyName || profile.email}
                <span style={{ color: AMBER }}>
                  {' '}
                  · {profile.role === 'staff' ? 'STAFF' : 'CARRIER'}
                </span>
              </span>
              <button
                onClick={onSignOut}
                title="Sign out"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 6px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 0,
                  cursor: 'pointer'
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          )}

          {/* Guided Demo Tour Trigger */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 0,
                background: isTourActive ? 'rgba(240, 162, 59, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                border: isTourActive ? `1px solid ${AMBER}` : '1px solid rgba(255, 255, 255, 0.18)',
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.06em',
                color: isTourActive ? AMBER : 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer'
              }}
              title="Interactive 3-minute guided product tour"
            >
              <Play size={11} fill="currentColor" />
              <span>{isTourActive ? 'Tour Active' : 'Guided Tour'}</span>
            </button>
          )}

          {/* Database & Cloud Storage Status */}
          <button
            onClick={onOpenDatabaseModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 12px',
              borderRadius: 0,
              background: isSupabaseActive ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.06)',
              border: isSupabaseActive
                ? '1px solid rgba(52, 211, 153, 0.45)'
                : '1px solid rgba(255, 255, 255, 0.18)',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isSupabaseActive ? '#34d399' : 'rgba(255, 255, 255, 0.82)',
              cursor: 'pointer'
            }}
            title="Configure Supabase PostgreSQL or Cloudflare R2 video storage"
          >
            <Database size={13} />
            <span>{isSupabaseActive ? 'Supabase: Live' : 'Storage: Local'}</span>
          </button>

          {/* Driver Apply CTA — matches DriverHome top bar CTA */}
          <button
            onClick={() => onRoleChange('driver')}
            style={{
              padding: '9px 16px',
              background: AMBER,
              color: INK,
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>Driver Apply</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </header>
  );
};
