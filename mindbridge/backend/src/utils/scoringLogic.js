const calculateScore = (answers, questions, thresholds, category) => {
  let score = 0;
  let isLow = false;
  let severity = 'Unknown';
  let requiresCounselling = false;
  let subScores = null;

  // Validity check: If 80% or more answers are "5" (which is actually value 4 usually in 0-4 scale, but keeping original logic if they pass 5)
  let countMax = 0;
  Object.values(answers).forEach((val) => {
    // some questions use 1-5, some 0-4. Assuming val >= 4 is maxish
    if (val >= 4) countMax++;
  });
  
  const totalQuestions = Object.keys(answers).length;
  const validityWarning = totalQuestions > 0 && (countMax / totalQuestions) >= 0.8;

  // Category specific logic
  if (category === 'LearningPattern') {
    subScores = { Visual: 0, Auditory: 0, Kinesthetic: 0, Mixed: 0 };
    
    // Sum scores based on question dimensions
    for (const q of questions) {
      const val = answers[q.id] || 0;
      score += val; // Total score
      if (q.dimension && subScores[q.dimension] !== undefined) {
        subScores[q.dimension] += val;
      }
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
    // Normal / Reverse scoring logic
    for (const q of questions) {
      let val = answers[q.id] || 0; // Use 0 as default instead of 3 to avoid inflating scores of unanswered
      if (q.reverse) {
        // Find max value from options for reverse scoring
        let maxVal = 4;
        if (q.options && q.options.length > 0) {
           maxVal = Math.max(...q.options.map(o => o.value));
        }
        val = maxVal - val; 
      }
      score += val;
    }
  }

  // Determine category based on thresholds (which is an array)
  const thresholdsArray = Array.isArray(thresholds) ? thresholds : (thresholds.ranges || []);
  for (const range of thresholdsArray) {
    if (score >= range.min && score <= range.max) {
      severity = range.label || range.severity || 'Unknown';
      
      // Determine if action is needed
      if (range.isLow === true) {
        isLow = true;
      } else if (range.severity === 'severe' || range.severity === 'moderately severe' || range.color === 'Red' || range.color === 'Orange') {
        isLow = true;
      }
      break;
    }
  }

  if (score < 36 && (category === 'EmotionalWellness' || category === 'InternetUsage')) {
    requiresCounselling = true;
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
