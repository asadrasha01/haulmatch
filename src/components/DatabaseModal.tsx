import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Server,
  Check,
  ExternalLink
} from 'lucide-react';
import { getSupabaseConfig, setSupabaseCredentials } from '../services/supabase';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose, onConnectionChange }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      // Disconnect
      setSupabaseCredentials('', '');
      setStatusMessage({ type: 'success', text: 'Switched to Local Offline / Demo Storage.' });
      onConnectionChange();
      return;
    }

    const success = setSupabaseCredentials(url.trim(), anonKey.trim());
    if (success) {
      setStatusMessage({ type: 'success', text: 'Supabase connected successfully! Database & Video Storage are live.' });
      onConnectionChange();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to connect. Please check your Supabase Project URL and Anon Key.' });
    }
  };

  const copySqlMigration = () => {
    const sqlPath = 'supabase/migrations/20261104_init_schema.sql';
    navigator.clipboard.writeText(`-- Run this in your Supabase SQL Editor:
-- File located at: ${sqlPath}`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: currentConfig.isConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: currentConfig.isConfigured ? '#10b981' : '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Database & Cloud Storage Setup</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Connect live Supabase (PostgreSQL) and video storage or use local persistence.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Current Connection Status Pill */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: currentConfig.isConfigured ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            border: currentConfig.isConfigured ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: currentConfig.isConfigured ? '#10b981' : '#3b82f6',
                boxShadow: currentConfig.isConfigured ? '0 0 10px #10b981' : '0 0 10px #3b82f6'
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
              {currentConfig.isConfigured
                ? `Live Supabase Connected (${currentConfig.url})`
                : 'Local Offline Database Active (LocalStorage Mode)'}
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentConfig.isConfigured ? 'PostgreSQL Active' : 'Zero Setup Mode'}
          </span>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: statusMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
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
                style={{ fontSize: '0.75rem', color: 'var(--text-highlight)', display: 'flex', alignItems: 'center', gap: '3px' }}
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
            <button type="submit" className="btn-primary" style={{ marginLeft: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}>
              Save & Connect Database
            </button>
          </div>
        </form>

        {/* SQL Schema helper box */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Server size={15} color="#38bdf8" /> 1-Click PostgreSQL Schema
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              supabase/migrations/20261104_init_schema.sql
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
            To create the `drivers`, `video_interviews`, `placement_contracts`, and storage buckets in your Supabase project, run the migration file inside your Supabase <strong>SQL Editor</strong>.
          </p>

          <button
            type="button"
            onClick={copySqlMigration}
            className="btn-secondary"
            style={{ width: '100%', fontSize: '0.8rem', padding: '10px' }}
          >
            {copiedSql ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {copiedSql ? 'Schema File Path Copied!' : 'Copy SQL Migration Reference'}
          </button>
        </div>
      </div>
    </div>
  );
};
