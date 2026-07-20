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
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Share a Concern</h2>
        <p className="text-surface-500 mt-1">
          Your message goes directly to your school's mental health team. It is confidential.
        </p>
      </div>

      {/* Submit form */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b, #0c4a6e)' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-primary-300" />
            <p className="text-white font-semibold">Something on your mind?</p>
          </div>
          <p className="text-primary-300 text-sm mb-5">
            Whatever you're feeling — stress, anxiety, struggles at home or school — write it here.
            You don't have to face it alone.
          </p>
          <textarea
            className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
            rows={5}
            placeholder="Write what's on your mind..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex justify-end mt-3">
            <Button
              variant="primary"
              className="bg-white text-primary-700 hover:bg-white/90"
              icon={<Send className="w-4 h-4" />}
              loading={mutation.isPending}
              disabled={!message.trim()}
              onClick={() => mutation.mutate()}
            >
              Send Concern
            </Button>
          </div>
        </div>
      </div>

      {/* Past concerns */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900 mb-4">Your Previous Concerns</h3>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !concerns.length ? (
          <EmptyState icon="💭" title="No concerns submitted yet"
            description="When you share something, it will appear here." />
        ) : (
          <div className="space-y-4">
            {concerns.map(c => (
              <Card key={c.id} className="border-l-4 border-l-primary-400">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-surface-800 leading-relaxed">{c.message}</p>
                    <p className="text-xs text-surface-400 mt-2">{formatRelative(c.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
        <p className="text-sm text-surface-600">
          🔒 <strong>Privacy:</strong> Your concerns are only visible to your school's mental health team.
          They are not shared with teachers or other students.
        </p>
      </div>
    </div>
  );
}
