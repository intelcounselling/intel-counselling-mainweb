import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ToggleLeft, ToggleRight, Key, Trash2 } from 'lucide-react';
import { Card, Button, Select, Badge, Spinner, Modal } from '../../components/ui';
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
  const [resetModal, setResetModal] = useState(null); // { id, email, newPassword }
  const [deleteUserModal, setDeleteUserModal] = useState(null); // holds user to delete

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

  const resetMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/reset-password`),
    onSuccess: ({ data }) => {
      setResetModal({ email: data.email, newPassword: data.newPassword });
    },
    onError: () => toastError('Failed to reset password'),
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
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">User Management</h2>
        <p className="text-surface-500">{data?.pagination?.total || 0} users registered</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input className="form-input !pl-9 w-56" placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select label="" value={role} onChange={e => setRole(e.target.value)} className="w-44">
            <option value="">All Roles</option>
            {ROLES.slice(1).map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </Select>
          <Select label="" value={isActive} onChange={e => setIsActive(e.target.value)} className="w-36">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </Card>

      <Card padding={false}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Role</th><th>School</th>
                  <th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <p className="font-medium text-surface-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-surface-400">{user.email}</p>
                      </div>
                    </td>
                    <td>{roleBadge(user.role)}</td>
                    <td className="text-sm text-surface-600">{user.school?.name || '—'}</td>
                    <td>
                      <Badge variant={user.isActive ? 'success' : 'danger'} size="xs">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-sm text-surface-500">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="xs"
                          icon={user.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-surface-400" />}
                          onClick={() => toggleMutation.mutate(user.id)}>
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="xs" icon={<Key className="w-4 h-4" />}
                          onClick={() => resetMutation.mutate(user.id)}>
                          Reset PW
                        </Button>
                        <Button variant="ghost" size="xs" className="text-red-600 hover:text-red-700 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => setDeleteUserModal(user)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
            <p className="text-xs text-surface-400">The user will be prompted to change this password on next login.</p>
            <Button variant="primary" className="w-full" onClick={() => setResetModal(null)}>Done</Button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteUserModal} onClose={() => setDeleteUserModal(null)} title="Confirm Deletion">
        {deleteUserModal && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">
              Are you sure you want to delete the user account for <strong>{deleteUserModal.firstName} {deleteUserModal.lastName}</strong> ({deleteUserModal.email})?
            </p>
            <p className="text-xs text-red-500 font-semibold bg-red-50 p-3 rounded-lg">
              ⚠️ Warning: This will permanently delete this account and all associated test results, alerts, appointments, and counselling notes. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteUserModal(null)}>Cancel</Button>
              <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteUserModal.id)}>
                Delete Account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
