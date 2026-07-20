/**
 * Maps a raw test score to a severity label and isLow flag
 * based on the test's thresholds JSON array.
 *
 * Thresholds format:
 * [{ min, max, severity, isLow, description? }]
 */
function interpretScore(score, thresholds) {
  if (!Array.isArray(thresholds) || thresholds.length === 0) {
    return { severity: 'unknown', isLow: false, description: '' };
  }

  for (const threshold of thresholds) {
    if (score >= threshold.min && score <= threshold.max) {
      return {
        severity: threshold.severity,
        isLow: threshold.isLow ?? false,
        description: threshold.description ?? '',
      };
    }
  }

  // Fallback: score beyond max threshold
  const last = thresholds[thresholds.length - 1];
  return {
    severity: last.severity,
    isLow: last.isLow ?? false,
    description: last.description ?? '',
  };
}

module.exports = { interpretScore };
