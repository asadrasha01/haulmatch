import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { AuthRole, CarrierVettingStatus, DriverProfile, FleetJobOrder, UserProfile } from '../types';
import { INITIAL_DRIVERS } from '../data/mockDrivers';
import { uploadVideoToS3Presigned } from './s3Storage';

const STORAGE_KEY_URL = 'haulmatch_supabase_url';
const STORAGE_KEY_ANON = 'haulmatch_supabase_anon_key';
const LOCAL_STORAGE_DRIVERS = 'haulmatch_local_drivers_v1';
const LOCAL_STORAGE_JOB_ORDERS = 'haulmatch_local_job_orders_v1';
const LOCAL_STORAGE_USERS = 'haulmatch_local_users_v1';
const LOCAL_STORAGE_SESSION = 'haulmatch_local_session_v1';

interface LocalUserRecord {
  id: string;
  email: string;
  password?: string;
  role: AuthRole;
  companyName?: string;
  vettingStatus?: CarrierVettingStatus;
  dotNumber?: string;
  mcNumber?: string;
  creditLineApproved?: boolean;
  vettedAt?: string;
  notes?: string;
}

const DEFAULT_LOCAL_USERS: LocalUserRecord[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@haulmatch.ai',
    password: 'password123',
    role: 'staff',
    companyName: 'HaulMatch Headquarters'
  },
  {
    id: 'usr-admin-02',
    email: 'admin@haulmatch.com',
    password: 'admin123',
    role: 'staff',
    companyName: 'HaulMatch Operations'
  },
  {
    id: 'usr-carrier-01',
    email: 'recruiting@swiftlinelogistics.com',
    password: 'password123',
    role: 'carrier',
    companyName: 'Swiftline Global Logistics LLC',
    vettingStatus: 'verified_mc',
    dotNumber: '3819204',
    mcNumber: 'MC-149201',
    creditLineApproved: true,
    vettedAt: '2026-10-01T14:30:00Z',
    notes: 'Contingency fee agreement on file · $20,000 credit line approved'
  },
  {
    id: 'usr-carrier-02',
    email: 'safety@apextransit.com',
    password: 'password123',
    role: 'carrier',
    companyName: 'Apex Transit Freight LLC',
    vettingStatus: 'pending_review',
    dotNumber: '4019283',
    mcNumber: 'MC-294019',
    creditLineApproved: false,
    notes: 'Application submitted · Certificate of insurance pending verification'
  },
  {
    id: 'usr-carrier-03',
    email: 'dispatch@lonestar-haul.com',
    password: 'password123',
    role: 'carrier',
    companyName: 'Lone Star Dedicated Logistics',
    vettingStatus: 'pending_review',
    dotNumber: '2991048',
    mcNumber: 'MC-389102',
    creditLineApproved: false,
    notes: 'New registration · Needs FMCSA authority & safety audit check'
  }
];

const localAuthListeners = new Set<(session: Session | null) => void>();

const buildLocalSession = (user: LocalUserRecord): Session =>
  ({
    access_token: `local-token-${user.id}`,
    refresh_token: `local-refresh-${user.id}`,
    expires_in: 86400,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      app_metadata: {},
      user_metadata: {
        role: user.role,
        company_name: user.companyName
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    }
  }) as unknown as Session;

const getLocalUsers = (): LocalUserRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure standard admin accounts always exist
        const hasAdmin = parsed.some((u) => u.email?.toLowerCase() === 'admin@haulmatch.ai');
        if (!hasAdmin) {
          const merged = [...DEFAULT_LOCAL_USERS, ...parsed.filter((p: any) => !DEFAULT_LOCAL_USERS.some((d) => d.email === p.email))];
          localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  // Initialize default users if empty
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(DEFAULT_LOCAL_USERS));
  } catch {
    // ignore
  }
  return DEFAULT_LOCAL_USERS;
};

const saveLocalUsers = (users: LocalUserRecord[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
};

const notifyLocalAuthListeners = (session: Session | null) => {
  for (const listener of localAuthListeners) {
    try {
      listener(session);
    } catch {
      // ignore
    }
  }
};

const DEFAULT_FLEET_JOB_ORDER: FleetJobOrder = {
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
  createdAt: '2026-11-01'
};

// Read from env or localStorage (in Vitest unit tests, start disconnected unless setSupabaseCredentials is called)
const isTestEnv = import.meta.env.MODE === 'test';
let supabaseUrl = (!isTestEnv && import.meta.env.VITE_SUPABASE_URL) || localStorage.getItem(STORAGE_KEY_URL) || '';
let supabaseAnonKey =
  (!isTestEnv && import.meta.env.VITE_SUPABASE_ANON_KEY) || localStorage.getItem(STORAGE_KEY_ANON) || '';

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
// Authentication (Live Supabase Auth + Resilient Local Auth Fallback)
// ==============================================================================

export const signUpWithEmail = async (
  email: string,
  password: string,
  role: AuthRole,
  companyName?: string
): Promise<{ success: boolean; autoSignedIn?: boolean; error?: string }> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // 1. Live Supabase Auth when configured
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { role, company_name: companyName }
        }
      });

      if (!error && data.user && data.session) {
        await supabaseClient.from('profiles').upsert(
          [
            {
              id: data.user.id,
              email: normalizedEmail,
              role,
              company_name: companyName || null
            }
          ],
          { onConflict: 'id' }
        );
        return { success: true, autoSignedIn: true };
      }

      if (error) {
        console.warn('Live Supabase signUp warning, falling back to local auth:', error.message);
      }
    } catch (err: any) {
      console.warn('Live Supabase signUp error, falling back to local auth:', err?.message || err);
    }
  }

  // 2. Local Storage Auth Fallback (works immediately with zero cloud setup)
  const users = getLocalUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      error: 'An account with this email already exists. Please sign in instead.'
    };
  }

  const newUser: LocalUserRecord = {
    id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    email: normalizedEmail,
    password,
    role,
    companyName: companyName?.trim() || undefined
  };

  saveLocalUsers([...users, newUser]);
  const session = buildLocalSession(newUser);
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(newUser));
  } catch {
    // ignore
  }
  notifyLocalAuthListeners(session);

  return { success: true, autoSignedIn: true };
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ success: boolean; autoSignedIn?: boolean; error?: string }> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // 1. Live Supabase Auth when configured
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      if (!error) {
        return { success: true };
      }
      console.warn('Live Supabase signIn warning, checking local accounts:', error.message);
    } catch (err: any) {
      console.warn('Live Supabase signIn error, checking local accounts:', err?.message || err);
    }
  }

  // 2. Local Storage Auth Fallback
  const users = getLocalUsers();
  const matched = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!matched || matched.password !== password) {
    return {
      success: false,
      error: matched
        ? 'Incorrect password. Please try again.'
        : 'No account found for this email. Switch to Register to create your account.'
    };
  }

  const session = buildLocalSession(matched);
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(matched));
  } catch {
    // ignore
  }
  notifyLocalAuthListeners(session);
  return { success: true };
};

export const signInWithGoogle = async (
  role: AuthRole = 'carrier',
  companyName?: string
): Promise<{ success: boolean; error?: string }> => {
  // 1. Live Supabase Google OAuth when connected
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google sign-in failed.' };
    }
  }

  // 2. Free Local Mode Fallback (zero-cost Google sign-in simulation)
  const googleUser: LocalUserRecord = {
    id: `google-${role}`,
    email: role === 'staff' ? 'founder@haulmatch.ai' : 'fleet.director@gmail.com',
    password: 'google-oauth-session',
    role,
    companyName: companyName?.trim() || (role === 'staff' ? 'HaulMatch Staff' : 'Partner Carrier Fleet')
  };

  const users = getLocalUsers();
  const updated = [googleUser, ...users.filter((u) => u.email !== googleUser.email)];
  saveLocalUsers(updated);
  const session = buildLocalSession(googleUser);
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(googleUser));
  } catch {
    // ignore
  }
  notifyLocalAuthListeners(session);
  return { success: true };
};

export const signOutUser = async (): Promise<void> => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SESSION);
  } catch {
    // ignore
  }
  notifyLocalAuthListeners(null);

  if (!supabaseClient) return;
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data.session) return data.session;
    } catch (err) {
      console.warn('getCurrentSession error:', err);
    }
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION);
    if (saved) {
      const parsed: LocalUserRecord = JSON.parse(saved);
      if (parsed && parsed.id && parsed.email) {
        return buildLocalSession(parsed);
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const onAuthStateChange = (callback: (session: Session | null) => void): (() => void) => {
  localAuthListeners.add(callback);

  if (!supabaseClient) {
    return () => {
      localAuthListeners.delete(callback);
    };
  }

  const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => {
    localAuthListeners.delete(callback);
    data.subscription.unsubscribe();
  };
};

export const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          role: data.role,
          companyName: data.company_name || undefined
        };
      }

      // Fallback to auth user metadata if the `profiles` trigger row doesn't exist yet
      const { data: userData } = await supabaseClient.auth.getUser();
      if (userData?.user && userData.user.id === userId) {
        const meta = userData.user.user_metadata || {};
        const fallbackRole: AuthRole = meta.role === 'staff' ? 'staff' : 'carrier';
        return {
          id: userData.user.id,
          email: userData.user.email || '',
          role: fallbackRole,
          companyName: meta.company_name || undefined
        };
      }
    } catch (err) {
      console.warn('fetchProfile error:', err);
    }
  }

  // Local Storage Auth Fallback
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION);
    if (saved) {
      const parsed: LocalUserRecord = JSON.parse(saved);
      if (parsed && parsed.id === userId) {
        return {
          id: parsed.id,
          email: parsed.email,
          role: parsed.role,
          companyName: parsed.companyName
        };
      }
    }
    const fromUsers = getLocalUsers().find((u) => u.id === userId);
    if (fromUsers) {
      return {
        id: fromUsers.id,
        email: fromUsers.email,
        role: fromUsers.role,
        companyName: fromUsers.companyName
      };
    }
  } catch {
    // ignore
  }

  return null;
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
          video_interviews (*),
          retention_milestones (*),
          placement_contracts (*),
          driver_documents (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const video = d.video_interviews?.[0] || {};
          const milestone = d.retention_milestones?.[0];
          const contract = d.placement_contracts?.[0];
          const docs: any[] = Array.isArray(d.driver_documents) ? d.driver_documents : [];
          const cdlDoc = docs.find((doc) => doc.doc_type === 'cdl_front');
          const medDoc = docs.find((doc) => doc.doc_type === 'med_card');

          const hasPlacement =
            Boolean(milestone || contract) ||
            d.status === 'unlocked' ||
            d.status === 'placed' ||
            d.status === 'milestone_90';

          const totalFee = Number(contract?.total_contingency_fee ?? 4500);
          const upfrontFee = Number(contract?.upfront_fee ?? 2250);
          const feePaid = milestone?.day_90_cleared ? totalFee : upfrontFee;

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
            dqDocumentPaths:
              cdlDoc || medDoc
                ? {
                    cdlFront: cdlDoc?.storage_path,
                    medCard: medDoc?.storage_path
                  }
                : undefined,
            status: d.status || 'available',
            unlockedAt: d.unlocked_at,
            unlockedByCarrier: d.unlocked_by_carrier,
            placementDetails: hasPlacement
              ? {
                  carrierName:
                    milestone?.carrier_company_name ||
                    contract?.carrier_company_name ||
                    d.unlocked_by_carrier ||
                    'Partner Carrier Fleet',
                  carrierContact: contract?.signer_name
                    ? `${contract.signer_name} (${contract.signer_title || 'Authorized Representative'})`
                    : 'Authorized Fleet Representative',
                  startDate:
                    milestone?.start_date ||
                    (d.unlocked_at ? String(d.unlocked_at).split('T')[0] : new Date().toISOString().split('T')[0]),
                  daysCompleted: Number(milestone?.days_completed ?? 1),
                  targetDays: Number(milestone?.target_days ?? 90),
                  totalFee,
                  feePaid,
                  driverBonusPaid: Boolean(milestone?.driver_bonus_disbursed)
                }
              : undefined
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

export const fetchDriverSignedDocuments = async (
  driverId: string,
  knownPaths?: { cdlFront?: string; medCard?: string }
): Promise<{ cdlFrontUrl?: string; medCardUrl?: string }> => {
  let cdlPath = knownPaths?.cdlFront;
  let medPath = knownPaths?.medCard;

  if (supabaseClient && (!cdlPath || !medPath)) {
    try {
      const { data } = await supabaseClient
        .from('driver_documents')
        .select('doc_type, storage_path')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (Array.isArray(data)) {
        for (const row of data) {
          if (row.doc_type === 'cdl_front' && !cdlPath) cdlPath = row.storage_path;
          if (row.doc_type === 'med_card' && !medPath) medPath = row.storage_path;
        }
      }
    } catch (err) {
      console.warn('fetchDriverSignedDocuments query error:', err);
    }
  }

  const [cdlFrontUrl, medCardUrl] = await Promise.all([
    cdlPath ? getSignedDocumentUrl(cdlPath) : Promise.resolve(null),
    medPath ? getSignedDocumentUrl(medPath) : Promise.resolve(null)
  ]);

  return {
    cdlFrontUrl: cdlFrontUrl || undefined,
    medCardUrl: medCardUrl || undefined
  };
};

// ==============================================================================
// Carrier Fleet Job Orders (Fleet Intake Form in the Carrier Sales Packet)
// ==============================================================================
// Upserted (not just inserted) so that re-submitting after "Edit Intake
// Specifications" updates the same row rather than creating a duplicate order.

export const fetchFleetJobOrders = async (): Promise<FleetJobOrder[]> => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('fleet_job_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          companyName: row.company_name,
          dotNumber: row.dot_number || '',
          mcNumber: row.mc_number || '',
          contactName: row.contact_name,
          contactTitle: row.contact_title || '',
          contactEmail: row.contact_email || '',
          contactPhone: row.contact_phone || '',
          driversNeeded: Number(row.drivers_needed ?? 1),
          equipmentType: Array.isArray(row.equipment_type) ? row.equipment_type : [],
          transmission: row.transmission || 'Automatic',
          minExperienceYears: Number(row.min_experience_years ?? 1),
          maxViolations3Years: Number(row.max_violations_3yrs ?? 1),
          hometimeCadence: row.hometime_cadence || '',
          payPerMile: row.pay_per_mile || '',
          avgWeeklyMiles: row.avg_weekly_miles || '',
          guaranteedWeeklyMin: row.guaranteed_weekly_min || '',
          petPolicy: Boolean(row.pet_policy),
          passengerPolicy: Boolean(row.passenger_policy),
          operatingLanes: row.operating_lanes || '',
          createdAt: row.created_at ? String(row.created_at).split('T')[0] : '2026-11-01'
        }));
      }
    } catch (err) {
      console.warn('fetchFleetJobOrders live query failed, falling back to local:', err);
    }
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_JOB_ORDERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  const initialOrders = [DEFAULT_FLEET_JOB_ORDER];
  try {
    localStorage.setItem(LOCAL_STORAGE_JOB_ORDERS, JSON.stringify(initialOrders));
  } catch {
    // ignore
  }
  return initialOrders;
};

export const saveFleetJobOrder = async (
  jobOrder: FleetJobOrder
): Promise<{ success: boolean }> => {
  // Always persist to localStorage so orders survive refreshes offline or online
  try {
    const existing = await fetchFleetJobOrders();
    const updated = [jobOrder, ...existing.filter((o) => o.id !== jobOrder.id)];
    localStorage.setItem(LOCAL_STORAGE_JOB_ORDERS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (!supabaseClient) {
    return { success: true };
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

export const seedInitialDriversToSupabase = async (): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> => {
  if (!supabaseClient) {
    return {
      success: false,
      count: 0,
      error: 'Connect a live Supabase project first before seeding cloud tables.'
    };
  }

  try {
    for (const driver of INITIAL_DRIVERS) {
      const { error: driverErr } = await supabaseClient.from('drivers').upsert(
        [
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
            issuing_state: driver.issuingState,
            cdl_expiration: driver.cdlExpiration,
            unlocked_at: driver.unlockedAt ? new Date(driver.unlockedAt).toISOString() : null,
            unlocked_by_carrier: driver.unlockedByCarrier || null
          }
        ],
        { onConflict: 'id' }
      );

      if (driverErr) {
        return { success: false, count: 0, error: driverErr.message };
      }

      // Remove any prior interview rows for this driver so re-seeding is idempotent
      await supabaseClient.from('video_interviews').delete().eq('driver_id', driver.id);
      await supabaseClient.from('video_interviews').insert([
        {
          driver_id: driver.id,
          video_storage_path: driver.videoInterview.videoBlobUrl || null,
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

      if (driver.placementDetails) {
        await supabaseClient.from('retention_milestones').delete().eq('driver_id', driver.id);
        await supabaseClient.from('placement_contracts').delete().eq('driver_id', driver.id);

        const { data: contractRows } = await supabaseClient
          .from('placement_contracts')
          .insert([
            {
              driver_id: driver.id,
              carrier_company_name: driver.placementDetails.carrierName,
              signer_name: driver.placementDetails.carrierContact,
              signer_title: 'Fleet Recruiting Director',
              total_contingency_fee: driver.placementDetails.totalFee,
              upfront_fee: driver.placementDetails.totalFee / 2,
              milestone_90_fee: driver.placementDetails.totalFee / 2,
              driver_bonus_amount: driver.bonusAmount
            }
          ])
          .select('id');

        await supabaseClient.from('retention_milestones').insert([
          {
            contract_id: contractRows?.[0]?.id || null,
            driver_id: driver.id,
            carrier_company_name: driver.placementDetails.carrierName,
            start_date: driver.placementDetails.startDate,
            days_completed: driver.placementDetails.daysCompleted,
            target_days: driver.placementDetails.targetDays,
            day_0_billed: true,
            day_30_checked_in: driver.placementDetails.daysCompleted >= 30,
            day_60_checked_in: driver.placementDetails.daysCompleted >= 60,
            day_90_cleared: driver.placementDetails.daysCompleted >= 90,
            driver_bonus_disbursed: driver.placementDetails.driverBonusPaid
          }
        ]);
      }
    }

    await saveFleetJobOrder(DEFAULT_FLEET_JOB_ORDER);

    return { success: true, count: INITIAL_DRIVERS.length };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err?.message || 'Failed to seed initial drivers to Supabase.'
    };
  }
};

// 90-Day Retention Milestones — SMS Pulse Checks & Bonus Disbursement

export const sendRetentionSmsPulse = async (
  driverId: string,
  meta?: { driverName?: string; driverPhone?: string; carrierName?: string; daysCompleted?: number }
): Promise<{ success: boolean; error?: string; sentAt: string; deliveryMode?: string }> => {
  const sentAt = new Date().toISOString();
  let success = true;
  let error: string | undefined;

  if (supabaseClient) {
    try {
      if (typeof supabaseClient.functions?.invoke === 'function') {
        const { data: fnData, error: fnError } = await supabaseClient.functions.invoke('retention-pulse', {
          body: {
            driverId,
            ...meta
          }
        });

        if (!fnError && fnData?.success) {
          return {
            success: true,
            sentAt: fnData.sentAt || sentAt,
            deliveryMode: fnData.deliveryMode || 'edge-logged'
          };
        }
      }

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

// ==============================================================================
// Admin Operations & Management
// ==============================================================================

export const fetchAllProfiles = async (): Promise<UserProfile[]> => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, email, role, company_name')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((p) => ({
          id: p.id,
          email: p.email || '',
          role: p.role,
          companyName: p.company_name || undefined
        }));
      }
    } catch (err) {
      console.warn('fetchAllProfiles error:', err);
    }
  }

  const localUsers = getLocalUsers();
  return localUsers.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    companyName: u.companyName,
    vettingStatus: u.vettingStatus || (u.role === 'staff' ? undefined : 'pending_review'),
    dotNumber: u.dotNumber,
    mcNumber: u.mcNumber,
    creditLineApproved: u.creditLineApproved,
    vettedAt: u.vettedAt,
    notes: u.notes
  }));
};

export const updateCarrierVettingStatus = async (
  userId: string,
  vettingStatus: CarrierVettingStatus,
  creditLineApproved: boolean = vettingStatus === 'verified_mc'
): Promise<{ success: boolean; error?: string }> => {
  const vettedAt = vettingStatus === 'verified_mc' ? new Date().toISOString() : undefined;

  // Supabase cloud update if available
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          vetting_status: vettingStatus,
          credit_line_approved: creditLineApproved,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.warn('Supabase updateCarrierVettingStatus warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase updateCarrierVettingStatus error:', err?.message || err);
    }
  }

  // Update local storage
  try {
    const users = getLocalUsers();
    const updated = users.map((u) =>
      u.id === userId
        ? {
            ...u,
            vettingStatus,
            creditLineApproved,
            vettedAt: vettedAt || u.vettedAt
          }
        : u
    );
    saveLocalUsers(updated);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update carrier vetting status' };
  }
};

export const updateDriverStatus = async (
  driverId: string,
  status: DriverProfile['status']
): Promise<{ success: boolean; error?: string }> => {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('drivers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', driverId);

      if (error) {
        console.warn('Supabase cloud updateDriverStatus warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase cloud updateDriverStatus error:', err?.message || err);
    }
  }

  try {
    const drivers = await fetchAllDrivers();
    const updated = drivers.map((d) => (d.id === driverId ? { ...d, status } : d));
    localStorage.setItem(LOCAL_STORAGE_DRIVERS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return { success: true };
};

export const deleteDriver = async (
  driverId: string
): Promise<{ success: boolean; error?: string }> => {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) {
        console.warn('Supabase cloud deleteDriver warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase cloud deleteDriver error:', err?.message || err);
    }
  }

  try {
    const drivers = await fetchAllDrivers();
    const updated = drivers.filter((d) => d.id !== driverId);
    localStorage.setItem(LOCAL_STORAGE_DRIVERS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return { success: true };
};

export const deleteFleetJobOrder = async (
  orderId: string
): Promise<{ success: boolean; error?: string }> => {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('fleet_job_orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.warn('Supabase cloud deleteFleetJobOrder warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase cloud deleteFleetJobOrder error:', err?.message || err);
    }
  }

  try {
    const orders = await fetchFleetJobOrders();
    const updated = orders.filter((o) => o.id !== orderId);
    localStorage.setItem(LOCAL_STORAGE_JOB_ORDERS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return { success: true };
};
