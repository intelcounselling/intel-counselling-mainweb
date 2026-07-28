// prisma/seedTests.cjs
// INTELL STUDENT SUCCESS ASSESSMENT™ — 5 Domains
// Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree
// Reverse Scoring: reversed = (maxVal + 1) - value  → 1→5, 2→4, 3→3, 4→2, 5→1

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SCALE = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree',          value: 2 },
  { label: 'Neutral',           value: 3 },
  { label: 'Agree',             value: 4 },
  { label: 'Strongly Agree',    value: 5 },
];

const tests = [
  // ── DOMAIN 1: Learning Pattern ────────────────────────────────
  {
    name: 'Intel Learning Pattern Tool',
    description: "To identify the student's learning preference (Visual, Auditory, Kinesthetic).",
    category: 'LearningPattern',
    isSensitive: false,
    estimatedMinutes: 5,
    questions: [
      { id: 'Q1',  text: 'I understand lessons better when I see diagrams, charts, or pictures.',    reverse: false, dimension: 'Visual',      options: SCALE },
      { id: 'Q2',  text: 'I remember information better when I hear it explained.',                  reverse: false, dimension: 'Auditory',    options: SCALE },
      { id: 'Q3',  text: 'I learn faster when I can try things practically.',                        reverse: false, dimension: 'Kinesthetic', options: SCALE },
      { id: 'Q4',  text: 'I prefer reading notes rather than listening to long explanations.',        reverse: false, dimension: 'Visual',      options: SCALE },
      { id: 'Q5',  text: 'I like discussing topics aloud to understand them.',                       reverse: false, dimension: 'Auditory',    options: SCALE },
      { id: 'Q6',  text: 'I understand best when I move, write, or do activities.',                  reverse: false, dimension: 'Kinesthetic', options: SCALE },
      { id: 'Q7',  text: 'Visual aids help me concentrate more in class.',                           reverse: false, dimension: 'Visual',      options: SCALE },
      { id: 'Q8',  text: 'Listening carefully helps me grasp ideas clearly.',                        reverse: false, dimension: 'Auditory',    options: SCALE },
      { id: 'Q9',  text: 'Physical activity helps me stay focused while learning.',                  reverse: false, dimension: 'Kinesthetic', options: SCALE },
      { id: 'Q10', text: 'I revise better using written notes or videos.',                           reverse: false, dimension: 'Visual',      options: SCALE },
      { id: 'Q11', text: 'I revise better by explaining topics to someone.',                         reverse: false, dimension: 'Auditory',    options: SCALE },
      { id: 'Q12', text: 'I revise better by practicing problems or activities.',                    reverse: false, dimension: 'Kinesthetic', options: SCALE },
    ],
    thresholds: [
      { min: 16, max: 20, label: 'Strong Preference',   color: 'Green'  },
      { min: 11, max: 15, label: 'Moderate Preference', color: 'Yellow' },
      { min:  4, max: 10, label: 'Low Preference',      color: 'Orange' },
    ],
  },

  // ── DOMAIN 2: Study Behaviour ──────────────────────────────────
  {
    name: 'Intel Study Behaviour Scale',
    description: 'Understand study habits, focus, planning and consistency.',
    category: 'StudyBehaviour',
    isSensitive: false,
    estimatedMinutes: 5,
    questions: [
      { id: 'Q1',  text: 'I follow a regular study schedule most days.',                                      reverse: false, options: SCALE },
      { id: 'Q2',  text: 'I usually complete my homework or assignments on time.',                            reverse: false, options: SCALE },
      { id: 'Q3',  text: 'I can concentrate on my studies without getting distracted easily.',                reverse: false, options: SCALE },
      { id: 'Q4',  text: 'I revise lessons regularly, not only before exams.',                                reverse: false, options: SCALE },
      { id: 'Q5',  text: 'I plan my study time before exams.',                                                reverse: false, options: SCALE },
      { id: 'Q6',  text: 'I get easily distracted by my mobile or other activities while studying.',          reverse: true,  options: SCALE },
      { id: 'Q7',  text: 'I postpone studying even when I know it is important.',                             reverse: true,  options: SCALE },
      { id: 'Q8',  text: 'I feel confident about my preparation before exams.',                               reverse: false, options: SCALE },
      { id: 'Q9',  text: 'I take responsibility for my academic performance.',                                reverse: false, options: SCALE },
      { id: 'Q10', text: 'I try to improve when I get low marks.',                                            reverse: false, options: SCALE },
      { id: 'Q11', text: 'I manage my study time along with other activities well.',                          reverse: false, options: SCALE },
      { id: 'Q12', text: 'I feel motivated to study even when subjects are difficult.',                       reverse: false, options: SCALE },
    ],
    thresholds: [
      { min: 48, max: 60, label: 'Strong Study Habits',                    color: 'Green',  isLow: false },
      { min: 36, max: 47, label: 'Moderate Study Habits',                  color: 'Yellow', isLow: false },
      { min: 24, max: 35, label: 'Weak Study Habits',                      color: 'Orange', isLow: true  },
      { min: 12, max: 23, label: 'Serious Difficulty in Study Behaviour',  color: 'Red',    isLow: true  },
    ],
  },

  // ── DOMAIN 3: Emotional Wellness ──────────────────────────────
  {
    name: 'Intel Emotional Wellness Checklist',
    description: 'Understand stress level, emotional balance, mood and coping.',
    category: 'EmotionalWellness',
    isSensitive: true,
    estimatedMinutes: 5,
    questions: [
      { id: 'Q1',  text: 'I feel calm and relaxed most days.',                          reverse: false, options: SCALE },
      { id: 'Q2',  text: 'I feel stressed or pressured about many things in my life.',  reverse: true,  options: SCALE },
      { id: 'Q3',  text: 'I can talk to someone when I feel emotionally upset.',         reverse: false, options: SCALE },
      { id: 'Q4',  text: 'I often feel sad or low without knowing why.',                reverse: true,  options: SCALE },
      { id: 'Q5',  text: 'I feel confident about handling my problems.',                 reverse: false, options: SCALE },
      { id: 'Q6',  text: 'I feel emotionally exhausted or drained.',                    reverse: true,  options: SCALE },
      { id: 'Q7',  text: 'I enjoy the activities I usually like to do.',                reverse: false, options: SCALE },
      { id: 'Q8',  text: 'I worry too much about small matters.',                       reverse: true,  options: SCALE },
      { id: 'Q9',  text: 'I feel supported by people around me.',                       reverse: false, options: SCALE },
      { id: 'Q10', text: 'I feel hopeful about my future.',                             reverse: false, options: SCALE },
      { id: 'Q11', text: 'My emotions do not disturb my daily activities much.',        reverse: false, options: SCALE },
      { id: 'Q12', text: 'I feel emotionally balanced most of the time.',               reverse: false, options: SCALE },
    ],
    thresholds: [
      { min: 48, max: 60, label: 'Emotionally Stable',        color: 'Green',  isLow: false },
      { min: 36, max: 47, label: 'Mild Emotional Stress',     color: 'Yellow', isLow: false },
      { min: 24, max: 35, label: 'Moderate Emotional Stress', color: 'Orange', isLow: true  },
      { min: 12, max: 23, label: 'High Emotional Distress',   color: 'Red',    isLow: true  },
    ],
  },

  // ── DOMAIN 4: Internet Usage ───────────────────────────────────
  {
    name: 'Intel Internet Usage Awareness',
    description: 'Understand mobile, internet, gaming and social media impact.',
    category: 'InternetUsage',
    isSensitive: false,
    estimatedMinutes: 5,
    questions: [
      { id: 'Q1',  text: 'I can control how much time I spend on my mobile or the internet.',    reverse: false, options: SCALE },
      { id: 'Q2',  text: 'I use my mobile mainly for important or useful purposes.',              reverse: false, options: SCALE },
      { id: 'Q3',  text: 'I stop using my phone when I know it is time to study or sleep.',      reverse: false, options: SCALE },
      { id: 'Q4',  text: 'I feel restless or irritated when I cannot use my mobile.',            reverse: true,  options: SCALE },
      { id: 'Q5',  text: 'I spend more time online than I initially plan.',                       reverse: true,  options: SCALE },
      { id: 'Q6',  text: 'I check my mobile immediately after waking up or before sleeping.',    reverse: true,  options: SCALE },
      { id: 'Q7',  text: 'My mobile use affects my concentration while studying.',                reverse: true,  options: SCALE },
      { id: 'Q8',  text: 'I feel my mood depends on what I see on social media.',                reverse: true,  options: SCALE },
      { id: 'Q9',  text: 'I am able to enjoy activities without using my phone.',                reverse: false, options: SCALE },
      { id: 'Q10', text: 'I can keep my phone away when I need to focus.',                       reverse: false, options: SCALE },
      { id: 'Q11', text: 'I feel guilty about how much time I spend on my mobile.',              reverse: true,  options: SCALE },
      { id: 'Q12', text: 'My mobile usage does not disturb my daily routine much.',              reverse: false, options: SCALE },
    ],
    thresholds: [
      { min: 48, max: 60, label: 'Healthy Digital Balance',      color: 'Green',  isLow: false },
      { min: 36, max: 47, label: 'Mild Digital Dependency',      color: 'Yellow', isLow: false },
      { min: 24, max: 35, label: 'Moderate Digital Overuse',     color: 'Orange', isLow: true  },
      { min: 12, max: 23, label: 'High Digital Dependency Risk', color: 'Red',    isLow: true  },
    ],
  },

  // ── DOMAIN 5: Personality Dimensions ──────────────────────────
  {
    name: 'Intel Personality Dimensions',
    description: 'Understand responsibility, confidence, emotional balance, adaptability and social interaction.',
    category: 'PersonalityDimensions',
    isSensitive: true,
    estimatedMinutes: 5,
    questions: [
      { id: 'Q1',  text: 'I take responsibility for my work and actions.',                   reverse: false, options: SCALE },
      { id: 'Q2',  text: 'I stay calm even when something does not go as planned.',          reverse: false, options: SCALE },
      { id: 'Q3',  text: 'I feel confident expressing my thoughts and opinions.',            reverse: false, options: SCALE },
      { id: 'Q4',  text: 'I adjust easily to new situations or changes.',                   reverse: false, options: SCALE },
      { id: 'Q5',  text: 'I complete tasks even when they feel boring or difficult.',        reverse: false, options: SCALE },
      { id: 'Q6',  text: 'I get upset quickly when things go wrong.',                       reverse: true,  options: SCALE },
      { id: 'Q7',  text: 'I feel comfortable interacting with others.',                     reverse: false, options: SCALE },
      { id: 'Q8',  text: 'I feel nervous or shy in most social situations.',                reverse: true,  options: SCALE },
      { id: 'Q9',  text: 'I try to improve myself when I make mistakes.',                   reverse: false, options: SCALE },
      { id: 'Q10', text: 'I remain emotionally steady during stressful situations.',         reverse: false, options: SCALE },
      { id: 'Q11', text: 'I accept feedback without feeling hurt.',                         reverse: false, options: SCALE },
      { id: 'Q12', text: 'I feel confident about who I am.',                                reverse: false, options: SCALE },
    ],
    thresholds: [
      { min: 48, max: 60, label: 'Strong Emotional Maturity',             color: 'Green',  isLow: false },
      { min: 36, max: 47, label: 'Healthy Developing Personality',        color: 'Yellow', isLow: false },
      { min: 24, max: 35, label: 'Needs Emotional & Confidence Support',  color: 'Orange', isLow: true  },
      { min: 12, max: 23, label: 'Needs Structured Emotional Guidance',   color: 'Red',    isLow: true  },
    ],
  },
];

async function main() {
  console.log('Seeding INTELL Student Success Assessment tests...');

  for (const testData of tests) {
    const existing = await prisma.test.findFirst({ where: { name: testData.name } });
    if (!existing) {
      await prisma.test.create({ data: testData });
      console.log(`  Created: ${testData.name}`);
    } else {
      await prisma.test.update({ where: { id: existing.id }, data: testData });
      console.log(`  Updated: ${testData.name}`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
