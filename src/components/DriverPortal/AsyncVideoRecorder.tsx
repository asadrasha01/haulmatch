import React, { useState, useRef, useEffect } from 'react';
import { Video, Mic, CheckCircle2, RotateCcw, Play, Square, Award, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '../../data/mockDrivers';
import { scoreFluencyFromAnswers } from '../../services/fluencyScoring';

interface AsyncVideoRecorderProps {
  onInterviewComplete: (videoData: {
    duration: string;
    blobUrl?: string;
    videoBlob?: Blob;
    aiScore: number;
    aiScoreSummary: string;
    transcripts: { questionNumber: number; question: string; answer: string; timestamp: string }[];
  }) => void;
}

// Minimal ambient typing for the Web Speech API (not part of the default TS
// DOM lib). Supported in Chrome/Edge via the webkit-prefixed constructor;
// not supported in Firefox/Safari, which is handled as a graceful fallback
// in fluencyScoring.ts rather than crashing or faking a transcript.
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
}

const getSpeechRecognitionCtor = (): (new () => SpeechRecognitionLike) | null => {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export const AsyncVideoRecorder: React.FC<AsyncVideoRecorderProps> = ({ onInterviewComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasStartedCamera, setHasStartedCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [_recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Real per-question speech capture: the actual recognized text + the
  // recognizer's own confidence, used to compute a genuine fluency score
  // instead of a hardcoded constant. See fluencyScoring.ts.
  const [answers, setAnswers] = useState<Record<number, { text: string; confidence: number }>>({});
  const [speechSupported] = useState<boolean>(!!getSpeechRecognitionCtor());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const liveTranscriptRef = useRef<string>('');
  const confidenceSamplesRef = useRef<number[]>([]);
  const answerDurationsRef = useRef<Record<number, number>>({});
  // Holds the real recorded Blob for whichever question was most recently
  // (re-)recorded, so the final question's Blob can be handed up to the
  // parent on submission (separate from videoPreviewUrl, which is only a
  // local, non-portable `blob:` object URL).
  const lastRecordedBlobRef = useRef<Blob | null>(null);

  const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];

  // Request camera and microphone
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasStartedCamera(true);
      } else {
        throw new Error('MediaDevices API not supported in this browser');
      }
    } catch (err: any) {
      console.warn('Camera access fallback enabled:', err.message);
      setCameraError('Camera access not detected or denied. Using interactive simulated recording studio so you can test the full experience.');
      setHasStartedCamera(true);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up camera on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setTimerSeconds(0);
    setRecordedChunks([]);
    setVideoPreviewUrl(null);
    lastRecordedBlobRef.current = null;
    liveTranscriptRef.current = '';
    confidenceSamplesRef.current = [];

    // If real media stream is available
    if (mediaStreamRef.current && window.MediaRecorder) {
      try {
        const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: 'video/webm' });
        mediaRecorderRef.current = recorder;
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          lastRecordedBlobRef.current = blob;
          setVideoPreviewUrl(url);
          setRecordedChunks(chunks);
        };

        recorder.start(500);
      } catch {
        console.log('Real MediaRecorder failed, falling back to simulated recording');
      }
    }

    // Real speech-to-text capture for this answer (Chrome/Edge). Builds up
    // liveTranscriptRef + confidence samples as the driver speaks, snapshot
    // into `answers` state once recording stops below.
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript + ' ';
              confidenceSamplesRef.current.push(result[0].confidence ?? 0.75);
            }
          }
          if (finalText) {
            liveTranscriptRef.current += finalText;
          }
        };
        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
        };
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition failed to start:', e);
        recognitionRef.current = null;
      }
    }

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev >= currentQuestion.maxSeconds - 1) {
          stopRecording();
          return currentQuestion.maxSeconds;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback preview
      setVideoPreviewUrl('simulated-interview-sample');
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (!completedQuestions.includes(currentQuestion.id)) {
      setCompletedQuestions([...completedQuestions, currentQuestion.id]);
    }

    // Snapshot this question's real transcript + confidence into `answers`.
    // Delayed slightly since the recognizer can emit one trailing onresult
    // event just after stop() is called, and we want to capture it.
    const questionId = currentQuestion.id;
    const durationAtStop = timerSeconds;
    setTimeout(() => {
      const avgConfidence = confidenceSamplesRef.current.length
        ? confidenceSamplesRef.current.reduce((a, b) => a + b, 0) / confidenceSamplesRef.current.length
        : 0;
      answerDurationsRef.current[questionId] = durationAtStop;
      const capturedText = liveTranscriptRef.current.trim();
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          text: capturedText || prev[questionId]?.text || '',
          confidence: capturedText ? avgConfidence : prev[questionId]?.confidence || 0
        }
      }));
      recognitionRef.current = null;
    }, 300);
  };

  const handleNextOrFinish = () => {
    if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setVideoPreviewUrl(null);
      setTimerSeconds(0);
    } else {
      // Final submission: score the real captured speech. A short delay
      // lets the last question's 300ms transcript-flush (in stopRecording)
      // land before we read from `answers`, and gives the "AI Analyzing..."
      // button state a moment to show for a real screening step rather than
      // an instant no-op.
      setIsProcessingAI(true);
      setTimeout(() => {
        const { score, summary } = scoreFluencyFromAnswers(answers, INTERVIEW_QUESTIONS, speechSupported);

        const transcripts = INTERVIEW_QUESTIONS.map((q, idx) => ({
          questionNumber: idx + 1,
          question: q.question,
          answer:
            answers[q.id]?.text ||
            (speechSupported
              ? '(No speech detected for this answer.)'
              : "(Speech-to-text isn't supported in this browser — no transcript captured.)"),
          timestamp: formatTime(answerDurationsRef.current[q.id] || 0)
        }));

        const totalSeconds = Object.values(answerDurationsRef.current).reduce((sum, s) => sum + s, 0);

        setIsProcessingAI(false);
        onInterviewComplete({
          duration: formatTime(totalSeconds),
          blobUrl: videoPreviewUrl || undefined,
          videoBlob: lastRecordedBlobRef.current || undefined,
          aiScore: score,
          aiScoreSummary: summary,
          transcripts
        });
      }, 600);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-blue">Automated Screening</span>
            <span className="badge badge-gold">Bonus Step 3 of 3</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Async 2-Minute Video Interview</h2>
          <p style={{ fontSize: '0.88rem' }}>
            Record brief answers to 3 questions. Carriers review this to verify DOT English fluency and driving experience.
          </p>
        </div>

        {/* Progress pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {INTERVIEW_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: completedQuestions.includes(q.id)
                  ? 'rgba(16, 185, 129, 0.2)'
                  : idx === currentQuestionIndex
                  ? 'rgba(59, 130, 246, 0.25)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: completedQuestions.includes(q.id)
                  ? '#34d399'
                  : idx === currentQuestionIndex
                  ? '#60a5fa'
                  : 'var(--text-muted)',
                border: idx === currentQuestionIndex ? '1px solid #3b82f6' : '1px solid var(--border-subtle)'
              }}
            >
              {completedQuestions.includes(q.id) ? '✓' : `Q${idx + 1}`}
            </div>
          ))}
        </div>
      </div>

      {/* Main Recording Studio Viewport */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#030712',
          border: '1px solid var(--border-card)',
          aspectRatio: '16/10',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isRecording ? '0 0 30px rgba(239, 68, 68, 0.3)' : '0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        {!hasStartedCamera ? (
          <div style={{ textAlign: 'center', padding: '30px', maxWidth: '440px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: 'var(--primary-light)'
              }}
            >
              <Video size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Ready for Your Video Introduction?</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '20px', color: 'var(--text-secondary)' }}>
              No human interviewer is watching live. You have 90 seconds per answer and can re-record if you make a mistake.
            </p>
            <button onClick={startCamera} className="btn-primary" style={{ width: '100%' }}>
              <Video size={18} /> Enable Camera & Start Studio
            </button>
          </div>
        ) : (
          <>
            {/* Live Video Feed or Fallback */}
            {videoPreviewUrl && videoPreviewUrl !== 'simulated-interview-sample' ? (
              <video
                src={videoPreviewUrl}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraError ? 'none' : 'block'
                }}
              />
            )}

            {/* Simulated Driver Video Overlay if Camera is simulated */}
            {cameraError && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, #091326 0%, #030712 100%)',
                  padding: '24px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    position: 'relative'
                  }}
                >
                  <Video size={36} color="#60a5fa" />
                  {isRecording && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 10px #ef4444'
                      }}
                      className="animate-recording"
                    />
                  )}
                </div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Interactive Recording Studio Mode</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  {isRecording
                    ? 'Capturing audio and speech metrics... speak clearly into your microphone.'
                    : 'Click "Start Recording" below to answer the question prompt.'}
                </p>
                {cameraError && !isRecording && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '12px',
                      padding: '6px 12px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      color: '#fbbf24'
                    }}
                  >
                    <AlertCircle size={14} /> Note: Testing mode active (no physical webcam required).
                  </div>
                )}
              </div>
            )}

            {/* Top Bar inside Video Viewport */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '16px 20px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 2
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                    border: isRecording ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: isRecording ? '#fca5a5' : '#cbd5e1'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isRecording ? '#ef4444' : '#94a3b8'
                    }}
                    className={isRecording ? 'animate-recording' : ''}
                  />
                  {isRecording ? 'REC' : 'STANDBY'}
                </span>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#f8fafc' }}>
                  {formatTime(timerSeconds)} / {formatTime(currentQuestion.maxSeconds)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={16} color={isRecording ? '#10b981' : '#94a3b8'} />
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>HD Audio 48kHz</span>
              </div>
            </div>

            {/* Floating Teleprompter Question Banner */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                padding: '14px 18px',
                background: 'rgba(11, 17, 32, 0.88)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                zIndex: 2
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-light)', fontWeight: 700 }}>
                  Question {currentQuestion.id} of {INTERVIEW_QUESTIONS.length}: {currentQuestion.title}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max: {currentQuestion.maxSeconds}s</span>
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px', lineHeight: 1.35 }}>
                "{currentQuestion.question}"
              </p>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic' }}>
                {currentQuestion.promptGuidance}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Control Buttons Bar */}
      {hasStartedCamera && (
        <>
          {!speechSupported && !isRecording && videoPreviewUrl && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <label
                htmlFor={`manual-transcript-q${currentQuestion.id}`}
                style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                Live speech-to-text isn't available in this browser (Firefox/Safari). Optionally summarize what you said below so AI fluency scoring can evaluate your answer:
              </label>
              <textarea
                id={`manual-transcript-q${currentQuestion.id}`}
                rows={2}
                className="form-input"
                placeholder="Type a brief summary of your spoken response..."
                value={answers[currentQuestion.id]?.text || ''}
                onChange={(e) => {
                  const text = e.target.value;
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: { text, confidence: 0.85 }
                  }));
                }}
                style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
              />
            </div>
          )}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
          <div>
            {!isRecording && !videoPreviewUrl && (
              <button onClick={startRecording} className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
                <Play size={18} fill="currentColor" /> Start Recording Answer
              </button>
            )}

            {isRecording && (
              <button onClick={stopRecording} className="btn-danger" style={{ padding: '12px 28px', fontSize: '1rem' }}>
                <Square size={18} fill="currentColor" /> Stop & Save Answer
              </button>
            )}

            {!isRecording && videoPreviewUrl && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={startRecording} className="btn-secondary">
                  <RotateCcw size={16} /> Re-record Question {currentQuestion.id}
                </button>
                <button
                  onClick={handleNextOrFinish}
                  className={currentQuestionIndex === INTERVIEW_QUESTIONS.length - 1 ? 'btn-gold' : 'btn-primary'}
                  disabled={isProcessingAI}
                >
                  {isProcessingAI ? (
                    <>
                      <Sparkles size={18} className="animate-pulse-glow" /> AI Analyzing Response...
                    </>
                  ) : currentQuestionIndex === INTERVIEW_QUESTIONS.length - 1 ? (
                    <>
                      <CheckCircle2 size={18} /> Submit Interview & Claim $1,500 Bonus Badge
                    </>
                  ) : (
                    <>
                      Next Question <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={15} color="#f59e0b" />
            <span>AI English fluency & experience verification included</span>
          </div>
          </div>
        </>
      )}
    </div>
  );
};
