import type { DriverProfile, FleetJobOrder } from '../types';

/**
 * Escapes a single CSV cell value according to RFC 4180
 */
export const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Triggers a browser file download of CSV content with UTF-8 BOM
 */
export const downloadCsv = (filename: string, csvContent: string): void => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports Driver Pipeline to a formatted CSV
 */
export const exportDriverPipelineCsv = (drivers: DriverProfile[]): void => {
  const headers = [
    'Driver ID',
    'Full Name',
    'Phone',
    'Email',
    'City',
    'State',
    'ZIP',
    'CDL Class',
    'License Number',
    'Issuing State',
    'CDL Expiration',
    'Years Experience',
    'Endorsements',
    'Equipment Types',
    'Clean MVR',
    '3-Yr Violations',
    'DOT Med Card Status',
    'Med Card Expiration',
    'Clearinghouse Status',
    'AI Fluency Score',
    'Video Recorded',
    'Status',
    'Carrier Placed',
    'Bonus Eligible',
    'Bonus Amount'
  ];

  const rows = drivers.map((d) => [
    d.id,
    d.fullName,
    d.phone,
    d.email,
    d.location.city,
    d.location.state,
    d.location.zip,
    d.cdlClass,
    d.licenseNumber,
    d.issuingState,
    d.cdlExpiration || '',
    d.yearsExperience,
    (d.endorsements || []).join('; '),
    (d.equipment || []).join('; '),
    d.cleanMvr ? 'Yes' : 'No',
    d.violationsLast3Yrs,
    d.dotMedCardStatus,
    d.dotMedCardExpiry || '',
    d.dqDocuments?.clearinghouseStatus || 'Passed',
    d.aiFluencyScore,
    d.videoInterview?.recorded ? 'Yes' : 'No',
    d.status.toUpperCase(),
    d.placementDetails?.carrierName || d.unlockedByCarrier || 'None',
    d.bonusEligible ? 'Yes' : 'No',
    d.bonusAmount
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  downloadCsv(`haulmatch-driver-pipeline-${today}.csv`, csvContent);
};

/**
 * Exports Fleet Job Orders to a formatted CSV
 */
export const exportFleetJobOrdersCsv = (orders: FleetJobOrder[]): void => {
  const headers = [
    'Job Order ID',
    'Carrier Company',
    'DOT Number',
    'MC Number',
    'Contact Name',
    'Contact Title',
    'Contact Phone',
    'Contact Email',
    'Drivers Needed',
    'Equipment Required',
    'Transmission',
    'Min Experience (Yrs)',
    'Max 3-Yr Violations',
    'Hometime Cadence',
    'Pay Per Mile / Package',
    'Avg Weekly Miles',
    'Guaranteed Weekly Min',
    'Operating Lanes',
    'Pet Policy',
    'Passenger Policy',
    'Created At'
  ];

  const rows = orders.map((o) => [
    o.id,
    o.companyName,
    o.dotNumber,
    o.mcNumber,
    o.contactName,
    o.contactTitle,
    o.contactPhone,
    o.contactEmail,
    o.driversNeeded,
    (o.equipmentType || []).join('; '),
    o.transmission,
    o.minExperienceYears,
    o.maxViolations3Years,
    o.hometimeCadence,
    o.payPerMile,
    o.avgWeeklyMiles || '',
    o.guaranteedWeeklyMin,
    o.operatingLanes,
    o.petPolicy ? 'Yes' : 'No',
    o.passengerPolicy ? 'Yes' : 'No',
    o.createdAt
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  downloadCsv(`haulmatch-fleet-job-orders-${today}.csv`, csvContent);
};

/**
 * Exports Placements and Escrow Ledger to a formatted CSV
 */
export const exportPlacementsLedgerCsv = (drivers: DriverProfile[]): void => {
  const placedDrivers = drivers.filter(
    (d) => d.status === 'placed' || d.status === 'milestone_90' || d.placementDetails
  );

  const headers = [
    'Driver ID',
    'Candidate Name',
    'Phone',
    'Carrier Name',
    'Carrier Contact',
    'Placement Start Date',
    'Days Completed',
    'Target Warranty Days',
    'Placement Fee Total',
    'Fee Paid / Invoiced',
    'Day-90 $1,500 Bonus Disbursed',
    'Warranty Status',
    'Net Agency Margin'
  ];

  const rows = placedDrivers.map((d) => {
    const details = d.placementDetails || {
      carrierName: d.unlockedByCarrier || 'Partner Fleet LLC',
      carrierContact: 'Safety Director',
      startDate: '2026-09-15',
      daysCompleted: 45,
      targetDays: 90,
      totalFee: 4500,
      feePaid: 2250,
      driverBonusPaid: false
    };

    const is90 = details.daysCompleted >= 90;
    const bonusPaidAmount = details.driverBonusPaid ? 1500 : 0;
    const netMargin = details.feePaid - bonusPaidAmount;

    return [
      d.id,
      d.fullName,
      d.phone,
      details.carrierName,
      details.carrierContact,
      details.startDate,
      details.daysCompleted,
      details.targetDays,
      details.totalFee,
      details.feePaid,
      details.driverBonusPaid ? 'Disbursed' : 'In Escrow',
      is90 ? 'Day 90 Completed' : `In Progress (Day ${details.daysCompleted}/90)`,
      netMargin
    ];
  });

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  downloadCsv(`haulmatch-placements-escrow-ledger-${today}.csv`, csvContent);
};

