import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlacementInvoiceModal } from './PlacementInvoiceModal';
import type { DriverProfile } from '../../types';

const mockDriver: DriverProfile = {
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
  aiSummary: 'Verified Class A Reefer Specialist.',
  videoInterview: { recorded: true, duration: '02:30', transcripts: [] },
  dqDocuments: { cdlFront: 'Verified', cdlBack: 'Verified', medCard: 'Verified', clearinghouseStatus: 'Passed' },
  status: 'placed',
  unlockedByCarrier: 'Swiftline Global Logistics LLC',
  placementDetails: {
    carrierName: 'Swiftline Global Logistics LLC',
    carrierContact: 'Robert Miller (Director of Fleet Safety)',
    startDate: '2026-03-01',
    daysCompleted: 34,
    targetDays: 90,
    totalFee: 4500,
    feePaid: 2250,
    driverBonusPaid: false
  }
};

describe('PlacementInvoiceModal — Contingency Fee Invoice Generation', () => {
  beforeEach(() => {
    window.print = vi.fn();
  });

  it('renders placement invoice with 50/50 fee milestone structure', () => {
    render(<PlacementInvoiceModal driver={mockDriver} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getAllByText(/INVOICE/i).length).toBeGreaterThan(0);
    expect(screen.getByText('#HM-INV-1001')).toBeInTheDocument();
    expect(screen.getByText('Swiftline Global Logistics LLC')).toBeInTheDocument();
    expect(screen.getByText(/Marcus Vance/i)).toBeInTheDocument();
    expect(screen.getByText('$4,500.00')).toBeInTheDocument();
    expect(screen.getByText('Initial 50% Balance Due Now (Net 15):')).toBeInTheDocument();
  });

  it('triggers window.print when Print / Save PDF button is clicked', () => {
    render(<PlacementInvoiceModal driver={mockDriver} isOpen={true} onClose={vi.fn()} />);

    const printBtn = screen.getByRole('button', { name: /print \/ save pdf/i });
    fireEvent.click(printBtn);

    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
