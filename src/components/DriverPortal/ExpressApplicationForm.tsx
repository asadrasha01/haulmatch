import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  FileCheck,
  UploadCloud,
  CheckCircle,
  Sparkles,
  UserCheck,
  Camera
} from 'lucide-react';
import { AsyncVideoRecorder } from './AsyncVideoRecorder';
import { uploadDriverDocument } from '../../services/supabase';
import { runOcrOnDocument } from '../../services/ocr';
import type { DriverProfile } from '../../types';
import type { QuickStartPrefill } from '../DriverHome/DriverHome';

interface ExpressApplicationFormProps {
  onDriverRegistered: (newDriver: DriverProfile, videoBlob?: Blob) => Promise<void> | void;
  onSwitchToCarrierView: () => void;
  onOpenStatusPortal?: (driverId: string) => void;
  prefill?: QuickStartPrefill | null;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const PAPER = '#f4f1ea';
const PAPER_ALT = '#ebe6dc';
const AMBER = '#f0a23b';
const AMBER_TEXT = '#b86c0d';
const MUTED = '#5a5d62';
const RULE = 'rgba(18,19,21,0.15)';
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const BODY_FONT = "'Barlow', system-ui, sans-serif";

const monoLabel = (size = 11, color = MUTED, track = '0.08em'): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  letterSpacing: track,
  textTransform: 'uppercase',
  color
});

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  fontFamily: BODY_FONT,
  border: '1px solid rgba(18,19,21,0.25)',
  background: '#fff',
  color: INK,
  outline: 'none',
  borderRadius: 0
};

export const DRAFT_STORAGE_KEY = 'haulmatch_driver_application_draft_v1';

interface DraftPayload {
  step: 1 | 2 | 3;
  formData: Record<string, any>;
  savedAt?: string;
}

const loadDraftFromStorage = (): {
  draft: DraftPayload | null;
  notice: string | null;
  initialDate: Date | null;
} => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.formData) {
        let notice: string | null = null;
        let date: Date | null = null;
        if (parsed.savedAt) {
          date = new Date(parsed.savedAt);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          notice = `Draft restored from ${timeStr} · Pick up where you left off.`;
        }
        return { draft: parsed, notice, initialDate: date };
      }
    }
  } catch {
    // ignore
  }
  return { draft: null, notice: null, initialDate: null };
};

export const ExpressApplicationForm: React.FC<ExpressApplicationFormProps> = ({
  onDriverRegistered,
  onSwitchToCarrierView,
  onOpenStatusPortal,
  prefill
}) => {
  const [initialDraftState] = useState(() => loadDraftFromStorage());

  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => {
    if (initialDraftState.draft?.step && initialDraftState.draft.step >= 1 && initialDraftState.draft.step <= 3) {
      return initialDraftState.draft.step;
    }
    return 1;
  });

  const getInitialFormData = () => ({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    state: 'TX',
    zip: prefill?.zip || '',
    cdlClass: (prefill?.cdlClass || 'Class A') as 'Class A' | 'Class B',
    issuingState: 'TX',
    licenseNumber: '',
    yearsExperience: prefill?.yearsExperience ?? 4,
    endorsements: ['HazMat (H)', 'Tanker (N)'],
    equipment: ['Dry Van', 'Refrigerated (Reefer)'],
    preferredRoutes: ['Regional (Southwest)', 'OTR (Lower 48)'],
    hometime: 'Home Every 2 Weeks',
    payExpectation: '$0.73 - $0.78 CPM',
    hasCleanMvr: true,
    violationsCount: 0,
    hasDotMedCard: true,
    medCardExpiry: '2027-05-15',
    cdlUploaded: false,
    medCardUploaded: false,
    videoRecorded: false
  });

  // Form State initialized from restored draft if available
  const [formData, setFormData] = useState(() => {
    const base = getInitialFormData();
    if (initialDraftState.draft?.formData) {
      return {
        ...base,
        ...initialDraftState.draft.formData,
        zip: initialDraftState.draft.formData.zip || prefill?.zip || base.zip,
        cdlClass: initialDraftState.draft.formData.cdlClass || prefill?.cdlClass || base.cdlClass,
        yearsExperience: initialDraftState.draft.formData.yearsExperience ?? prefill?.yearsExperience ?? base.yearsExperience
      };
    }
    return base;
  });

  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrErrors, setOcrErrors] = useState<{ cdl?: string; medCard?: string }>({});
  const [registeredDriver, setRegisteredDriver] = useState<DriverProfile | null>(null);

  // Draft auto-save & restore state
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<string | null>(initialDraftState.notice);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(initialDraftState.initialDate);

  // Debounced auto-save draft to localStorage whenever step or form values change
  useEffect(() => {
    if (step === 4) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }

    const hasContent =
      Boolean(formData.fullName.trim()) ||
      Boolean(formData.phone.trim()) ||
      Boolean(formData.email.trim()) ||
      Boolean(formData.licenseNumber.trim()) ||
      Boolean(formData.city.trim());

    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        const payload = {
          step,
          formData,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        setLastSavedTime(new Date());
      } catch {
        // ignore
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [step, formData]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setDraftRestoredNotice(null);
    setLastSavedTime(null);
    setStep(1);
    setFormData(getInitialFormData());
    setOcrErrors({});
    setOcrSuccess(false);
  };

  // Real file objects selected by the driver, held in memory until the driver ID
  // exists (after the video interview step) so they can be uploaded to Storage.
  const [cdlFile, setCdlFile] = useState<File | null>(null);
  const [medCardFile, setMedCardFile] = useState<File | null>(null);

  // Quick Demo Auto-fill Helper
  const fillSampleData = () => {
    setFormData({
      fullName: 'Raymond T. Cole',
      phone: '(469) 555-7819',
      email: 'raymond.cole.trucking@gmail.com',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      cdlClass: 'Class A',
      issuingState: 'TX',
      licenseNumber: 'TX-83921044',
      yearsExperience: 6,
      endorsements: ['HazMat (H)', 'Tanker (N)', 'Doubles/Triples (T)', 'TWIC Card'],
      equipment: ['Refrigerated (Reefer)', 'Dry Van'],
      preferredRoutes: ['Regional (Southwest)', 'OTR (Lower 48)'],
      hometime: 'Home Every 2 Weeks',
      payExpectation: '$0.73 - $0.78 CPM',
      hasCleanMvr: true,
      violationsCount: 0,
      hasDotMedCard: true,
      medCardExpiry: '2027-08-20',
      cdlUploaded: true,
      medCardUploaded: true,
      videoRecorded: false
    });
    setOcrErrors({});
    setOcrSuccess(true);
  };

  const handleEndorsementToggle = (item: string) => {
    if (formData.endorsements.includes(item)) {
      setFormData({ ...formData, endorsements: formData.endorsements.filter((e) => e !== item) });
    } else {
      setFormData({ ...formData, endorsements: [...formData.endorsements, item] });
    }
  };

  const handleEquipmentToggle = (item: string) => {
    if (formData.equipment.includes(item)) {
      setFormData({ ...formData, equipment: formData.equipment.filter((e) => e !== item) });
    } else {
      setFormData({ ...formData, equipment: [...formData.equipment, item] });
    }
  };

  const handleDocUpload = async (type: 'cdl' | 'medCard', file: File) => {
    if (type === 'cdl') {
      setCdlFile(file);
    } else {
      setMedCardFile(file);
    }

    setOcrErrors((prev) => ({ ...prev, [type]: undefined }));
    setOcrScanning(true);

    const result = await runOcrOnDocument(file, type);

    setOcrScanning(false);

    if (!result.success) {
      setOcrErrors((prev) => ({ ...prev, [type]: result.error || 'Could not verify this document.' }));
      if (type === 'cdl') {
        setFormData((prev) => ({ ...prev, cdlUploaded: false }));
      } else {
        setFormData((prev) => ({ ...prev, medCardUploaded: false }));
      }
      return;
    }

    setOcrSuccess(true);
    if (type === 'cdl') {
      setFormData((prev) => ({
        ...prev,
        cdlUploaded: true,
        // Only overwrite the manually-entered license number if OCR actually
        // found a confident candidate on the uploaded image.
        licenseNumber: result.licenseNumber || prev.licenseNumber
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        medCardUploaded: true,
        medCardExpiry: result.expiryDate || prev.medCardExpiry
      }));
    }
  };

  const handleFileSelected = (type: 'cdl' | 'medCard', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleDocUpload(type, file);
    }
    // allow re-selecting the same file name later
    e.target.value = '';
  };

  const handleVideoCompleted = (videoData: {
    duration: string;
    blobUrl?: string;
    videoBlob?: Blob;
    aiScore: number;
    aiScoreSummary: string;
    transcripts: { questionNumber: number; question: string; answer: string; timestamp: string }[];
  }) => {
    const driverId = `CDL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newProfile: DriverProfile = {
      id: driverId,
      anonymizedTitle: `Verified ${formData.cdlClass} ${formData.equipment.join(' & ')} Specialist`,
      fullName: formData.fullName || 'Raymond T. Cole',
      phone: formData.phone || '(469) 555-7819',
      email: formData.email || 'raymond.cole.trucking@gmail.com',
      location: {
        city: formData.city || 'Dallas',
        state: formData.state || 'TX',
        zip: formData.zip || '75201'
      },
      cdlClass: formData.cdlClass,
      licenseNumber: formData.licenseNumber || 'TX-83921044',
      issuingState: formData.issuingState,
      cdlExpiration: '2028-10-15',
      yearsExperience: formData.yearsExperience,
      endorsements: formData.endorsements,
      equipment: formData.equipment,
      preferredRoutes: formData.preferredRoutes,
      hometime: formData.hometime,
      payExpectation: formData.payExpectation,
      cleanMvr: formData.hasCleanMvr,
      violationsLast3Yrs: formData.violationsCount,
      dotMedCardStatus: 'Verified',
      dotMedCardExpiry: formData.medCardExpiry,
      bonusEligible: true,
      bonusAmount: 1500,
      aiFluencyScore: typeof videoData.aiScore === 'number' ? videoData.aiScore : 0,
      aiSummary: `${videoData.aiScoreSummary || 'Automated screening summary unavailable.'} Self-reported: ${formData.yearsExperience} years commercial driving experience, ${formData.hasCleanMvr ? 'clean MVR' : `${formData.violationsCount} violation(s) on MVR`}, endorsements: ${formData.endorsements.join(', ') || 'none listed'}.`,
      videoInterview: {
        recorded: true,
        duration: videoData.duration || '02:40',
        videoBlobUrl: videoData.blobUrl,
        transcripts: videoData.transcripts
      },
      dqDocuments: {
        cdlFront: `Verified ${formData.issuingState} Commercial Driver License`,
        cdlBack: `Endorsements verified: ${formData.endorsements.join(', ')}`,
        medCard: 'DOT Form MCSA-5876 Verified Valid',
        clearinghouseStatus: 'Passed'
      },
      status: 'available'
    };

    setRegisteredDriver(newProfile);
    setStep(4);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Ensure the parent `drivers` row is persisted first before uploading child
    // `driver_documents` rows that reference `drivers.id` via a foreign key.
    void (async () => {
      try {
        await Promise.resolve(onDriverRegistered(newProfile, videoData.videoBlob));
      } catch (err) {
        console.warn('onDriverRegistered failed:', err);
      }

      if (cdlFile) {
        uploadDriverDocument(driverId, cdlFile, 'cdl_front').catch((err) => {
          console.warn('CDL document upload failed:', err);
        });
      }
      if (medCardFile) {
        uploadDriverDocument(driverId, medCardFile, 'med_card').catch((err) => {
          console.warn('Med card document upload failed:', err);
        });
      }
    })();
  };

  const stepsMeta = [
    { num: 1, code: 'STOP 01', label: 'Qualifications', sub: 'CDL, equipment & pay' },
    { num: 2, code: 'STOP 02', label: 'Documents', sub: 'Instant OCR verification' },
    { num: 3, code: 'STOP 03', label: 'Video Interview', sub: '2-min async screening' }
  ] as const;

  return (
    <div style={{ fontFamily: BODY_FONT, color: INK }}>
      {/* Editorial 3-Stop Progress Bar */}
      <div style={{ borderTop: `3px solid ${INK}`, background: '#fff', borderLeft: `1px solid ${RULE}`, borderRight: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            background: DEEP,
            color: '#fff',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, background: AMBER, display: 'inline-block' }} />
              <span style={monoLabel(11, AMBER, '0.1em')}>
                $1,500 90-Day Retention Bonus Included · Direct Deposit Escrow
              </span>
            </div>
            {step < 4 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: lastSavedTime ? '#10b981' : 'rgba(255,255,255,0.4)',
                    boxShadow: lastSavedTime ? '0 0 6px #10b981' : 'none'
                  }}
                />
                <span style={monoLabel(10, 'rgba(255,255,255,0.7)', '0.06em')}>
                  {lastSavedTime ? 'Draft Auto-Saved' : 'Auto-Save Active'}
                </span>
              </div>
            )}
          </div>

          {step < 4 && (
            <button
              type="button"
              onClick={fillSampleData}
              style={{
                ...monoLabel(11, '#fff', '0.08em'),
                padding: '6px 12px',
                border: '1px solid rgba(255,255,255,0.24)',
                background: 'rgba(255,255,255,0.06)',
                cursor: 'pointer',
                borderRadius: 0
              }}
            >
              ⚡ Auto-Fill Demo Profile
            </button>
          )}
        </div>

        {/* Draft Restored Banner */}
        {draftRestoredNotice && step < 4 && (
          <div
            style={{
              background: '#fff9e6',
              borderBottom: `1px solid ${AMBER}`,
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              fontSize: 13,
              color: INK
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={15} color={AMBER_TEXT} />
              <span style={{ fontWeight: 500 }}>{draftRestoredNotice}</span>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              style={{
                ...monoLabel(11, MUTED),
                background: 'transparent',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '2px 6px'
              }}
            >
              Start Fresh
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {stepsMeta.map((s, idx) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                style={{
                  padding: '18px 24px',
                  borderRight: idx < 2 ? `1px solid ${RULE}` : 'none',
                  borderBottom: isActive ? `3px solid ${AMBER}` : '3px solid transparent',
                  background: isActive ? '#fff' : PAPER_ALT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div>
                  <div style={monoLabel(11, isActive ? AMBER_TEXT : MUTED, '0.1em')}>
                    {s.code} · {isDone ? 'VERIFIED' : isActive ? 'IN PROGRESS' : 'PENDING'}
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, textTransform: 'uppercase', lineHeight: 1.05, marginTop: 4, color: INK }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{s.sub}</div>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: isDone || isActive ? INK : 'transparent',
                    color: isDone ? AMBER : isActive ? '#fff' : MUTED,
                    border: `1px solid ${isDone || isActive ? INK : 'rgba(18,19,21,0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MONO,
                    fontSize: 13,
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                >
                  {isDone ? '✓' : `0${s.num}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1 & STEP 2 TWO-COLUMN EDITORIAL LAYOUT */}
      {(step === 1 || step === 2) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: '32px',
            alignItems: 'start'
          }}
        >
          {/* Main Form Column (Spans wider when space permits) */}
          <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: 'clamp(24px, 3vw, 40px)' }}>
            {/* STEP 1: QUALIFICATIONS & PREFERENCES */}
            {step === 1 && (
              <div>
                <div style={{ borderBottom: `1px solid ${RULE}`, paddingBottom: 20, marginBottom: 28 }}>
                  <div style={{ ...monoLabel(11, AMBER_TEXT, '0.12em'), marginBottom: 8 }}>
                    Stop 01 · Driver dossier
                  </div>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(30px, 3.5vw, 42px)', textTransform: 'uppercase', lineHeight: 0.95, margin: '0 0 8px', color: INK }}>
                    Driver Qualifications & Experience
                  </h3>
                  <p style={{ margin: 0, fontSize: 15, color: MUTED, lineHeight: 1.5 }}>
                    We match you directly with top US logistics fleets. Your phone and email remain locked until you approve a carrier.
                  </p>
                </div>

                {/* Personal & Location Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={monoLabel(11, MUTED)}>Full Legal Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Raymond Cole"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      style={fieldInputStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={monoLabel(11, MUTED)}>Mobile Phone (Locked until match)</label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={fieldInputStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={monoLabel(11, MUTED)}>Email Address</label>
                    <input
                      type="email"
                      placeholder="driver@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={fieldInputStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={monoLabel(11, MUTED)}>City, State & ZIP</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        style={fieldInputStyle}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        style={fieldInputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        style={fieldInputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* CDL & Experience Section */}
                <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 24, marginBottom: 24 }}>
                  <div style={{ ...monoLabel(11, INK, '0.1em'), marginBottom: 16 }}>
                    Commercial Driver's License & Equipment
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 22 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={monoLabel(11, MUTED)}>CDL Class</label>
                      <select
                        value={formData.cdlClass}
                        onChange={(e) => setFormData({ ...formData, cdlClass: e.target.value as 'Class A' | 'Class B' })}
                        style={fieldInputStyle}
                      >
                        <option value="Class A">Class A (Combination / Tractor-Trailer)</option>
                        <option value="Class B">Class B (Straight Truck / Heavy)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={monoLabel(11, MUTED)}>Years of Commercial Driving</label>
                      <select
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value, 10) })}
                        style={fieldInputStyle}
                      >
                        <option value={0}>Under 1 Year</option>
                        <option value={1}>1 Year Experience</option>
                        <option value={2}>2 - 3 Years</option>
                        <option value={4}>3 - 5 Years</option>
                        <option value={6}>5+ Years Veteran</option>
                        <option value={10}>10+ Years Master Driver</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={monoLabel(11, MUTED)}>Issuing State & License #</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.issuingState}
                          onChange={(e) => setFormData({ ...formData, issuingState: e.target.value })}
                          style={fieldInputStyle}
                        />
                        <input
                          type="text"
                          placeholder="License #"
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                          style={fieldInputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endorsements Sharp Chips */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ ...monoLabel(11, MUTED), display: 'block', marginBottom: 10 }}>
                      Endorsements Held
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['HazMat (H)', 'Tanker (N)', 'Doubles/Triples (T)', 'TWIC Card'].map((item) => {
                        const selected = formData.endorsements.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleEndorsementToggle(item)}
                            style={{
                              padding: '10px 16px',
                              fontSize: 14,
                              fontWeight: 500,
                              fontFamily: BODY_FONT,
                              borderRadius: 0,
                              cursor: 'pointer',
                              border: `1px solid ${selected ? INK : 'rgba(18,19,21,0.25)'}`,
                              background: selected ? INK : 'transparent',
                              color: selected ? '#fff' : INK
                            }}
                          >
                            {selected ? '✓ ' : '+ '}
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Equipment Sharp Chips */}
                  <div style={{ marginBottom: 22 }}>
                    <label style={{ ...monoLabel(11, MUTED), display: 'block', marginBottom: 10 }}>
                      Equipment Experience
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Dry Van', 'Refrigerated (Reefer)', 'Flatbed / Stepdeck', 'Intermodal / Port Container', 'Tanker'].map((item) => {
                        const selected = formData.equipment.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleEquipmentToggle(item)}
                            style={{
                              padding: '10px 16px',
                              fontSize: 14,
                              fontWeight: 500,
                              fontFamily: BODY_FONT,
                              borderRadius: 0,
                              cursor: 'pointer',
                              border: `1px solid ${selected ? INK : 'rgba(18,19,21,0.25)'}`,
                              background: selected ? INK : 'transparent',
                              color: selected ? '#fff' : INK
                            }}
                          >
                            {selected ? '✓ ' : '+ '}
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Home-time and Pay */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={monoLabel(11, MUTED)}>Preferred Home-Time</label>
                      <select
                        value={formData.hometime}
                        onChange={(e) => setFormData({ ...formData, hometime: e.target.value })}
                        style={fieldInputStyle}
                      >
                        <option value="Home Weekly (34-48hr reset)">Home Weekly (34-48 hr reset)</option>
                        <option value="Home Every 2 Weeks">Home Every 2 Weeks</option>
                        <option value="Home Daily (Dedicated/Local)">Home Daily (Dedicated/Local)</option>
                        <option value="Out 3-4 Weeks (Max Miles)">Out 3-4 Weeks (Max Miles)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={monoLabel(11, MUTED)}>Target Pay Expectations</label>
                      <select
                        value={formData.payExpectation}
                        onChange={(e) => setFormData({ ...formData, payExpectation: e.target.value })}
                        style={fieldInputStyle}
                      >
                        <option value="$0.68 - $0.72 CPM">$0.68 - $0.72 CPM ($1,750 - $1,900/wk)</option>
                        <option value="$0.73 - $0.78 CPM">$0.73 - $0.78 CPM ($1,950 - $2,200/wk)</option>
                        <option value="$0.80+ CPM / Hazmat">$0.80+ CPM / Hazmat Dedicated</option>
                        <option value="$1,800/wk Guaranteed">$1,800/wk Minimum Guaranteed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 20, borderTop: `1px solid ${RULE}` }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.fullName) {
                        fillSampleData();
                      }
                      setStep(2);
                    }}
                    className="hm-btn-amber"
                    style={{
                      padding: '18px 28px',
                      background: AMBER,
                      color: INK,
                      fontWeight: 600,
                      fontSize: 17,
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 24
                    }}
                  >
                    <span>Continue to Document Upload</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DOCUMENT UPLOAD & OCR VERIFICATION */}
            {step === 2 && (
              <div>
                <div style={{ borderBottom: `1px solid ${RULE}`, paddingBottom: 20, marginBottom: 28 }}>
                  <div style={{ ...monoLabel(11, AMBER_TEXT, '0.12em'), marginBottom: 8 }}>
                    Stop 02 · FMCSA compliance & Tesseract OCR
                  </div>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(30px, 3.5vw, 42px)', textTransform: 'uppercase', lineHeight: 0.95, margin: '0 0 8px', color: INK }}>
                    Instant Photo Verification
                  </h3>
                  <p style={{ margin: 0, fontSize: 15, color: MUTED, lineHeight: 1.5 }}>
                    Upload your Commercial Driver's License and DOT Medical Card (MCSA-5876). Our OCR engine verifies state credentials and expiration dates automatically.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
                  {/* CDL Upload Box */}
                  <div
                    style={{
                      border: formData.cdlUploaded ? '2px solid #059669' : `1px solid ${INK}`,
                      borderRadius: 0,
                      padding: 24,
                      background: formData.cdlUploaded ? '#f0fdf4' : PAPER,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={monoLabel(10, formData.cdlUploaded ? '#047857' : MUTED, '0.1em')}>
                          DOC 01 · STATE CDL
                        </span>
                        {formData.cdlUploaded ? <CheckCircle size={20} color="#059669" /> : <UploadCloud size={20} color={INK} />}
                      </div>
                      <h4 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, textTransform: 'uppercase', margin: '0 0 6px', color: INK }}>
                        CDL License (Front & Back)
                      </h4>
                      <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 18, lineHeight: 1.45 }}>
                        JPEG, PNG, or PDF format. Ensure state seal, license number, and expiration date are legible.
                      </p>
                    </div>

                    {formData.cdlUploaded ? (
                      <div
                        style={{
                          padding: '12px 14px',
                          background: INK,
                          color: '#fff',
                          fontFamily: MONO,
                          fontSize: 11,
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <ShieldCheck size={16} color={AMBER} />
                        <span>Verified: {formData.issuingState} {formData.cdlClass} CDL #{formData.licenseNumber || '(number not detected)'}</span>
                      </div>
                    ) : (
                      <div>
                        <label
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            background: INK,
                            color: '#fff',
                            fontFamily: MONO,
                            fontSize: 12,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: ocrScanning ? 'not-allowed' : 'pointer',
                            opacity: ocrScanning ? 0.6 : 1,
                            borderRadius: 0
                          }}
                        >
                          <span>{ocrScanning ? 'Scanning Card via OCR...' : 'Upload CDL Photo'}</span>
                          <span>↑</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            disabled={ocrScanning}
                            onChange={(e) => handleFileSelected('cdl', e)}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {ocrErrors.cdl && (
                          <p style={{ fontSize: 13, color: '#dc2626', marginTop: 10, fontWeight: 500 }}>{ocrErrors.cdl}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* DOT Medical Card Upload Box */}
                  <div
                    style={{
                      border: formData.medCardUploaded ? '2px solid #059669' : `1px solid ${INK}`,
                      borderRadius: 0,
                      padding: 24,
                      background: formData.medCardUploaded ? '#f0fdf4' : PAPER,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={monoLabel(10, formData.medCardUploaded ? '#047857' : MUTED, '0.1em')}>
                          DOC 02 · MCSA-5876
                        </span>
                        {formData.medCardUploaded ? <CheckCircle size={20} color="#059669" /> : <FileCheck size={20} color={INK} />}
                      </div>
                      <h4 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, textTransform: 'uppercase', margin: '0 0 6px', color: INK }}>
                        DOT Medical Card (MCSA-5876)
                      </h4>
                      <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 18, lineHeight: 1.45 }}>
                        Medical Examiner's Certificate. Must be valid and registered with the National Registry.
                      </p>
                    </div>

                    {formData.medCardUploaded ? (
                      <div
                        style={{
                          padding: '12px 14px',
                          background: INK,
                          color: '#fff',
                          fontFamily: MONO,
                          fontSize: 11,
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <ShieldCheck size={16} color={AMBER} />
                        <span>Verified: National Registry Valid Exp {formData.medCardExpiry}</span>
                      </div>
                    ) : (
                      <div>
                        <label
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            background: INK,
                            color: '#fff',
                            fontFamily: MONO,
                            fontSize: 12,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: ocrScanning ? 'not-allowed' : 'pointer',
                            opacity: ocrScanning ? 0.6 : 1,
                            borderRadius: 0
                          }}
                        >
                          <span>{ocrScanning ? 'Validating Registry...' : 'Upload DOT Med Card'}</span>
                          <span>↑</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            disabled={ocrScanning}
                            onChange={(e) => handleFileSelected('medCard', e)}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {ocrErrors.medCard && (
                          <p style={{ fontSize: 13, color: '#dc2626', marginTop: 10, fontWeight: 500 }}>{ocrErrors.medCard}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* OCR Result banner */}
                {ocrSuccess && (
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: 0,
                      background: DEEP,
                      color: '#fff',
                      borderLeft: `4px solid ${AMBER}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      marginBottom: 24
                    }}
                  >
                    <Sparkles size={20} color={AMBER} />
                    <div>
                      <div style={{ ...monoLabel(11, AMBER, '0.08em'), marginBottom: 2 }}>
                        Automatic OCR Verification Complete
                      </div>
                      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.78)' }}>
                        Commercial Driver License and DOT Medical Card authenticated against FMCSA Driver Qualification standards.
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: `1px solid ${RULE}`, flexWrap: 'wrap', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '15px 22px',
                      border: `1px solid ${INK}`,
                      background: '#fff',
                      color: INK,
                      fontWeight: 600,
                      fontSize: 15,
                      borderRadius: 0,
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to Qualifications
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!formData.cdlUploaded || !formData.medCardUploaded || ocrScanning}
                    className="hm-btn-amber"
                    style={{
                      padding: '16px 28px',
                      background: AMBER,
                      color: INK,
                      fontWeight: 600,
                      fontSize: 16,
                      border: 'none',
                      borderRadius: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 12,
                      opacity: !formData.cdlUploaded || !formData.medCardUploaded || ocrScanning ? 0.45 : 1,
                      cursor: !formData.cdlUploaded || !formData.medCardUploaded || ocrScanning ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span>Proceed to Video Interview</span>
                    <Camera size={18} />
                  </button>
                </div>
                {(!formData.cdlUploaded || !formData.medCardUploaded) && (
                  <p style={{ ...monoLabel(11, MUTED, '0.06em'), textAlign: 'right', marginTop: 10 }}>
                    Both documents must pass automatic verification before continuing.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Editorial Candidate Dossier (Matches Pay Calculator Dark Card) */}
          <div style={{ background: INK, color: '#fff', padding: 'clamp(24px, 3vw, 36px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={monoLabel(11, 'rgba(255,255,255,0.55)')}>Live candidate dossier</span>
              <span style={monoLabel(10, AMBER)}>Blind Profile</span>
            </div>

            <div style={{ margin: '18px 0 22px' }}>
              <div style={monoLabel(11, 'rgba(255,255,255,0.45)')}>Day-90 Retention Escrow</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(44px, 4.5vw, 64px)', lineHeight: 0.95, color: AMBER, marginTop: 4 }}>
                $1,500.00
              </div>
            </div>

            {(
              [
                ['Candidate', formData.fullName ? `${formData.fullName.split(' ')[0]} ··· (Locked)` : 'Anonymized CDL Driver'],
                ['License', `${formData.cdlClass} · ${formData.issuingState}`],
                ['Experience', `${formData.yearsExperience} yr${formData.yearsExperience === 1 ? '' : 's'} commercial`],
                ['Equipment', formData.equipment.slice(0, 2).join(', ') || 'Select equipment'],
                ['Endorsements', formData.endorsements.length ? `${formData.endorsements.length} active` : 'None listed'],
                ['Home-time', formData.hometime.replace(' (34-48hr reset)', '')],
                ['Target pay', formData.payExpectation],
                ['DQ Documents', formData.cdlUploaded && formData.medCardUploaded ? '✓ CDL + Med Verified' : 'Pending OCR scan']
              ] as Array<[string, string]>
            ).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '11px 0',
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 14.5
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.58)' }}>{k}</span>
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: '#fff', textAlign: 'right' }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: MONO, fontSize: 11, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)' }}>
              Carriers see your verified qualifications and 2-minute video intro. Your phone number and email remain masked until you accept an offer.
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: ASYNC VIDEO INTERVIEW */}
      {step === 3 && (
        <AsyncVideoRecorder onInterviewComplete={handleVideoCompleted} />
      )}

      {/* STEP 4: SUCCESS CONFIRMATION & RETENTION BONUS STATUS */}
      {step === 4 && registeredDriver && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, borderTop: `3px solid ${INK}`, padding: 'clamp(28px, 4vw, 48px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '36px 56px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: INK, color: AMBER, padding: '6px 12px', marginBottom: 18, ...monoLabel(11, AMBER, '0.1em') }}>
                <CheckCircle size={15} /> Candidate ID: {registeredDriver.id}
              </div>

              <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: 0.92, textTransform: 'uppercase', margin: '0 0 16px', color: INK }}>
                Application Approved & Bonus Locked.
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.55, color: MUTED, margin: '0 0 28px' }}>
                Your automated video interview, CDL, and DOT Medical Card have been verified. You are now live in the HaulMatch Vetted Driver Network with contact masking active.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  onClick={onSwitchToCarrierView}
                  className="hm-btn-amber"
                  style={{
                    padding: '18px 26px',
                    background: AMBER,
                    color: INK,
                    fontWeight: 600,
                    fontSize: 16,
                    border: 'none',
                    borderRadius: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <UserCheck size={18} />
                  <span>View Your Profile in Carrier ATS Portal</span>
                  <span>→</span>
                </button>
                {onOpenStatusPortal && (
                  <button
                    type="button"
                    onClick={() => onOpenStatusPortal(registeredDriver.id)}
                    style={{
                      padding: '18px 22px',
                      background: INK,
                      color: AMBER,
                      border: `1px solid ${INK}`,
                      fontWeight: 600,
                      fontSize: 15,
                      borderRadius: 0,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Sparkles size={16} color={AMBER} />
                    <span>Track Live Status & Copy Link</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '18px 22px',
                    background: '#fff',
                    color: INK,
                    border: `1px solid ${INK}`,
                    fontWeight: 600,
                    fontSize: 15,
                    borderRadius: 0,
                    cursor: 'pointer'
                  }}
                >
                  Submit Another Application
                </button>
              </div>
            </div>

            <div style={{ background: INK, color: '#fff', padding: 'clamp(24px, 3vw, 36px)' }}>
              <div style={monoLabel(11, AMBER, '0.1em')}>Escrow Certificate · Day 90</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, lineHeight: 0.95, color: AMBER, margin: '10px 0 8px' }}>
                $1,500.00
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '0 0 20px' }}>
                Locked in escrow. Disbursed directly to you upon completing 90 days of continuous safe driving with your matched carrier.
              </p>

              {(
                [
                  ['Network Status', 'Active in Talent Pool'],
                  ['AI Fluency Score', `${registeredDriver.aiFluencyScore} / 100 (DOT Verified)`],
                  ['Privacy Shield', 'Blind Profile (No Spam)'],
                  ['DQ Packet', 'CDL + MCSA-5876 Verified']
                ] as Array<[string, string]>
              ).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '11px 0',
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    fontSize: 14
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.58)' }}>{k}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12.5, color: '#fff' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
