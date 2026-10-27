import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Share2, ShieldCheck } from 'lucide-react';
import api from '../lib/axios';

// The student decides whether the counsellor may see a result. A result that
// flagged a risk is always visible to the counsellor (safety exception).
export default function ShareToggle({ result }) {
  const qc = useQueryClient();
  const [shared, setShared] = useState(!!result.sharedWithTherapist);
  const [saving, setSaving] = useState(false);

  if (result.isLow) {
    return (
      <p className="flex items-start gap-2 text-sm text-[#555555]">
        <ShieldCheck className="w-4 h-4 mt-0.5 text-[#8c8270] flex-shrink-0" />
        Our counsellor can see this result because your answers suggest you may need some support. They'll reach out to check in.
      </p>
    );
  }

  const toggle = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/student/results/${result.id}/share`, { shared: !shared });
      setShared(data.shared);
      qc.invalidateQueries({ queryKey: ['student-results'] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-[#e4dcd0] bg-white px-4 py-3 cursor-pointer">
      <span className="flex items-center gap-2 text-sm text-[#111111]">
        <Share2 className="w-4 h-4 text-[#8c8270]" />
        Share this result with the counsellor
      </span>
      <input type="checkbox" checked={shared} disabled={saving} onChange={toggle} className="h-5 w-5 accent-[#1c1a3b]" aria-label="Share this result with the counsellor" />
    </label>
  );
}
