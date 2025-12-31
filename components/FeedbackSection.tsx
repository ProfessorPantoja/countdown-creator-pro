import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Send, MessageSquare, ThumbsUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const FeedbackSection: React.FC = () => {
    const { language } = useLanguage();
    const isPt = language === 'pt';

    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(5);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        // Busca os últimos 10 feedbacks
        const { data, error } = await supabase
            .from('feedbacks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(6);

        if (data) setFeedbacks(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);

        const { error } = await supabase
            .from('feedbacks')
            .insert([
                { name: name || 'Anônimo', message, rating, language: language }
            ]);

        if (!error) {
            setSent(true);
            setName('');
            setMessage('');
            fetchFeedbacks(); // Atualiza a lista
        } else {
            console.error("Erro ao enviar:", error);
            alert("Erro ao conectar com o banco de dados. Verifique a configuração.");
        }

        setLoading(false);
    };

    return (
        <div className="w-full bg-slate-900 border-t border-slate-800 py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <MessageSquare className="text-indigo-500" />
                        {isPt ? "O que estão dizendo" : "Community Feedback"}
                    </h2>
                    <p className="text-slate-400">
                        {isPt ? "Ajude a melhorar a ferramenta. Deixe sua opinião!" : "Help us improve. Leave your feedback!"}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Form */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 h-fit">
                        {sent ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-4">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                    <ThumbsUp className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white">{isPt ? "Obrigado!" : "Thank You!"}</h3>
                                <p className="text-slate-400">{isPt ? "Seu feedback foi recebido com sucesso." : "Your feedback has been received."}</p>
                                <button onClick={() => setSent(false)} className="text-indigo-400 hover:text-indigo-300 text-sm">
                                    {isPt ? "Enviar outro" : "Send another"}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">{isPt ? "Seu Nome (Opcional)" : "Your Name (Optional)"}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder={isPt ? "Ex: João do Grupo" : "Ex: John Doe"}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">{isPt ? "Avaliação" : "Rating"}</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">{isPt ? "Mensagem" : "Message"}</label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                        rows={4}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder={isPt ? "O que você achou? Sugestões?" : "What do you think? Suggestions?"}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : <Send className="w-4 h-4" />}
                                    {isPt ? "Enviar Feedback" : "Send Feedback"}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* List */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {feedbacks.length === 0 ? (
                            <div className="text-center text-slate-500 py-10 italic">
                                {isPt ? "Seja o primeiro a avaliar!" : "Be the first to review!"}
                            </div>
                        ) : (
                            feedbacks.map((fb, idx) => (
                                <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-800/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-200">{fb.name}</span>
                                        <div className="flex">
                                            {[...Array(fb.rating)].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">"{fb.message}"</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
