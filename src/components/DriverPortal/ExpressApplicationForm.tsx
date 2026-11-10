import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  FileCheck,
  DollarSign,
  UploadCloud,
  CheckCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  Camera
} from 'lucide-react';
import { AsyncVideoRecorder } from './AsyncVideoRecorder';
import { uploadDriverDocument } from '../../services/supabase';
import { runOcrOnDocument } from '../../services/ocr';
import type { DriverProfile } from '../../types';

interface ExpressApplicationFormProps {
  onDriverRegistered: (newDriver: DriverProfile, videoBlob?: Blob) => void;
  onSwitchToCarrierView: () => void;
}

export const ExpressApplicationForm: React.FC<ExpressApplicationFormProps> = ({
  onDriverRegistered,
  onSwitchToCarrierView
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    state: 'TX',
    zip: '',
    cdlClass: 'Class A' as 'Class A' | 'Class B',
    issuingState: 'TX',
    licenseNumber: '',
    yearsExperience: 4,
    endorsements: ['HazMat (H)', 'Tanker (N)'],
    equipment: ['Dry Van', 'Refrigerated (Reefer)'],
    preferredRoutes: ['Regional (Southwest)', 'OTR (Lower 48)'],
    hometime: 'Home Every 2 Weeks',
    payExpectation: '$0.70 - $0.74 CPM',
    hasCleanMvr: true,
    violationsCount: 0,
    hasDotMedCard: true,
    medCardExpiry: '2027-05-15',
    cdlUploaded: false,
    medCardUploaded: false,
    videoRecorded: false
  });

  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrErrors, setOcrErrors] = useState<{ cdl?: string; medCard?: string }>({});
  const [registeredDriver, setRegisteredDriver] = useState<DriverProfile | null>(null);

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
      endorsements: ['HazMat (H)', 'Tanker (N)', 'Doubles/Triples (T)', 'TWIC'],
      equipment: ['Refrigerated (Reefer)', 'Dry Van'],
      preferredRoutes: ['Regional (Southwest)', 'OTR (Lower 48)'],
      hometime: 'Home Every 2 Weeks',
      payExpectation: '$0.72 - $0.75 CPM',
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

  const handleVideoCompleted = (videoData: any) => {
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
    onDriverRegistered(newProfile, videoData.videoBlob);
    setStep(4);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Now that the driver ID exists, push the real CDL / med card files (if the
    // driver actually selected real files rather than using the OCR demo flow)
    // to Supabase Storage + the driver_documents table. Fire-and-forget: a failed
    // upload shouldn't block the already-completed registration flow.
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
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Step Indicator Header */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-gold" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            <DollarSign size={15} /> $1,500 90-Day Retention Bonus Included
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step >= 1 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              1
            </div>
            <span style={{ fontSize: '0.85rem', color: step >= 1 ? '#fff' : 'var(--text-muted)' }}>Qualifications</span>
          </div>

          <div style={{ width: '20px', height: '1px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step >= 2 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              2
            </div>
            <span style={{ fontSize: '0.85rem', color: step >= 2 ? '#fff' : 'var(--text-muted)' }}>Documents</span>
          </div>

          <div style={{ width: '20px', height: '1px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step >= 3 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              3
            </div>
            <span style={{ fontSize: '0.85rem', color: step >= 3 ? '#fff' : 'var(--text-muted)' }}>Video Interview</span>
          </div>
        </div>

        {step < 4 && (
          <button
            onClick={fillSampleData}
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-highlight)',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            ⚡ Auto-Fill Demo Profile
          </button>
        )}
      </div>

      {/* STEP 1: QUALIFICATIONS & PREFERENCES */}
      {step === 1 && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Step 1: Driver Qualifications & Experience</h2>
            <p style={{ fontSize: '0.9rem' }}>
              We match you directly with top US logistics fleets. Your contact information is never shared until you decide.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Full Legal Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Raymond Cole"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Phone (for SMS Match Alerts)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="(555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="driver@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">City, State & Zip</label>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* CDL & Experience Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
              Commercial Driver's License Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">CDL Class</label>
                <select
                  className="form-select"
                  value={formData.cdlClass}
                  onChange={(e: any) => setFormData({ ...formData, cdlClass: e.target.value })}
                >
                  <option value="Class A">Class A (Combination / Tractor-Trailer)</option>
                  <option value="Class B">Class B (Straight Truck / Heavy)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Years of Commercial Driving</label>
                <select
                  className="form-select"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) })}
                >
                  <option value={1}>1 Year Experience</option>
                  <option value={2}>2 - 3 Years</option>
                  <option value={5}>4 - 6 Years</option>
                  <option value={8}>7 - 10 Years</option>
                  <option value={12}>10+ Years Veteran</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Issuing State & License #</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="State"
                    value={formData.issuingState}
                    onChange={(e) => setFormData({ ...formData, issuingState: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="License #"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Endorsements checkboxes */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Endorsements Held</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {['HazMat (H)', 'Tanker (N)', 'Doubles/Triples (T)', 'TWIC Card'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleEndorsementToggle(item)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: formData.endorsements.includes(item) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: formData.endorsements.includes(item) ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                      color: formData.endorsements.includes(item) ? '#60a5fa' : 'var(--text-secondary)'
                    }}
                  >
                    {formData.endorsements.includes(item) ? '✓ ' : '+ '} {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment checkboxes */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Equipment Experience</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {['Dry Van', 'Refrigerated (Reefer)', 'Flatbed / Stepdeck', 'Intermodal / Port Container', 'Tanker'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleEquipmentToggle(item)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: formData.equipment.includes(item) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: formData.equipment.includes(item) ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      color: formData.equipment.includes(item) ? '#34d399' : 'var(--text-secondary)'
                    }}
                  >
                    {formData.equipment.includes(item) ? '✓ ' : '+ '} {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Home-time and Pay */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Preferred Home-Time</label>
                <select
                  className="form-select"
                  value={formData.hometime}
                  onChange={(e) => setFormData({ ...formData, hometime: e.target.value })}
                >
                  <option value="Home Weekly (34-48hr reset)">Home Weekly (34-48 hr reset)</option>
                  <option value="Home Every 2 Weeks">Home Every 2 Weeks</option>
                  <option value="Home Daily (Dedicated/Local)">Home Daily (Dedicated/Local)</option>
                  <option value="Out 3-4 Weeks (Max Miles)">Out 3-4 Weeks (Max Miles)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Pay Expectations</label>
                <select
                  className="form-select"
                  value={formData.payExpectation}
                  onChange={(e) => setFormData({ ...formData, payExpectation: e.target.value })}
                >
                  <option value="$0.68 - $0.72 CPM">$0.68 - $0.72 CPM ($1,750 - $1,900/wk)</option>
                  <option value="$0.73 - $0.78 CPM">$0.73 - $0.78 CPM ($1,950 - $2,200/wk)</option>
                  <option value="$0.80+ CPM / Hazmat">$0.80+ CPM / Hazmat Dedicated</option>
                  <option value="$1,800/wk Guaranteed">$1,800/wk Minimum Guaranteed</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => {
                if (!formData.fullName) {
                  fillSampleData();
                }
                setStep(2);
              }}
              className="btn-primary"
              style={{ padding: '14px 32px' }}
            >
              Continue to Document Upload <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DOCUMENT UPLOAD & OCR VERIFICATION */}
      {step === 2 && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-emerald">FMCSA Compliance</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Step 2: Instant Photo Verification</h2>
            <p style={{ fontSize: '0.9rem' }}>
              Upload your Commercial Driver's License and DOT Medical Card. Our system automatically parses the data so you don't have to retype it.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            {/* CDL Upload Box */}
            <div
              style={{
                border: formData.cdlUploaded ? '2px solid #10b981' : '2px dashed var(--border-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                textAlign: 'center',
                background: formData.cdlUploaded ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: formData.cdlUploaded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  color: formData.cdlUploaded ? '#10b981' : '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                {formData.cdlUploaded ? <CheckCircle size={28} /> : <UploadCloud size={28} />}
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>CDL License (Front & Back)</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                JPEG, PNG, or PDF format. Ensure state seal and expiration date are legible.
              </p>

              {formData.cdlUploaded ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                  <ShieldCheck size={16} /> Verified: {formData.issuingState} {formData.cdlClass} CDL #{formData.licenseNumber || '(number not detected)'}
                </div>
              ) : (
                <>
                  <label
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: ocrScanning ? 'not-allowed' : 'pointer',
                      opacity: ocrScanning ? 0.6 : 1
                    }}
                  >
                    {ocrScanning ? 'Scanning Card via OCR...' : 'Upload CDL Photo'}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={ocrScanning}
                      onChange={(e) => handleFileSelected('cdl', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {ocrErrors.cdl && (
                    <p style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '10px' }}>{ocrErrors.cdl}</p>
                  )}
                </>
              )}
            </div>

            {/* DOT Medical Card Upload Box */}
            <div
              style={{
                border: formData.medCardUploaded ? '2px solid #10b981' : '2px dashed var(--border-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                textAlign: 'center',
                background: formData.medCardUploaded ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: formData.medCardUploaded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  color: formData.medCardUploaded ? '#10b981' : '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                {formData.medCardUploaded ? <CheckCircle size={28} /> : <FileCheck size={28} />}
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>DOT Medical Card (MCSA-5876)</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Medical Examiner's Certificate. Must be valid for at least 6 months.
              </p>

              {formData.medCardUploaded ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                  <ShieldCheck size={16} /> Verified: National Registry Valid Exp {formData.medCardExpiry}
                </div>
              ) : (
                <>
                  <label
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: ocrScanning ? 'not-allowed' : 'pointer',
                      opacity: ocrScanning ? 0.6 : 1
                    }}
                  >
                    {ocrScanning ? 'Validating Registry...' : 'Upload DOT Med Card'}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={ocrScanning}
                      onChange={(e) => handleFileSelected('medCard', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {ocrErrors.medCard && (
                    <p style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '10px' }}>{ocrErrors.medCard}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* OCR Result banner */}
          {ocrSuccess && (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}
            >
              <Sparkles size={22} color="#10b981" />
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                  Automatic OCR Verification Complete
                </p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Commercial Driver License and DOT Medical Card successfully authenticated against FMCSA standard requirements.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back to Qualifications
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.cdlUploaded || !formData.medCardUploaded || ocrScanning}
              className="btn-primary"
              style={{
                padding: '14px 32px',
                opacity: !formData.cdlUploaded || !formData.medCardUploaded || ocrScanning ? 0.5 : 1,
                cursor: !formData.cdlUploaded || !formData.medCardUploaded || ocrScanning ? 'not-allowed' : 'pointer'
              }}
            >
              Proceed to Video Interview <Camera size={18} />
            </button>
          </div>
          {(!formData.cdlUploaded || !formData.medCardUploaded) && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '8px' }}>
              Both documents must pass automatic verification before continuing.
            </p>
          )}
        </div>
      )}

      {/* STEP 3: ASYNC VIDEO INTERVIEW */}
      {step === 3 && (
        <AsyncVideoRecorder onInterviewComplete={handleVideoCompleted} />
      )}

      {/* STEP 4: SUCCESS CONFIRMATION & RETENTION BONUS STATUS */}
      {step === 4 && registeredDriver && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid rgba(16, 185, 129, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#10b981',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.35)'
            }}
          >
            <CheckCircle size={42} />
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '12px', padding: '6px 14px' }}>
            Candidate ID: {registeredDriver.id}
          </span>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            Application Approved & Bonus Locked!
          </h2>
          <p style={{ fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 24px auto', color: 'var(--text-secondary)' }}>
            Your automated video interview, CDL, and DOT Medical Card have been verified. You are now officially registered in the Vetted Driver Network.
          </p>

          {/* Retention Bonus Guarantee Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '600px',
              margin: '0 auto 28px auto',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'var(--gold-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a0f00',
                fontWeight: 800,
                fontSize: '1.4rem',
                flexShrink: 0
              }}
            >
              $1.5k
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', color: '#fef08a', marginBottom: '4px' }}>
                $1,500 90-Day Retention Cash Bonus Locked in Escrow
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                When you accept a placement with any of our partner logistics fleets and complete 90 days of continuous safe driving, this $1,500 check is paid directly to you.
              </p>
            </div>
          </div>

          {/* Carrier Matched Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              maxWidth: '700px',
              margin: '0 auto 32px auto',
              textAlign: 'left'
            }}
          >
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} /> Active in Talent Pool
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Fluency Score</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                {registeredDriver.aiFluencyScore} / 100 (DOT Verified)
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Privacy Shield</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b' }}>
                Blind Profile (No Spam)
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={onSwitchToCarrierView} className="btn-primary" style={{ padding: '14px 28px' }}>
              <UserCheck size={18} /> View Your Profile in Carrier ATS Portal
            </button>
            <button onClick={() => setStep(1)} className="btn-secondary">
              Submit Another Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
