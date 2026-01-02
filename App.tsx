import React, { useState, useRef, useEffect } from 'react';
import { Controls } from './components/Controls';
import { Preview } from './components/Preview';
import { ImprovementsModal } from './components/ImprovementsModal';
import { useTimer } from './hooks/useTimer';
import { AppearanceState } from './types';
import { DEFAULT_FONT_SIZE, RATIO_VALUES } from './constants';
import { VideoRenderer } from './utils/VideoRenderer'; // Novo Motor
import { Video, StopCircle, Settings, X, Cpu, CheckCircle, Clock, Bug } from 'lucide-react';

import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

import { LandingPage } from './components/LandingPage';
import { FeedbackSection } from './components/FeedbackSection';
import { ProModal } from './components/ProModal';
import { Trophy } from 'lucide-react';


const AppContent: React.FC = () => {
  // ... (rest of the component logic)

  // Configuração Inicial: 5 segundos
  const [duration, setDuration] = useState<number>(5);
  const [showImprovements, setShowImprovements] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  // Novo Estado: Bitrate (Padrão 2.5 Mbps para boa qualidade em 720p)
  const [bitrate, setBitrate] = useState<number>(2500000);

  // Estados para Debug de Performance
  const [renderStats, setRenderStats] = useState({ fps: 0, progress: 0, resolution: 0 });

  // Estado para Relatório Final
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);
  const [lastRenderReport, setLastRenderReport] = useState<{ avgFps: number, totalTime: number } | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const renderStartTimeRef = useRef<number>(0);
  // Auto-Test Mode State
  const [isAutoTestEnabled, setIsAutoTestEnabled] = useState(() => {
    return localStorage.getItem('AUTO_RENDER_TEST') === 'true';
  });

  const [appearance, setAppearance] = useState<AppearanceState>({
    fontSize: DEFAULT_FONT_SIZE,
    fontColor: '#ffffff', // Letra Branca
    fontShadow: true,     // Sombra Ativada
    fontFamily: 'Inter',  // Fonte Padrão
    textPosition: { x: 0, y: 0 },
    aspectRatio: '9:16',
    backgroundType: 'gradient', // Tipo Gradiente
    backgroundColor: '#c084fc',
    backgroundGradient: 'linear-gradient(to bottom right, #c084fc, #7e22ce)', // Gradiente Lilás
    media: null,
    mediaScale: 1,
    mediaPosition: { x: 0, y: 0 },
    syncVideoToTimer: false,
    resolution: 720, // Padrão HD
    animationType: 'roller-mechanical' // PADRÃO ALTERADO PARA SLOT MACHINE
  });

  // Ref para acessar o estado mais recente dentro de callbacks/closures (Auto-Test)
  const appearanceRef = useRef(appearance);
  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  const { timeLeft, isActive, reset, toggle, setTimeLeft } = useTimer(duration);
  const { t } = useLanguage();

  const videoElementRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Instância do Motor
  const rendererRef = useRef<VideoRenderer | null>(null);

  // Efeito para Auto-Start
  useEffect(() => {
    if (isAutoTestEnabled) {
      const timer = setTimeout(() => {
        console.log("⚡ Auto-Test: Iniciando Renderização de 5s...");
        startRecording(5); // Força 5 segundos
      }, 1500); // 1.5s delay para garantir carregamento
      return () => clearTimeout(timer);
    }
  }, []); // Executa apenas no mount

  // Efeito para Carregar Vídeo Padrão
  useEffect(() => {
    if (!appearance.media) {
      const defaultVideoUrl = '/fundo-aguas-calmas-001.mp4';
      const tempVideo = document.createElement('video');
      tempVideo.src = defaultVideoUrl;
      tempVideo.onloadedmetadata = () => {
        setAppearance(prev => ({
          ...prev,
          backgroundType: 'media',
          media: {
            type: 'video',
            url: defaultVideoUrl,
            width: tempVideo.videoWidth,
            height: tempVideo.videoHeight,
            duration: tempVideo.duration
          },
          mediaScale: 1.5, // Zoom Ideal solicitado
          mediaPosition: { x: 0, y: 0 }
        }));
      };
    }
  }, []); // Executa apenas uma vez no mount

  const toggleAutoTest = () => {
    const newState = !isAutoTestEnabled;
    setIsAutoTestEnabled(newState);
    localStorage.setItem('AUTO_RENDER_TEST', String(newState));
  };

  // Função auxiliar para aguardar vídeo carregar
  const waitForVideoReady = async (video: HTMLVideoElement): Promise<void> => {
    if (video.readyState >= 3) return Promise.resolve(); // HAVE_FUTURE_DATA
    return new Promise(resolve => {
      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay);
        resolve();
      };
      video.addEventListener('canplay', onCanPlay);
      // Timeout de segurança
      setTimeout(() => {
        video.removeEventListener('canplay', onCanPlay);
        resolve();
      }, 3000);
    });
  };

  const startRecording = async (overrideDuration?: number) => {
    // FIX CRÍTICO: Matar instância anterior se existir
    if (rendererRef.current) {
      console.warn("⚠️ Conflito Detectado: Parando renderizador anterior antes de iniciar novo.");
      rendererRef.current.stop();
      rendererRef.current = null;
    }

    if (!canvasRef.current) return;

    // Aguardar vídeo estar pronto se for mídia de vídeo
    // Usar Ref aqui também para garantir consistência
    const currentAppearance = appearanceRef.current;
    if (currentAppearance.backgroundType === 'media' && currentAppearance.media?.type === 'video' && videoElementRef.current) {
      console.log("⏳ Aguardando vídeo estar pronto...");
      await waitForVideoReady(videoElementRef.current);
    }

    // FIX CRÍTICO: onClick passa um Evento, então precisamos checar se é NÚMERO
    const finalDuration = typeof overrideDuration === 'number' ? overrideDuration : duration;

    setIsMobileMenuOpen(false);
    if (!overrideDuration) reset(); // Reseta timer visual apenas se não for auto-test (para não bagunçar visual)

    setIsRecording(true);
    setLastDownloadUrl(null);
    setLastRenderReport(null);
    setRenderStats({ fps: 0, progress: finalDuration, resolution: appearanceRef.current.resolution || 720 });


    fpsHistoryRef.current = [];
    renderStartTimeRef.current = Date.now();

    // Instancia o motor independente
    rendererRef.current = new VideoRenderer(
      canvasRef.current,
      videoElementRef.current,
      appearanceRef.current, // FIX: Usar Ref para evitar Stale Closure no Auto-Test
      finalDuration,
      isPro,
      (remainingTime, stats) => {
        // Callback de progresso
        // Atualiza apenas stats, não o timer principal (para economizar React Cycles)
        setRenderStats(prev => ({
          ...prev,
          fps: stats.fps,
          progress: remainingTime,
          resolution: stats.resolution
        }));

        // Coleta dados para relatório final
        if (stats.fps > 0) fpsHistoryRef.current.push(stats.fps);
      },
      (url) => {
        // Callback de conclusão
        setIsRecording(false);
        setLastDownloadUrl(url);

        const totalTime = (Date.now() - renderStartTimeRef.current) / 1000;
        const avgFps = fpsHistoryRef.current.length > 0
          ? Math.round(fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length)
          : 30;

        setLastRenderReport({ avgFps, totalTime });

        // Auto download
        const a = document.createElement('a');
        a.href = url;
        a.download = `contador-${appearance.resolution}p-${duration}s.mp4`;
        a.click();

        // Cleanup
        rendererRef.current = null;
        reset();
      }
    );

    // Inicia (Motor gerencia o loop, React fica passivo)
    rendererRef.current.start(bitrate);
  };

  const stopRecording = () => {
    if (rendererRef.current) {
      rendererRef.current.stop();
      setIsRecording(false);
      reset();
    }
  };

  const handleToggleTimer = () => {
    if (!isActive) setIsMobileMenuOpen(false);
    toggle();
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 overflow-x-hidden relative">
      {/* App Section - Full Screen */}
      <div className="flex flex-col md:flex-row h-screen w-full relative">
        <canvas ref={canvasRef} className="fixed top-0 left-0 opacity-0 pointer-events-none -z-50" />

        <div className="absolute top-4 right-4 md:right-8 z-30 flex items-center gap-3">
          {/* AUTO TEST TRIGGER (Debug) */}
          <button
            onClick={toggleAutoTest}
            className={`p-2 rounded-full transition-all border ${isAutoTestEnabled
              ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
              : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-300'
              }`}
            title={isAutoTestEnabled ? "Auto-Render Ligado (Inicia ao recarregar)" : "Ativar Auto-Render ao Iniciar"}
          >
            <Bug className="w-4 h-4" />
          </button>

          {/* PRO BUTTON */}
          <button
            onClick={() => setShowProModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full shadow-lg font-black tracking-wider text-xs hover:scale-105 transition-transform active:scale-95 border border-yellow-300/30"
          >
            <Trophy className="w-4 h-4 fill-white" />
            {t.proButton || "PRO"}
          </button>
        </div>


        {/* Mobile Menu Button - Só aparece no Mobile */}
        <div className="md:hidden absolute top-4 left-4 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-800 rounded-lg text-white shadow-lg border border-slate-700"
          >
            {isMobileMenuOpen ? <X /> : <Settings />}
          </button>
        </div>

        {/* Controls Sidebar (Desktop: Static | Mobile: Absolute/Drawer) */}
        <div className={`
        fixed inset-y-0 left-0 z-40 w-full md:w-[400px] bg-slate-900 shadow-2xl transform transition-transform duration-300 md:relative md:transform-none md:shadow-xl border-r border-slate-800
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          <Controls
            duration={duration}
            setDuration={setDuration}
            appearance={appearance}
            setAppearance={setAppearance}
            timerControls={{ isActive, toggle, reset }}
            onOpenPro={() => setShowProModal(true)}
            onStartRecording={startRecording}
            isRecording={isRecording}
            onClose={() => setIsMobileMenuOpen(false)}
            bitrate={bitrate}
            setBitrate={setBitrate}
          />
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">
          {/* Pattern Background de fundo da área de preview (estético) */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #475569 1px, transparent 0)', backgroundSize: '40px 40px' }}>
          </div>

          <div className="relative z-10 w-full h-full max-w-full max-h-full p-4 md:p-8 flex items-center justify-center">
            <Preview
              appearance={appearance}
              setAppearance={setAppearance}
              timeLeft={timeLeft}
              videoRef={videoElementRef}
            />
          </div>

          {/* --- OVERLAY DE RENDERIZAÇÃO --- */}
          {isRecording && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="w-full max-w-md space-y-8">

                <div className="text-center space-y-2">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                    <div
                      className="absolute inset-0 border-4 border-indigo-500 rounded-full transition-all duration-300"
                      style={{
                        clipPath: `inset(0 0 ${100 - ((renderStats.progress / duration) * 100)}% 0)` // Invertido para encher
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t.renderingOverlay}</h2>
                  <div className="text-slate-400 text-sm font-mono bg-slate-900/50 inline-block px-3 py-1 rounded-full border border-slate-800">
                    {Math.round((renderStats.progress / duration) * 100)}% ({renderStats.fps} FPS)
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {t.time}
                      </span>
                      <span className="text-slate-300 font-medium">
                        {Math.floor(renderStats.progress)}s <span className="text-slate-600">/ {duration}s</span>
                      </span>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-200 ease-out"
                        style={{ width: `${(renderStats.progress / duration) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{t.resolution}</span>
                      <span className="text-indigo-300 font-medium">{renderStats.resolution}p</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{t.engine}</span>
                      <span className="text-indigo-300 font-medium bg-indigo-900/30 px-2 rounded text-[10px]">WEB-GL BAKED</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={stopRecording}
                  className="w-full py-3 bg-slate-800 hover:bg-red-900/50 hover:text-red-200 border border-slate-700 hover:border-red-500/50 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                >
                  <StopCircle className="w-4 h-4" />
                  {t.cancelRendering}
                </button>
              </div>
            </div>
          )}

          {/* --- TELA DE SUCESSO (Pós Render) --- */}
          {!isRecording && lastRenderReport && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>

                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{t.renderSuccess}</h3>
                <p className="text-slate-400 text-sm mb-6">
                  {t.renderSuccessDescription.replace('{duration}', duration.toString())}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <div className="text-slate-500 mb-1">{t.avgFps}</div>
                    <div className="text-lg font-bold text-white">{lastRenderReport.avgFps}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <div className="text-slate-500 mb-1">{t.totalTime}</div>
                    <div className="text-lg font-bold text-white">{lastRenderReport.totalTime.toFixed(1)}s</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {lastDownloadUrl && (
                    <a
                      href={lastDownloadUrl}
                      download={`contador-${appearance.resolution}p-${duration}s.mp4`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                    >
                      <Video className="w-4 h-4" /> {t.downloadAgain}
                    </a>

                  )}

                  <button
                    onClick={() => setLastRenderReport(null)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                  >
                    {t.createNew}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <ImprovementsModal isOpen={showImprovements} onClose={() => setShowImprovements(false)} />
        <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} onUpgrade={() => setIsPro(true)} />

        {/* Video Element Oculto REMOVIDO: Usamos o ref do Preview para evitar conflitos */}
        {/* <video ref={videoElementRef} className="hidden" /> */}
      </div>

      {/* SEO Landing Page Content (Below the fold) */}
      <LandingPage />
      <FeedbackSection />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;