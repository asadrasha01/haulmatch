import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Server,
  Check,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { getSupabaseConfig, setSupabaseCredentials, seedInitialDriversToSupabase } from '../services/supabase';
import initSchemaSql from '../../supabase/migrations/20261104_init_schema.sql?raw';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const PAPER = '#f3f0e9';
const AMBER = '#f0a23b';
const AMBER_TEXT = '#b86d0e';
const MUTED = '#5d5f63';
const RULE = 'rgba(18, 19, 21, 0.14)';
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace";

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose, onConnectionChange }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || 'https://qhjjvmarwhsqvpwuywhs.supabase.co');
  const [anonKey, setAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSeedCloud = async () => {
    setIsSeeding(true);
    setStatusMessage(null);
    const result = await seedInitialDriversToSupabase();
    setIsSeeding(false);
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Seeded ${result.count} verified CDL drivers, video interviews, and retention milestones to live Supabase!`
      });
      onConnectionChange();
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Seeding failed. Make sure you ran the SQL schema migration first.'
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setSupabaseCredentials('', '');
      setStatusMessage({ type: 'success', text: 'Switched to Local Offline / Demo Storage.' });
      onConnectionChange();
      return;
    }

    const success = setSupabaseCredentials(url.trim(), anonKey.trim());
    if (success) {
      setStatusMessage({ type: 'success', text: 'Supabase connected! Live PostgreSQL & Video Storage are active.' });
      onConnectionChange();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to connect. Please check your Supabase Project URL and Anon Key.' });
    }
  };

  const copySqlMigration = () => {
    navigator.clipboard.writeText(initSchemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Architectural Header Strip */}
        <div
          style={{
            background: DEEP,
            color: '#fff',
            padding: '18px 24px',
            borderBottom: `1px solid ${RULE}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(240, 162, 59, 0.14)',
                border: `1px solid ${AMBER}`,
                color: AMBER,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: AMBER }}>
                INFRASTRUCTURE // POSTGRESQL & R2 STORAGE
              </div>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#fff',
                  margin: 0
                }}
              >
                Database & Cloud Storage Setup
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Current Connection Status Strip */}
          <div
            style={{
              padding: '12px 16px',
              background: currentConfig.isConfigured ? '#ecfdf5' : PAPER,
              border: currentConfig.isConfigured ? '1px solid #a7f3d0' : `1px solid ${RULE}`,
              borderLeft: `4px solid ${currentConfig.isConfigured ? '#059669' : AMBER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  background: currentConfig.isConfigured ? '#059669' : AMBER_TEXT
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: INK }}>
                {currentConfig.isConfigured
                  ? `Live Supabase Connected (${currentConfig.url})`
                  : 'Local Offline Database Active (LocalStorage Mode)'}
              </span>
            </div>

            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase' }}>
              {currentConfig.isConfigured ? 'PostgreSQL Active' : 'Zero Setup Mode'}
            </span>
          </div>

          {/* Status Message Alert */}
          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                background: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                border: statusMessage.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                borderLeft: `3px solid ${statusMessage.type === 'success' ? '#059669' : '#dc2626'}`,
                color: statusMessage.type === 'success' ? '#047857' : '#dc2626',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSave} style={{ marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">
                <span>Supabase Project URL</span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.72rem', color: AMBER_TEXT, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Get Keys <ExternalLink size={11} />
                </a>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="https://your-project-id.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">Supabase Anon Key (Public API Key)</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              {currentConfig.isConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    setAnonKey('');
                    setSupabaseCredentials('', '');
                    onConnectionChange();
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem' }}
                >
                  Disconnect & Use Local Mode
                </button>
              )}
              <button type="submit" className="btn-primary" style={{ marginLeft: 'auto', padding: '11px 22px', fontSize: '0.9rem' }}>
                Save & Connect Database →
              </button>
            </div>
          </form>

          {/* SQL Schema helper box */}
          <div
            style={{
              borderTop: `1px solid ${RULE}`,
              paddingTop: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: INK, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={15} color={AMBER_TEXT} /> 1-Click Full PostgreSQL Schema & RLS
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                supabase/migrations/20261104_init_schema.sql
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: MUTED, marginBottom: '12px', lineHeight: 1.5 }}>
              Copies all 389 lines of SQL (`drivers`, `video_interviews`, `driver_documents`, `placement_contracts`,
              `retention_milestones`, `fleet_job_orders`, `profiles`, Storage buckets, and RLS policies) to paste
              directly into your Supabase <strong>SQL Editor</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={copySqlMigration}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.82rem', padding: '11px' }}
              >
                {copiedSql ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                {copiedSql ? 'Full SQL Migration Copied to Clipboard!' : 'Step 1: Copy Full SQL Migration Schema (450+ Lines)'}
              </button>

              {currentConfig.isConfigured && (
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={() => void handleSeedCloud()}
                  className="btn-gold"
                  style={{ width: '100%', fontSize: '0.82rem', padding: '11px' }}
                >
                  <UploadCloud size={15} />
                  {isSeeding
                    ? 'Seeding Initial Drivers & Contracts to Supabase...'
                    : 'Step 2: Seed Initial Drivers & Contracts to Supabase'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
