import { describe, expect, it } from 'vitest';
import { scoreFluencyFromAnswers } from './fluencyScoring';
import type { InterviewQuestion } from '../types';

// A small, self-contained question set (independent of the production
// INTERVIEW_QUESTIONS data) so this test only exercises the scoring logic
// itself, not the content of the real interview.
const QUESTIONS: InterviewQuestion[] = [
  { id: 1, title: 'Q1', question: 'Question one?', promptGuidance: '', maxSeconds: 90 },
  { id: 2, title: 'Q2', question: 'Question two?', promptGuidance: '', maxSeconds: 90 }
];

describe('scoreFluencyFromAnswers', () => {
  it('returns a fixed completion-only score when speech recognition is unsupported', () => {
    const result = scoreFluencyFromAnswers({}, QUESTIONS, false);
    expect(result.score).toBe(70);
    expect(result.summary).toMatch(/not supported/i);
  });

  it('scores manual fallback transcripts in Firefox/Safari when speech recognition is unsupported', () => {
    const answers = {
      1: {
        text: 'I have driven Class A commercial trucks for seven years across regional and interstate lanes safely.',
        confidence: 0.85
      },
      2: {
        text: 'I always perform complete pre-trip brake and tire inspections and maintain clean ELD logs.',
        confidence: 0.85
      }
    };
    const result = scoreFluencyFromAnswers(answers, QUESTIONS, false);
    expect(result.score).toBeGreaterThan(70);
    expect(result.summary).toMatch(/words of captured speech/i);
  });

  it('returns a low score when speech recognition is supported but no speech was captured', () => {
    const answers = {
      1: { text: '', confidence: 0 },
      2: { text: '   ', confidence: 0 }
    };
    const result = scoreFluencyFromAnswers(answers, QUESTIONS, true);
    expect(result.score).toBe(20);
    expect(result.summary).toMatch(/no speech was detected/i);
  });

  it('scores a complete, confident, varied-vocabulary answer set highly', () => {
    const longAnswer =
      'I have six years of experience hauling refrigerated freight across the southwest region with a clean ' +
      'inspection record and strong hours of service compliance throughout every winter driving season.';
    const answers = {
      1: { text: longAnswer, confidence: 0.95 },
      2: { text: longAnswer, confidence: 0.92 }
    };
    const result = scoreFluencyFromAnswers(answers, QUESTIONS, true);
    expect(result.score).toBeGreaterThan(70);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.summary).toMatch(/words of captured speech/i);
  });

  it('flags brief answers in the summary and scores them lower than complete answers', () => {
    const briefAnswers = {
      1: { text: 'Yes okay fine', confidence: 0.8 },
      2: { text: 'Sure', confidence: 0.8 }
    };
    const briefResult = scoreFluencyFromAnswers(briefAnswers, QUESTIONS, true);
    expect(briefResult.summary).toMatch(/brief/i);

    const fullAnswers = {
      1: {
        text: 'I have six years of experience hauling refrigerated freight across the southwest region with great records.',
        confidence: 0.8
      },
      2: {
        text: 'I always complete thorough pre trip and post trip inspections and manage my electronic log carefully.',
        confidence: 0.8
      }
    };
    const fullResult = scoreFluencyFromAnswers(fullAnswers, QUESTIONS, true);

    expect(briefResult.score).toBeLessThan(fullResult.score);
  });

  it('never returns a score outside the 0-100 range', () => {
    const answers = {
      1: { text: 'word '.repeat(500), confidence: 1 },
      2: { text: 'word '.repeat(500), confidence: 1 }
    };
    const result = scoreFluencyFromAnswers(answers, QUESTIONS, true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
