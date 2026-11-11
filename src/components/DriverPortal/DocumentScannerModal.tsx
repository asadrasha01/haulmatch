import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RotateCcw, RefreshCw, Zap, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface DocumentScannerModalProps {
  isOpen: boolean;
  targetDoc: 'cdl' | 'medCard';
  onCapture: (file: File) => void;
  onClose: () => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const AMBER = '#f0a23b';
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace";
const DISPLAY = "'Barlow Condensed', sans-serif";

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  targetDoc,
  onCapture,
  onClose
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const docTitle = targetDoc === 'cdl' ? 'Commercial Driver License (CDL)' : 'DOT Medical Card (MCSA-5876)';
  const docCode = targetDoc === 'cdl' ? 'DOC-01 // STATE CDL SCAN' : 'DOC-02 // MCSA-5876 MEDICAL SCAN';

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleClose = useCallback(() => {
    stopStream();
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
    setTorchOn(false);
    setCameraError(null);
    onClose();
  }, [stopStream, onClose]);

  useEffect(() => {
    let active = true;

    const initCamera = async () => {
      if (!isOpen) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API not available on this device');
        return;
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (!active) {
          newStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(newStream);
        const track = newStream.getVideoTracks()[0];
        const capabilities = (track?.getCapabilities?.() as any) || {};
        setHasTorch(Boolean(capabilities?.torch));
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        if (!active) return;
        console.warn('Camera access issue:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Please allow camera access in your browser settings or select an existing document file.'
            : 'Unable to access camera directly. You can use the high-resolution test scan generator or upload an existing file.'
        );
      }
    };

    void initCamera();

    return () => {
      active = false;
      stopStream();
    };
  }, [isOpen, facingMode, stopStream]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const next = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }]
        });
        setTorchOn(next);
      } catch (err) {
        console.warn('Failed to toggle torch:', err);
      }
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const url = URL.createObjectURL(blob);
          setCapturedPreviewUrl(url);
          // Pause video while reviewing
          video.pause();
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
    if (videoRef.current && stream) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleConfirmScan = () => {
    if (!capturedBlob) return;
    setIsProcessing(true);
    const filename = `${targetDoc}-scan-${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: 'image/jpeg' });
    onCapture(file);
    handleClose();
  };

  // Simulated instant scan for test environments or permission-denied cases
  const handleSimulatedScan = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw simulated CDL or Medical Card document
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 760);

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, 1200, 130);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(targetDoc === 'cdl' ? 'COMMERCIAL DRIVER LICENSE' : 'MEDICAL EXAMINER CERTIFICATE', 50, 80);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px monospace';

      if (targetDoc === 'cdl') {
        ctx.fillText('STATE: TEXAS (TX)', 50, 220);
        ctx.fillText('CLASS: CLASS A - COMMERCIAL', 50, 280);
        ctx.fillText('LIC NO: TX-83921044', 50, 340);
        ctx.fillText('EXPIRATION: 10/15/2028', 50, 400);
        ctx.fillText('ENDORSEMENTS: H, N, T, X', 50, 460);
      } else {
        ctx.fillText('NATIONAL REGISTRY OF CERTIFIED MEDICAL EXAMINERS', 50, 220);
        ctx.fillText('FORM: MCSA-5876 (FMCSA PART 391)', 50, 280);
        ctx.fillText('EXAMINER CERT: NRCME-8492019', 50, 340);
        ctx.fillText('EXPIRATION DATE: 08/20/2027', 50, 400);
        ctx.fillText('STATUS: FULLY QUALIFIED 24 MONTHS', 50, 460);
      }
    }

    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedBlob(blob);
            const url = URL.createObjectURL(blob);
            setCapturedPreviewUrl(url);
          }
        },
        'image/jpeg',
        0.95
      );
    } else {
      const fallbackBlob = new Blob(['simulated-scan'], { type: 'image/jpeg' });
      setCapturedBlob(fallbackBlob);
      setCapturedPreviewUrl(URL.createObjectURL(fallbackBlob));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(10, 12, 14, 0.94)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Live Document Scanner"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: DEEP,
          border: `1px solid rgba(240, 162, 59, 0.4)`,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.85)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: 'rgba(240, 162, 59, 0.15)',
                border: `1px solid ${AMBER}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: AMBER
              }}
            >
              <Camera size={16} />
            </span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: AMBER, textTransform: 'uppercase' }}>
                {docCode}
              </div>
              <h3 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {docTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close Scanner"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div
          style={{
            position: 'relative',
            background: '#000',
            aspectRatio: '16 / 10',
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {capturedPreviewUrl ? (
            <img
              src={capturedPreviewUrl}
              alt="Document Scan Preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Document Targeting Bounding Box */}
              <div
                style={{
                  position: 'absolute',
                  inset: '12% 10%',
                  border: `2px dashed ${AMBER}`,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 8
                }}
              >
                {/* 4 Corner Targeting Marks */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: 18, height: 18, borderTop: `4px solid ${AMBER}`, borderLeft: `4px solid ${AMBER}` }} />
                  <div style={{ width: 18, height: 18, borderTop: `4px solid ${AMBER}`, borderRight: `4px solid ${AMBER}` }} />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      background: 'rgba(0,0,0,0.7)',
                      display: 'inline-block',
                      padding: '4px 10px',
                      color: AMBER,
                      textTransform: 'uppercase',
                      border: '1px solid rgba(240, 162, 59, 0.4)'
                    }}
                  >
                    Align {targetDoc === 'cdl' ? 'CDL Card' : 'Medical Cert'} Inside Frame · Avoid Glare
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: 18, height: 18, borderBottom: `4px solid ${AMBER}`, borderLeft: `4px solid ${AMBER}` }} />
                  <div style={{ width: 18, height: 18, borderBottom: `4px solid ${AMBER}`, borderRight: `4px solid ${AMBER}` }} />
                </div>
              </div>
            </>
          )}

          {/* Camera Error / Fallback Box */}
          {cameraError && !capturedPreviewUrl && (
            <div
              style={{
                position: 'absolute',
                inset: 16,
                background: 'rgba(18, 19, 21, 0.94)',
                border: '1px solid rgba(240, 162, 59, 0.4)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 14,
                zIndex: 20
              }}
            >
              <AlertCircle size={32} color={AMBER} />
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', maxWidth: 440, lineHeight: 1.5, margin: 0 }}>
                {cameraError}
              </p>
              <button
                type="button"
                onClick={handleSimulatedScan}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '10px 18px',
                  background: AMBER,
                  color: INK,
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Sparkles size={14} /> Generate Instant Test Scan →
              </button>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Scanner Controls Bar */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.5)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          {capturedPreviewUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '11px 18px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <RotateCcw size={14} /> Retake Scan
              </button>

              <button
                type="button"
                onClick={handleConfirmScan}
                disabled={isProcessing}
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '11px 22px',
                  background: AMBER,
                  border: 'none',
                  color: INK,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <ShieldCheck size={16} />
                <span>{isProcessing ? 'Processing OCR...' : 'Confirm Scan & Run OCR →'}</span>
              </button>
            </>
          ) : (
            <>
              {/* Camera Utilities (Switch Camera & Torch) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={toggleCamera}
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Switch Front / Rear Camera"
                >
                  <RefreshCw size={13} />
                  <span>{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>

                {hasTorch && (
                  <button
                    type="button"
                    onClick={() => void toggleTorch()}
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '8px 12px',
                      background: torchOn ? AMBER : 'rgba(255,255,255,0.08)',
                      border: torchOn ? `1px solid ${AMBER}` : '1px solid rgba(255,255,255,0.2)',
                      color: torchOn ? INK : '#fff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Toggle Flash / Torch"
                  >
                    <Zap size={13} />
                    <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                  </button>
                )}
              </div>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={handleCaptureFrame}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  background: AMBER,
                  color: INK,
                  fontFamily: MONO,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 0,
                  boxShadow: '0 0 16px rgba(240, 162, 59, 0.4)'
                }}
              >
                <Camera size={18} />
                <span>Snap Document</span>
              </button>

              {/* Instant Test Scan Shortcut (For testing / sandbox) */}
              <button
                type="button"
                onClick={handleSimulatedScan}
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: '1px dashed rgba(240, 162, 59, 0.4)',
                  color: AMBER,
                  cursor: 'pointer'
                }}
                title="Generate an instant test scan without using the camera"
              >
                Test Scan
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
