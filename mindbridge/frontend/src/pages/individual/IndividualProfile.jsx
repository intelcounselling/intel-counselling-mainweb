import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, ArrowRight } from 'lucide-react';
import { Card, Button, Spinner, PageHeader, EmptyState } from '../../components/ui';
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
      <div className="max-w-3xl">
        <PageHeader title="Your profile" />
        <Card className="mt-6">
          <EmptyState
            icon="○"
            title="Unlock a module to see your profile"
            description="Your results summary appears here after you take the assessments."
            action={<Link to="/individual"><Button>Go to my assessments</Button></Link>}
          />
        </Card>
      </div>
    );
  }

  const isB = data.module === 'B';

  return (
    <div className="space-y-6 max-w-4xl animate-slide-up">
      <PageHeader
        title={isB ? 'Integrated psychological profile' : 'Your results summary'}
        description={isB ? 'Built from your latest result in each of the 7 assessments.' : 'Built from your latest result in each of the 5 assessments.'}
        actions={data.completed > 0 && <Button variant="outline" icon={<Download className="w-4 h-4" />} loading={downloading} onClick={download}>Download report (PDF)</Button>}
      />

      {!data.completed ? (
        <Card>
          <EmptyState icon="○" title="No assessments taken yet" description="Take your first assessment and your profile will appear here."
            action={<Link to="/individual"><Button>Start an assessment</Button></Link>} />
        </Card>
      ) : (
        <IndividualProfileView profile={data} showRecommendation={isB} bookHref="/individual/sessions" />
      )}

      {data.module === 'A' && (
        <Card className="bg-primary-50 border-primary-100">
          <p className="text-sm text-primary-900">
            Want the full picture? <strong>Module B</strong> adds the PHQ-9 and GAD-7 screenings and gives you an integrated profile with risk identification and counselling recommendations.
          </p>
          <Link to="/individual" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-800">See Module B <ArrowRight className="w-4 h-4" /></Link>
        </Card>
      )}
    </div>
  );
}
