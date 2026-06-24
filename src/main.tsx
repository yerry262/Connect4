import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('Connect4 app starting...');

// Error boundary for catching render errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; background: #1a1a2e; min-height: 100vh;">
      <h1>Error Loading App</h1>
      <pre>${message}\n${source}:${lineno}:${colno}\n${error?.stack || ''}</pre>
    </div>
  `;
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
};

try {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }
  console.log('Rendering app...');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; background: #1a1a2e; min-height: 100vh;">
      <h1>Error Loading App</h1>
      <pre>${error}</pre>
    </div>
  `;
}
