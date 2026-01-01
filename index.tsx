
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const log = (window as any).CARBON_LOG || console.log;

const startApp = () => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  log("MOUNTING_CARBON...");

  const killLoader = () => {
    // Correction : L'ID dans index.html est 'initial-loader'
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 400);
    }
  };

  try {
    const root = createRoot(rootEl);
    root.render(<App />);
    log("SYSTEM_ONLINE");
    // On attend un petit peu que React soit bien prêt avant de tuer le loader
    setTimeout(killLoader, 800);
  } catch (err: any) {
    console.error("FATAL_BOOT_ERROR:", err);
    log("RECOVERY_MODE");
    killLoader();
  }
};

if (document.readyState === 'complete') {
    startApp();
} else {
    window.addEventListener('load', startApp);
}
