import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncVideoRecorder } from './AsyncVideoRecorder';

class MockSpeechRecognition {
  static lastInstance: MockSpeechRecognition | null = null;
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor() {
    MockSpeechRecognition.lastInstance = this;
  }

  start() {}
  stop() {}

  emitTranscript(text: string, confidence = 0.92) {
    this.onresult?.({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: text, confidence }], { isFinal: true }),
      ],
    });
  }
}

describe('AsyncVideoRecorder — 3-question interview & real fluency scoring', () => {
  beforeEach(() => {
    MockSpeechRecognition.lastInstance = null;
    (window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
  });

  it('walks through all 3 interview questions, captures speech transcripts, and submits a real fluency score', async () => {
    const user = userEvent.setup();
    const onInterviewComplete = vi.fn();

    render(<AsyncVideoRecorder onInterviewComplete={onInterviewComplete} />);

    // 1. Enable Camera & Start Studio (falls back to interactive studio mode in jsdom)
    await user.click(screen.getByRole('button', { name: /enable camera & start studio/i }));
    expect(await screen.findByText(/question 1 of 3/i)).toBeInTheDocument();

    const sampleAnswers = [
      'I have been driving Class A tractor trailers for eight years across regional and OTR lanes with zero preventable accidents.',
      'During my pre-trip inspection I check brake air pressure, tires, lights, fifth wheel locking jaws, and fluid levels before dispatch.',
      'If I encounter severe winter weather I reduce speed, increase following distance, and pull into a safe truck stop if visibility drops.',
    ];

    for (let q = 0; q < 3; q++) {
      await user.click(screen.getByRole('button', { name: /start recording answer/i }));
      MockSpeechRecognition.lastInstance?.emitTranscript(sampleAnswers[q], 0.94);
      await user.click(screen.getByRole('button', { name: /stop & save answer/i }));

      // Wait for the 300ms transcript flush inside stopRecording
      await new Promise((r) => setTimeout(r, 350));

      if (q < 2) {
        await user.click(screen.getByRole('button', { name: /next question/i }));
      } else {
        await user.click(
          screen.getByRole('button', { name: /submit interview & claim \$1,500 bonus badge/i })
        );
      }
    }

    await waitFor(
      () => {
        expect(onInterviewComplete).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );

    const payload = onInterviewComplete.mock.calls[0][0];
    expect(payload.aiScore).toBeGreaterThanOrEqual(75);
    expect(payload.transcripts).toHaveLength(3);
    expect(payload.transcripts[0].answer).toContain('Class A tractor trailers');
    expect(payload.transcripts[1].answer).toContain('pre-trip inspection');
    expect(payload.transcripts[2].answer).toContain('severe winter weather');
  });

  it('shows the Firefox/Safari manual transcript fallback when SpeechRecognition is unavailable', async () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    const user = userEvent.setup();
    const onInterviewComplete = vi.fn();

    render(<AsyncVideoRecorder onInterviewComplete={onInterviewComplete} />);

    await user.click(screen.getByRole('button', { name: /enable camera & start studio/i }));
    await user.click(screen.getByRole('button', { name: /start recording answer/i }));
    await user.click(screen.getByRole('button', { name: /stop & save answer/i }));

    const fallbackInput = await screen.findByPlaceholderText(/type a brief summary of your spoken response/i);
    expect(fallbackInput).toBeInTheDocument();
    await user.type(fallbackInput, 'Eight years driving Class A regional reefer freight.');
    expect(fallbackInput).toHaveValue('Eight years driving Class A regional reefer freight.');
  });
});

