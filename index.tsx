import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const start = () => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  try {
    const root = createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Dissipation du loader une fois React monté
    const loader = document.getElementById('obsidian-loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 400);
      }, 600);
    }
  } catch (err: any) {
    console.error("OBSIDIAN_FATAL:", err);
    // En cas d'erreur ici, on tente un dernier refresh forcé
    if (!window.location.hash.includes('retry')) {
      window.location.hash = 'retry';
      // Fix: window.location.reload() does not accept arguments in modern TypeScript definitions.
      window.location.reload();
    }
  }
};

if (document.readyState === 'complete') {
    start();
} else {
    window.addEventListener('load', start);
}