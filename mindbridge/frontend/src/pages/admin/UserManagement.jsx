import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ToggleLeft, ToggleRight, Trash2, School, Users } from 'lucide-react';
import { Card, Select, Badge, Button, Modal, Spinner, EmptyState } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate, getStatusColor } from '../../utils/formatters';

const ROLES = ['All', 'STUDENT', 'PARENT', 'PSYCHIATRIST', 'SCHOOL_ADMIN', 'SUPER_ADMIN'];

export default function UserManagement() {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [deleteUserModal, setDeleteUserModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, isActive],
    queryFn: () => api.get('/admin/users', { params: { search, role: role || undefined, isActive: isActive || undefined, limit: 50 } }).then(r => r.data),
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

  const users = data?.users || [];

  const roleBadge = (r) => {
    const colors = { STUDENT: 'info', PARENT: 'success', PSYCHIATRIST: 'primary', SUPER_ADMIN: 'warning', SCHOOL_ADMIN: 'warning' };
    return <Badge variant={colors[r] || 'default'} size="xs">{r.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-surface-900 tracking-tight">User Directory</h2>
          <p className="text-surface-500 mt-1 text-lg">Manage all platform users and permissions</p>
        </div>
        <div className="px-4 py-2 bg-surface-100 rounded-lg border border-surface-200 flex items-center gap-2">
          <Users className="w-5 h-5 text-surface-500" />
          <span className="font-semibold text-surface-700">{data?.pagination?.total || 0} Total Users</span>
        </div>
      </div>

      <Card padding={false} className="border-surface-200/50 shadow-sm overflow-visible">
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center bg-white rounded-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input className="w-full bg-surface-50 border border-surface-200 text-surface-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block pl-10 p-2.5 transition-colors" placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Select label="" value={role} onChange={e => setRole(e.target.value)} className="min-w-[150px]">
              <option value="">All Roles</option>
              {ROLES.slice(1).map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </Select>
            <Select label="" value={isActive} onChange={e => setIsActive(e.target.value)} className="min-w-[130px]">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card padding={false} className="border-surface-200/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !users.length ? (
          <EmptyState icon="👥" title="No users found" description="Try adjusting your search or filters." className="py-16" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-50/50 border-b border-surface-200 text-xs uppercase tracking-wider text-surface-500 font-semibold">
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
                  <tr key={user.id} className={`hover:bg-surface-50/50 transition-colors ${!user.isActive ? 'opacity-75' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-100 to-surface-200 text-surface-700 font-bold flex items-center justify-center flex-shrink-0">
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
                         <span className="flex items-center gap-1.5"><School className="w-3.5 h-3.5 text-surface-400" /> {user.school.name}</span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? 'success' : 'danger'} size="xs" className={user.isActive ? 'animate-pulse-slow' : ''}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className={user.isActive ? "text-green-600 hover:bg-green-50" : "text-surface-500 hover:bg-surface-100"}
                          icon={user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          onClick={() => toggleMutation.mutate(user.id)} title={user.isActive ? "Deactivate" : "Activate"} />
                        <Button variant="ghost" size="sm" className="text-surface-500 hover:text-red-600 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => setDeleteUserModal(user)} title="Delete User" />
                      </div>
                    </td>
                  </tr>
                ))}
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
                Yes, Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
