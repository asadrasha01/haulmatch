import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpressApplicationForm } from './ExpressApplicationForm';

// This suite covers the fix made alongside the real Tesseract.js OCR
// implementation: the "Proceed to Video Interview" button used to
// unconditionally force `cdlUploaded`/`medCardUploaded` to true regardless
// of what OCR actually found, which made the OCR step purely cosmetic. It
// must now stay disabled until both documents have genuinely passed OCR,
// and it must surface OCR failures instead of silently succeeding.
//
// The OCR service itself (Tesseract.js reading an image) is mocked here —
// that's covered by its own dedicated unit tests in services/ocr.test.ts —
// so this suite can focus purely on how the form reacts to OCR results.
vi.mock('../../services/ocr', () => ({
  runOcrOnDocument: vi.fn()
}));

vi.mock('../../services/supabase', () => ({
  uploadDriverDocument: vi.fn().mockResolvedValue({ success: true })
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
});
