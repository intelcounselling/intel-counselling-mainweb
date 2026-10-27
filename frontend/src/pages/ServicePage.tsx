import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ServiceDetail from '../components/ServiceDetail';
import PersonalTherapy from '../components/PersonalTherapy';
import { NotFoundPage } from './InfoPages';

const SERVICE_IDS = ['personal', 'student', 'hr'];

const ServicePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!serviceId || !SERVICE_IDS.includes(serviceId)) return <NotFoundPage />;

  // Personal therapy has its own page design; the other services share ServiceDetail
  if (serviceId === 'personal') {
    return <PersonalTherapy onBack={() => navigate('/#services')} onBook={() => navigate('/booking')} />;
  }

  return (
    <ServiceDetail
      view={serviceId as any}
      onBack={() => navigate('/#services')}
      onBook={() => navigate('/booking')}
    />
  );
};

export default ServicePage;
