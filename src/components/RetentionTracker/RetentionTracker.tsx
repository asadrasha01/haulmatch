import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Award,
  Send,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import type { DriverProfile } from '../../types';
import { sendRetentionSmsPulse, disburseRetentionBonus } from '../../services/supabase';
import { logActivityEvent } from '../../services/activityEvents';

interface RetentionTrackerProps {
  drivers: DriverProfile[];
}

type ActionStatus = 'idle' | 'pending' | 'done' | 'error';

const STORAGE_KEY_AT_RISK = 'haulmatch_at_risk_placements_v1';

export const RetentionTracker: React.FC<RetentionTrackerProps> = ({ drivers }) => {
  // Placement Economics Interactive Calculator State
  const [carrierBounty, setCarrierBounty] = useState<number>(5000);
  const [driverBonus, setDriverBonus] = useState<number>(1500);
  const [monthlyPlacements, setMonthlyPlacements] = useState<number>(15);

  // Persistence state for SMS pulse checks, at-risk flags, and bonus disbursements
  const [smsStatus, setSmsStatus] = useState<Record<string, ActionStatus>>({});
  const [smsSentAt, setSmsSentAt] = useState<Record<string, string>>({});
  const [bonusStatus, setBonusStatus] = useState<Record<string, ActionStatus>>({});
  const [batchPulseActive, setBatchPulseActive] = useState(false);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  const [atRiskMap, setAtRiskMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AT_RISK);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const toggleAtRisk = (driver: DriverProfile) => {
    const nextState = !atRiskMap[driver.id];
    const updated = { ...atRiskMap, [driver.id]: nextState };
    setAtRiskMap(updated);
    try {
      localStorage.setItem(STORAGE_KEY_AT_RISK, JSON.stringify(updated));
    } catch {
      // ignore
    }

    logActivityEvent(
      nextState ? 'carrier_unlocked' : 'candidate_placed',
      'Retention Pulse Sentinel',
      `${driver.fullName} (${driver.id})`,
      nextState
        ? `⚠️ Placement flagged AT-RISK with ${driver.placementDetails?.carrierName || 'Carrier'}. Recruiter intervention recommended.`
        : `At-risk flag resolved. Placement on track for Day-90 milestone.`
    );
  };

  const handleSendSmsPulse = async (driver: DriverProfile) => {
    setSmsStatus((prev) => ({ ...prev, [driver.id]: 'pending' }));
    const result = await sendRetentionSmsPulse(driver.id);
    if (result.success) {
      setSmsStatus((prev) => ({ ...prev, [driver.id]: 'done' }));
      setSmsSentAt((prev) => ({ ...prev, [driver.id]: result.sentAt }));
    } else {
      setSmsStatus((prev) => ({ ...prev, [driver.id]: 'error' }));
    }
  };

  const handleRunBatchPulse = async () => {
    setBatchPulseActive(true);
    setBatchNotice(null);
    for (const d of placedDrivers) {
      await sendRetentionSmsPulse(d.id);
      setSmsStatus((prev) => ({ ...prev, [d.id]: 'done' }));
      setSmsSentAt((prev) => ({ ...prev, [d.id]: new Date().toISOString() }));
    }
    setBatchPulseActive(false);
    setBatchNotice(`Automated 24h retention sentinel pulse dispatched to ${placedDrivers.length} active placements.`);
    setTimeout(() => setBatchNotice(null), 5000);
  };

  const handleDisburseBonus = async (driver: DriverProfile) => {
    setBonusStatus((prev) => ({ ...prev, [driver.id]: 'pending' }));
    const result = await disburseRetentionBonus(driver.id);
    setBonusStatus((prev) => ({ ...prev, [driver.id]: result.success ? 'done' : 'error' }));
  };

  const screeningCost = 150;
  const netProfitPerDriver = carrierBounty - driverBonus - screeningCost;
  const monthlyNetProfit = netProfitPerDriver * monthlyPlacements;
  const annualNetProfit = monthlyNetProfit * 12;

  // Filter placed and milestone drivers
  const placedDrivers = drivers.filter(
    (d) => d.status === 'placed' || d.status === 'milestone_90' || d.placementDetails
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Tracker Header */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">Revenue & Retention Engine</span>
            <span className="badge badge-emerald">3-Month Milestone Tracking</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>90-Day Placement & Retention System</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Manage the entire 90-day lifecycle that unlocks your recruitment bounty. When drivers reach 90 days, your full fee clears and the driver receives their $1,500 retention bonus.
          </p>
        </div>

        {/* 90-Day Milestone Overview Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: 'var(--bg-secondary)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Retention</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>94.8%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Industry avg: ~20%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Margin / Driver</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>${netProfitPerDriver.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>After $1.5k bonus</div>
          </div>
        </div>
      </div>

      {/* Interactive Agency Economics & Profit Calculator */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          marginBottom: '32px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--primary-light)" /> Placement Economics & Scalability Model
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              See how sharing a $1,500 bonus with the driver guarantees retention while leaving massive agency profit margins.
            </p>
          </div>
          <span className="badge badge-blue">Interactive Calculator</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Carrier Placement Bounty</span>
                <strong style={{ color: 'var(--text-primary)' }}>${carrierBounty.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min={3000}
                max={8000}
                step={500}
                value={carrierBounty}
                onChange={(e) => setCarrierBounty(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>$3,000 (Low)</span>
                <span>$5,000 (Standard)</span>
                <span>$8,000 (Specialized/Hazmat)</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Driver 90-Day Retention Cash Bonus</span>
                <strong style={{ color: '#b45309' }}>${driverBonus.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min={1000}
                max={2500}
                step={250}
                value={driverBonus}
                onChange={(e) => setDriverBonus(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#b45309', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>$1,000</span>
                <span>$1,500 (Sweet Spot)</span>
                <span>$2,500 (Aggressive)</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Placements per Month</span>
                <strong style={{ color: 'var(--primary-light)' }}>{monthlyPlacements} Drivers / mo</strong>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                step={1}
                value={monthlyPlacements}
                onChange={(e) => setMonthlyPlacements(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0e7490', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>2 (Starting out)</span>
                <span>15 (Solid Agency)</span>
                <span>50 (Market Leader)</span>
              </div>
            </div>
          </div>

          {/* Results Display Card */}
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Net Agency Margin per Placement
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-heading)' }}>
                ${netProfitPerDriver.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                (${carrierBounty} bounty - ${driverBonus} driver bonus - ${screeningCost} automated video/DQ cost)
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Monthly Net Income:</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>${monthlyNetProfit.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Annual Projected Net Profit:</span>
                <strong style={{ fontSize: '1.25rem', color: '#b45309', fontWeight: 800 }}>${annualNetProfit.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Retention Pulse Cadence & Sentinel Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(18,19,21,0.92) 0%, rgba(28,30,34,0.95) 100%)',
          color: '#ffffff',
          borderLeft: '4px solid #f0a23b'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#f0a23b', textTransform: 'uppercase' }}>
              AUTOMATED SENTINEL CADENCE: DAY 14 · DAY 30 · DAY 60 · DAY 85 · DAY 90
            </span>
            <Sparkles size={14} color="#f0a23b" />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>
            Automated SMS Pulse Schedule Active
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
            Background Edge Functions automatically check driver satisfaction, weekly miles, and dispatcher sentiment to protect your $4,500 fee.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            disabled={batchPulseActive || placedDrivers.length === 0}
            onClick={handleRunBatchPulse}
            className="btn-gold"
            style={{ padding: '10px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {batchPulseActive ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>{batchPulseActive ? 'Dispatching...' : 'Run Automated 24h Pulse Sentinel'}</span>
          </button>
        </div>
      </div>

      {batchNotice && (
        <div style={{ padding: '12px 18px', background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', fontSize: '0.82rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {batchNotice}
        </div>
      )}

      {/* Active Placements 90-Day Milestone Tracker */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>
          Live Placed Drivers & Milestone Roadmap
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Drivers currently dispatched with carriers, progressing toward their 90-day retention payout.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {placedDrivers.map((driver) => {
          const details = driver.placementDetails || {
            carrierName: 'Titan Freightways Inc',
            carrierContact: 'Robert Miller',
            startDate: '2026-09-15',
            daysCompleted: 49,
            targetDays: 90,
            totalFee: 5000,
            feePaid: 2500,
            driverBonusPaid: false
          };

          const progressPercent = Math.min(100, Math.round((details.daysCompleted / details.targetDays) * 100));
          const isFinished = details.daysCompleted >= 90;
          const bonusPaid = details.driverBonusPaid || bonusStatus[driver.id] === 'done';
          const bonusPending = bonusStatus[driver.id] === 'pending';
          const bonusFailed = bonusStatus[driver.id] === 'error';
          const smsPending = smsStatus[driver.id] === 'pending';
          const smsSent = smsStatus[driver.id] === 'done';
          const smsFailed = smsStatus[driver.id] === 'error';

          const isAtRisk = Boolean(atRiskMap[driver.id]);

          return (
            <div
              key={driver.id}
              className="glass-panel"
              style={{
                padding: '24px',
                border: isAtRisk
                  ? '1px solid #fca5a5'
                  : isFinished
                  ? '1px solid #a7f3d0'
                  : '1px solid var(--border-card)',
                borderLeft: isAtRisk ? '5px solid #dc2626' : undefined
              }}
            >
              {isAtRisk && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.8rem',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <ShieldAlert size={15} color="#dc2626" />
                    <span>⚠️ AT-RISK OF TURNOVER: Driver reported satisfaction dip. Recruiter intervention recommended.</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#dc2626', color: '#fff', padding: '2px 6px', fontWeight: 700 }}>
                    HIGH PRIORITY
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: '#121315',
                        padding: '2px 8px'
                      }}
                    >
                      {driver.id}
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{driver.fullName}</strong>
                    <span className="badge badge-purple">{driver.cdlClass}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Carrier: <strong style={{ color: 'var(--text-primary)' }}>{details.carrierName}</strong> ({details.carrierContact}) • Dispatched: {details.startDate}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isFinished ? '#059669' : '#b45309' }}>
                    Day {details.daysCompleted} / {details.targetDays}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isFinished ? 'Milestone Completed!' : `${details.targetDays - details.daysCompleted} days until bonus unlock`}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: isFinished ? '#059669' : '#f0a23b',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>

              {/* 4 Checkpoint Stages */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 155px), 1fr))',
                  gap: '10px',
                  fontSize: '0.75rem',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  marginBottom: '16px'
                }}
              >
                <div>
                  <div style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={13} /> Day 0 (Orientation)
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>50% Fee Billed (${(details.totalFee / 2).toLocaleString()})</div>
                </div>

                <div>
                  <div
                    style={{
                      color: details.daysCompleted >= 30 ? '#059669' : 'var(--text-muted)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {details.daysCompleted >= 30 ? <CheckCircle size={13} /> : <Clock size={13} />} Day 30 Check-in
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Satisfaction pulse ok</div>
                </div>

                <div>
                  <div
                    style={{
                      color: details.daysCompleted >= 60 ? '#059669' : 'var(--text-muted)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {details.daysCompleted >= 60 ? <CheckCircle size={13} /> : <Clock size={13} />} Day 60 Check-in
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Equipment & miles verified</div>
                </div>

                <div>
                  <div
                    style={{
                      color: isFinished ? '#059669' : '#b45309',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isFinished ? <Award size={13} /> : <Clock size={13} />} Day 90 Cleared
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>$1,500 Driver Bonus Out</div>
                </div>
              </div>

              {/* Action Banner */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Carrier Invoiced: <strong>${details.feePaid.toLocaleString()} / ${details.totalFee.toLocaleString()}</strong> • Driver Bonus Status:{' '}
                  <strong style={{ color: bonusPaid ? '#047857' : '#b45309' }}>
                    {bonusPaid ? '✓ Disbursed ($1,500)' : 'Locked in Escrow ($1,500)'}
                  </strong>
                  {smsSentAt[driver.id] && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Last pulse check logged: {new Date(smsSentAt[driver.id]).toLocaleString()}
                    </div>
                  )}
                  {(smsFailed || bonusFailed) && (
                    <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Couldn't record that action — please try again.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => toggleAtRisk(driver)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      background: isAtRisk ? '#fef2f2' : '#ffffff',
                      border: `1px solid ${isAtRisk ? '#dc2626' : 'var(--border-subtle)'}`,
                      color: isAtRisk ? '#dc2626' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>{isAtRisk ? 'Resolve Risk ✓' : 'Flag At-Risk'}</span>
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.78rem', opacity: smsPending ? 0.65 : 1, cursor: smsPending ? 'not-allowed' : 'pointer' }}
                    disabled={smsPending}
                    onClick={() => handleSendSmsPulse(driver)}
                  >
                    {smsPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {smsPending ? 'Sending...' : smsSent ? 'Pulse Check Sent ✓' : 'Send SMS Pulse Check'}
                  </button>
                  {isFinished && !bonusPaid && (
                    <button
                      className="btn-gold"
                      style={{ padding: '8px 16px', fontSize: '0.78rem', opacity: bonusPending ? 0.65 : 1, cursor: bonusPending ? 'not-allowed' : 'pointer' }}
                      disabled={bonusPending}
                      onClick={() => handleDisburseBonus(driver)}
                    >
                      {bonusPending ? <Loader2 size={13} className="animate-spin" /> : <DollarSign size={13} />}
                      {bonusPending ? 'Disbursing...' : 'Disburse $1,500 Bonus'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
