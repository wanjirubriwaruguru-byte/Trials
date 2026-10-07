import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';
import { ThemeConfig } from '../../types';
import { getTodayDateString } from '../../utils/storage';
import { playSound, triggerVibration } from '../../utils/soundEffects';

interface ResetChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (newStartDate: string, archiveCurrent: boolean, reason: string) => void;
  currentDay: number;
  theme: ThemeConfig;
}

export const ResetChallengeModal: React.FC<ResetChallengeModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  currentDay,
  theme
}) => {
  const [newStartDate, setNewStartDate] = useState(getTodayDateString());
  const [archiveCurrent, setArchiveCurrent] = useState(true);
  const [reason, setReason] = useState('Missed habit standard - restarting Day 1 with fresh focus');

  if (!isOpen) return null;

  const isDark = theme.appearance === 'dark';

  const handleReset = () => {
    playSound('achievement');
    triggerVibration([80, 50, 80]);
    onConfirmReset(newStartDate, archiveCurrent, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
        isDark
          ? 'bg-slate-950 border-rose-500/30 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <RotateCcw className="w-5 h-5 text-rose-500" />
            </span>
            <div>
              <h3 className="font-extrabold text-lg text-rose-400">Reset 75-Day Challenge</h3>
              <p className="text-xs text-slate-400">Restart from Day 1 with zero compromises</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 mb-4 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-300 block mb-0.5">The Iron Standard of Pulse75:</span>
            If you miss a workout, skip a habit, or deviate from your calorie protocol, true transformation demands resetting to Day 1. There is no shame in restarting—only in giving up.
          </div>
        </div>

        {/* Form Settings */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              New Day 1 Start Date
            </label>
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Reason / Reflection Note (Saved to Run History)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Travel disruption, restarting with heightened dedication"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={archiveCurrent}
              onChange={(e) => setArchiveCurrent(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
            />
            <div>
              <span className="font-semibold text-slate-200 block">Archive Day 1 to Day {currentDay} in History</span>
              <span className="text-[11px] text-slate-400">Preserves your body measurements, past workouts, and streak records</span>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm Day 1 Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
