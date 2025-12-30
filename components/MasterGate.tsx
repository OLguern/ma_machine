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
  const [showEmailToast, setShowEmailToast] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const savedKey = localStorage.getItem(MASTER_KEY_STORAGE);
    if (!savedKey) {
      setStep('SETUP');
    } else {
      setMasterKey(savedKey);
    }
  }, []);

  const trigger2FA = () => {
    setIsSending(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsSending(false);
      setShowEmailToast(true);
      setStep('TWO_FACTOR');
      setTwoFactorInput(['', '', '', '', '', '']);
    }, 1000);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length < 4) {
      alert("Le code doit faire au moins 4 caractères.");
      return;
    }
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

  const verify2FA = (currentInputArray: string[]) => {
    const fullCode = currentInputArray.join('');
    // Validation contre code généré OU code de secours universel
    if (fullCode === generatedCode || fullCode === '123456') {
      setShowEmailToast(false);
      onAuthorized();
    } else {
      setError(true);
      setTwoFactorInput(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setError(false), 600);
    }
  };

  const handle2FAInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...twoFactorInput];
    newCode[index] = value.slice(-1);
    setTwoFactorInput(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-validation immédiate au 6ème chiffre
    if (value && index === 5) {
      setTimeout(() => verify2FA(newCode), 50);
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFactorInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      verify2FA(twoFactorInput);
    }
  };

  const startRecovery = () => {
    setIsSending(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsSending(false);
      setShowEmailToast(true);
      setStep('RECOVERY_VERIFY');
      setTwoFactorInput(['', '', '', '', '', '']);
    }, 1000);
  };

  const handleRecoverySuccess = () => {
    verify2FA(twoFactorInput);
  };

  if (isSending) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#020617] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="typewriter-font text-[10px] text-amber-600 uppercase tracking-[0.4em] animate-pulse">SÉCURISATION DU CANAL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020617] flex items-center justify-center p-6 font-sans overflow-hidden">
      {/* Toast Notification for Session Code */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 bg-amber-950/95 text-white border border-amber-500/40 px-8 py-4 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-all duration-700 z-[1100] flex items-center gap-6 ${showEmailToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-12 scale-95 pointer-events-none'}`}>
        <span className="text-3xl animate-pulse">📡</span>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-400">Code de Session Transmis</span>
          <span className="text-[16px] font-mono font-bold text-white mt-1 uppercase tracking-widest">
            VALIDEZ AVEC : <span className="bg-amber-500 text-black px-3 py-1 rounded ml-1 font-black shadow-[0_0_15px_rgba(245,158,11,0.6)]">{generatedCode}</span>
          </span>
        </div>
      </div>

      <div className={`max-w-md w-full text-center transition-all duration-500 relative z-10 ${error ? 'animate-shake' : ''}`}>
        <div className="mb-12 relative inline-block p-1 bg-gradient-to-br from-amber-600 via-amber-950 to-stone-950 rounded shadow-[0_0_50px_rgba(217,119,6,0.2)]">
           <div className="bg-[#0a0a0a] px-12 py-8 border border-amber-600/20 shadow-inner">
              <h2 className="typewriter-font text-[10px] text-amber-600/40 uppercase tracking-[0.8em] mb-1">La Machine à Écrire</h2>
              <div className="h-px bg-amber-900/20 w-full mb-1"></div>
              <h1 className="typewriter-font text-[11px] text-amber-500 font-bold uppercase tracking-[0.3em] drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">Atelier Cinéma v2.1.2</h1>
           </div>
        </div>

        {step === 'SETUP' && (
          <form onSubmit={handleSetup} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[10px] text-stone-500 uppercase tracking-widest leading-relaxed">Définissez votre code d'accès maître</p>
            <div className="relative group">
              <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="NOUVEAU CODE"
                className="w-full bg-transparent border-b border-stone-800 p-4 text-center text-amber-500 tracking-[0.6em] focus:outline-none focus:border-amber-600 transition-colors uppercase font-bold text-2xl"
              />
            </div>
            <button className="w-full py-4 bg-amber-950/20 hover:bg-amber-900/40 text-amber-500 text-[10px] font-bold uppercase tracking-[0.4em] border border-amber-900/30 rounded transition-all">Initialiser</button>
          </form>
        )}

        {step === 'LOGIN' && (
          <form onSubmit={handleLogin} className="max-w-[280px] mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="relative">
               <input
                  autoFocus
                  type="password"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-transparent border-none text-center text-5xl text-amber-600 tracking-[0.4em] focus:outline-none placeholder-stone-950"
                />
            </div>
            <button className="text-[10px] text-stone-500 hover:text-amber-500 font-bold uppercase tracking-[0.6em] transition-all">Accéder au Manuscrit</button>
            <div className="pt-4 border-t border-stone-900 w-full">
              <button type="button" onClick={startRecovery} className="text-[9px] text-stone-700 hover:text-amber-700 uppercase tracking-[0.3em] font-mono transition-all py-3 px-8">Code oublié ?</button>
            </div>
          </form>
        )}

        {(step === 'TWO_FACTOR' || step === 'RECOVERY_VERIFY') && (
          <div className="space-y-12 animate-in zoom-in-95 duration-500">
            <div className="space-y-2">
              <h3 className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.4em]">Validation de l'Accès</h3>
              <p className="text-[8px] text-stone-600 uppercase tracking-[0.2em] italic">Code session ou Entrée pour valider.</p>
            </div>
            <div className="flex justify-center gap-3">
              {twoFactorInput.map((val, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={e => handle2FAInput(i, e.target.value)}
                  onKeyDown={e => handle2FAKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="w-12 h-16 bg-stone-950 border border-stone-800 text-center text-2xl font-bold text-amber-500 focus:outline-none focus:border-amber-600 transition-all rounded-md shadow-inner"
                />
              ))}
            </div>
            <button 
              onClick={() => verify2FA(twoFactorInput)}
              className="px-12 py-4 bg-amber-900/10 hover:bg-amber-800/20 text-amber-500 text-[10px] font-bold uppercase tracking-[0.4em] border border-amber-900/30 rounded-lg transition-all"
            >
              Entrer
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};