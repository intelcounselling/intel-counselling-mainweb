import React, { useState } from 'react';
import { Download, Trash2, ShieldCheck, Loader2, MessageSquareWarning } from 'lucide-react';
import { apiClient } from '../utils/api';
import { authHeaders, clearAuthSession } from '../utils/auth';

// The person's rights over their data (DPDP Act): get a copy, delete everything,
// and know who to complain to.
const PrivacyControls: React.FC = () => {
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState<'download' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy('download');
    setError(null);
    try {
      const res = await fetch('/api/my-data', { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'intel-counselling-my-data.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setError('Could not prepare your data. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    setError(null);
    try {
      await apiClient.delete('/api/account', { body: JSON.stringify({ confirm: phrase }) });
      clearAuthSession();
      window.location.href = '/';
    } catch (e: any) {
      setError(e?.data?.error || 'Could not delete your account. Please try again.');
      setBusy(null);
    }
  };

  return (
    <section className="bg-white p-6 md:p-7 rounded-[28px] shadow-sm border border-black/5 mt-10">
      <h2 className="font-bold text-intel-dark serif text-lg flex items-center gap-2"><ShieldCheck size={18} className="text-serene-green" /> Your data & privacy</h2>
      <p className="text-sm text-intel-dark/60 mt-1">You can get a copy of everything we hold about you, or delete your account and results at any time.</p>

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button onClick={download} disabled={!!busy} className="px-5 py-3 bg-white border border-black/10 rounded-xl text-sm font-semibold text-intel-dark hover:border-serene-green flex items-center justify-center gap-2">
          {busy === 'download' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download my data
        </button>
        <button onClick={() => setConfirming((v) => !v)} className="px-5 py-3 bg-white border border-red-200 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 flex items-center justify-center gap-2">
          <Trash2 size={14} /> Delete my account
        </button>
        <a href="/grievance" className="px-5 py-3 text-sm font-semibold text-intel-dark/70 hover:text-intel-dark flex items-center justify-center gap-2">
          <MessageSquareWarning size={14} /> Raise a privacy concern
        </a>
      </div>

      {confirming && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-800">
            This permanently deletes your account, intake details and every result. Payment records are kept (with your name removed) because tax law requires it. This cannot be undone.
          </p>
          <label className="block mt-4 text-xs font-bold text-red-800">Type <strong>DELETE MY ACCOUNT</strong> to confirm</label>
          <input value={phrase} onChange={(e) => setPhrase(e.target.value)} className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm" />
          <button onClick={remove} disabled={phrase !== 'DELETE MY ACCOUNT' || !!busy} className="mt-3 px-5 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
            {busy === 'delete' && <Loader2 size={14} className="animate-spin" />} Permanently delete
          </button>
        </div>
      )}
    </section>
  );
};

export default PrivacyControls;
