import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DocumentScannerModal } from './DocumentScannerModal';

describe('DocumentScannerModal — Live Camera Document Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DocumentScannerModal
        isOpen={false}
        targetDoc="cdl"
        onCapture={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal with CDL targeting guidelines when opened for cdl', () => {
    render(
      <DocumentScannerModal
        isOpen={true}
        targetDoc="cdl"
        onCapture={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: /Live Document Scanner/i })).toBeInTheDocument();
    expect(screen.getByText(/COMMERCIAL DRIVER LICENSE \(CDL\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ALIGN CDL CARD INSIDE FRAME/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Snap Document/i })).toBeInTheDocument();
  });

  it('renders modal with Medical Cert targeting guidelines when opened for medCard', () => {
    render(
      <DocumentScannerModal
        isOpen={true}
        targetDoc="medCard"
        onCapture={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/DOT MEDICAL CARD \(MCSA-5876\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ALIGN MEDICAL CERT INSIDE FRAME/i)).toBeInTheDocument();
  });

  it('triggers simulated scan and allows confirmation to pass captured file', () => {
    const onCaptureSpy = vi.fn();
    const onCloseSpy = vi.fn();

    // Mock HTMLCanvasElement.prototype.toBlob in JSDOM
    const mockToBlob = vi.fn((callback: (blob: Blob) => void) => {
      const blob = new Blob(['simulated-scan-bytes'], { type: 'image/jpeg' });
      callback(blob);
    });
    HTMLCanvasElement.prototype.toBlob = mockToBlob as any;

    render(
      <DocumentScannerModal
        isOpen={true}
        targetDoc="cdl"
        onCapture={onCaptureSpy}
        onClose={onCloseSpy}
      />
    );

    // Click the instant test scan button
    const testScanBtn = screen.getByTitle(/Generate an instant test scan without using the camera/i);
    fireEvent.click(testScanBtn);

    // Review controls should now be visible
    expect(screen.getByRole('button', { name: /Retake Scan/i })).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Confirm Scan & Run OCR →/i });
    expect(confirmBtn).toBeInTheDocument();

    fireEvent.click(confirmBtn);

    expect(onCaptureSpy).toHaveBeenCalledTimes(1);
    const capturedFile: File = onCaptureSpy.mock.calls[0][0];
    expect(capturedFile).toBeInstanceOf(File);
    expect(capturedFile.name).toContain('cdl-scan-');
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseSpy = vi.fn();

    render(
      <DocumentScannerModal
        isOpen={true}
        targetDoc="cdl"
        onCapture={vi.fn()}
        onClose={onCloseSpy}
      />
    );

    const closeBtn = screen.getByLabelText(/Close Scanner/i);
    fireEvent.click(closeBtn);

    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });
});
