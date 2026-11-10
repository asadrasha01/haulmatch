import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AdminDashboard } from './AdminDashboard';
import * as csvExport from '../../utils/csvExport';
import * as supabase from '../../services/supabase';

describe('AdminDashboard — Ops Command Center Extended Features', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders all main tabs including Driver Pipeline, Orders, Placements, Users, and Audit', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Driver Pipeline/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fleet Intake Orders/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Placements & Escrow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Auth Users/i })).toBeInTheDocument();
    });
  });

  it('triggers CSV export for Driver Pipeline', async () => {
    const exportSpy = vi.spyOn(csvExport, 'exportDriverPipelineCsv').mockImplementation(() => {});

    render(<AdminDashboard />);

    const exportBtn = await screen.findByRole('button', { name: /Export Pipeline \(CSV\)/i });
    fireEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalled();
  });

  it('opens candidate video screening & DQ dossier modal when "Dossier & Video" is clicked', async () => {
    render(<AdminDashboard />);

    const dossierBtns = await screen.findAllByRole('button', { name: /Dossier & Video/i });
    expect(dossierBtns.length).toBeGreaterThan(0);

    fireEvent.click(dossierBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/FMCSA PART 391 DQ DOSSIER/i)).toBeInTheDocument();
    });
  });

  it('switches to Fleet Orders tab and opens New Fleet Requisition modal', async () => {
    render(<AdminDashboard />);

    const ordersTabBtn = await screen.findByRole('button', { name: /Fleet Intake Orders/i });
    fireEvent.click(ordersTabBtn);

    const newReqBtn = await screen.findByRole('button', { name: /\+ New Fleet Requisition/i });
    fireEvent.click(newReqBtn);

    await waitFor(() => {
      expect(screen.getByText(/CARRIER INTAKE \/\/ NEW FLEET JOB REQUISITION/i)).toBeInTheDocument();
    });
  });

  it('switches to Auth Users tab and allows vetting carrier accounts', async () => {
    const vettingSpy = vi.spyOn(supabase, 'updateCarrierVettingStatus').mockResolvedValue({ success: true });

    render(<AdminDashboard />);

    const usersTabBtn = await screen.findByRole('button', { name: /Auth Users/i });
    fireEvent.click(usersTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Platform Accounts & Carrier Vetting Queue/i)).toBeInTheDocument();
    });

    // Test filter pills
    const pendingPill = screen.getByRole('button', { name: /Pending Review/i });
    fireEvent.click(pendingPill);

    const approveButtons = await screen.findAllByRole('button', { name: /Approve MC & Credit/i });
    expect(approveButtons.length).toBeGreaterThan(0);

    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(vettingSpy).toHaveBeenCalled();
    });
  });
});
