import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TimeSectionProps {
    duration: number;
    setDuration: (m: number) => void;
    disabled?: boolean;
}

export const TimeSection: React.FC<TimeSectionProps> = ({ duration, setDuration, disabled = false }) => {
    const { t } = useLanguage();

    const formatDurationLabel = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return s > 0 ? `${m}m ${s}s` : `${m}m`;
    };

    return (
        <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t.time}
            </label>
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>{t.adjustSeconds}</span>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                // Limit to 1 hour (3600s) to prevent crash
                                if (val > 3600) setDuration(3600);
                                else setDuration(Math.max(1, val));
                            }}
                            max={3600}
                            disabled={disabled}
                            className="w-16 bg-slate-700 border border-slate-600 rounded px-1 text-right text-xs focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
                        />
                        <span>seg</span>
                        <span className="text-[10px] text-slate-500 ml-1">(Max: 1h)</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="3"
                        max="600" // 10 minutes
                        step="1"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        disabled={disabled}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
                    />
                    <span className="font-mono text-xl font-bold bg-slate-800 px-3 py-1 rounded w-24 text-center text-sm flex items-center justify-center">
                        {formatDurationLabel(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
};
