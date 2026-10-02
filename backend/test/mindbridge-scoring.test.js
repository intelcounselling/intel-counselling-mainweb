// Mindbridge risk scoring — who gets flagged (and alerted) after a test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculateScore } = require('../src/mindbridge/utils/scoringLogic.js');

const opts03 = [0, 1, 2, 3].map((value) => ({ value }));
const PHQ9_THRESHOLDS = [
  { min: 0, max: 4, isLow: false, severity: 'minimal' },
  { min: 5, max: 9, isLow: false, severity: 'mild' },
  { min: 10, max: 14, isLow: true, severity: 'moderate' },
  { min: 15, max: 19, isLow: true, severity: 'moderately severe' },
  { min: 20, max: 27, isLow: true, severity: 'severe' },
];
const phq9Questions = Array.from({ length: 9 }, (_, i) => ({
  id: String(i + 1),
  text: i === 8 ? 'Thoughts that you would be better off dead, or thoughts of hurting yourself in some way' : `Item ${i + 1}`,
  options: opts03,
}));
const answersPhq = (vals) => Object.fromEntries(vals.map((v, i) => [String(i + 1), v]));

test('clinical screenings: a healthy score is not flagged', () => {
  const r = calculateScore(answersPhq([0, 0, 0, 0, 0, 0, 0, 0, 0]), phq9Questions, PHQ9_THRESHOLDS, 'Depression');
  assert.equal(r.isLow, false, 'PHQ-9 score 0 must not raise a risk alert');

  const gad = calculateScore({ 1: 0, 2: 0 }, [{ id: 1, options: opts03 }, { id: 2, options: opts03 }],
    [{ min: 0, max: 4, isLow: false, severity: 'minimal' }], 'Anxiety');
  assert.equal(gad.isLow, false, 'GAD-7 minimal must not raise a risk alert');
});

test('clinical screenings: threshold ranges still flag real risk', () => {
  const r = calculateScore(answersPhq([2, 2, 2, 2, 2, 2, 0, 0, 0]), phq9Questions, PHQ9_THRESHOLDS, 'Depression');
  assert.equal(r.score, 12);
  assert.equal(r.isLow, true);
});

test('PHQ-9 self-harm item always reaches the counsellor', () => {
  const r = calculateScore(answersPhq([0, 0, 0, 0, 0, 0, 0, 0, 1]), phq9Questions, PHQ9_THRESHOLDS, 'Depression');
  assert.equal(r.score, 1, 'total is minimal…');
  assert.equal(r.isLow, true, '…but item 9 above zero must flag');
  assert.equal(r.requiresCounselling, true);
});

test('INTELL domains keep the below-36 rule', () => {
  const qs = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, options: [1, 2, 3, 4, 5].map((value) => ({ value })) }));
  const low = Object.fromEntries(qs.map((q) => [q.id, 2])); // 24 / 60
  const r = calculateScore(low, qs, [], 'EmotionalWellness');
  assert.equal(r.isLow, true);
  assert.equal(r.requiresCounselling, true);
});
