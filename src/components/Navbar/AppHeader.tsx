import React from 'react';
import {
  Sparkles,
  Paperclip,
  RotateCcw,
  SlidersHorizontal,
  Timer,
  Flame,
  Smartphone
} from 'lucide-react';
import { ThemeConfig } from '../../types';
import { PulseMascot } from '../Mascot/PulseMascot';

interface AppHeaderProps {
  currentDay: number;
  streak: number;
  theme: ThemeConfig;
  onOpenSettings: () => void;
  onOpenFileImport: () => void;
  onOpenResetChallenge: () => void;
  onOpenTimerSuite: () => void;
  onOpenNativeAndroid: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentDay,
  streak,
  theme,
  onOpenSettings,
  onOpenFileImport,
  onOpenResetChallenge,
  onOpenTimerSuite,
  onOpenNativeAndroid
}) => {
  const isDark = theme.appearance === 'dark';

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors backdrop-blur-xl ${
      isDark
        ? 'bg-slate-950/85 border-slate-800/80 text-white'
        : 'bg-white/85 border-slate-200/90 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand & Mascot */}
        <div className="flex items-center gap-3">
          <PulseMascot size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                PULSE75
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                theme.style === 'tech'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : theme.style === 'feminine'
                  ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
              }`}>
                {theme.style}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="text-cyan-400 font-semibold">Day {currentDay} of 75</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-pink-400 font-medium">
                <Flame className="w-3.5 h-3.5 inline text-pink-500" />
                {streak} Day Streak
              </span>
            </div>
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Timer Launcher */}
          <button
            type="button"
            onClick={onOpenTimerSuite}
            title="Open Workout Timers"
            className={`p-2 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-500/50'
                : 'bg-slate-100 hover:bg-slate-200 text-cyan-600 border border-slate-200'
            }`}
          >
            <Timer className="w-4 h-4" />
          </button>

          {/* Native Android APK Launcher */}
          <button
            type="button"
            onClick={onOpenNativeAndroid}
            title="Install Native Android App (APK)"
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
              isDark
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Android APK</span>
          </button>

          {/* Attach / Import File */}
          <button
            type="button"
            onClick={onOpenFileImport}
            title="Attach File (Detect workouts, logs & measurements)"
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
              isDark
                ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Attach File</span>
          </button>

          {/* Reset 75-Day Challenge Trigger */}
          <button
            type="button"
            onClick={onOpenResetChallenge}
            title="Reset 75-Day Challenge"
            className={`p-2 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isDark
                ? 'bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40'
                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Settings & Themes */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Profile, Appearance & Settings"
            className={`p-2 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
