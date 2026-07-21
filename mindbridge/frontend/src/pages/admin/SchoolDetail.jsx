import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Plus, Download, School, ArrowLeft, Trash2, Mail, Phone, MoreVertical, LayoutDashboard, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [expandedClasses, setExpandedClasses] = useState({});

  const toggleClass = (className) => {
    setExpandedClasses(prev => ({ ...prev, [className]: !prev[className] }));
  };

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

  const groupedStudents = students.reduce((acc, student) => {
    // If the student has a class name, group by that; otherwise check grade, otherwise Unassigned
    const className = student.class?.name || (student.grade ? `Grade ${student.grade}` : 'Unassigned');
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

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
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Total Students</p>
              <p className="font-bold text-lg text-surface-900">{school._count?.users || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <School className="w-5 h-5 text-primary-500" />
            Classes & Analytics
          </h3>
          
          <div className="flex gap-2">
            <Link to={`/admin/schools/${id}/classes`}>
              <Button variant="outline" size="sm" icon={<School className="w-4 h-4" />}>Manage Classes</Button>
            </Link>
            <Link to={`/admin/schools/${id}/create-family`}>
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>Add Student</Button>
            </Link>
            <Link to={`/admin/schools/${id}/generate-credentials`}>
              <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>Bulk Import</Button>
            </Link>
          </div>
        </div>

        {Object.keys(groupedStudents).length === 0 ? (
          <EmptyState icon="🏫" title="No classes found" description="Add students or create classes to see analytics here." className="py-16 bg-white border border-surface-200 rounded-2xl shadow-sm" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedStudents).map(([className, classStudents]) => {
              const totalAlerts = classStudents.reduce((sum, s) => sum + (s._count?.alerts || 0), 0);
              const testedStudents = classStudents.filter(s => s.testResults?.length > 0).length;
              
              const classObj = classStudents.find(s => s.classId)?.class;
              const classIdParam = classObj ? classObj.id : 'unassigned';

              return (
                <Link key={className} to={`/admin/schools/${id}/classes/${classIdParam}/analytics`} className="block group">
                  <Card padding={false} className="h-full border-surface-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-surface-900 group-hover:text-primary-600 transition-colors">{className}</h4>
                        <Badge variant="primary">{classStudents.length} Students</Badge>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-surface-500">Tested Students</span>
                          <span className="font-medium text-surface-900">{testedStudents} / {classStudents.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-surface-500">Active Alerts</span>
                          {totalAlerts > 0 ? (
                            <Badge variant="danger" size="xs" className="animate-pulse">{totalAlerts}</Badge>
                          ) : (
                            <span className="text-surface-400">0</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-50/50 px-5 py-3 border-t border-surface-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-primary-600">View Detailed Analytics</span>
                      <ChevronRight className="w-4 h-4 text-primary-600" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

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
                Delete Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteSchoolModal} onClose={() => setDeleteSchoolModal(false)} title="Delete School">
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-medium">Warning: This action is permanent and irreversible.</p>
            <p className="text-red-600 text-sm mt-1">
              Deleting this school will also permanently delete all associated users, classes, test results, and records.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteSchoolModal(false)}>Cancel</Button>
            <Button variant="primary" className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              onClick={() => deleteSchoolMutation.mutate(id)} loading={deleteSchoolMutation.isPending}>
              Yes, Delete School
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
