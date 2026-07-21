// prisma/seed-isss.js — Intel Student Success System™ Assessment Tools
// Run: node prisma/seed-isss.js
// Seeds all 5 ISSS assessment tools into the Test table

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helper: Likert options (5-point) ─────────────────────────
const LIKERT_5 = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Always', value: 4 },
];

const FREQ_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Rarely (once a month)', value: 1 },
  { label: 'Sometimes (weekly)', value: 2 },
  { label: 'Often (daily)', value: 3 },
  { label: 'Very often (multiple times daily)', value: 4 },
];

const AGREE_5 = [
  { label: 'Strongly Disagree', value: 0 },
  { label: 'Disagree', value: 1 },
  { label: 'Neutral', value: 2 },
  { label: 'Agree', value: 3 },
  { label: 'Strongly Agree', value: 4 },
];

// ─── Tool 1: Intel Learning Pattern Tool™ ───────────────────
// 20 questions across 4 learning modes: Visual, Auditory, Kinesthetic, Mixed
// Each question tagged with a dimension for sub-score analysis
const LEARNING_PATTERN_QUESTIONS = [
  // Visual
  { id: 1, text: 'I understand new information better when I see diagrams, charts, or pictures.', dimension: 'Visual', options: LIKERT_5 },
  { id: 2, text: 'I prefer reading instructions rather than listening to them.', dimension: 'Visual', options: LIKERT_5 },
  { id: 3, text: 'I remember faces more easily than names.', dimension: 'Visual', options: LIKERT_5 },
  { id: 4, text: 'I find colour-coding my notes helps me study more effectively.', dimension: 'Visual', options: LIKERT_5 },
  { id: 5, text: 'I can easily visualise maps or routes in my mind.', dimension: 'Visual', options: LIKERT_5 },
  // Auditory
  { id: 6, text: 'I understand material better when someone explains it to me verbally.', dimension: 'Auditory', options: LIKERT_5 },
  { id: 7, text: 'I remember information better when I say it out loud.', dimension: 'Auditory', options: LIKERT_5 },
  { id: 8, text: 'I enjoy group discussions and talking through problems.', dimension: 'Auditory', options: LIKERT_5 },
  { id: 9, text: 'I can follow complex spoken instructions without needing to write them down.', dimension: 'Auditory', options: LIKERT_5 },
  { id: 10, text: 'Background music or sounds help me concentrate when studying.', dimension: 'Auditory', options: LIKERT_5 },
  // Kinesthetic
  { id: 11, text: 'I learn best by doing and experiencing things hands-on.', dimension: 'Kinesthetic', options: LIKERT_5 },
  { id: 12, text: 'I prefer practical experiments over reading textbooks.', dimension: 'Kinesthetic', options: LIKERT_5 },
  { id: 13, text: 'I like to take notes or doodle while listening to keep focused.', dimension: 'Kinesthetic', options: LIKERT_5 },
  { id: 14, text: 'Moving around or using physical objects helps me understand concepts.', dimension: 'Kinesthetic', options: LIKERT_5 },
  { id: 15, text: 'I find it difficult to sit still for long periods while studying.', dimension: 'Kinesthetic', options: LIKERT_5 },
  // Mixed / Adaptive
  { id: 16, text: 'I can adapt my study approach depending on the subject.', dimension: 'Mixed', options: LIKERT_5 },
  { id: 17, text: 'I combine different methods (notes + talking + practice) to learn effectively.', dimension: 'Mixed', options: LIKERT_5 },
  { id: 18, text: 'I can learn equally well from books, videos, and real activities.', dimension: 'Mixed', options: LIKERT_5 },
  { id: 19, text: 'I switch between different study strategies without difficulty.', dimension: 'Mixed', options: LIKERT_5 },
  { id: 20, text: 'I use a mix of visual aids, discussions, and practice when preparing for exams.', dimension: 'Mixed', options: LIKERT_5 },
];

// Max per dimension = 5 questions × 4 = 20. Total max = 80.
const LEARNING_PATTERN_THRESHOLDS = [
  { min: 0,  max: 20, label: 'Developing Learner',      severity: 'minimal', desc: 'You are still discovering your learning style. Experiment with different methods to find what works best for you.' },
  { min: 21, max: 40, label: 'Emerging Learner',        severity: 'mild',    desc: 'You are beginning to use a variety of learning strategies. Continue exploring to build stronger habits.' },
  { min: 41, max: 60, label: 'Active Learner',          severity: 'moderate',desc: 'You actively use learning strategies and adapt well. Keep building on your strongest style.' },
  { min: 61, max: 80, label: 'Strong Strategic Learner', severity: 'low',    desc: 'You have a clear understanding of how you learn best and apply multiple strategies effectively.' },
];

// ─── Tool 2: Intel Study Behaviour Scale™ ───────────────────
// 20 questions on study habits, time management, focus
const STUDY_BEHAVIOUR_QUESTIONS = [
  { id: 1,  text: 'I follow a consistent daily study schedule.', options: LIKERT_5 },
  { id: 2,  text: 'I complete my assignments before their deadlines.', options: LIKERT_5 },
  { id: 3,  text: 'I set specific goals before I start a study session.', options: LIKERT_5 },
  { id: 4,  text: 'I review my class notes within 24 hours of a lesson.', options: LIKERT_5 },
  { id: 5,  text: 'I take breaks at regular intervals to avoid mental fatigue.', options: LIKERT_5 },
  { id: 6,  text: 'I study in a quiet, organised environment free of distractions.', options: LIKERT_5 },
  { id: 7,  text: 'I use mind maps, summaries, or flashcards to review material.', options: LIKERT_5 },
  { id: 8,  text: 'I can concentrate on studying for at least 30 minutes without distraction.', options: LIKERT_5 },
  { id: 9,  text: 'I ask for help from teachers or peers when I don\'t understand something.', options: LIKERT_5 },
  { id: 10, text: 'I avoid procrastinating on difficult subjects.', options: LIKERT_5 },
  { id: 11, text: 'I plan my exam preparation at least two weeks in advance.', options: LIKERT_5 },
  { id: 12, text: 'I actively participate in classroom discussions.', options: LIKERT_5 },
  { id: 13, text: 'I keep a planner or to-do list to track my tasks.', options: LIKERT_5 },
  { id: 14, text: 'I check my completed work for mistakes before submitting.', options: LIKERT_5 },
  { id: 15, text: 'I maintain a healthy sleep routine on school nights.', options: LIKERT_5 },
  { id: 16, text: 'I feel motivated to do well in my academics.', options: LIKERT_5 },
  { id: 17, text: 'I reflect on my mistakes from past tests and work to improve.', options: LIKERT_5 },
  { id: 18, text: 'I balance my extracurricular activities without affecting study time.', options: LIKERT_5 },
  { id: 19, text: 'I understand the importance of each subject for my future goals.', options: LIKERT_5 },
  { id: 20, text: 'I feel in control of my academic workload.', options: LIKERT_5 },
];

// Max = 20 × 4 = 80
const STUDY_BEHAVIOUR_THRESHOLDS = [
  { min: 0,  max: 26, label: 'Need Structured Guidance', severity: 'severe',   desc: 'Your study habits need significant support. A structured plan and regular guidance can help you build strong academic foundations.' },
  { min: 27, max: 53, label: 'Need Mild Support',        severity: 'moderate', desc: 'You have some good habits but there are key areas to develop. Focused coaching on time management and consistency will help.' },
  { min: 54, max: 80, label: 'Strong Study Habits',      severity: 'low',      desc: 'Excellent! You demonstrate well-developed study skills and self-discipline. Continue refining your strategies.' },
];

// ─── Tool 3: Intel Emotional Wellness Checklist™ ────────────
// 15 questions — SENSITIVE (group data only for school management)
const EMOTIONAL_WELLNESS_QUESTIONS = [
  { id: 1,  text: 'I feel happy and positive about my life most of the time.', options: AGREE_5 },
  { id: 2,  text: 'I am able to manage stress and pressure effectively.', options: AGREE_5 },
  { id: 3,  text: 'I feel supported by my family and friends.', options: AGREE_5 },
  { id: 4,  text: 'I can bounce back after a difficult experience without too much trouble.', options: AGREE_5 },
  { id: 5,  text: 'I rarely feel overwhelmed by negative emotions.', options: AGREE_5 },
  { id: 6,  text: 'I feel safe and comfortable at school.', options: AGREE_5 },
  { id: 7,  text: 'I have someone I can talk to when I feel upset or confused.', options: AGREE_5 },
  { id: 8,  text: 'I feel confident about my abilities and potential.', options: AGREE_5 },
  { id: 9,  text: 'I handle conflict with peers in a calm and respectful way.', options: AGREE_5 },
  { id: 10, text: 'I enjoy activities that help me relax and recharge.', options: AGREE_5 },
  { id: 11, text: 'I rarely feel lonely or isolated.', options: AGREE_5 },
  { id: 12, text: 'I feel motivated to reach my goals.', options: AGREE_5 },
  { id: 13, text: 'I sleep well and wake up feeling rested.', options: AGREE_5 },
  { id: 14, text: 'I feel a sense of purpose or meaning in what I do.', options: AGREE_5 },
  { id: 15, text: 'I am generally satisfied with myself and my progress.', options: AGREE_5 },
];

// Max = 15 × 4 = 60
const EMOTIONAL_WELLNESS_THRESHOLDS = [
  { min: 0,  max: 20, label: 'Need Support',        severity: 'severe',   desc: 'Your responses suggest you may be experiencing significant emotional challenges. Please speak with a counsellor or trusted adult.' },
  { min: 21, max: 40, label: 'Mild Stress',         severity: 'moderate', desc: 'You are managing, but some areas of your emotional wellness need attention. Building stronger coping strategies and support networks can help.' },
  { min: 41, max: 60, label: 'Emotionally Balanced', severity: 'low',    desc: 'You demonstrate good emotional wellness. Continue nurturing your wellbeing through healthy habits and strong relationships.' },
];

// ─── Tool 4: Intel Internet Usage Awareness™ ────────────────
// 15 questions on digital habits and balance
const INTERNET_USAGE_QUESTIONS = [
  { id: 1,  text: 'I use my phone or computer for entertainment (games, videos, social media) for more than 4 hours daily.', options: FREQ_OPTIONS },
  { id: 2,  text: 'I check social media or messages immediately after waking up.', options: FREQ_OPTIONS },
  { id: 3,  text: 'I feel anxious or restless when I cannot use the internet.', options: FREQ_OPTIONS },
  { id: 4,  text: 'I spend more time online than I plan to.', options: FREQ_OPTIONS },
  { id: 5,  text: 'Using the internet interferes with my homework or study time.', options: FREQ_OPTIONS },
  { id: 6,  text: 'I use my device in bed and it affects my sleep.', options: FREQ_OPTIONS },
  { id: 7,  text: 'I feel the need to be online even when doing something else.', options: FREQ_OPTIONS },
  { id: 8,  text: 'I have tried to reduce my screen time but found it difficult.', options: FREQ_OPTIONS },
  { id: 9,  text: 'Online interactions have led to conflicts or misunderstandings.', options: FREQ_OPTIONS },
  { id: 10, text: 'I prefer online social interaction over face-to-face interaction.', options: FREQ_OPTIONS },
  { id: 11, text: 'I feel upset or irritated when someone interrupts my online activity.', options: FREQ_OPTIONS },
  { id: 12, text: 'I use the internet to escape from problems or bad feelings.', options: FREQ_OPTIONS },
  { id: 13, text: 'I have skipped meals or physical activity because of internet use.', options: FREQ_OPTIONS },
  { id: 14, text: 'I spend time on content that I later regret viewing.', options: FREQ_OPTIONS },
  { id: 15, text: 'My internet use has negatively affected relationships with family or friends.', options: FREQ_OPTIONS },
];

// Max = 15 × 4 = 60 (higher = more problematic)
const INTERNET_USAGE_THRESHOLDS = [
  { min: 0,  max: 20, label: 'Healthy Digital Balance', severity: 'low',      desc: 'You demonstrate healthy and balanced digital habits. Continue making mindful choices about your screen time.' },
  { min: 21, max: 40, label: 'Mild Digital Overuse',    severity: 'moderate', desc: 'Some patterns in your internet use may be affecting your wellbeing. Setting daily limits and screen-free times is recommended.' },
  { min: 41, max: 60, label: 'Digital Overuse Risk',    severity: 'severe',   desc: 'Your responses indicate significant digital overuse. Speaking with a counsellor and setting structured digital boundaries is strongly recommended.' },
];

// ─── Tool 5: Intel Personality Dimensions™ ──────────────────
// 20 questions across 5 dimensions: Confidence, Adaptability, Responsibility, Emotional Growth, Social Awareness
const PERSONALITY_QUESTIONS = [
  // Confidence
  { id: 1,  text: 'I believe in my ability to handle new or difficult situations.', dimension: 'Confidence', options: AGREE_5 },
  { id: 2,  text: 'I speak up and share my opinions in group settings.', dimension: 'Confidence', options: AGREE_5 },
  { id: 3,  text: 'I set ambitious goals for myself and work towards them.', dimension: 'Confidence', options: AGREE_5 },
  { id: 4,  text: 'I try new activities even if I am unsure of the outcome.', dimension: 'Confidence', options: AGREE_5 },
  // Adaptability
  { id: 5,  text: 'I adjust well when plans or routines change unexpectedly.', dimension: 'Adaptability', options: AGREE_5 },
  { id: 6,  text: 'I remain calm and focused when facing unexpected challenges.', dimension: 'Adaptability', options: AGREE_5 },
  { id: 7,  text: 'I find it easy to learn from new or unfamiliar situations.', dimension: 'Adaptability', options: AGREE_5 },
  { id: 8,  text: 'I see change as an opportunity for growth rather than a threat.', dimension: 'Adaptability', options: AGREE_5 },
  // Responsibility
  { id: 9,  text: 'I take ownership of my mistakes and work to correct them.', dimension: 'Responsibility', options: AGREE_5 },
  { id: 10, text: 'I fulfil my commitments and promises to others reliably.', dimension: 'Responsibility', options: AGREE_5 },
  { id: 11, text: 'I contribute fairly to group work and team tasks.', dimension: 'Responsibility', options: AGREE_5 },
  { id: 12, text: 'I take care of my belongings and responsibilities without being reminded.', dimension: 'Responsibility', options: AGREE_5 },
  // Emotional Growth
  { id: 13, text: 'I understand and can describe my own emotions accurately.', dimension: 'EmotionalGrowth', options: AGREE_5 },
  { id: 14, text: 'I handle criticism positively and use it to improve.', dimension: 'EmotionalGrowth', options: AGREE_5 },
  { id: 15, text: 'I do not hold onto anger or grudges for a long time.', dimension: 'EmotionalGrowth', options: AGREE_5 },
  { id: 16, text: 'I practice empathy by considering others\' feelings before acting.', dimension: 'EmotionalGrowth', options: AGREE_5 },
  // Social Awareness
  { id: 17, text: 'I can read social situations and respond appropriately.', dimension: 'SocialAwareness', options: AGREE_5 },
  { id: 18, text: 'I am considerate of different backgrounds, opinions, and perspectives.', dimension: 'SocialAwareness', options: AGREE_5 },
  { id: 19, text: 'I contribute positively to the communities and groups I belong to.', dimension: 'SocialAwareness', options: AGREE_5 },
  { id: 20, text: 'I stand up for others when I see unfair or unkind behaviour.', dimension: 'SocialAwareness', options: AGREE_5 },
];

// Max = 20 × 4 = 80
const PERSONALITY_THRESHOLDS = [
  { min: 0,  max: 26, label: 'Needs Development',    severity: 'moderate', desc: 'There are key personality areas that, with guidance and practice, can be significantly strengthened.' },
  { min: 27, max: 53, label: 'Developing Strengths', severity: 'mild',     desc: 'You show growth potential across several dimensions. Continued self-awareness and coaching will help you flourish.' },
  { min: 54, max: 80, label: 'Strong Character',     severity: 'low',      desc: 'You demonstrate a well-rounded, mature personality with strong self-awareness and interpersonal skills.' },
];

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding ISSS assessment tools...\n');

  const tools = [
    {
      name: 'Intel Learning Pattern Tool™',
      description: 'Identifies your natural learning style across Visual, Auditory, Kinesthetic, and Mixed dimensions to help you study more effectively.',
      category: 'LearningPattern',
      estimatedMinutes: 10,
      isActive: true,
      isSensitive: false,
      questions: LEARNING_PATTERN_QUESTIONS,
      thresholds: LEARNING_PATTERN_THRESHOLDS,
    },
    {
      name: 'Intel Study Behaviour Scale™',
      description: 'Evaluates your study habits, time management skills, and academic self-discipline to identify areas of strength and growth.',
      category: 'StudyBehaviour',
      estimatedMinutes: 10,
      isActive: true,
      isSensitive: false,
      questions: STUDY_BEHAVIOUR_QUESTIONS,
      thresholds: STUDY_BEHAVIOUR_THRESHOLDS,
    },
    {
      name: 'Intel Emotional Wellness Checklist™',
      description: 'A self-awareness tool to help you understand your emotional health, resilience, and support needs.',
      category: 'EmotionalWellness',
      estimatedMinutes: 8,
      isActive: true,
      isSensitive: true, // Only group % shown to school management
      questions: EMOTIONAL_WELLNESS_QUESTIONS,
      thresholds: EMOTIONAL_WELLNESS_THRESHOLDS,
    },
    {
      name: 'Intel Internet Usage Awareness™',
      description: 'Evaluates your digital habits and screen time patterns to promote healthier and more balanced technology use.',
      category: 'InternetUsage',
      estimatedMinutes: 8,
      isActive: true,
      isSensitive: false,
      questions: INTERNET_USAGE_QUESTIONS,
      thresholds: INTERNET_USAGE_THRESHOLDS,
    },
    {
      name: 'Intel Personality Dimensions™',
      description: 'Maps your character strengths across five key dimensions: Confidence, Adaptability, Responsibility, Emotional Growth, and Social Awareness.',
      category: 'PersonalityDimensions',
      estimatedMinutes: 10,
      isActive: true,
      isSensitive: false,
      questions: PERSONALITY_QUESTIONS,
      thresholds: PERSONALITY_THRESHOLDS,
    },
  ];

  for (const tool of tools) {
    // Check if a test with this category already exists
    const existing = await prisma.test.findFirst({ where: { category: tool.category } });

    if (existing) {
      console.log(`⏭  Skipped (already exists): ${tool.name}`);
      continue;
    }

    await prisma.test.create({ data: tool });
    console.log(`✅ Created: ${tool.name}`);
  }

  console.log('\n🎉 ISSS seed complete!');
  console.log('5 assessment tools have been added to the database.');
}

main()
  .catch((e) => {
    console.error('❌ ISSS Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
