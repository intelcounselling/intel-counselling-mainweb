// INTELL Student Success Assessment™ — checks the seeded questions AND the scoring
// logic against the published specification.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculateScore, evaluateCounselling, hasValidityWarning } = require('../src/mindbridge/utils/scoringLogic.js');
const { tests } = require('../prisma/seedTests.cjs');

const domain = (category) => tests.find((t) => t.category === category);
const num = (q) => Number(q.id.slice(1)); // 'Q7' → 7
const run = (category, answerFor) => {
  const t = domain(category);
  const answers = Object.fromEntries(t.questions.map((q) => [q.id, answerFor(num(q), q)]));
  return calculateScore(answers, t.questions, t.thresholds, category);
};

// ── Questionnaire definitions match the spec ─────────────────────

const REVERSE = {
  StudyBehaviour: [6, 7],
  EmotionalWellness: [2, 4, 6, 8],
  InternetUsage: [4, 5, 6, 7, 8, 11],
  PersonalityDimensions: [6, 8],
  LearningPattern: [],
};

test('every domain has 12 questions and the specified reverse-scored items', () => {
  for (const [category, reversed] of Object.entries(REVERSE)) {
    const t = domain(category);
    assert.equal(t.questions.length, 12, `${category} has 12 questions`);
    assert.deepEqual(t.questions.filter((q) => q.reverse).map(num), reversed, `${category} reverse items`);
    assert.equal(t.questions[0].options.length, 5);
  }
});

test('learning-pattern dimensions: V = Q1,4,7,10 · A = Q2,5,8,11 · K = Q3,6,9,12', () => {
  const dims = { Visual: [1, 4, 7, 10], Auditory: [2, 5, 8, 11], Kinesthetic: [3, 6, 9, 12] };
  for (const [dim, items] of Object.entries(dims)) {
    assert.deepEqual(domain('LearningPattern').questions.filter((q) => q.dimension === dim).map(num), items);
  }
});

// ── Reverse scoring (1→5, 2→4, 3→3, 4→2, 5→1) ────────────────────

test('reverse-scored items flip; normal items do not', () => {
  // Study Behaviour: 10 normal + 2 reversed (Q6, Q7)
  assert.equal(run('StudyBehaviour', () => 5).score, 10 * 5 + 2 * 1);
  assert.equal(run('StudyBehaviour', () => 1).score, 10 * 1 + 2 * 5);
  assert.equal(run('StudyBehaviour', () => 3).score, 36);
  // Internet Usage: 6 normal + 6 reversed
  assert.equal(run('InternetUsage', () => 5).score, 6 * 5 + 6 * 1);
  // Emotional Wellness: 8 normal + 4 reversed; "ideal" answers = agree normal / disagree reverse
  assert.equal(run('EmotionalWellness', (n, q) => (q.reverse ? 1 : 5)).score, 60);
  assert.equal(run('PersonalityDimensions', (n, q) => (q.reverse ? 5 : 1)).score, 12);
});

// ── Interpretation bands ─────────────────────────────────────────

test('score bands: 48–60 / 36–47 / 24–35 / 12–23', () => {
  const ideal = (q) => (q.reverse ? 1 : 5); // 60
  assert.equal(run('EmotionalWellness', (n, q) => ideal(q)).severity, 'Emotionally Stable');

  const mild = run('EmotionalWellness', () => 3); // 36
  assert.equal(mild.severity, 'Mild Emotional Stress');
  assert.equal(mild.color, 'Yellow');
  assert.equal(mild.isLow, false);

  const lowish = run('EmotionalWellness', (n, q) => (q.reverse ? 3 : 2)); // 8×2 + 4×3 = 28
  assert.equal(lowish.score, 28);
  assert.equal(lowish.severity, 'Moderate Emotional Stress');
  assert.equal(lowish.color, 'Orange');
  assert.equal(lowish.isLow, true);

  const worst = run('EmotionalWellness', (n, q) => (q.reverse ? 5 : 1)); // 12
  assert.equal(worst.severity, 'High Emotional Distress');
  assert.equal(worst.color, 'Red');

  assert.equal(run('InternetUsage', (n, q) => (q.reverse ? 1 : 5)).severity, 'Healthy Digital Balance');
  assert.equal(run('PersonalityDimensions', (n, q) => (q.reverse ? 1 : 5)).severity, 'Strong Emotional Maturity');
  assert.equal(run('StudyBehaviour', (n, q) => (q.reverse ? 5 : 1)).severity, 'Serious Difficulty in Study Behaviour');
});

// ── Learning pattern ─────────────────────────────────────────────

const lp = (v, a, k) =>
  run('LearningPattern', (n, q) => ({ Visual: v, Auditory: a, Kinesthetic: k }[q.dimension] / 4));

test('learning style: single / dual / triple', () => {
  const single = lp(20, 12, 12);
  assert.deepEqual(single.subScores, { Visual: 20, Auditory: 12, Kinesthetic: 12 });
  assert.equal(single.learningStyle.label, 'Single Dominant Learning Style');
  assert.deepEqual(single.learningStyle.styles, ['Visual']);

  const dual = lp(16, 15, 8); // difference 1 → dual; third far below
  assert.equal(dual.learningStyle.label, 'Dual Dominant Learning Style');
  assert.deepEqual(dual.learningStyle.styles, ['Visual', 'Auditory']);

  const edge = lp(16, 13, 8); // difference exactly 3 → still single
  assert.equal(edge.learningStyle.type, 'single');

  const triple = lp(12, 12, 12);
  assert.equal(triple.learningStyle.label, 'Triple Balanced Learning Style');
});

test('learning pattern preference bands per dimension: 16–20 / 11–15 / 4–10', () => {
  const r = lp(16, 11, 10);
  assert.deepEqual(r.preferences, { Visual: 'Strong Preference', Auditory: 'Moderate Preference', Kinesthetic: 'Low Preference' });
});

test('learning pattern is descriptive: never flagged', () => {
  const r = lp(4, 4, 4);
  assert.equal(r.isLow, false);
  assert.equal(r.requiresCounselling, false);
});

// ── Validity check ───────────────────────────────────────────────

test('validity: 80% or more answers marked 5 flags self-presentation bias', () => {
  const ids = (n, fives) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, i < fives ? 5 : 3]));
  assert.equal(hasValidityWarning(ids(12, 10), 'StudyBehaviour'), true); // 83%
  assert.equal(hasValidityWarning(ids(12, 9), 'StudyBehaviour'), false); // 75%
  assert.equal(hasValidityWarning(ids(10, 8), 'LearningPattern'), true); // exactly 80%
  // clinical screenings use a 0–3 scale — never applicable
  assert.equal(hasValidityWarning(ids(9, 9), 'Depression'), false);
  // reported on the result, severity text untouched
  const r = run('StudyBehaviour', () => 5);
  assert.equal(r.validityWarning, true);
  assert.ok(!/validity/i.test(r.severity));
});

// ── Counselling recommendation ───────────────────────────────────

test('counselling: Emotional Wellness < 36, Internet Usage < 36, or any two domains < 36', () => {
  assert.equal(evaluateCounselling({ EmotionalWellness: 35 }).requires, true);
  assert.equal(evaluateCounselling({ InternetUsage: 20 }).requires, true);
  assert.equal(evaluateCounselling({ EmotionalWellness: 36, InternetUsage: 36 }).requires, false);

  // one of the other two alone → no recommendation
  assert.equal(evaluateCounselling({ StudyBehaviour: 30, EmotionalWellness: 50, InternetUsage: 50 }).requires, false);
  assert.equal(evaluateCounselling({ PersonalityDimensions: 30 }).requires, false);
  // any two → recommendation
  const two = evaluateCounselling({ StudyBehaviour: 30, PersonalityDimensions: 34, EmotionalWellness: 50, InternetUsage: 50 });
  assert.equal(two.requires, true);
  assert.deepEqual(two.lowDomains.sort(), ['PersonalityDimensions', 'StudyBehaviour']);

  // domains not yet taken don't count
  assert.equal(evaluateCounselling({}).requires, false);
});
