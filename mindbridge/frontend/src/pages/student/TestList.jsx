import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, Spinner, EmptyState } from '../../components/ui';
import api from '../../lib/axios';

const TEST_ICONS = { 
  Depression: '😔', 
  Anxiety: '😰', 
  Stress: '😤',
  LearningPattern: '🧠',
  StudyBehaviour: '📚',
  EmotionalWellness: '💙',
  InternetUsage: '📱',
  PersonalityDimensions: '✨'
};

const TEST_COLORS = {
  Depression: 'from-indigo-500 to-purple-600',
  Anxiety:    'from-amber-500 to-orange-600',
  Stress:     'from-rose-500 to-pink-600',
  LearningPattern: 'from-blue-500 to-indigo-600',
  StudyBehaviour: 'from-emerald-500 to-teal-600',
  EmotionalWellness: 'from-sky-400 to-blue-500',
  InternetUsage: 'from-violet-500 to-fuchsia-600',
  PersonalityDimensions: 'from-fuchsia-500 to-pink-600'
};

export default function TestList() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-tests'],
    queryFn: () => api.get('/student/tests').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const tests = data?.tests || [];

  return (
    <div className="space-y-10 animate-slide-up max-w-5xl mx-auto pb-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-extrabold text-surface-900 tracking-tight">Assessments</h2>
        <p className="text-surface-500 text-lg leading-relaxed">
          These are confidential, clinically validated tools designed to help you understand yourself better. There are no right or wrong answers.
        </p>
      </div>

      {!tests.length ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-surface-200 bg-surface-50">
          <div className="text-6xl mb-6 opacity-80">📋</div>
          <h3 className="text-2xl font-bold text-surface-800 mb-2">No tests available right now</h3>
          <p className="text-surface-500">Check back later for new assessments.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map(test => (
            <Link key={test.id} to={`/student/tests/${test.id}`} className="group block">
              <div className="relative rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 bg-white h-full flex flex-col border border-surface-100">
                
                {/* Header Section */}
                <div className={`relative p-8 bg-gradient-to-br ${TEST_COLORS[test.category] || 'from-primary-600 to-accent-600'} overflow-hidden`}>
                  {/* Decorative Glass Overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full mix-blend-overlay filter blur-xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl mb-5 shadow-inner border border-white/30 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      {TEST_ICONS[test.category] || '🧠'}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{test.name}</h3>
                    <Badge className="bg-black/20 text-white border-white/20 backdrop-blur-sm mt-2">{test.category}</Badge>
                  </div>
                </div>

                {/* Body Section */}
                <div className="p-6 flex-1 flex flex-col bg-white">
                  <p className="text-surface-600 leading-relaxed mb-6 flex-1">{test.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-surface-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-surface-500 bg-surface-50 px-3 py-1.5 rounded-xl border border-surface-200">
                      <Clock className="w-4 h-4" />
                      <span>~{test.estimatedMinutes} min</span>
                    </div>
                    <span className="text-primary-600 font-bold flex items-center gap-1.5 group-hover:gap-2.5 transition-all bg-primary-50 px-4 py-1.5 rounded-xl group-hover:bg-primary-100">
                      Start <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Privacy Notice Redesign */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[2rem] p-8 border border-blue-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-inner">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-blue-900 mb-1">Your Privacy Matters</h4>
          <p className="text-blue-700 leading-relaxed">
            Your assessment results are strictly private by default. You maintain full control and can choose to share them with your school's mental health team only when you feel ready.
          </p>
        </div>
      </div>
    </div>
  );
}
