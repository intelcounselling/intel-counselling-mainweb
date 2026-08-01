// Quick local test for scoring logic
const { calculateScore } = require('./src/utils/scoringLogic');

// Test 1: Study Behaviour — all 4 (Agree) → no reverse. Score = 12*4 = 48
const q12 = (ids) => ids.map(id => ({ id, reverse: false, options: [
  {value:1},{value:2},{value:3},{value:4},{value:5}
]}));
const reverseQ = (ids) => ids.map(id => ({ id, reverse: true, options: [
  {value:1},{value:2},{value:3},{value:4},{value:5}
]}));

const studyQ = [
  ...q12(['Q1','Q2','Q3','Q4','Q5','Q8','Q9','Q10','Q11','Q12']),
  ...reverseQ(['Q6','Q7'])
];
const studyAnswers = {};
studyQ.forEach(q => { studyAnswers[q.id] = 4; }); // all answered 4

const studyThresholds = [
  { min: 48, max: 60, label: 'Strong Study Habits',   color: 'Green',  isLow: false },
  { min: 36, max: 47, label: 'Moderate Study Habits', color: 'Yellow', isLow: false },
  { min: 24, max: 35, label: 'Weak Study Habits',     color: 'Orange', isLow: true  },
  { min: 12, max: 23, label: 'Serious Difficulty',    color: 'Red',    isLow: true  },
];

const r1 = calculateScore(studyAnswers, studyQ, studyThresholds, 'StudyBehaviour');
// Non-reverse Q1-Q5, Q8-Q12: 10 * 4 = 40
// Reverse Q6, Q7: (5+1)-4 = 2, each. 2 * 2 = 4
// Total = 44 → Moderate Study Habits
console.log('Study Behaviour (all 4):', r1.score, '→', r1.severity, '(expected: 44, Moderate Study Habits)');

// Test 2: Learning Pattern — Visual dominant
const lpQ = [
  { id: 'Q1',  dimension: 'Visual',      reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q2',  dimension: 'Auditory',    reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q3',  dimension: 'Kinesthetic', reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q4',  dimension: 'Visual',      reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q5',  dimension: 'Auditory',    reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q6',  dimension: 'Kinesthetic', reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q7',  dimension: 'Visual',      reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q8',  dimension: 'Auditory',    reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q9',  dimension: 'Kinesthetic', reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q10', dimension: 'Visual',      reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q11', dimension: 'Auditory',    reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
  { id: 'Q12', dimension: 'Kinesthetic', reverse: false, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] },
];
const lpAnswers = {
  Q1:5, Q2:2, Q3:2,   // Visual=5, A=2, K=2
  Q4:5, Q5:2, Q6:2,   // Visual=10, A=4, K=4
  Q7:5, Q8:2, Q9:2,   // Visual=15, A=6, K=6
  Q10:5,Q11:2,Q12:2,  // Visual=20, A=8, K=8
};
const r2 = calculateScore(lpAnswers, lpQ, [], 'LearningPattern');
// Visual=20, Auditory=8, Kinesthetic=8. Highest-2nd = 12 >= 3 → Single Dominant Visual
console.log('Learning Pattern (Visual dominant):', r2.severity, r2.subScores, '(expected: Single Dominant Visual)');

// Test 3: Validity check — all 5s → validityWarning
const allFiveAnswers = {};
studyQ.forEach(q => { allFiveAnswers[q.id] = 5; });
const r3 = calculateScore(allFiveAnswers, studyQ, studyThresholds, 'StudyBehaviour');
console.log('Validity warning (all 5s):', r3.validityWarning, '(expected: true)');

// Test 4: Reverse scoring sanity — answer 1 on reverse q → gets 5
const singleReverseQ = [{ id: 'Q1', reverse: true, options: [{value:1},{value:2},{value:3},{value:4},{value:5}] }];
const r4 = calculateScore({ Q1: 1 }, singleReverseQ, [], 'StudyBehaviour');
console.log('Reverse score (answer 1 → should be 5):', r4.score, '(expected: 5)');
