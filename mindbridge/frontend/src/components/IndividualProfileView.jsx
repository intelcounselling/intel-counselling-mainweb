import { Link } from 'react-router-dom';
import {
  CalendarPlus, Info, ShieldAlert, Target, Star, ListChecks, CheckCircle2, Eye, HeartHandshake, Siren,
} from 'lucide-react';
import { Card } from './ui';
import { formatDate, cleanSeverity } from '../utils/formatters';
import { TestIcon } from '../utils/testMeta';

const LEVEL_BADGE = {
  ok: 'bg-green-50 text-green-700 border-green-200',
  watch: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  concern: 'bg-orange-50 text-orange-700 border-orange-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};
const LEVEL_TEXT = { ok: 'text-green-700', watch: 'text-yellow-700', concern: 'text-orange-700', high: 'text-red-700' };
const REC = {
  none: { box: 'bg-green-50 border-green-200 text-green-900', icon: CheckCircle2, chip: 'bg-green-600' },
  monitor: { box: 'bg-yellow-50 border-yellow-200 text-yellow-900', icon: Eye, chip: 'bg-yellow-500' },
  counselling: { box: 'bg-orange-50 border-orange-200 text-orange-900', icon: HeartHandshake, chip: 'bg-orange-500' },
  referral: { box: 'bg-red-50 border-red-200 text-red-900', icon: Siren, chip: 'bg-red-600' },
};

function Section({ icon: Icon, tint, title, children }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-surface-900 mb-3 flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint}`}><Icon className="w-4 h-4" /></span>
        {title}
      </h3>
      {children}
    </Card>
  );
}

/**
 * Integrated psychological profile (see backend/src/mindbridge/services/individualProfile.js).
 * `bookHref` — when given, counselling / referral recommendations link to it.
 */
export default function IndividualProfileView({ profile, showRecommendation = true, bookHref }) {
  if (!profile) return null;
  const rec = profile.recommendation;
  const recStyle = REC[rec.level] || REC.none;
  const RecIcon = recStyle.icon;
  const needsSession = rec.level === 'counselling' || rec.level === 'referral';

  return (
    <div className="space-y-5">
      <p className="text-sm text-surface-500">{profile.summary}</p>

      {!profile.complete && profile.completed > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Still to do: {profile.missingNames.join(', ')}. Your profile is complete once every test is done.</span>
        </div>
      )}

      {showRecommendation && profile.completed > 0 && (
        <div className={`rounded-2xl border p-5 flex gap-4 ${recStyle.box}`}>
          <span className={`w-11 h-11 rounded-xl text-white flex items-center justify-center flex-shrink-0 ${recStyle.chip}`}><RecIcon className="w-5 h-5" /></span>
          <div className="min-w-0">
            <p className="font-semibold text-lg leading-snug">{rec.headline}</p>
            <ul className="mt-2 space-y-1.5 text-sm list-disc pl-5">
              {rec.actions.map((a) => <li key={a}>{a}</li>)}
            </ul>
            {needsSession && bookHref && (
              <Link to={bookHref} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">
                <CalendarPlus className="w-4 h-4" /> Book a counselling session
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {profile.strengths.length > 0 && (
          <Section icon={Star} tint="bg-accent-100 text-accent-700" title="Strengths">
            <ul className="space-y-2 text-sm text-surface-700">
              {profile.strengths.map((s) => (
                <li key={s} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />{s}</li>
              ))}
            </ul>
          </Section>
        )}

        {profile.concerns.length > 0 && (
          <Section icon={ShieldAlert} tint="bg-red-50 text-red-600" title="Risks and concerns">
            <ul className="space-y-2.5">
              {profile.concerns.map((c) => (
                <li key={c.category} className="flex gap-2.5 text-sm">
                  <TestIcon category={c.category} size="sm" />
                  <span>
                    <span className={`font-semibold ${LEVEL_TEXT[c.level]}`}>{c.area}</span>
                    <span className="text-surface-600"> — {c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {profile.interventions.length > 0 && (
          <Section icon={Target} tint="bg-primary-50 text-primary-700" title="Areas requiring intervention">
            <ul className="space-y-2 text-sm text-surface-700">
              {profile.interventions.map((i) => (
                <li key={i} className="flex gap-2"><Target className="w-4 h-4 mt-0.5 text-primary-600 flex-shrink-0" />{i}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <Section icon={ListChecks} tint="bg-surface-100 text-surface-700" title="Test-wise interpretation">
        <div className="grid sm:grid-cols-2 gap-3">
          {profile.tests.map((t) => (
            <div key={t.category} className="rounded-xl border border-surface-100 bg-surface-50/60 p-4">
              <div className="flex items-start gap-3">
                <TestIcon category={t.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-surface-900 leading-snug">{t.name}</p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {t.category === 'LearningPattern' && t.subScores
                      ? `Visual ${t.subScores.Visual} · Auditory ${t.subScores.Auditory} · Kinesthetic ${t.subScores.Kinesthetic}`
                      : `Score ${t.score}/${t.maxScore}`} · {formatDate(t.takenAt)}
                  </p>
                </div>
              </div>
              <span className={`mt-3 inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${LEVEL_BADGE[t.level]}`}>{cleanSeverity(t.severity).replace(/^./, (ch) => ch.toUpperCase())}</span>
              <p className="text-sm text-surface-600 mt-2">{t.note}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
