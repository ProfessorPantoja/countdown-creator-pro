import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Timer, Globe, Zap, Download, Layers, Music, Monitor, ShieldCheck, Heart } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const { language } = useLanguage();

    // Content localized manually here for SEO density (or could use translations.ts)
    // Keeping it simple with conditional rendering for now since it's a large block of text

    const isPt = language === 'pt';

    return (
        <div className="w-full bg-slate-950 text-slate-300 py-20 px-4 border-t border-slate-900">
            <div className="max-w-6xl mx-auto space-y-20">

                {/* Hero / Value Prop */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                        {isPt ? "Crie Contagens Regressivas Profissionais" : "Create Professional Countdown Videos"}
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                            {isPt ? "Em Segundos." : "In Seconds."}
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {isPt
                            ? "A ferramenta definitiva para VJs, DJs, Igrejas e Influenciadores criarem vídeos de contagem regressiva, timers e cronômetros personalizados."
                            : "The ultimate tool for VJs, DJs, Churches, and Influencers to create custom countdown videos, timers, and stopwatches."}
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-yellow-400" />}
                        title={isPt ? "Renderização Turbo" : "Turbo Rendering"}
                        desc={isPt ? "Geração de vídeo ultra-rápida direto no navegador. Sem filas, sem marcas d'água." : "Ultra-fast video generation directly in your browser. No queues, no watermarks."}
                    />
                    <FeatureCard
                        icon={<Monitor className="w-8 h-8 text-blue-400" />}
                        title={isPt ? "Qualidade 4K/HD" : "4K/HD Quality"}
                        desc={isPt ? "Exporte em alta resolução (720p, 1080p, 4K) com bitrate ajustável para máxima nitidez." : "Export in high resolution (720p, 1080p, 4K) with adjustable bitrate for maximum sharpness."}
                    />
                    <FeatureCard
                        icon={<Layers className="w-8 h-8 text-purple-400" />}
                        title={isPt ? "Totalmente Personalizável" : "Fully Customizable"}
                        desc={isPt ? "Escolha fontes, cores, sombras, fundos animados e muito mais." : "Choose fonts, colors, shadows, animated backgrounds, and much more."}
                    />
                </div>

                {/* Sub-features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-white">
                            {isPt ? "Perfeito para Eventos ao Vivo" : "Perfect for Live Events"}
                        </h2>
                        <ul className="space-y-4">
                            <ListItem text={isPt ? "Contagem Regressiva para Ano Novo (Réveillon)" : "New Year's Eve Countdown (NYE)"} />
                            <ListItem text={isPt ? "Abertura de Cultos e Eventos de Igreja" : "Church Service Openers & Events"} />
                            <ListItem text={isPt ? "Intros para Streamers (OBS, Twitch, YouTube)" : "Streamer Intros (OBS, Twitch, YouTube)"} />
                            <ListItem text={isPt ? "Fitness e Timer de Treino (Crossfit, Tabata)" : "Fitness & Workout Timers (Crossfit, Tabata)"} />
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-white">
                            {isPt ? "Tecnologia de Ponta" : "Cutting Edge Technology"}
                        </h2>
                        <ul className="space-y-4">
                            <ListItem text={isPt ? "100% Client-Side (Seus dados não saem do PC)" : "100% Client-Side (Your data stays safe)"} />
                            <ListItem text={isPt ? "Suporte a Vídeos de Fundo (MP4/WebM)" : "Background Video Support (MP4/WebM)"} />
                            <ListItem text={isPt ? "Sincronia Automática de Áudio/Vídeo" : "Automatic Audio/Video Sync"} />
                            <ListItem text={isPt ? "Grátis para uso pessoal e comercial" : "Free for personal and commercial use"} />
                        </ul>
                    </div>
                </div>

                {/* SEO Keywords Hidden-ish Block */}
                <div className="text-xs text-slate-800 text-center max-w-4xl mx-auto">
                    Countdown Creator, Timer Generator, Video Timer Maker, Gerador de Contagem Regressiva, Vídeo de Cronômetro, Relógio Virtual, Online Countdown, DJ Visuals, VJ Loops, Church Media, Igreja Multimídia, OBS Timer, Stream Timer.
                </div>

                <div className="text-center pt-10 border-t border-slate-900/50">
                    <p className="flex items-center justify-center gap-2 text-slate-600 mb-4">
                        {isPt ? "Feito com" : "Made with"} <Heart className="w-4 h-4 text-red-900 fill-red-900" /> {isPt ? "por" : "by"} Professor Pantoja
                    </p>
                    <div className="flex justify-center gap-4">
                        {/* Links Sociais se houver */}
                    </div>
                </div>

            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors">
        <div className="mb-4 bg-slate-800/50 w-14 h-14 rounded-xl flex items-center justify-center">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const ListItem = ({ text }: { text: string }) => (
    <li className="flex items-center gap-3 text-slate-300">
        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
        <span>{text}</span>
    </li>
);
