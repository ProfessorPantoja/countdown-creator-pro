import React from 'react';
import { Monitor, Move } from 'lucide-react';
import { AppearanceState, AspectRatio } from '../../types';
import { RATIO_LABELS, RATIO_VALUES } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';

interface RatioSectionProps {
    appearance: AppearanceState;
    setAppearance: React.Dispatch<React.SetStateAction<AppearanceState>>;
}

export const RatioSection: React.FC<RatioSectionProps> = ({ appearance, setAppearance }) => {
    const { t } = useLanguage();

    const setRatioToMedia = () => {
        if (appearance.media?.aspectRatio) {
            setAppearance(prev => ({
                ...prev,
                aspectRatio: 'custom',
                customRatioValue: prev.media!.aspectRatio
            }));
        }
    };

    return (
        <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4" /> {t.ratio}
            </label>
            <select
                value={appearance.aspectRatio}
                onChange={(e) => setAppearance((prev) => ({ ...prev, aspectRatio: e.target.value as AspectRatio }))}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
                {(Object.keys(RATIO_LABELS) as AspectRatio[]).map((ratio) => (
                    <option key={ratio} value={ratio}>
                        {RATIO_LABELS[ratio]}
                    </option>
                ))}
            </select>

            {appearance.media && (
                <button
                    onClick={setRatioToMedia}
                    className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs rounded border border-indigo-500/30 transition-colors flex items-center justify-center gap-2"
                >
                    <Move className="w-3 h-3" />
                    {t.customRatio}
                </button>
            )}
        </div>
    );
};
