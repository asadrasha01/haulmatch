import type { DriverProfile, InterviewQuestion } from '../types';

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    title: 'Class A Equipment & Operational Profile',
    question: 'Describe your commercial driving background, the specific equipment configurations you operate (53′ Reefer temp monitoring, Dry Van, Flatbed securement, Tanker), your transmission preference (10-speed manual vs automated), and your typical weekly operating radius.',
    promptGuidance: 'Tip: State your total verifiable CDL-A years, average weekly miles (2,200–3,000+), commodities hauled, and regional vs OTR lane preferences.',
    maxSeconds: 90
  },
  {
    id: 2,
    title: 'DOT Pre-Trip Inspection & Extreme Weather Safety',
    question: 'Walk us through your systematic 15-minute DOT walk-around inspection protocol (coupling, air brake checks, glad hands, tire tread/inflation) and how you handle sudden hazardous winter weather or mountain passes.',
    promptGuidance: 'Tip: Detail your brake leak-down check, fifth-wheel jaw verification, and your safety threshold for pulling over into safe parking when chains or blizzard advisories occur.',
    maxSeconds: 90
  },
  {
    id: 3,
    title: 'Fleet Communication, HOS Compliance & Retention',
    question: 'How do you communicate with fleet dispatch when facing receiver detention or tight ELD/HOS limits, and what factors keep you committed to completing your 90-day retention stay bonus with a carrier partner?',
    promptGuidance: 'Tip: Explain how you balance on-time delivery with DOT 11/14-hour limits, professional radio/app communication, and what home-time rhythm you need.',
    maxSeconds: 90
  }
];

export const INITIAL_DRIVERS: DriverProfile[] = [
  {
    id: 'CDL-8421',
    anonymizedTitle: 'Senior CDL-A Reefer & Dry Van Specialist',
    fullName: 'Marcus Vance',
    phone: '(214) 555-0189',
    email: 'marcus.vance.cdl@gmail.com',
    location: {
      city: 'Fort Worth',
      state: 'TX',
      zip: '76102'
    },
    cdlClass: 'Class A',
    licenseNumber: 'TX-49201948',
    issuingState: 'TX',
    cdlExpiration: '2028-09-15',
    yearsExperience: 7,
    endorsements: ['HazMat (H)', 'Tanker (N)', 'Doubles/Triples (T)', 'TWIC'],
    equipment: ['Refrigerated (Reefer)', 'Dry Van'],
    preferredRoutes: ['Regional (South / Midwest)', 'OTR (Lower 48)'],
    hometime: 'Home Every 2 Weeks',
    payExpectation: '$0.70 - $0.74 CPM / $1,900+ wk',
    cleanMvr: true,
    violationsLast3Yrs: 0,
    dotMedCardStatus: 'Verified',
    dotMedCardExpiry: '2027-04-12',
    bonusEligible: true,
    bonusAmount: 1500,
    aiFluencyScore: 98,
    aiSummary: 'Fluent English, exceptionally high safety awareness. 7 years accident-free OTR & regional experience hauling high-value temperature-controlled freight. Possesses all major endorsements including TWIC port access.',
    videoInterview: {
      recorded: true,
      duration: '02:45',
      transcripts: [
        {
          questionNumber: 1,
          question: 'Experience & Equipment',
          answer: 'I have been running Class A combination rigs for 7 years across the Midwest and Southern corridors. Primarily 53ft reefer units keeping strict temp logs for produce and pharmaceuticals, running 2,800 to 3,200 miles weekly with zero service failures.',
          timestamp: '00:08 - 00:54'
        },
        {
          questionNumber: 2,
          question: 'Safety, HOS & Winter Driving',
          answer: 'I never skip a 15-minute walk-around pre-trip. Check fifth-wheel pin, glad hands, brake linings, and tire pressure every morning. During winter storms in I-80 or Wyoming, if conditions get severe, safety comes first—I coordinate immediately with dispatch and park safely.',
          timestamp: '01:02 - 01:48'
        },
        {
          questionNumber: 3,
          question: 'Carrier Expectations & Retention',
          answer: 'I am looking for a stable fleet that respects home-time commitments and keeps equipment well-maintained so I am not stuck at service plazas. I want to stay long-term and earn the 90-day retention reward.',
          timestamp: '01:55 - 02:42'
        }
      ]
    },
    dqDocuments: {
      cdlFront: 'Verified TX Commercial License',
      cdlBack: 'Endorsements: H, N, T active',
      medCard: 'National Registry Form MCSA-5876 (Valid)',
      clearinghouseStatus: 'Passed'
    },
    status: 'available'
  },
  {
    id: 'CDL-6319',
    anonymizedTitle: 'Flatbed & Heavy Haul Veteran',
    fullName: 'David R. Kowalski',
    phone: '(312) 555-4421',
    email: 'd.kowalski.transport@outlook.com',
    location: {
      city: 'Columbus',
      state: 'OH',
      zip: '43215'
    },
    cdlClass: 'Class A',
    licenseNumber: 'OH-77319022',
    issuingState: 'OH',
    cdlExpiration: '2027-11-20',
    yearsExperience: 11,
    endorsements: ['Tanker (N)', 'Doubles/Triples (T)', 'TWIC'],
    equipment: ['Flatbed / Stepdeck', 'Dry Van', 'Oversized'],
    preferredRoutes: ['Regional (Midwest / Northeast)', 'Dedicated Routes'],
    hometime: 'Home Every Weekend',
    payExpectation: '$0.75 - $0.80 CPM / 28% Load Gross',
    cleanMvr: true,
    violationsLast3Yrs: 0,
    dotMedCardStatus: 'Verified',
    dotMedCardExpiry: '2026-10-30',
    bonusEligible: true,
    bonusAmount: 1500,
    aiFluencyScore: 96,
    aiSummary: '11 years veteran commercial driver specializing in load securement, tarping, and stepdeck transport of steel, building materials, and machinery. Clean MVR with zero FMCSA violations.',
    videoInterview: {
      recorded: true,
      duration: '02:30',
      transcripts: [
        {
          questionNumber: 1,
          question: 'Experience & Equipment',
          answer: 'Over a decade behind the wheel of Peterbilts and Kenworths. 9 years strictly flatbed and conestoga trailers. Expert in coil securement, chains, straps, and corner protectors.',
          timestamp: '00:05 - 00:50'
        },
        {
          questionNumber: 2,
          question: 'Safety, HOS & Winter Driving',
          answer: 'Always re-check load tension within the first 50 miles as mandated by DOT. Never had a cargo shift or strap failure in 11 years. Clean MVR and 100% compliant ELD logs.',
          timestamp: '00:55 - 01:40'
        },
        {
          questionNumber: 3,
          question: 'Carrier Expectations & Retention',
          answer: 'Looking for a regional fleet where weekend home-time is honored and tarp pay is fair. Ready to commit for the full year and hit all 90-day retention bonuses.',
          timestamp: '01:46 - 02:28'
        }
      ]
    },
    dqDocuments: {
      cdlFront: 'Verified OH Commercial License',
      cdlBack: 'Endorsements: N, T, TWIC active',
      medCard: 'DOT Med Cert Valid (Expires 10/2026)',
      clearinghouseStatus: 'Passed'
    },
    status: 'available'
  },
  {
    id: 'CDL-5188',
    anonymizedTitle: 'OTR Dry Van & Regional Dedicated Driver',
    fullName: 'Jasmine E. Brooks',
    phone: '(404) 555-8832',
    email: 'j.brooks.freight@gmail.com',
    location: {
      city: 'Atlanta',
      state: 'GA',
      zip: '30303'
    },
    cdlClass: 'Class A',
    licenseNumber: 'GA-99410283',
    issuingState: 'GA',
    cdlExpiration: '2029-01-14',
    yearsExperience: 4,
    endorsements: ['HazMat (H)', 'Tanker (N)'],
    equipment: ['Dry Van', 'Drop & Hook'],
    preferredRoutes: ['Southeast Regional', 'East Coast Dedicated'],
    hometime: 'Home Weekly (34-Hr Reset)',
    payExpectation: '$0.66 - $0.70 CPM / $1,650/wk minimum',
    cleanMvr: true,
    violationsLast3Yrs: 0,
    dotMedCardStatus: 'Verified',
    dotMedCardExpiry: '2027-08-01',
    bonusEligible: true,
    bonusAmount: 1500,
    aiFluencyScore: 99,
    aiSummary: 'Clear, articulate, highly professional communicator. 4 years solid no-touch dry van experience across the Southeast. Strong preference for drop-and-hook freight with dedicated shippers.',
    videoInterview: {
      recorded: true,
      duration: '02:50',
      transcripts: [
        {
          questionNumber: 1,
          question: 'Experience & Equipment',
          answer: '4 years running dry van freight through GA, NC, SC, FL, and TN. 95% no-touch freight and drop-and-hook. I maintain an average of 2,600 miles every single week with 99.4% on-time delivery.',
          timestamp: '00:09 - 00:52'
        },
        {
          questionNumber: 2,
          question: 'Safety, HOS & Winter Driving',
          answer: 'I run strictly legal on Samsara and KeepTruckin ELDs. Clean inspections at scale houses. When running north into rain or fog, I keep safe following distances of at least 7 to 8 seconds.',
          timestamp: '00:58 - 01:45'
        },
        {
          questionNumber: 3,
          question: 'Carrier Expectations & Retention',
          answer: 'I am loyal to carriers that have polite dispatchers and good Peterbilt or Freightliner Cascadia trucks with APU units. I want to build a long-term relationship.',
          timestamp: '01:52 - 02:45'
        }
      ]
    },
    dqDocuments: {
      cdlFront: 'Verified GA Commercial License',
      cdlBack: 'Endorsements: H, N valid',
      medCard: 'DOT Med Cert Valid (Expires 08/2027)',
      clearinghouseStatus: 'Passed'
    },
    status: 'unlocked',
    unlockedAt: '2026-11-01',
    unlockedByCarrier: 'Swiftline Global Logistics LLC'
  },
  {
    id: 'CDL-9943',
    anonymizedTitle: 'HazMat & Liquid Tanker Professional',
    fullName: 'Carlos Mendoza',
    phone: '(317) 555-7164',
    email: 'carlos.mendoza.cdl@yahoo.com',
    location: {
      city: 'Indianapolis',
      state: 'IN',
      zip: '46204'
    },
    cdlClass: 'Class A',
    licenseNumber: 'IN-38291045',
    issuingState: 'IN',
    cdlExpiration: '2028-05-22',
    yearsExperience: 8,
    endorsements: ['HazMat (H)', 'Tanker (N)', 'Doubles/Triples (T)', 'TWIC'],
    equipment: ['Tanker (Pneumatic & Liquid)', 'Reefer', 'Dry Van'],
    preferredRoutes: ['Midwest Regional', 'Dedicated Chemical Corridors'],
    hometime: 'Home Every Weekend',
    payExpectation: '$0.78 - $0.85 CPM / Hourly loading pay',
    cleanMvr: true,
    violationsLast3Yrs: 0,
    dotMedCardStatus: 'Verified',
    dotMedCardExpiry: '2027-02-18',
    bonusEligible: true,
    bonusAmount: 1500,
    aiFluencyScore: 97,
    aiSummary: 'Top-tier HazMat tanker driver with clean TSA background check and TWIC card. Extensive experience with surge control, chemical safety protocol, and pressurized discharge.',
    videoInterview: {
      recorded: true,
      duration: '02:40',
      transcripts: [
        {
          questionNumber: 1,
          question: 'Experience & Equipment',
          answer: '8 years commercial driving, with 5 years pulling smooth-bore and baffled liquid tankers. Fully certified for hazardous materials transportation and port entry.',
          timestamp: '00:07 - 00:50'
        },
        {
          questionNumber: 2,
          question: 'Safety, HOS & Winter Driving',
          answer: 'Tanker surge is the most dangerous aspect if you do not understand braking physics. I take curves at 10-15 mph below posted advisory speed and inspect discharge valves every stop.',
          timestamp: '00:56 - 01:42'
        },
        {
          questionNumber: 3,
          question: 'Carrier Expectations & Retention',
          answer: 'Safety-first carrier with certified tanker trailers. I take pride in zero spills and 100% on-time delivery.',
          timestamp: '01:48 - 02:35'
        }
      ]
    },
    dqDocuments: {
      cdlFront: 'Verified IN Commercial License',
      cdlBack: 'Endorsements: X (Hazmat+Tanker), T, TWIC',
      medCard: 'DOT Med Cert Valid (Expires 02/2027)',
      clearinghouseStatus: 'Passed'
    },
    status: 'placed',
    placementDetails: {
      carrierName: 'Titan Freightways Inc',
      carrierContact: 'Robert Miller (VP of Safety)',
      startDate: '2026-09-15',
      daysCompleted: 49,
      targetDays: 90,
      totalFee: 5000,
      feePaid: 2500,
      driverBonusPaid: false
    }
  },
  {
    id: 'CDL-4012',
    anonymizedTitle: 'Team Driver & Cross-Country Expedited Specialist',
    fullName: 'Robert & Sarah Henderson (Team Lead)',
    phone: '(602) 555-9012',
    email: 'henderson.team.cdl@gmail.com',
    location: {
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001'
    },
    cdlClass: 'Class A',
    licenseNumber: 'AZ-62819401',
    issuingState: 'AZ',
    cdlExpiration: '2028-03-10',
    yearsExperience: 9,
    endorsements: ['HazMat (H)', 'Doubles/Triples (T)', 'TWIC'],
    equipment: ['Reefer', 'Expedited Dry Van'],
    preferredRoutes: ['Coast-to-Coast Expedited (CA - NJ)', 'Lower 48'],
    hometime: 'Out 3 Weeks, Home 5 Days',
    payExpectation: '$0.84 CPM Split / 5,500+ miles weekly',
    cleanMvr: true,
    violationsLast3Yrs: 0,
    dotMedCardStatus: 'Verified',
    dotMedCardExpiry: '2027-06-30',
    bonusEligible: true,
    bonusAmount: 1500,
    aiFluencyScore: 98,
    aiSummary: 'Husband & wife established team with 9 years safe driving. Turnaround 5,000+ miles weekly on coast-to-coast expedited reefer freight. Clean inspections in 14 states.',
    videoInterview: {
      recorded: true,
      duration: '02:55',
      transcripts: [
        {
          questionNumber: 1,
          question: 'Experience & Equipment',
          answer: 'We operate as an expedited team keeping the truck rolling 24/7. Coast-to-coast pharmaceutical and produce runs averaging 5,200 to 5,800 miles every 7 days.',
          timestamp: '00:08 - 00:55'
        },
        {
          questionNumber: 2,
          question: 'Safety, HOS & Winter Driving',
          answer: 'Seamless driver swaps at fuel stops. Perfect split-sleeper berth and 11-hour drive time tracking on ELD. Equipped with tire chains and experienced in Donner Pass and Elk Mountain.',
          timestamp: '01:00 - 01:50'
        },
        {
          questionNumber: 3,
          question: 'Carrier Expectations & Retention',
          answer: 'Consistent weekly high-mileage runs, prompt direct deposit, and well-maintained late-model sleeper trucks with refrigerator and inverter.',
          timestamp: '01:56 - 02:50'
        }
      ]
    },
    dqDocuments: {
      cdlFront: 'Verified AZ Commercial License',
      cdlBack: 'Endorsements: H, T, TWIC active',
      medCard: 'DOT Med Cert Valid (Expires 06/2027)',
      clearinghouseStatus: 'Passed'
    },
    status: 'milestone_90',
    placementDetails: {
      carrierName: 'Apex Transcontinental Logistics',
      carrierContact: 'Samantha Vance (Fleet Operations)',
      startDate: '2026-08-01',
      daysCompleted: 94,
      targetDays: 90,
      totalFee: 5500,
      feePaid: 5500,
      driverBonusPaid: true
    }
  }
];
