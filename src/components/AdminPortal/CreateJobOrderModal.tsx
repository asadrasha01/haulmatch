import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Truck,
  DollarSign,
  Plus
} from 'lucide-react';
import type { FleetJobOrder } from '../../types';

interface CreateJobOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobOrder: FleetJobOrder) => Promise<void> | void;
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

const EQUIPMENT_OPTIONS = [
  'Dry Van',
  'Reefer',
  'Flatbed',
  'Tanker',
  'Step Deck',
  'Intermodal Container'
];

export const CreateJobOrderModal: React.FC<CreateJobOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [companyName, setCompanyName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('Recruiting & Safety Director');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [driversNeeded, setDriversNeeded] = useState(2);
  const [equipmentType, setEquipmentType] = useState<string[]>(['Dry Van']);
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual (10-speed)' | 'Either'>('Automatic');
  const [minExperienceYears, setMinExperienceYears] = useState(2);
  const [maxViolations3Years, setMaxViolations3Years] = useState(1);
  const [hometimeCadence, setHometimeCadence] = useState('Weekly (34-48h reset)');
  const [payPerMile, setPayPerMile] = useState('$0.75 - $0.80 CPM');
  const [avgWeeklyMiles, setAvgWeeklyMiles] = useState('2,600 - 3,000');
  const [guaranteedWeeklyMin, setGuaranteedWeeklyMin] = useState('$1,500/week');
  const [operatingLanes, setOperatingLanes] = useState('Midwest & Southern Regional Corridors');
  const [petPolicy, setPetPolicy] = useState(true);
  const [passengerPolicy, setPassengerPolicy] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleEquipment = (eq: string) => {
    setEquipmentType((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Carrier company name is required.');
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg('Contact person name is required.');
      return;
    }
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setErrorMsg('Either contact phone or email must be provided.');
      return;
    }
    if (equipmentType.length === 0) {
      setErrorMsg('Select at least one required equipment type.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder: FleetJobOrder = {
        id: `JO-${Math.floor(1000 + Math.random() * 9000)}`,
        companyName: companyName.trim(),
        dotNumber: dotNumber.trim() || '3819204',
        mcNumber: mcNumber.trim() || 'MC-149201',
        contactName: contactName.trim(),
        contactTitle: contactTitle.trim(),
        contactEmail: contactEmail.trim() || 'recruiting@partnerfleet.com',
        contactPhone: contactPhone.trim() || '(555) 000-0000',
        driversNeeded: Number(driversNeeded) || 1,
        equipmentType,
        transmission,
        minExperienceYears: Number(minExperienceYears) || 0,
        maxViolations3Years: Number(maxViolations3Years) || 0,
        hometimeCadence,
        payPerMile,
        avgWeeklyMiles,
        guaranteedWeeklyMin,
        operatingLanes,
        petPolicy,
        passengerPolicy,
        createdAt: new Date().toISOString()
      };

      await onSubmit(newOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create fleet job order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(12, 13, 15, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '94vh',
          background: '#fff',
          border: `2px solid ${INK}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: BODY_FONT,
          color: INK
        }}
      >
        {/* Header */}
        <div
          style={{
            background: DEEP,
            color: '#fff',
            padding: '16px 24px',
            borderBottom: `2px solid ${AMBER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, background: AMBER, display: 'inline-block' }} />
              <span style={monoStyle(10, AMBER, '0.12em')}>
                CARRIER INTAKE // NEW FLEET JOB REQUISITION
              </span>
            </div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: 24,
                fontWeight: 800,
                textTransform: 'uppercase',
                margin: '4px 0 0',
                letterSpacing: '0.02em'
              }}
            >
              Dispatch New Fleet Hiring Order
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderLeft: '4px solid #dc2626',
                  color: '#dc2626',
                  fontSize: 12,
                  fontFamily: MONO
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Carrier Identity Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Building2 size={14} color={AMBER_TEXT} />
                <span style={monoStyle(11, INK, '0.1em')}>01 // CARRIER & FLEET IDENTIFICATION</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label htmlFor="companyName" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Carrier Company Name *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    placeholder="e.g. Apex Freight Lines LLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="dotNumber" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    USDOT Number
                  </label>
                  <input
                    id="dotNumber"
                    type="text"
                    placeholder="e.g. 3819204"
                    value={dotNumber}
                    onChange={(e) => setDotNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="mcNumber" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    FMCSA MC Number
                  </label>
                  <input
                    id="mcNumber"
                    type="text"
                    placeholder="e.g. MC-149201"
                    value={mcNumber}
                    onChange={(e) => setMcNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Contact Person Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <User size={14} color={AMBER_TEXT} />
                <span style={monoStyle(11, INK, '0.1em')}>02 // FLEET RECRUITING CONTACT</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label htmlFor="contactName" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Contact Name *
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="contactTitle" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Title / Position
                  </label>
                  <input
                    id="contactTitle"
                    type="text"
                    placeholder="e.g. VP Fleet Safety"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Direct Phone *
                  </label>
                  <input
                    id="contactPhone"
                    type="text"
                    placeholder="e.g. (214) 555-0199"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Contact Email
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    placeholder="e.g. recruiting@apex.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Requisition Parameters Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Truck size={14} color={AMBER_TEXT} />
                <span style={monoStyle(11, INK, '0.1em')}>03 // SEAT QUOTA & EQUIPMENT REQUIREMENTS</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Drivers Needed (Quota)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={driversNeeded}
                    onChange={(e) => setDriversNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Transmission
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Automatic">Automatic Only</option>
                    <option value="Manual (10-speed)">Manual (10-speed)</option>
                    <option value="Either">Either Transmission</option>
                  </select>
                </div>

                <div>
                  <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Min Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={minExperienceYears}
                    onChange={(e) => setMinExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Max 3-Yr Violations
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={maxViolations3Years}
                    onChange={(e) => setMaxViolations3Years(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Equipment Checkbox Chips */}
              <div>
                <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 6 }}>
                  Required Equipment Types *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const isChecked = equipmentType.includes(eq);
                    return (
                      <button
                        type="button"
                        key={eq}
                        onClick={() => toggleEquipment(eq)}
                        style={{
                          padding: '6px 12px',
                          border: `1px solid ${isChecked ? AMBER : RULE}`,
                          background: isChecked ? 'rgba(240, 162, 59, 0.12)' : '#fff',
                          color: isChecked ? INK : MUTED,
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: isChecked ? 700 : 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>{isChecked ? '✓' : '+'}</span>
                        <span>{eq}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Compensation & Lane Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <DollarSign size={14} color={AMBER_TEXT} />
                <span style={monoStyle(11, INK, '0.1em')}>04 // COMPENSATION & ROUTE LANES</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label htmlFor="payPerMile" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Pay Per Mile / Package
                  </label>
                  <input
                    id="payPerMile"
                    type="text"
                    value={payPerMile}
                    onChange={(e) => setPayPerMile(e.target.value)}
                    placeholder="e.g. $0.78 CPM or $1,600/wk"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="avgWeeklyMiles" style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Avg Weekly Miles
                  </label>
                  <input
                    id="avgWeeklyMiles"
                    type="text"
                    value={avgWeeklyMiles}
                    onChange={(e) => setAvgWeeklyMiles(e.target.value)}
                    placeholder="e.g. 2,600 - 3,000"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Guaranteed Weekly Min
                  </label>
                  <input
                    type="text"
                    value={guaranteedWeeklyMin}
                    onChange={(e) => setGuaranteedWeeklyMin(e.target.value)}
                    placeholder="e.g. $1,400/wk"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: MONO,
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Hometime Cadence
                  </label>
                  <input
                    type="text"
                    value={hometimeCadence}
                    onChange={(e) => setHometimeCadence(e.target.value)}
                    placeholder="e.g. Weekly (34-48h reset)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ ...monoStyle(10, MUTED), display: 'block', marginBottom: 4 }}>
                    Operating Lanes
                  </label>
                  <input
                    type="text"
                    value={operatingLanes}
                    onChange={(e) => setOperatingLanes(e.target.value)}
                    placeholder="e.g. Texas Triangle & Midwest Regional"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${RULE}`,
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Rider / Pet Policy */}
              <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={petPolicy}
                    onChange={(e) => setPetPolicy(e.target.checked)}
                  />
                  <span>Pets Allowed in Rig</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={passengerPolicy}
                    onChange={(e) => setPassengerPolicy(e.target.checked)}
                  />
                  <span>Rider / Passenger Policy</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              background: '#f8fafc',
              borderTop: `1px solid ${RULE}`,
              padding: '14px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={monoStyle(10, MUTED)}>
              STATUS: CONTINGENCY PLACEMENT FEE TERMS ($4,500 TOTAL)
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '9px 16px',
                  background: '#fff',
                  border: `1px solid ${RULE}`,
                  fontFamily: MONO,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '9px 18px',
                  background: AMBER,
                  color: INK,
                  border: 'none',
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={12} />
                <span>{isSubmitting ? 'Dispatching Requisition...' : 'Create & Match Requisition'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
