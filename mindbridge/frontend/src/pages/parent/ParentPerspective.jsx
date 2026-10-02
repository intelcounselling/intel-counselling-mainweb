import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState, PageHeader, ListSkeleton } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';

const DEFAULT_OPTIONS = [
  { label: 'Never', value: 1 },
  { label: 'Rarely', value: 2 },
  { label: 'Sometimes', value: 3 },
  { label: 'Often', value: 4 },
  { label: 'Always', value: 5 },
];

// Package 2: the parent answers the same questions their child answered,
// describing how *they* see their child. Feeds the comparison report.
export default function ParentPerspective() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [test, setTest] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const comparisonPath = `/parent/children/${childId}/comparison`;

  const { data, isLoading } = useQuery({
    queryKey: ['perspective-tests', childId],
    queryFn: () => api.get(`/parent/children/${childId}/perspective-tests`).then(r => r.data),
  });

  const submit = useMutation({
    mutationFn: () => api.post('/parent/perspective', {
      childId,
      testId: test.id,
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-report', childId] });
      toast.success('Thanks — your perspective has been added to the report.');
      navigate(comparisonPath);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not save your answers. Please try again.'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader backTo={comparisonPath} title="Add your perspective" />
        <Card padding={false}><ListSkeleton rows={4} /></Card>
      </div>
    );
  }

  // Step 1: choose which assessment to answer
  if (!test) {
    const tests = data?.tests || [];
    return (
      <div className="space-y-6 animate-slide-up max-w-3xl">
        <PageHeader
          backTo={comparisonPath}
          title="Add your perspective"
          description="Answer the same questions your child answered — thinking about how you see them. Your answers are compared side by side in the report."
        />
        {!tests.length ? (
          <Card>
            <EmptyState
              icon="📝"
              title="Nothing to compare yet"
              description="Once your child completes an assessment, you can add your perspective on it here."
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tests.map(t => (
              <button
                key={t.id}
                onClick={() => { setTest(t); setCurrent(0); setAnswers({}); }}
                className="text-left bg-white rounded-xl border border-surface-200 p-5 hover:border-primary-400 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-surface-900">{t.name}</p>
                <p className="text-sm text-surface-500 mt-1">{t.questions.length} questions</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2: answer the questions one at a time
  const questions = test.questions;
  const q = questions[current];
  const isLast = current === questions.length - 1;
  const answered = answers[q?.id] !== undefined;

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <PageHeader
        title={test.name}
        description={`Your perspective · Question ${current + 1} of ${questions.length}`}
        actions={<Button variant="secondary" size="sm" onClick={() => setTest(null)}>Choose another</Button>}
      />
      <Card>
        <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-primary-600 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Thinking about your child</p>
        <h2 className="text-lg sm:text-xl font-semibold text-surface-900 mb-6">{q?.text}</h2>
        <div className="space-y-2">
          {(q?.options?.length ? q.options : DEFAULT_OPTIONS).map(opt => {
            const selected = answers[q.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.value }))}
                aria-pressed={selected}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${selected ? 'border-primary-600 bg-primary-50 font-semibold' : 'border-surface-200 hover:border-surface-300'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="secondary" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>Back</Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!answered}
            loading={submit.isPending}
            onClick={() => (isLast ? submit.mutate() : setCurrent(c => c + 1))}
          >
            {isLast ? 'Submit my perspective' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
