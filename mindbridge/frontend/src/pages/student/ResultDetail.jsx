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
        className={`cursor-pointer transition-colors duration-200 border-b border-surface-100 last:border-0 ${isOpen ? 'bg-primary-50/50' : 'hover:bg-surface-50'}`} 
        onClick={toggle}
      >
        <td className="py-4 px-6">
          <div className="font-bold text-surface-900">{result.test?.name}</div>
          <div className="text-xs text-surface-500 mt-1">{result.test?.category}</div>
        </td>
        <td className="py-4 px-6 text-surface-600 font-medium">{formatDate(result.takenAt)}</td>
        <td className="py-4 px-6">
          <span className="inline-flex items-center gap-1.5 bg-surface-100 px-3 py-1 rounded-lg text-surface-800 font-bold">
            {result.score}<span className="text-surface-400 font-medium">/{result.maxScore}</span>
          </span>
        </td>
        <td className="py-4 px-6"><SeverityBadge severity={result.severity} /></td>
        <td className="py-4 px-6">
          {result.sharedWithTherapist ? (
             <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
               <FileCheck className="w-3.5 h-3.5" /> Shared
             </span>
          ) : (
            <span className="text-surface-400 text-xs font-medium">—</span>
          )}
        </td>
        <td className="py-4 px-6 text-right">
          <div className={`inline-flex p-1.5 rounded-full transition-colors ${isOpen ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={6} className="p-0 border-b border-surface-100">
            <div className="bg-gradient-to-b from-primary-50/30 to-transparent p-6 md:p-8 animate-slide-down border-t border-primary-100/50">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-surface-900 tracking-tight">Question Breakdown</h4>
                  </div>
                  
                  <div className="space-y-3 bg-white rounded-2xl p-5 border border-surface-200 shadow-sm">
                    {answerList.map(({ qId, val }, i) => {
                      const q = questions.find(q => q.id === parseInt(qId));
                      return (
                        <div key={qId} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                          <span className="text-primary-400 font-bold flex-shrink-0 w-6 text-right">{i + 1}.</span>
                          <span className="text-surface-700 flex-1 leading-relaxed text-sm font-medium">{q?.text || `Question ${qId}`}</span>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="font-bold text-primary-700 text-sm bg-primary-50 px-2.5 py-1 rounded-md">{getAnswerLabel(qId, val)}</span>
                            <span className="text-surface-400 text-[10px] mt-1 font-semibold uppercase tracking-wider">{val} pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {result.subScores && Object.keys(result.subScores).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center">
                        <LineChart className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-surface-900 tracking-tight">Dimension Analysis</h4>
                    </div>
                    <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm flex items-center justify-center min-h-[300px]">
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
    <div className="space-y-8 animate-slide-up max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-surface-900 tracking-tight mb-2">My Results</h2>
          <p className="text-surface-500 text-lg">
            Review your progress across {results.length} assessment{results.length !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {!results.length ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-surface-200 bg-surface-50">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-surface-100">
            <LineChart className="w-10 h-10 text-surface-300" />
          </div>
          <h3 className="text-2xl font-bold text-surface-800 mb-3">No results yet</h3>
          <p className="text-surface-500 mb-8 max-w-md">
            You haven't completed any assessments. Take your first test to start tracking your mental wellness journey.
          </p>
          <Link to="/student/tests">
            <Button variant="primary" size="lg" className="rounded-xl font-bold shadow-lg shadow-primary-500/30 px-8">
              Take an Assessment
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card className="p-8 shadow-xl border-0 rounded-[2rem] bg-white relative overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 tracking-tight">Score Progression History</h3>
            </div>
            
            <div className="h-[300px] w-full">
              <ScoreHistoryChart results={results} height={300} />
            </div>
          </Card>

          <Card padding={false} className="shadow-lg border-surface-200 rounded-[2rem] overflow-hidden bg-white">
            <div className="p-6 border-b border-surface-100 bg-surface-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-200 to-surface-300 flex items-center justify-center shadow-inner border border-white">
                📋
              </div>
              <h3 className="text-xl font-bold text-surface-900 tracking-tight">Detailed Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50/80 border-b border-surface-200 text-xs uppercase tracking-wider font-bold text-surface-500">
                    <th className="py-4 px-6 font-semibold">Test Name</th>
                    <th className="py-4 px-6 font-semibold">Completed On</th>
                    <th className="py-4 px-6 font-semibold">Score</th>
                    <th className="py-4 px-6 font-semibold">Severity / Level</th>
                    <th className="py-4 px-6 font-semibold">Status</th>
                    <th className="py-4 px-6"></th>
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
          </Card>
        </>
      )}
    </div>
  );
}
