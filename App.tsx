import React from 'react';

const App: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in duration-1000">
      <h1 className="text-9xl font-black text-slate-900 tracking-tighter sm:text-[12rem]">
        Bonjour.
      </h1>
      <div className="mt-8 flex items-center gap-4">
        <div className="w-12 h-px bg-slate-300"></div>
        <p className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.6em]">
          Connexion Établie
        </p>
        <div className="w-12 h-px bg-slate-300"></div>
      </div>
    </div>
  );
};

export default App;