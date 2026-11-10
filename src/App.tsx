import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import type { Session } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { DriverHome, type QuickStartPrefill } from './components/DriverHome/DriverHome';
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
import type { AuthRole, DriverProfile, UserRole, UserProfile as AuthedUserProfile } from './types';
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
  const [quickStartPrefill, setQuickStartPrefill] = useState<QuickStartPrefill | null>(null);

  // Real authentication state. 'driver' stays fully public; every other tab
  // is gated on `profile` below (see isAuthorizedForRole).
  const [profile, setProfile] = useState<AuthedUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger
  // animations stay perfectly in sync with the smoothed scroll position.
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

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
      if (nextSession) {
        const loadedProfile = await fetchProfile(nextSession.user.id);
        if (isMounted) setProfile(loadedProfile);
      } else {
        setProfile((prev) => (prev?.id.startsWith('demo-') ? prev : null));
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
  const handleContractSigned = async (
    driverId: string,
    carrierName: string,
    signerName = 'Authorized Officer',
    signerTitle = 'Recruiting Director'
  ) => {
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
              carrierContact: `${signerName} (${signerTitle})`,
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
    await recordPlacementContractInDB(driverId, carrierName, signerName, signerTitle);
  };

  const handleConnectionChanged = () => {
    setIsSupabaseActive(isSupabaseConfigured());
  };

  const handleDemoAccess = (demoRole: AuthRole) => {
    setProfile({
      id: `demo-${demoRole}`,
      email: demoRole === 'staff' ? 'staff@haulmatch.ai' : 'recruiting@swiftline.com',
      role: demoRole,
      companyName: demoRole === 'staff' ? 'HaulMatch Staff' : 'Swiftline Logistics'
    });
    if (demoRole === 'carrier' && currentRole !== 'carrier') {
      setCurrentRole('carrier');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setProfile(null);
    setCurrentRole('driver');
  };

  // 'driver' is always open. Everything else requires a signed-in user (or
  // sandbox demo profile); staff can reach every internal tab, while a
  // carrier can only reach 'carrier' (the Carrier ATS).
  const isAuthorizedForRole = (role: UserRole): boolean => {
    if (role === 'driver') return true;
    if (!profile) return false;
    if (profile.role === 'staff') return true;
    return role === 'carrier';
  };

  const canAccessCurrentRole = isAuthorizedForRole(currentRole);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -24, duration: 1.2 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickStart = (prefill: QuickStartPrefill) => {
    setQuickStartPrefill({ ...prefill });
    scrollToId('driver-application');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation — shown on internal/carrier views; DriverHome has its own public header */}
      {currentRole !== 'driver' && (
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          activeDriverCount={drivers.filter((d) => d.status === 'available').length}
          isSupabaseActive={isSupabaseActive}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          profile={profile}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Content Viewport — cross-fade/slide between role views */}
      <main style={{ flex: 1, padding: currentRole === 'driver' ? 0 : 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 24px)' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
        {currentRole === 'driver' && (
          <DriverHome
            onCarrierLogin={() => setCurrentRole('carrier')}
            onQuickStart={handleQuickStart}
            scrollToId={scrollToId}
            applicationSlot={
              <ExpressApplicationForm
                key={
                  quickStartPrefill
                    ? `${quickStartPrefill.cdlClass}-${quickStartPrefill.yearsExperience}-${quickStartPrefill.zip}`
                    : 'default'
                }
                prefill={quickStartPrefill}
                onDriverRegistered={handleDriverRegistered}
                onSwitchToCarrierView={() => setCurrentRole('carrier')}
              />
            }
          />
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
              onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
              onDemoAccess={handleDemoAccess}
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
          </motion.div>
        </AnimatePresence>
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

      {/* Footer — shown on internal/carrier views; DriverHome includes its own handoff footer */}
      {currentRole !== 'driver' && (
        <footer
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: '#0c0d0f',
            padding: '28px clamp(20px, 4vw, 48px)',
            marginTop: 'auto'
          }}
        >
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px 32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(240, 162, 59, 0.14)',
                border: '1px solid #f0a23b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f0a23b'
              }}
            >
              <Truck size={16} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  color: '#ffffff'
                }}
              >
                HAULMATCH
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                FMCSA 49 CFR PART 391 & FCRA COMPLIANT
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)' }}>
            <button
              onClick={() => setCurrentRole('driver')}
              style={{ color: 'inherit' }}
            >
              Driver Application ($1.5k Bonus)
            </button>
            <button
              onClick={() => setCurrentRole('carrier')}
              style={{ color: currentRole === 'carrier' ? '#f0a23b' : 'inherit' }}
            >
              Carrier Talent Pool
            </button>
            {(!profile || profile.role === 'staff') && (
              <>
                <button
                  onClick={() => setCurrentRole('tracker')}
                  style={{ color: currentRole === 'tracker' ? '#f0a23b' : 'inherit' }}
                >
                  90-Day Retention Tracker
                </button>
                <button
                  onClick={() => setCurrentRole('packet')}
                  style={{ color: currentRole === 'packet' ? '#f0a23b' : 'inherit' }}
                >
                  Carrier Sales Packet
                </button>
                <button
                  onClick={() => setCurrentRole('legal')}
                  style={{ color: currentRole === 'legal' ? '#f0a23b' : 'inherit' }}
                >
                  Legal & Compliance
                </button>
              </>
            )}
          </div>

          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.72rem',
              letterSpacing: '0.06em',
              color: 'rgba(255, 255, 255, 0.45)'
            }}
          >
            © {CURRENT_YEAR} HAULMATCH AI
          </div>
        </div>
        </footer>
      )}
    </div>
  );
};

export default App;
