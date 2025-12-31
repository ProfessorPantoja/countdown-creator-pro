import React, { useState, useRef, useEffect } from 'react';
import { Controls } from './components/Controls';
import { Preview } from './components/Preview';
import { ImprovementsModal } from './components/ImprovementsModal';
import { useTimer } from './hooks/useTimer';
import { AppearanceState } from './types';
import { DEFAULT_FONT_SIZE, RATIO_VALUES } from './constants';
import { VideoRenderer } from './utils/VideoRenderer'; // Novo Motor
import { Video, Loader2, StopCircle, Settings, X, Activity, Cpu, CheckCircle, FileVideo, Clock, BarChart } from 'lucide-react';

const App: React.FC = () => {
  // Configuração Inicial: 7 segundos
  const [duration, setDuration] = useState<number>(7);
  const [showImprovements, setShowImprovements] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Novo Estado: Bitrate (Padrão 2.5 Mbps para boa qualidade em 720p)
  const [bitrate, setBitrate] = useState<number>(2500000);

  // Estados para Debug de Performance
  const [renderStats, setRenderStats] = useState({ fps: 0, progress: 0, resolution: 0 });
  
  // Estado para Relatório Final
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);
  const [lastRenderReport, setLastRenderReport] = useState<{avgFps: number, totalTime: number} | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const renderStartTimeRef = useRef<number>(0);

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

  const { timeLeft, isActive, reset, toggle, setTimeLeft } = useTimer(duration);
  
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Instância do Motor
  const rendererRef = useRef<VideoRenderer | null>(null);

  const startRecording = () => {
    if (!canvasRef.current) return;
    
    setIsMobileMenuOpen(false);
    reset(); // Reseta timer visual
    setIsRecording(true);
    setLastDownloadUrl(null);
    setLastRenderReport(null);
    setRenderStats({ fps: 0, progress: duration, resolution: appearance.resolution || 720 });
    
    fpsHistoryRef.current = [];
    renderStartTimeRef.current = Date.now();

    // Instancia o motor independente
    rendererRef.current = new VideoRenderer(
        canvasRef.current,
        videoElementRef.current,
        appearance,
        duration,
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
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black overflow-hidden font-sans relative">
      <canvas ref={canvasRef} className="fixed top-0 left-0 opacity-0 pointer-events-none -z-50" />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-96 flex-col border-r border-slate-700 shadow-2xl z-30 bg-slate-900 h-full relative">
        <Controls 
          duration={duration} 
          setDuration={setDuration}
          appearance={appearance}
          setAppearance={setAppearance}
          timerControls={{ isActive, reset, toggle: handleToggleTimer }}
          onOpenImprovements={() => setShowImprovements(true)}
          onStartRecording={startRecording}
          isRecording={isRecording}
          bitrate={bitrate}
          setBitrate={setBitrate}
        />
      </div>

      {/* Mobile Settings Modal */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-200">
           <Controls 
             duration={duration} 
             setDuration={setDuration}
             appearance={appearance}
             setAppearance={setAppearance}
             timerControls={{ isActive, reset, toggle: handleToggleTimer }}
             onOpenImprovements={() => setShowImprovements(true)}
             onStartRecording={startRecording}
             isRecording={isRecording}
             onClose={() => setIsMobileMenuOpen(false)}
             bitrate={bitrate}
             setBitrate={setBitrate}
           />
        </div>
      )}

      {/* Preview Section */}
      <div className="flex-1 relative h-full w-full overflow-hidden flex items-center justify-center bg-slate-950 p-0 md:p-10">
        
        {/* CORREÇÃO: Preview mantido montado para garantir que o elemento <video> não seja destruído/pausado */}
        {/* Usamos a fonte da Appearance para o Preview também */}
        <div 
           className={`w-full h-full flex items-center justify-center transition-opacity duration-500 ${isRecording ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
           style={{ fontFamily: appearance.fontFamily }}
        >
            <Preview 
                appearance={appearance}
                setAppearance={setAppearance}
                timeLeft={timeLeft}
                videoRef={videoElementRef}
            />
        </div>

        {/* Botão flutuante mobile */}
        {!isRecording && !isMobileMenuOpen && (
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="md:hidden absolute top-4 right-4 z-40 p-3 bg-slate-800/80 backdrop-blur-md text-white rounded-full shadow-lg border border-slate-600 active:scale-90 transition-all hover:bg-slate-700"
             aria-label="Configurações"
           >
             <Settings className="w-6 h-6" />
           </button>
        )}
      </div>

      {/* Recording Overlay com Debug */}
      {isRecording && (
        <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-sm">
           <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700 flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full animate-in zoom-in duration-300 relative overflow-hidden">
              
              {/* Progress Bar Top */}
              <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${((duration - renderStats.progress) / duration) * 100}%` }}></div>

              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/10 rounded-full animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-white">Gerando Vídeo...</h2>
                <p className="text-slate-400 text-xs">Mantenha a aba aberta</p>
              </div>

              <div className="text-5xl font-mono font-black text-white bg-black/50 px-6 py-4 rounded-xl border border-white/10 w-full tracking-wider shadow-inner">
                 {Math.ceil(renderStats.progress)}s
              </div>

              {/* LIVE REPORT */}
              <div className="w-full bg-slate-950/50 rounded-lg p-4 border border-slate-800 text-xs font-mono text-left space-y-3">
                 <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-800 pb-2 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-widest">Monitor de Performance</span>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">FPS Atual</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden`}>
                                <div 
                                  className={`h-full transition-all duration-300 ${renderStats.fps < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                                  style={{ width: `${(renderStats.fps / 30) * 100}%` }}
                                />
                            </div>
                            <span className={`font-bold w-8 text-right ${renderStats.fps < 25 ? 'text-yellow-500' : 'text-green-500'}`}>
                                {renderStats.fps}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Resolução</span>
                        <span className="text-indigo-300 font-medium">{renderStats.resolution}p</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Motor</span>
                        <span className="text-indigo-300 font-medium bg-indigo-900/30 px-2 rounded text-[10px]">WEB-GL BAKED</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={stopRecording}
                className="w-full py-3 bg-slate-800 hover:bg-red-900/50 hover:text-red-200 border border-slate-700 hover:border-red-500/50 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
              >
                <StopCircle className="w-4 h-4" />
                Cancelar Renderização
              </button>
           </div>
        </div>
      )}

      {/* Download Success / Summary Modal */}
      {lastDownloadUrl && !isRecording && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-slate-900 border border-green-500/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                             <CheckCircle className="text-green-400 w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Renderização Concluída!</h3>
                            <p className="text-xs text-slate-400">O download iniciou automaticamente.</p>
                        </div>
                    </div>
                    <button onClick={() => setLastDownloadUrl(null)} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {lastRenderReport && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                             <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Média FPS</span>
                             <span className="text-2xl font-mono text-green-400 font-bold">{lastRenderReport.avgFps}</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                             <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Tempo Total</span>
                             <span className="text-2xl font-mono text-indigo-400 font-bold">{lastRenderReport.totalTime.toFixed(1)}s</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <a 
                        href={lastDownloadUrl} 
                        download={`contador-${appearance.resolution}p.mp4`} 
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                    >
                        <FileVideo className="w-4 h-4" />
                        Baixar Novamente
                    </a>
                    <button 
                        onClick={() => setLastDownloadUrl(null)}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
                    >
                        Criar Novo Vídeo
                    </button>
                </div>
             </div>
         </div>
      )}

      <ImprovementsModal isOpen={showImprovements} onClose={() => setShowImprovements(false)} />
    </div>
  );
};

export default App;