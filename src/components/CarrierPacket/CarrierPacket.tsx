import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { saveFleetJobOrder, fetchFleetJobOrders } from '../../services/supabase';
import type { FleetJobOrder } from '../../types';

const INITIAL_CREATED_DATE = new Date().toISOString().split('T')[0];

export const CarrierPacket: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rateCard' | 'intakeForm' | 'agreement'>('rateCard');
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Fleet Intake Form State
  const [intakeData, setIntakeData] = useState<FleetJobOrder>({
    id: 'JO-8921',
    companyName: 'Swiftline Global Logistics LLC',
    dotNumber: '3819204',
    mcNumber: 'MC-149201',
    contactName: 'Robert Miller',
    contactTitle: 'VP of Safety & Fleet Recruiting',
    contactEmail: 'r.miller@swiftlinelogistics.com',
    contactPhone: '(214) 555-0199',
    driversNeeded: 10,
    equipmentType: ['Refrigerated (Reefer)', 'Dry Van'],
    transmission: 'Automatic',
    minExperienceYears: 2,
    maxViolations3Years: 1,
    hometimeCadence: 'Home Every 2 Weeks (34-48hr reset)',
    payPerMile: '$0.70 - $0.74 CPM',
    avgWeeklyMiles: '2,800 - 3,200 Miles',
    guaranteedWeeklyMin: '$1,850/week guaranteed',
    petPolicy: true,
    passengerPolicy: true,
    operatingLanes: 'Southwest, Midwest, and Southeast corridors',
    createdAt: INITIAL_CREATED_DATE
  });

  const [jobOrderCreated, setJobOrderCreated] = useState(false);
  const [idAssigned, setIdAssigned] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [savedOrders, setSavedOrders] = useState<FleetJobOrder[]>([]);

  useEffect(() => {
    let active = true;
    fetchFleetJobOrders()
      .then((orders) => {
        if (!active || orders.length === 0) return;
        setSavedOrders(orders);
        setIntakeData(orders[0]);
        setIdAssigned(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const elevatorPitch = `Hi [Carrier Name / Safety Director],

I know keeping trucks seated with reliable, safety-conscious CDL-A drivers is one of the biggest bottlenecks right now. 

We run an automated commercial driver screening agency called HaulMatch. Here is why our fleet partners work with us:

1. 100% Contingency ($0 Upfront): You only pay if a driver is seated and dispatched.
2. Async Video & DQ Pre-Screened: You watch the driver's recorded video interview, verify their English fluency, clean MVR, and DOT medical card before ever talking to them.
3. 90-Day Free Replacement Warranty: If the driver quits or is terminated within 90 days, we provide a free replacement driver immediately.
4. $1,500 Driver Stay Bonus: We share $1,500 of our placement fee directly with the driver on Day 91. That's why our 90-day driver retention rate is 94.8% compared to the 85% industry turnover.

Can I send over our 1-page agreement and seats intake sheet so we can match your next 5-10 trucks?`;

  const copyPitchToClipboard = () => {
    navigator.clipboard.writeText(elevatorPitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handlePrintAgreement = () => {
    window.print();
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalizedOrder: FleetJobOrder = {
      ...intakeData,
      id: idAssigned ? intakeData.id : `JO-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: idAssigned ? intakeData.createdAt : new Date().toISOString().split('T')[0]
    };

    setIntakeData(finalizedOrder);
    setIdAssigned(true);
    setJobOrderCreated(true);

    // Persist to Supabase (or local storage fallback) — fire-and-forget so a
    // failed save doesn't block the already-confirmed UI state.
    setIsSavingOrder(true);
    try {
      await saveFleetJobOrder(finalizedOrder);
      const refreshed = await fetchFleetJobOrders();
      setSavedOrders(refreshed);
    } catch (err) {
      console.warn('Fleet job order save failed:', err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Navigation Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 32px',
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
            <span className="badge badge-gold">Sales & Carrier Closing Packet</span>
            <span className="badge badge-blue">Ready for Client Signing</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Carrier Rate Card & Placement Packet</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Everything your friend needs to present to logistics companies, close recruitment contracts, and intake fleet driver requirements.
          </p>
        </div>

        {/* Tab Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            border: '1px solid #121315',
            background: '#ffffff'
          }}
        >
          <button
            onClick={() => setActiveTab('rateCard')}
            style={{
              padding: '9px 16px',
              borderRadius: 0,
              fontSize: '0.84rem',
              fontWeight: 600,
              background: activeTab === 'rateCard' ? '#121315' : 'transparent',
              color: activeTab === 'rateCard' ? '#f0a23b' : 'var(--text-secondary)',
              borderRight: '1px solid rgba(18,19,21,0.14)'
            }}
          >
            <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} /> Rate Card & Economics
          </button>

          <button
            onClick={() => setActiveTab('intakeForm')}
            style={{
              padding: '9px 16px',
              borderRadius: 0,
              fontSize: '0.84rem',
              fontWeight: 600,
              background: activeTab === 'intakeForm' ? '#121315' : 'transparent',
              color: activeTab === 'intakeForm' ? '#f0a23b' : 'var(--text-secondary)',
              borderRight: '1px solid rgba(18,19,21,0.14)'
            }}
          >
            <Briefcase size={14} style={{ display: 'inline', marginRight: '4px' }} /> Fleet Intake Order ({savedOrders.length || 1})
          </button>

          <button
            onClick={() => setActiveTab('agreement')}
            style={{
              padding: '9px 16px',
              borderRadius: 0,
              fontSize: '0.84rem',
              fontWeight: 600,
              background: activeTab === 'agreement' ? '#121315' : 'transparent',
              color: activeTab === 'agreement' ? '#f0a23b' : 'var(--text-secondary)'
            }}
          >
            <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} /> 1-Page Legal Agreement
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: RATE CARD & EXECUTIVE COMPARISON
          ========================================================================= */}
      {activeTab === 'rateCard' && (
        <div>
          {/* Top 3 Selling Points for Carriers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}
          >
            <div className="glass-panel" style={{ padding: '24px', borderTop: '3px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>$0 Upfront Risk</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>100% Contingency Fee</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Carriers pay zero dollars to view candidates or review asynchronous video interviews. Invoiced only when a driver arrives at orientation and starts dispatch.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px', borderTop: '3px solid #059669' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>90-Day Free Replacement</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Warranty Clause</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                If a placed driver leaves or violates safety regulations prior to completing 90 calendar days, we provide an immediate qualified replacement with zero additional fee.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px', borderTop: '3px solid #b45309' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>94.8% 90-Day Retention</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>The $1,500 Driver Stay Bonus</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                We share $1,500 of our fee directly with the driver on Day 91. This stops driver ghosting, curbs turnover, and keeps the truck earning revenue for the fleet.
              </p>
            </div>
          </div>

          {/* Hiring Cost Comparison Table */}
          <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              Cost-Per-Hire Comparison: In-House vs. Job Boards vs. HaulMatch
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              American Trucking Associations (ATA) estimates average turnover cost at $8,200 per driver.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Recruitment Channel</th>
                    <th style={{ padding: '12px 16px' }}>Upfront Ad Spend</th>
                    <th style={{ padding: '12px 16px' }}>Pre-Screening Quality</th>
                    <th style={{ padding: '12px 16px' }}>90-Day Guarantee</th>
                    <th style={{ padding: '12px 16px' }}>Effective Cost / Retained Hire</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>Job Boards (Indeed / Tenstreet)</td>
                    <td style={{ padding: '14px 16px', color: '#dc2626' }}>$3,500 - $6,000/mo (No guarantee)</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Unfiltered leads, heavy phone tag</td>
                    <td style={{ padding: '14px 16px', color: '#dc2626' }}>None (0 days)</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700 }}>~$8,200+</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>Traditional Staffing Agency</td>
                    <td style={{ padding: '14px 16px', color: '#b45309' }}>$5,000 - $7,500 per placement</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Phone interview only</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>30 days only</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700 }}>~$6,500</td>
                  </tr>

                  <tr style={{ background: '#eff6ff', borderLeft: '3px solid var(--primary)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-light)' }}>
                      HaulMatch AI Contingency Network
                    </td>
                    <td style={{ padding: '14px 16px', color: '#047857', fontWeight: 700 }}>$0.00 Upfront Risk</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>
                      Async Video + AI Fluency + Valid CDL/Med Card
                    </td>
                    <td style={{ padding: '14px 16px', color: '#047857', fontWeight: 700 }}>100% Free 90-Day Replacement</td>
                    <td style={{ padding: '14px 16px', color: '#047857', fontWeight: 800, fontSize: '1.05rem' }}>
                      $4,500 flat (Split milestone)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Elevator Pitch Script for Your Friend */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#b45309" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Ready-to-Use Email / Phone Pitch Script (For Your Friend)
                </h3>
              </div>
              <button onClick={copyPitchToClipboard} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
                {copiedPitch ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                {copiedPitch ? 'Copied to Clipboard!' : 'Copy Pitch Script'}
              </button>
            </div>

            <pre
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}
            >
              {elevatorPitch}
            </pre>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FLEET INTAKE & DRIVER JOB ORDER FORM
          ========================================================================= */}
      {activeTab === 'intakeForm' && (
        <div>
          {jobOrderCreated ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
                Job Order #{intakeData.id} Confirmed
              </span>
              <h3 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Fleet Driver Intake Active</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 24px auto' }}>
                We have registered <strong>{intakeData.companyName}</strong>'s request for <strong>{intakeData.driversNeeded} CDL-A drivers</strong>. Our matching engine is prioritizing candidates with {intakeData.equipmentType.join(', ')} experience.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button onClick={() => setActiveTab('agreement')} className="btn-primary">
                  View & Print Client Placement Agreement <ArrowRight size={16} />
                </button>
                <button onClick={() => setJobOrderCreated(false)} className="btn-secondary">
                  Edit Intake Specifications
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '32px' }}>
              {savedOrders.length > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '3px solid #f0a23b',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#121315'
                      }}
                    >
                      Saved Fleet Orders ({savedOrders.length}):
                    </span>
                    {savedOrders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          setIntakeData(order);
                          setIdAssigned(true);
                          setJobOrderCreated(false);
                        }}
                        style={{
                          padding: '5px 10px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          background: intakeData.id === order.id && idAssigned ? '#121315' : '#ffffff',
                          color: intakeData.id === order.id && idAssigned ? '#f0a23b' : '#121315',
                          border: '1px solid #121315'
                        }}
                      >
                        {order.id} · {order.companyName} ({order.driversNeeded})
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = `JO-${Math.floor(1000 + Math.random() * 9000)}`;
                      setIntakeData({
                        ...intakeData,
                        id: nextId,
                        companyName: '',
                        dotNumber: '',
                        mcNumber: '',
                        contactName: '',
                        createdAt: INITIAL_CREATED_DATE
                      });
                      setIdAssigned(false);
                      setJobOrderCreated(false);
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    + New Fleet Order
                  </button>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <span className="badge badge-blue" style={{ marginBottom: '6px' }}>Fleet Onboarding Form · #{intakeData.id}</span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Carrier Fleet Intake & Driver Job Order</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Complete this form with the fleet safety director to lock in their exact hiring criteria, equipment requirements, and pay package.
                </p>
              </div>

              <form onSubmit={handleIntakeSubmit}>
                {/* Company & Contact */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Carrier Company Legal Name</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={intakeData.companyName}
                      onChange={(e) => setIntakeData({ ...intakeData, companyName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">USDOT Number & MC Number</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="DOT #"
                        value={intakeData.dotNumber}
                        onChange={(e) => setIntakeData({ ...intakeData, dotNumber: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MC #"
                        value={intakeData.mcNumber}
                        onChange={(e) => setIntakeData({ ...intakeData, mcNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Person (Safety / Recruiting)</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={intakeData.contactName}
                      onChange={(e) => setIntakeData({ ...intakeData, contactName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Direct Phone & Email</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Phone"
                        value={intakeData.contactPhone}
                        onChange={(e) => setIntakeData({ ...intakeData, contactPhone: e.target.value })}
                      />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Email"
                        value={intakeData.contactEmail}
                        onChange={(e) => setIntakeData({ ...intakeData, contactEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Fleet Requirements */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
                    Driver Specifications & Fleet Preferences
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                    <div className="form-group">
                      <label className="form-label">Drivers Needed</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="form-input"
                        value={intakeData.driversNeeded}
                        onChange={(e) => setIntakeData({ ...intakeData, driversNeeded: Number(e.target.value) })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Transmission Type</label>
                      <select
                        className="form-select"
                        value={intakeData.transmission}
                        onChange={(e: any) => setIntakeData({ ...intakeData, transmission: e.target.value })}
                      >
                        <option value="Automatic">Automatic Transmission Only</option>
                        <option value="Manual (10-speed)">Manual 10-Speed Required</option>
                        <option value="Either">Either (Fleet has both)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Minimum Verifiable Experience</label>
                      <select
                        className="form-select"
                        value={intakeData.minExperienceYears}
                        onChange={(e) => setIntakeData({ ...intakeData, minExperienceYears: Number(e.target.value) })}
                      >
                        <option value={1}>1 Year Commercial Driving</option>
                        <option value={2}>2 Years OTR Experience</option>
                        <option value={3}>3+ Years Veteran</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Home-Time Schedule</label>
                      <input
                        type="text"
                        className="form-input"
                        value={intakeData.hometimeCadence}
                        onChange={(e) => setIntakeData({ ...intakeData, hometimeCadence: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Compensation & Lanes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Starting Pay Per Mile (CPM)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={intakeData.payPerMile}
                        onChange={(e) => setIntakeData({ ...intakeData, payPerMile: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Average Weekly Miles</label>
                      <input
                        type="text"
                        className="form-input"
                        value={intakeData.avgWeeklyMiles}
                        onChange={(e) => setIntakeData({ ...intakeData, avgWeeklyMiles: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Weekly Guarantee / Minimum</label>
                      <input
                        type="text"
                        className="form-input"
                        value={intakeData.guaranteedWeeklyMin}
                        onChange={(e) => setIntakeData({ ...intakeData, guaranteedWeeklyMin: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Primary Running Corridors</label>
                      <input
                        type="text"
                        className="form-input"
                        value={intakeData.operatingLanes}
                        onChange={(e) => setIntakeData({ ...intakeData, operatingLanes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px' }} disabled={isSavingOrder}>
                    {isSavingOrder ? 'Saving Job Order...' : 'Save Fleet Job Order & Generate Packet'} <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PRINTABLE 1-PAGE CONTINGENCY PLACEMENT AGREEMENT
          ========================================================================= */}
      {activeTab === 'agreement' && (
        <div>
          {/* Printable Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Standard US Executive Contingency Placement Agreement (Print or Save as PDF)
            </span>
            <button onClick={handlePrintAgreement} className="btn-primary" style={{ padding: '10px 20px' }}>
              <Printer size={16} /> Print / Save as PDF
            </button>
          </div>

          {/* Clean 1-Page Letter Document */}
          <div
            id="printable-agreement"
            className="hm-printable-agreement"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 'var(--radius-md)',
              padding: '48px 56px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              fontFamily: 'serif',
              lineHeight: 1.5,
              fontSize: '11pt'
            }}
          >
            {/* Agreement Header */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '18pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0, color: '#0f172a', fontFamily: 'sans-serif' }}>
                  HaulMatch AI Recruiting Network LLC
                </h1>
                <div style={{ fontSize: '9pt', color: '#475569', marginTop: '4px', fontFamily: 'sans-serif' }}>
                  Commercial CDL Driver Placement & Retention Services • Nationwide Carrier Partner Agreement
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '9pt', color: '#475569', fontFamily: 'sans-serif' }}>
                <div>Document ID: <strong>HM-{intakeData.id}</strong></div>
                <div>Date: <strong>{intakeData.createdAt}</strong></div>
              </div>
            </div>

            {/* Parties */}
            <p style={{ marginBottom: '14px', fontSize: '10pt' }}>
              This <strong>Contingency Placement & Driver Retention Agreement</strong> ("Agreement") is executed as of <strong>{intakeData.createdAt}</strong> by and between <strong>HaulMatch AI Recruiting Network LLC</strong> ("Agency") and <strong>{intakeData.companyName}</strong>, USDOT #{intakeData.dotNumber || 'Pending'} ("Client / Carrier").
            </p>

            {/* Core Terms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '9.5pt', marginBottom: '24px' }}>
              <div>
                <strong>1. CONTINGENT RECRUITING FEE & MILESTONE SCHEDULE:</strong>
                <br />
                Agency provides pre-screened commercial drivers on a 100% contingency basis. Client owes zero upfront fee. Total contingent fee per placed driver is <strong>$4,500.00 USD</strong>, payable under the following milestone schedule:
                <ul style={{ margin: '4px 0 0 20px' }}>
                  <li><strong>Milestone 1 (50% / $2,250.00):</strong> Invoiced upon Candidate's first official day of orientation or initial dispatch.</li>
                  <li><strong>Milestone 2 (50% / $2,250.00):</strong> Invoiced upon Candidate reaching <strong>ninety (90) continuous calendar days</strong> of active employment with Client.</li>
                </ul>
              </div>

              <div>
                <strong>2. NINETY-DAY (90-DAY) 100% FREE REPLACEMENT WARRANTY:</strong>
                <br />
                If any Candidate introduced by Agency resigns voluntarily or is terminated for cause or safety violation prior to completing ninety (90) calendar days from their start date, Agency shall provide <strong>one (1) free replacement qualified CDL driver</strong> at no extra agency fee.
              </div>

              <div>
                <strong>3. DRIVER RETENTION INCENTIVE ALIGNMENT:</strong>
                <br />
                Client acknowledges and consents that Agency disburses a direct <strong>$1,500.00 Retention Bonus</strong> to Candidate upon Candidate successfully achieving the 90-day milestone. This direct economic incentive ensures driver longevity and lowers fleet churn.
              </div>

              <div>
                <strong>4. NON-CIRCUMVENTION & EXCLUSIVITY:</strong>
                <br />
                Client covenants that it will not directly or indirectly hire, solicit, or engage any Candidate presented by Agency (whether introduced under blind profile or unmasked contact) for a period of <strong>twelve (12) months</strong> following the date of introduction, without remitting the full $4,500.00 placement fee to Agency.
              </div>

              <div>
                <strong>5. FMCSA COMPLIANCE & DRIVER QUALIFICATION (DQ) FILE:</strong>
                <br />
                Agency certifies that Candidate has completed asynchronous video screening, possesses a verified Commercial Driver's License (CDL), valid DOT Medical Examiner's Certificate (MCSA-5876), and clean 3-year Motor Vehicle Record (MVR) summary.
              </div>
            </div>

            {/* Signature Blocks */}
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '32px', fontSize: '9.5pt' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: '#0f172a', fontFamily: 'sans-serif' }}>
                  FOR CLIENT (CARRIER):
                </div>
                <div style={{ marginBottom: '6px' }}>Company: <strong>{intakeData.companyName}</strong></div>
                <div style={{ marginBottom: '6px' }}>Representative: <strong>{intakeData.contactName}</strong></div>
                <div style={{ marginBottom: '6px' }}>Title: <strong>{intakeData.contactTitle}</strong></div>
                <div style={{ height: '36px', borderBottom: '1px solid #0f172a', marginBottom: '4px' }}></div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>Authorized Officer Signature / Date</div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: '#0f172a', fontFamily: 'sans-serif' }}>
                  FOR AGENCY (HAULMATCH AI):
                </div>
                <div style={{ marginBottom: '6px' }}>Company: <strong>HaulMatch AI Recruiting Network LLC</strong></div>
                <div style={{ marginBottom: '6px' }}>Representative: <strong>Managing Director of Fleet Operations</strong></div>
                <div style={{ marginBottom: '6px' }}>Address: <strong>Delaware, United States</strong></div>
                <div style={{ height: '36px', borderBottom: '1px solid #0f172a', marginBottom: '4px', display: 'flex', alignItems: 'flex-end' }}>
                  <span style={{ fontFamily: 'cursive', fontSize: '12pt', color: '#1e3a8a' }}>HaulMatch AI Authorized</span>
                </div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>Authorized Signature / Date</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
