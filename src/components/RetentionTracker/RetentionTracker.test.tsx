import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DriverProfile } from '../../types';
import { RetentionTracker } from './RetentionTracker';

const mockSendRetentionSmsPulse = vi.fn();
const mockDisburseRetentionBonus = vi.fn();

vi.mock('../../services/supabase', () => ({
  sendRetentionSmsPulse: (...args: unknown[]) => mockSendRetentionSmsPulse(...args),
  disburseRetentionBonus: (...args: unknown[]) => mockDisburseRetentionBonus(...args),
}));

const makePlacedDriver = (overrides: Partial<DriverProfile> = {}): DriverProfile => ({
  id: 'DRV-9001',
  anonymizedTitle: 'CDL-A Driver • 8 Yrs Exp',
  location: { city: 'Dallas', state: 'TX', zip: '75201' },
  cdlClass: 'Class A',
  yearsExperience: 8,
  endorsements: ['Tanker', 'HazMat'],
  equipment: ['Dry Van', 'Reefer'],
  preferredRoutes: ['OTR', 'Regional'],
  hometime: 'Bi-Weekly',
  payExpectation: '$0.72 CPM',
  cleanMvr: true,
  violationsLast3Yrs: 0,
  dotMedCardStatus: 'Verified',
  dotMedCardExpiry: '2027-08-15',
  bonusEligible: true,
  bonusAmount: 1500,
  aiFluencyScore: 96,
  aiSummary: 'Experienced driver with clean record.',
  videoInterview: {
    recorded: true,
    duration: '1:45',
    transcripts: [],
  },
  status: 'milestone_90',
  fullName: 'Marcus Vance',
  phone: '(214) 555-0144',
  email: 'marcus@example.com',
  licenseNumber: 'TX-88392011',
  issuingState: 'TX',
  cdlExpiration: '2029-05-15',
  dqDocuments: {
    cdlFront: 'verified',
    cdlBack: 'verified',
    medCard: 'verified',
    clearinghouseStatus: 'Passed',
  },
  placementDetails: {
    carrierName: 'Swiftline Global Logistics LLC',
    carrierContact: 'Robert Miller',
    startDate: '2026-08-01',
    daysCompleted: 90,
    targetDays: 90,
    totalFee: 4500,
    feePaid: 4500,
    driverBonusPaid: false,
  },
  ...overrides,
});

describe('RetentionTracker — SMS pulse & bonus disbursement UI', () => {
  beforeEach(() => {
    mockSendRetentionSmsPulse.mockReset();
    mockDisburseRetentionBonus.mockReset();
  });

  it('logs an SMS pulse check and updates the button + timestamp on success', async () => {
    const user = userEvent.setup();
    const sentAt = '2026-11-10T09:00:00.000Z';
    mockSendRetentionSmsPulse.mockResolvedValueOnce({
      success: true,
      sentAt,
    });

    render(<RetentionTracker drivers={[makePlacedDriver()]} />);

    const smsButton = screen.getByRole('button', { name: /send sms pulse check/i });
    await user.click(smsButton);

    await waitFor(() => {
      expect(mockSendRetentionSmsPulse).toHaveBeenCalledWith('DRV-9001');
    });

    expect(await screen.findByRole('button', { name: /pulse check sent/i })).toBeInTheDocument();
    expect(screen.getByText(/last pulse check logged:/i)).toBeInTheDocument();
  });

  it('disburses the $1,500 bonus for a 90-day driver and flips status to Disbursed', async () => {
    const user = userEvent.setup();
    mockDisburseRetentionBonus.mockResolvedValueOnce({
      success: true,
      disbursedAt: '2026-11-10T09:05:00.000Z',
    });

    render(<RetentionTracker drivers={[makePlacedDriver()]} />);

    expect(screen.getByText(/locked in escrow/i)).toBeInTheDocument();
    const disburseBtn = screen.getByRole('button', { name: /disburse \$1,500 bonus/i });
    await user.click(disburseBtn);

    await waitFor(() => {
      expect(mockDisburseRetentionBonus).toHaveBeenCalledWith('DRV-9001');
    });

    expect(await screen.findByText(/disbursed \(\$1,500\)/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disburse \$1,500 bonus/i })).not.toBeInTheDocument();
  });

  it('surfaces an error banner if recording the SMS pulse or bonus fails', async () => {
    const user = userEvent.setup();
    mockSendRetentionSmsPulse.mockResolvedValueOnce({
      success: false,
      error: 'DB offline',
      sentAt: '2026-11-10T09:10:00.000Z',
    });

    render(<RetentionTracker drivers={[makePlacedDriver()]} />);

    await user.click(screen.getByRole('button', { name: /send sms pulse check/i }));

    expect(
      await screen.findByText(/couldn't record that action — please try again\./i)
    ).toBeInTheDocument();
  });

  it('runs automated 24h batch pulse sentinel check across placed drivers', async () => {
    const user = userEvent.setup();
    mockSendRetentionSmsPulse.mockResolvedValue({
      success: true,
      sentAt: '2026-11-10T09:00:00.000Z',
    });

    render(<RetentionTracker drivers={[makePlacedDriver()]} />);

    const batchBtn = screen.getByRole('button', { name: /run automated 24h pulse sentinel/i });
    await user.click(batchBtn);

    await waitFor(() => {
      expect(mockSendRetentionSmsPulse).toHaveBeenCalled();
    });

    expect(await screen.findByText(/automated 24h retention sentinel pulse dispatched/i)).toBeInTheDocument();
  });

  it('toggles at-risk sentiment flag and displays intervention alert', async () => {
    const user = userEvent.setup();
    render(<RetentionTracker drivers={[makePlacedDriver()]} />);

    const flagBtn = screen.getByRole('button', { name: /flag at-risk/i });
    await user.click(flagBtn);

    expect(await screen.findByText(/⚠️ AT-RISK OF TURNOVER/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resolve risk ✓/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /resolve risk ✓/i }));
    expect(screen.queryByText(/⚠️ AT-RISK OF TURNOVER/i)).not.toBeInTheDocument();
  });
});
