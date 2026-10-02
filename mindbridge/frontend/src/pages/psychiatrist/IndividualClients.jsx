import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card, Spinner, PageHeader, EmptyState } from '../../components/ui';
import api from '../../lib/axios';
import { formatDate, formatDateTime } from '../../utils/formatters';

// Counsellor view of self-registered clients (not tied to any school)
export default function IndividualClients() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['psych-individuals'],
    queryFn: () => api.get('/psychiatrist/individuals').then((r) => r.data.clients),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const q = search.trim().toLowerCase();
  const clients = (data || []).filter((c) => !q || `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q));

  return (
    <div className="space-y-6 max-w-6xl animate-slide-up">
      <PageHeader title="Individual clients" description="People who registered directly and paid for Module A or B. Open a client to see their results, profile and sessions." />

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input className="form-input !pl-10" placeholder="Search by name or email" aria-label="Search clients" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card padding={false}>
        {!clients.length ? (
          <EmptyState icon="○" title={data?.length ? 'No matching clients' : 'No individual clients yet'} description={data?.length ? 'Try a different search.' : 'Clients appear here after they register in the individual portal.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Client</th><th>Modules</th><th>Tests done</th><th>Last active</th><th>Alerts</th><th>Next session</th></tr></thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/psychiatrist/students/${c.id}`} className="font-medium text-primary-700 hover:underline">{c.firstName} {c.lastName}</Link>
                      <p className="text-xs text-surface-400">{c.email}</p>
                    </td>
                    <td>{c.modules.length ? c.modules.map((m) => <span key={m} className="mr-1 text-xs font-semibold bg-primary-50 text-primary-800 border border-primary-100 rounded px-1.5 py-0.5">Module {m}</span>) : <span className="text-surface-400">Not purchased</span>}</td>
                    <td>{c.testsCompleted}</td>
                    <td className="text-surface-500">{c.lastActive ? formatDate(c.lastActive) : '-'}</td>
                    <td>{c.unreadAlerts ? <span className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5">{c.unreadAlerts} unread</span> : <span className="text-surface-400">-</span>}</td>
                    <td className="text-surface-500">{c.nextAppointment ? formatDateTime(c.nextAppointment.slot) : '-'}</td>
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
