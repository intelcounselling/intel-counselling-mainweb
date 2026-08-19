import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ToggleLeft, ToggleRight, Trash2, School, Users, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Card, Select, Badge, Button, Modal, Spinner, EmptyState, PageHeader, ListSkeleton } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import ScoreHistoryChart from '../../components/charts/ScoreHistoryChart';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate, getStatusColor } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

const ROLES = ['All', 'STUDENT', 'PARENT', 'PSYCHIATRIST', 'SCHOOL_ADMIN'];

export default function UserManagement() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [selectedStudentReportId, setSelectedStudentReportId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchDeleteModal, setBatchDeleteModal] = useState(false);

  // Fetch schools list if SUPER_ADMIN
  const { data: schoolsData } = useQuery({
    queryKey: ['admin-schools-list'],
    queryFn: () => api.get('/admin/schools', { params: { limit: 200 } }).then(r => r.data),
    enabled: currentUser?.role === 'SUPER_ADMIN',
  });

  const targetSchoolId = currentUser?.role === 'SCHOOL_ADMIN' ? currentUser.schoolId : schoolId;

  // Fetch classes list if a school is selected or current user is SCHOOL_ADMIN
  const { data: classesData } = useQuery({
    queryKey: ['admin-classes-list', targetSchoolId],
    queryFn: () => api.get(`/admin/schools/${targetSchoolId}/classes`).then(r => r.data),
    enabled: !!targetSchoolId,
  });

  const handleSchoolChange = (val) => {
    setSchoolId(val);
    setClassId('');
  };

  // Reset selections and page when query changes
  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
  }, [search, role, isActive, schoolId, classId, pageSize]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, isActive, targetSchoolId, classId, page, pageSize],
    queryFn: () => api.get('/admin/users', {
      params: {
        search,
        role: role || undefined,
        isActive: isActive || undefined,
        schoolId: targetSchoolId || undefined,
        classId: classId || undefined,
        limit: pageSize,
        page,
      }
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); success('User status updated'); },
    onError: () => toastError('Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      success('User deleted successfully');
      setDeleteUserModal(null);
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to delete user'),
  });

  const batchDeleteMutation = useMutation({
    mutationFn: () => api.post('/admin/users/batch-delete', { ids: selectedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      success('Selected users deleted successfully');
      setSelectedIds([]);
      setBatchDeleteModal(false);
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to delete selected users'),
  });

  const users = data?.users || [];
  
  const deletableUsers = users.filter(u => u.id !== currentUser?.id && u.role !== 'SUPER_ADMIN');

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(deletableUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const roleBadge = (r) => {
    const colors = { STUDENT: 'info', PARENT: 'success', PSYCHIATRIST: 'primary', SUPER_ADMIN: 'warning', SCHOOL_ADMIN: 'warning' };
    return <Badge variant={colors[r] || 'default'} size="xs">{r.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl">
      <PageHeader
        title="User Directory"
        description="Manage all platform users and permissions"
        actions={(
          <div className="px-3 py-1.5 bg-white rounded-lg border border-surface-200 flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-surface-500" />
            <span className="font-medium text-surface-700 tabular-nums">{data?.pagination?.total || 0} users</span>
          </div>
        )}
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl animate-fade-in">
          <span className="text-sm font-semibold text-red-900">
            {selectedIds.length} user{selectedIds.length > 1 ? 's' : ''} selected for deletion
          </span>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setBatchDeleteModal(true)}>
            Delete Selected
          </Button>
        </div>
      )}

      <Card padding={false} className="border-surface-200/50 shadow-sm overflow-visible">
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center bg-white rounded-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input className="w-full bg-surface-50 border border-surface-200 text-surface-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block pl-10 p-2.5 transition-colors" placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            {currentUser?.role === 'SUPER_ADMIN' && (
              <Select label="" value={schoolId} onChange={e => handleSchoolChange(e.target.value)} className="min-w-[180px]">
                <option value="">All Schools</option>
                {schoolsData?.schools?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            )}
            {(currentUser?.role === 'SCHOOL_ADMIN' || !!schoolId) && (
              <Select label="" value={classId} onChange={e => setClassId(e.target.value)} className="min-w-[150px]">
                <option value="">All Classes</option>
                {classesData?.classes?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
            <Select label="" value={role} onChange={e => setRole(e.target.value)} className="min-w-[150px]">
              <option value="">All Roles</option>
              {ROLES.slice(1).map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </Select>
            <Select label="" value={isActive} onChange={e => setIsActive(e.target.value)} className="min-w-[130px]">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <Select label="" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="min-w-[110px]" title="Records per page">
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card padding={false} className="border-surface-200/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <ListSkeleton rows={8} />
        ) : !users.length ? (
          <EmptyState icon="👥" title="No users found" description="Try adjusting your search or filters." className="py-16" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-50/50 border-b border-surface-200 text-xs uppercase tracking-wider text-surface-500 font-semibold">
                  <th className="px-6 py-4 w-12">
                    <input type="checkbox" className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                      checked={deletableUsers.length > 0 && selectedIds.length === deletableUsers.length}
                      onChange={handleSelectAll} />
                  </th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {users.map(user => (
                  <tr key={user.id} className={`hover:bg-surface-50/50 transition-colors ${!user.isActive ? 'opacity-75' : ''} ${selectedIds.includes(user.id) ? 'bg-primary-50/30' : ''}`}>
                    <td className="px-6 py-4 w-12">
                      {currentUser?.id !== user.id && user.role !== 'SUPER_ADMIN' ? (
                        <input type="checkbox" className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => handleSelectOne(user.id)} />
                      ) : (
                        <input type="checkbox" className="rounded border-surface-200 text-surface-300 w-4 h-4 cursor-not-allowed" disabled />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-100 text-surface-600 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-surface-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{roleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-surface-700">
                      {user.school?.name ? (
                         <div className="flex flex-col gap-0.5">
                           <span className="flex items-center gap-1.5"><School className="w-3.5 h-3.5 text-surface-400" /> {user.school.name}</span>
                           {user.class?.name && (
                             <span className="text-xs text-surface-500 font-normal pl-5">Class: {user.class.name}</span>
                           )}
                         </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? 'success' : 'danger'} size="xs">
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'STUDENT' && currentUser?.role === 'SUPER_ADMIN' && (
                          <Button variant="ghost" size="sm" className="text-primary-600 hover:bg-primary-50" icon={<FileText className="w-4 h-4" />}
                            onClick={() => window.open(`/admin/students/${user.id}/report`, '_blank')} title="View Student Report" aria-label="View student report" />
                        )}
                        <Button variant="ghost" size="sm" className={user.isActive ? "text-green-600 hover:bg-green-50" : "text-surface-500 hover:bg-surface-100"}
                          icon={user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          onClick={() => toggleMutation.mutate(user.id)} title={user.isActive ? "Deactivate" : "Activate"} aria-label={user.isActive ? "Deactivate user" : "Activate user"} />
                        <Button variant="ghost" size="sm" className="text-surface-500 hover:text-red-600 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => setDeleteUserModal(user)} title="Delete User" aria-label="Delete user" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination controls */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-sm text-surface-500">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.pagination.total)} of <span className="font-semibold text-surface-800">{data.pagination.total}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={!data.pagination.hasPrev}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >← Prev</button>
            <span className="text-sm font-semibold text-surface-700 px-2">Page {page} / {data.pagination.pages}</span>
            <button
              disabled={!data.pagination.hasNext}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next →</button>
          </div>
        </div>
      )}

      <Modal isOpen={!!deleteUserModal} onClose={() => setDeleteUserModal(null)} title="Confirm Deletion">
        {deleteUserModal && (
          <div className="space-y-4 pt-2">
            <p className="text-surface-600">
              Are you sure you want to delete <span className="font-semibold text-surface-900">{deleteUserModal?.firstName} {deleteUserModal?.lastName}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteUserModal(null)}>Cancel</Button>
              <Button variant="danger"
                onClick={() => deleteMutation.mutate(deleteUserModal.id)} loading={deleteMutation.isPending}>
                Yes, Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Batch Delete Modal */}
      <Modal isOpen={batchDeleteModal} onClose={() => setBatchDeleteModal(false)} title="Confirm Batch Deletion">
        <div className="space-y-4 pt-2">
          <p className="text-surface-600">
            Are you sure you want to delete the <span className="font-semibold text-surface-900">{selectedIds.length}</span> selected user accounts?
          </p>
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 leading-relaxed font-medium">
            ⚠️ <strong>Warning:</strong> This will permanently delete these user accounts and all associated data. This action cannot be undone.
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setBatchDeleteModal(false)}>Cancel</Button>
            <Button variant="danger"
              onClick={() => batchDeleteMutation.mutate()} loading={batchDeleteMutation.isPending}>
              Yes, Delete Users
            </Button>
          </div>
        </div>
      </Modal>

      {/* Student Personal Report Modal */}
      <Modal isOpen={!!selectedStudentReportId} onClose={() => setSelectedStudentReportId(null)} title="Student Personal Report" size="xl">
        {selectedStudentReportId && (
          <StudentReportModal studentId={selectedStudentReportId} onClose={() => setSelectedStudentReportId(null)} />
        )}
      </Modal>
    </div>
  );
}

function StudentReportModal({ studentId, onClose }) {
  const [expandedResultId, setExpandedResultId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { error: toastError } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-student-report', studentId],
    queryFn: () => api.get(`/psychiatrist/students/${studentId}`).then(r => r.data),
    enabled: !!studentId,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (error || !data) return <div className="text-center py-12 text-red-500">Failed to load student report.</div>;

  const { student, results = [] } = data;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/admin/students/${studentId}/pdf-report`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindBridge_Report_${student?.firstName}_${student?.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toastError('Failed to generate PDF report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 max-h-[75vh] overflow-y-auto pr-1">
      {/* Student Details Card */}
      <div className="bg-surface-50 border border-surface-200/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          {[
            { label: 'Date of Birth', value: student?.dateOfBirth ? formatDate(student.dateOfBirth) : '—' },
            { label: 'Grade',         value: student?.grade || '—' },
            { label: 'School',        value: student?.school?.name || '—' },
            { label: 'Email',         value: student?.email || '—' },
          ].map(i => (
            <div key={i.label} className="space-y-0.5">
              <span className="text-[11px] text-surface-400 font-semibold uppercase tracking-wider">{i.label}</span>
              <p className="font-semibold text-surface-800 text-sm">{i.value}</p>
            </div>
          ))}
        </div>
        <Button variant="primary" icon={<Download className="w-4 h-4" />} onClick={handleDownload} loading={isDownloading} disabled={isDownloading}>
          {isDownloading ? 'Generating…' : 'Download PDF'}
        </Button>
      </div>

      {/* Score History Chart */}
      {results.length > 0 ? (
        <div className="bg-white border border-surface-200/60 rounded-2xl p-5">
          <h4 className="font-semibold text-surface-900 mb-4 text-xs uppercase tracking-wider text-surface-400">Score History</h4>
          <div className="h-[260px] w-full">
            <ScoreHistoryChart results={results} height={260} />
          </div>
        </div>
      ) : (
        <EmptyState icon="📈" title="No test scores yet" description="This student hasn't taken any assessments." />
      )}

      {/* Assessment History */}
      <div className="bg-white border border-surface-200/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-surface-400">Assessment History ({results.length})</h4>
        </div>
        {!results.length ? (
          <EmptyState icon="📋" title="No assessments" className="py-6" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50/50 border-b border-surface-100 text-[11px] uppercase tracking-wider text-surface-400 font-semibold">
                  <th className="px-5 py-3">Test</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {results.map(r => {
                  const isExpanded = expandedResultId === r.id;
                  const questions = r.test?.questions || [];
                  const answers = r.answers || {};
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
                    <React.Fragment key={r.id}>
                      <tr 
                        className="hover:bg-surface-50/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedResultId(isExpanded ? null : r.id)}
                      >
                        <td className="px-5 py-3.5 font-medium text-surface-900">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                            <span>{r.test?.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-surface-500">{formatDate(r.takenAt)}</td>
                        <td className="px-5 py-3.5 text-surface-700 font-medium">{r.score}/{r.maxScore}</td>
                        <td className="px-5 py-3.5"><SeverityBadge severity={r.severity} size="xs" /></td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="bg-surface-50/50 px-6 py-4 border-t border-b border-surface-100">
                            <div className="space-y-3.5">
                              <h5 className="font-semibold text-xs text-surface-400 uppercase tracking-wider mb-2">Question Breakdown</h5>
                              <div className="space-y-3 bg-white border border-surface-200/60 rounded-xl p-4 shadow-sm">
                                {answerList.map(({ qId, val }, idx) => {
                                  const q = questions.find(q => q.id === parseInt(qId) || q.id === qId);
                                  return (
                                    <div key={qId} className="flex items-start gap-4 p-2.5 rounded-lg hover:bg-surface-50/50 transition-colors border border-transparent hover:border-surface-100">
                                      <span className="text-surface-400 font-bold text-xs pt-0.5">{idx + 1}.</span>
                                      <div className="flex-1 space-y-1">
                                        <p className="text-surface-800 text-xs font-semibold leading-relaxed">{q?.text || `Question ${qId}`}</p>
                                        <p className="text-primary-600 text-xs font-medium">Answer: <span className="font-semibold">{getAnswerLabel(qId, val)}</span> <span className="text-surface-400">({val} pts)</span></p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>Close Report</Button>
      </div>
    </div>
  );
}
