import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, LineChart, Activity, FileCheck, ArrowRight } from 'lucide-react';
import { Card, Spinner, EmptyState, Button } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import ScoreHistoryChart from '../../components/charts/ScoreHistoryChart';
import RadarChart from '../../components/charts/RadarChart';
import api from '../../lib/axios';
import { formatDate, formatScore } from '../../utils/formatters';

function ExpandableRow({ result, isOpen, toggle }) {
  const questions = result.test?.questions || [];
  const answers = result.answers || {};

  const answerList = Array.isArray(answers)
    ? answers.map(a => ({ qId: a.questionId || a.id, val: a.value ?? a }))
    : Object.entries(answers).map(([qId, val]) => ({ qId, val }));

  const getAnswerLabel = (questionId, value) => {
    const q = questions.find(q => q.id === questionId || q.id === parseInt(questionId));
    if (!q) return value;
    const opt = q.options?.find(o => o.value === value);
    return opt?.label || value;
  };

  return (
    <>
      <tr 
        className={`cursor-pointer transition-colors duration-200 border-b border-[#f0eee9] last:border-0 ${isOpen ? 'bg-[#fdfaf5]' : 'bg-white hover:bg-[#faf8f5]'}`} 
        onClick={toggle}
      >
        <td className="py-5 px-6">
          <div className="font-bold text-[#111111]" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>{result.test?.name}</div>
          <div className="text-xs font-bold text-[#8c8270] mt-1">{result.test?.category}</div>
        </td>
        <td className="py-5 px-6 text-[#555555] font-medium text-sm">{formatDate(result.takenAt)}</td>
        <td className="py-5 px-6">
          <span className="inline-flex items-center gap-1.5 bg-[#f5f2eb] px-3 py-1 rounded-lg text-[#111111] font-bold text-sm border border-[#e4dcd0]">
            {result.score}<span className="text-[#8c8270] font-medium">/{result.maxScore}</span>
          </span>
        </td>
        <td className="py-5 px-6"><SeverityBadge severity={result.severity} /></td>
        <td className="py-5 px-6">
          {result.sharedWithTherapist ? (
             <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
               <FileCheck className="w-3.5 h-3.5" /> Shared
             </span>
          ) : (
            <span className="text-[#8c8270] text-xs font-bold uppercase tracking-wider">—</span>
          )}
        </td>
        <td className="py-5 px-6 text-right">
          <div className={`inline-flex w-8 h-8 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-[#1c1a3b] text-white' : 'bg-[#f5f2eb] text-[#786c5c] hover:bg-[#e4dcd0]'}`}>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={6} className="p-0 border-b border-[#f0eee9]">
            <div className="bg-[#faf8f5] p-6 md:p-8 animate-slide-down border-t border-[#f0eee9]">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#eff0ff] text-[#5551ff] border border-[#d6d8ff] flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-[#111111] text-lg" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Question Breakdown</h4>
                  </div>
                  
                  <div className="space-y-3 bg-white rounded-2xl p-5 border border-[#e4dcd0] shadow-sm">
                    {answerList.map(({ qId, val }, i) => {
                      const q = questions.find(q => q.id === parseInt(qId));
                      return (
                        <div key={qId} className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#faf8f5] transition-colors border border-transparent hover:border-[#f0eee9]">
                          <span className="text-[#786c5c] font-bold flex-shrink-0 w-6 text-right">{i + 1}.</span>
                          <span className="text-[#333333] flex-1 leading-relaxed text-sm font-medium">{q?.text || `Question ${qId}`}</span>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="font-bold text-[#111111] text-sm bg-[#fdfaf5] px-2.5 py-1 rounded-md border border-[#e4dcd0]">{getAnswerLabel(qId, val)}</span>
                            <span className="text-[#8c8270] text-[10px] mt-1 font-bold uppercase tracking-wider">{val} pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {result.subScores && Object.keys(result.subScores).length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#fdfaf5] text-[#8c8270] border border-[#e4dcd0] flex items-center justify-center">
                        <LineChart className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-[#111111] text-lg" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Dimension Analysis</h4>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#e4dcd0] p-6 shadow-sm flex items-center justify-center min-h-[300px]">
                      <RadarChart data={result.subScores} height={250} maxScore={16} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ResultDetail() {
  const { id } = useParams();
  const [openRowId, setOpenRowId] = useState(id || null);

  const { data, isLoading } = useQuery({
    queryKey: ['student-results'],
    queryFn: () => api.get('/student/results', { params: { limit: 100 } }).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const results = data?.results || [];

  return (
    <div className="-m-6 p-6 md:p-10 min-h-[calc(100vh-64px)] bg-[#1c1a3b] text-white animate-fade-in font-sans relative">
      <div className="space-y-12 max-w-6xl mx-auto pb-12 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>My Results</h2>
            <div className="w-16 h-1 bg-[#8c8270] rounded-full mb-6" />
            <p className="text-[#b3aaa0] text-lg">
              Review your progress across {results.length} assessment{results.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        {!results.length ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-[#8c8270]/30 bg-white/5 rounded-[2rem]">
            <div className="w-24 h-24 bg-[#1c1a3b] rounded-full flex items-center justify-center shadow-inner mb-6 border border-[#5551ff]/30">
              <LineChart className="w-10 h-10 text-[#5551ff]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>No results yet</h3>
            <p className="text-[#b3aaa0] mb-8 max-w-md">
              You haven't completed any assessments. Take your first test to start tracking your mental wellness journey.
            </p>
            <Link to="/student/tests">
              <button className="bg-[#e5ddd0] text-[#786c5c] hover:bg-[#d9d0c2] hover:text-[#111111] px-8 py-4 rounded-xl font-bold shadow-lg transition-colors">
                Take an Assessment
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-[#f0eee9] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#8c8270]" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[#eff0ff] flex items-center justify-center border border-[#d6d8ff]">
                  <LineChart className="w-6 h-6 text-[#5551ff]" />
                </div>
                <h3 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Score Progression History</h3>
              </div>
              
              <div className="h-[350px] w-full">
                <ScoreHistoryChart results={results} height={350} />
              </div>
            </div>

            <div className="bg-white shadow-xl border border-[#f0eee9] rounded-[2rem] overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[#f0eee9] bg-[#faf8f5] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#e4dcd0] flex items-center justify-center text-xl shadow-sm">
                  📋
                </div>
                <h3 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Detailed Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-[#f0eee9] text-xs uppercase tracking-widest font-bold text-[#8c8270]">
                      <th className="py-5 px-6">Test Name</th>
                      <th className="py-5 px-6">Completed On</th>
                      <th className="py-5 px-6">Score</th>
                      <th className="py-5 px-6">Severity / Level</th>
                      <th className="py-5 px-6">Status</th>
                      <th className="py-5 px-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <ExpandableRow 
                        key={r.id} 
                        result={r} 
                        isOpen={openRowId === r.id}
                        toggle={() => setOpenRowId(openRowId === r.id ? null : r.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
