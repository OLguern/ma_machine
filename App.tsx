import React from 'react';

const App: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-8xl font-black text-slate-900 tracking-tighter animate-bounce">
        Bonjour.
      </h1>
      <p className="text-slate-400 mt-6 font-mono text-sm uppercase tracking-[0.5em]">
        Test de connexion réussi
      </p>
    </div>
  );
};

export default App;