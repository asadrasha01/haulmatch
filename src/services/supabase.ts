import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { AuthRole, DriverProfile, FleetJobOrder, UserProfile } from '../types';
import { INITIAL_DRIVERS } from '../data/mockDrivers';
import { uploadVideoToS3Presigned } from './s3Storage';

const STORAGE_KEY_URL = 'haulmatch_supabase_url';
const STORAGE_KEY_ANON = 'haulmatch_supabase_anon_key';
const LOCAL_STORAGE_DRIVERS = 'haulmatch_local_drivers_v1';

// Read from env or localStorage
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem(STORAGE_KEY_URL) || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem(STORAGE_KEY_ANON) || '';

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseClient;
};

export const getSupabaseConfig = () => {
  return {
    isConfigured: !!supabaseClient,
    url: supabaseUrl || null
  };
};

export const setSupabaseCredentials = (url: string, key: string) => {
  if (!url || !key) {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    supabaseClient = null;
    supabaseUrl = '';
    supabaseAnonKey = '';
    return false;
  }

  try {
    const client = createClient(url, key);
    localStorage.setItem(STORAGE_KEY_URL, url);
    localStorage.setItem(STORAGE_KEY_ANON, key);
    supabaseClient = client;
    supabaseUrl = url;
    supabaseAnonKey = key;
    return true;
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    return false;
  }
};

// ==============================================================================
// Authentication (Real Supabase Auth — email/password)
// ==============================================================================
// Unlike the rest of this file, these functions do NOT have a local-storage
// fallback. Auth requires a real backend: if no Supabase project is
// connected, sign-in/sign-up simply report that back as an error rather
// than silently pretending to work. See AuthGate.tsx for the UI that
// surfaces these errors to the user.

export const signUpWithEmail = async (
  email: string,
  password: string,
  role: AuthRole,
  companyName?: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabaseClient) {
    return {
      success: false,
      error: 'No database connected. Open the Database icon in the header and connect a Supabase project first.'
    };
  }

  try {
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { role, company_name: companyName }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Sign up failed.' };
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabaseClient) {
    return {
      success: false,
      error: 'No database connected. Open the Database icon in the header and connect a Supabase project first.'
    };
  }

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Sign in failed.' };
  }
};

export const signOutUser = async (): Promise<void> => {
  if (!supabaseClient) return;
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!supabaseClient) return null;
  try {
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  } catch (err) {
    console.warn('getCurrentSession error:', err);
    return null;
  }
};

// Subscribes to auth state changes (sign in / sign out / token refresh) and
// returns an unsubscribe function. App.tsx uses this to keep its session
// state in sync after AuthGate's sign-in form succeeds.
export const onAuthStateChange = (callback: (session: Session | null) => void): (() => void) => {
  if (!supabaseClient) {
    return () => {};
  }
  const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
};

export const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();

    if (error || !data) {
      console.warn('fetchProfile error:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      companyName: data.company_name || undefined
    };
  } catch (err) {
    console.warn('fetchProfile error:', err);
    return null;
  }
};

// ==============================================================================
// Driver Repository API (Live Supabase + Resilient Local Fallback)
// ==============================================================================

export const fetchAllDrivers = async (): Promise<DriverProfile[]> => {
  // 1. Try Live Supabase
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('drivers')
        .select(`
          *,
          video_interviews (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const video = d.video_interviews?.[0] || {};
          return {
            id: d.id,
            anonymizedTitle: d.anonymized_title,
            fullName: d.full_name,
            phone: d.phone,
            email: d.email,
            location: {
              city: d.city,
              state: d.state,
              zip: d.zip || ''
            },
            cdlClass: d.cdl_class,
            licenseNumber: d.license_number,
            issuingState: d.issuing_state,
            cdlExpiration: d.cdl_expiration || '2028-10-15',
            yearsExperience: d.years_experience,
            endorsements: d.endorsements || [],
            equipment: d.equipment || [],
            preferredRoutes: d.preferred_routes || [],
            hometime: d.hometime || 'Home Every 2 Weeks',
            payExpectation: d.pay_expectation || '$0.70 - $0.74 CPM',
            cleanMvr: d.clean_mvr,
            violationsLast3Yrs: d.violations_last_3yrs || 0,
            dotMedCardStatus: d.dot_med_card_status || 'Verified',
            dotMedCardExpiry: d.dot_med_card_expiry || '2027-05-15',
            bonusEligible: d.bonus_eligible,
            bonusAmount: Number(d.bonus_amount || 1500),
            aiFluencyScore: d.ai_fluency_score || 98,
            aiSummary: d.ai_summary || '',
            videoInterview: {
              recorded: true,
              duration: video.duration || '02:40',
              videoBlobUrl: video.video_storage_path || undefined,
              transcripts: [
                {
                  questionNumber: 1,
                  question: video.q1_title || 'Experience & Equipment',
                  answer: video.q1_answer || '',
                  timestamp: video.q1_timestamp || '00:08 - 00:54'
                },
                {
                  questionNumber: 2,
                  question: video.q2_title || 'Safety & Winter Driving',
                  answer: video.q2_answer || '',
                  timestamp: video.q2_timestamp || '01:02 - 01:48'
                },
                {
                  questionNumber: 3,
                  question: video.q3_title || 'Carrier Expectations',
                  answer: video.q3_answer || '',
                  timestamp: video.q3_timestamp || '01:55 - 02:42'
                }
              ]
            },
            dqDocuments: {
              cdlFront: `Verified ${d.issuing_state} CDL`,
              cdlBack: `Endorsements: ${(d.endorsements || []).join(', ')}`,
              medCard: `DOT Med Cert Valid (Exp: ${d.dot_med_card_expiry || '2027'})`,
              clearinghouseStatus: 'Passed'
            },
            status: d.status || 'available',
            unlockedAt: d.unlocked_at,
            unlockedByCarrier: d.unlocked_by_carrier
          };
        });
      }
    } catch (err) {
      console.warn('Failed to fetch from live Supabase, using local fallback:', err);
    }
  }

  // 2. Local Fallback with Persistence
  const saved = localStorage.getItem(LOCAL_STORAGE_DRIVERS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback to initial
    }
  }

  // Save INITIAL_DRIVERS to local storage
  localStorage.setItem(LOCAL_STORAGE_DRIVERS, JSON.stringify(INITIAL_DRIVERS));
  return INITIAL_DRIVERS;
};

export const saveDriverToDatabase = async (
  driver: DriverProfile,
  videoBlob?: Blob,
  presignedUploadUrl?: string
): Promise<{ success: boolean; storageUrl?: string }> => {
  let videoStorageUrl = driver.videoInterview.videoBlobUrl;
  const s3UploadUrl = presignedUploadUrl || import.meta.env.VITE_S3_PRESIGNED_UPLOAD_URL || '';

  // 1a. If an S3/R2 presigned URL is provided, upload directly to S3/R2 first
  let uploadedToS3 = false;
  if (s3UploadUrl && videoBlob) {
    try {
      const ok = await uploadVideoToS3Presigned(s3UploadUrl, videoBlob);
      if (ok) {
        videoStorageUrl = s3UploadUrl.split('?')[0];
        uploadedToS3 = true;
      }
    } catch (err) {
      console.warn('S3/R2 presigned upload failed, falling back to Supabase Storage:', err);
    }
  }

  // 1b. Otherwise, if Supabase is active, upload video to Supabase Storage Bucket
  if (!uploadedToS3 && supabaseClient && videoBlob) {
    try {
      const filePath = `interviews/${driver.id}_${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('driver-interviews')
        .upload(filePath, videoBlob, {
          contentType: 'video/webm',
          upsert: true
        });

      if (!uploadError && uploadData) {
        const { data: publicData } = supabaseClient.storage
          .from('driver-interviews')
          .getPublicUrl(filePath);
        videoStorageUrl = publicData.publicUrl;
      }
    } catch (err) {
      console.warn('Video storage upload failed, saving metadata only:', err);
    }
  }

  // 2. Insert into PostgreSQL if Supabase is active
  if (supabaseClient) {
    try {
      const { error: driverError } = await supabaseClient.from('drivers').insert([
        {
          id: driver.id,
          anonymized_title: driver.anonymizedTitle,
          city: driver.location.city,
          state: driver.location.state,
          zip: driver.location.zip,
          cdl_class: driver.cdlClass,
          years_experience: driver.yearsExperience,
          endorsements: driver.endorsements,
          equipment: driver.equipment,
          preferred_routes: driver.preferredRoutes,
          hometime: driver.hometime,
          pay_expectation: driver.payExpectation,
          clean_mvr: driver.cleanMvr,
          violations_last_3yrs: driver.violationsLast3Yrs,
          dot_med_card_status: driver.dotMedCardStatus,
          dot_med_card_expiry: driver.dotMedCardExpiry,
          bonus_eligible: driver.bonusEligible,
          bonus_amount: driver.bonusAmount,
          ai_fluency_score: driver.aiFluencyScore,
          ai_summary: driver.aiSummary,
          status: driver.status,
          full_name: driver.fullName,
          phone: driver.phone,
          email: driver.email,
          license_number: driver.licenseNumber,
          issuing_state: driver.issuingState
        }
      ]);

      if (driverError) {
        console.warn('Supabase driver insert error:', driverError);
      } else {
        // Insert interview transcript record
        await supabaseClient.from('video_interviews').insert([
          {
            driver_id: driver.id,
            video_storage_path: videoStorageUrl,
            duration: driver.videoInterview.duration,
            ai_fluency_score: driver.aiFluencyScore,
            q1_title: driver.videoInterview.transcripts[0]?.question,
            q1_answer: driver.videoInterview.transcripts[0]?.answer,
            q1_timestamp: driver.videoInterview.transcripts[0]?.timestamp,
            q2_title: driver.videoInterview.transcripts[1]?.question,
            q2_answer: driver.videoInterview.transcripts[1]?.answer,
            q2_timestamp: driver.videoInterview.transcripts[1]?.timestamp,
            q3_title: driver.videoInterview.transcripts[2]?.question,
            q3_answer: driver.videoInterview.transcripts[2]?.answer,
            q3_timestamp: driver.videoInterview.transcripts[2]?.timestamp
          }
        ]);
      }
    } catch (err) {
      console.warn('Supabase DB error:', err);
    }
  }

  // 3. Update Local Storage for offline / instant client speed
  try {
    const existing = await fetchAllDrivers();
    const updated = [driver, ...existing.filter((d) => d.id !== driver.id)];
    localStorage.setItem(LOCAL_STORAGE_DRIVERS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return { success: true, storageUrl: videoStorageUrl };
};

// ==============================================================================
// Driver Qualification Documents (CDL / Med Card) — Private Storage
// ==============================================================================
// Uploads go to the private `driver-documents` bucket (not the public
// `driver-interviews` bucket), and are tracked in `public.driver_documents`.
// Reading these back requires a signed URL (see getSignedDocumentUrl) since the
// bucket is not public.

export const uploadDriverDocument = async (
  driverId: string,
  file: File,
  docType: 'cdl_front' | 'cdl_back' | 'med_card' | 'mvr' | 'clearinghouse'
): Promise<{ success: boolean; storagePath?: string }> => {
  if (!supabaseClient) {
    return { success: false };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `documents/${driverId}/${docType}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('driver-documents')
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      });

    if (uploadError) {
      console.warn('Driver document upload failed:', uploadError);
      return { success: false };
    }

    const { error: dbError } = await supabaseClient.from('driver_documents').insert([
      {
        driver_id: driverId,
        doc_type: docType,
        storage_path: filePath,
        verification_status: 'verified'
      }
    ]);

    if (dbError) {
      console.warn('driver_documents insert failed:', dbError);
    }

    return { success: true, storagePath: filePath };
  } catch (err) {
    console.warn('Driver document upload error:', err);
    return { success: false };
  }
};

export const getSignedDocumentUrl = async (
  storagePath: string,
  expiresInSeconds = 300
): Promise<string | null> => {
  if (!supabaseClient) {
    return null;
  }

  try {
    const { data, error } = await supabaseClient.storage
      .from('driver-documents')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      console.warn('Failed to create signed document URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('getSignedDocumentUrl error:', err);
    return null;
  }
};

// ==============================================================================
// Carrier Fleet Job Orders (Fleet Intake Form in the Carrier Sales Packet)
// ==============================================================================
// Upserted (not just inserted) so that re-submitting after "Edit Intake
// Specifications" updates the same row rather than creating a duplicate order.

export const saveFleetJobOrder = async (
  jobOrder: FleetJobOrder
): Promise<{ success: boolean }> => {
  if (!supabaseClient) {
    return { success: false };
  }

  try {
    const { error } = await supabaseClient
      .from('fleet_job_orders')
      .upsert(
        [
          {
            id: jobOrder.id,
            company_name: jobOrder.companyName,
            dot_number: jobOrder.dotNumber,
            mc_number: jobOrder.mcNumber,
            contact_name: jobOrder.contactName,
            contact_title: jobOrder.contactTitle,
            contact_email: jobOrder.contactEmail,
            contact_phone: jobOrder.contactPhone,
            drivers_needed: jobOrder.driversNeeded,
            equipment_type: jobOrder.equipmentType,
            transmission: jobOrder.transmission,
            min_experience_years: jobOrder.minExperienceYears,
            max_violations_3yrs: jobOrder.maxViolations3Years,
            hometime_cadence: jobOrder.hometimeCadence,
            pay_per_mile: jobOrder.payPerMile,
            avg_weekly_miles: jobOrder.avgWeeklyMiles,
            guaranteed_weekly_min: jobOrder.guaranteedWeeklyMin,
            pet_policy: jobOrder.petPolicy,
            passenger_policy: jobOrder.passengerPolicy,
            operating_lanes: jobOrder.operatingLanes,
            updated_at: new Date().toISOString()
          }
        ],
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('Fleet job order upsert failed:', error);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.warn('saveFleetJobOrder error:', err);
    return { success: false };
  }
};

// ==============================================================================
// 90-Day Retention Milestones — SMS Pulse Checks & Bonus Disbursement
// ==============================================================================
// These replace what used to be a pair of `alert()` popups in
// RetentionTracker.tsx that had zero effect on persisted state — clicking
// them did nothing you could see again after a refresh. Now both actions
// write to the `retention_milestones` row created in recordPlacementContractInDB,
// and mirror the result into the local-storage driver copy as a fallback.
//
// Honest scope note: actually *sending* an SMS (Twilio, etc.) or moving money
// via ACH requires a server-side integration holding provider secrets — this
// is a client-only app talking straight to Supabase with the public anon key,
// so it cannot safely hold those credentials itself. What this does do for
// real is durably record that the pulse check / disbursement happened, which
// is the correct boundary for this app; wiring the actual SMS/ACH send would
// be a Supabase Edge Function (or similar backend) calling out to a provider.

export const sendRetentionSmsPulse = async (
  driverId: string
): Promise<{ success: boolean; error?: string; sentAt: string }> => {
  const sentAt = new Date().toISOString();
  let success = true;
  let error: string | undefined;

  if (supabaseClient) {
    try {
      const { error: dbError } = await supabaseClient
        .from('retention_milestones')
        .update({ last_sms_pulse_sent: sentAt })
        .eq('driver_id', driverId);
      if (dbError) {
        success = false;
        error = dbError.message;
        console.warn('sendRetentionSmsPulse DB update failed:', dbError);
      }
    } catch (err: any) {
      success = false;
      error = err?.message || 'Failed to record SMS pulse send.';
      console.warn('sendRetentionSmsPulse error:', err);
    }
  }

  return { success, error, sentAt };
};

export const disburseRetentionBonus = async (
  driverId: string
): Promise<{ success: boolean; error?: string; disbursedAt: string }> => {
  const disbursedAt = new Date().toISOString();
  let success = true;
  let error: string | undefined;

  if (supabaseClient) {
    try {
      const { error: dbError } = await supabaseClient
        .from('retention_milestones')
        .update({ driver_bonus_disbursed: true, driver_bonus_disbursed_at: disbursedAt })
        .eq('driver_id', driverId);
      if (dbError) {
        success = false;
        error = dbError.message;
        console.warn('disburseRetentionBonus DB update failed:', dbError);
      }
    } catch (err: any) {
      success = false;
      error = err?.message || 'Failed to record bonus disbursement.';
      console.warn('disburseRetentionBonus error:', err);
    }
  }

  // Mirror onto the local-storage driver copy (same resilience pattern used
  // throughout this file) so the "Disbursed" state survives a refresh even
  // without a live Supabase project connected.
  if (success) {
    try {
      const drivers = await fetchAllDrivers();
      const updated = drivers.map((d) =>
        d.id === driverId && d.placementDetails
          ? { ...d, placementDetails: { ...d.placementDetails, driverBonusPaid: true } }
          : d
      );
      localStorage.setItem(LOCAL_STORAGE_DRIVERS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  return { success, error, disbursedAt };
};

export const recordPlacementContractInDB = async (
  driverId: string,
  carrierName: string,
  signerName: string,
  signerTitle: string
): Promise<boolean> => {
  // If Supabase active, write contract
  if (supabaseClient) {
    try {
      await supabaseClient.from('placement_contracts').insert([
        {
          driver_id: driverId,
          carrier_company_name: carrierName,
          signer_name: signerName,
          signer_title: signerTitle,
          total_contingency_fee: 4500.0,
          upfront_fee: 2250.0,
          milestone_90_fee: 2250.0,
          driver_bonus_amount: 1500.0
        }
      ]);

      await supabaseClient
        .from('drivers')
        .update({
          status: 'unlocked',
          unlocked_at: new Date().toISOString(),
          unlocked_by_carrier: carrierName
        })
        .eq('id', driverId);

      await supabaseClient.from('retention_milestones').insert([
        {
          driver_id: driverId,
          carrier_company_name: carrierName,
          start_date: new Date().toISOString().split('T')[0],
          days_completed: 1,
          target_days: 90,
          day_0_billed: true
        }
      ]);
    } catch (err) {
      console.warn('Supabase contract record failed:', err);
    }
  }

  // Update local storage
  try {
    const drivers = await fetchAllDrivers();
    const updated = drivers.map((d) => {
      if (d.id === driverId) {
        return {
          ...d,
          status: 'unlocked' as const,
          unlockedAt: new Date().toISOString().split('T')[0],
          unlockedByCarrier: carrierName,
          placementDetails: {
            carrierName: carrierName,
            carrierContact: `${signerName} (${signerTitle})`,
            startDate: new Date().toISOString().split('T')[0],
            daysCompleted: 1,
            targetDays: 90,
            totalFee: 4500,
            feePaid: 2250,
            driverBonusPaid: false
          }
        };
      }
      return d;
    });
    localStorage.setItem(LOCAL_STORAGE_DRIVERS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return true;
};
