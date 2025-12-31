import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImprovementsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const suggestions = [
    "Audio Station: Adicionar trilhas e efeitos sonoros (Tic-Tac, Alarmes).",
    "Presets: Temas prontos (Neon, Corporate, Gamer) para agilizar a criação.",
    "Cloud Rendering: Renderizar em 4K na nuvem para máxima qualidade.",
    "AI Voiceover: Narração inteligente da contagem regressiva.",
    "Monetização: Botão de Doação e plano Pro.",
    "Múltiplas Fases: Configurar Aquecimento, Treino e Descanso."
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
          <h2 className="text-lg font-bold text-white">{t.improvementsTitle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-300 text-sm mb-4" dangerouslySetInnerHTML={{ __html: t.checkRoadmap }} />
          <ul className="space-y-3">
            {suggestions.map((item, idx) => (
              <li key={idx} className="flex gap-3 items-start text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t border-slate-700 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t.improvementsFooter}
          </button>
        </div>
      </div>
    </div>
  );
};
