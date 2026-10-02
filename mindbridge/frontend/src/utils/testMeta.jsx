import { Lightbulb, BookOpen, Heart, Smartphone, Sparkles, CloudSun, Wind, ClipboardList } from 'lucide-react';

// Icon, colour and a friendly one-liner for each assessment category.
// Class strings are written out in full so Tailwind keeps them.
export const TEST_META = {
  LearningPattern: { icon: Lightbulb, label: 'How you learn', chip: 'bg-amber-100 text-amber-700', blurb: 'Find out if you learn best by seeing, hearing or doing.' },
  StudyBehaviour: { icon: BookOpen, label: 'Study habits', chip: 'bg-sky-100 text-sky-700', blurb: 'Focus, planning and how consistently you study.' },
  EmotionalWellness: { icon: Heart, label: 'Feelings & stress', chip: 'bg-rose-100 text-rose-600', blurb: 'Your mood, stress level and how you cope.' },
  InternetUsage: { icon: Smartphone, label: 'Screen time', chip: 'bg-violet-100 text-violet-700', blurb: 'How phones, games and social media fit into your day.' },
  PersonalityDimensions: { icon: Sparkles, label: 'Personality', chip: 'bg-emerald-100 text-emerald-700', blurb: 'Confidence, responsibility and getting along with others.' },
  Depression: { icon: CloudSun, label: 'Mood check (PHQ-9)', chip: 'bg-indigo-100 text-indigo-700', blurb: 'A standard screening for low mood over the last two weeks.' },
  Anxiety: { icon: Wind, label: 'Worry check (GAD-7)', chip: 'bg-teal-100 text-teal-700', blurb: 'A standard screening for worry and nervousness.' },
};

const FALLBACK = { icon: ClipboardList, label: 'Assessment', chip: 'bg-surface-100 text-surface-600', blurb: '' };

export const testMeta = (category) => TEST_META[category] || FALLBACK;

// Coloured rounded icon tile used across the portal
export function TestIcon({ category, size = 'md' }) {
  const m = testMeta(category);
  const Icon = m.icon;
  const box = size === 'lg' ? 'w-14 h-14 rounded-2xl' : size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-xl';
  const ic = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <span className={`${box} ${m.chip} inline-flex items-center justify-center flex-shrink-0`} aria-hidden="true">
      <Icon className={ic} />
    </span>
  );
}
