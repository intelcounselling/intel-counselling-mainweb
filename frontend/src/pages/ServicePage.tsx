import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ServiceDetail from '../components/ServiceDetail';
import { NotFoundPage } from './InfoPages';

const SERVICE_IDS = ['personal', 'student', 'hr'];

const ServicePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!serviceId || !SERVICE_IDS.includes(serviceId)) return <NotFoundPage />;

  return (
    <ServiceDetail
      view={serviceId as any}
      onBack={() => navigate('/#services')}
      onBook={() => navigate('/booking')}
    />
  );
};

export default ServicePage;
