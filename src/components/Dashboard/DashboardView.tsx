import React from 'react';
import {
  Flame,
  Droplets,
  Dumbbell,
  CheckSquare,
  Scale,
  Plus,
  Play,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Timer,
  Paperclip,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Zap,
  Target
} from 'lucide-react';
import {
  ChallengeState,
  Habit,
  Workout,
  BodyMeasurement,
  UserProfile,
  ThemeConfig
} from '../../types';
import { calculateCalorieTargets } from '../../utils/calorieEngine';
import { PulseMascot } from '../Mascot/PulseMascot';
import { playSound, triggerVibration } from '../../utils/soundEffects';
import { fireAchievementParticles } from '../../utils/confetti';
import { WeeklyTrendsSection } from './WeeklyTrendsSection';

interface DashboardViewProps {
  challenge: ChallengeState;
  habits: Habit[];
  workouts: Workout[];
  measurements: BodyMeasurement[];
  profile: UserProfile;
  theme: ThemeConfig;
  onNavigate: (tab: any) => void;
  onToggleHabit: (habitId: string) => void;
  onAddWater: (amountMl: number) => void;
  onOpenTimerSuite: () => void;
  onOpenFileImport: () => void;
  onOpenResetChallenge: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  challenge,
  habits,
  workouts,
  measurements,
  profile,
  theme,
  onNavigate,
  onToggleHabit,
  onAddWater,
  onOpenTimerSuite,
  onOpenFileImport,
  onOpenResetChallenge
}) => {
  const isDark = theme.appearance === 'dark';
  const calculation = calculateCalorieTargets(profile);

  const currentDayNum = challenge.currentDayNumber;
  const currentDayRecord = challenge.days[currentDayNum] || {
    dayNumber: currentDayNum,
    date: 'Today',
    status: 'in_progress',
    notes: '',
    mood: 4,
    energy: 4,
    habitsCompleted: [],
    workoutsCompleted: [],
    waterMl: 2250,
    steps: 6840
  };

  const completedDaysCount = Object.values(challenge.days).filter((d) => d.status === 'completed').length;
  const completionPercent = Math.round((completedDaysCount / 75) * 100);

  const todayHabitsDoneCount = habits.filter((h) => currentDayRecord.habitsCompleted?.includes(h.id)).length;
  const todayHabitsPercent = habits.length ? Math.round((todayHabitsDoneCount / habits.length) * 100) : 0;

  const currentWater = currentDayRecord.waterMl || 0;
  const waterGoal = profile.waterGoalMl || 3700;
  const waterPercent = Math.min(100, Math.round((currentWater / waterGoal) * 100));

  // Weight progression
  const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const baselineWeight = sortedMeasurements[0]?.weightKg || profile.currentWeightKg;
  const currentWeight = sortedMeasurements[sortedMeasurements.length - 1]?.weightKg || profile.currentWeightKg;
  const weightLost = Number((baselineWeight - currentWeight).toFixed(1));

  const handleQuickWaterAdd = (amount: number) => {
    onAddWater(amount);
    playSound('tap');
    if (currentWater + amount >= waterGoal) {
      fireAchievementParticles();
      playSound('complete');
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* 1. HERO BANNER: Day of 75 & Streak & Mascot */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-cyan-500/40 glow-cyan'
          : 'bg-white border-cyan-200 shadow-md'
      }`}>
        <div className="flex items-center gap-5 w-full md:w-auto">
          <PulseMascot mood={todayHabitsPercent === 100 ? 'cheering' : 'pumped'} size="lg" showQuote />

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PULSE75 PROTOCOL
              </span>
              <span className="text-xs text-slate-400">Day {currentDayNum} of 75</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              Day {currentDayNum}{' '}
              <span className="text-sm font-bold text-cyan-400 font-mono">({completionPercent}% Done)</span>
            </h1>

            <div className="flex items-center gap-3 text-xs mt-1.5">
              <span className="flex items-center gap-1 font-bold text-pink-400">
                <Flame className="w-4 h-4 fill-pink-500 text-pink-500" />
                {challenge.streak.current} Day Streak
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-medium">
                {75 - completedDaysCount} Days to Transcendence
              </span>
            </div>
          </div>
        </div>

        {/* Challenge Progress Ring Mini */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">75-Day Progress</span>
            <span className="text-xl font-extrabold font-mono text-cyan-300">{completedDaysCount} / 75 Days</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('challenge')}
            className="p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer"
            title="View 75-Day Matrix"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. QUICK ACTIONS BAR */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button
          type="button"
          onClick={() => handleQuickWaterAdd(250)}
          className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center gap-1 text-xs cursor-pointer group"
        >
          <Droplets className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-slate-200">+250ml</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickWaterAdd(500)}
          className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center gap-1 text-xs cursor-pointer group"
        >
          <Droplets className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-slate-200">+500ml</span>
        </button>

        <button
          type="button"
          onClick={onOpenTimerSuite}
          className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-purple-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center gap-1 text-xs cursor-pointer group"
        >
          <Timer className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-slate-200">Timer</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('body')}
          className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-pink-500/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center gap-1 text-xs cursor-pointer group"
        >
          <Scale className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-slate-200">Log Weight</span>
        </button>

        <button
          type="button"
          onClick={onOpenFileImport}
          className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all flex flex-col items-center justify-center gap-1 text-xs cursor-pointer group"
        >
          <Paperclip className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-cyan-300">Attach File</span>
        </button>

        <button
          type="button"
          onClick={onOpenResetChallenge}
          className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all flex flex-col items-center justify-center gap-1 text-xs cursor-pointer group"
        >
          <RotateCcw className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-rose-300">Reset 75</span>
        </button>
      </div>

      {/* 3. TWO COLUMNS: TODAY'S HABITS & WATER TRACKER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Habits */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-slate-100">Today's Habits Checklist</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {todayHabitsDoneCount}/{habits.length} Done ({todayHabitsPercent}%)
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {habits.slice(0, 5).map((habit) => {
                const isDone = currentDayRecord.habitsCompleted?.includes(habit.id);
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className={`truncate font-semibold ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {habit.title}
                    </span>
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('habits')}
            className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center justify-between w-full"
          >
            <span>Manage & Customize All {habits.length} Habits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Water Tracker Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-slate-100">Daily Water Protocol</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {currentWater.toLocaleString()} / {waterGoal.toLocaleString()} ml
              </span>
            </div>

            {/* Visual Hydration Meter */}
            <div className="relative w-full h-8 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden my-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${waterPercent}%` }}
              >
                <span className="text-[11px] font-extrabold font-mono text-slate-950">
                  {waterPercent}%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              75 Hard standard requires 3.7 Liters (1 Gallon) daily. One-tap to log servings:
            </p>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[250, 500, 750, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickWaterAdd(amt)}
                  className="py-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-slate-900 text-xs font-mono text-cyan-300 font-semibold transition-all"
                >
                  +{amt >= 1000 ? `${amt / 1000}L` : `${amt}ml`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Water Streak: <strong className="text-cyan-400 font-mono">14 Days</strong></span>
            <span>Status: <strong className={waterPercent >= 100 ? 'text-emerald-400' : 'text-slate-300'}>{waterPercent >= 100 ? 'Goal Crushed!' : 'In Progress'}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. WEEKLY TRENDS & CONSISTENCY (RECHARTS) */}
      <WeeklyTrendsSection
        challenge={challenge}
        measurements={measurements}
        profile={profile}
        theme={theme}
        onNavigateToBody={() => onNavigate('body')}
        onNavigateToWorkouts={() => onNavigate('workouts')}
      />

      {/* 5. CALORIE ENGINE & WEIGHT PROGRESS SNIPPET */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calorie Engine Summary (NO food log, pure calculation) */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-pink-500" />
              <h3 className="font-extrabold text-sm text-slate-100">Calculated Calorie Engine</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('nutrition')}
              className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1"
            >
              Adjust Engine <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Target Intake</span>
              <strong className="text-lg font-extrabold font-mono text-white glow-text-pink">
                {calculation.calorieTarget}
              </strong>
              <span className="text-[10px] text-slate-500 block">kcal/day</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">TDEE Burn</span>
              <strong className="text-lg font-extrabold font-mono text-cyan-300">
                {calculation.tdee}
              </strong>
              <span className="text-[10px] text-slate-500 block">kcal/day</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Deficit</span>
              <strong className="text-lg font-extrabold font-mono text-purple-300">
                -{calculation.deficitKcal}
              </strong>
              <span className="text-[10px] text-slate-500 block">kcal/day</span>
            </div>
          </div>

          {/* Macro distribution strip */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-[9px] text-cyan-400 block font-sans">PROTEIN</span>
              <strong className="text-white">{calculation.macros.proteinGrams}g</strong>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-[9px] text-purple-400 block font-sans">CARBS</span>
              <strong className="text-white">{calculation.macros.carbsGrams}g</strong>
            </div>
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <span className="text-[9px] text-pink-400 block font-sans">FATS</span>
              <strong className="text-white">{calculation.macros.fatsGrams}g</strong>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[9px] text-emerald-400 block font-sans">FIBER</span>
              <strong className="text-white">{calculation.macros.fiberGrams}g</strong>
            </div>
          </div>
        </div>

        {/* Weight & Body Progress snippet */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              <h3 className="font-extrabold text-sm text-slate-100">Weight & Body Progress</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('body')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Start</span>
              <strong className="text-lg font-extrabold font-mono text-slate-300">
                {baselineWeight} kg
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400 font-bold block uppercase">Current</span>
              <strong className="text-lg font-extrabold font-mono text-cyan-300">
                {currentWeight} kg
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <span className="text-[10px] text-purple-400 font-bold block uppercase">Goal</span>
              <strong className="text-lg font-extrabold font-mono text-purple-300">
                {profile.goalWeightKg} kg
              </strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Net Lost:</span>
            <span className="font-mono font-extrabold text-cyan-400">
              {weightLost > 0 ? `-${weightLost} kg (-${(weightLost * 2.2).toFixed(1)} lbs)` : 'On target'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. TODAY'S WORKOUTS PREVIEW */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-cyan-400" />
            <h3 className="font-extrabold text-sm text-slate-100">Scheduled Workouts for Today</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('workouts')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
          >
            All Workouts ({workouts.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workouts.slice(0, 2).map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-sm text-white">{w.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{w.durationMinutes} min</span>
                  <span>·</span>
                  <span className="text-cyan-400">{w.categories.slice(0, 2).join(', ')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('workouts')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1 shadow-md shadow-cyan-900/30 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
