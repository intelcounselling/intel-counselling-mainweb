import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, Download, UserPlus } from 'lucide-react';
import { Card, Button, Input, Modal, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { downloadCSV } from '../../utils/formatters';

const emptyStudent = { firstName: '', lastName: '', email: '', grade: '', dateOfBirth: '' };
const emptyParent  = { firstName: '', lastName: '', email: '', phone: '' };

export default function CreateFamily() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [students, setStudents] = useState([{ ...emptyStudent }]);
  const [parents,  setParents]  = useState([{ ...emptyParent }]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState([]);

  const { data: schoolsData } = useQuery({
    queryKey: ['admin-schools'],
    queryFn: () => api.get('/admin/schools').then(r => r.data),
  });
  const school = schoolsData?.schools?.find(s => s.id === schoolId);

  const mutation = useMutation({
    mutationFn: () => api.post(`/admin/schools/${schoolId}/family`, { students, parents }),
    onSuccess: ({ data }) => {
      setCredentials(data.credentials);
      setShowCredentials(true);
      success(`Family created! ${data.credentials.length} credentials generated.`);
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to create family'),
  });

  const updateStudent = (i, field, value) =>
    setStudents(arr => arr.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const updateParent = (i, field, value) =>
    setParents(arr => arr.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const addStudent = () => setStudents(arr => [...arr, { ...emptyStudent }]);
  const removeStudent = (i) => setStudents(arr => arr.filter((_, idx) => idx !== i));
  const addParent = () => setParents(arr => [...arr, { ...emptyParent }]);
  const removeParent = (i) => setParents(arr => arr.filter((_, idx) => idx !== i));

  const handleDownload = () => downloadCSV(credentials, 'intel-counselling-credentials.csv');

  const isValid = students.every(s => s.firstName && s.lastName && s.email) &&
                  parents.every(p => p.firstName && p.lastName && p.email);

  return (
    <div className="max-w-3xl space-y-6 animate-slide-up">
      <div className="flex items-center gap-4">
        <Link to={`/admin/schools/${schoolId}`} className="p-2 hover:bg-surface-200 rounded-xl text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Create Family</h2>
          <p className="text-surface-500">School: {school?.name}</p>
        </div>
      </div>

      {/* Students Section */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-surface-900 text-lg">Students / Siblings</h3>
            <p className="text-sm text-surface-500">Add one or more students to this family</p>
          </div>
          <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addStudent}>
            Add Sibling
          </Button>
        </div>

        <div className="space-y-6">
          {students.map((s, i) => (
            <div key={i} className="p-5 bg-surface-50 rounded-2xl border border-surface-200 relative">
              {i > 0 && (
                <button onClick={() => removeStudent(i)}
                  className="absolute top-3 right-3 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">
                {i === 0 ? 'Student' : `Sibling ${i + 1}`}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={s.firstName}
                  onChange={e => updateStudent(i, 'firstName', e.target.value)} placeholder="Alex" />
                <Input label="Last Name" required value={s.lastName}
                  onChange={e => updateStudent(i, 'lastName', e.target.value)} placeholder="Johnson" />
                <Input label="Email Address" required type="email" value={s.email || ''}
                  onChange={e => updateStudent(i, 'email', e.target.value)} placeholder="alex.johnson@example.com" />
                <Input label="Grade" value={s.grade}
                  onChange={e => updateStudent(i, 'grade', e.target.value)} placeholder="10" />
                <Input label="Date of Birth" type="date" value={s.dateOfBirth}
                  onChange={e => updateStudent(i, 'dateOfBirth', e.target.value)} className="col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Parents Section */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-surface-900 text-lg">Parents / Guardians</h3>
            <p className="text-sm text-surface-500">At least one parent is required</p>
          </div>
          <Button variant="outline" size="sm" icon={<UserPlus className="w-4 h-4" />} onClick={addParent}>
            Add Parent
          </Button>
        </div>

        <div className="space-y-6">
          {parents.map((p, i) => (
            <div key={i} className="p-5 bg-surface-50 rounded-2xl border border-surface-200 relative">
              {i > 0 && (
                <button onClick={() => removeParent(i)}
                  className="absolute top-3 right-3 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">
                Parent {i + 1}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={p.firstName}
                  onChange={e => updateParent(i, 'firstName', e.target.value)} placeholder="Sarah" />
                <Input label="Last Name" required value={p.lastName}
                  onChange={e => updateParent(i, 'lastName', e.target.value)} placeholder="Johnson" />
                <Input label="Email Address" required type="email" value={p.email || ''}
                  onChange={e => updateParent(i, 'email', e.target.value)} placeholder="sarah.johnson@example.com" />
                <Input label="Phone (for SMS alerts)" value={p.phone}
                  onChange={e => updateParent(i, 'phone', e.target.value)} placeholder="+1-555-0101" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="primary" size="lg" className="w-full" loading={mutation.isPending}
        disabled={!isValid} onClick={() => mutation.mutate()}>
        Create Family & Generate Credentials
      </Button>

      {/* Credential Modal */}
      <Modal isOpen={showCredentials} onClose={() => { setShowCredentials(false); navigate(`/admin/schools/${schoolId}`); }}
        title="🎉 Family Created — Login Credentials"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="primary" icon={<Download className="w-4 h-4" />} onClick={handleDownload}>
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => { setShowCredentials(false); navigate(`/admin/schools/${schoolId}`); }}>
              Done
            </Button>
          </div>
        }>
        <div className="space-y-3">
          <p className="text-sm text-surface-500 mb-4">
            Share these credentials securely. All users must change their password on first login.
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Email</th><th>Password</th></tr>
            </thead>
            <tbody>
              {credentials.map((c, i) => (
                <tr key={i}>
                  <td className="font-medium">{c.name}</td>
                  <td><span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">{c.role}</span></td>
                  <td className="font-mono text-xs">{c.email}</td>
                  <td className="font-mono text-xs font-bold text-primary-700">{c.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
