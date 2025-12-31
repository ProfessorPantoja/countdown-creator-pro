import React, { useState } from 'react';
import { CheckCircle, X, Trophy, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onUpgrade }) => {
    const { language } = useLanguage();
    const isPt = language === 'pt';
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePurchase = () => {
        setLoading(true);
        // Simulação de Purchase Flow
        setTimeout(() => {
            setLoading(false);
            onUpgrade();
            onClose();
            alert(isPt ? "Obrigado! Versão Pro ativada." : "Thank you! Pro Version activated.");
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-0 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col">

                {/* Banner Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg">
                        <Trophy className="w-8 h-8 text-yellow-300 drop-shadow-md" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight relative z-10">Countdown Creator <span className="text-yellow-300">PRO</span></h2>
                    <p className="text-indigo-100 text-sm font-medium mt-1">
                        {isPt ? "Desbloqueie todo o potencial" : "Unlock full potential"}
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <FeatureItem isPt={isPt} text={isPt ? "Remover Marca D'água" : "Remove Watermark"} />
                        <FeatureItem isPt={isPt} text={isPt ? "Prioridade no Suporte" : "Priority Support"} />
                        <li className="flex items-center gap-3 text-slate-400 text-sm pl-1">
                            <CheckCircle className="w-4 h-4 text-green-900/50" />
                            <span>{isPt ? "Mais recursos em breve!" : "More features coming soon!"}</span>
                        </li>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">{isPt ? "Oferta de Lançamento" : "Launch Offer"}</span>
                        <div className="flex items-end justify-center gap-2">
                            <span className="text-3xl font-black text-white">R$ 9,90</span>
                            <span className="text-slate-500 line-through mb-1 text-sm">R$ 29,90</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/40 relative overflow-hidden transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">Processando...</span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                {isPt ? "Liberar Acesso Agora" : "Unlock Access Now"} <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ isPt, text }: { isPt: boolean, text: string }) => (
    <div className="flex items-center gap-3 text-slate-200">
        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
        <span className="font-medium">{text}</span>
    </div>
);
