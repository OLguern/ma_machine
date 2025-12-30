import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#121212] border border-[#2d2d2d] w-full max-w-4xl rounded-sm shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-8 border-b border-[#2d2d2d] flex justify-between items-center bg-[#1a1a1a]">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 bg-amber-700 rounded-sm flex items-center justify-center font-bold text-white typewriter-font text-xl shadow-lg">?</div>
            <div>
              <h2 className="typewriter-font text-lg font-bold uppercase tracking-widest text-stone-100">
                Certification & Déploiement
              </h2>
              <p className="text-[9px] text-stone-500 uppercase tracking-[0.2em] mt-1 font-bold">Carbon Studio Professional v2.0.9</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-600 hover:text-white text-4xl leading-none">&times;</button>
        </div>
        
        <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
          
          <section className="bg-amber-900/5 border border-amber-900/20 rounded-lg p-8 space-y-6">
            <h3 className="text-amber-500 font-bold uppercase text-[11px] tracking-[0.4em] flex items-center gap-3">
              🚀 Comment "Brancher" au Web
            </h3>
            <p className="text-[12px] text-stone-300 leading-relaxed italic">
              Voici comment rendre votre application accessible partout en mode professionnel :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#111] border border-stone-800 rounded">
                <span className="text-amber-600 font-bold text-[10px] block mb-2">1. GITHUB</span>
                <p className="text-[10px] text-stone-500">Créez un dépôt gratuit sur GitHub.com et glissez-y vos fichiers.</p>
              </div>
              <div className="p-4 bg-[#111] border border-stone-800 rounded">
                <span className="text-amber-600 font-bold text-[10px] block mb-2">2. PAGES</span>
                <p className="text-[10px] text-stone-500">Dans "Settings > Pages", activez le déploiement GitHub Pages.</p>
              </div>
              <div className="p-4 bg-[#111] border border-stone-800 rounded">
                <span className="text-amber-600 font-bold text-[10px] block mb-2">3. NOM DE DOMAINE</span>
                <p className="text-[10px] text-stone-500">Liez un nom (ex: www.scenariste.com) pour effacer l'URL technique.</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-stone-900/30 border border-stone-800 rounded-lg p-6 space-y-4">
              <h3 className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                📦 Vos fichiers .MAC
              </h3>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Le fichier .MAC contient absolument tout votre projet. Téléchargez-le régulièrement sur votre clé USB ou votre Cloud.
              </p>
            </div>

            <div className="bg-stone-900/30 border border-stone-800 rounded-lg p-6 space-y-4">
              <h3 className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                📶 Mode Hors-Ligne
              </h3>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Une fois "Installée" via Chrome, l'application fonctionne même sans connexion internet.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-stone-600 font-bold uppercase text-[10px] tracking-[0.4em] border-b border-stone-800 pb-2">
              💡 Philosophie v2.0.9
            </h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Nous construisons une suite logicielle intégrée. Chaque module (Pitch, Synopsis, Storyboard) nourrit le suivant. C'est l'efficience pure.
            </p>
          </section>

        </div>

        <div className="p-8 bg-[#1a1a1a] border-t border-[#2d2d2d] flex justify-end">
          <button 
            onClick={onClose} 
            className="px-12 py-3 bg-amber-800 hover:bg-amber-700 text-white rounded-sm font-bold uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl active:scale-95"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};