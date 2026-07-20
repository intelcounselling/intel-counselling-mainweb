export interface ClinicalOption {
  label: string;
  value: number;
}

export interface ClinicalQuestion {
  id: number;
  text: string;
  reverseScore?: boolean;
}

export interface ScoreBand {
  min: number;
  max: number;
  label: string;
  desc: string;
  ctaText?: string;
}

export interface ClinicalConfig {
  id: string;
  title: string;
  desc: string;
  introPrefix: string;
  color: string;
  questions: ClinicalQuestion[];
  options: ClinicalOption[];
  bands: ScoreBand[];
}

export const CLINICAL_CONFIGS: Record<string, ClinicalConfig> = {
  phq9: {
    id: 'phq9',
    title: 'Depression Screening',
    desc: 'Self-check for depressive symptoms.',
    introPrefix: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    color: 'bg-terracotta',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
    questions: [
      { id: 1, text: 'Little interest or pleasure in doing things' },
      { id: 2, text: 'Feeling down, depressed, or hopeless' },
      { id: 3, text: 'Trouble falling or staying asleep, or sleeping too much' },
      { id: 4, text: 'Feeling tired or having little energy' },
      { id: 5, text: 'Poor appetite or overeating' },
      { id: 6, text: 'Feeling bad about yourself — or that you are a failure' },
      { id: 7, text: 'Trouble concentrating' },
      { id: 8, text: 'Moving or speaking slowly / being restless' },
      { id: 9, text: 'Thoughts that you would be better off dead or of hurting yourself' },
    ],
    bands: [
      { min: 0, max: 4, label: 'Minimal', desc: 'Your responses suggest minimal depressive symptoms. Continue practicing self-care and emotional balance. If you ever feel overwhelmed, support is available.', ctaText: 'Explore Wellness Resources' },
      { min: 5, max: 9, label: 'Mild', desc: 'Your responses suggest mild depressive symptoms. This may be a sign of emotional strain or stress. Early support can help prevent symptoms from increasing.', ctaText: 'Book a Preventive Counselling Session' },
      { min: 10, max: 14, label: 'Moderate', desc: 'Your responses indicate moderate depressive symptoms. You may be experiencing emotional distress that can benefit from professional support. Talking to a counsellor can help you understand and manage these feelings effectively.', ctaText: 'Book a Counselling Session Now' },
      { min: 15, max: 27, label: 'Moderately Severe / Severe', desc: 'Your responses suggest significant depressive symptoms. Professional support is strongly recommended. You do not have to handle this alone.', ctaText: 'Speak to a Counsellor Today' }
    ]
  },
  gad7: {
    id: 'gad7',
    title: 'Anxiety Screening',
    desc: 'Measure feelings of anxiety and worry.',
    introPrefix: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    color: 'bg-[#2D6A4F]',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
    questions: [
      { id: 1, text: 'Feeling nervous, anxious, or on edge' },
      { id: 2, text: 'Not being able to stop worrying' },
      { id: 3, text: 'Worrying too much' },
      { id: 4, text: 'Trouble relaxing' },
      { id: 5, text: 'Being restless' },
      { id: 6, text: 'Becoming easily annoyed' },
      { id: 7, text: 'Feeling afraid something awful might happen' },
    ],
    bands: [
      { min: 0, max: 4, label: 'Minimal', desc: 'Your anxiety levels appear within a manageable range.', ctaText: 'Explore Wellness Resources' },
      { min: 5, max: 9, label: 'Mild', desc: 'You may be experiencing mild anxiety. Learning coping strategies early can be helpful.', ctaText: 'Book an Anxiety Support Session' },
      { min: 10, max: 14, label: 'Moderate', desc: 'Your anxiety symptoms may be affecting daily functioning. Professional guidance is recommended.', ctaText: 'Book an Anxiety Support Session' },
      { min: 15, max: 21, label: 'Severe', desc: 'Your responses suggest high anxiety levels. Support from a mental health professional is strongly advised.', ctaText: 'Book an Anxiety Support Session' }
    ]
  },
  sleep: {
    id: 'sleep',
    title: 'Sleep Hygiene Self-Check',
    desc: 'Understand your sleep habits and routines.',
    introPrefix: 'Please respond honestly based on your usual behavior over the past 2 weeks.',
    color: 'bg-intel-dark',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Rarely', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Often', value: 3 },
      { label: 'Always', value: 4 },
    ],
    questions: [
      { id: 1, text: 'I go to bed at different times each night.' },
      { id: 2, text: 'I wake up at different times each morning.' },
      { id: 3, text: 'I use my phone, laptop, or television in bed before sleeping.' },
      { id: 4, text: 'I consume caffeine (tea, coffee, energy drinks) close to bedtime.' },
      { id: 5, text: 'I go to bed feeling stressed, worried, or emotionally upset.' },
      { id: 6, text: 'I stay in bed even when I am unable to fall asleep.' },
      { id: 7, text: 'I take long daytime naps.' },
      { id: 8, text: 'My sleep environment is uncomfortable (noise, light, temperature, or disturbance).' },
      { id: 9, text: 'I think, overthink, or worry a lot while trying to fall asleep.' },
      { id: 10, text: 'I use my bed for activities other than sleeping (studying, scrolling, eating).' },
    ],
    bands: [
      { min: 0, max: 10, label: 'Healthy Sleep Hygiene', desc: 'Your sleep habits appear supportive of healthy and restful sleep. Maintaining consistent routines and a calm sleep environment can help protect your sleep quality.', ctaText: 'Explore Wellness Resources' },
      { min: 11, max: 20, label: 'Mild Sleep Hygiene Concerns', desc: 'Your responses suggest mild sleep hygiene difficulties. Small changes in bedtime routines, screen use, or stress management can significantly improve sleep quality.', ctaText: 'Improve Sleep with Preventive Counselling' },
      { min: 21, max: 30, label: 'Moderate Sleep Hygiene Difficulties', desc: 'Your sleep habits may be interfering with your ability to fall asleep or feel rested. Supportive guidance can help you build healthier routines and improve sleep consistency.', ctaText: 'Book a Sleep Support Counselling Session' },
      { min: 31, max: 40, label: 'Severe Sleep Hygiene Issues', desc: 'Your responses indicate significant sleep hygiene difficulties that may be affecting your mood, energy, concentration, or overall well-being. Professional support is strongly recommended to address underlying patterns and restore healthy sleep.', ctaText: 'Speak to a Counsellor About Sleep Today' }
    ]
  },
  pss10: {
    id: 'pss10',
    title: 'Stress Self-Check',
    desc: 'Measure how stressful you found life recently.',
    introPrefix: 'During the last month, how often have you felt...',
    color: 'bg-[#B08968]',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Almost Never', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Fairly Often', value: 3 },
      { label: 'Very Often', value: 4 },
    ],
    questions: [
      { id: 1, text: 'Upset because of something that happened unexpectedly?' },
      { id: 2, text: 'Unable to control important things in your life?' },
      { id: 3, text: 'Nervous or stressed?' },
      { id: 4, text: 'Confident about your ability to handle personal problems?', reverseScore: true },
      { id: 5, text: 'That things were going your way?', reverseScore: true },
      { id: 6, text: 'Unable to cope with all the things that you had to do?' },
      { id: 7, text: 'Able to control irritations in your life?', reverseScore: true },
      { id: 8, text: 'That you were on top of things?', reverseScore: true },
      { id: 9, text: 'Angered because of things that were outside of your control?' },
      { id: 10, text: 'That difficulties were piling up so high that you could not overcome them?' },
    ],
    bands: [
      { min: 0, max: 13, label: 'Low Perceived Stress', desc: 'Your responses suggest low stress levels. You appear to be managing daily demands reasonably well. Continue practicing healthy coping and self-care strategies.', ctaText: 'Explore Wellness Resources' },
      { min: 14, max: 26, label: 'Moderate Perceived Stress', desc: 'Your responses indicate moderate stress levels. You may be experiencing ongoing pressure that could affect your emotional well-being if left unaddressed. Learning stress-management strategies can help restore balance.', ctaText: 'Book a Stress Management Counselling Session' },
      { min: 27, max: 40, label: 'High Perceived Stress', desc: 'Your responses suggest high stress levels that may be impacting your mood, concentration, sleep, or daily functioning. Professional support is strongly recommended to help you manage stress more effectively and prevent burnout.', ctaText: 'Speak to a Counsellor About Stress Today' }
    ]
  }
};
