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

export default function TestList() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-tests'],
    queryFn: () => api.get('/student/tests').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const tests = data?.tests || [];

  return (
    <div className="-m-6 p-6 md:p-10 min-h-[calc(100vh-64px)] bg-[#1c1a3b] text-white animate-fade-in font-sans relative">
      <div className="space-y-12 max-w-5xl mx-auto pb-12 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto pt-8">
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Assessments</h2>
          <div className="w-16 h-1 bg-[#8c8270] mx-auto rounded-full mb-6" />
          <p className="text-lg text-[#b3aaa0] leading-relaxed">
            These are confidential, clinically validated tools designed to help you understand yourself better. There are no right or wrong answers.
          </p>
        </div>

        {!tests.length ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-[#8c8270]/30 bg-white/5 mx-auto rounded-[2rem]">
            <div className="text-5xl mb-6 opacity-50">📋</div>
            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>No tests available right now</h3>
            <p className="text-[#b3aaa0]">Check back later for new assessments.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tests.map(test => (
              <Link key={test.id} to={`/student/tests/${test.id}`} className="group block h-full">
                <div className="relative rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 bg-white h-full flex flex-col border border-[#f0eee9]">
                  
                  {/* Header Section */}
                  <div className="p-8 pb-4 flex flex-col items-center text-center border-b border-[#f0eee9] bg-[#faf8f5]">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm border border-[#e4dcd0] group-hover:scale-110 transition-transform duration-300">
                      {TEST_ICONS[test.category] || '📋'}
                    </div>
                    <h3 className="text-xl font-bold text-[#111111] mb-1 leading-tight" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
                      {test.name}
                    </h3>
                  </div>

                  {/* Body Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-[#555555] leading-relaxed mb-6 flex-1 line-clamp-3 text-sm">{test.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#8c8270] bg-[#f5f2eb] px-3 py-1.5 rounded-lg border border-[#e4dcd0]">
                        <Clock className="w-3 h-3" />
                        <span>~{test.estimatedMinutes}m</span>
                      </div>
                      <span className="text-[#111111] font-bold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                        Start <ArrowRight className="w-4 h-4 text-[#8c8270]" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Privacy Notice Redesign */}
        <div className="mt-12 bg-white rounded-[2rem] p-8 border border-[#f0eee9] shadow-xl flex flex-col md:flex-row items-center gap-6 group hover:shadow-2xl transition-all">
          <div className="w-16 h-16 rounded-2xl bg-[#eff0ff] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#d6d8ff] group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8 text-[#5551ff]" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xl font-bold text-[#111111] mb-2" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Your Privacy Matters</h4>
            <p className="text-[#555555] leading-relaxed">
              Your assessment results are strictly private by default. You maintain full control and can choose to share them with your school's mental health team only when you feel ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
