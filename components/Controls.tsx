import React from 'react';
import { Settings, X, Play, Pause, RotateCcw, Download, Info, Signal, Gauge } from 'lucide-react';
import { AppearanceState } from '../types';
import { RatioSection } from './controls/RatioSection';
import { BackgroundSection } from './controls/BackgroundSection';
import { TypographySection } from './controls/TypographySection';
import { TimeSection } from './controls/TimeSection';

interface ControlsProps {
  duration: number;
  setDuration: (m: number) => void;
  appearance: AppearanceState;
  setAppearance: React.Dispatch<React.SetStateAction<AppearanceState>>;
  timerControls: {
    isActive: boolean;
    toggle: () => void;
    reset: () => void;
  };
  onOpenImprovements: () => void;
  onStartRecording: () => void;
  isRecording: boolean;
  onClose?: () => void;
  bitrate?: number;
  setBitrate?: (b: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  duration,
  setDuration,
  appearance,
  setAppearance,
  timerControls,
  onOpenImprovements,
  onStartRecording,
  isRecording,
  onClose,
  bitrate = 2500000,
  setBitrate
}) => {

  const bitrateOptions = [
    { label: '1M', value: 1000000 },
    { label: '2.5M', value: 2500000 },
    { label: '5M', value: 5000000 },
    { label: '8M', value: 8000000 },
  ];

  const resolutionOptions = [
    { label: '480p (Rápido)', value: 480 },
    { label: '540p (qHD)', value: 540 },
    { label: '720p (HD)', value: 720 },
    { label: '1080p (Full)', value: 1080 },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-950 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
          <Settings className="w-5 h-5" />
          Configuração
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Main Content Sections */}
      <div className="p-4 space-y-6 flex-1 pb-24 md:pb-4">
        <RatioSection appearance={appearance} setAppearance={setAppearance} />
        <BackgroundSection appearance={appearance} setAppearance={setAppearance} />
        <TypographySection appearance={appearance} setAppearance={setAppearance} />
        <TimeSection duration={duration} setDuration={setDuration} disabled={timerControls.isActive || isRecording} />
      </div>

      {/* Footer Controls */}
      <div className="p-4 bg-slate-950 border-t border-slate-700 grid grid-cols-2 gap-3 sticky bottom-0 z-20">

        {/* Quality Controls */}
        <div className="col-span-2 grid grid-cols-2 gap-2 mb-2">
          {setBitrate && (
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Signal className="w-3 h-3" /> Bitrate
              </label>
              <select
                value={bitrate}
                onChange={(e) => setBitrate(Number(e.target.value))}
                className="w-full bg-slate-800 text-xs p-1 rounded border border-slate-700 outline-none"
              >
                {bitrateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          )}
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Gauge className="w-3 h-3" /> Resolução
            </label>
            <select
              value={appearance.resolution || 720}
              onChange={(e) => setAppearance(prev => ({ ...prev, resolution: Number(e.target.value) }))}
              className="w-full bg-slate-800 text-xs p-1 rounded border border-slate-700 outline-none"
            >
              {resolutionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Play/Pause (Disabled during recording) */}
        <button
          onClick={timerControls.toggle}
          disabled={isRecording}
          className={`col-span-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${timerControls.isActive
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {timerControls.isActive ? (
            <><Pause className="w-5 h-5" /> Pausar</>
          ) : (
            <><Play className="w-5 h-5" /> Iniciar</>
          )}
        </button>

        <button
          onClick={timerControls.reset}
          disabled={isRecording}
          className="col-span-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <RotateCcw className="w-5 h-5" /> Reset
        </button>

        {/* RECORD BUTTON */}
        <button
          onClick={onStartRecording}
          disabled={timerControls.isActive || isRecording}
          className="col-span-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-red-900/20"
        >
          <Download className="w-5 h-5" />
          {isRecording ? 'Renderizando...' : 'Gravar Vídeo'}
        </button>

        <button
          onClick={onOpenImprovements}
          className="col-span-2 mt-1 text-xs text-slate-500 hover:text-indigo-400 flex items-center justify-center gap-1 py-1"
        >
          <Info className="w-3 h-3" />
          Sugestões de Melhoria
        </button>
      </div>
    </div>
  );
};