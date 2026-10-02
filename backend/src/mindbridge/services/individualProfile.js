// Integrated Student Psychological Profile (Module B).
// Pure rules over the latest result in each category — no new scoring: every
// number comes from the scores already stored, the bands are the spec's.
const { INTELL_DOMAINS, SELF_HARM_ITEM, bandColorFor, evaluateCounselling } = require('../utils/scoringLogic');
const { MODULES } = require('../utils/individualModules');

// one sentence per domain and level
const NOTES = {
  StudyBehaviour: {
    ok: 'Study habits, focus and planning are working well.',
    watch: 'Study habits are developing — more planning and consistency would help.',
    concern: 'Study habits are weak; structured study-skills support is advised.',
    high: 'Serious difficulty with study behaviour; focused academic counselling is advised.',
  },
  EmotionalWellness: {
    ok: 'Emotionally stable, with healthy coping.',
    watch: 'Mild emotional stress; keep an eye on it and build coping routines.',
    concern: 'Moderate emotional stress; counselling support is advised.',
    high: 'High emotional distress; counselling is strongly advised.',
  },
  InternetUsage: {
    ok: 'Healthy balance between online and offline life.',
    watch: 'Mild digital dependency; set screen-time limits and offline routines.',
    concern: 'Moderate digital overuse that may be affecting daily life.',
    high: 'High risk of digital dependency; structured intervention is advised.',
  },
  PersonalityDimensions: {
    ok: 'Strong emotional maturity and confidence.',
    watch: 'A healthy, developing personality with room to grow in confidence.',
    concern: 'Needs emotional and confidence support.',
    high: 'Needs structured emotional guidance.',
  },
  Depression: {
    ok: 'No significant depressive symptoms on the PHQ-9.',
    watch: 'Mild depressive symptoms; monitor and repeat the screening at follow-up.',
    concern: 'Moderate depressive symptoms; a counselling or treatment plan is recommended.',
    high: 'Moderately severe to severe depressive symptoms; clinical evaluation is recommended.',
  },
  Anxiety: {
    ok: 'No significant anxiety symptoms on the GAD-7.',
    watch: 'Mild anxiety; monitor and reassess.',
    concern: 'Moderate anxiety; counselling or therapy is recommended.',
    high: 'Severe anxiety; clinical evaluation is recommended.',
  },
};

const INTERVENTION = {
  StudyBehaviour: 'Study-skills coaching: planning, focus and a revision routine',
  EmotionalWellness: 'Emotional regulation and stress-management counselling',
  InternetUsage: 'Digital-habits plan: screen-time limits and offline routines',
  PersonalityDimensions: 'Confidence and emotional-maturity guidance',
  Depression: 'Depression-focused counselling and clinical evaluation',
  Anxiety: 'Anxiety management (skills-based therapy) and clinical evaluation',
};

const LABEL = {
  LearningPattern: 'Learning Pattern',
  StudyBehaviour: 'Study Behaviour',
  EmotionalWellness: 'Emotional Wellness',
  InternetUsage: 'Internet Usage',
  PersonalityDimensions: 'Personality',
  Depression: 'PHQ-9 (Depression)',
  Anxiety: 'GAD-7 (Anxiety)',
};

const STYLE_TIP = {
  Visual: 'diagrams, charts, notes and videos',
  Auditory: 'listening, discussion and explaining topics aloud',
  Kinesthetic: 'hands-on practice, movement and activities',
};

const clinicalLevel = (score) => (score >= 15 ? 'high' : score >= 10 ? 'concern' : score >= 5 ? 'watch' : 'ok');
const bandLevel = (score) => ({ Green: 'ok', Yellow: 'watch', Orange: 'concern', Red: 'high' }[bandColorFor(score)]);

// PHQ-9 item 9 — thoughts of self-harm — answered above "not at all"
function selfHarmFlag(result) {
  const q = (result.test?.questions || []).find((x) => SELF_HARM_ITEM.test(x.text || ''));
  if (!q) return false;
  const a = result.answers || {};
  const raw = Array.isArray(a)
    ? a.find((x) => String(x.questionId ?? x.id) === String(q.id))?.value
    : a[q.id];
  return Number(raw) > 0;
}

function assess(result) {
  const cat = result.test?.category;
  if (cat === 'LearningPattern') {
    const top = Object.entries(result.subScores || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { level: 'ok', selfHarm: false, note: `${result.severity}.${top ? ` Works best with ${STYLE_TIP[top]}.` : ''}` };
  }
  if (cat === 'Depression' && selfHarmFlag(result)) {
    return { level: 'high', selfHarm: true, note: `${NOTES.Depression.high} Thoughts of self-harm were reported (PHQ-9 item 9) — please review in person with a counsellor.` };
  }
  const level = INTELL_DOMAINS.includes(cat) ? bandLevel(result.score) : clinicalLevel(result.score);
  return { level, selfHarm: false, note: NOTES[cat]?.[level] || '' };
}

/**
 * @param results   all of the client's results (any order) with `test:{name,category,questions}`
 * @param moduleKey 'A' | 'B' — which test set the profile covers (default B)
 */
function buildProfile(results, moduleKey = 'B') {
  const categories = MODULES[moduleKey].categories;
  const latest = {};
  for (const r of [...results].sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt))) {
    const c = r.test?.category;
    if (categories.includes(c) && !latest[c]) latest[c] = r;
  }

  const tests = categories.filter((c) => latest[c]).map((c) => {
    const r = latest[c];
    return { category: c, name: r.test.name, takenAt: r.takenAt, score: r.score, maxScore: r.maxScore, severity: r.severity, subScores: r.subScores || null, ...assess(r) };
  });
  const byCat = Object.fromEntries(tests.map((t) => [t.category, t]));
  const missing = categories.filter((c) => !latest[c]);

  // ── Concerns and strengths ─────────────────────────────────
  const concerns = tests.filter((t) => t.level === 'concern' || t.level === 'high')
    .map((t) => ({ area: t.name, category: t.category, level: t.level, detail: t.note }));
  const strengths = tests.filter((t) => t.level === 'ok' && t.category !== 'LearningPattern').map((t) => `${t.name}: ${t.note}`);
  if (byCat.LearningPattern) strengths.unshift(`Learning style — ${byCat.LearningPattern.note}`);

  // ── Counselling rule across the four Intell domains, plus the clinical bands ──
  const domainScores = Object.fromEntries(INTELL_DOMAINS.filter((c) => byCat[c]).map((c) => [c, byCat[c].score]));
  const rule = evaluateCounselling(domainScores);
  const phq = byCat.Depression;
  const gad = byCat.Anxiety;
  const selfHarm = !!phq?.selfHarm;

  let recommendation;
  if (selfHarm || phq?.score >= 15 || gad?.score >= 15) {
    recommendation = {
      level: 'referral',
      headline: 'Clinical review / referral recommended',
      actions: [
        'Book a counselling session as soon as possible; the counsellor will assess the need for referral to a psychiatrist or clinical psychologist.',
        ...(selfHarm ? ['If you are ever in immediate danger or thinking of harming yourself, contact a crisis helpline or emergency services right away.'] : []),
      ],
    };
  } else if (rule.requires || phq?.score >= 10 || gad?.score >= 10) {
    recommendation = {
      level: 'counselling',
      headline: 'Counselling recommended',
      actions: ['Book a counselling session to go through these results and agree a support plan.'],
    };
  } else if (tests.some((t) => t.level === 'watch' || t.level === 'concern')) {
    recommendation = {
      level: 'monitor',
      headline: 'Monitor and build skills',
      actions: ['No urgent concern. Work on the areas marked below and retake the assessments in a few months.'],
    };
  } else {
    recommendation = { level: 'none', headline: 'No concerns identified', actions: ['Keep up the current habits and retake the assessments periodically.'] };
  }

  const summary = !tests.length
    ? 'No assessments have been completed yet.'
    : `${tests.length} of ${categories.length} assessments completed. ${concerns.length
      ? `${concerns.length} area${concerns.length > 1 ? 's need' : ' needs'} attention: ${concerns.map((c) => c.area).join(', ')}.`
      : 'No areas of concern were identified.'}`;

  return {
    module: moduleKey,
    complete: missing.length === 0,
    completed: tests.length,
    total: categories.length,
    missing,
    missingNames: missing.map((c) => LABEL[c]),
    summary,
    tests,
    strengths,
    concerns,
    interventions: concerns.map((c) => INTERVENTION[c.category]).filter(Boolean),
    lowDomains: rule.lowDomains,
    recommendation,
  };
}

module.exports = { buildProfile };
