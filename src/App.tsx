import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { DriverHero } from './components/DriverPortal/DriverHero';
import { ExpressApplicationForm } from './components/DriverPortal/ExpressApplicationForm';
import { INITIAL_DRIVERS } from './data/mockDrivers';

const AuthGate = lazy(() => import('./components/AuthGate').then((m) => ({ default: m.AuthGate })));
const CarrierDashboard = lazy(() =>
  import('./components/CarrierPortal/CarrierDashboard').then((m) => ({ default: m.CarrierDashboard }))
);
const RetentionTracker = lazy(() =>
  import('./components/RetentionTracker/RetentionTracker').then((m) => ({ default: m.RetentionTracker }))
);
const LegalBlueprint = lazy(() =>
  import('./components/LegalBlueprint/LegalBlueprint').then((m) => ({ default: m.LegalBlueprint }))
);
const CarrierPacket = lazy(() =>
  import('./components/CarrierPacket/CarrierPacket').then((m) => ({ default: m.CarrierPacket }))
);
const DatabaseModal = lazy(() =>
  import('./components/DatabaseModal').then((m) => ({ default: m.DatabaseModal }))
);
import type { DriverProfile, UserRole, UserProfile as AuthedUserProfile } from './types';
import {
  fetchAllDrivers,
  saveDriverToDatabase,
  recordPlacementContractInDB,
  isSupabaseConfigured,
  getCurrentSession,
  onAuthStateChange,
  fetchProfile,
  signOutUser
} from './services/supabase';
import { Truck } from 'lucide-react';

// Tabs beyond the public driver application that require a signed-in user.
// 'driver' is intentionally excluded — applicants should never need an
// account just to apply.
const INTERNAL_ROLES: UserRole[] = ['carrier', 'tracker', 'packet', 'legal'];
const CURRENT_YEAR = new Date().getFullYear();

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('driver');
  const [drivers, setDrivers] = useState<DriverProfile[]>(INITIAL_DRIVERS);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(isSupabaseConfigured());
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);

  // Real authentication state. 'driver' stays fully public; every other tab
  // is gated on `session` + `profile` below (see isAuthorizedForRole).
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthedUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Load drivers on mount (from live Supabase or local storage fallback)
  useEffect(() => {
    const loadData = async () => {
      try {
        const loaded = await fetchAllDrivers();
        if (loaded && loaded.length > 0) {
          setDrivers(loaded);
        }
      } catch (err) {
        console.warn('Error loading drivers:', err);
      }
    };
    loadData();
  }, [isSupabaseActive]);

  // Load the current Supabase Auth session (if any) on mount, then stay in
  // sync as the user signs in/out via AuthGate or the header's Sign Out
  // button. Re-runs if the Supabase connection itself changes (e.g. someone
  // connects a project for the first time via the Database modal).
  useEffect(() => {
    let isMounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      if (nextSession) {
        const loadedProfile = await fetchProfile(nextSession.user.id);
        if (isMounted) setProfile(loadedProfile);
      } else {
        setProfile(null);
      }
    };

    (async () => {
      const current = await getCurrentSession();
      await applySession(current);
      if (isMounted) setAuthLoading(false);
    })();

    const unsubscribe = onAuthStateChange((nextSession) => {
      applySession(nextSession);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isSupabaseActive]);

  // When a driver completes the express application & async video interview
  const handleDriverRegistered = async (newDriver: DriverProfile, videoBlob?: Blob) => {
    setDrivers((prev) => [newDriver, ...prev]);
    // Save to Database (Supabase + Cloud Storage or Local Storage).
    // videoBlob is the real recorded interview clip (when the browser's
    // camera/mic + MediaRecorder were available) — saveDriverToDatabase
    // uploads it to the `driver-interviews` bucket when present.
    await saveDriverToDatabase(newDriver, videoBlob);
  };

  // When a carrier signs the contingency placement agreement
  const handleContractSigned = async (driverId: string, carrierName: string) => {
    // 1. Optimistic UI update
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          return {
            ...d,
            status: 'unlocked' as const,
            unlockedAt: new Date().toISOString().split('T')[0],
            unlockedByCarrier: carrierName,
            placementDetails: {
              carrierName: carrierName,
              carrierContact: 'Authorized Fleet Representative',
              startDate: new Date().toISOString().split('T')[0],
              daysCompleted: 1,
              targetDays: 90,
              totalFee: 4500,
              feePaid: 2250,
              driverBonusPaid: false
            }
          };
        }
        return d;
      })
    );

    // 2. Persist to Supabase / Storage
    await recordPlacementContractInDB(driverId, carrierName, 'Authorized Officer', 'Recruiting Director');
  };

  const handleConnectionChanged = () => {
    setIsSupabaseActive(isSupabaseConfigured());
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentRole('driver');
  };

  // 'driver' is always open. Everything else requires a signed-in user;
  // staff can reach every internal tab, while a signed-in carrier can only
  // reach 'carrier' (the Carrier ATS) — the rest are internal HaulMatch
  // tools (see also Header.tsx's showStaffOnlyTabs, which hides those nav
  // buttons from carrier accounts entirely rather than show-then-deny).
  const isAuthorizedForRole = (role: UserRole): boolean => {
    if (role === 'driver') return true;
    if (!session || !profile) return false;
    if (profile.role === 'staff') return true;
    return role === 'carrier';
  };

  const canAccessCurrentRole = isAuthorizedForRole(currentRole);

  const scrollToApply = () => {
    const el = document.getElementById('driver-application');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeDriverCount={drivers.filter((d) => d.status === 'available').length}
        isSupabaseActive={isSupabaseActive}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        profile={profile}
        onSignOut={handleSignOut}
      />

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '32px 24px' }}>
        {currentRole === 'driver' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <DriverHero onStartApply={scrollToApply} />
            <div id="driver-application">
              <ExpressApplicationForm
                onDriverRegistered={handleDriverRegistered}
                onSwitchToCarrierView={() => setCurrentRole('carrier')}
              />
            </div>
          </div>
        )}

        {/* While the initial session check is still in flight, don't flash
            the sign-in gate at someone who's actually already logged in. */}
        {INTERNAL_ROLES.includes(currentRole) && authLoading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '80px' }}>
            Checking your session...
          </p>
        )}

        <Suspense
          fallback={
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '80px' }}>
              Loading view...
            </p>
          }
        >
          {INTERNAL_ROLES.includes(currentRole) && !authLoading && !canAccessCurrentRole && (
            <AuthGate
              context={currentRole as 'carrier' | 'tracker' | 'packet' | 'legal'}
              onBackToDriverView={() => setCurrentRole('driver')}
            />
          )}

          {currentRole === 'carrier' && canAccessCurrentRole && (
            <CarrierDashboard
              drivers={drivers}
              onContractSigned={handleContractSigned}
            />
          )}

          {currentRole === 'tracker' && canAccessCurrentRole && (
            <RetentionTracker drivers={drivers} />
          )}

          {currentRole === 'packet' && canAccessCurrentRole && (
            <CarrierPacket />
          )}

          {currentRole === 'legal' && canAccessCurrentRole && (
            <LegalBlueprint />
          )}
        </Suspense>
      </main>

      {/* Database Settings Modal */}
      {isDatabaseModalOpen && (
        <Suspense fallback={null}>
          <DatabaseModal
            isOpen={isDatabaseModalOpen}
            onClose={() => setIsDatabaseModalOpen(false)}
            onConnectionChange={handleConnectionChanged}
          />
        </Suspense>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(7, 11, 20, 0.95)',
          padding: '32px 24px',
          marginTop: 'auto'
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
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                HaulMatch AI Recruiting Network LLC
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Registered US Entity • FMCSA 49 CFR Part 391 & FCRA Compliant
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <button
              onClick={() => setCurrentRole('driver')}
              style={{ color: currentRole === 'driver' ? '#38bdf8' : 'inherit' }}
            >
              Driver Application ($1.5k Bonus)
            </button>
            <button
              onClick={() => setCurrentRole('carrier')}
              style={{ color: currentRole === 'carrier' ? '#38bdf8' : 'inherit' }}
            >
              Carrier Talent Pool
            </button>
            {/* Internal HaulMatch tools — hidden from signed-in carrier accounts,
                same rule as Header.tsx's showStaffOnlyTabs. */}
            {(!profile || profile.role === 'staff') && (
              <>
                <button
                  onClick={() => setCurrentRole('tracker')}
                  style={{ color: currentRole === 'tracker' ? '#38bdf8' : 'inherit' }}
                >
                  90-Day Retention Tracker
                </button>
                <button
                  onClick={() => setCurrentRole('packet')}
                  style={{ color: currentRole === 'packet' ? '#38bdf8' : 'inherit' }}
                >
                  Carrier Sales Packet
                </button>
                <button
                  onClick={() => setCurrentRole('legal')}
                  style={{ color: currentRole === 'legal' ? '#38bdf8' : 'inherit' }}
                >
                  Legal & Compliance
                </button>
              </>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © {CURRENT_YEAR} HaulMatch AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
