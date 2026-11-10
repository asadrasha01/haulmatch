# HaulMatch AI — Commercial CDL-A Driver Recruiting & 90-Day Retention Platform

HaulMatch AI is a contingency commercial driver recruiting and screening platform built with React 19, TypeScript, Vite, Tesseract.js, and Supabase.

## Key Capabilities

1. **Driver Express Application & OCR Document Verification (`src/components/DriverPortal/ExpressApplicationForm.tsx`, `src/services/ocr.ts`)**
   - Real client-side OCR powered by **Tesseract.js** (WASM) for CDL and DOT Medical Card photo uploads, plus embedded text extraction for digital PDFs.
   - Extracts candidate license numbers (`TX-83921044`) and normalizes DOT medical card expiration dates (`YYYY-MM-DD`).
   - Gated progression: drivers cannot advance to the video interview until both CDL and DOT Medical Card uploads pass verification.

2. **Async 2-Minute Video Interview & Fluency Scoring (`src/components/DriverPortal/AsyncVideoRecorder.tsx`, `src/services/fluencyScoring.ts`)**
   - Records 3 structured interview prompts using `MediaRecorder` (`video/webm`) and captures live speech transcripts and confidence metrics via the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
   - Includes an automatic manual transcript summary fallback for browsers without Web Speech API support (Firefox/Safari).
   - Computes a deterministic fluency & completeness score from word count, recognizer confidence, and lexical diversity (`scoreFluencyFromAnswers`).

3. **90-Day Retention & Milestone Engine (`src/components/RetentionTracker/RetentionTracker.tsx`, `src/services/supabase.ts`)**
   - Interactive agency placement economics calculator and live 90-day milestone roadmap.
   - Persists **SMS Pulse Checks** (`sendRetentionSmsPulse`) and **$1,500 Driver Stay Bonus Disbursements** (`disburseRetentionBonus`) to Supabase (`retention_milestones`) with automatic `localStorage` fallback.

4. **Carrier Talent Pool ATS, Sales Packet & Role-Based Auth (`src/components/AuthGate.tsx`, `src/components/CarrierPortal/`, `src/components/CarrierPacket/`)**
   - Public driver application flow (`driver` view) requiring zero sign-up friction.
   - Supabase Auth + `profiles` table role gating (`carrier` vs. internal `staff` roles).
   - Direct video upload support for **Cloudflare R2 / AWS S3** presigned PUT URLs (`src/services/s3Storage.ts`) with automatic fallback to Supabase Storage (`driver-interviews`).

---

## Scripts

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run the Vitest + React Testing Library suite (7 test files, 30 tests)
npm test

# Type-check and build production bundle
npm run build

# Run Oxlint across the codebase
npm run lint
```

---

## Database & Environment Setup

The app runs out-of-the-box in **Zero-Setup Local Mode** (`localStorage` persistence) and can be connected to a live Supabase project at any time via `.env` or the in-app **Database & Cloud Storage Setup** modal.

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Run the SQL schema migration in your Supabase SQL Editor:
   - `supabase/migrations/20261104_init_schema.sql`
