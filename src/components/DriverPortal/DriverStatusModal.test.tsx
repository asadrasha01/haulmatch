import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriverStatusModal } from './DriverStatusModal';
import type { DriverProfile } from '../../types';

const mockDrivers: DriverProfile[] = [
  {
    id: 'CDL-1001',
    anonymizedTitle: 'Verified Class A Reefer Specialist',
    fullName: 'Marcus Vance',
    phone: '(214) 555-0187',
    email: 'm.vance@roadway.com',
    location: { city: 'Dallas', state: 'TX', zip: '75201' },
    cdlClass: 'Class A',
    licenseNumber: 'TX-83921044',
    issuingState: 'TX',
    cdlExpiration: '2028-05-12',
    yearsExperience: 7,
    endorsements: ['HazMat (H)', 'Tanker (N)'],
    equipment: ['Refrigerated (Reefer)', 'Dry Van'],
    preferredRoutes: ['Regional (Southwest)'],
    hometime: 'Home Every Weekend',
    payExpectation: '$0.76 CPM',
    cleanMvr: true,
    violationsLast3Yrs: 0,
    dotMedCardStatus: 'Verified',
    dotMedCardExpiry: '2027-04-10',
    bonusEligible: true,
    bonusAmount: 1500,
    aiFluencyScore: 89,
    aiSummary: 'Verified Class A Reefer Specialist with 7 years clean experience.',
    videoInterview: { recorded: true, duration: '02:30', transcripts: [] },
    dqDocuments: { cdlFront: 'Verified', cdlBack: 'Verified', medCard: 'Verified', clearinghouseStatus: 'Passed' },
    status: 'unlocked',
    unlockedByCarrier: 'Swiftline Global Logistics',
    placementDetails: {
      carrierName: 'Swiftline Global Logistics',
      carrierContact: 'Robert Miller (Director of Safety)',
      startDate: '2026-03-01',
      daysCompleted: 34,
      targetDays: 90,
      totalFee: 4500,
      feePaid: 2250,
      driverBonusPaid: false
    }
  }
];

describe('DriverStatusModal — Driver applicant status tracking', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeTextMock.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock
      },
      writable: true,
      configurable: true
    });
  });

  it('renders driver candidate status and milestone countdown correctly', () => {
    render(
      <DriverStatusModal
        isOpen={true}
        driverId="CDL-1001"
        drivers={mockDrivers}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText(/ID: CDL-1001/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Swiftline Global Logistics/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Day 34 of 90/i)).toBeInTheDocument();
    expect(screen.getByText(/56 Days Left/i)).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
  });

  it('copies magic status link to clipboard when clicked', () => {
    render(
      <DriverStatusModal
        isOpen={true}
        driverId="CDL-1001"
        drivers={mockDrivers}
        onClose={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /copy magic status link/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('?driverStatus=CDL-1001')
    );
    expect(screen.getByText(/link copied to clipboard/i)).toBeInTheDocument();
  });

  it('triggers recruiter callback request', () => {
    render(
      <DriverStatusModal
        isOpen={true}
        driverId="CDL-1001"
        drivers={mockDrivers}
        onClose={vi.fn()}
      />
    );

    const callbackBtn = screen.getByRole('button', { name: /request staff callback/i });
    fireEvent.click(callbackBtn);

    expect(screen.getByText(/recruiter callback scheduled!/i)).toBeInTheDocument();
    expect(callbackBtn).toBeDisabled();
  });
});
