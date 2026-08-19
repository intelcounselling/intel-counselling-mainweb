// Server-side career assessment scoring.
//
// Mirrors the client-side computation in frontend/src/components/Assessment.tsx
// (processResults) exactly, so reports rendered by the server cannot be tampered
// with by editing the client-supplied result payload.
//
// The per-question category mapping lives in careerScoringData.json, which is
// GENERATED from frontend/src/components/TestQuestions.ts — see the header
// comment in that file for how to regenerate it when the questions change.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { categories: QUESTION_CATEGORIES } = JSON.parse(
  readFileSync(path.join(__dirname, 'careerScoringData.json'), 'utf8')
);

export const TOTAL_QUESTIONS = 200;

// Section boundaries (same as Assessment.tsx):
//   indices 0-39   -> Multiple Intelligence  (5 questions per category, max 20)
//   indices 40-139 -> Vocational Interests   (10 questions per category, max 40)
//   indices 140-199 -> Personality           (10 questions per category, max 40)
const MI_END = 40;
const INTERESTS_END = 140;

/**
 * Scores a raw answer string (200 digits, each 0-4) exactly like the frontend.
 *
 * @param {string} answerString - e.g. "40213...", one digit per question.
 * @returns {{ mi: Record<string, number>, interests: Record<string, number>,
 *             personality: Record<string, number>,
 *             summary: { topInterests: string[], topIntelligence: string[], profile: string } }}
 * @throws {Error} if the answer string is missing, the wrong length, or contains
 *                 characters outside 0-4.
 */
export function scoreCareerAnswers(answerString) {
  if (typeof answerString !== 'string' || answerString.length !== TOTAL_QUESTIONS) {
    throw new Error(`Invalid answers: expected a ${TOTAL_QUESTIONS}-character string`);
  }
  if (!/^[0-4]+$/.test(answerString)) {
    throw new Error('Invalid answers: every answer must be a digit from 0 to 4');
  }

  const answers = answerString.split('').map(Number);

  const miScores = {};
  const interestScores = {};
  const personalityScores = {};

  answers.forEach((val, idx) => {
    const category = QUESTION_CATEGORIES[idx];
    if (idx < MI_END) {
      miScores[category] = (miScores[category] || 0) + val;
    } else if (idx < INTERESTS_END) {
      interestScores[category] = (interestScores[category] || 0) + val;
    } else {
      personalityScores[category] = (personalityScores[category] || 0) + val;
    }
  });

  // Top interests / intelligence: sorted descending by score; ties keep first-seen
  // (question) order because Array.prototype.sort is stable — identical to the
  // frontend's Object.entries(...).sort((a, b) => b[1] - a[1]).
  const maxInterest = Math.max(...Object.values(interestScores));
  const topInterests = maxInterest > 0
    ? Object.entries(interestScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name)
    : ["No clear dominant preference"];

  const maxIntelligence = Math.max(...Object.values(miScores));
  const topIntelligence = maxIntelligence > 0
    ? Object.entries(miScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name)
    : ["No clear dominant preference"];

  return {
    mi: miScores,
    interests: interestScores,
    personality: personalityScores,
    summary: {
      topInterests,
      topIntelligence,
      profile: "Comprehensive Career Pioneer"
    }
  };
}
