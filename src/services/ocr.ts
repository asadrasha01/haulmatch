// Real, client-side OCR for the CDL / DOT Medical Card upload step, using
// Tesseract.js (a WASM port of the Tesseract OCR engine — runs entirely in
// the browser, no external API key or server call required). This replaces
// what used to be a 1.2-second setTimeout that always reported success
// regardless of what (if anything) was actually uploaded.
//
// Honest limitations:
// - Tesseract.js reads raster images. PDFs are accepted and stored, but text
//   extraction is skipped here (rendering a PDF page to a canvas first would
//   need pdf.js wired up separately — not done in this pass).
// - The license-number / expiry-date extraction below is a regex heuristic
//   over the raw OCR text, not a document-specific parser. It will miss
//   fields on unusual card layouts; it's still genuinely reading the image's
//   text rather than pretending to.

export interface OcrResult {
  success: boolean;
  rawText?: string;
  licenseNumber?: string;
  expiryDate?: string;
  confidence?: number;
  error?: string;
}

export const runOcrOnDocument = async (
  file: File,
  docType: 'cdl' | 'medCard'
): Promise<OcrResult> => {
  if (file.type === 'application/pdf') {
    const pdfText = await extractTextFromPdf(file);
    if (pdfText) {
      return buildParsedOcrResult(pdfText, 95, docType);
    }
    return {
      success: true,
      rawText: '(PDF upload — text extraction skipped; file stored for manual review.)'
    };
  }

  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Please upload a photo (JPEG/PNG) or PDF of the document.'
    };
  }

  let worker;
  try {
    const { createWorker } = await import('tesseract.js');
    worker = await createWorker('eng');
    const { data } = await worker.recognize(file);
    const rawText = data.text || '';
    const confidence = data.confidence ?? 0;

    if (!rawText.trim() || confidence < 35) {
      return {
        success: false,
        rawText,
        confidence,
        error:
          'Could not read this image clearly. Please retake the photo in good lighting with the full document visible and in focus.'
      };
    }

    return buildParsedOcrResult(rawText, confidence, docType);
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'The OCR engine failed to load or process this image. Please try again.'
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore
      }
    }
  }
};

const buildParsedOcrResult = (
  rawText: string,
  confidence: number,
  docType: 'cdl' | 'medCard'
): OcrResult => {
  const result: OcrResult = { success: true, rawText, confidence };

  if (docType === 'cdl') {
    // Candidate license number: a run of letters/digits 6-12 chars long,
    // optionally with a hyphen (e.g. "TX-83921044" or "DL1234567").
    const licenseMatch = rawText.match(/\b([A-Z]{0,3}-?\d{6,10})\b/);
    if (licenseMatch) {
      result.licenseNumber = licenseMatch[1].replace(/\s/g, '');
    }
  } else {
    // Candidate expiration date: MM/DD/YYYY or MM-DD-YYYY (also matches
    // 2-digit years).
    const dateMatch = rawText.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
    if (dateMatch) {
      const normalized = normalizeDate(dateMatch[1]);
      if (normalized) result.expiryDate = normalized;
    }
  }

  return result;
};

// Lightweight PDF text-object extractor: reads uncompressed PDF text strings
// (`( ... ) Tj` / `[ (...) ] TJ`) from digital PDFs without requiring heavy
// external worker bundles. Returns empty string for scanned/image-only PDFs.
const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const raw = await readBlobAsLatin1(file);
    if (!raw.includes('%PDF')) return '';
    const matches = [...raw.matchAll(/\(([^()\\]{2,})\)/g)];
    const extracted = matches.map((m) => m[1].trim()).filter(Boolean).join(' ');
    return extracted.trim();
  } catch {
    return '';
  }
};

const readBlobAsLatin1 = (file: File): Promise<string> => {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const normalizeDate = (raw: string): string | undefined => {
  const parts = raw.split(/[/-]/).map((p) => p.trim());
  if (parts.length !== 3) return undefined;
  const [a, b, rawYear] = parts;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const mm = a.padStart(2, '0');
  const dd = b.padStart(2, '0');
  if (Number(mm) > 12 || Number(mm) < 1 || Number(dd) > 31 || Number(dd) < 1) return undefined;
  return `${year}-${mm}-${dd}`;
};
