import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus, Upload, Users, Key, AlertCircle } from 'lucide-react';
import { Modal, Button, Input, Spinner, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { clsx } from 'clsx';

export default function ClassStudentModal({ isOpen, onClose, schoolId, cls }) {
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'addExisting', 'createNew', 'bulk'
  
  if (!cls) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Students: ${cls.name}`}
      size="lg"
    >
      <div className="flex gap-2 border-b border-surface-200 pb-4 mb-4 overflow-x-auto">
        <TabButton active={activeTab === 'current'} onClick={() => setActiveTab('current')} icon={<Users className="w-4 h-4" />}>
          Current Students
        </TabButton>
        <TabButton active={activeTab === 'addExisting'} onClick={() => setActiveTab('addExisting')} icon={<UserPlus className="w-4 h-4" />}>
          Add Existing
        </TabButton>
        <TabButton active={activeTab === 'createNew'} onClick={() => setActiveTab('createNew')} icon={<Key className="w-4 h-4" />}>
          Create New
        </TabButton>
        <TabButton active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')} icon={<Upload className="w-4 h-4" />}>
          Bulk Upload
        </TabButton>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'current' && <CurrentStudents schoolId={schoolId} cls={cls} />}
        {activeTab === 'addExisting' && <AddExistingStudents schoolId={schoolId} cls={cls} />}
        {activeTab === 'createNew' && <CreateNewStudent schoolId={schoolId} cls={cls} />}
        {activeTab === 'bulk' && <BulkUploadStudents schoolId={schoolId} cls={cls} />}
      </div>
    </Modal>
  );
}

function TabButton({ children, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
        active 
          ? 'bg-primary-100 text-primary-700' 
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function CurrentStudents({ schoolId, cls }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['students', schoolId, { classId: cls.id }],
    queryFn: () => api.get(`/admin/schools/${schoolId}/students?classId=${cls.id}`).then(r => r.data),
  });

  const unassignMutation = useMutation({
    mutationFn: (studentId) => api.post(`/admin/schools/${schoolId}/classes/${cls.id}/unassign`, { studentId }),
    onSuccess: () => {
      success('Student removed from class');
      qc.invalidateQueries({ queryKey: ['students', schoolId] });
      qc.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to remove student'),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  const students = data?.students || [];

  if (students.length === 0) {
    return <EmptyState title="No students in this class" description="Add existing students or create new ones." />;
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {students.map(student => (
        <div key={student.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-100">
          <div>
            <p className="font-medium text-surface-900">{student.firstName} {student.lastName}</p>
            <p className="text-xs text-surface-500">{student.email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => {
              if (confirm(`Remove ${student.firstName} from ${cls.name}?`)) {
                unassignMutation.mutate(student.id);
              }
            }}
            loading={unassignMutation.isPending}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}

function AddExistingStudents({ schoolId, cls }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['students', schoolId, { classId: 'unassigned' }],
    queryFn: () => api.get(`/admin/schools/${schoolId}/students?classId=unassigned`).then(r => r.data),
  });

  const assignMutation = useMutation({
    mutationFn: (studentId) => api.post(`/admin/schools/${schoolId}/classes/${cls.id}/assign`, { studentId }),
    onSuccess: () => {
      success('Student assigned to class');
      qc.invalidateQueries({ queryKey: ['students', schoolId] });
      qc.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to assign student'),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  const students = data?.students || [];

  if (students.length === 0) {
    return <EmptyState title="No unassigned students" description="All students in this school are already assigned to a class." />;
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {students.map(student => (
        <div key={student.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-100">
          <div>
            <p className="font-medium text-surface-900">{student.firstName} {student.lastName}</p>
            <p className="text-xs text-surface-500">{student.email}</p>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => assignMutation.mutate(student.id)}
            loading={assignMutation.isPending}
          >
            Assign
          </Button>
        </div>
      ))}
    </div>
  );
}

function CreateNewStudent({ schoolId, cls }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [generatedCreds, setGeneratedCreds] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/schools/${schoolId}/classes/${cls.id}/students`, data),
    onSuccess: (res) => {
      success('Student created & assigned');
      setGeneratedCreds(res.data.credentials);
      setFirstName('');
      setLastName('');
      setEmail('');
      qc.invalidateQueries({ queryKey: ['students', schoolId] });
      qc.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to create student'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ firstName, lastName, email });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input 
            label="First Name" 
            value={firstName} 
            onChange={e => setFirstName(e.target.value)} 
            required 
          />
          <Input 
            label="Last Name" 
            value={lastName} 
            onChange={e => setLastName(e.target.value)} 
            required 
          />
        </div>
        <Input 
          label="Email (Optional)" 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          hint="If left blank, a system email will be generated." 
        />
        <Button type="submit" variant="primary" loading={createMutation.isPending} className="w-full">
          Create & Assign Student
        </Button>
      </form>

      {generatedCreds && (
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <div className="flex items-center gap-2 text-primary-800 font-semibold mb-2">
            <AlertCircle className="w-5 h-5" />
            Save These Credentials!
          </div>
          <p className="text-sm text-primary-700 mb-3">
            Please copy these credentials and provide them to the student securely. They will not be shown again.
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="bg-white p-2 rounded border border-primary-100">
              <span className="text-surface-500 mr-2">Email:</span>
              <span className="font-semibold">{generatedCreds.email}</span>
            </div>
            <div className="bg-white p-2 rounded border border-primary-100">
              <span className="text-surface-500 mr-2">Password:</span>
              <span className="font-semibold">{generatedCreds.password}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BulkUploadStudents({ schoolId, cls }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/schools/${schoolId}/generate-credentials`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: (res) => {
      success('Bulk creation completed');
      setResults(res.data);
      setFile(null);
      qc.invalidateQueries({ queryKey: ['students', schoolId] });
      qc.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to process CSV'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('csv', file);
    formData.append('classId', cls.id);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
        <p className="font-semibold mb-1">CSV Format Requirements:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Must contain headers: <code>first_name, last_name, role</code></li>
          <li>Role must be <code>STUDENT</code> (only students will be added to this class)</li>
          <li>Optional headers: <code>email, grade</code></li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Select CSV File</label>
          <input 
            type="file" 
            accept=".csv"
            onChange={e => setFile(e.target.files[0])}
            className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            required
          />
        </div>
        <Button type="submit" variant="primary" loading={uploadMutation.isPending} disabled={!file} icon={<Upload className="w-4 h-4" />}>
          Upload & Generate
        </Button>
      </form>

      {results && (
        <div className="mt-6 border-t border-surface-200 pt-6">
          <h4 className="font-semibold text-surface-900 mb-3">Generation Results</h4>
          <div className="flex gap-4 mb-4 text-sm">
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
              {results.generated} Created
            </div>
            {results.skipped?.length > 0 && (
              <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-medium">
                {results.skipped.length} Skipped
              </div>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium text-surface-700">Name</th>
                  <th className="px-4 py-2 font-medium text-surface-700">Email</th>
                  <th className="px-4 py-2 font-medium text-surface-700">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {results.credentials?.map((c, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2 font-mono">{c.email}</td>
                    <td className="px-4 py-2 font-mono">{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
