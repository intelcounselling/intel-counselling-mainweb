/**
 * INTELL Student Success Assessment™ — Scoring Logic
 *
 * Scale: 1–5 (Strongly Disagree → Strongly Agree)
 * Reverse scoring: reversed = 6 - value  (1→5, 2→4, 3→3, 4→2, 5→1)
 *
 * Counselling recommendation triggered if:
 *   - EmotionalWellness score < 36, OR
 *   - InternetUsage score < 36, OR
 *   - Any 2 of the 4 non-LP domains score < 36
 *
 * Validity check: If ≥ 80% of answers are "5" → flag self-presentation bias.
 */

const calculateScore = (answers, questions, thresholds, category) => {
  let score = 0;
  let isLow = false;
  let severity = 'Unknown';
  let requiresCounselling = false;
  let subScores = null;

  // ── Validity check ────────────────────────────────────────────
  // Flag if 80%+ answers are the maximum value (5 for 1-5 scale)
  const answerValues = Object.values(answers).filter(v => typeof v === 'number');
  const countMax = answerValues.filter(v => v >= 5).length;
  const totalQuestions = answerValues.length;
  const validityWarning = totalQuestions > 0 && (countMax / totalQuestions) >= 0.8;

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

    // Determine dominant learning style
    const sorted = Object.entries(subScores).sort((a, b) => b[1] - a[1]);
    const highest       = sorted[0][1];
    const secondHighest = sorted[1][1];
    const thirdHighest  = sorted[2][1];

    if (highest - secondHighest >= 3) {
      // Clear single dominant
      severity = `Single Dominant (${sorted[0][0]})`;
    } else if (highest - thirdHighest <= 2) {
      // All three close together
      severity = 'Triple Balanced';
    } else {
      // Top two are close, third is lower
      severity = `Dual Dominant (${sorted[0][0]}, ${sorted[1][0]})`;
    }

    // LearningPattern has no isLow / requiresCounselling — it is purely descriptive
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
        if (range.isLow === true || range.color === 'Red' || range.color === 'Orange') {
          isLow = true;
        }
        break;
      }
    }

    // ── Counselling recommendation ────────────────────────────────
    // Per-test rule: EW or IU below 36 → recommend counselling
    if (score < 36 && (category === 'EmotionalWellness' || category === 'InternetUsage')) {
      requiresCounselling = true;
    }
    // All non-LP domains below 36 → also flag isLow
    if (score < 36) {
      isLow = true;
    }
  }

  return {
    score,
    severity,
    isLow,
    subScores,
    requiresCounselling,
    validityWarning,
  };
};

module.exports = { calculateScore };
