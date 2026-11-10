import React, { useState } from 'react';
import { Lock, AlertCircle, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '../services/supabase';
import type { AuthRole, UserRole } from '../types';

interface AuthGateProps {
  // Which internal tab the user was trying to reach when they got gated —
  // used only to tailor the headline copy below.
  context: Extract<UserRole, 'carrier' | 'tracker' | 'packet' | 'legal'>;
  onBackToDriverView: () => void;
}

const CONTEXT_LABEL: Record<AuthGateProps['context'], string> = {
  carrier: 'the Carrier ATS',
  tracker: 'the 90-Day Retention Tracker',
  packet: 'the Carrier Sales Packet',
  legal: 'Legal & Compliance'
};

export const AuthGate: React.FC<AuthGateProps> = ({ context, onBackToDriverView }) => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('carrier');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result =
      mode === 'signIn'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, role, role === 'carrier' ? companyName : undefined);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Something went wrong. Please try again.');
      return;
    }

    if (mode === 'signUp') {
      setSignUpSuccess(true);
      return;
    }

    // On sign-in, App.tsx's onAuthStateChange listener picks up the new
    // session automatically and swaps this gate out for the real content —
    // nothing else to do here.
  };

  return (
    <div style={{ maxWidth: '460px', margin: '60px auto' }}>
      <div className="glass-panel" style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Lock size={26} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>Sign in required</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {CONTEXT_LABEL[context]} is restricted to signed-in carrier clients and HaulMatch staff.
          </p>
        </div>

        {!configured && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '0.8rem',
              marginBottom: '18px',
              textAlign: 'left',
              display: 'flex',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              No live database connected yet. Open the Database icon in the header and connect a Supabase project
              before signing in or creating an account — authentication needs a real backend.
            </span>
          </div>
        )}

        {signUpSuccess ? (
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}
          >
            Account created! If your Supabase project requires email confirmation, check your inbox first — then
            sign in below.
            <button
              type="button"
              onClick={() => {
                setSignUpSuccess(false);
                setMode('signIn');
              }}
              className="btn-secondary"
              style={{ marginTop: '12px', width: '100%', fontSize: '0.82rem' }}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            {mode === 'signUp' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setRole('carrier')}
                  className={role === 'carrier' ? 'btn-primary' : 'btn-secondary'}
                  style={{ flex: 1, fontSize: '0.8rem', padding: '9px' }}
                >
                  <Users size={14} style={{ marginRight: '4px' }} /> Carrier / Fleet
                </button>
                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={role === 'staff' ? 'btn-primary' : 'btn-secondary'}
                  style={{ flex: 1, fontSize: '0.8rem', padding: '9px' }}
                >
                  <ShieldCheck size={14} style={{ marginRight: '4px' }} /> HaulMatch Staff
                </button>
              </div>
            )}

            {mode === 'signUp' && role === 'carrier' && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Company Name</label>
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

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Email</label>
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

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Password</label>
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
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginBottom: '14px'
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px', marginBottom: '12px', justifyContent: 'center' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Please wait...' : mode === 'signIn' ? 'Sign In' : 'Create Account'}
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                setError(null);
              }}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            type="button"
            onClick={onBackToDriverView}
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none' }}
          >
            ← Back to Driver Application
          </button>
        </div>
      </div>
    </div>
  );
};
