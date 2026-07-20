import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, Spinner, EmptyState } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import ScoreHistoryChart from '../../components/charts/ScoreHistoryChart';
import api from '../../lib/axios';
import { formatDate } from '../../utils/formatters';

export default function ChildResults() {
  const { childId } = useParams();

  const { data: childData } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get('/parent/children').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['parent-child-results', childId],
    queryFn: () => api.get(`/parent/children/${childId}/results`).then(r => r.data),
  });

  const child = childData?.children?.find(c => c.id === childId);
  const results = data?.results || [];

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/parent" className="p-2 hover:bg-surface-200 rounded-xl text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">
            {child ? `${child.firstName}'s Results` : 'Assessment Results'}
          </h2>
          <p className="text-surface-500">{results.length} assessments taken</p>
        </div>
      </div>

      {results.length > 0 && (
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Score History</h3>
          <ScoreHistoryChart results={results} height={220} />
        </Card>
      )}

      <Card padding={false}>
        {!results.length ? (
          <EmptyState icon="📋" title="No assessments yet" description="No tests have been taken yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Test</th><th>Category</th><th>Date</th><th>Score</th><th>Severity</th><th>Shared</th></tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.test?.name}</td>
                    <td className="text-surface-500">{r.test?.category}</td>
                    <td className="text-surface-500">{formatDate(r.takenAt)}</td>
                    <td>
                      <span className="font-bold text-surface-900">{r.score}</span>
                      <span className="text-surface-400">/{r.maxScore}</span>
                    </td>
                    <td><SeverityBadge severity={r.severity} /></td>
                    <td>{r.sharedWithTherapist ? <span className="text-green-600 text-xs font-medium">✓ Shared</span> : <span className="text-surface-400 text-xs">Private</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
