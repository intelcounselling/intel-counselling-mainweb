import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ServiceDetail from '../components/ServiceDetail';

const ServicePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <>
      <ServiceDetail 
        view={serviceId as any} 
        onBack={() => navigate('/')} 
        onBook={() => navigate('/booking')} 
      />
    </>
  );
};

export default ServicePage;
