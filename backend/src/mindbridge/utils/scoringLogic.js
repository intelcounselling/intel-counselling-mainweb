/**
 * INTELL Student Success Assessment™ — Scoring Logic
 *
 * Scale: 1–5 (Strongly Disagree → Strongly Agree)
 * Reverse scoring: reversed = 6 - value  (1→5, 2→4, 3→3, 4→2, 5→1)
 *
 * Domains
 *   1. Learning Pattern     — descriptive only (Visual / Auditory / Kinesthetic, each 4–20)
 *   2. Study Behaviour      ┐
 *   3. Emotional Wellness   │ 12 items, 12–60:
 *   4. Internet Usage       │ Green 48–60 · Yellow 36–47 · Orange/Red below 36
 *   5. Personality          ┘
 *
 * Counselling recommendation (see evaluateCounselling) if
 *   - Emotional Wellness < 36, OR Internet Usage < 36, OR
 *   - any two of the four scored domains < 36
 *
 * Validity check: if 80% or more answers are "5" → possible self-presentation bias.
 */

const INTELL_DOMAINS = ['StudyBehaviour', 'EmotionalWellness', 'InternetUsage', 'PersonalityDimensions'];
const SELF_HARM_ITEM = /better off dead|hurting yourself/i;

const VALIDITY_MESSAGE = 'Please answer based on real experience for better understanding.';

// Colour band for a 12–60 domain score (Orange 24–35, Red 12–23 — both "below 36")
const bandColorFor = (score) => (score >= 48 ? 'Green' : score >= 36 ? 'Yellow' : score >= 24 ? 'Orange' : 'Red');

// Learning-pattern dimension interpretation (each dimension 4–20)
const preferenceFor = (score) => (score >= 16 ? 'Strong Preference' : score >= 11 ? 'Moderate Preference' : 'Low Preference');

// ≥ 80% of the answers are the maximum value (5) → self-presentation bias flag.
// Only meaningful for the 1–5 INTELL scales; the 0–3 clinical screenings never score 5.
const hasValidityWarning = (answers, category) => {
  if (category !== 'LearningPattern' && !INTELL_DOMAINS.includes(category)) return false;
  const values = Object.values(answers || {}).filter((v) => typeof v === 'number');
  return values.length > 0 && values.filter((v) => v >= 5).length / values.length >= 0.8;
};

const learningStyleFrom = (subScores) => {
  const sorted = Object.entries(subScores).sort((a, b) => b[1] - a[1]);
  const [[n1, highest], [n2, second], [, third]] = sorted;

  if (highest - second >= 3) {
    return { type: 'single', styles: [n1], label: 'Single Dominant Learning Style' };
  }
  // Top two are within 0–2 points. If the third is also close, nothing dominates.
  if (highest - third <= 2) {
    return { type: 'triple', styles: sorted.map(([n]) => n), label: 'Triple Balanced Learning Style' };
  }
  return { type: 'dual', styles: [n1, n2], label: 'Dual Dominant Learning Style' };
};

/**
 * Overall counselling recommendation across the four scored domains.
 * @param {Object} latestScores — latest score per category, e.g. { EmotionalWellness: 30, StudyBehaviour: 40 }
 */
const evaluateCounselling = (latestScores) => {
  const lowDomains = INTELL_DOMAINS.filter((c) => typeof latestScores[c] === 'number' && latestScores[c] < 36);
  const requires =
    lowDomains.includes('EmotionalWellness') ||
    lowDomains.includes('InternetUsage') ||
    lowDomains.length >= 2;
  return { requires, lowDomains };
};

const calculateScore = (answers, questions, thresholds, category) => {
  let score = 0;
  let isLow = false;
  let severity = 'Unknown';
  let color = null;
  let requiresCounselling = false;
  let subScores = null;
  let learningStyle = null;
  let preferences = null;

  const validityWarning = hasValidityWarning(answers, category);

  // Helper: look up answer by question id regardless of whether id is string or number
  const getAnswer = (qId) =>
    answers[qId] ?? answers[String(qId)] ?? answers[Number(qId)] ?? 0;

  // ── Scoring ───────────────────────────────────────────────────
  if (category === 'LearningPattern') {
    // Sub-scores per dimension (each ranges 4–20)
    subScores = { Visual: 0, Auditory: 0, Kinesthetic: 0 };

    if (Array.isArray(questions)) {
      for (const q of questions) {
        const val = getAnswer(q.id);
        score += val;
        if (q.dimension && subScores[q.dimension] !== undefined) {
          subScores[q.dimension] += val;
        }
      }
    }

    learningStyle = learningStyleFrom(subScores);
    preferences = Object.fromEntries(Object.entries(subScores).map(([dim, v]) => [dim, preferenceFor(v)]));
    severity = learningStyle.type === 'triple'
      ? learningStyle.label
      : `${learningStyle.label}: ${learningStyle.styles.join(' + ')}`;

    // Purely descriptive: no isLow / counselling flag for the learning pattern
  } else {
    // Normal + reverse scoring (all 4 non-LP domains)
    if (Array.isArray(questions)) {
      for (const q of questions) {
        let val = getAnswer(q.id);
        if (q.reverse) {
          // Reverse: find max option value and subtract
          const maxVal = (q.options && q.options.length > 0)
            ? Math.max(...q.options.map(o => o.value))
            : 5; // default max for 1-5 scale
          val = (maxVal + 1) - val; // e.g. 6 - val for 1-5 scale
        }
        score += val;
      }
    }

    // ── Threshold-based severity & isLow ─────────────────────────
    const thresholdsArray = Array.isArray(thresholds)
      ? thresholds
      : (thresholds?.ranges || []);

    for (const range of thresholdsArray) {
      if (score >= range.min && score <= range.max) {
        severity = range.label || range.severity || 'Unknown';
        color = range.color || null;
        if (range.isLow === true || range.color === 'Red' || range.color === 'Orange') {
          isLow = true;
        }
        break;
      }
    }

    if (INTELL_DOMAINS.includes(category)) {
      color = color || bandColorFor(score);
      // Per-domain rule: Emotional Wellness or Internet Usage below 36 → counselling.
      // (The "any two domains" rule needs the student's other results — see evaluateCounselling.)
      if (score < 36 && (category === 'EmotionalWellness' || category === 'InternetUsage')) {
        requiresCounselling = true;
      }
      // Below 36 is the Orange/Red band for the scored INTELL domains. Clinical
      // scales (PHQ-9/GAD-7/PSS-10) score the other way and max out at 21–40, so
      // this rule must not touch them — their risk comes from the threshold ranges.
      if (score < 36) isLow = true;
    }

    // PHQ-9 item 9 (thoughts of self-harm): any answer above "not at all"
    // must reach the counsellor regardless of the total score.
    if (category === 'Depression' && Array.isArray(questions)) {
      const selfHarm = questions.find(q => SELF_HARM_ITEM.test(q.text || ''));
      if (selfHarm && getAnswer(selfHarm.id) > 0) {
        isLow = true;
        requiresCounselling = true;
      }
    }
  }

  return {
    score,
    severity,
    color,
    isLow,
    subScores,
    learningStyle,
    preferences,
    requiresCounselling,
    validityWarning,
  };
};

module.exports = {
  calculateScore,
  evaluateCounselling,
  hasValidityWarning,
  bandColorFor,
  preferenceFor,
  INTELL_DOMAINS,
  VALIDITY_MESSAGE,
};
