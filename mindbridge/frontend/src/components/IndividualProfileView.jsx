import { Link } from 'react-router-dom';
import { CalendarPlus, Info } from 'lucide-react';
import { Card } from './ui';
import { formatDate, cleanSeverity } from '../utils/formatters';

const LEVEL_BADGE = {
  ok: 'bg-green-50 text-green-700 border-green-200',
  watch: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  concern: 'bg-orange-50 text-orange-700 border-orange-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};
const LEVEL_TEXT = { ok: 'text-green-700', watch: 'text-yellow-700', concern: 'text-orange-700', high: 'text-red-700' };
const REC_BOX = {
  none: 'bg-green-50 border-green-200 text-green-900',
  monitor: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  counselling: 'bg-orange-50 border-orange-200 text-orange-900',
  referral: 'bg-red-50 border-red-200 text-red-900',
};

const Section = ({ title, children }) => (
  <Card>
    <h3 className="text-base font-semibold text-surface-900 mb-3">{title}</h3>
    {children}
  </Card>
);

/**
 * Integrated psychological profile (see backend/src/mindbridge/services/individualProfile.js).
 * `bookHref` — when given, counselling / referral recommendations link to it.
 * `showRecommendation={false}` hides the recommendation block (Module A has none).
 */
export default function IndividualProfileView({ profile, showRecommendation = true, bookHref }) {
  if (!profile) return null;
  const rec = profile.recommendation;
  const needsSession = rec.level === 'counselling' || rec.level === 'referral';

  return (
    <div className="space-y-5">
      <p className="text-sm text-surface-500">{profile.summary}</p>

      {!profile.complete && profile.completed > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Not taken yet: {profile.missingNames.join(', ')}. The profile becomes complete once every test is done.</span>
        </div>
      )}

      {showRecommendation && profile.completed > 0 && (
        <div className={`rounded-2xl border p-5 ${REC_BOX[rec.level]}`}>
          <p className="font-semibold text-lg">{rec.headline}</p>
          <ul className="mt-2 space-y-1.5 text-sm list-disc pl-5">
            {rec.actions.map((a) => <li key={a}>{a}</li>)}
          </ul>
          {needsSession && bookHref && (
            <Link to={bookHref} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">
              <CalendarPlus className="w-4 h-4" /> Book a counselling session
            </Link>
          )}
        </div>
      )}

      {profile.concerns.length > 0 && (
        <Section title="Risks and concerns">
          <ul className="space-y-2">
            {profile.concerns.map((c) => (
              <li key={c.category} className="text-sm">
                <span className={`font-semibold ${LEVEL_TEXT[c.level]}`}>{c.area}</span>
                <span className="text-surface-600"> — {c.detail}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {profile.interventions.length > 0 && (
        <Section title="Areas requiring intervention">
          <ul className="space-y-1.5 text-sm text-surface-700 list-disc pl-5">
            {profile.interventions.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </Section>
      )}

      {profile.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1.5 text-sm text-surface-700 list-disc pl-5">
            {profile.strengths.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </Section>
      )}

      <Section title="Test-wise interpretation">
        <div className="divide-y divide-surface-100">
          {profile.tests.map((t) => (
            <div key={t.category} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-surface-900">{t.name}</p>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${LEVEL_BADGE[t.level]}`}>{cleanSeverity(t.severity)}</span>
              </div>
              <p className="text-xs text-surface-400 mt-0.5">
                {t.category === 'LearningPattern' && t.subScores
                  ? `Visual ${t.subScores.Visual} · Auditory ${t.subScores.Auditory} · Kinesthetic ${t.subScores.Kinesthetic}`
                  : `Score ${t.score}/${t.maxScore}`} · {formatDate(t.takenAt)}
              </p>
              <p className="text-sm text-surface-600 mt-1.5">{t.note}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
