import React, { useState } from 'react';
import {
  Shield,
  Building,
  Scale,
  CheckCircle2,
  Copy
} from 'lucide-react';

export const LegalBlueprint: React.FC = () => {
  const [copiedAgreement, setCopiedAgreement] = useState(false);

  const sampleAgreementText = `HAULMATCH LOGISTICS RECRUITING — CLIENT STAFFING & RETENTION AGREEMENT
PARTIES: This Agreement is entered into between HaulMatch Recruiting LLC ("Agency") and Carrier ("Client").

1. CONTINGENT RECRUITING FEE:
Client agrees to pay Agency a total contingent fee of $4,500.00 USD for each Commercial Driver ("Candidate") introduced by Agency and engaged by Client.
Payment terms:
  a. Fifty percent (50% / $2,250.00) due upon Candidate's first day of dispatch / orientation.
  b. Fifty percent (50% / $2,250.00) due upon Candidate reaching ninety (90) calendar days of continuous employment.

2. NINETY-DAY (90-DAY) REPLACEMENT WARRANTY:
If Candidate voluntarily resigns or is terminated for substantiated safety/performance reasons prior to completing ninety (90) calendar days of service, Agency shall provide one (1) replacement qualified CDL driver at no additional recruitment charge.

3. NON-CIRCUMVENTION & DIRECT-HIRE PROTECTION:
Client agrees not to solicit, contact, or employ any Candidate introduced by Agency on a blind or unmasked basis for a period of twelve (12) months following initial introduction, without paying the full placement fee specified herein. In the event of a breach, Client shall be liable for the full placement fee plus all reasonable legal and collection costs.

4. CANDIDATE RETENTION INCENTIVE:
Client acknowledges that Agency will disburse a direct $1,500.00 Retention Bonus to Candidate upon ninety (90) days to ensure fleet continuity and mutual alignment.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleAgreementText);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Blueprint Header */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-emerald">US Compliance & Entity Guide</span>
            <span className="badge badge-blue">FMCSA Part 391</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>US Legal & Regulatory Blueprint</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Everything required to run a legally compliant logistics staffing agency in the United States.
          </p>
        </div>

        <button onClick={copyToClipboard} className="btn-secondary">
          <Copy size={16} /> {copiedAgreement ? 'Copied Contract!' : 'Copy Placement Contract'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* US Corporate Entity & Taxes */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', background: '#121315', color: '#f0a23b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>US Entity Formation & Taxes</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>1. Delaware or Wyoming LLC:</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Form a US LLC (via platforms like Stripe Atlas, Doola, or Firstbase). Offers high legal liability shielding and zero state corporate income tax for non-resident pass-through entities.
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--text-primary)' }}>2. IRS EIN (Employer Identification Number):</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Required to open a US commercial bank account and issue invoices to US trucking companies.
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--text-primary)' }}>3. US Commercial Banking:</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Open an account with Mercury Bank, Brex, or Relay (supports domestic ACH payments and wire transfers from logistics carriers).
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--text-primary)' }}>4. Tax Handling for the $1,500 Driver Bonus:</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Collect Form W-9 from drivers. Bonuses paid are 100% tax-deductible recruiting expenses for your LLC. If paying over $600/year to a driver, issue Form 1099-NEC.
              </p>
            </div>
          </div>
        </div>

        {/* FMCSA Mandatory Driver Qualification (DQ) File */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>FMCSA DQ File Requirements</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>CDL Class A/B with Correct Endorsements:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Verified valid in issuing state DMV database.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>DOT Medical Card (MCSA-5876):</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Must be signed by a certified Medical Examiner listed on National Registry.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>3-Year Motor Vehicle Record (MVR):</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Pulled within 30 days of pre-hire date to verify clean driving record.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>FMCSA Drug & Alcohol Clearinghouse:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Pre-employment full query consent required by federal law.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Safety Performance History:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>3-year prior employer inquiries for commercial safety violations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Template Preview Box */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={20} color="#b45309" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Client Placement & Retention Agreement (Template)</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Legally enforceable contingency agreement for US logistics clients
          </span>
        </div>

        <pre
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.55,
            maxHeight: '340px',
            overflowY: 'auto'
          }}
        >
          {sampleAgreementText}
        </pre>
      </div>
    </div>
  );
};
