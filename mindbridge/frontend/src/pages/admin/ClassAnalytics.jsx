import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Plus, ArrowLeft, Trash2, Search, UserPlus } from 'lucide-react';
import { Card, Button, Spinner, EmptyState, Badge, Modal, Input } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatRelative } from '../../utils/formatters';

export default function ClassAnalytics() {
  const { id, classId } = useParams();
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');

  const deleteMutation = useMutation({
    mutationFn: (userId) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-students', id, classId] });
      success('Student deleted successfully');
      setDeleteUserModal(null);
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to delete student'),
  });

  const assignMutation = useMutation({
    mutationFn: (studentId) => api.post(`/admin/schools/${id}/classes/${classId}/assign`, { studentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-students', id] });
      success('Student assigned to class successfully');
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to assign student'),
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['school-students', id, classId],
    queryFn: () => api.get(`/admin/schools/${id}/students?classId=${classId}`).then(r => r.data),
  });

  const { data: allStudentsData } = useQuery({
    queryKey: ['school-students', id],
    queryFn: () => api.get(`/admin/schools/${id}/students?limit=100`).then(r => r.data),
    enabled: assignModalOpen,
  });

  const students = studentsData?.students || [];
  const allSchoolStudents = allStudentsData?.students || [];
  
  // Use the first student to get the class name, or fallback if unassigned
  const className = classId === 'unassigned' ? 'Unassigned Students' : (students[0]?.class?.name || 'Class Roster');

  const totalAlerts = students.reduce((sum, s) => sum + (s._count?.alerts || 0), 0);
  const testedStudents = students.filter(s => s.testResults?.length > 0).length;

  // Filter students who are not in this class and match search query
  const assignableStudents = allSchoolStudents.filter(s => {
    const isAlreadyInClass = s.classId === classId;
    const matchesSearch = (s.firstName + ' ' + s.lastName + ' ' + s.email)
      .toLowerCase()
      .includes(assignSearch.toLowerCase());
    return !isAlreadyInClass && matchesSearch;
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  return (
    <div className="space-y-8 animate-slide-up max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/admin/schools/${id}`} className="p-2.5 bg-white border border-surface-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 rounded-xl text-surface-600 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-surface-900 tracking-tight">{className}</h2>
            </div>
            <p className="text-surface-500 mt-1 flex items-center gap-2">
              Detailed Analytics & Roster
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" icon={<UserPlus className="w-4 h-4" />} onClick={() => setAssignModalOpen(true)}>
            Assign Student
          </Button>
          <Link to={`/admin/schools/${id}/create-family`}>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Create Student</Button>
          </Link>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Total Students</p>
          <p className="font-bold text-lg text-surface-900">{students.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Tested</p>
          <p className="font-bold text-lg text-surface-900">{testedStudents}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Active Alerts</p>
          <p className={`font-bold text-lg ${totalAlerts > 0 ? 'text-red-600' : 'text-surface-900'}`}>{totalAlerts}</p>
        </div>
      </div>

      {/* Roster Table */}
      <Card padding={false} className="border-surface-200/50 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50 flex flex-wrap gap-4 items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            Class Roster
          </h3>
        </div>

        {!students.length ? (
          <EmptyState icon="👥" title="No students in this class" description="Add students to see them listed here." className="py-16" />
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
                Delete Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Student to Class">
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input 
              className="w-full bg-surface-50 border border-surface-200 text-surface-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block pl-10 p-2.5 transition-colors" 
              placeholder="Search students by name or email..." 
              value={assignSearch} 
              onChange={e => setAssignSearch(e.target.value)} 
            />
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 border border-surface-200 rounded-xl bg-surface-50/30">
            {assignableStudents.length === 0 ? (
              <p className="text-center py-8 text-sm text-surface-400">No assignable students found.</p>
            ) : (
              assignableStudents.map(student => (
                <div key={student.id} className="flex justify-between items-center p-3 hover:bg-white transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-surface-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-surface-500">{student.email}</p>
                    <p className="text-[10px] mt-0.5 text-primary-600 font-medium">
                      Current: {student.class?.name || 'Unassigned'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={<UserPlus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      assignMutation.mutate(student.id);
                      setAssignModalOpen(false);
                    }}
                    loading={assignMutation.isPending && assignMutation.variables === student.id}
                  >
                    Assign
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
