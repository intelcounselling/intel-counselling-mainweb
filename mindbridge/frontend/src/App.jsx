import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import queryClient from './lib/queryClient';
import router from './router';
import axios from 'axios';

export default function App() {
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const rawApiUrl = import.meta.env.VITE_API_URL || '';
        const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');
        await axios.get(`${cleanApiUrl}/health`);
      } catch (err) {
        // Ignore ping errors
      }
    };

    pingBackend(); // Ping immediately on mount
    const interval = setInterval(pingBackend, 10 * 60 * 1000); // Ping every 10 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
