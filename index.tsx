import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const start = () => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  const hideLoader = () => {
    const loader = document.getElementById('titanium-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  };

  try {
    const root = createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // On attend un court instant que React commence le rendu
    setTimeout(hideLoader, 500);
  } catch (err: any) {
    console.error("TITANIUM_FATAL_ERROR:", err);
    hideLoader(); // On cache quand même pour voir l'erreur potentielle dans App
  }
};

if (document.readyState === 'complete') {
    start();
} else {
    window.addEventListener('load', start);
}