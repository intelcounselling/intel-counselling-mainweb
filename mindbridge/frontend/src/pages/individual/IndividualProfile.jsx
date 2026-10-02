import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Brain, Lock, ClipboardCheck, ArrowRight } from 'lucide-react';
import { Card, Button, Spinner, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import IndividualProfileView from '../../components/IndividualProfileView';
import api from '../../lib/axios';
import { downloadPdf } from '../../utils/download';

export default function IndividualProfile() {
  const { error: toastError } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['individual-profile'],
    queryFn: () => api.get('/individual/profile').then((r) => r.data.profile),
    retry: false,
  });

  const download = async () => {
    setDownloading(true);
    try {
      await downloadPdf('/individual/report', 'Intel_Counselling_Assessment_Report.pdf');
    } catch {
      toastError('Could not download the report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  if (isError || !data) {
    return (
      <Card className="max-w-2xl">
        <EmptyState
          icon={<Lock className="w-6 h-6 text-surface-500" />}
          title="Your profile is waiting for you"
          description="Unlock the assessments and take a few, and your strengths and focus areas will appear here."
          action={<Link to="/individual"><Button icon={<ArrowRight className="w-4 h-4" />}>Go to my assessments</Button></Link>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-slide-up">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 to-primary-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-accent-600/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"><Brain className="w-7 h-7 text-accent-300" /></span>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl">Your psychological profile</h1>
              <p className="text-white/70 text-sm mt-1">{data.completed} of {data.total} assessments · built from your latest result in each</p>
            </div>
          </div>
          {data.completed > 0 && (
            <Button variant="outline" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" icon={<Download className="w-4 h-4" />} loading={downloading} onClick={download}>
              Download PDF
            </Button>
          )}
        </div>
        <div className="relative mt-5 h-2 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full rounded-full bg-accent-600 transition-all duration-700" style={{ width: `${data.total ? (data.completed / data.total) * 100 : 0}%` }} />
        </div>
      </div>

      {!data.completed ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="w-6 h-6 text-surface-500" />}
            title="No assessments yet"
            description="Take your first assessment and your profile starts filling in."
            action={<Link to="/individual"><Button icon={<ArrowRight className="w-4 h-4" />}>Start an assessment</Button></Link>}
          />
        </Card>
      ) : (
        <IndividualProfileView profile={data} bookHref="/individual/sessions" />
      )}
    </div>
  );
}
