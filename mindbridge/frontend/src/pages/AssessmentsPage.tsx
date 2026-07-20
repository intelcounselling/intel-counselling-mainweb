import React from 'react';
import { useNavigate } from 'react-router-dom';
import TestOptions from '../components/TestOptions';

const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <TestOptions 
      onBack={() => navigate('/')} 
      onSelectTest={(type) => navigate(`/assessments/${type}`)} 
    />
  );
};

export default AssessmentsPage;
