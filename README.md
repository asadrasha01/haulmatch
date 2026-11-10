# HaulMatch

Full-stack CDL-A driver placement and 90-day retention platform built with React 19, TypeScript, Vite, Tesseract.js (WASM), WebRTC / Web Speech API, and Supabase (PostgreSQL + Storage + Auth).

## Architecture

- **Driver Application & Client-Side OCR (`src/components/DriverPortal/`, `src/services/ocr.ts`)**
  - 3-stop express intake with browser-native Tesseract.js OCR verification for CDL and DOT Medical Examiner certificates (MCSA-5876), plus PDF text-stream extraction.
- **Asynchronous Video Screening & Fluency Scoring (`src/components/DriverPortal/AsyncVideoRecorder.tsx`, `src/services/fluencyScoring.ts`)**
  - WebRTC `MediaRecorder` (`video/webm`) capture paired with real-time Web Speech API transcription and lexical/confidence scoring.
  - Direct upload support for Cloudflare R2 / AWS S3 presigned URLs (`src/services/s3Storage.ts`) and Supabase Storage (`driver-interviews` and private `driver-documents` buckets).
- **Carrier ATS & Blind Profile Masking (`src/components/CarrierPortal/`, `supabase/migrations/20261104_init_schema.sql`)**
  - Anonymized candidate cards, recorded interview playback, Fleet Job Order matching, digital contingency contract execution, and server-side PII masking (`public.drivers_marketplace_view`).
- **90-Day Retention & Milestone Engine (`src/components/RetentionTracker/`)**
  - Tracks Day 0 / 30 / 60 / 90 checkpoints, logs 14-day SMS pulse checks, and records $1,500 driver retention bonus disbursements.

## Development

```bash
npm install
npm run dev      # Start Vite dev server (http://localhost:5173)
npm test         # Run Vitest unit & integration suite
npm run lint     # Run Oxlint static analysis
npm run build    # Type-check and build production bundle
```

## Environment & Database Setup

The platform runs out-of-the-box with zero configuration using local persistence (`localStorage`), and connects to PostgreSQL + Cloud Storage via `.env` or the in-app **Storage / Database** modal:

```bash
cp .env.example .env
```

Run `supabase/migrations/20261104_init_schema.sql` in the Supabase SQL Editor to provision all tables, triggers, storage buckets, RLS policies, and the `drivers_marketplace_view` PII-masking view.
