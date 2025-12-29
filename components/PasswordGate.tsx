
import React, { useState } from 'react';

interface Props {
  correctPassword?: string;
  onUnlock: () => void;
}

export const PasswordGate: React.FC<Props> = ({ correctPassword, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === correctPassword) {
      onUnlock();
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#1a1a1a] flex items-center justify-center p-6">
      <div className={`w-full max-w-md bg-white p-12 shadow-2xl rounded-sm paper-texture border-t-[12px] border-amber-800 transition-transform ${error ? 'animate-bounce' : ''}`}>
        <div className="mb-10 text-center">
          <div className="inline-block border-4 border-red-600 px-4 py-1 text-red-600 font-bold text-sm tracking-[0.3em] uppercase mb-6 transform -rotate-3">
            Confidentiel
          </div>
          <h2 className="typewriter-font text-xl font-bold text-stone-800 uppercase tracking-widest">
            Manuscrit Verrouillé
          </h2>
          <p className="text-[10px] text-stone-500 uppercase mt-2 tracking-widest">
            Accès restreint à l'auteur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              autoFocus
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="CODE D'ACCÈS"
              className="w-full bg-stone-100 border-b-2 border-stone-800 p-4 text-center text-xl tracking-[0.5em] focus:ring-0 focus:border-amber-600 transition-colors"
            />
            {error && (
              <p className="absolute -bottom-6 left-0 right-0 text-center text-red-600 text-[10px] font-bold uppercase tracking-widest">
                Code invalide
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-white font-bold uppercase text-xs tracking-[0.3em] transition-all shadow-lg active:scale-95"
          >
            Déverrouiller les touches
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-stone-200 opacity-20 flex justify-center">
            <div className="w-12 h-12 border-2 border-stone-800 rounded-full flex items-center justify-center font-bold text-stone-800">M</div>
        </div>
      </div>
    </div>
  );
};
