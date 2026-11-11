import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CarrierDashboard } from './CarrierDashboard';
import { INITIAL_DRIVERS } from '../../data/mockDrivers';

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

vi.mock('../../services/supabase', () => ({
  fetchFleetJobOrders: vi.fn().mockResolvedValue([]),
  getSupabaseClient: () => null
}));

vi.mock('../../services/activityEvents', () => ({
  fetchSavedSearches: vi.fn().mockReturnValue([
    {
      id: 'search-1',
      label: 'Texas Reefer',
      cdlClass: 'Class A',
      equipment: 'Refrigerated (Reefer)',
      minExperience: 5,
      zip: '75001',
      carrierId: 'carrier-1',
      emailAlerts: true
    }
  ]),
  fetchSavedSearchesAsync: vi.fn().mockResolvedValue([
    {
      id: 'search-1',
      label: 'Texas Reefer',
      cdlClass: 'Class A',
      equipment: 'Refrigerated (Reefer)',
      minExperience: 5,
      zip: '75001',
      carrierId: 'carrier-1',
      emailAlerts: true
    }
  ]),
  saveCarrierSearch: vi.fn().mockImplementation((label, filters) => ({
    id: 'search-2',
    label,
    cdlClass: filters?.cdlClass,
    equipment: filters?.equipment,
    minExperience: filters?.minExperience,
    zip: filters?.zip,
    carrierId: 'carrier-1',
    emailAlerts: true
  })),
  deleteSavedSearch: vi.fn(),
  logActivityEvent: vi.fn(),
  createInterviewProposal: vi.fn()
}));

describe('CarrierDashboard — Blind Candidate Pool & Contingency Unlocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders driver candidate cards and search bar', () => {
    render(
      <CarrierDashboard
        drivers={INITIAL_DRIVERS}
        onContractSigned={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Search by ID, State/i)).toBeInTheDocument();
    expect(screen.getByText(/Pre-Screened CDL Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/Texas Reefer/i)).toBeInTheDocument();
  });

  it('filters drivers when searching for specific city or equipment', () => {
    render(
      <CarrierDashboard
        drivers={INITIAL_DRIVERS}
        onContractSigned={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by ID, State/i);
    fireEvent.change(searchInput, { target: { value: 'CDL-8421' } });

    expect(screen.getByText(/Senior CDL-A Reefer & Dry Van Specialist/i)).toBeInTheDocument();
  });

  it('opens placement contract modal when clicking unlock and completes signing', async () => {
    const onContractSignedSpy = vi.fn();

    render(
      <CarrierDashboard
        drivers={INITIAL_DRIVERS}
        onContractSigned={onContractSignedSpy}
      />
    );

    // Look for the first "Unlock Candidate" button on available drivers
    const unlockButtons = screen.getAllByRole('button', { name: /Unlock Candidate/i });
    expect(unlockButtons.length).toBeGreaterThan(0);
    fireEvent.click(unlockButtons[0]);

    // Modal should now be visible
    expect(screen.getByText(/Contingency Placement Agreement/i)).toBeInTheDocument();

    const signButton = screen.getByRole('button', { name: /E-Sign & Unlock Candidate Contact/i });
    expect(signButton).toBeInTheDocument();
    fireEvent.click(signButton);

    await waitFor(
      () => {
        expect(onContractSignedSpy).toHaveBeenCalledWith(
          INITIAL_DRIVERS[0].id,
          'Swiftline Global Logistics LLC',
          'Robert Miller',
          'Director of Fleet Safety & Recruiting'
        );
      },
      { timeout: 2500 }
    );
  });
});
