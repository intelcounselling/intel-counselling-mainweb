// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Full Question Sets ───────────────────────────────────────

const PHQ9_QUESTIONS = [
  {
    id: 1,
    text: 'Little interest or pleasure in doing things',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 2,
    text: 'Feeling down, depressed, or hopeless',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 3,
    text: 'Trouble falling or staying asleep, or sleeping too much',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 4,
    text: 'Feeling tired or having little energy',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 5,
    text: 'Poor appetite or overeating',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 6,
    text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 7,
    text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 8,
    text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 9,
    text: 'Thoughts that you would be better off dead, or thoughts of hurting yourself in some way',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
];

const PHQ9_THRESHOLDS = [
  { min: 0, max: 4, severity: 'minimal', isLow: false, description: 'Minimal depression. Continue monitoring.' },
  { min: 5, max: 9, severity: 'mild', isLow: false, description: 'Mild depression. Watchful waiting, repeat PHQ-9 at follow-up.' },
  { min: 10, max: 14, severity: 'moderate', isLow: true, description: 'Moderate depression. Treatment plan recommended.' },
  { min: 15, max: 19, severity: 'moderately severe', isLow: true, description: 'Moderately severe depression. Active treatment recommended.' },
  { min: 20, max: 27, severity: 'severe', isLow: true, description: 'Severe depression. Immediate action and treatment warranted.' },
];

const GAD7_QUESTIONS = [
  {
    id: 1,
    text: 'Feeling nervous, anxious, or on edge',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 2,
    text: 'Not being able to stop or control worrying',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 3,
    text: 'Worrying too much about different things',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 4,
    text: 'Trouble relaxing',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 5,
    text: 'Being so restless that it is hard to sit still',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 6,
    text: 'Becoming easily annoyed or irritable',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 7,
    text: 'Feeling afraid, as if something awful might happen',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
];

const GAD7_THRESHOLDS = [
  { min: 0, max: 4, severity: 'minimal', isLow: false, description: 'Minimal anxiety.' },
  { min: 5, max: 9, severity: 'mild', isLow: false, description: 'Mild anxiety. Monitor and reassess.' },
  { min: 10, max: 14, severity: 'moderate', isLow: true, description: 'Moderate anxiety. Consider counseling or therapy.' },
  { min: 15, max: 21, severity: 'severe', isLow: true, description: 'Severe anxiety. Active treatment strongly recommended.' },
];

const PSS10_QUESTIONS = [
  {
    id: 1,
    text: 'In the last month, how often have you been upset because of something that happened unexpectedly?',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Almost never', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 3 },
      { label: 'Very often', value: 4 },
    ],
  },
  {
    id: 2,
    text: 'In the last month, how often have you felt that you were unable to control the important things in your life?',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Almost never', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 3 },
      { label: 'Very often', value: 4 },
    ],
  },
  {
    id: 3,
    text: 'In the last month, how often have you felt nervous and stressed?',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Almost never', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 3 },
      { label: 'Very often', value: 4 },
    ],
  },
  {
    id: 4,
    text: 'In the last month, how often have you felt confident about your ability to handle your personal problems? (reverse scored)',
    reverse: true,
    options: [
      { label: 'Never', value: 4 },
      { label: 'Almost never', value: 3 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 1 },
      { label: 'Very often', value: 0 },
    ],
  },
  {
    id: 5,
    text: 'In the last month, how often have you felt that things were going your way? (reverse scored)',
    reverse: true,
    options: [
      { label: 'Never', value: 4 },
      { label: 'Almost never', value: 3 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 1 },
      { label: 'Very often', value: 0 },
    ],
  },
  {
    id: 6,
    text: 'In the last month, how often have you found that you could not cope with all the things that you had to do?',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Almost never', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 3 },
      { label: 'Very often', value: 4 },
    ],
  },
  {
    id: 7,
    text: 'In the last month, how often have you been able to control irritations in your life? (reverse scored)',
    reverse: true,
    options: [
      { label: 'Never', value: 4 },
      { label: 'Almost never', value: 3 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 1 },
      { label: 'Very often', value: 0 },
    ],
  },
  {
    id: 8,
    text: 'In the last month, how often have you felt that you were on top of things? (reverse scored)',
    reverse: true,
    options: [
      { label: 'Never', value: 4 },
      { label: 'Almost never', value: 3 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 1 },
      { label: 'Very often', value: 0 },
    ],
  },
  {
    id: 9,
    text: 'In the last month, how often have you been angered because of things that happened that were outside of your control?',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Almost never', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 3 },
      { label: 'Very often', value: 4 },
    ],
  },
  {
    id: 10,
    text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Almost never', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly often', value: 3 },
      { label: 'Very often', value: 4 },
    ],
  },
];

const PSS10_THRESHOLDS = [
  { min: 0, max: 13, severity: 'low', isLow: false, description: 'Low perceived stress.' },
  { min: 14, max: 26, severity: 'moderate', isLow: false, description: 'Moderate perceived stress.' },
  { min: 27, max: 40, severity: 'high', isLow: true, description: 'High perceived stress. Consider counseling or stress management program.' },
];

// ─── Main Seed ───────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...');

  // Hash passwords — all accounts use the same initial password
  const adminHash   = await bcrypt.hash('changeme@123', 12);
  const defaultHash = await bcrypt.hash('changeme@123', 12);

  // ── Tests ──────────────────────────────────────────────────
  console.log('Creating tests...');

  await prisma.test.upsert({
    where: { id: 'test-phq9-0001' },
    update: {},
    create: {
      id: 'test-phq9-0001',
      name: 'PHQ-9',
      description: 'Patient Health Questionnaire-9 measures depression severity over the past two weeks.',
      category: 'Depression',
      questions: PHQ9_QUESTIONS,
      thresholds: PHQ9_THRESHOLDS,
      estimatedMinutes: 5,
    },
  });

  await prisma.test.upsert({
    where: { id: 'test-gad7-0001' },
    update: {},
    create: {
      id: 'test-gad7-0001',
      name: 'GAD-7',
      description: 'Generalized Anxiety Disorder-7 screens for and measures severity of generalized anxiety.',
      category: 'Anxiety',
      questions: GAD7_QUESTIONS,
      thresholds: GAD7_THRESHOLDS,
      estimatedMinutes: 4,
    },
  });

  await prisma.test.upsert({
    where: { id: 'test-pss10-001' },
    update: {},
    create: {
      id: 'test-pss10-001',
      name: 'PSS-10',
      description: 'Perceived Stress Scale-10 measures the degree to which situations in life are perceived as stressful.',
      category: 'Stress',
      questions: PSS10_QUESTIONS,
      thresholds: PSS10_THRESHOLDS,
      estimatedMinutes: 6,
    },
  });

  console.log('✅ Tests created');

  // ── Super Admin ────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'intelcounselling@gmail.com' },
    update: {},
    create: {
      email: 'intelcounselling@gmail.com',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
      firstName: 'Intel',
      lastName: 'Counselling',
      mustResetPassword: true,
    },
  });

  console.log('✅ Super admin created: intelcounselling@gmail.com / changeme@123');

  // ── School ─────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { accessCode: 'INTEL' },
    update: {},
    create: {
      name: 'Intel Counselling School',
      address: '1 Counselling Way',
      contactEmail: 'intelcounselling@gmail.com',
      contactPhone: '',
      accessCode: 'INTEL',
    },
  });

  console.log('✅ School created');

  // ── Family with Parent + Child ─────────────────────────────
  const family = await prisma.family.create({ data: { schoolId: school.id } });

  await prisma.user.upsert({
    where: { email: 'parent1@gmail.com' },
    update: {},
    create: {
      email: 'parent1@gmail.com',
      passwordHash: defaultHash,
      role: 'PARENT',
      firstName: 'Parent',
      lastName: 'One',
      schoolId: school.id,
      familyParentId: family.id,
      mustResetPassword: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'child1@gmail.com' },
    update: {},
    create: {
      email: 'child1@gmail.com',
      passwordHash: defaultHash,
      role: 'STUDENT',
      firstName: 'Child',
      lastName: 'One',
      grade: '10',
      dateOfBirth: new Date('2010-01-01'),
      schoolId: school.id,
      familyStudentId: family.id,
      mustResetPassword: true,
    },
  });

  console.log('✅ Parent and child created');

  console.log('\n🎉 Seed complete!');
  console.log('\n── Login Credentials ──────────────────────────────────');
  console.log('Super Admin:  intelcounselling@gmail.com  / changeme@123  [mustReset=true]');
  console.log('Parent:       parent1@gmail.com            / changeme@123  [mustReset=true]');
  console.log('Child:        child1@gmail.com             / changeme@123  [mustReset=true]');
  console.log('──────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
