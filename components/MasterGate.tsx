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
    // Dissipation du loader initial une fois monté
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
      setShowEmailToast(true);
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
    // Priorité absolue au code de secours ou au code généré
    if (fullCode === '123456' || (generatedCode && fullCode === generatedCode)) {
      setShowEmailToast(false);
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
    
    // Validation instantanée sans attendre React
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
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
        <div className="text-amber-600 text-[10px] tracking-[0.5em] animate-pulse">SÉCURISATION_CANAL...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020617] flex items-center justify-center p-6 overflow-hidden">
      {/* Toast pour le code de session */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 bg-amber-950 border border-amber-500/30 px-6 py-3 rounded shadow-2xl transition-all duration-500 flex items-center gap-4 ${showEmailToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <span className="text-amber-500 font-bold text-[10px] uppercase">Session :</span>
        <span className="text-white font-mono font-black text-lg tracking-widest">{generatedCode}</span>
      </div>

      <div className={`w-full max-w-sm transition-all ${error ? 'animate-shake' : ''}`}>
        <div className="mb-12 text-center">
          <h1 className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.5em] mb-2">La Machine à Écrire</h1>
          <div className="h-px bg-amber-900/30 w-full mb-8"></div>
        </div>

        {step === 'SETUP' && (
          <form onSubmit={handleSetup} className="space-y-8 animate-in fade-in duration-500">
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="CRÉER CODE MAÎTRE"
              className="w-full bg-transparent border-b border-stone-800 p-4 text-center text-amber-600 tracking-[0.4em] focus:outline-none focus:border-amber-500 uppercase font-bold"
            />
            <button className="w-full py-3 bg-amber-900/10 text-amber-600 border border-amber-900/30 rounded text-[9px] font-bold uppercase tracking-[0.3em]">Initialiser</button>
          </form>
        )}

        {step === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in duration-500">
            <input
              autoFocus
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="CODE"
              className="w-full bg-transparent border-none text-center text-4xl text-amber-600 tracking-[0.4em] focus:outline-none placeholder-stone-900"
            />
            <button className="w-full text-stone-600 hover:text-amber-600 text-[9px] font-bold uppercase tracking-[0.4em] transition-colors">Déverrouiller</button>
          </form>
        )}

        {(step === 'TWO_FACTOR' || step === 'RECOVERY_VERIFY') && (
          <div className="space-y-12 animate-in zoom-in-95 duration-500">
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
                  autoFocus={i === 0}
                  className="w-10 h-14 bg-black border border-stone-800 text-center text-xl font-bold text-amber-500 focus:outline-none focus:border-amber-600 rounded"
                />
              ))}
            </div>
            <p className="text-center text-stone-600 text-[8px] uppercase tracking-widest">Code de secours : 123456</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </div>
  );
};