import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DriverCabin } from './DriverCabin';
import { INITIAL_DRIVERS } from '../../data/mockDrivers';
import * as driverOffers from '../../services/driverOffers';

describe('DriverCabin — Driver Career Cockpit & Offer Center', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders driver name, CDL info, and key metrics strip', () => {
    render(<DriverCabin drivers={INITIAL_DRIVERS} />);

    expect(screen.getByText(/SEC-07 \/\/ DRIVER CABIN & CAREER COCKPIT/i)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(INITIAL_DRIVERS[0].fullName, 'i')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Carrier Placement Offers/i)).toBeInTheDocument();
    expect(screen.getByText(/90-Day Stay Bonus Status/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Blind Mode/i)).toBeInTheDocument();
  });

  it('displays carrier offers and allows accepting an interview slot', async () => {
    const acceptSpy = vi.spyOn(driverOffers, 'acceptCarrierOffer');

    render(<DriverCabin drivers={INITIAL_DRIVERS} />);

    expect(screen.getByText(/Active Fleet Inquiries & Placement Offers/i)).toBeInTheDocument();
    expect(screen.getByText(/Swiftline Global Logistics LLC/i)).toBeInTheDocument();

    const slotButtons = screen.getAllByText(/Tomorrow at 10:00 AM CST/i);
    expect(slotButtons.length).toBeGreaterThan(0);

    fireEvent.click(slotButtons[0]);

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith(
        expect.any(String),
        'Tomorrow at 10:00 AM CST',
        INITIAL_DRIVERS[0].fullName
      );
    });
  });

  it('switches to 90-Day Retention Bonus tab and shows milestone progression', () => {
    render(<DriverCabin drivers={INITIAL_DRIVERS} />);

    const retentionTabBtn = screen.getByRole('button', { name: /\$1,500 Stay Bonus & Warranty Tracker/i });
    fireEvent.click(retentionTabBtn);

    expect(screen.getByText(/PROGRESSION TO \$1,500 CASH REWARD/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 14 Welcome Check-in/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 90 · \$1,500 Wire Disbursed/i)).toBeInTheDocument();
  });

  it('switches to DQ Credentials tab and displays verified licenses and med card', () => {
    render(<DriverCabin drivers={INITIAL_DRIVERS} />);

    const dqTabBtn = screen.getByRole('button', { name: /My CDL Credentials & Compliance/i });
    fireEvent.click(dqTabBtn);

    expect(screen.getByText(/COMMERCIAL DRIVER LICENSE/i)).toBeInTheDocument();
    expect(screen.getByText(/DOT MEDICAL EXAMINER CERT/i)).toBeInTheDocument();
    expect(screen.getByText(/SAFETY AUDIT & CLEARINGHOUSE/i)).toBeInTheDocument();
  });

  it('requests direct recruiter advocate callback', async () => {
    render(<DriverCabin drivers={INITIAL_DRIVERS} />);

    const recruiterTabBtn = screen.getByRole('button', { name: /Advocate Support & Dispatch Help/i });
    fireEvent.click(recruiterTabBtn);

    expect(screen.getAllByText(/Sarah Jenkins/i).length).toBeGreaterThan(0);

    const callbackBtn = screen.getByRole('button', { name: /Request Direct Advocate Callback/i });
    fireEvent.click(callbackBtn);

    await waitFor(() => {
      expect(screen.getByText(/Callback Scheduled/i)).toBeInTheDocument();
    });
  });
});
