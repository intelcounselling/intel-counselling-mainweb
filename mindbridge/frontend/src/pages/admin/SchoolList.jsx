import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, School, ChevronRight, Search, X, Upload, Users, Check, Key } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { formatDate } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

function CreateSchoolPanel({ onClose, onSuccess }) {
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', address: '', adminFirstName: '', adminLastName: '', adminEmail: '', adminPhone: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);

  const mutation = useMutation({
    queryKey: ['create-school'],
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      return api.post('/admin/schools', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: (data) => {
      success('School and Admin account created successfully!');
      qc.invalidateQueries({ queryKey: ['admin-schools'] });
      setCreatedCreds({
        email: data.adminEmail,
        password: data.plainPassword,
        accessCode: data.school.accessCode,
        schoolName: data.school.name
      });
      onSuccess?.();
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to create school'),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(`Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`);
    success('Credentials copied to clipboard!');
  };

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="slide-over max-w-lg">
          <div className="flex items-center justify-between p-6 border-b border-surface-100 bg-surface-50/50">
            <h2 className="text-xl font-bold text-surface-900">
              {createdCreds ? 'Admin Credentials' : 'Add New School'}
            </h2>
            {!createdCreds && (
              <button onClick={onClose} className="p-2 hover:bg-surface-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-surface-500" />
              </button>
            )}
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-100px)]">
            {createdCreds ? (
              <div className="space-y-6 animate-slide-up">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-surface-900 text-lg">School Created!</h3>
                  <p className="text-sm text-surface-500 mt-1">Admin account for <strong>{createdCreds.schoolName}</strong> is ready.</p>
                </div>

                <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">School Access Code</span>
                    <p className="font-mono font-bold text-lg text-surface-900 mt-0.5">{createdCreds.accessCode}</p>
                  </div>
                  
                  <div className="border-t border-surface-150 pt-4">
                    <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Admin Username / Email</span>
                    <p className="font-medium text-surface-900 mt-0.5">{createdCreds.email}</p>
                  </div>

                  <div className="border-t border-surface-150 pt-4">
                    <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Temporary Password</span>
                    <p className="font-mono font-bold text-lg text-primary-700 tracking-wider bg-white py-2 px-3 rounded-xl border border-surface-200 text-center mt-1">
                      {createdCreds.password}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl text-xs leading-relaxed font-medium flex gap-2.5">
                  <Key className="w-5 h-5 flex-shrink-0" />
                  <p>Copy and securely share these credentials with the school admin. They will be forced to change this temporary password on their first login.</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-surface-100">
                  <Button variant="outline" className="flex-1 h-12" onClick={handleCopy}>Copy</Button>
                  <Button variant="primary" className="flex-1 h-12" onClick={onClose}>Finish</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <Input label="School Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Greenfield Academy" />
                <Input label="Location / Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Oak Street, Springfield" />

                <div className="border-t border-surface-100 pt-5">
                  <h3 className="font-bold text-surface-800 text-sm mb-4 uppercase tracking-wider">School Admin Credentials</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="First Name" required value={form.adminFirstName} onChange={e => setForm(f => ({ ...f, adminFirstName: e.target.value }))} placeholder="John" />
                    <Input label="Last Name" required value={form.adminLastName} onChange={e => setForm(f => ({ ...f, adminLastName: e.target.value }))} placeholder="Doe" />
                  </div>
                  <Input label="Admin Email" type="email" required value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@greenfield.edu" className="mt-4" />
                  <Input label="Admin Phone" value={form.adminPhone} onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))} placeholder="+1-555-0101" className="mt-4" />
                </div>

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
                    Create School & Admin
                  </Button>
                </div>
              </div>
            )}
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
