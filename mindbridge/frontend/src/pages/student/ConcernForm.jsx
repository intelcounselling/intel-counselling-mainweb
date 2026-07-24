import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { Card, Button, EmptyState, Spinner } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatRelative, getStatusColor } from '../../utils/formatters';

export default function ConcernForm() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['student-concerns'],
    queryFn: () => api.get('/student/concerns').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/student/concerns', { message }),
    onSuccess: () => {
      success('Your concern has been sent to the mental health team.');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['student-concerns'] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to submit'),
  });

  const concerns = data?.concerns || [];

  return (
    <div className="-m-6 p-6 md:p-10 min-h-[calc(100vh-64px)] bg-[#1c1a3b] text-white animate-fade-in font-sans relative">
      <div className="w-full max-w-3xl mx-auto pb-12 space-y-12 relative z-10 pt-8">
        <div>
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Share a Concern</h2>
          <div className="w-16 h-1 bg-[#8c8270] rounded-full mb-6" />
          <p className="text-[#b3aaa0] text-lg">
            Your message goes directly to your school's mental health team. It is completely confidential.
          </p>
        </div>

        {/* Submit form */}
        <div className="bg-white rounded-[2rem] border border-[#f0eee9] p-8 md:p-10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
            <MessageSquare className="w-32 h-32 text-[#1c1a3b]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#eff0ff] border border-[#d6d8ff] flex items-center justify-center shadow-sm">
                <MessageSquare className="w-7 h-7 text-[#5551ff]" />
              </div>
              <h3 className="text-3xl font-bold text-[#111111]" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Something on your mind?</h3>
            </div>
            <p className="text-[#555555] text-base mb-8 max-w-lg leading-relaxed">
              Whatever you're feeling — stress, anxiety, struggles at home or school — write it here. You don't have to face it alone.
            </p>
            <textarea
              className="w-full bg-[#faf8f5] border border-[#e4dcd0] rounded-2xl p-6 text-[#111111] placeholder-[#b3aaa0] resize-none focus:outline-none focus:border-[#8c8270] focus:ring-1 focus:ring-[#8c8270] transition-colors shadow-inner"
              rows={5}
              placeholder="Write what's on your mind..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <div className="flex justify-end mt-6">
              <button
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${!message.trim() ? 'bg-[#f0eee9] text-[#b3aaa0] cursor-not-allowed' : 'bg-[#1c1a3b] text-white hover:bg-[#2c2957]'}`}
                disabled={!message.trim() || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? <Spinner size="sm" color="white" /> : <Send className="w-5 h-5" />}
                Send Concern
              </button>
            </div>
          </div>
        </div>

        {/* Past concerns */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Your Previous Concerns</h3>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner color="white" /></div>
          ) : !concerns.length ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-[#8c8270]/30 bg-white/5 rounded-[2rem]">
              <div className="text-4xl mb-4 opacity-50">💭</div>
              <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>No concerns submitted yet</h4>
              <p className="text-[#b3aaa0]">When you share something, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {concerns.map(c => (
                <div key={c.id} className="bg-white border-l-[6px] border-l-[#8c8270] rounded-[1.5rem] p-6 shadow-xl flex items-start justify-between gap-6 hover:shadow-2xl transition-shadow">
                  <div className="flex-1">
                    <p className="text-[#111111] leading-relaxed font-medium">{c.message}</p>
                    <p className="text-[10px] text-[#8c8270] font-bold mt-3 uppercase tracking-wider">{formatRelative(c.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex-shrink-0 uppercase tracking-wide ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#f5f2eb] text-[#8c8270] border-[#e4dcd0]'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/20 rounded-[2rem] p-6 flex gap-4 items-start">
          <div className="text-2xl mt-1 opacity-80">🔒</div>
          <p className="text-sm text-[#b3aaa0] leading-relaxed">
            <strong className="text-white">Privacy:</strong> Your concerns are only visible to your school's mental health team. They are not shared with teachers, parents, or other students without your explicit consent.
          </p>
        </div>
      </div>
    </div>
  );
}
