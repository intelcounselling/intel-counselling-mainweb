const calculateScore = (answers, questions, thresholds, category) => {
  let score = 0;
  let isLow = false;
  let severity = 'Unknown';
  let requiresCounselling = false;
  let subScores = null;

  // Validity check: If 80% or more answers are "5"
  let count5 = 0;
  Object.values(answers).forEach((val) => {
    if (val === 5) count5++;
  });
  
  const totalQuestions = Object.keys(answers).length;
  const validityWarning = (count5 / totalQuestions) >= 0.8;

  // Category specific logic
  if (category === 'LearningPattern') {
    subScores = { visual: 0, auditory: 0, kinesthetic: 0 };
    
    // Sum scores
    for (const [qId, qIds] of Object.entries(thresholds.scoring)) {
      qIds.forEach(id => {
        subScores[qId] += answers[id] || 0;
      });
    }

    // Sort to find dominant style
    const sorted = Object.entries(subScores).sort((a, b) => b[1] - a[1]);
    const highest = sorted[0][1];
    const secondHighest = sorted[1][1];

    if (highest - secondHighest >= 3) {
      severity = `Single Dominant (${sorted[0][0]})`;
    } else if (highest - secondHighest >= 0 && highest - secondHighest <= 2) {
      // Check if triple balanced
      const thirdHighest = sorted[2][1];
      if (highest - thirdHighest <= 2) {
        severity = 'Triple Balanced';
      } else {
        severity = `Dual Dominant (${sorted[0][0]}, ${sorted[1][0]})`;
      }
    }
  } else {
    // Normal / Reverse scoring logic for domains 2-5
    for (const q of questions) {
      let val = answers[q.id] || 3;
      if (q.reverse) {
        val = 6 - val; // 1->5, 2->4, 3->3, 4->2, 5->1
      }
      score += val;
    }

    // Determine category based on thresholds
    for (const range of thresholds.ranges) {
      if (score >= range.min && score <= range.max) {
        severity = range.label;
        if (range.color === 'Orange' || range.color === 'Red') {
          isLow = true;
        }
        break;
      }
    }

    if (score < 36 && (category === 'EmotionalWellness' || category === 'InternetUsage')) {
      requiresCounselling = true;
    }
  }

  return {
    score,
    severity,
    isLow,
    subScores,
    requiresCounselling,
    validityWarning
  };
};

module.exports = { calculateScore };
