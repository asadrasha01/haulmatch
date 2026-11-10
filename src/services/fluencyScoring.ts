import type { InterviewQuestion } from '../types';

export interface FluencyScoreResult {
  score: number;
  summary: string;
}

// Computes an interview fluency and completeness score from captured speech
// transcripts, recognizer confidence, and lexical diversity.
export const scoreFluencyFromAnswers = (
  answers: Record<number, { text: string; confidence: number }>,
  questions: InterviewQuestion[],
  speechRecognitionSupported: boolean
): FluencyScoreResult => {
  const collected = questions.map((q) => answers[q.id]?.text?.trim() || '');
  const totalWords = collected.reduce((sum, text) => sum + (text ? text.split(/\s+/).length : 0), 0);

  if (!speechRecognitionSupported && totalWords === 0) {
    return {
      score: 70,
      summary:
        'Speech-to-text is not supported in this browser, so fluency could not be scored from the audio. ' +
        'Score reflects interview completion only — use Chrome or Edge for full automated scoring.'
    };
  }

  if (totalWords === 0) {
    return {
      score: 20,
      summary:
        'No speech was detected during the recorded answers. Fluency and experience could not be verified from ' +
        'this interview — please re-record with the microphone enabled and speak clearly.'
    };
  }

  const confidences = questions.map((q) => answers[q.id]?.confidence || 0).filter((c) => c > 0);
  const avgConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : speechRecognitionSupported
    ? 0.5
    : 0.85;

  const allWords = collected.flatMap((text) => text.toLowerCase().split(/\s+/).filter(Boolean));
  const uniqueWords = new Set(allWords);
  const lexicalDiversity = allWords.length ? uniqueWords.size / allWords.length : 0;

  // Expect roughly 25-40 substantive words per answer for a well-answered
  // 90-second question; scale word-count credit against that baseline.
  const expectedWords = questions.length * 30;
  const completenessRatio = Math.min(1, totalWords / expectedWords);

  const rawScore =
    avgConfidence * 55 + // up to 55 pts: recognizer's confidence these were clear English words
    completenessRatio * 30 + // up to 30 pts: gave substantive, complete answers
    lexicalDiversity * 15; // up to 15 pts: varied vocabulary rather than repeating a few words

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  const summary =
    totalWords < expectedWords * 0.4
      ? `Answers were brief (${totalWords} words total across ${questions.length} questions) — consider ` +
        're-recording with more detail for a stronger profile score.'
      : `Automated screening based on ${totalWords} words of captured speech across ${questions.length} answers, ` +
        `with ${Math.round(avgConfidence * 100)}% average speech-recognition confidence.`;

  return { score, summary };
};
