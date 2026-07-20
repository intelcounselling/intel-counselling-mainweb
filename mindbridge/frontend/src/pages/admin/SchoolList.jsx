import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, School, ChevronRight, Search, X, Upload } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate } from '../../utils/formatters';

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
          <div className="flex items-center justify-between p-6 border-b border-surface-100">
            <h2 className="text-lg font-semibold">Add New School</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <Input label="School Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Greenfield Academy" />
            <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Oak Street, Springfield" />
            <Input label="Contact Email" type="email" required value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@school.edu" />
            <Input label="Contact Phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+1-555-0101" />

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">School Logo</label>
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-surface-300 rounded-xl p-6 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <Upload className="w-6 h-6 text-surface-400" />
                <span className="text-sm text-surface-500">{logoFile ? logoFile.name : 'Click to upload logo (PNG, JPG)'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files[0])} />
              </label>
            </div>

            <div className="pt-4">
              <Button variant="primary" className="w-full" loading={mutation.isPending}
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
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          Add School
        </Button>
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
        <div className="flex justify-center pt-12"><Spinner size="lg" /></div>
      ) : !schools.length ? (
        <EmptyState icon="🏫" title="No schools found" description="Add your first school to get started." action={
          <Button variant="primary" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>Add School</Button>
        } />
      ) : (
        <div className="grid gap-4">
          {schools.map(school => (
            <Link key={school.id} to={`/admin/schools/${school.id}`}>
              <Card hover className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                  {school.logoUrl
                    ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover rounded-xl" />
                    : <School className="w-6 h-6 text-white" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-surface-900">{school.name}</p>
                    {!school.isActive && <Badge variant="danger" size="xs">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-surface-500 truncate">{school.address || school.contactEmail}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-surface-400">{school._count?.users || 0} users</span>
                    <span className="text-xs font-mono bg-surface-100 text-surface-600 px-2 py-0.5 rounded">{school.accessCode}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-400 flex-shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateSchoolPanel onClose={() => setShowCreate(false)} />}
    </div>
  );
}
