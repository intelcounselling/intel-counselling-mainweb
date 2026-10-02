// Paid modules of the individual (non-school) portal.
//   A — the five Intell student development assessments
//   B — Intell Student Psychological Assessment Battery™: the same five plus PHQ-9 and GAD-7
const INTELL = ['LearningPattern', 'StudyBehaviour', 'EmotionalWellness', 'InternetUsage', 'PersonalityDimensions'];
const CLINICAL = ['Depression', 'Anxiety'];

const MODULES = {
  A: {
    key: 'A',
    name: 'Intell Student Development Assessments',
    tagline: 'Module A',
    description: 'Five Intell-developed assessments covering how you learn, study, feel, use the internet and your personality.',
    categories: INTELL,
    priceEnv: 'INDIVIDUAL_PRICE_A',
    defaultPrice: 999,
    deliverables: ['5 individual test results', 'Colour-banded interpretation for every domain', 'Learning style (Visual / Auditory / Kinesthetic)'],
  },
  B: {
    key: 'B',
    name: 'Intell Student Psychological Assessment Battery™',
    tagline: 'Module B',
    description: '7-test comprehensive assessment: the five Intell assessments plus the PHQ-9 and GAD-7 clinical screenings.',
    categories: [...INTELL, ...CLINICAL],
    priceEnv: 'INDIVIDUAL_PRICE_B',
    defaultPrice: 2499,
    deliverables: [
      '7 individual test results and test-wise interpretation reports',
      'Integrated Student Psychological Profile',
      'Risk / concern identification',
      'Areas requiring intervention',
      'Counselling and referral recommendations',
    ],
  },
};

// Same switch the main site uses: DEMO_MODE=true makes every payment ₹1.
const isDemoMode = () => ['true', '1', 'yes'].includes(String(process.env.DEMO_MODE || '').trim().toLowerCase());

// Prices live on the server only — the client picks a module, never an amount.
function priceOf(key) {
  const m = MODULES[key];
  if (!m) return undefined;
  if (isDemoMode()) return 1;
  const v = Number(process.env[m.priceEnv]);
  return Number.isFinite(v) && v > 0 ? v : m.defaultPrice;
}

// Categories a user may take, given the module keys they have paid for.
function allowedCategories(paidKeys) {
  const out = new Set();
  for (const k of paidKeys) (MODULES[k]?.categories || []).forEach((c) => out.add(c));
  return out;
}

module.exports = { MODULES, INTELL, CLINICAL, priceOf, allowedCategories, isDemoMode };
