import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadVideoToS3Presigned } from './s3Storage';

class MockXHR {
  static lastInstance: MockXHR | null = null;
  method = '';
  url = '';
  async = true;
  headers: Record<string, string> = {};
  status = 200;
  upload: { onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  sentBody: unknown = null;

  constructor() {
    MockXHR.lastInstance = this;
  }

  open(method: string, url: string, async = true) {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  send(body: unknown) {
    this.sentBody = body;
  }
}

describe('uploadVideoToS3Presigned', () => {
  beforeEach(() => {
    MockXHR.lastInstance = null;
    vi.stubGlobal('XMLHttpRequest', MockXHR);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PUTs the video/webm blob to the presigned URL and reports upload progress', async () => {
    const onProgress = vi.fn();
    const blob = new Blob(['video-bytes'], { type: 'video/webm' });

    const promise = uploadVideoToS3Presigned(
      'https://r2.example.com/bucket/clip.webm?sig=123',
      blob,
      onProgress
    );

    const xhr = MockXHR.lastInstance!;
    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toBe('https://r2.example.com/bucket/clip.webm?sig=123');
    expect(xhr.headers['Content-Type']).toBe('video/webm');

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    expect(onProgress).toHaveBeenCalledWith(50);

    xhr.status = 200;
    xhr.onload?.();

    await expect(promise).resolves.toBe(true);
  });

  it('rejects when S3/R2 responds with a non-2xx HTTP status', async () => {
    const blob = new Blob(['video-bytes'], { type: 'video/webm' });
    const promise = uploadVideoToS3Presigned('https://r2.example.com/bucket/clip.webm', blob);

    const xhr = MockXHR.lastInstance!;
    xhr.status = 403;
    xhr.onload?.();

    await expect(promise).rejects.toThrow(/HTTP status 403/);
  });

  it('rejects on network error', async () => {
    const blob = new Blob(['video-bytes'], { type: 'video/webm' });
    const promise = uploadVideoToS3Presigned('https://r2.example.com/bucket/clip.webm', blob);

    const xhr = MockXHR.lastInstance!;
    xhr.onerror?.();

    await expect(promise).rejects.toThrow(/Network error during S3\/R2 video upload/);
  });
});

