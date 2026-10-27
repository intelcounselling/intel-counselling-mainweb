import { Lightbulb, BookOpen, Heart, Smartphone, Sparkles, CloudSun, Wind, type LucideIcon } from 'lucide-react';

// Intel Student Assessments: one purchase unlocks Module A (5 Intel tests) and
// Module B (those + PHQ-9 and GAD-7). The backend owns questions and scoring
// (backend/src/intell.js); this is just how each test looks on the site.
export interface IntellMeta {
  label: string;
  icon: LucideIcon;
  color: string; // background of the icon tile
  blurb: string;
  module: 'A' | 'B';
}

// Tile colours are earthy tones picked to sit on the site's cream background
// (stock Tailwind amber/sky/violet read as off-brand next to brass and green).
export const INTELL_META: Record<string, IntellMeta> = {
  intell_lp: { label: 'How you learn', icon: Lightbulb, color: 'bg-[#B8894F]', blurb: 'Do you learn best by seeing, hearing or doing?', module: 'A' },
  intell_sb: { label: 'Study habits', icon: BookOpen, color: 'bg-[#3E5C76]', blurb: 'Focus, planning and how consistently you study.', module: 'A' },
  intell_ew: { label: 'Feelings & stress', icon: Heart, color: 'bg-[#B4676E]', blurb: 'Your mood, stress level and how you cope.', module: 'A' },
  intell_iu: { label: 'Screen time', icon: Smartphone, color: 'bg-[#6E5675]', blurb: 'How phones, games and social media fit into your day.', module: 'A' },
  intell_pd: { label: 'Personality', icon: Sparkles, color: 'bg-[#5E7F67]', blurb: 'Confidence, responsibility and getting along with others.', module: 'A' },
  phq9: { label: 'Mood check', icon: CloudSun, color: 'bg-[#9C5B47]', blurb: 'A standard screening for low mood over the last two weeks.', module: 'B' },
  gad7: { label: 'Worry check', icon: Wind, color: 'bg-[#2D6A4F]', blurb: 'A standard screening for worry and nervousness.', module: 'B' },
};

export const INTELL_ORDER = Object.keys(INTELL_META);
export const isIntellTest = (id?: string | null) => !!id && /^intell_/.test(id);

// Where each test runs: the Intel ones in their own runner, PHQ-9/GAD-7 in the
// site's existing screening flow. ?from=intell brings the user back to the hub.
export const intellTestPath = (id: string) => `/assessments/${id}?from=intell`;

export const INTELL_HUB = '/intell-assessment';

export function IntellIcon({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'lg' }) {
  const m = INTELL_META[id];
  if (!m) return null;
  const Icon = m.icon;
  const box = size === 'lg' ? 'w-16 h-16 rounded-3xl' : size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-12 h-12 rounded-2xl';
  const px = size === 'lg' ? 30 : size === 'sm' ? 16 : 22;
  return (
    <span className={`${box} ${m.color} text-white inline-flex items-center justify-center shrink-0`} aria-hidden="true">
      <Icon size={px} />
    </span>
  );
}

// Level colours shared by the profile and the result screen
export const LEVEL_STYLE: Record<string, string> = {
  ok: 'bg-green-50 text-green-700 border-green-200',
  watch: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  concern: 'bg-orange-50 text-orange-700 border-orange-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

export const capitalise = (s?: string | null) => String(s || '').replace(/^\[Validity Warning\]\s*/i, '').replace(/^./, (c) => c.toUpperCase());
