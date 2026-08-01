const { calculateScore } = require('./src/utils/scoringLogic');

const questions = [
  { id: 'Q1', text: 'I can control how much time I spend on my mobile or the internet.', reverse: false },
  { id: 'Q2', text: 'I use my mobile mainly for important or useful purposes.', reverse: false },
  { id: 'Q3', text: 'I stop using my phone when I know it is time to study or sleep.', reverse: false },
  { id: 'Q4', text: 'I feel restless or irritated when I cannot use my mobile.', reverse: true },
  { id: 'Q5', text: 'I spend more time online than I initially plan.', reverse: true }
];

const thresholds = {
  ranges: [
    { min: 48, max: 60, label: 'Healthy Digital Balance', color: 'Green' },
    { min: 36, max: 47, label: 'Mild Digital Dependency', color: 'Yellow' },
    { min: 24, max: 35, label: 'Moderate Digital Overuse', color: 'Orange' },
    { min: 12, max: 23, label: 'High Digital Dependency Risk', color: 'Red' }
  ]
};

const answers = {
  'Q1': 5,
  'Q2': 5,
  'Q3': 5,
  'Q4': 5,
  'Q5': 5
};

const result = calculateScore(answers, questions, thresholds, 'InternetUsage');
console.log(result);
