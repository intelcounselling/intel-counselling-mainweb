import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-28 pb-12 px-4 md:px-6 flex items-center justify-center min-h-[80vh]">
      <BookingModal onClose={() => navigate('/')} />
    </div>
  );
};

export default BookingPage;
