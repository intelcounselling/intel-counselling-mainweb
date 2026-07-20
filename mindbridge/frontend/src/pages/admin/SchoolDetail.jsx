import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Plus, Download, School, ArrowLeft, Key, Trash2 } from 'lucide-react';
import { Card, Button, Spinner, EmptyState, Badge, Modal } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate, formatRelative } from '../../utils/formatters';

export default function SchoolDetail() {
  const { id } = useParams();
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [resetModal, setResetModal] = useState(null);
  const [deleteUserModal, setDeleteUserModal] = useState(null);

  const resetMutation = useMutation({
    mutationFn: (userId) => api.post(`/admin/users/${userId}/reset-password`),
    onSuccess: ({ data }) => {
      setResetModal({ email: data.email, newPassword: data.newPassword });
    },
    onError: () => toastError('Failed to reset password'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-students', id] });
      success('Student deleted successfully');
      setDeleteUserModal(null);
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to delete student'),
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['school-students', id],
    queryFn: () => api.get(`/admin/schools/${id}/students`).then(r => r.data),
  });

  const { data: schoolsData } = useQuery({
    queryKey: ['admin-schools'],
    queryFn: () => api.get('/admin/schools').then(r => r.data),
  });

  const school = schoolsData?.schools?.find(s => s.id === id);
  const students = studentsData?.students || [];

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-4">
        <Link to="/admin/schools" className="p-2 hover:bg-surface-200 rounded-xl text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-surface-900">{school?.name || 'School Detail'}</h2>
          <p className="text-surface-500 mt-0.5">{school?.address}</p>
        </div>
      </div>

      {/* School info card */}
      {school && (
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Email', value: school.contactEmail },
              { label: 'Phone', value: school.contactPhone || '—' },
              { label: 'Access Code', value: school.accessCode },
              { label: 'Students', value: school._count?.users || 0 },
            ].map(i => (
              <div key={i.label}>
                <p className="text-xs text-surface-400 uppercase tracking-wide">{i.label}</p>
                <p className="font-semibold text-surface-800 mt-0.5 font-mono">{i.value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to={`/admin/schools/${id}/dashboard`}>
          <Button variant="primary" icon={<School className="w-4 h-4" />}>Analytics Dashboard</Button>
        </Link>
        <Link to={`/admin/schools/${id}/classes`}>
          <Button variant="outline" icon={<Users className="w-4 h-4" />}>Manage Classes</Button>
        </Link>
        <Link to={`/admin/schools/${id}/create-family`}>
          <Button variant="outline" icon={<Plus className="w-4 h-4" />}>Create Family</Button>
        </Link>
        <Link to={`/admin/schools/${id}/generate-credentials`}>
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>Bulk Upload CSV</Button>
        </Link>
      </div>

      {/* Students table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">Students ({students.length})</h3>
        </div>

        {!students.length ? (
          <EmptyState icon="👥" title="No students yet"
            description="Create a family to add students to this school." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Grade</th><th>Last Test</th>
                  <th>Score</th><th>Severity</th><th>Alerts</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const lastResult = student.testResults?.[0];
                  const alertCount = student._count?.alerts || 0;
                  return (
                    <tr key={student.id} className={alertCount > 0 ? 'border-l-4 border-l-red-400' : ''}>
                      <td>
                        <div>
                          <p className="font-medium text-surface-900">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-surface-400">{student.email}</p>
                        </div>
                      </td>
                      <td>{student.grade || '—'}</td>
                      <td className="text-sm text-surface-500">{lastResult ? formatRelative(lastResult.takenAt) : '—'}</td>
                      <td>{lastResult ? `${lastResult.score}/${lastResult.maxScore}` : '—'}</td>
                      <td>{lastResult ? <SeverityBadge severity={lastResult.severity} /> : '—'}</td>
                      <td>
                        {alertCount > 0
                          ? <Badge variant="danger">{alertCount} alert{alertCount > 1 ? 's' : ''}</Badge>
                          : <span className="text-surface-400 text-xs">None</span>
                        }
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="xs">View</Button>
                          <Button variant="ghost" size="xs" icon={<Key className="w-4 h-4" />}
                            onClick={() => resetMutation.mutate(student.id)}>
                            Reset PW
                          </Button>
                          <Button variant="ghost" size="xs" className="text-red-600 hover:text-red-700 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => setDeleteUserModal(student)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reset Password Result Modal */}
      <Modal isOpen={!!resetModal} onClose={() => setResetModal(null)} title="Password Reset">
        {resetModal && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">New credentials for <strong>{resetModal.email}</strong>:</p>
            <div className="bg-surface-50 rounded-xl p-4 font-mono text-sm">
              <p><span className="text-surface-500">Email:</span> {resetModal.email}</p>
              <p><span className="text-surface-500">Password:</span> <span className="font-bold text-primary-700">{resetModal.newPassword}</span></p>
            </div>
            <p className="text-xs text-surface-400">The student will be prompted to change this password on next login.</p>
            <Button variant="primary" className="w-full" onClick={() => setResetModal(null)}>Done</Button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteUserModal} onClose={() => setDeleteUserModal(null)} title="Confirm Deletion">
        {deleteUserModal && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">
              Are you sure you want to delete the student account for <strong>{deleteUserModal.firstName} {deleteUserModal.lastName}</strong> ({deleteUserModal.email})?
            </p>
            <p className="text-xs text-red-500 font-semibold bg-red-50 p-3 rounded-lg">
              ⚠️ Warning: This will permanently delete this student's account, test results, alerts, and counselling notes. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteUserModal(null)}>Cancel</Button>
              <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteUserModal.id)}>
                Delete Student
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
