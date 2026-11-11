import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Copy,
  Check,
  Sparkles,
  Award,
  ArrowRight
} from 'lucide-react';
import type { DriverProfile, CarrierOffer } from '../../types';
import {
  fetchDriverOffers,
  acceptCarrierOffer,
  declineCarrierOffer
} from '../../services/driverOffers';

interface DriverCabinProps {
  drivers: DriverProfile[];
  initialDriverId?: string;
  onBackToHome?: () => void;
  onNavigateToCarrierATS?: () => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
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

export const DriverCabin: React.FC<DriverCabinProps> = ({
  drivers,
  initialDriverId,
  onBackToHome,
  onNavigateToCarrierATS
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => {
    if (initialDriverId && drivers.some((d) => d.id === initialDriverId)) {
      return initialDriverId;
    }
    return drivers[0]?.id || 'CDL-1001';
  });

  const [activeTab, setActiveTab] = useState<'offers' | 'retention' | 'dq' | 'recruiter'>('offers');
  const [offers, setOffers] = useState<CarrierOffer[]>(() => fetchDriverOffers(selectedDriverId));
  const [copiedLink, setCopiedLink] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Active driver record
  const currentDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopyMagicLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haulmatch.ai';
    const link = `${origin}?driverCabin=${selectedDriverId}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`Cabin magic link copied for ${currentDriver?.fullName}`);
  };

  const handleAcceptOffer = (offerId: string, slot?: string) => {
    const res = acceptCarrierOffer(offerId, slot, currentDriver?.fullName);
    if (res.success) {
      setOffers(fetchDriverOffers(selectedDriverId));
      showToast(`Interview window accepted: "${slot || 'Window Confirmed'}". Carrier dispatch notified!`);
    }
  };

  const handleDeclineOffer = (offerId: string) => {
    const res = declineCarrierOffer(offerId, currentDriver?.fullName);
    if (res.success) {
      setOffers(fetchDriverOffers(selectedDriverId));
      showToast('Offer declined. Your blind profile remains visible to other top carriers.', 'info');
    }
  };

  const handleRequestCallback = () => {
    setCallbackRequested(true);
    showToast('Recruiter advocate callback dispatched via SMS. Expect a call within 15 minutes.');
  };

  if (!currentDriver) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: BODY_FONT }}>
        <p style={{ color: MUTED }}>No active driver applicant found in database.</p>
        {onBackToHome && (
          <button type="button" onClick={onBackToHome} style={{ padding: '8px 16px', background: INK, color: '#fff', border: 'none' }}>
            ← Back to Application
          </button>
        )}
      </div>
    );
  }

  const pendingOffers = offers.filter((o) => o.status === 'pending');
  const acceptedOffers = offers.filter((o) => o.status === 'accepted');

  const placementDays = currentDriver.placementDetails?.daysCompleted ?? (currentDriver.status === 'placed' ? 47 : 0);
  const targetDays = currentDriver.placementDetails?.targetDays ?? 90;
  const is90Completed = placementDays >= 90;
  const bonusAmount = currentDriver.bonusAmount || 1500;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', fontFamily: BODY_FONT, color: INK, paddingBottom: 60 }}>
      {/* Editorial Eyebrow & Live Cabin Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 16,
          marginBottom: 20,
          borderBottom: `1px solid ${RULE}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ width: 8, height: 8, background: '#10b981', display: 'inline-block' }} />
          <span style={monoStyle(11, INK, '0.1em')}>SEC-07 // DRIVER CABIN & CAREER COCKPIT</span>
          <span
            style={{
              ...monoStyle(9, '#047857', '0.08em'),
              padding: '2px 7px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0'
            }}
          >
            ACTIVE CANDIDATE PORTAL
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Driver Switcher (to test/view as different applicants) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={monoStyle(10, MUTED)}>View As:</span>
            <select
              value={selectedDriverId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedDriverId(newId);
                setOffers(fetchDriverOffers(newId));
              }}
              style={{
                padding: '6px 10px',
                fontFamily: MONO,
                fontSize: 11,
                border: `1px solid ${RULE}`,
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.id} · {d.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCopyMagicLink}
            style={{
              ...monoStyle(11, INK),
              padding: '6px 12px',
              background: '#fff',
              border: `1px solid ${RULE}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            {copiedLink ? <Check size={12} color="#059669" /> : <Copy size={12} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Magic Link'}</span>
          </button>

          {onNavigateToCarrierATS && (
            <button
              type="button"
              onClick={onNavigateToCarrierATS}
              style={{
                ...monoStyle(11, AMBER_TEXT),
                padding: '6px 12px',
                background: 'rgba(240, 162, 59, 0.1)',
                border: '1px solid rgba(240, 162, 59, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <span>Carrier ATS View →</span>
            </button>
          )}

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              style={{
                ...monoStyle(11, MUTED),
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginLeft: 4
              }}
            >
              ← Back to Home
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            background: notification.type === 'success' ? '#ecfdf5' : '#eff6ff',
            border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#bfdbfe'}`,
            borderLeft: `4px solid ${notification.type === 'success' ? '#059669' : '#2563eb'}`,
            fontFamily: MONO,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Driver Cockpit Masthead Hero Banner */}
      <div
        style={{
          background: DEEP,
          color: '#fff',
          border: `1px solid ${RULE}`,
          borderTop: `3px solid ${AMBER}`,
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 6px', background: AMBER, color: INK, fontWeight: 700 }}>
              {currentDriver.id}
            </span>
            <span style={monoStyle(10, '#94a3b8')}>
              COMMERCIAL CDL-A HOLDER · {currentDriver.location.city}, {currentDriver.location.state}
            </span>
          </div>

          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 42px)',
              lineHeight: 1,
              textTransform: 'uppercase',
              margin: '0 0 10px',
              letterSpacing: '0.02em'
            }}
          >
            {currentDriver.fullName}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.08)',
                padding: '4px 10px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <Truck size={13} color={AMBER} /> {currentDriver.yearsExperience} Yrs Exp ({currentDriver.cdlClass})
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.08)',
                padding: '4px 10px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <Award size={13} color="#10b981" /> AI Fluency: {currentDriver.aiFluencyScore}/100
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.08)',
                padding: '4px 10px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <ShieldCheck size={13} color="#10b981" /> Med Card: {currentDriver.dotMedCardStatus}
            </span>
          </div>
        </div>

        {/* Action Right: Recruiter Connect */}
        <div style={{ background: '#181a1f', border: '1px solid rgba(255,255,255,0.12)', padding: '16px 20px', textAlign: 'right' }}>
          <div style={monoStyle(9, '#94a3b8')}>Assigned Placement Advocate</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 2 }}>Sarah Jenkins</div>
          <div style={{ fontSize: 11, color: AMBER, fontFamily: MONO, marginTop: 2 }}>HaulMatch Senior Recruiter</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleRequestCallback}
              disabled={callbackRequested}
              style={{
                ...monoStyle(10, INK),
                fontWeight: 700,
                padding: '6px 12px',
                background: callbackRequested ? '#a7f3d0' : AMBER,
                border: 'none',
                cursor: callbackRequested ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Phone size={11} /> {callbackRequested ? 'Callback Queued' : 'Request Callback'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Telemetry Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 1,
          background: RULE,
          border: `1px solid ${RULE}`,
          marginBottom: 24
        }}
      >
        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>Carrier Placement Offers</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, color: pendingOffers.length > 0 ? AMBER_TEXT : INK, lineHeight: 1.1, marginTop: 4 }}>
            {pendingOffers.length} <span style={{ fontSize: 16, fontWeight: 600, color: MUTED }}>Pending</span>
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            {acceptedOffers.length} Interview Window Confirmed
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>90-Day Stay Bonus Status</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, color: '#059669', lineHeight: 1.1, marginTop: 4 }}>
            ${bonusAmount.toLocaleString()}
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            {currentDriver.status === 'placed'
              ? `Day ${placementDays} of 90 Completed`
              : 'Escrow Guarantee upon Placement'}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>Marketplace Privacy</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, color: INK, lineHeight: 1.2, marginTop: 6 }}>
            100% Blind Mode
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            Direct phone unmasked only after carrier fee e-sign
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>DOT Qualification File</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, color: '#047857', lineHeight: 1.2, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={20} /> FMCSA Part 391 Cleared
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            Clearinghouse & MVR verified
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 1,
          background: RULE,
          border: `1px solid ${RULE}`,
          marginBottom: 24,
          overflowX: 'auto'
        }}
      >
        {[
          { key: 'offers', label: `Carrier Offers & Interviews (${offers.length})`, icon: Briefcase },
          { key: 'retention', label: '$1,500 Stay Bonus & Warranty Tracker', icon: DollarSign },
          { key: 'dq', label: 'My CDL Credentials & Compliance', icon: ShieldCheck },
          { key: 'recruiter', label: 'Advocate Support & Dispatch Help', icon: Phone }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: isActive ? INK : '#fff',
                color: isActive ? AMBER : INK,
                fontFamily: BODY_FONT,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: CARRIER OFFERS & INTERVIEW REQUESTS
          ========================================================================= */}
      {activeTab === 'offers' && (
        <div id="cabin-offers-section">
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
              Active Fleet Inquiries & Placement Offers
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
              Carriers below have reviewed your anonymized qualifications, video screening, and safety records. Select an interview slot to connect directly with fleet safety directors.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {offers.map((offer) => {
              const isAccepted = offer.status === 'accepted';
              const isDeclined = offer.status === 'declined';

              return (
                <div
                  key={offer.id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${isAccepted ? '#059669' : isDeclined ? '#cbd5e1' : AMBER}`,
                    borderTop: `3px solid ${isAccepted ? '#059669' : isDeclined ? '#94a3b8' : AMBER}`,
                    padding: 24,
                    opacity: isDeclined ? 0.65 : 1
                  }}
                >
                  {/* Offer Top Masthead */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 6px', background: DEEP, color: '#fff' }}>
                          {offer.id}
                        </span>
                        <h4 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, margin: 0, textTransform: 'uppercase' }}>
                          {offer.carrierName}
                        </h4>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 4 }}>
                        DOT: {offer.dotNumber || 'Verified'} · MC: {offer.mcNumber || 'Active'} · Contact: {offer.contactName} ({offer.contactPhone})
                      </div>
                    </div>

                    <div>
                      {isAccepted ? (
                        <span
                          style={{
                            ...monoStyle(10, '#047857'),
                            padding: '4px 10px',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <CheckCircle2 size={12} /> INTERVIEW CONFIRMED
                        </span>
                      ) : isDeclined ? (
                        <span
                          style={{
                            ...monoStyle(10, '#64748b'),
                            padding: '4px 10px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          OFFER DECLINED
                        </span>
                      ) : (
                        <span
                          style={{
                            ...monoStyle(10, AMBER_TEXT),
                            padding: '4px 10px',
                            background: 'rgba(240, 162, 59, 0.12)',
                            border: '1px solid rgba(240, 162, 59, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <Sparkles size={12} /> ACTION REQUIRED: SELECT INTERVIEW WINDOW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Offer Details Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 12,
                      background: '#f8fafc',
                      padding: '14px 16px',
                      border: `1px solid ${RULE}`,
                      marginBottom: 16,
                      fontSize: 13
                    }}
                  >
                    <div>
                      <div style={monoStyle(9, MUTED)}>Compensation Package</div>
                      <div style={{ fontWeight: 700, color: INK, fontSize: 15, marginTop: 2 }}>{offer.payPerMile}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{offer.weeklyMinGuarantee}</div>
                    </div>

                    <div>
                      <div style={monoStyle(9, MUTED)}>Equipment & Specs</div>
                      <div style={{ fontWeight: 600, color: INK, marginTop: 2 }}>{offer.equipmentType}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>
                        {offer.petPolicy ? 'Pets Allowed' : 'No Pets'} · {offer.passengerPolicy ? 'Rider Policy Active' : 'Single Driver'}
                      </div>
                    </div>

                    <div>
                      <div style={monoStyle(9, MUTED)}>Home-time Commitment</div>
                      <div style={{ fontWeight: 600, color: INK, marginTop: 2 }}>{offer.hometimeCadence}</div>
                    </div>

                    <div>
                      <div style={monoStyle(9, MUTED)}>Signing Incentive</div>
                      <div style={{ fontWeight: 600, color: '#047857', marginTop: 2 }}>{offer.signingBonus || '$1,500 HaulMatch Bonus'}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>+ $1,500 Stay Bonus at Day 90</div>
                    </div>
                  </div>

                  {/* Route & Lanes */}
                  <div style={{ marginBottom: 16, fontSize: 13 }}>
                    <span style={monoStyle(9, MUTED)}>Primary Lanes:</span>{' '}
                    <strong>{offer.laneDescription}</strong>
                  </div>

                  {/* Interactive Interview Window Selection */}
                  {!isAccepted && !isDeclined && offer.interviewSlots && offer.interviewSlots.length > 0 && (
                    <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 14 }}>
                      <div style={monoStyle(10, INK, '0.08em')}>
                        PROPOSED INTERVIEW TIME SLOTS (CHOOSE ONE TO ACCEPT):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 14 }}>
                        {offer.interviewSlots.map((slot) => (
                          <button
                            type="button"
                            key={slot}
                            onClick={() => handleAcceptOffer(offer.id, slot)}
                            style={{
                              padding: '8px 14px',
                              background: '#fff',
                              border: `1px solid ${RULE}`,
                              fontFamily: MONO,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Calendar size={12} color={AMBER_TEXT} />
                            <span>{slot}</span>
                            <ArrowRight size={11} />
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleDeclineOffer(offer.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#fff',
                            border: `1px solid ${RULE}`,
                            color: '#64748b',
                            fontFamily: MONO,
                            fontSize: 10,
                            cursor: 'pointer'
                          }}
                        >
                          Decline Offer
                        </button>
                      </div>
                    </div>
                  )}

                  {isAccepted && (
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        padding: '12px 16px',
                        fontSize: 13,
                        color: '#065f46',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} color="#059669" />
                        <span>
                          <strong>Confirmed:</strong> Phone interview scheduled for{' '}
                          <u>{offer.selectedSlot || 'Thursday at 2:00 PM CST'}</u>. Fleet safety recruiter {offer.contactName} will dial you directly at {currentDriver.phone}.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: 90-DAY RETENTION & BONUS TRACKER
          ========================================================================= */}
      {activeTab === 'retention' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '28px' }}>
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
              $1,500 Stay Bonus & Retention Escrow Warranty
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
              HaulMatch guarantees a $1,500 cash retention reward disbursed directly to your bank account once you complete 90 days with your placed fleet.
            </p>
          </div>

          {/* Interactive Progress Bar */}
          <div style={{ border: `1px solid ${RULE}`, padding: 22, background: '#f8fafc', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={monoStyle(11, INK)}>PROGRESSION TO $1,500 CASH REWARD</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: is90Completed ? '#059669' : AMBER_TEXT }}>
                Day {placementDays} of {targetDays} ({Math.min(100, Math.round((placementDays / targetDays) * 100))}%)
              </span>
            </div>

            <div style={{ width: '100%', height: 12, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  width: `${Math.min(100, (placementDays / targetDays) * 100)}%`,
                  height: '100%',
                  background: is90Completed ? '#059669' : AMBER,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            {/* Cadence Check-in Milestones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14, textAlign: 'center' }}>
              {[
                { day: 14, label: 'Day 14 Welcome Check-in', done: placementDays >= 14 },
                { day: 30, label: 'Day 30 Miles & Lane Pulse', done: placementDays >= 30 },
                { day: 60, label: 'Day 60 Home-Time Audit', done: placementDays >= 60 },
                { day: 90, label: 'Day 90 · $1,500 Wire Disbursed', done: placementDays >= 90 }
              ].map((m) => (
                <div
                  key={m.day}
                  style={{
                    padding: '8px 10px',
                    background: m.done ? '#ecfdf5' : '#fff',
                    border: `1px solid ${m.done ? '#a7f3d0' : RULE}`,
                    fontSize: 11
                  }}
                >
                  <div style={{ fontWeight: 700, color: m.done ? '#047857' : MUTED }}>Day {m.day}</div>
                  <div style={{ fontSize: 10, color: m.done ? '#065f46' : MUTED, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Support Guarantee */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ border: `1px solid ${RULE}`, padding: 18 }}>
              <div style={monoStyle(10, AMBER_TEXT)}>HAVING TRUCK OR DISPATCH FRICTION?</div>
              <h4 style={{ fontFamily: DISPLAY, fontSize: 18, margin: '6px 0 8px', textTransform: 'uppercase' }}>
                Don't Walk Away Empty-Handed
              </h4>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.45, margin: 0 }}>
                If your assigned carrier isn't honoring home-time or route commitments, contact your HaulMatch driver advocate first. We intervene directly with fleet safety leadership to resolve equipment or dispatch disputes so you reach your Day 90 bonus.
              </p>
            </div>

            <div style={{ border: `1px solid ${RULE}`, padding: 18 }}>
              <div style={monoStyle(10, '#047857')}>VERIFIED ESCROW ACCOUNTING</div>
              <h4 style={{ fontFamily: DISPLAY, fontSize: 18, margin: '6px 0 8px', textTransform: 'uppercase' }}>
                $1,500 Held in Independent Escrow
              </h4>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.45, margin: 0 }}>
                Your $1,500 stay bonus is held in designated trust escrow from Day 1 of dispatch. It is released automatically upon the 90th consecutive day of verifiable service without carrier deductions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MY CDL CREDENTIALS & COMPLIANCE
          ========================================================================= */}
      {activeTab === 'dq' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '28px' }}>
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
              My FMCSA Part 391 Qualification File
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
              This is the official digital credential file verified by HaulMatch OCR and shared with authorized carriers when you accept an interview.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
            {/* CDL License */}
            <div style={{ border: `1px solid ${RULE}`, borderTop: `3px solid ${INK}`, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={monoStyle(10, MUTED)}>COMMERCIAL DRIVER LICENSE</span>
                <span style={{ ...monoStyle(9, '#047857'), padding: '2px 6px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  OCR VERIFIED
                </span>
              </div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><strong>Class:</strong> {currentDriver.cdlClass}</div>
                <div><strong>License #:</strong> <span style={{ fontFamily: MONO }}>{currentDriver.licenseNumber}</span></div>
                <div><strong>Issuing State:</strong> {currentDriver.issuingState}</div>
                <div><strong>Expiration:</strong> {currentDriver.cdlExpiration || '2028-06-30'}</div>
              </div>
            </div>

            {/* Medical Card */}
            <div style={{ border: `1px solid ${RULE}`, borderTop: `3px solid ${AMBER}`, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={monoStyle(10, MUTED)}>DOT MEDICAL EXAMINER CERT</span>
                <span style={{ ...monoStyle(9, '#047857'), padding: '2px 6px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  {currentDriver.dotMedCardStatus.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><strong>Form:</strong> MCSA-5876 National Registry</div>
                <div><strong>Registry Expiry:</strong> {currentDriver.dotMedCardExpiry || '2027-04-12'}</div>
                <div><strong>NRCME Status:</strong> Certified Physician Verified</div>
              </div>
            </div>

            {/* Safety & MVR */}
            <div style={{ border: `1px solid ${RULE}`, borderTop: `3px solid #059669`, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={monoStyle(10, MUTED)}>SAFETY AUDIT & CLEARINGHOUSE</span>
                <span style={{ ...monoStyle(9, '#047857'), padding: '2px 6px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  CLEARED
                </span>
              </div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><strong>3-Year MVR:</strong> {currentDriver.cleanMvr ? 'Clean (0 Violations)' : `${currentDriver.violationsLast3Yrs} citations`}</div>
                <div><strong>Clearinghouse:</strong> {currentDriver.dqDocuments?.clearinghouseStatus || 'Passed (Zero Violations)'}</div>
                <div><strong>Accidents:</strong> 0 Preventable in 36 Months</div>
              </div>
            </div>
          </div>

          {/* Endorsements & Badges */}
          <div style={{ border: `1px solid ${RULE}`, padding: 18, background: '#f8fafc' }}>
            <div style={monoStyle(10, MUTED, '0.08em')}>ACTIVE VERIFIED ENDORSEMENTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {(currentDriver.endorsements || ['Hazmat (H)', 'Tanker (N)']).map((e) => (
                <span
                  key={e}
                  style={{
                    padding: '4px 10px',
                    background: '#fff',
                    border: `1px solid ${RULE}`,
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                >
                  ✓ {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ADVOCATE SUPPORT & DISPATCH HELP
          ========================================================================= */}
      {activeTab === 'recruiter' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '28px' }}>
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
              HaulMatch Driver Advocate Team
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
              You don't deal with fleet recruiters alone. Your dedicated HaulMatch driver advocate reviews pay packages, verifies carrier safety ratings, and handles your onboarding questions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Primary Advocate Card */}
            <div style={{ border: `1px solid ${RULE}`, padding: 22, background: '#fdfbf7', borderLeft: `4px solid ${AMBER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: INK,
                    color: AMBER,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: DISPLAY,
                    fontSize: 20,
                    fontWeight: 800
                  }}
                >
                  SJ
                </div>
                <div>
                  <strong style={{ fontSize: 16 }}>Sarah Jenkins</strong>
                  <div style={monoStyle(10, AMBER_TEXT)}>Senior Driver Advocate & Recruiter</div>
                </div>
              </div>

              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8, color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} color={MUTED} /> <span>(214) 555-0144 (Direct / SMS)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} color={MUTED} /> <span>s.jenkins@haulmatch.ai</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color={MUTED} /> <span>Mon – Sat: 6:00 AM – 8:00 PM CST</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestCallback}
                disabled={callbackRequested}
                style={{
                  width: '100%',
                  marginTop: 18,
                  padding: '10px 14px',
                  background: callbackRequested ? '#a7f3d0' : INK,
                  color: callbackRequested ? '#065f46' : '#fff',
                  border: 'none',
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: callbackRequested ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Phone size={12} />
                <span>{callbackRequested ? 'Callback Scheduled' : 'Request Direct Advocate Callback'}</span>
              </button>
            </div>

            {/* Quick Support Guidelines */}
            <div style={{ border: `1px solid ${RULE}`, padding: 22 }}>
              <div style={monoStyle(10, MUTED, '0.08em')}>WHAT WE HANDLE FOR YOU</div>
              <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: '#334155' }}>
                <li>Reviewing carrier CPM contracts and guaranteed minimums before you sign.</li>
                <li>Ensuring weekly home-time clauses are written into your placement agreement.</li>
                <li>Verifying DOT safety scores & inspection violation histories of hiring fleets.</li>
                <li>Monitoring your Day-90 bonus escrow and facilitating automatic direct deposit.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
