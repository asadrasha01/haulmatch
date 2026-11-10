import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DriverDossierModal } from './DriverDossierModal';
import { INITIAL_DRIVERS } from '../../data/mockDrivers';

describe('DriverDossierModal — Candidate Video Screening & DQ Dossier Inspector', () => {
  const mockDriver = INITIAL_DRIVERS[0];

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DriverDossierModal driver={mockDriver} isOpen={false} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders driver candidate name, ID, and video screening tabs when open', () => {
    render(
      <DriverDossierModal driver={mockDriver} isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText(new RegExp(mockDriver.fullName, 'i'))).toBeInTheDocument();
    expect(screen.getByText(/FMCSA PART 391 DQ DOSSIER/i)).toBeInTheDocument();
    expect(screen.getByText(/01 \/\/ VIDEO INTERVIEW & SPEECH AI TRANSCRIPTS/i)).toBeInTheDocument();
    expect(screen.getByText(/02 \/\/ FMCSA PART 391 DQ COMPLIANCE FILE/i)).toBeInTheDocument();
  });

  it('allows switching between Video Screening and DQ Compliance tabs', () => {
    render(
      <DriverDossierModal driver={mockDriver} isOpen={true} onClose={vi.fn()} />
    );

    // Initial view is video transcripts
    expect(screen.getByText(/Speech Recognition Transcripts/i)).toBeInTheDocument();

    // Switch to DQ tab
    const dqTabButton = screen.getByText(/02 \/\/ FMCSA PART 391 DQ COMPLIANCE FILE/i);
    fireEvent.click(dqTabButton);

    expect(screen.getByText(/Commercial Driver License/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Certificate \(MCSA-5876\)/i)).toBeInTheDocument();
    expect(screen.getByText(/49 CFR PART 391 QUALIFICATION COMPLIANCE NOTICE/i)).toBeInTheDocument();
  });

  it('handles print action and close button callback', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const onCloseMock = vi.fn();

    render(
      <DriverDossierModal driver={mockDriver} isOpen={true} onClose={onCloseMock} />
    );

    const printButton = screen.getByText(/Print Dossier/i);
    fireEvent.click(printButton);
    expect(printSpy).toHaveBeenCalled();

    const closeButton = screen.getByLabelText(/Close dossier modal/i);
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });
});

