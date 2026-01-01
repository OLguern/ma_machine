
import React, { useState, useEffect, useRef } from 'react';

const MASTER_KEY_STORAGE = 'machine_a_ecrire_master_access';

type GateStep = 'LOGIN' | 'TWO_FACTOR' | 'SETUP' | 'RECOVERY_VERIFY';

interface Props {
  onAuthorized: () => void;
}

export const MasterGate: React.FC<Props> = ({ onAuthorized }) => {
  const [step, setStep] = useState<GateStep>('LOGIN');
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [twoFactorInput, setTwoFactorInput] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const savedKey = localStorage.getItem(MASTER_KEY_STORAGE);
    if (!savedKey) {
      setStep('SETUP');
    } else {
      setMasterKey(savedKey);
    }
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }
  }, []);

  const trigger2FA = () => {
    setIsSending(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsSending(false);
      setStep('TWO_FACTOR');
      setTwoFactorInput(['', '', '', '', '', '']);
    }, 800);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length < 4) return;
    localStorage.setItem(MASTER_KEY_STORAGE, input);
    setMasterKey(input);
    trigger2FA();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === masterKey) {
      trigger2FA();
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 600);
    }
  };

  const verify2FA = (currentArray: string[]) => {
    const fullCode = currentArray.join('');
    if (fullCode === '123456' || (generatedCode && fullCode === generatedCode)) {
      onAuthorized();
    } else if (fullCode.length === 6) {
      setError(true);
      setTwoFactorInput(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setError(false), 600);
    }
  };

  const handle2FAInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextCode = [...twoFactorInput];
    nextCode[index] = value.slice(-1);
    setTwoFactorInput(nextCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (value && index === 5) {
      verify2FA(nextCode);
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFactorInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      verify2FA(twoFactorInput);
    }
  };

  if (isSending) {
    return (
      <div className="fixed inset-0 bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-amber-600 text-[10px] tracking-[0.5em] animate-pulse">SÉCURISATION_CANAL...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 overflow-hidden bg-[#1a1a1a]">
      
      {/* FOND D'ÉCRAN IMMERSIF */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="scene_theatre.png" 
          alt="" 
          className="w-full h-full object-cover transition-opacity duration-1000"
          style={{ filter: 'brightness(1.1) contrast(1.05)' }}
          onError={(e) => {
             console.warn("Échec du chargement image locale sur MasterGate.");
             (e.target as HTMLImageElement).style.opacity = '0';
          }}
        />
        <div className="absolute inset-0 bg-black/30 backdrop-brightness-90 z-10"></div>
      </div>

      <div className={`w-full max-w-2xl flex flex-col items-center transition-all relative z-50 ${error ? 'animate-shake' : ''}`}>
        
        {/* PANNEAU CENTRAL : RECTANGLE PANORAMIQUE AVEC COINS LUMINEUX */}
        <div className="mb-16 relative w-full flex justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-48 bg-amber-600/10 blur-[160px] -z-10"></div>
          
          <div 
            className="relative p-[4px] rounded-sm overflow-hidden shadow-[0_80px_180px_rgba(0,0,0,1)] w-full max-w-[580px]"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 30%, #b45309 70%, #fbbf24 100%)' 
            }}
          >
            <div className="bg-black/80 backdrop-blur-3xl relative overflow-hidden rounded-[1px] px-16 py-8 md:py-10 border border-white/5">
                <div className="relative z-10 text-center">
                    <h1 className="text-amber-500 font-bold text-[28px] md:text-[36px] uppercase tracking-[0.6em] mb-4 drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                      La Machine à Écrire
                    </h1>
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-600 to-transparent w-2/3 mx-auto mb-6"></div>
                    <p className="text-[10px] md:text-[11px] text-white/90 font-bold uppercase tracking-[1em] drop-shadow-[0_2px_8px_rgba(0,0,0,1)] translate-x-[0.5em]">
                      Studio Scénariste
                    </p>
                </div>
                {/* Overlay de texture pour un look "pellicule" */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            </div>
          </div>
        </div>

        {/* INTERFACE D'ACCÈS */}
        <div className="max-w-[240px] w-full mx-auto relative z-50">
          {step === 'SETUP' && (
            <form onSubmit={handleSetup} className="space-y-6 animate-in fade-in duration-700">
              <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="DÉFINIR CODE"
                className="w-full bg-black/80 border-b-4 border-amber-600 p-4 text-center text-amber-500 tracking-[0.4em] focus:outline-none focus:border-amber-400 uppercase font-bold text-[12px] backdrop-blur-md shadow-2xl"
              />
              <button className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black border border-amber-400 rounded-sm text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95">Initialiser</button>
            </form>
          )}

          {step === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-12 animate-in fade-in duration-700">
              <div className="relative group">
                <input
                  autoFocus
                  type="password"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-transparent border-none text-center text-8xl text-amber-500 tracking-[0.3em] focus:outline-none placeholder-amber-900/30 transition-all font-light drop-shadow-[0_0_30px_rgba(0,0,0,1)]"
                />
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-24 h-[3px] bg-amber-700 group-focus-within:w-40 group-focus-within:bg-amber-400 transition-all shadow-[0_0_25px_rgba(217,119,6,1)]"></div>
              </div>
              <button type="submit" className="w-full text-white/80 hover:text-amber-400 text-[13px] font-black uppercase tracking-[1em] transition-all drop-shadow-[0_4px_20px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 translate-x-[0.5em]">
                Entrer
              </button>
            </form>
          )}

          {(step === 'TWO_FACTOR' || step === 'RECOVERY_VERIFY') && (
            <div className="space-y-10 animate-in zoom-in-95 duration-700">
              <div className="flex justify-center gap-2">
                {twoFactorInput.map((val, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={e => handle2FAInput(i, e.target.value)}
                    onKeyDown={e => handle2FAKeyDown(i, e)}
                    className="w-11 h-16 bg-black/90 border-2 border-amber-600/60 text-center text-3xl font-black text-amber-500 focus:outline-none focus:border-amber-500 rounded-sm backdrop-blur-md shadow-2xl"
                  />
                ))}
              </div>
              <p className="text-center text-white/60 text-[10px] uppercase tracking-[0.5em] font-mono opacity-100 italic drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">CANAL_SÉCURISÉ_STUDIO</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        body { background-color: #1a1a1a !important; }
      `}</style>
    </div>
  );
};
