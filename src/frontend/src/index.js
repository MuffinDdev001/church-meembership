import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { HashRouter } from 'react-router-dom';

// Suppress browser extension errors (e.g. MetaMask inpage.js) from triggering the React dev overlay
if (typeof window !== 'undefined') {
  const isExtensionError = (err) => {
    const msg = err?.message || err?.reason?.message || String(err || '');
    const stack = err?.stack || err?.filename || err?.reason?.stack || '';
    return msg.includes('MetaMask') || msg.includes('metamask') || stack.includes('chrome-extension://');
  };

  window.addEventListener('error', (event) => {
    if (isExtensionError(event.error || event)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isExtensionError(event.reason)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
