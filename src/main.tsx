import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Shadow window.top and window.parent AS EARLY AS POSSIBLE to prevent cross-origin errors
try {
  if (typeof window !== 'undefined' && window.self !== window.parent) {
    // We are in an iframe. Try to shadow top/parent to avoid cross-origin access errors.
    // Note: These are often read-only, so we use a try-catch and configurable: true.
    Object.defineProperty(window, 'top', { get: () => window.self, configurable: true });
    Object.defineProperty(window, 'parent', { get: () => window.self, configurable: true });
  }
} catch (e) {
  // Ignore if we can't shadow them
}

// Early global error handler for SecurityError (cross-origin frame access)
const handleSecurityError = (error: any, message?: string) => {
  const msg = message || (error && error.message) || "";
  const name = (error && error.name) || "";
  
  const isSecurityError = 
    name === 'SecurityError' || 
    error?.code === 18 ||
    msg.includes('cross-origin frame') || 
    msg.includes('SecurityError') ||
    msg.includes('Protocols, domains, and ports must match');

  if (isSecurityError) {
    // Suppress the error log to prevent cluttering the console
    return true; 
  }
  return false;
};

// Use both window.onerror and addEventListener for maximum coverage
window.onerror = function(message, source, lineno, colno, error) {
  if (handleSecurityError(error, message as string)) {
    return true; 
  }
  return false;
};

window.addEventListener('error', (event) => {
  if (handleSecurityError(event.error, event.message)) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  if (handleSecurityError(event.reason)) {
    event.preventDefault();
    event.stopPropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
