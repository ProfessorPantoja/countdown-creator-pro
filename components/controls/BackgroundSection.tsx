import React from 'react';
import { Layers, Video, Image as ImageIcon, Maximize, Zap, Trash2, RefreshCcw } from 'lucide-react';
import { AppearanceState, BackgroundType } from '../../types';
import { SOLID_COLORS, GRADIENTS, RATIO_VALUES } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';

interface BackgroundSectionProps {
    appearance: AppearanceState;
    setAppearance: React.Dispatch<React.SetStateAction<AppearanceState>>;
}

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({ appearance, setAppearance }) => {
    const { t } = useLanguage();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video') ? 'video' : 'image';

            if (type === 'video') {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    setAppearance((prev) => ({
                        ...prev,
                        backgroundType: 'media',
                        media: {
                            type,
                            url,
                            name: file.name,
                            width: video.videoWidth,
                            height: video.videoHeight,
                            aspectRatio: video.videoWidth / video.videoHeight,
                            duration: video.duration
                        },
                        mediaScale: 1,
                        mediaPosition: { x: 0, y: 0 },
                        syncVideoToTimer: false // reset sync on new file
                    }));
                };
                video.src = url;
            } else {
                const img = new Image();
                img.onload = () => {
                    setAppearance((prev) => ({
                        ...prev,
                        backgroundType: 'media',
                        media: {
                            type,
                            url,
                            name: file.name,
                            width: img.width,
                            height: img.height,
                            aspectRatio: img.width / img.height
                        },
                        mediaScale: 1,
                        mediaPosition: { x: 0, y: 0 }
                    }));
                };
                img.src = url;
            }
        }
    };

    const fillScreen = () => {
        if (!appearance.media) return;

        const canvasRatio = appearance.aspectRatio === 'custom'
            ? (appearance.customRatioValue || 1)
            : RATIO_VALUES[appearance.aspectRatio as keyof typeof RATIO_VALUES];

        // Fórmulas baseadas em referência 1080p (compatível com Preview/Renderer)
        // Calcula qual escala é necessária para cobrir altura (1080) e largura (1080 * ratio)
        const scaleY = 1080 / appearance.media.height;
        const scaleX = (1080 * canvasRatio) / appearance.media.width;

        // Pega o maior valor para garantir cobertura (Cover)
        const bestScale = Math.max(scaleX, scaleY);

        setAppearance(prev => ({ ...prev, mediaScale: bestScale, mediaPosition: { x: 0, y: 0 } }));
    };

    const handleResetPosition = () => {
        setAppearance(prev => ({ ...prev, mediaPosition: { x: 0, y: 0 }, mediaScale: 1 }));
    };

    const handleDeleteMedia = () => {
        setAppearance(prev => ({
            ...prev,
            media: null,
            backgroundType: 'gradient', // volta para gradiente como padrão
            mediaScale: 1,
            mediaPosition: { x: 0, y: 0 }
        }));
    };

    return (
        <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> {t.background}
            </label>

            <div className="flex bg-slate-800 p-1 rounded-lg mb-3">
                {(['solid', 'gradient', 'media'] as BackgroundType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => setAppearance(prev => ({ ...prev, backgroundType: type }))}
                        className={`flex-1 py-1 text-xs font-medium rounded transition-all ${appearance.backgroundType === type
                            ? 'bg-slate-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        {t.bgTypes[type]}
                    </button>
                ))}
            </div>

            {appearance.backgroundType === 'solid' && (
                <div className="grid grid-cols-4 gap-2">
                    {SOLID_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setAppearance(prev => ({ ...prev, backgroundColor: color }))}
                            className={`w-full aspect-square rounded border-2 transition-transform hover:scale-105 ${appearance.backgroundColor === color ? 'border-indigo-500' : 'border-transparent'
                                }`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                    <div className="col-span-4 mt-2">
                        <input
                            type="color"
                            value={appearance.backgroundColor}
                            onChange={(e) => setAppearance(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="w-full h-8 rounded cursor-pointer bg-transparent"
                        />
                    </div>
                </div>
            )}

            {appearance.backgroundType === 'gradient' && (
                <div className="grid grid-cols-2 gap-2">
                    {GRADIENTS.map((grad, idx) => (
                        <button
                            key={idx}
                            onClick={() => setAppearance(prev => ({ ...prev, backgroundGradient: grad }))}
                            className={`w-full h-12 rounded border-2 transition-transform hover:scale-105 ${appearance.backgroundGradient === grad ? 'border-indigo-500' : 'border-transparent'
                                }`}
                            style={{ background: grad }}
                        />
                    ))}
                </div>
            )}

            {appearance.backgroundType === 'media' && (
                <div className="space-y-3">
                    <label className="flex items-center justify-center gap-2 w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed rounded cursor-pointer transition-colors group">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-400 group-hover:text-indigo-300">{t.uploadMedia}</span>
                            <span className="text-[10px] text-slate-500">{t.dragHint}</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                    </label>

                    {appearance.media && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <div className="text-xs text-green-400 truncate flex items-center gap-1 bg-green-900/20 p-1 rounded px-2">
                                {appearance.media.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                {appearance.media.name}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={fillScreen}
                                    className="flex-1 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded border border-slate-600 transition-colors flex items-center justify-center gap-2"
                                    title="Preenche a tela toda com a mídia"
                                >
                                    <Maximize className="w-3 h-3" />
                                    {t.coverButton && t.coverButton !== "Cover" ? t.coverButton : "PREENCHER"}
                                </button>
                                <button
                                    onClick={handleResetPosition}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded border border-slate-600 transition-colors flex items-center justify-center"
                                    title="Resetar Posição"
                                >
                                    <RefreshCcw className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleDeleteMedia}
                                    className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-200 text-xs rounded border border-red-900/50 transition-colors flex items-center justify-center"
                                    title="Remover Mídia"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Sync Checkbox - Only for Video */}
                            {appearance.media.type === 'video' && (
                                <label className="flex items-start gap-2 p-2 rounded bg-indigo-900/20 border border-indigo-500/30 cursor-pointer hover:bg-indigo-900/30 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={appearance.syncVideoToTimer}
                                        onChange={(e) => setAppearance(prev => ({ ...prev, syncVideoToTimer: e.target.checked }))}
                                        className="mt-0.5 rounded bg-slate-800 border-indigo-500 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> {t.syncVideo}
                                        </span>
                                        <span className="text-[10px] text-indigo-200/60 leading-tight">
                                            {t.syncVideoDesc}
                                        </span>
                                    </div>
                                </label>
                            )}

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>{t.zoom}</span>
                                    <span>{Math.round(appearance.mediaScale * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5"
                                    step="0.01"
                                    value={appearance.mediaScale}
                                    onChange={(e) => setAppearance(prev => ({ ...prev, mediaScale: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
