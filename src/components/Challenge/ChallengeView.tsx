import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Award,
  RotateCcw,
  Sparkles,
  Camera,
  PenLine,
  Smile,
  Zap,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { ChallengeState, DayRecord, Habit, ThemeConfig } from '../../types';
import { playSound, triggerVibration } from '../../utils/soundEffects';
import { fireAchievementParticles } from '../../utils/confetti';

interface ChallengeViewProps {
  challenge: ChallengeState;
  habits: Habit[];
  onUpdateDay: (dayNumber: number, updatedDay: Partial<DayRecord>) => void;
  onOpenResetModal: () => void;
  theme: ThemeConfig;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  challenge,
  habits,
  onUpdateDay,
  onOpenResetModal,
  theme
}) => {
  const [selectedDayNum, setSelectedDayNum] = useState<number>(challenge.currentDayNumber);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // Day Modal edits
  const selectedDay = challenge.days[selectedDayNum] || {
    dayNumber: selectedDayNum,
    date: '',
    status: 'pending',
    notes: '',
    mood: 3,
    energy: 3,
    habitsCompleted: [],
    workoutsCompleted: [],
    waterMl: 0,
    steps: 0
  };

  const isDark = theme.appearance === 'dark';

  const completedDaysCount = Object.values(challenge.days).filter((d) => d.status === 'completed').length;
  const completionPercentage = Math.round((completedDaysCount / 75) * 100);

  const handleOpenDay = (dayNum: number) => {
    setSelectedDayNum(dayNum);
    setIsDayModalOpen(true);
    playSound('tap');
  };

  const handleSetDayStatus = (status: DayRecord['status']) => {
    onUpdateDay(selectedDayNum, { status });
    if (status === 'completed') {
      fireAchievementParticles();
      playSound('achievement');
    } else {
      playSound('tap');
    }
  };

  const handleToggleHabitForDay = (habitId: string) => {
    const currentList = selectedDay.habitsCompleted || [];
    const exists = currentList.includes(habitId);
    const updated = exists ? currentList.filter((id) => id !== habitId) : [...currentList, habitId];
    onUpdateDay(selectedDayNum, { habitsCompleted: updated });
    playSound(exists ? 'tap' : 'complete');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        onUpdateDay(selectedDayNum, { photoUrl: reader.result as string });
        playSound('complete');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header with Hero Progress Ring */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
        isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-cyan-500/30 glow-cyan' : 'bg-white border-cyan-200 shadow-md'
      }`}>
        {/* Left: Progress Ring */}
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="54"
                className="stroke-slate-800"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="url(#ring-gradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - completedDaysCount / 75)}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#9d00ff" />
                  <stop offset="100%" stopColor="#ff007a" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-extrabold font-mono text-cyan-300">
                {completionPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {completedDaysCount}/75 Done
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                ACTIVE PROTOCOL
              </span>
              <span className="text-xs text-slate-400">Started {challenge.startDate}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">75-Day Transformation</h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-sm">
              Current streak: <strong className="text-pink-400">{challenge.streak.current} days</strong> · Best: <strong className="text-cyan-400">{challenge.streak.longest} days</strong>
            </p>
          </div>
        </div>

        {/* Right: Quick Reset Trigger */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onOpenResetModal}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset 75 Days</span>
          </button>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 font-medium">Days Finished</span>
          <span className="text-xl font-extrabold font-mono text-cyan-400">{completedDaysCount}</span>
          <span className="text-[10px] text-slate-500 block">of 75 required</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 font-medium">Remaining</span>
          <span className="text-xl font-extrabold font-mono text-purple-400">{75 - completedDaysCount}</span>
          <span className="text-[10px] text-slate-500 block">days to completion</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 font-medium">Current Streak</span>
          <span className="text-xl font-extrabold font-mono text-pink-400">{challenge.streak.current}</span>
          <span className="text-[10px] text-slate-500 block">unbroken days</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 font-medium">Past Runs Reset</span>
          <span className="text-xl font-extrabold font-mono text-slate-200">{challenge.runHistory?.length || 0}</span>
          <span className="text-[10px] text-slate-500 block">archived attempts</span>
        </div>
      </div>

      {/* 75-Day Interactive Grid */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="font-extrabold text-sm text-slate-100">75-Day Calendar Matrix</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" /> Done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" /> Today
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Pending
            </span>
          </div>
        </div>

        {/* 75 Grid Cells */}
        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {Array.from({ length: 75 }).map((_, i) => {
            const dayNum = i + 1;
            const dayRecord = challenge.days[dayNum];
            const isCompleted = dayRecord?.status === 'completed';
            const isMissed = dayRecord?.status === 'missed';
            const isToday = dayNum === challenge.currentDayNumber;

            let cellClass = 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700';

            if (isCompleted) {
              cellClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.25)]';
            } else if (isMissed) {
              cellClass = 'bg-rose-500/20 border-rose-500 text-rose-400';
            } else if (isToday) {
              cellClass = 'bg-pink-500/20 border-pink-400 text-pink-300 animate-cyber-pulse';
            }

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleOpenDay(dayNum)}
                className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 font-mono text-xs font-bold transition-all cursor-pointer hover:scale-105 ${cellClass}`}
              >
                <span>{dayNum}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 mt-0.5 stroke-[2.5]" />
                )}
                {isToday && !isCompleted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-0.5 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* DAY DETAIL / CHECK-IN MODAL */}
      {isDayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
            isDark ? 'bg-slate-950 border-cyan-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  DAY CHECK-IN & LOG
                </span>
                <h3 className="font-extrabold text-xl text-white">Day {selectedDayNum} of 75</h3>
                <span className="text-xs text-slate-400 font-mono">{selectedDay.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSetDayStatus('completed')}
                className={`py-2 rounded-xl border transition-all ${
                  selectedDay.status === 'completed'
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => handleSetDayStatus('in_progress')}
                className={`py-2 rounded-xl border transition-all ${
                  selectedDay.status === 'in_progress'
                    ? 'bg-purple-500 border-purple-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-purple-400 hover:bg-slate-800'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => handleSetDayStatus('missed')}
                className={`py-2 rounded-xl border transition-all ${
                  selectedDay.status === 'missed'
                    ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-slate-800'
                }`}
              >
                Missed Standard
              </button>
            </div>

            {/* Day Habits Checklist */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-bold text-slate-300 block">Habits Checked for Day {selectedDayNum}</span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {habits.map((h) => {
                  const isChecked = selectedDay.habitsCompleted?.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleToggleHabitForDay(h.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold truncate">{h.title}</span>
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isChecked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-950'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood & Energy Ratings */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-cyan-400" />
                  Mood Rating ({selectedDay.mood || 3}/5)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={selectedDay.mood || 3}
                  onChange={(e) => onUpdateDay(selectedDayNum, { mood: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-pink-400" />
                  Energy Level ({selectedDay.energy || 3}/5)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={selectedDay.energy || 3}
                  onChange={(e) => onUpdateDay(selectedDayNum, { energy: parseInt(e.target.value, 10) })}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>

            {/* Daily Reflection Notes */}
            <div className="mb-4 text-xs">
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <PenLine className="w-3.5 h-3.5 text-purple-400" />
                Daily Journal / Win / Reflection
              </label>
              <textarea
                rows={2}
                value={selectedDay.notes || ''}
                onChange={(e) => onUpdateDay(selectedDayNum, { notes: e.target.value })}
                placeholder="What challenges did you conquer today?"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Progress Photo for Day */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 mb-4 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  Progress Photo for Day {selectedDayNum}
                </span>
                <label className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold cursor-pointer hover:bg-cyan-500/20">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {selectedDay.photoUrl ? (
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={selectedDay.photoUrl}
                    alt={`Day ${selectedDayNum}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No photo attached for this day.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDayModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
