import type { UserRole } from '../types';

export interface TourStep {
  step: number;
  role: UserRole;
  title: string;
  badge: string;
  headline: string;
  description: string;
  economics: {
    driver: string;
    carrier: string;
    haulmatch: string;
  };
  actionLabel?: string;
  targetDriverId?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    role: 'driver',
    title: 'Driver Apply & Video',
    badge: 'Step 1 of 4 · Applicant Ingestion',
    headline: 'Driver applies in 2 minutes & passes AI video screening',
    description:
      'Driver submits CDL credentials and records a 3-question async video interview. Real-time speech recognition verifies DOT English fluency, producing an anonymized blind profile. Zero resume spam.',
    economics: {
      driver: '$0 application fee + qualifies for $1,500 retention stay bonus',
      carrier: '$0 upfront cost to view blind verified qualifications',
      haulmatch: 'Automated CDL OCR + MVR + Speech fluency verification'
    },
    actionLabel: 'Scroll to Application & Video Studio'
  },
  {
    step: 2,
    role: 'carrier',
    title: 'Carrier Blind Unlock',
    badge: 'Step 2 of 4 · Contingency Agreement',
    headline: 'Carrier reviews blind profile, signs contingency & unmasks contact',
    description:
      'Carrier evaluates verified equipment experience, safety logs, and video answers. Contact info remains masked until the carrier executes the digital contingency placement agreement ($4,500 split fee).',
    economics: {
      driver: 'Privacy protected until carrier signs contingency agreement',
      carrier: 'Pay-on-hire only: $2,250 on Day 1 start + $2,250 on Day 90',
      haulmatch: 'Binding non-circumvention protection + contingency escrow'
    },
    actionLabel: 'Spotlight Candidate CDL-8421 (Marcus Vance)',
    targetDriverId: 'CDL-8421'
  },
  {
    step: 3,
    role: 'cabin',
    title: 'Driver Cabin Cockpit',
    badge: 'Step 3 of 4 · Inbound Offer Center',
    headline: 'Driver reviews carrier offers & accepts interview window',
    description:
      'Driver enters their private Driver Cabin to inspect direct carrier job offers ($0.68 CPM, $1,850/wk guarantee, brand new 2024 Peterbilt), accepts an interview slot, and tracks their $1,500 retention timeline.',
    economics: {
      driver: 'Earns $1,500 stay bonus milestones: $500 @ 30d, $500 @ 60d, $500 @ 90d',
      carrier: 'High-intent interview with pre-cleared, interested candidate',
      haulmatch: 'Recruiter advocate concierge dispatch & interview calendar sync'
    },
    actionLabel: 'Inspect Active Inbound Offers'
  },
  {
    step: 4,
    role: 'admin',
    title: 'Admin Ops & Sentinel',
    badge: 'Step 4 of 4 · Retention & Billing',
    headline: 'Admin monitors $4,500 placement fee, Net-15 invoice & 90-day sentinel',
    description:
      'Operations command center monitors the placement transaction, generates Net-15 PDF placement invoices, tracks the 90-day retention sentinel clock, and manages carrier FMCSA verification queues.',
    economics: {
      driver: 'Protected by 90-day retention advocate support',
      carrier: 'Free replacement guarantee if driver leaves before 90 days',
      haulmatch: '$4,500 fee realized ($2,250 Day 1 + $2,250 Day 90)'
    },
    actionLabel: 'View Placement Dossiers & Net-15 Invoice'
  }
];

