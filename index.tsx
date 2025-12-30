import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const log = (window as any).CARBON_LOG || console.log;

const startApp = () => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  log("MOUNTING_CARBON...");

  const killLoader = () => {
    const loader = document.getElementById('absolute-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 400);
    }
  };

  try {
    const root = createRoot(rootEl);
    root.render(<App />);
    log("SYSTEM_ONLINE");
    setTimeout(killLoader, 500);
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