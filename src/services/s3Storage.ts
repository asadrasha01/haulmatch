// ==============================================================================
// HaulMatch AI — Cloudflare R2 / AWS S3 Direct Upload Helper
// ==============================================================================
// Cloudflare R2 is 100% S3-compatible and has $0 egress fees, making it the
// most cost-effective solution for video interview storage.

export interface PresignedUploadConfig {
  endpoint?: string;
  bucket: string;
  key: string;
  uploadUrl: string;
}

/**
 * Uploads a recorded WebRTC video blob directly to Cloudflare R2 or AWS S3
 * via a pre-signed PUT URL.
 */
export const uploadVideoToS3Presigned = async (
  uploadUrl: string,
  videoBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', 'video/webm');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        reject(new Error(`S3/R2 upload failed with HTTP status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during S3/R2 video upload'));
    };

    xhr.send(videoBlob);
  });
};
