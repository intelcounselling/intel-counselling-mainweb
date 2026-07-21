import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, School, ChevronRight, Search, X, Upload, Users } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

function CreateSchoolPanel({ onClose, onSuccess }) {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', address: '', contactEmail: '', contactPhone: '' });
  const [logoFile, setLogoFile] = useState(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      return api.post('/admin/schools', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: ({ data }) => {
      success(`School created! Access code: ${data.accessCode}`);
      qc.invalidateQueries({ queryKey: ['admin-schools'] });
      onSuccess?.();
      onClose();
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to create school'),
  });

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="slide-over">
          <div className="flex items-center justify-between p-6 border-b border-surface-100 bg-surface-50/50">
            <h2 className="text-xl font-bold text-surface-900">Add New School</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <Input label="School Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Greenfield Academy" />
            <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Oak Street, Springfield" />
            <Input label="Contact Email" type="email" required value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@school.edu" />
            <Input label="Contact Phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+1-555-0101" />

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">School Logo</label>
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-surface-200 rounded-2xl p-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all group">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-surface-900">{logoFile ? logoFile.name : 'Click to upload logo'}</p>
                  <p className="text-xs text-surface-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files[0])} />
              </label>
            </div>

            <div className="pt-6 border-t border-surface-100">
              <Button variant="primary" className="w-full h-12 text-base" loading={mutation.isPending}
                onClick={() => mutation.mutate()}>
                Create School
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SchoolList() {
  const user = useAuthStore(s => s.user);
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-schools'],
    queryFn: () => api.get('/admin/schools').then(r => r.data),
  });

  const schools = (data?.schools || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contactEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Schools</h2>
          <p className="text-surface-500 mt-1">{data?.schools?.length || 0} schools registered</p>
        </div>
        {!isSchoolAdmin && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Add School
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          className="form-input !pl-10 max-w-xs"
          placeholder="Search schools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center pt-20"><Spinner size="xl" /></div>
      ) : !schools.length ? (
        <EmptyState icon="🏫" title="No schools found" description={isSchoolAdmin ? "You haven't been assigned to a school yet." : "Add your first school to get started."} action={
          !isSchoolAdmin ? <Button variant="primary" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add School</Button> : null
        } className="py-20" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {schools.map(school => (
            <Link key={school.id} to={`/admin/schools/${school.id}`} className="group block h-full">
              <div className="h-full bg-white rounded-3xl border border-surface-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-100 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                    {school.logoUrl
                      ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover" />
                      : <School className="w-8 h-8 text-primary-500" />
                    }
                  </div>
                  {!school.isActive && <Badge variant="danger" size="xs">Inactive</Badge>}
                </div>
                
                <div className="flex-1 relative z-10">
                  <h3 className="font-bold text-lg text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-1">{school.name}</h3>
                  <p className="text-sm text-surface-500 mt-1 line-clamp-2">{school.address || school.contactEmail}</p>
                </div>
                
                <div className="mt-6 pt-5 border-t border-surface-100 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-surface-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-surface-900">{school._count?.users || 0}</p>
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider">Users</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateSchoolPanel onClose={() => setShowCreate(false)} />}
    </div>
  );
}
