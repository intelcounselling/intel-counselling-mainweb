
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Global error handlers for logging/monitoring unhandled async/promise errors
window.addEventListener('error', (event) => {
  console.error('Global window error caught:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
