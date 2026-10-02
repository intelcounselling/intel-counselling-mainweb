// Mindbridge PDF reports — no blank pages, no crashes on odd data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'stream';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { generateSessionReport, generateDetailedStudentReport } = require('../src/mindbridge/services/pdf.service.js');

const render = (fn, data) =>
  new Promise((resolve, reject) => {
    const out = new PassThrough();
    out.setHeader = () => {};
    const chunks = [];
    out.on('data', (c) => chunks.push(c));
    out.on('end', () => {
      const buf = Buffer.concat(chunks);
      resolve({ buf, pages: (buf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) || []).length });
    });
    Promise.resolve().then(() => fn(out, data)).catch(reject);
  });

const labels = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day', 'Always'];
const result = (name, n, score, max, severity, day) => {
  const questions = Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    text: `Question ${i + 1}: over the last two weeks, how often have you been bothered by problem ${i + 1}?`,
    options: labels.map((label, value) => ({ label, value })),
  }));
  return {
    score, maxScore: max, severity, takenAt: new Date(2026, 8, day),
    test: { name, questions },
    answers: Object.fromEntries(questions.map((q, i) => [q.id, i % 4])),
  };
};

const student = { firstName: 'Child', lastName: 'One', email: 'c@example.com', grade: '10', dateOfBirth: new Date(2010, 3, 2), school: { name: 'Intel Counselling School' } };
const five = [
  result('PHQ-9', 9, 12, 27, 'moderate', 3),
  result('GAD-7', 7, 3, 21, 'minimal', 5),
  result('Emotional Wellness', 12, 40, 60, 'Mild Emotional Stress', 9),
  result('Study Behaviour', 12, 25, 60, 'Moderate', 12),
  result('PSS-10', 10, 30, 40, 'high', 15),
];
const appt = { slot: new Date(2026, 9, 5, 15), status: 'SCHEDULED', meetingLink: null, notes: 'Discussed breathing exercises.' };

test('session report: summary on page 1, answers follow, no blank pages', async () => {
  const base = { appointment: appt, patient: student, psychiatrist: { firstName: 'Intel', lastName: 'Counselling' }, school: student.school };

  // No assessments → one page (was 3 with blank pages)
  const none = await render(generateSessionReport, { ...base, results: [] });
  assert.equal(none.pages, 1);

  // 3 assessments (28 answered questions) → summary + answers, a few pages at most
  const withAnswers = await render(generateSessionReport, { ...base, results: five.slice(0, 3) });
  assert.ok(withAnswers.buf.subarray(0, 4).toString() === '%PDF');
  assert.ok(withAnswers.pages >= 2 && withAnswers.pages <= 3, `expected 2–3 pages, got ${withAnswers.pages}`);

  // answers add pages; without them the same results fit on one
  const noAnswers = await render(generateSessionReport, { ...base, results: five.slice(0, 3).map((r) => ({ ...r, answers: {} })) });
  assert.equal(noAnswers.pages, 1);
});

test('detailed report has no blank pages (was 24 pages for 5 assessments)', async () => {
  const { pages } = await render(generateDetailedStudentReport, { student, results: five });
  assert.ok(pages >= 3 && pages <= 6, `expected 3–6 pages, got ${pages}`);

  const empty = await render(generateDetailedStudentReport, { student, results: [] });
  assert.equal(empty.pages, 1);
});

test('reports survive missing / odd data instead of crashing', async () => {
  // appointment without a counsellor or school
  const a = await render(generateSessionReport, { appointment: { ...appt, notes: null }, patient: student, psychiatrist: null, school: null, results: [] });
  assert.equal(a.pages, 1);

  // no severity, zero max score, non-Latin name
  const b = await render(generateDetailedStudentReport, {
    student: { ...student, firstName: 'Ananya அ😊' },
    results: [{ ...five[0], severity: null, maxScore: 0 }],
  });
  assert.ok(b.pages >= 1 && b.pages <= 2);
});

test('the Intel Counselling brand mark is embedded in the report', async () => {
  const { buf, pages } = await render(generateDetailedStudentReport, { student, results: five });
  assert.ok(pages > 1);
  assert.ok(buf.includes(Buffer.from('/Type /XObject')), 'logo image embedded');
});
