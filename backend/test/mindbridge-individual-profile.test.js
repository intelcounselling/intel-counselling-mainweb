import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildProfile } = require('../src/mindbridge/services/individualProfile.js');
const { ALL_CATEGORIES, MODULES, accessPrice } = require('../src/mindbridge/utils/individualModules.js');

const phqQuestions = [{ id: 1, text: 'Little interest' }, { id: 9, text: 'Thoughts that you would be better off dead or of hurting yourself in some way' }];
const r = (category, score, extra = {}) => ({
  takenAt: new Date(), score, maxScore: 60, severity: 'x', answers: {}, test: { name: category, category, questions: [] }, ...extra,
});
const allGood = () => [
  r('LearningPattern', 36, { subScores: { Visual: 18, Auditory: 10, Kinesthetic: 8 }, severity: 'Single Dominant Learning Style: Visual' }),
  r('StudyBehaviour', 50), r('EmotionalWellness', 52), r('InternetUsage', 49), r('PersonalityDimensions', 55),
  r('Depression', 2), r('Anxiety', 1),
];
const swap = (cat, patch) => allGood().map((x) => (x.test.category === cat ? { ...x, ...patch } : x));

test('one access covers both modules: A is the 5 Intell tests, B adds PHQ-9 and GAD-7', () => {
  assert.equal(MODULES.A.categories.length, 5);
  assert.equal(MODULES.B.categories.length, 7);
  assert.ok(MODULES.A.categories.every((c) => ALL_CATEGORIES.includes(c)));
  assert.ok(ALL_CATEGORIES.includes('Depression') && ALL_CATEGORIES.includes('Anxiety'));
  assert.ok(accessPrice() > 0);
});

test('healthy battery → no concerns, complete, learning strength shown', () => {
  const p = buildProfile(allGood());
  assert.equal(p.complete, true);
  assert.equal(p.recommendation.level, 'none');
  assert.equal(p.concerns.length, 0);
  assert.match(p.strengths[0], /Visual/);
});

test('missing tests are reported', () => {
  const p = buildProfile(allGood().slice(0, 4));
  assert.equal(p.complete, false);
  assert.deepEqual(p.missing, ['PersonalityDimensions', 'Depression', 'Anxiety']);
});

test('Emotional Wellness below 36 alone → counselling', () => {
  const p = buildProfile(swap('EmotionalWellness', { score: 30 }));
  assert.equal(p.recommendation.level, 'counselling');
  assert.equal(p.concerns[0].category, 'EmotionalWellness');
  assert.equal(p.interventions.length, 1);
});

test('one low non-priority domain → monitor only; two low domains → counselling', () => {
  const one = buildProfile(swap('StudyBehaviour', { score: 30 }));
  assert.equal(one.recommendation.level, 'monitor');
  const two = buildProfile(allGood().map((x) => (['StudyBehaviour', 'PersonalityDimensions'].includes(x.test.category) ? { ...x, score: 30 } : x)));
  assert.equal(two.recommendation.level, 'counselling');
});

test('PHQ-9 ≥ 15, GAD-7 ≥ 15 or item 9 → referral', () => {
  assert.equal(buildProfile(swap('Depression', { score: 16 })).recommendation.level, 'referral');
  assert.equal(buildProfile(swap('Anxiety', { score: 15 })).recommendation.level, 'referral');
  assert.equal(buildProfile(swap('Depression', { score: 12 })).recommendation.level, 'counselling');

  const p = buildProfile(swap('Depression', { score: 3, answers: { 1: 1, 9: 1 }, test: { name: 'PHQ-9', category: 'Depression', questions: phqQuestions } }));
  assert.equal(p.recommendation.level, 'referral');
  assert.match(p.concerns[0].detail, /self-harm/);
});

test('latest result per category wins', () => {
  const old = r('StudyBehaviour', 20, { takenAt: new Date('2020-01-01') });
  const p = buildProfile([old, ...allGood()]);
  assert.equal(p.tests.find((t) => t.category === 'StudyBehaviour').score, 50);
});
