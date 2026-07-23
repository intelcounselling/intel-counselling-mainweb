import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import ClassStudentModal from './ClassStudentModal';

function ClassForm({ onSubmit, loading, initial = {} }) {
  const [name, setName] = useState(initial.name || '');
  const [grade, setGrade] = useState(initial.grade || '');
  const [section, setSection] = useState(initial.section || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, grade, section });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Input
          label="Class Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Grade 6A"
          required
        />
        <Input
          label="Grade"
          value={grade}
          onChange={e => setGrade(e.target.value)}
          placeholder="e.g. 6"
          required
        />
        <Input
          label="Section"
          value={section}
          onChange={e => setSection(e.target.value)}
          placeholder="e.g. A (optional)"
        />
      </div>
      <Button type="submit" variant="primary" loading={loading}>
        {initial.id ? 'Update Class' : 'Create Class'}
      </Button>
    </form>
  );
}

export default function ClassManager() {
  const { id: schoolId } = useParams();
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: () => api.get(`/admin/schools/${schoolId}/classes`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (cls) => api.post(`/admin/schools/${schoolId}/classes`, cls),
    onSuccess: () => {
      success('Class created!');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to create class'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...cls }) => api.put(`/admin/schools/${schoolId}/classes/${id}`, cls),
    onSuccess: () => {
      success('Class updated!');
      setEditClass(null);
      qc.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to update class'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/schools/${schoolId}/classes/${id}`),
    onSuccess: () => {
      success('Class deleted');
      qc.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
    onError: (e) => toastError(e.response?.data?.error || 'Failed to delete class'),
  });

  const classes = data?.classes || [];

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to={`/admin/schools/${schoolId}/dashboard`}
          className="p-2 hover:bg-surface-200 rounded-xl text-surface-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-surface-900">Manage Classes</h2>
          <p className="text-surface-500 text-sm">Create and manage class sections for student grouping</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setShowForm(v => !v); setEditClass(null); }}>
          {showForm ? 'Cancel' : 'Add Class'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">New Class</h3>
          <ClassForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
        </Card>
      )}

      {isLoading && <div className="flex justify-center pt-10"><Spinner size="lg" /></div>}

      {!isLoading && !classes.length && (
        <EmptyState icon="🏫" title="No classes yet" description="Add your first class or section to organise students." />
      )}

      <div className="space-y-3">
        {classes.map(cls => (
          <Card key={cls.id} padding={false}>
            {editClass?.id === cls.id ? (
              <div className="p-5">
                <h4 className="font-semibold text-surface-900 mb-4">Edit: {cls.name}</h4>
                <ClassForm
                  initial={cls}
                  onSubmit={(data) => updateMutation.mutate({ id: cls.id, ...data })}
                  loading={updateMutation.isPending}
                />
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => setEditClass(null)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary-700" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-surface-900">{cls.name}</p>
                  <p className="text-sm text-surface-500">
                    Grade {cls.grade}{cls.section ? ` · Section ${cls.section}` : ''} ·{' '}
                    <span className="font-medium">{cls._count?.students || 0} students</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedClassForStudents(cls)}
                    className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 hover:text-primary-700 transition-colors"
                    title="Manage Students"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditClass(cls)}
                    className="p-2 hover:bg-surface-100 rounded-lg text-surface-500 hover:text-surface-900 transition-colors"
                    title="Edit Class"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete class "${cls.name}"?`)) deleteMutation.mutate(cls.id); }}
                    className="p-2 hover:bg-red-50 rounded-lg text-surface-500 hover:text-red-600 transition-colors"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <ClassStudentModal
        isOpen={!!selectedClassForStudents}
        onClose={() => setSelectedClassForStudents(null)}
        schoolId={schoolId}
        cls={selectedClassForStudents}
      />
    </div>
  );
}
