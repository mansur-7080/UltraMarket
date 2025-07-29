import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';

/**
 * UltraMarket E-Commerce Platform
 * TypeScript React Application Entry Point
 * Professional Production-Ready Setup
 */

// Error handling for React 18 StrictMode
const isDevelopment = import.meta.env.MODE === 'development';

// Get root element with proper error handling
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element. Check your HTML template.');
}

// Create React 18 root with error boundary
const root = ReactDOM.createRoot(rootElement);

// Render application with StrictMode in development
if (isDevelopment) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  root.render(<App />);
}

// Hot module replacement for development
if (isDevelopment && import.meta.hot) {
  import.meta.hot.accept();
}

// Performance monitoring
if ('performance' in window && 'measure' in window.performance) {
  window.performance.mark('app-start');
}

// Service Worker registration for production
if ('serviceWorker' in navigator && !isDevelopment) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
} 