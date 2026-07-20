import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Card, Spinner, EmptyState } from '../../components/ui';
import api from '../../lib/axios';

const TEST_ICONS = { Depression: '😔', Anxiety: '😰', Stress: '😤' };
const TEST_COLORS = {
  Depression: 'from-indigo-500 to-purple-600',
  Anxiety:    'from-amber-500 to-orange-600',
  Stress:     'from-rose-500 to-pink-600',
};

export default function TestList() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-tests'],
    queryFn: () => api.get('/student/tests').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const tests = data?.tests || [];

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Assessments</h2>
        <p className="text-surface-500 mt-1">
          These are confidential, clinically validated tools. There are no right or wrong answers.
        </p>
      </div>

      {!tests.length ? (
        <EmptyState icon="📋" title="No tests available" description="Check back later." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.map(test => (
            <Link key={test.id} to={`/student/tests/${test.id}`} className="group">
              <div className="rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1">
                <div className={`bg-gradient-to-br ${TEST_COLORS[test.category] || 'from-primary-600 to-accent-600'} p-6`}>
                  <span className="text-5xl">{TEST_ICONS[test.category] || '🧠'}</span>
                  <h3 className="text-xl font-bold text-white mt-4">{test.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{test.category} Assessment</p>
                </div>
                <div className="bg-white p-5">
                  <p className="text-sm text-surface-600 leading-relaxed">{test.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5 text-xs text-surface-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{test.estimatedMinutes} minutes</span>
                    </div>
                    <span className="text-sm text-primary-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Start <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm text-blue-800 font-medium mb-1">🔒 Your Privacy Matters</p>
        <p className="text-sm text-blue-600">
          Your results are private by default. You can choose to share them with your school's
          mental health team after completing each assessment.
        </p>
      </div>
    </div>
  );
}
