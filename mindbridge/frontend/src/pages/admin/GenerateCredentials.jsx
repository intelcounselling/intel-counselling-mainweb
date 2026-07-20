import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Upload, Download, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { downloadCSV } from '../../utils/formatters';

export default function GenerateCredentials() {
  const { id: schoolId } = useParams();
  const { success, error: toastError } = useToast();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('csv', file);
      return api.post(`/admin/schools/${schoolId}/generate-credentials`, fd,
        { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: ({ data }) => {
      setResult(data);
      success(`Generated ${data.generated} credentials!`);
    },
    onError: (err) => toastError(err.response?.data?.error || 'Failed to process CSV'),
  });

  return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <div className="flex items-center gap-4">
        <Link to={`/admin/schools/${schoolId}`} className="p-2 hover:bg-surface-200 rounded-xl text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-surface-900">Bulk Generate Credentials</h2>
      </div>

      <Card>
        <h3 className="font-semibold text-surface-900 mb-2">CSV Format</h3>
        <p className="text-sm text-surface-500 mb-4">Upload a CSV file with the following columns (email is highly recommended to set actual email addresses):</p>
        <div className="bg-surface-900 rounded-xl p-4 font-mono text-sm text-green-400">
          <p>first_name,last_name,email,role,grade</p>
          <p className="text-surface-500">John,Doe,john.doe@example.com,STUDENT,10</p>
          <p className="text-surface-500">Jane,Doe,jane.doe@example.com,PARENT,</p>
        </div>
        <p className="text-xs text-surface-400 mt-2">Roles: STUDENT, PARENT, PSYCHIATRIST</p>
      </Card>

      <Card>
        <div
          className="border-2 border-dashed border-surface-300 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-surface-400 mx-auto mb-3" />
          <p className="font-medium text-surface-700">{file ? file.name : 'Click to upload CSV'}</p>
          <p className="text-sm text-surface-400 mt-1">Supported: .csv</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => setFile(e.target.files[0])} />
        </div>

        {file && (
          <Button variant="primary" className="mt-4 w-full" loading={mutation.isPending}
            onClick={() => mutation.mutate()}>
            Process & Generate Credentials
          </Button>
        )}
      </Card>

      {result && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-surface-900">{result.generated} credentials generated</h3>
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} className="ml-auto"
              onClick={() => downloadCSV(result.credentials, 'bulk-credentials.csv')}>
              Download CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Password</th></tr></thead>
              <tbody>
                {result.credentials.map((c, i) => (
                  <tr key={i}>
                    <td>{c.name}</td>
                    <td><span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{c.role}</span></td>
                    <td className="font-mono text-xs">{c.email}</td>
                    <td className="font-mono text-xs font-bold text-primary-700">{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
