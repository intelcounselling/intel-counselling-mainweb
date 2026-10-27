// Intel Student Assessments on the main site (Module A + Module B, one payment).
//
// Module A: the five Intel assessments (questions from prisma/seedTests.cjs — the
// same definitions Mindbridge uses). Module B adds PHQ-9 and GAD-7, which are the
// site's existing free screenings; their saved results count towards the profile.
//
// Scoring, the integrated profile and the PDF all reuse the Mindbridge code, so a
// result means the same thing in both places.
import { createRequire } from 'module';
import { PassThrough } from 'stream';
import { decrypt } from './encryption.js';
import { countPaidOrders, getUserResultsByTests } from './db.js';

const require = createRequire(import.meta.url);
const { tests: SEED_TESTS } = require('../prisma/seedTests.cjs');
const { calculateScore } = require('./mindbridge/utils/scoringLogic.js');
const { buildProfile } = require('./mindbridge/services/individualProfile.js');
const { generateDetailedStudentReport } = require('./mindbridge/services/pdf.service.js');

export const INTELL_SERVICE_ID = 'intell_assessment'; // Module A
export const INTELL_MODULE_B_ID = 'intell_module_b';  // Module B (includes A)

const CLINICAL_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];
const clinical = (texts) => texts.map((text, i) => ({ id: i + 1, text, options: CLINICAL_OPTIONS }));

// PHQ-9 / GAD-7 as the site asks them (frontend/src/components/ClinicalQuestions.ts)
const PHQ9 = {
  name: 'Depression Screening', category: 'Depression', estimatedMinutes: 5,
  questions: clinical([
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure',
    'Trouble concentrating',
    'Moving or speaking slowly / being restless',
    'Thoughts that you would be better off dead or of hurting yourself',
  ]),
  thresholds: [
    { min: 0, max: 4, severity: 'minimal' },
    { min: 5, max: 9, severity: 'mild' },
    { min: 10, max: 14, severity: 'moderate', isLow: true },
    { min: 15, max: 19, severity: 'moderately severe', isLow: true },
    { min: 20, max: 27, severity: 'severe', isLow: true },
  ],
};
const GAD7 = {
  name: 'Anxiety Screening', category: 'Anxiety', estimatedMinutes: 4,
  questions: clinical([
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop worrying',
    'Worrying too much',
    'Trouble relaxing',
    'Being restless',
    'Becoming easily annoyed',
    'Feeling afraid something awful might happen',
  ]),
  thresholds: [
    { min: 0, max: 4, severity: 'minimal' },
    { min: 5, max: 9, severity: 'mild' },
    { min: 10, max: 14, severity: 'moderate', isLow: true },
    { min: 15, max: 21, severity: 'severe', isLow: true },
  ],
};

const seed = (category) => SEED_TESTS.find((t) => t.category === category);

// Test id (as stored in assessment_results.test_id) → definition
const DEFS = {
  intell_lp: { module: 'A', ...seed('LearningPattern') },
  intell_sb: { module: 'A', ...seed('StudyBehaviour') },
  intell_ew: { module: 'A', ...seed('EmotionalWellness') },
  intell_iu: { module: 'A', ...seed('InternetUsage') },
  intell_pd: { module: 'A', ...seed('PersonalityDimensions') },
  phq9: { module: 'B', ...PHQ9 },
  gad7: { module: 'B', ...GAD7 },
};

export const INTELL_TEST_IDS = Object.keys(DEFS);
export const isIntellOnlyTest = (testId) => /^intell_/.test(String(testId || ''));

// Public definitions for the five Intel tests (PHQ-9/GAD-7 run in the existing screening UI).
// Reverse-scoring flags and thresholds stay on the server.
export function publicDefinitions() {
  return INTELL_TEST_IDS.map((id) => {
    const d = DEFS[id];
    const own = isIntellOnlyTest(id);
    return {
      id,
      module: d.module,
      category: d.category,
      name: d.name,
      description: d.description || '',
      estimatedMinutes: d.estimatedMinutes,
      ...(own && {
        questions: d.questions.map((q) => ({ id: q.id, text: q.text })),
        options: d.questions[0].options,
      }),
    };
  });
}

// A stored answer string is one digit per question, each one of that question's option values.
export function validAnswers(testId, digits) {
  const d = DEFS[testId];
  if (!d || typeof digits !== 'string' || digits.length !== d.questions.length) return false;
  return d.questions.every((q, i) => q.options.some((o) => o.value === Number(digits[i])));
}

// Stored result → the shape the profile and PDF code expect
export function scoreResult(testId, digits, takenAt, id) {
  const d = DEFS[testId];
  const answers = Object.fromEntries(d.questions.map((q, i) => [String(q.id), Number(digits[i])]));
  const r = calculateScore(answers, d.questions, d.thresholds, d.category);
  const maxScore = d.questions.reduce((sum, q) => sum + Math.max(...q.options.map((o) => o.value)), 0);
  return {
    id,
    takenAt: new Date(takenAt || Date.now()),
    score: r.score,
    maxScore,
    severity: r.severity,
    subScores: r.subScores || null,
    answers,
    test: { name: d.name, category: d.category, questions: d.questions },
  };
}

// ── Entitlement & data ────────────────────────────────────────

// Two purchases, both tied to the account for good:
//   Module A (INTELL_SERVICE_ID)   — the five Intel tests
//   Module B (INTELL_MODULE_B_ID)  — the full 7-test battery + integrated profile (includes A)
export async function intellAccess(userId) {
  if (!userId) return { a: false, b: false };
  const [a, b] = await Promise.all([countPaidOrders(userId, INTELL_SERVICE_ID), countPaidOrders(userId, INTELL_MODULE_B_ID)]);
  return { a: a > 0 || b > 0, b: b > 0 };
}

export const hasIntellAccess = async (userId) => (await intellAccess(userId)).a;

// What this buyer is charged: Module B costs only the difference once A is owned.
export function intellPriceFor(serviceId, access, prices) {
  if (serviceId === INTELL_MODULE_B_ID && access.a) {
    return Math.max(1, prices[INTELL_MODULE_B_ID] - prices[INTELL_SERVICE_ID]);
  }
  return prices[serviceId];
}

export async function loadIntellResults(userId) {
  const rows = await getUserResultsByTests(userId, INTELL_TEST_IDS);
  const results = [];
  for (const row of rows) {
    try {
      const digits = decrypt(row.encrypted_answers, row.iv);
      if (validAnswers(row.test_id, digits)) results.push({ testId: row.test_id, ...scoreResult(row.test_id, digits, row.created_at, row.id) });
    } catch (err) {
      console.error('Skipping unreadable Intel result', row.id, err.message);
    }
  }
  return results;
}

// Module B buyers get the integrated 7-test profile; Module A the five Intel tests only.
export const intellProfile = (results, moduleB = true) =>
  moduleB ? buildProfile(results, 'B') : buildProfile(results.filter((r) => isIntellOnlyTest(r.testId)), 'A');

// A single result that on its own calls for clinical review (PHQ-9 ≥ 15, GAD-7 ≥ 15,
// or any answer above "not at all" on the self-harm item).
export const isHighRisk = (result) => buildProfile([result], 'B').recommendation.level === 'referral';

// The integrated report, streamed to a response (or any writable with setHeader).
// Module A: the five Intel results and answers. Module B: plus PHQ-9/GAD-7 and the integrated profile.
export function writeReport(res, account, results, moduleB = true) {
  const [firstName, ...rest] = String(account.name || 'Client').trim().split(/\s+/);
  const student = { firstName, lastName: rest.join(' '), email: account.email, role: 'INDIVIDUAL' };
  const shown = moduleB ? results : results.filter((r) => isIntellOnlyTest(r.testId));
  return generateDetailedStudentReport(res, { student, results: shown, profile: moduleB ? intellProfile(shown) : null });
}

// Same report as a Buffer — attached to the counsellor's booking email.
export async function reportBuffer(account, results, moduleB = true) {
  const sink = new PassThrough();
  sink.setHeader = () => {}; // pdf.service sets download headers on a real response
  const chunks = [];
  sink.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => { sink.on('end', resolve); sink.on('error', reject); });
  await writeReport(sink, account, results, moduleB);
  await done;
  return Buffer.concat(chunks);
}
