import React from 'react';
import { Type, Sparkles, Type as TypeIcon } from 'lucide-react';
import { AppearanceState, AnimationType } from '../../types';
import { FONT_FAMILIES, ANIMATION_TYPES, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../../constants';

interface TypographySectionProps {
    appearance: AppearanceState;
    setAppearance: React.Dispatch<React.SetStateAction<AppearanceState>>;
}

export const TypographySection: React.FC<TypographySectionProps> = ({ appearance, setAppearance }) => {
    return (
        <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-4 h-4" /> Tipografia e Posição
            </label>
            <div className="space-y-4">
                {/* Font Family Selection */}
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <TypeIcon className="w-3 h-3" /> Fonte (Google Fonts)
                    </div>
                    <select
                        value={appearance.fontFamily || 'Inter'}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, fontFamily: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        style={{ fontFamily: appearance.fontFamily }}
                    >
                        {FONT_FAMILIES.map(font => (
                            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                {font.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Animation Selection */}
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Animação
                    </div>
                    <select
                        value={appearance.animationType || 'none'}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, animationType: e.target.value as AnimationType }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {(Object.keys(ANIMATION_TYPES) as AnimationType[]).map(key => (
                            <option key={key} value={key}>
                                {ANIMATION_TYPES[key]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Font Size */}
                <div className="space-y-1 border-t border-slate-700 pt-3">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Tamanho</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={appearance.fontSize}
                                onChange={(e) => setAppearance((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                                className="w-16 bg-slate-700 border border-slate-600 rounded px-1 text-right text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <span>px</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min={MIN_FONT_SIZE}
                        max={MAX_FONT_SIZE}
                        value={appearance.fontSize}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <input
                        type="color"
                        value={appearance.fontColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, fontColor: e.target.value }))}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-slate-300">Cor do Texto</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                        type="checkbox"
                        checked={appearance.fontShadow}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, fontShadow: e.target.checked }))}
                        className="rounded bg-slate-700 border-slate-500 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-300">Sombra (Contraste)</span>
                </label>
            </div>
        </div>
    );
};
