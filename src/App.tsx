import React, { useState, useEffect } from 'react';
import {
  ThemeConfig,
  UserProfile,
  ChallengeState,
  Habit,
  Workout,
  BodyMeasurement,
  WorkoutLogEntry,
  DayRecord
} from './types';
import { Storage } from './utils/storage';
import { AppHeader } from './components/Navbar/AppHeader';
import { BottomNav, NavTab } from './components/Navbar/BottomNav';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ChallengeView } from './components/Challenge/ChallengeView';
import { WorkoutsView } from './components/Workouts/WorkoutsView';
import { HabitsView } from './components/Habits/HabitsView';
import { BodyTrackingView } from './components/BodyTracking/BodyTrackingView';
import { CalorieEngineView } from './components/NutritionEngine/CalorieEngineView';
import { TimerSuiteModal } from './components/Timers/TimerSuiteModal';
import { ResetChallengeModal } from './components/Challenge/ResetChallengeModal';
import { FileImportModal } from './components/FileAttach/FileImportModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { NativeAndroidModal } from './components/Android/NativeAndroidModal';
import { StatusBar, Style } from '@capacitor/status-bar';
import { playSound } from './utils/soundEffects';
import { fireAchievementParticles } from './utils/confetti';

export default function App() {
  const [theme, setTheme] = useState<ThemeConfig>(Storage.getTheme());
  const [profile, setProfile] = useState<UserProfile>(Storage.getProfile());
  const [challenge, setChallenge] = useState<ChallengeState>(Storage.getChallenge());
  const [habits, setHabits] = useState<Habit[]>(Storage.getHabits());
  const [workouts, setWorkouts] = useState<Workout[]>(Storage.getWorkouts());
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(Storage.getMeasurements());
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>(Storage.getWorkoutLogs());

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerInitialRest, setTimerInitialRest] = useState(60);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNativeAndroidOpen, setIsNativeAndroidOpen] = useState(false);

  // Sync native Android status bar styling
  useEffect(() => {
    try {
      StatusBar.setStyle({ style: theme.appearance === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: theme.appearance === 'dark' ? '#020617' : '#ffffff' }).catch(() => {});
    } catch {}
  }, [theme.appearance]);

  // Sync theme
  const handleUpdateTheme = (newTheme: ThemeConfig) => {
    setTheme(newTheme);
    Storage.setTheme(newTheme);
  };

  // Sync profile
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);
    Storage.setProfile(newProfile);
  };

  // Sync challenge
  const handleUpdateDay = (dayNum: number, updatedDay: Partial<DayRecord>) => {
    const existing = challenge.days[dayNum] || {
      dayNumber: dayNum,
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

    const newDays = {
      ...challenge.days,
      [dayNum]: {
        ...existing,
        ...updatedDay
      }
    };

    // Calculate streak
    let currentStreak = 0;
    for (let i = 1; i <= 75; i++) {
      if (newDays[i]?.status === 'completed') {
        currentStreak++;
      } else if (i < challenge.currentDayNumber) {
        currentStreak = 0;
      }
    }

    const newChallenge: ChallengeState = {
      ...challenge,
      days: newDays,
      streak: {
        current: currentStreak,
        longest: Math.max(challenge.streak.longest, currentStreak)
      }
    };

    setChallenge(newChallenge);
    Storage.setChallenge(newChallenge);
  };

  // Toggle habit for current day
  const handleToggleHabit = (habitId: string) => {
    const currentDayRecord = challenge.days[challenge.currentDayNumber];
    const completedList = currentDayRecord?.habitsCompleted || [];
    const isAlreadyDone = completedList.includes(habitId);

    const updatedList = isAlreadyDone
      ? completedList.filter((id) => id !== habitId)
      : [...completedList, habitId];

    handleUpdateDay(challenge.currentDayNumber, {
      habitsCompleted: updatedList,
      status: updatedList.length === habits.length ? 'completed' : 'in_progress'
    });

    if (!isAlreadyDone) {
      playSound('complete');
      if (updatedList.length === habits.length) {
        fireAchievementParticles();
        playSound('achievement');
      }
    } else {
      playSound('tap');
    }
  };

  // Add water to current day
  const handleAddWater = (amountMl: number) => {
    const currentDayRecord = challenge.days[challenge.currentDayNumber];
    const currentWater = currentDayRecord?.waterMl || 0;
    const newWater = currentWater + amountMl;

    const updates: Partial<DayRecord> = { waterMl: newWater };

    // Auto-check water habit if goal reached
    if (newWater >= profile.waterGoalMl) {
      const waterHabit = habits.find((h) => h.id === 'habit-water' || h.title.toLowerCase().includes('water'));
      if (waterHabit && !currentDayRecord?.habitsCompleted?.includes(waterHabit.id)) {
        updates.habitsCompleted = [...(currentDayRecord?.habitsCompleted || []), waterHabit.id];
      }
    }

    handleUpdateDay(challenge.currentDayNumber, updates);
  };

  // Log completed workout
  const handleLogWorkout = (log: WorkoutLogEntry) => {
    const updated = [log, ...workoutLogs];
    setWorkoutLogs(updated);
    Storage.setWorkoutLogs(updated);

    // Also mark workout habit done for today if applicable
    const currentDayRecord = challenge.days[challenge.currentDayNumber];
    const workoutHabit = habits.find((h) => h.id === 'habit-workout-1' || h.title.toLowerCase().includes('workout'));
    if (workoutHabit && !currentDayRecord?.habitsCompleted?.includes(workoutHabit.id)) {
      handleUpdateDay(challenge.currentDayNumber, {
        habitsCompleted: [...(currentDayRecord?.habitsCompleted || []), workoutHabit.id],
        workoutsCompleted: [...(currentDayRecord?.workoutsCompleted || []), log.workoutId]
      });
    }
  };

  // Reset 75-Day Challenge handler
  const handleConfirmReset = (newStartDate: string, archiveCurrent: boolean, reason: string) => {
    const newState = Storage.resetChallenge(newStartDate, archiveCurrent, reason);
    setChallenge(newState);
    fireAchievementParticles();
    playSound('achievement');
  };

  // File import updates
  const handleApplyFileUpdates = (updates: {
    profile?: Partial<UserProfile>;
    newWorkouts?: Workout[];
    newMeasurements?: BodyMeasurement[];
    newHabits?: Habit[];
  }) => {
    if (updates.profile) {
      handleUpdateProfile(updates.profile);
    }
    if (updates.newWorkouts) {
      const updatedWorkouts = [...workouts, ...updates.newWorkouts];
      setWorkouts(updatedWorkouts);
      Storage.setWorkouts(updatedWorkouts);
    }
    if (updates.newMeasurements) {
      const updatedM = [...measurements, ...updates.newMeasurements];
      setMeasurements(updatedM);
      Storage.setMeasurements(updatedM);
    }
    if (updates.newHabits) {
      const updatedH = [...habits, ...updates.newHabits];
      setHabits(updatedH);
      Storage.setHabits(updatedH);
    }
  };

  const isDark = theme.appearance === 'dark';

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } theme-${theme.style}`}
    >
      {/* Top Header */}
      <AppHeader
        currentDay={challenge.currentDayNumber}
        streak={challenge.streak.current}
        theme={theme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFileImport={() => setIsFileImportOpen(true)}
        onOpenResetChallenge={() => setIsResetOpen(true)}
        onOpenNativeAndroid={() => setIsNativeAndroidOpen(true)}
        onOpenTimerSuite={() => {
          setTimerInitialRest(60);
          setIsTimerOpen(true);
        }}
      />

      {/* Main View Container */}
      <main className="min-h-[calc(100vh-140px)]">
        {activeTab === 'dashboard' && (
          <DashboardView
            challenge={challenge}
            habits={habits}
            workouts={workouts}
            measurements={measurements}
            profile={profile}
            theme={theme}
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToggleHabit={handleToggleHabit}
            onAddWater={handleAddWater}
            onOpenTimerSuite={() => {
              setTimerInitialRest(60);
              setIsTimerOpen(true);
            }}
            onOpenFileImport={() => setIsFileImportOpen(true)}
            onOpenResetChallenge={() => setIsResetOpen(true)}
          />
        )}

        {activeTab === 'challenge' && (
          <ChallengeView
            challenge={challenge}
            habits={habits}
            onUpdateDay={handleUpdateDay}
            onOpenResetModal={() => setIsResetOpen(true)}
            theme={theme}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            workouts={workouts}
            workoutLogs={workoutLogs}
            onSaveWorkouts={(w) => {
              setWorkouts(w);
              Storage.setWorkouts(w);
            }}
            onLogCompletedWorkout={handleLogWorkout}
            onOpenRestTimer={(seconds) => {
              setTimerInitialRest(seconds);
              setIsTimerOpen(true);
            }}
            theme={theme}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsView
            habits={habits}
            todayCompletedIds={challenge.days[challenge.currentDayNumber]?.habitsCompleted || []}
            onToggleHabit={handleToggleHabit}
            onSaveHabits={(h) => {
              setHabits(h);
              Storage.setHabits(h);
            }}
            theme={theme}
          />
        )}

        {activeTab === 'body' && (
          <BodyTrackingView
            measurements={measurements}
            profile={profile}
            onSaveMeasurements={(m) => {
              setMeasurements(m);
              Storage.setMeasurements(m);
            }}
            onUpdateProfile={handleUpdateProfile}
            theme={theme}
          />
        )}

        {activeTab === 'nutrition' && (
          <CalorieEngineView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            theme={theme}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
      />

      {/* Timer Suite Modal */}
      <TimerSuiteModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        theme={theme}
        initialMode="rest"
        initialRestSeconds={timerInitialRest}
      />

      {/* Reset 75-Day Challenge Modal */}
      <ResetChallengeModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirmReset={handleConfirmReset}
        currentDay={challenge.currentDayNumber}
        theme={theme}
      />

      {/* File Attachment & Smart Data Detection Modal */}
      <FileImportModal
        isOpen={isFileImportOpen}
        onClose={() => setIsFileImportOpen(false)}
        theme={theme}
        onApplyUpdates={handleApplyFileUpdates}
      />

      {/* Settings & Themes Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        profile={profile}
        onUpdateTheme={handleUpdateTheme}
        onUpdateProfile={handleUpdateProfile}
        onOpenResetChallenge={() => setIsResetOpen(true)}
        onOpenNativeAndroid={() => setIsNativeAndroidOpen(true)}
      />

      {/* Native Android APK Installation & Build Hub Modal */}
      <NativeAndroidModal
        isOpen={isNativeAndroidOpen}
        onClose={() => setIsNativeAndroidOpen(false)}
        theme={theme}
      />
    </div>
  );
}
