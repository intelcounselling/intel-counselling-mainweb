// Intell Student Assessments (sold on the main site, one payment for both modules —
// see backend/src/intell.js; the price is intell_assessment in src/pricing.js).
//   A: the five Intell student development assessments
//   B: Intell Student Psychological Assessment Battery: the same five plus PHQ-9 and GAD-7
const INTELL = ['LearningPattern', 'StudyBehaviour', 'EmotionalWellness', 'InternetUsage', 'PersonalityDimensions'];
const CLINICAL = ['Depression', 'Anxiety'];

const MODULES = {
  A: {
    key: 'A',
    name: 'Intell Student Development Assessments',
    tagline: 'Module A',
    description: 'Five Intell-developed assessments: how you learn, study, feel, use the internet, and your personality.',
    categories: INTELL,
    deliverables: ['5 individual test results', 'Colour-banded interpretation for every domain', 'Your learning style (Visual / Auditory / Kinesthetic)'],
  },
  B: {
    key: 'B',
    name: 'Intell Student Psychological Assessment Battery™',
    tagline: 'Module B',
    description: 'The complete 7-test battery: the five Intell assessments plus the PHQ-9 and GAD-7 screenings.',
    categories: [...INTELL, ...CLINICAL],
    deliverables: [
      '7 test results with test-wise interpretation',
      'Integrated Student Psychological Profile',
      'Risk / concern identification',
      'Areas requiring intervention',
      'Counselling and referral recommendations',
    ],
  },
};

// Every category the one-time access unlocks (B is a superset of A)
const ALL_CATEGORIES = MODULES.B.categories;

module.exports = { MODULES, INTELL, CLINICAL, ALL_CATEGORIES };
