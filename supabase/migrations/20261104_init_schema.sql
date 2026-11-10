-- ============================================================================
-- HaulMatch AI — Supabase / PostgreSQL Production Schema & RLS Policies
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS public.drivers (
    id TEXT PRIMARY KEY, -- e.g. 'CDL-8421' or UUID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Anonymized Public Data
    anonymized_title TEXT NOT NULL,
    city TEXT NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip VARCHAR(10),
    cdl_class VARCHAR(10) NOT NULL CHECK (cdl_class IN ('Class A', 'Class B')),
    years_experience INT NOT NULL DEFAULT 1,
    endorsements TEXT[] DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    preferred_routes TEXT[] DEFAULT '{}',
    hometime TEXT,
    pay_expectation TEXT,
    clean_mvr BOOLEAN DEFAULT TRUE,
    violations_last_3yrs INT DEFAULT 0,
    dot_med_card_status VARCHAR(20) DEFAULT 'Verified',
    dot_med_card_expiry DATE,
    bonus_eligible BOOLEAN DEFAULT TRUE,
    bonus_amount NUMERIC(10, 2) DEFAULT 1500.00,
    ai_fluency_score INT DEFAULT 95,
    ai_summary TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'unlocked', 'placed', 'milestone_90')),

    -- Protected PII (Masked from public carriers until contract is signed)
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    license_number TEXT NOT NULL,
    issuing_state VARCHAR(2) NOT NULL,
    cdl_expiration DATE,
    unlocked_at TIMESTAMPTZ,
    unlocked_by_carrier TEXT
);

-- 3. VIDEO INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.video_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    video_storage_path TEXT,
    duration TEXT DEFAULT '02:45',
    ai_fluency_score INT DEFAULT 98,
    q1_title TEXT DEFAULT 'Experience & Equipment',
    q1_answer TEXT,
    q1_timestamp TEXT,
    q2_title TEXT DEFAULT 'Safety, HOS & Winter Driving',
    q2_answer TEXT,
    q2_timestamp TEXT,
    q3_title TEXT DEFAULT 'Carrier Expectations & Retention',
    q3_answer TEXT,
    q3_timestamp TEXT
);

-- 4. DRIVER DOCUMENTS TABLE (Private Driver Qualification File)
CREATE TABLE IF NOT EXISTS public.driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('cdl_front', 'cdl_back', 'med_card', 'mvr', 'clearinghouse')),
    storage_path TEXT NOT NULL,
    ocr_extracted_data JSONB,
    verification_status VARCHAR(20) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

-- 5. CARRIERS TABLE
CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_name TEXT NOT NULL,
    dot_number TEXT,
    mc_number TEXT,
    authorized_rep_name TEXT NOT NULL,
    rep_title TEXT NOT NULL,
    corporate_email TEXT NOT NULL UNIQUE,
    phone TEXT,
    is_verified BOOLEAN DEFAULT TRUE
);

-- 6. PLACEMENT & CONTINGENCY CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.placement_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id TEXT REFERENCES public.drivers(id),
    carrier_company_name TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signer_title TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Placement Financials
    total_contingency_fee NUMERIC(10, 2) DEFAULT 4500.00,
    upfront_fee NUMERIC(10, 2) DEFAULT 2250.00,
    milestone_90_fee NUMERIC(10, 2) DEFAULT 2250.00,
    driver_bonus_amount NUMERIC(10, 2) DEFAULT 1500.00,
    replacement_warranty_days INT DEFAULT 90,
    non_circumvention_months INT DEFAULT 12,
    agreement_version TEXT DEFAULT 'v1.0-standard',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'refunded_or_replaced'))
);

-- 7. 90-DAY RETENTION MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.retention_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES public.placement_contracts(id) ON DELETE CASCADE,
    driver_id TEXT REFERENCES public.drivers(id),
    carrier_company_name TEXT NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    days_completed INT DEFAULT 0,
    target_days INT DEFAULT 90,
    
    -- Checkpoints
    day_0_billed BOOLEAN DEFAULT TRUE,
    day_30_checked_in BOOLEAN DEFAULT FALSE,
    day_60_checked_in BOOLEAN DEFAULT FALSE,
    day_90_cleared BOOLEAN DEFAULT FALSE,
    driver_bonus_disbursed BOOLEAN DEFAULT FALSE,
    driver_bonus_disbursed_at TIMESTAMPTZ,
    last_sms_pulse_sent TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FLEET JOB ORDERS TABLE (Carrier Intake Form — "Fleet Intake Order" tab
--    in the Carrier Sales Packet. Keyed on a human-readable job order ID
--    (e.g. 'JO-8921'), same pattern as drivers.id.)
CREATE TABLE IF NOT EXISTS public.fleet_job_orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    company_name TEXT NOT NULL,
    dot_number TEXT,
    mc_number TEXT,
    contact_name TEXT NOT NULL,
    contact_title TEXT,
    contact_email TEXT,
    contact_phone TEXT,

    drivers_needed INT NOT NULL DEFAULT 1,
    equipment_type TEXT[] DEFAULT '{}',
    transmission VARCHAR(20) DEFAULT 'Automatic' CHECK (transmission IN ('Automatic', 'Manual (10-speed)', 'Either')),
    min_experience_years INT DEFAULT 1,
    max_violations_3yrs INT DEFAULT 1,
    hometime_cadence TEXT,
    pay_per_mile TEXT,
    avg_weekly_miles TEXT,
    guaranteed_weekly_min TEXT,
    pet_policy BOOLEAN DEFAULT TRUE,
    passenger_policy BOOLEAN DEFAULT TRUE,
    operating_lanes TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled'))
);

-- 9. PROFILES TABLE (Real Authentication)
-- ============================================================================
-- One row per Supabase Auth user (auth.users), created automatically on
-- sign-up by the handle_new_user() trigger below. `role` drives which parts
-- of the app a signed-in user can see:
--   'staff'   -> internal HaulMatch recruiting team: full access (Carrier ATS,
--                90-Day Tracker, Carrier Sales Packet, Legal & Compliance)
--   'carrier' -> an external fleet/carrier client: Carrier ATS only
-- NOTE: in this demo, both roles are self-serve at sign-up (see AuthGate.tsx).
-- In a real production rollout, 'staff' sign-up should be invite-only
-- (e.g. gated behind an admin-issued invite code or a Supabase Edge Function)
-- rather than a selectable option on the public sign-up form.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'carrier' CHECK (role IN ('staff', 'carrier')),
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- role / company_name are read from the signUp() call's `options.data`
-- metadata (see signUpWithEmail in src/services/supabase.ts), which Supabase
-- stores on the new auth.users row as raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'carrier'),
    NEW.raw_user_meta_data->>'company_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Supabase Storage Buckets Setup
-- ============================================================================
-- Insert buckets into storage.buckets if using Supabase CLI / UI:
-- 1. 'driver-interviews' (Public read for audio/video streaming preview)
-- 2. 'driver-documents' (Strictly private bucket for CDL & Med card DQ files)

INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('driver-interviews', 'driver-interviews', true),
  ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Row Level Security (RLS) & Blind Profile Privacy
-- ============================================================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_job_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view anonymized driver info and completed video interviews
CREATE POLICY "Public can view marketplace driver profiles"
ON public.drivers FOR SELECT
USING (true);

CREATE POLICY "Public can view video interviews"
ON public.video_interviews FOR SELECT
USING (true);

-- Policy: Driver can insert their own application
CREATE POLICY "Drivers can submit applications"
ON public.drivers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Drivers can submit interview transcripts"
ON public.video_interviews FOR INSERT
WITH CHECK (true);

-- Policy: Carrier can create signed contracts
CREATE POLICY "Carriers can execute contracts"
ON public.placement_contracts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view contracts they are party to"
ON public.placement_contracts FOR SELECT
USING (true);

CREATE POLICY "View milestones"
ON public.retention_milestones FOR SELECT
USING (true);

-- Policy: Signing a contract creates the initial 90-day milestone row
-- (app calls `.from('retention_milestones').insert(...)` from recordPlacementContractInDB)
CREATE POLICY "Carriers can create retention milestones"
ON public.retention_milestones FOR INSERT
WITH CHECK (true);

-- Policy: Milestone check-ins / bonus disbursement flags can be progressed later
CREATE POLICY "Retention milestones can be updated"
ON public.retention_milestones FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy: Signing a contract flips the driver's status to 'unlocked' and stamps
-- unlocked_at / unlocked_by_carrier (app calls `.from('drivers').update(...)`
-- from recordPlacementContractInDB). Without this, that update is silently
-- blocked by RLS and only ever lands in the browser's local fallback storage.
CREATE POLICY "Carriers can update driver status on contract signing"
ON public.drivers FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Storage Object Policies
-- ============================================================================
-- IMPORTANT: Marking a bucket `public` (above) only affects whether its files
-- are servable via the public CDN read URL. It does NOT grant permission to
-- upload. RLS on storage.objects is on by default with zero policies, so
-- without the INSERT policy below, every video interview upload from the
-- browser (`saveDriverToDatabase` -> `storage.from('driver-interviews').upload(...)`)
-- will fail silently and fall back to no video storage URL.

CREATE POLICY "Anyone can upload interview videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'driver-interviews');

CREATE POLICY "Anyone can read interview videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-interviews');

-- ============================================================================
-- Driver Qualification Documents (CDL / Med Card) — RLS Policies
-- ============================================================================
-- `driver_documents` has RLS enabled (above) but had zero policies defined,
-- which means Postgres' default-deny would silently reject every read/write
-- from the app (`uploadDriverDocument` in src/services/supabase.ts calls
-- `.from('driver_documents').insert(...)` after a CDL/med-card file is
-- selected in the Express Application Form). Without these, those calls fail
-- and the app never notices because the error is only console.warn'd.

CREATE POLICY "Drivers can submit their own qualification documents"
ON public.driver_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Qualification document records can be viewed"
ON public.driver_documents FOR SELECT
USING (true);

CREATE POLICY "Qualification document verification status can be updated"
ON public.driver_documents FOR UPDATE
USING (true)
WITH CHECK (true);

-- The `driver-documents` bucket is intentionally private (public: false) since
-- it holds CDL / medical card images, so there is no PUBLIC read URL for it
-- the way there is for `driver-interviews`. Reads instead go through
-- `getSignedDocumentUrl` (src/services/supabase.ts), which calls Storage's
-- `createSignedUrl`. That call still evaluates RLS on storage.objects to mint
-- the URL, so a SELECT policy is required here too — without it,
-- createSignedUrl fails and the carrier-side document viewer gets nothing.
-- NOTE: this demo app has no real authentication, so these policies are
-- permissive (USING (true)) like the rest of the schema. In a production
-- deployment with real carrier/driver auth, this SELECT policy should be
-- scoped (e.g. to the owning driver or to carriers who have signed a
-- placement contract for that driver) rather than left open to anon.

CREATE POLICY "Anyone can upload driver qualification documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'driver-documents');

CREATE POLICY "Anyone can read driver qualification documents via signed URL"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-documents');

-- ============================================================================
-- Fleet Job Orders — RLS Policies
-- ============================================================================
-- `fleet_job_orders` has RLS enabled (above) but had zero policies defined.
-- The app calls `.from('fleet_job_orders').upsert(...)` from saveFleetJobOrder
-- (src/services/supabase.ts) when a carrier submits the Fleet Intake Order
-- form in the Carrier Sales Packet, and again on re-submit after "Edit Intake
-- Specifications". Without these policies, both the initial insert and the
-- follow-up update are silently rejected.

CREATE POLICY "Carriers can submit fleet job orders"
ON public.fleet_job_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Fleet job orders can be viewed"
ON public.fleet_job_orders FOR SELECT
USING (true);

CREATE POLICY "Fleet job orders can be updated"
ON public.fleet_job_orders FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Profiles (Real Authentication) — RLS Policies
-- ============================================================================
-- Unlike every other table in this schema, `profiles` is backed by actual
-- Supabase Auth users (not an open anon client), so these policies are
-- properly scoped to auth.uid() rather than left wide open with USING (true).
-- The app reads/writes this table via fetchProfile and the handle_new_user()
-- trigger (src/services/supabase.ts and the trigger above) whenever a user
-- signs up or AuthGate.tsx loads a signed-in user's role.

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
