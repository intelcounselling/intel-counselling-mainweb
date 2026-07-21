import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Plus, Download, School, ArrowLeft, Trash2, Mail, Phone, MoreVertical, LayoutDashboard } from 'lucide-react';
import { Card, Button, Spinner, EmptyState, Badge, Modal } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate, formatRelative } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function SchoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [deleteSchoolModal, setDeleteSchoolModal] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (userId) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-students', id] });
      success('Student deleted successfully');
      setDeleteUserModal(null);
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to delete student'),
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: () => api.delete(`/admin/schools/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-schools'] });
      success('School and all associated data deleted successfully');
      navigate('/admin/schools');
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to delete school'),
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
    <div className="space-y-8 animate-slide-up max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/schools" className="p-2.5 bg-white border border-surface-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 rounded-xl text-surface-600 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-surface-900 tracking-tight">{school?.name || 'School Detail'}</h2>
              {!school?.isActive && <Badge variant="danger">Inactive</Badge>}
            </div>
            <p className="text-surface-500 mt-1 flex items-center gap-2">
              <School className="w-4 h-4" /> {school?.address || 'No address provided'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {isSuperAdmin && (
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setDeleteSchoolModal(true)}>
              Delete School
            </Button>
          )}
          <Link to={`/admin/schools/${id}/dashboard`}>
            <Button variant="primary" icon={<LayoutDashboard className="w-4 h-4" />} className="shadow-sm">Analytics</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {school && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Mail className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Contact Email</p>
              <p className="font-medium text-surface-900 truncate">{school.contactEmail}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Phone className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Phone</p>
              <p className="font-medium text-surface-900 truncate">{school.contactPhone || '—'}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-accent-50 text-accent-600 rounded-xl"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Total Users</p>
              <p className="font-bold text-lg text-surface-900">{school._count?.users || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Students Data Grid */}
      <Card padding={false} className="border-surface-200/50 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50 flex flex-wrap gap-4 items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            School Roster
            <Badge variant="primary" size="sm" className="ml-2">{students.length}</Badge>
          </h3>
          
          <div className="flex gap-2">
            <Link to={`/admin/schools/${id}/classes`}>
              <Button variant="outline" size="sm" icon={<School className="w-4 h-4" />}>Classes</Button>
            </Link>
            <Link to={`/admin/schools/${id}/create-family`}>
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>Add Family</Button>
            </Link>
            <Link to={`/admin/schools/${id}/generate-credentials`}>
              <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>Bulk Import</Button>
            </Link>
          </div>
        </div>

        {!students.length ? (
          <EmptyState icon="👥" title="No students yet"
            description="Create a family or use bulk import to add students to this school." className="py-16" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-50/50 border-b border-surface-200 text-xs uppercase tracking-wider text-surface-500 font-semibold">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4">Last Assessment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Alerts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {students.map(student => {
                  const lastResult = student.testResults?.[0];
                  const alertCount = student._count?.alerts || 0;
                  return (
                    <tr key={student.id} className={`hover:bg-surface-50/50 transition-colors ${alertCount > 0 ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-surface-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-surface-700 font-medium">
                        {student.grade ? `Grade ${student.grade}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {lastResult ? (
                          <div>
                            <p className="text-sm font-medium text-surface-900">{lastResult.test?.name || 'Assessment'}</p>
                            <p className="text-xs text-surface-500">{formatRelative(lastResult.takenAt)}</p>
                          </div>
                        ) : (
                          <span className="text-surface-400 text-sm italic">Never tested</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lastResult ? <SeverityBadge severity={lastResult.severity} /> : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {alertCount > 0
                          ? <Badge variant="danger" size="sm" className="animate-pulse">{alertCount} Active Alert{alertCount > 1 ? 's' : ''}</Badge>
                          : <span className="text-surface-400 text-sm">None</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="text-surface-500 hover:text-red-600 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => setDeleteUserModal(student)} title="Delete Student" />
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteUserModal} onClose={() => setDeleteUserModal(null)} title="Confirm Deletion">
        {deleteUserModal && (
          <div className="space-y-4 pt-2">
            <p className="text-surface-600">
              Are you sure you want to delete <span className="font-semibold text-surface-900">{deleteUserModal?.firstName} {deleteUserModal?.lastName}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteUserModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                onClick={() => deleteMutation.mutate(deleteUserModal.id)} loading={deleteMutation.isPending}>
                Yes, Delete Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete School Modal */}
      <Modal isOpen={deleteSchoolModal} onClose={() => setDeleteSchoolModal(false)} title="Confirm School Deletion">
        <div className="space-y-4 pt-2">
          <p className="text-surface-600">
            Are you sure you want to delete <span className="font-semibold text-surface-900">{school?.name}</span>?
          </p>
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 leading-relaxed font-medium">
            ⚠️ <strong>CRITICAL WARNING:</strong> This action will permanently delete this school, all of its classes, all family groupings, and <strong>ALL user accounts</strong> (students, parents, and school admins) associated with it. This cannot be undone.
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteSchoolModal(false)}>Cancel</Button>
            <Button variant="primary" className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              onClick={() => deleteSchoolMutation.mutate()} loading={deleteSchoolMutation.isPending}>
              Yes, Delete School
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
