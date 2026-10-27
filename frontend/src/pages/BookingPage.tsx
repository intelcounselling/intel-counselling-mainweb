import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden pt-28 pb-14 px-4 md:px-6 flex items-center justify-center min-h-[80vh]">
      <div className="pointer-events-none absolute top-20 -left-24 w-80 h-80 rounded-full bg-lavender/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 -right-24 w-96 h-80 rounded-full bg-sky/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-peach/60 blur-3xl" aria-hidden="true" />
      <BookingModal onClose={() => navigate('/')} />
    </div>
  );
};

export default BookingPage;
