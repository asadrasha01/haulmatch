import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpressApplicationForm, DRAFT_STORAGE_KEY } from './ExpressApplicationForm';

vi.mock('../../services/ocr', () => ({
  runOcrOnDocument: vi.fn()
}));

vi.mock('../../services/supabase', () => ({
  uploadDriverDocument: vi.fn().mockResolvedValue({ success: true }),
  getSupabaseClient: () => null
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

import { runOcrOnDocument } from '../../services/ocr';

const mockedRunOcr = vi.mocked(runOcrOnDocument);

const getToDocumentStep = async () => {
  const user = userEvent.setup();
  render(<ExpressApplicationForm onDriverRegistered={vi.fn()} onSwitchToCarrierView={vi.fn()} />);

  // Fill in a name so the "Continue" button doesn't take the auto-fill-demo
  // shortcut (which bypasses OCR entirely by design) and instead advances to
  // a genuinely fresh, unverified Step 2.
  await user.type(screen.getByPlaceholderText('e.g. Raymond Cole'), 'Jane Driver');
  await user.click(screen.getByRole('button', { name: /continue to document upload/i }));

  return user;
};

const uploadFile = async (user: ReturnType<typeof userEvent.setup>, labelText: RegExp, fileName: string) => {
  const input = screen.getByLabelText(labelText) as HTMLInputElement;
  const file = new File(['dummy'], fileName, { type: 'image/jpeg' });
  await user.upload(input, file);
};

describe('ExpressApplicationForm — document upload OCR gating', () => {
  beforeEach(() => {
    // Each test sets its own explicit OCR outcome(s) below; starting from a
    // clean mock avoids one test's resolved value leaking into the next.
    mockedRunOcr.mockReset();
  });

  it('keeps "Proceed to Video Interview" disabled until both documents pass OCR', async () => {
    mockedRunOcr.mockResolvedValue({ success: true, confidence: 80 });
    const user = await getToDocumentStep();

    const proceedButton = screen.getByRole('button', { name: /proceed to video interview/i });
    expect(proceedButton).toBeDisabled();

    await uploadFile(user, /upload cdl photo/i, 'cdl.jpg');
    await waitFor(() => expect(screen.getByText(/verified:/i)).toBeInTheDocument());
    expect(proceedButton).toBeDisabled();

    await uploadFile(user, /upload dot med card/i, 'medcard.jpg');
    await waitFor(() => expect(proceedButton).not.toBeDisabled());
  });

  it('surfaces an OCR failure instead of marking the document verified', async () => {
    mockedRunOcr.mockResolvedValueOnce({
      success: false,
      error: 'Could not read this image clearly. Please retake the photo in good lighting with the full document visible and in focus.'
    });
    const user = await getToDocumentStep();

    await uploadFile(user, /upload cdl photo/i, 'blurry.jpg');

    await waitFor(() =>
      expect(screen.getByText(/could not read this image clearly/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /proceed to video interview/i })).toBeDisabled();
    // The upload control for the failed document should still be available
    // to retry, rather than being replaced by a false "Verified" state.
    expect(screen.getByLabelText(/upload cdl photo/i)).toBeInTheDocument();
  });

  it('lets a retried upload clear a previous OCR error on success', async () => {
    mockedRunOcr
      .mockResolvedValueOnce({ success: false, error: 'Could not verify this document.' })
      .mockResolvedValueOnce({ success: true, confidence: 91, licenseNumber: 'TX-83921044' });
    const user = await getToDocumentStep();

    await uploadFile(user, /upload cdl photo/i, 'blurry.jpg');
    await waitFor(() => expect(screen.getByText(/could not verify this document/i)).toBeInTheDocument());

    await uploadFile(user, /upload cdl photo/i, 'clear.jpg');
    await waitFor(() => expect(screen.getByText(/verified:/i)).toBeInTheDocument());
    expect(screen.queryByText(/could not verify this document/i)).not.toBeInTheDocument();
  });

  it('opens live optical document scanner when clicking "Scan CDL with Camera"', async () => {
    const user = await getToDocumentStep();

    const scanBtn = screen.getByRole('button', { name: /scan cdl with camera/i });
    expect(scanBtn).toBeInTheDocument();
    await user.click(scanBtn);

    expect(screen.getByRole('dialog', { name: /live document scanner/i })).toBeInTheDocument();
    expect(screen.getByText(/DOC-01 \/\/ STATE CDL SCAN/i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/close scanner/i);
    await user.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: /live document scanner/i })).not.toBeInTheDocument();
  });
});

describe('ExpressApplicationForm — application draft auto-save and restore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores draft data and displays the draft restoration banner', () => {
    const fakeDraft = {
      step: 1,
      formData: {
        fullName: 'Sarah Connor',
        phone: '(555) 019-2834',
        email: 'sarah.connor@roadway.com',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        cdlClass: 'Class A',
        issuingState: 'TX',
        licenseNumber: 'TX-99887766',
        yearsExperience: 8,
        endorsements: ['HazMat (H)'],
        equipment: ['Dry Van'],
        preferredRoutes: ['Regional (Southwest)'],
        hometime: 'Home Every Weekend',
        payExpectation: '$0.75 - $0.80 CPM',
        hasCleanMvr: true,
        violationsCount: 0,
        hasDotMedCard: true,
        medCardExpiry: '2027-11-20',
        cdlUploaded: false,
        medCardUploaded: false,
        videoRecorded: false
      },
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fakeDraft));

    render(<ExpressApplicationForm onDriverRegistered={vi.fn()} onSwitchToCarrierView={vi.fn()} />);

    expect(screen.getByText(/draft restored from/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(555) 019-2834')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sarah.connor@roadway.com')).toBeInTheDocument();
  });

  it('allows starting fresh by clearing the restored draft', async () => {
    const user = userEvent.setup();
    const fakeDraft = {
      step: 1,
      formData: {
        fullName: 'John Matrix',
        phone: '(555) 123-4567',
        email: 'john@matrix.com',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        cdlClass: 'Class A',
        issuingState: 'TX',
        licenseNumber: 'TX-11223344',
        yearsExperience: 10,
        endorsements: [],
        equipment: ['Flatbed'],
        preferredRoutes: ['OTR (Lower 48)'],
        hometime: 'Home Monthly',
        payExpectation: '$0.80 CPM',
        hasCleanMvr: true,
        violationsCount: 0,
        hasDotMedCard: true,
        medCardExpiry: '2027-01-01',
        cdlUploaded: false,
        medCardUploaded: false,
        videoRecorded: false
      },
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fakeDraft));

    render(<ExpressApplicationForm onDriverRegistered={vi.fn()} onSwitchToCarrierView={vi.fn()} />);

    expect(screen.getByDisplayValue('John Matrix')).toBeInTheDocument();
    const startFreshBtn = screen.getByRole('button', { name: /start fresh/i });
    await user.click(startFreshBtn);

    expect(screen.queryByText(/draft restored from/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('John Matrix')).not.toBeInTheDocument();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('auto-saves form progress into localStorage after typing', async () => {
    const user = userEvent.setup();
    render(<ExpressApplicationForm onDriverRegistered={vi.fn()} onSwitchToCarrierView={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('e.g. Raymond Cole');
    await user.type(nameInput, 'Alex Trucker');

    await waitFor(() => {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.formData.fullName).toBe('Alex Trucker');
      expect(screen.getByText(/draft auto-saved/i)).toBeInTheDocument();
    });
  });
});
