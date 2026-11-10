import { afterEach, describe, expect, it, vi } from 'vitest';
import { runOcrOnDocument } from './ocr';

// Tesseract.js does real WASM OCR against an image, which isn't something we
// want (or are able) to run inside a unit test. We mock the library's
// `createWorker` factory so we can drive `runOcrOnDocument`'s own branching
// logic (success/low-confidence/error handling, regex extraction) under
// controlled, deterministic "OCR results". Vitest hoists `vi.mock` above
// these imports automatically, so the mock is in place before `./ocr` (and
// its own `import { createWorker } from 'tesseract.js'`) is evaluated.
const recognizeMock = vi.fn();
const terminateMock = vi.fn().mockResolvedValue(undefined);
const createWorkerMock = vi.fn().mockResolvedValue({
  recognize: recognizeMock,
  terminate: terminateMock
});

vi.mock('tesseract.js', () => ({
  createWorker: (...args: unknown[]) => createWorkerMock(...args)
}));

const makeFile = (name: string, type: string): File => {
  return new File(['dummy-bytes'], name, { type });
};

describe('runOcrOnDocument', () => {
  afterEach(() => {
    vi.clearAllMocks();
    createWorkerMock.mockResolvedValue({ recognize: recognizeMock, terminate: terminateMock });
  });

  it('skips OCR and reports success for PDF uploads without calling Tesseract', async () => {
    const file = makeFile('cdl.pdf', 'application/pdf');
    const result = await runOcrOnDocument(file, 'cdl');

    expect(result.success).toBe(true);
    expect(result.rawText).toMatch(/text extraction skipped/i);
    expect(createWorkerMock).not.toHaveBeenCalled();
  });

  it('extracts license numbers and expiry dates directly from text-based PDFs', async () => {
    const pdfBytes = '%PDF-1.4\n1 0 obj\nstream\nBT (TEXAS CDL) Tj (DL TX-99887766) Tj ET\nendstream';
    const cdlPdf = new File([pdfBytes], 'cdl.pdf', { type: 'application/pdf' });
    const cdlResult = await runOcrOnDocument(cdlPdf, 'cdl');

    expect(cdlResult.success).toBe(true);
    expect(cdlResult.licenseNumber).toBe('TX-99887766');
    expect(createWorkerMock).not.toHaveBeenCalled();
  });

  it('rejects files that are neither images nor PDFs', async () => {
    const file = makeFile('notes.txt', 'text/plain');
    const result = await runOcrOnDocument(file, 'cdl');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/photo.*or PDF/i);
    expect(createWorkerMock).not.toHaveBeenCalled();
  });

  it('extracts a license number from clear, high-confidence CDL text', async () => {
    recognizeMock.mockResolvedValue({
      data: { text: 'TEXAS DRIVER LICENSE\nDL TX-83921044\nCLASS A', confidence: 82 }
    });
    const file = makeFile('cdl.jpg', 'image/jpeg');

    const result = await runOcrOnDocument(file, 'cdl');

    expect(result.success).toBe(true);
    expect(result.licenseNumber).toBe('TX-83921044');
    expect(terminateMock).toHaveBeenCalledTimes(1);
  });

  it('extracts and normalizes an expiry date from DOT medical card text', async () => {
    recognizeMock.mockResolvedValue({
      data: { text: 'MEDICAL EXAMINER CERTIFICATE\nExpiration Date: 08/20/27', confidence: 70 }
    });
    const file = makeFile('medcard.png', 'image/png');

    const result = await runOcrOnDocument(file, 'medCard');

    expect(result.success).toBe(true);
    expect(result.expiryDate).toBe('2027-08-20');
  });

  it('fails when OCR confidence is too low to trust the read', async () => {
    recognizeMock.mockResolvedValue({
      data: { text: 'smudged garbage', confidence: 10 }
    });
    const file = makeFile('blurry.jpg', 'image/jpeg');

    const result = await runOcrOnDocument(file, 'cdl');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/could not read this image clearly/i);
  });

  it('fails when no text at all is recognized', async () => {
    recognizeMock.mockResolvedValue({
      data: { text: '', confidence: 90 }
    });
    const file = makeFile('blank.jpg', 'image/jpeg');

    const result = await runOcrOnDocument(file, 'medCard');

    expect(result.success).toBe(false);
  });

  it('reports failure and still terminates the worker if the OCR engine throws', async () => {
    recognizeMock.mockRejectedValue(new Error('WASM module failed to load'));
    const file = makeFile('cdl.jpg', 'image/jpeg');

    const result = await runOcrOnDocument(file, 'cdl');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/WASM module failed to load/);
    expect(terminateMock).toHaveBeenCalledTimes(1);
  });

  it('does not extract a license number from medical card text (wrong doc type)', async () => {
    recognizeMock.mockResolvedValue({
      data: { text: 'TX-83921044 should not be read as an expiry date', confidence: 80 }
    });
    const file = makeFile('medcard.jpg', 'image/jpeg');

    const result = await runOcrOnDocument(file, 'medCard');

    expect(result.success).toBe(true);
    expect(result.licenseNumber).toBeUndefined();
  });
});
