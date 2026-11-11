import React, { useState } from 'react';
import { Lock, AlertCircle, Users, ShieldCheck, ArrowRight, Database, Sparkles, KeyRound } from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPasswordForEmail,
  isSupabaseConfigured
} from '../services/supabase';
import type { AuthRole, UserRole } from '../types';

interface AuthGateProps {
  context: Extract<UserRole, 'carrier' | 'tracker' | 'packet' | 'legal' | 'admin'>;
  onBackToDriverView: () => void;
  onOpenDatabaseModal?: () => void;
  onDemoAccess?: (role: AuthRole) => void;
}

const CONTEXT_LABEL: Record<AuthGateProps['context'], string> = {
  carrier: 'Carrier ATS & Blind Candidate Pool',
  tracker: '90-Day Retention & Bounty Tracker',
  packet: 'Carrier Fleet Sales & Intake Packet',
  legal: 'Legal & FMCSA Compliance Blueprint',
  admin: 'Admin Operations Command Center'
};

const CONTEXT_CODE: Record<AuthGateProps['context'], string> = {
  carrier: 'SEC-02 // CARRIER ATS',
  tracker: 'SEC-03 // RETENTION ENGINE',
  packet: 'SEC-04 // FLEET INTAKE',
  legal: 'SEC-05 // COMPLIANCE',
  admin: 'SEC-06 // ADMIN OPS'
};

const INK = '#121315';
const DEEP = '#0c0d0f';
const PAPER = '#f3f0e9';
const PAPER_ALT = '#e9e5dc';
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

export const AuthGate: React.FC<AuthGateProps> = ({
  context,
  onBackToDriverView,
  onOpenDatabaseModal,
  onDemoAccess
}) => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'resetPassword'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('carrier');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === 'resetPassword') {
      const result = await resetPasswordForEmail(email);
      setIsSubmitting(false);
      if (!result.success) {
        setError(result.error || 'Failed to dispatch password reset email.');
        return;
      }
      setResetSuccess(true);
      return;
    }

    const result =
      mode === 'signIn'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, role, role === 'carrier' ? companyName : undefined);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Something went wrong. Please try again.');
      return;
    }

    if (mode === 'signUp' && !result.autoSignedIn) {
      setSignUpSuccess(true);
      return;
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    const result = await signInWithGoogle(
      context === 'carrier' ? role : 'staff',
      role === 'carrier' ? companyName || 'Partner Carrier Fleet' : 'HaulMatch Staff'
    );
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Google sign-in failed.');
    }
  };

  return (
    <div
      style={{
        maxWidth: 980,
        margin: '28px auto 64px',
        fontFamily: BODY_FONT,
        color: INK
      }}
    >
      {/* Editorial Top Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 14,
          marginBottom: 24,
          borderBottom: `1px solid ${RULE}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              background: AMBER,
              display: 'inline-block'
            }}
          />
          <span style={monoStyle(11, INK, '0.1em')}>{CONTEXT_CODE[context]}</span>
        </div>
        <button
          type="button"
          onClick={onBackToDriverView}
          style={{
            ...monoStyle(11, MUTED, '0.08em'),
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Back to Driver Home & Application
        </button>
      </div>

      {/* Architectural 2-Column Dossier Frame */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          border: `1px solid ${RULE}`,
          borderTop: `3px solid ${INK}`,
          background: '#fff'
        }}
      >
        {/* Left Column: Dark Editorial Context & Demo Quick-Enter */}
        <div
          style={{
            background: DEEP,
            color: '#fff',
            padding: 'clamp(28px, 4vw, 44px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 28,
            borderRight: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  background: 'rgba(240, 162, 59, 0.14)',
                  border: `1px solid ${AMBER}`,
                  color: AMBER,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Lock size={16} />
              </span>
              <span style={monoStyle(11, AMBER, '0.1em')}>RESTRICTED PORTAL ACCESS</span>
            </div>

            <h1
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 'clamp(36px, 4.5vw, 54px)',
                lineHeight: 0.94,
                textTransform: 'uppercase',
                color: '#fff',
                margin: '0 0 14px'
              }}
            >
              Sign in required.
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)', marginBottom: 24 }}>
              Access to <strong style={{ color: '#fff' }}>{CONTEXT_LABEL[context]}</strong> is restricted to verified
              carrier partners and internal HaulMatch recruiting staff.
            </p>

            {/* Key Portal Capabilities */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.12)',
                paddingTop: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              {[
                ['BLIND PROFILES', 'Watch 2-min driver intro clips & AI fluency scores before unlocking PII.'],
                ['FMCSA PART 391 DQ', 'OCR-verified CDL Class A/B, DOT Medical Certs & 3-year clean MVR status.'],
                ['90-DAY WARRANTY', '$4,500 split contingency fee with $1,500 driver stay bonus at day 90.']
              ].map(([code, copy]) => (
                <div key={code} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, fontSize: 13 }}>
                  <span style={monoStyle(10, AMBER, '0.08em')}>{code}</span>
                  <span style={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.45 }}>{copy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instant Demo Preview Box (gated in production by VITE_DEMO_MODE) */}
          {isDemoMode && onDemoAccess && (
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(240, 162, 59, 0.35)',
                padding: '18px 20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={14} color={AMBER} />
                <span style={monoStyle(11, AMBER, '0.08em')}>INSTANT SANDBOX PREVIEW</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, marginBottom: 14 }}>
                Evaluating the platform locally? Enter immediately with a pre-configured session to inspect all portal
                workflows:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onDemoAccess('staff')}
                  style={{
                    padding: '11px 12px',
                    background: AMBER,
                    color: INK,
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: MONO,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: 0,
                    cursor: 'pointer'
                  }}
                >
                  Enter Staff Demo →
                </button>
                <button
                  type="button"
                  onClick={() => onDemoAccess('carrier')}
                  style={{
                    padding: '11px 12px',
                    background: 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: MONO,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 0,
                    cursor: 'pointer'
                  }}
                >
                  Carrier ATS Demo →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Supabase Credentials Sign-In / Sign-Up Form */}
        <div style={{ padding: 'clamp(28px, 4vw, 44px)', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Mode Switcher Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                marginBottom: 22,
                borderBottom: `1px solid ${RULE}`
              }}
            >
              <div>
                <div style={monoStyle(11, AMBER_TEXT, '0.08em')}>
                  {mode === 'signIn' ? 'EXISTING ACCOUNT' : 'NEW PARTNER REGISTRATION'}
                </div>
                <h2
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 800,
                    fontSize: 28,
                    textTransform: 'uppercase',
                    color: INK,
                    margin: '2px 0 0'
                  }}
                >
                  {mode === 'signIn' ? 'Account Sign In' : 'Create Portal Account'}
                </h2>
              </div>

              <div style={{ display: 'flex', border: `1px solid ${INK}` }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signIn');
                    setError(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    background: mode === 'signIn' ? INK : '#fff',
                    color: mode === 'signIn' ? '#fff' : INK,
                    border: 'none',
                    borderRadius: 0,
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signUp');
                    setError(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    background: mode === 'signUp' ? INK : '#fff',
                    color: mode === 'signUp' ? '#fff' : INK,
                    border: 'none',
                    borderRadius: 0,
                    cursor: 'pointer'
                  }}
                >
                  Register
                </button>
              </div>
            </div>

            {!configured && (
              <div
                style={{
                  padding: '14px 16px',
                  background: PAPER,
                  border: `1px solid ${RULE}`,
                  borderLeft: `3px solid ${AMBER}`,
                  color: INK,
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <AlertCircle size={16} color={AMBER_TEXT} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Local Auth Mode Active:</strong> You can register a new account and sign in right below
                    (persisted in local storage), or connect a live Supabase project for cloud auth.
                  </span>
                </div>
                {onOpenDatabaseModal && (
                  <button
                    type="button"
                    onClick={onOpenDatabaseModal}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: '#fff',
                      border: `1px solid ${INK}`,
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: INK,
                      cursor: 'pointer'
                    }}
                  >
                    <Database size={12} /> Connect Supabase Project →
                  </button>
                )}
              </div>
            )}

            {mode === 'resetPassword' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <KeyRound size={16} color={AMBER_TEXT} />
                  <span style={monoStyle(11, AMBER_TEXT, '0.08em')}>PASSWORD RESET RECOVERY</span>
                </div>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 18 }}>
                  Enter your verified account email. We will dispatch a secure password reset link to your inbox.
                </p>

                {resetSuccess ? (
                  <div
                    style={{
                      padding: 18,
                      background: PAPER,
                      border: `1px solid ${INK}`,
                      borderLeft: '4px solid #059669',
                      color: INK,
                      fontSize: 14,
                      lineHeight: 1.5
                    }}
                  >
                    <div style={{ ...monoStyle(11, '#047857', '0.08em'), marginBottom: 6 }}>RESET LINK DISPATCHED</div>
                    Password reset link sent to <strong>{email}</strong>! Check your inbox to set a new password.
                    <button
                      type="button"
                      onClick={() => {
                        setResetSuccess(false);
                        setMode('signIn');
                      }}
                      className="btn-secondary"
                      style={{ marginTop: 14, width: '100%' }}
                    >
                      Proceed to Sign In →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Corporate Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                      />
                    </div>

                    {error && (
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderLeft: '3px solid #dc2626',
                          color: '#b91c1c',
                          fontSize: 13,
                          marginBottom: 16
                        }}
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        marginBottom: 10,
                        justifyContent: 'space-between',
                        fontSize: 15
                      }}
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
                      <ArrowRight size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('signIn');
                        setError(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: PAPER_ALT,
                        border: `1px solid ${RULE}`,
                        color: INK,
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 0,
                        cursor: 'pointer'
                      }}
                    >
                      ← Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            ) : signUpSuccess ? (
              <div
                style={{
                  padding: 18,
                  background: PAPER,
                  border: `1px solid ${INK}`,
                  borderLeft: '4px solid #059669',
                  color: INK,
                  fontSize: 14,
                  lineHeight: 1.5
                }}
              >
                <div style={{ ...monoStyle(11, '#047857', '0.08em'), marginBottom: 6 }}>ACCOUNT CREATED</div>
                Your account has been registered. If your Supabase project requires email confirmation, check your
                inbox first — then sign in below.
                <button
                  type="button"
                  onClick={() => {
                    setSignUpSuccess(false);
                    setMode('signIn');
                  }}
                  className="btn-secondary"
                  style={{ marginTop: 14, width: '100%' }}
                >
                  Proceed to Sign In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* 1-Click Google OAuth / Free Google Sign-In */}
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    background: '#fff',
                    border: `1px solid ${INK}`,
                    color: INK,
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    borderRadius: 0,
                    marginBottom: 16
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 16
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: RULE }} />
                  <span style={monoStyle(10, MUTED, '0.08em')}>OR EMAIL & PASSWORD</span>
                  <div style={{ flex: 1, height: 1, background: RULE }} />
                </div>

                {isDemoMode && mode === 'signIn' && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(240, 162, 59, 0.08)',
                      border: '1px solid rgba(240, 162, 59, 0.35)',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}
                  >
                    <div>
                      <div style={monoStyle(10, AMBER_TEXT, '0.08em')}>DEFAULT ADMIN CREDENTIALS</div>
                      <div style={{ fontSize: 13, marginTop: 2, color: INK }}>
                        <strong>admin@haulmatch.ai</strong> · <span style={{ fontFamily: MONO, fontSize: 12 }}>password123</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@haulmatch.ai');
                        setPassword('password123');
                      }}
                      style={{
                        ...monoStyle(10, INK),
                        fontWeight: 700,
                        padding: '6px 12px',
                        background: AMBER,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Autofill Admin →
                    </button>
                  </div>
                )}

                {mode === 'signUp' && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" style={{ marginBottom: 6 }}>
                      Account Role
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setRole('carrier')}
                        style={{
                          padding: '11px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          border: `1px solid ${role === 'carrier' ? INK : 'rgba(18,19,21,0.25)'}`,
                          background: role === 'carrier' ? INK : '#fff',
                          color: role === 'carrier' ? '#fff' : INK,
                          borderRadius: 0,
                          cursor: 'pointer'
                        }}
                      >
                        <Users size={14} /> Carrier / Fleet
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('staff')}
                        style={{
                          padding: '11px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          border: `1px solid ${role === 'staff' ? INK : 'rgba(18,19,21,0.25)'}`,
                          background: role === 'staff' ? INK : '#fff',
                          color: role === 'staff' ? '#fff' : INK,
                          borderRadius: 0,
                          cursor: 'pointer'
                        }}
                      >
                        <ShieldCheck size={14} /> HaulMatch Staff
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signUp' && role === 'carrier' && (
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Carrier / Fleet Company Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Swiftline Global Logistics LLC"
                      required
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Corporate Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    {mode === 'signIn' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('resetPassword');
                          setError(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: 12,
                          color: AMBER_TEXT,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                  />
                </div>

                {error && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderLeft: '3px solid #dc2626',
                      color: '#b91c1c',
                      fontSize: 13,
                      marginBottom: 16
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    marginBottom: 10,
                    justifyContent: 'space-between',
                    fontSize: 16
                  }}
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Authenticating...' : mode === 'signIn' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                    setError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: PAPER_ALT,
                    border: `1px solid ${RULE}`,
                    color: INK,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 0,
                    cursor: 'pointer'
                  }}
                >
                  {mode === 'signIn' ? "Don't have an account? Register here →" : 'Already registered? Sign in →'}
                </button>
              </form>
            )}
          </div>

          <div
            style={{
              marginTop: 22,
              paddingTop: 14,
              borderTop: `1px solid ${RULE}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: MUTED
            }}
          >
            <span style={monoStyle(10, MUTED)}>SUPABASE AUTH · RLS PROTECTED</span>
            <button
              type="button"
              onClick={onBackToDriverView}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: INK,
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ← Back to Driver Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
