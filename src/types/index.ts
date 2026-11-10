export type UserRole = 'driver' | 'carrier' | 'packet' | 'tracker' | 'legal';

// Real authentication roles (Supabase Auth + `profiles` table). 'staff' is
// the internal HaulMatch recruiting team (full access); 'carrier' is an
// external fleet client (Carrier ATS only). Not to be confused with
// UserRole above, which is just which tab of the app is currently showing.
export type AuthRole = 'staff' | 'carrier';

export interface UserProfile {
  id: string;
  email: string;
  role: AuthRole;
  companyName?: string;
}

export interface FleetJobOrder {
  id: string;
  companyName: string;
  dotNumber: string;
  mcNumber: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  driversNeeded: number;
  equipmentType: string[];
  transmission: 'Automatic' | 'Manual (10-speed)' | 'Either';
  minExperienceYears: number;
  maxViolations3Years: number;
  hometimeCadence: string;
  payPerMile: string;
  avgWeeklyMiles: string;
  guaranteedWeeklyMin: string;
  petPolicy: boolean;
  passengerPolicy: boolean;
  operatingLanes: string;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  anonymizedTitle: string;
  fullName: string;
  phone: string;
  email: string;
  location: {
    city: string;
    state: string;
    zip: string;
  };
  cdlClass: 'Class A' | 'Class B';
  licenseNumber: string;
  issuingState: string;
  cdlExpiration: string;
  yearsExperience: number;
  endorsements: string[];
  equipment: string[];
  preferredRoutes: string[];
  hometime: string;
  payExpectation: string;
  cleanMvr: boolean;
  violationsLast3Yrs: number;
  dotMedCardStatus: 'Verified' | 'Pending' | 'Expired';
  dotMedCardExpiry: string;
  bonusEligible: boolean;
  bonusAmount: number;
  aiFluencyScore: number;
  aiSummary: string;
  videoInterview: {
    recorded: boolean;
    duration: string;
    videoBlobUrl?: string;
    transcripts: {
      questionNumber: number;
      question: string;
      answer: string;
      timestamp: string;
    }[];
  };
  dqDocuments: {
    cdlFront: string;
    cdlBack: string;
    medCard: string;
    clearinghouseStatus: 'Passed' | 'Pending';
  };
  dqDocumentPaths?: {
    cdlFront?: string;
    medCard?: string;
  };
  status: 'available' | 'unlocked' | 'placed' | 'milestone_90';
  unlockedAt?: string;
  unlockedByCarrier?: string;
  placementDetails?: {
    carrierName: string;
    carrierContact: string;
    startDate: string;
    daysCompleted: number;
    targetDays: number;
    totalFee: number;
    feePaid: number;
    driverBonusPaid: boolean;
  };
}

export interface ApplicationFormData {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  zip: string;
  cdlClass: 'Class A' | 'Class B';
  issuingState: string;
  licenseNumber: string;
  yearsExperience: number;
  endorsements: string[];
  equipment: string[];
  preferredRoutes: string[];
  hometime: string;
  payExpectation: string;
  hasCleanMvr: boolean;
  violationsCount: number;
  hasDotMedCard: boolean;
  medCardExpiry: string;
  cdlFrontUploaded: boolean;
  medCardUploaded: boolean;
  videoCompleted: boolean;
  agreedToTerms: boolean;
}

export interface InterviewQuestion {
  id: number;
  title: string;
  question: string;
  promptGuidance: string;
  maxSeconds: number;
  timeRemaining?: number;
}
