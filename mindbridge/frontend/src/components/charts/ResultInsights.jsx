import { getLearningPreference, hasValidityFlag, VALIDITY_MESSAGE } from '../../utils/formatters';

const PREF_BAR = {
  'Strong Preference': 'bg-green-500',
  'Moderate Preference': 'bg-yellow-400',
  'Low Preference': 'bg-orange-400',
};

/**
 * Extra context for an INTELL result:
 *  - Learning Pattern: Visual / Auditory / Kinesthetic scores (each 4–20) with
 *    their preference level — the 12-item total means nothing on its own.
 *  - Validity: 80%+ answers marked "5" → possible self-presentation bias.
 * Renders nothing for results that have neither.
 */
export default function ResultInsights({ result, tone = 'light' }) {
  if (!result) return null;
  const category = result.test?.category;
  const dims = category === 'LearningPattern' && result.subScores ? Object.entries(result.subScores) : [];
  const validity = hasValidityFlag(result);
  if (!dims.length && !validity) return null;

  const dark = tone === 'dark';
  return (
    <div className="space-y-3 text-left">
      {dims.length > 0 && (
        <div className={dark ? 'rounded-2xl bg-white/5 border border-white/10 p-5' : 'rounded-xl bg-surface-50 border border-surface-100 p-4'}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? 'text-indigo-300' : 'text-surface-500'}`}>
            Learning preferences
          </p>
          <div className="space-y-3">
            {dims.map(([dim, score]) => {
              const pref = getLearningPreference(score);
              return (
                <div key={dim}>
                  <div className={`flex items-center justify-between text-sm mb-1 ${dark ? 'text-white' : 'text-surface-800'}`}>
                    <span className="font-semibold">{dim}</span>
                    <span className={dark ? 'text-indigo-200' : 'text-surface-500'}>
                      {score}/20 · {pref}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-surface-200'}`}>
                    <div className={`h-full rounded-full ${PREF_BAR[pref]}`} style={{ width: `${(score / 20) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {validity && (
        <div
          role="note"
          className={dark
            ? 'rounded-2xl bg-amber-500/15 border border-amber-400/30 p-4 text-sm text-amber-100'
            : 'rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800'}
        >
          <p className="font-semibold mb-0.5">Possible self-presentation bias</p>
          <p>{VALIDITY_MESSAGE}</p>
        </div>
      )}
    </div>
  );
}
