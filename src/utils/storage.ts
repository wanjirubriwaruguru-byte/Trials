import {
  ThemeConfig,
  UserProfile,
  ChallengeState,
  Habit,
  Workout,
  BodyMeasurement,
  WorkoutLogEntry,
  DayRecord,
  WorkoutCategory
} from '../types';

const STORAGE_KEYS = {
  THEME: 'pulse75_theme',
  PROFILE: 'pulse75_profile',
  CHALLENGE: 'pulse75_challenge',
  HABITS: 'pulse75_habits',
  WORKOUTS: 'pulse75_workouts',
  WORKOUT_LOGS: 'pulse75_workout_logs',
  MEASUREMENTS: 'pulse75_measurements',
  WATER_LOG: 'pulse75_water_today',
  STEPS_TODAY: 'pulse75_steps_today'
};

export const DEFAULT_THEME: ThemeConfig = {
  appearance: 'dark',
  style: 'tech'
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Hunter',
  age: 27,
  sex: 'female',
  heightCm: 168,
  currentWeightKg: 73.5,
  goalWeightKg: 64.0,
  activityLevel: 'moderate',
  deficitGoal: 'moderate',
  waterGoalMl: 3700, // ~1 Gallon
  stepsGoal: 10000,
  workoutsGoalPerWeek: 7,
  unitSystem: 'metric'
};

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-workout-1',
    title: '45-Min Workout (Indoor or Gym)',
    description: 'Strength, cardio, or circuit training session',
    category: 'fitness',
    frequency: 'daily',
    targetValue: 45,
    unit: 'min',
    icon: 'Dumbbell',
    color: '#00f0ff',
    reminderTime: '07:00',
    order: 1,
    isDefault: true
  },
  {
    id: 'habit-workout-2',
    title: '45-Min Outdoor Active Session',
    description: 'Outdoor brisk walk, run, or bodyweight circuit',
    category: 'fitness',
    frequency: 'daily',
    targetValue: 45,
    unit: 'min',
    icon: 'Footprints',
    color: '#00ffb2',
    reminderTime: '17:30',
    order: 2,
    isDefault: true
  },
  {
    id: 'habit-water',
    title: 'Drink 3.7L (1 Gallon) of Water',
    description: 'Stay consistently hydrated throughout the day',
    category: 'nutrition',
    frequency: 'daily',
    targetValue: 3700,
    unit: 'ml',
    icon: 'Droplets',
    color: '#00c3ff',
    reminderTime: '09:00',
    order: 3,
    isDefault: true
  },
  {
    id: 'habit-nutrition',
    title: 'Clean Nutrition & Calorie Target',
    description: 'Zero cheat foods, hit protein target, within calorie deficit',
    category: 'nutrition',
    frequency: 'daily',
    targetValue: 1,
    unit: 'day',
    icon: 'Apple',
    color: '#ff007a',
    reminderTime: '20:00',
    order: 4,
    isDefault: true
  },
  {
    id: 'habit-reading',
    title: 'Read 10 Pages of Non-Fiction',
    description: 'Personal development, mindset, or skill building',
    category: 'mindset',
    frequency: 'daily',
    targetValue: 10,
    unit: 'pages',
    icon: 'BookOpen',
    color: '#9d00ff',
    reminderTime: '21:30',
    order: 5,
    isDefault: true
  },
  {
    id: 'habit-photo',
    title: 'Take Daily Progress Photo',
    description: 'Document your physical transformation',
    category: 'wellness',
    frequency: 'daily',
    targetValue: 1,
    unit: 'photo',
    icon: 'Camera',
    color: '#ff7700',
    reminderTime: '08:00',
    order: 6,
    isDefault: true
  },
  {
    id: 'habit-journal',
    title: 'Daily Journal & Reflection',
    description: 'Write daily wins, energy rating, and learnings',
    category: 'mindset',
    frequency: 'daily',
    targetValue: 1,
    unit: 'entry',
    icon: 'PenLine',
    color: '#e040fb',
    reminderTime: '22:00',
    order: 7,
    isDefault: true
  },
  {
    id: 'habit-sleep',
    title: '7+ Hours Quality Sleep',
    description: 'Deep physical and neurological muscle recovery',
    category: 'wellness',
    frequency: 'daily',
    targetValue: 7,
    unit: 'hrs',
    icon: 'Moon',
    color: '#7c4dff',
    reminderTime: '22:30',
    order: 8,
    isDefault: true
  }
];

export const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: 'w-lower-power',
    title: 'Cyber Legs & Glutes Hypertrophy',
    type: 'custom',
    categories: ['Legs', 'Glutes', 'Strength'],
    durationMinutes: 50,
    difficulty: 'intermediate',
    scheduledDays: ['monday', 'thursday'],
    notes: 'Focus on full depth on squats and progressive overload.',
    exercises: [
      {
        id: 'e-1',
        name: 'Barbell Back Squat',
        category: 'Legs',
        targetSets: 4,
        targetReps: '8-10',
        targetWeightKg: 65,
        restSeconds: 90,
        notes: 'Keep chest upright, push knees out over toes'
      },
      {
        id: 'e-2',
        name: 'Romanian Deadlift (RDL)',
        category: 'Glutes',
        targetSets: 3,
        targetReps: '10-12',
        targetWeightKg: 55,
        restSeconds: 75,
        notes: 'Hinge at the hips, feel hamstring stretch'
      },
      {
        id: 'e-3',
        name: 'Bulgarian Split Squat',
        category: 'Glutes',
        targetSets: 3,
        targetReps: '10 / leg',
        targetWeightKg: 14,
        restSeconds: 60,
        notes: 'Slight torso forward lean for max glute bias'
      },
      {
        id: 'e-4',
        name: 'Standing Calf Raises',
        category: 'Legs',
        targetSets: 4,
        targetReps: '15',
        targetWeightKg: 20,
        restSeconds: 45
      }
    ]
  },
  {
    id: 'w-upper-sculpt',
    title: 'Neon Upper Body & Core Matrix',
    type: 'custom',
    categories: ['Arms', 'Back', 'Core', 'Strength'],
    durationMinutes: 45,
    difficulty: 'intermediate',
    scheduledDays: ['tuesday', 'friday'],
    notes: 'Control eccentric portion for 3 seconds each repetition.',
    exercises: [
      {
        id: 'e-5',
        name: 'Dumbbell Incline Bench Press',
        category: 'Arms',
        targetSets: 4,
        targetReps: '10',
        targetWeightKg: 18,
        restSeconds: 75
      },
      {
        id: 'e-6',
        name: 'Neutral Grip Lat Pulldown / Pull-ups',
        category: 'Back',
        targetSets: 4,
        targetReps: '10-12',
        targetWeightKg: 45,
        restSeconds: 60
      },
      {
        id: 'e-7',
        name: 'Overhead Dumbbell Shoulder Press',
        category: 'Arms',
        targetSets: 3,
        targetReps: '10',
        targetWeightKg: 12,
        restSeconds: 60
      },
      {
        id: 'e-8',
        name: 'Hanging Knee Raises & Plank Hold',
        category: 'Core',
        targetSets: 3,
        targetReps: '15',
        restSeconds: 45
      }
    ]
  },
  {
    id: 'w-hiit-pulse',
    title: 'Pulse Full Body HIIT Burner',
    type: 'youtube',
    categories: ['Full Body', 'Cardio', 'HIIT'],
    durationMinutes: 30,
    difficulty: 'advanced',
    scheduledDays: ['wednesday', 'saturday'],
    notes: 'High-intensity interval cardio; keep heart rate in Zone 4-5.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ml6cT4AZdqI',
    youtubeVideoId: 'ml6cT4AZdqI',
    trainerName: 'Growingannanas / Pulse Fitness',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    exercises: []
  },
  {
    id: 'w-pilates-flow',
    title: 'Deep Core & Glutes Pilates Sculpt',
    type: 'youtube',
    categories: ['Pilates', 'Core', 'Mobility'],
    durationMinutes: 35,
    difficulty: 'beginner',
    scheduledDays: ['sunday'],
    notes: 'Low impact, high muscle activation and pelvic stability.',
    youtubeUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
    youtubeVideoId: 'g_tea8ZNk5A',
    trainerName: 'Move With Nicole',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=600&q=80',
    exercises: []
  }
];

export const INITIAL_MEASUREMENTS: BodyMeasurement[] = [
  {
    id: 'm-1',
    date: '2026-09-20',
    weightKg: 75.2,
    waistCm: 84,
    hipsCm: 104,
    chestCm: 96,
    armsCm: 31,
    thighsCm: 61,
    bodyFatPercent: 27.5,
    notes: 'Day 1 baseline measurements before starting Pulse75.'
  },
  {
    id: 'm-2',
    date: '2026-09-27',
    weightKg: 74.3,
    waistCm: 82.5,
    hipsCm: 103,
    chestCm: 95.5,
    armsCm: 30.8,
    thighsCm: 60.5,
    bodyFatPercent: 26.8,
    notes: 'Week 1 check-in. Energy is soaring and water retention down.'
  },
  {
    id: 'm-3',
    date: '2026-10-04',
    weightKg: 73.5,
    waistCm: 81.2,
    hipsCm: 102,
    chestCm: 95,
    armsCm: 30.5,
    thighsCm: 59.8,
    bodyFatPercent: 26.0,
    notes: 'Week 2 milestone! Clear abdominal definition starting to show.'
  }
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initializes or resets the 75-Day Challenge days array
 */
export function generateChallengeDays(startDateStr: string, previousDays?: Record<number, DayRecord>): Record<number, DayRecord> {
  const days: Record<number, DayRecord> = {};
  const start = new Date(startDateStr);

  for (let i = 1; i <= 75; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + (i - 1));
    const dateStr = dayDate.toISOString().split('T')[0];

    // If day was completed previously and we want to preserve history
    const existing = previousDays ? previousDays[i] : null;

    if (existing && existing.date === dateStr) {
      days[i] = existing;
    } else {
      days[i] = {
        dayNumber: i,
        date: dateStr,
        status: i === 1 ? 'in_progress' : 'pending',
        notes: '',
        mood: 3,
        energy: 3,
        habitsCompleted: [],
        workoutsCompleted: [],
        waterMl: 0,
        steps: 0
      };
    }
  }

  return days;
}

export function createInitialChallengeState(): ChallengeState {
  // Set challenge start date to 14 days ago so the user has immediate rich active data
  const start = new Date();
  start.setDate(start.getDate() - 13);
  const startDateStr = start.toISOString().split('T')[0];

  const days = generateChallengeDays(startDateStr);

  // Populate first 13 days as completed with rich history
  for (let i = 1; i <= 13; i++) {
    days[i].status = 'completed';
    days[i].mood = 4 + (i % 2);
    days[i].energy = 4;
    days[i].waterMl = 3700;
    days[i].steps = 10200 + (i * 120);
    days[i].habitsCompleted = DEFAULT_HABITS.map(h => h.id);
    days[i].workoutsCompleted = ['w-lower-power'];
    days[i].notes = `Day ${i} crushed! Maintained 100% adherence and nailed my calorie target.`;
  }

  // Day 14 (today) is in progress
  days[14].status = 'in_progress';
  days[14].waterMl = 2250;
  days[14].steps = 6840;
  days[14].habitsCompleted = ['habit-water', 'habit-workout-1', 'habit-nutrition'];
  days[14].workoutsCompleted = ['w-lower-power'];

  return {
    startDate: startDateStr,
    currentDayNumber: 14,
    days,
    streak: {
      current: 13,
      longest: 13
    },
    runHistory: []
  };
}

/**
 * Storage helpers with reactive sync
 */
export const Storage = {
  getTheme(): ThemeConfig {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    return raw ? JSON.parse(raw) : DEFAULT_THEME;
  },
  setTheme(theme: ThemeConfig) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
  },

  getProfile(): UserProfile {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
  },
  setProfile(profile: UserProfile) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getChallenge(): ChallengeState {
    if (typeof window === 'undefined') return createInitialChallengeState();
    const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGE);
    if (!raw) {
      const initial = createInitialChallengeState();
      localStorage.setItem(STORAGE_KEYS.CHALLENGE, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return createInitialChallengeState();
    }
  },
  setChallenge(state: ChallengeState) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CHALLENGE, JSON.stringify(state));
  },

  getHabits(): Habit[] {
    if (typeof window === 'undefined') return DEFAULT_HABITS;
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
      return DEFAULT_HABITS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_HABITS;
    }
  },
  setHabits(habits: Habit[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  getWorkouts(): Workout[] {
    if (typeof window === 'undefined') return DEFAULT_WORKOUTS;
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(DEFAULT_WORKOUTS));
      return DEFAULT_WORKOUTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_WORKOUTS;
    }
  },
  setWorkouts(workouts: Workout[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  },

  getMeasurements(): BodyMeasurement[] {
    if (typeof window === 'undefined') return INITIAL_MEASUREMENTS;
    const raw = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(INITIAL_MEASUREMENTS));
      return INITIAL_MEASUREMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MEASUREMENTS;
    }
  },
  setMeasurements(measurements: BodyMeasurement[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(measurements));
  },

  getWorkoutLogs(): WorkoutLogEntry[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
    return raw ? JSON.parse(raw) : [];
  },
  setWorkoutLogs(logs: WorkoutLogEntry[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(logs));
  },

  /**
   * Reset 75-Day Challenge
   * Allows starting fresh from Day 1 on a chosen start date, archiving previous run stats.
   */
  resetChallenge(startDateStr: string, archiveCurrentRun = true, notes?: string): ChallengeState {
    const current = this.getChallenge();
    const completedCount = Object.values(current.days).filter(d => d.status === 'completed').length;

    const runHistory = [...(current.runHistory || [])];
    if (archiveCurrentRun) {
      runHistory.push({
        id: `run-${Date.now()}`,
        startDate: current.startDate,
        resetDate: getTodayDateString(),
        daysCompleted: completedCount,
        notes: notes || `Reset on Day ${current.currentDayNumber}`
      });
    }

    const newDays = generateChallengeDays(startDateStr);
    newDays[1].status = 'in_progress';

    const newState: ChallengeState = {
      startDate: startDateStr,
      currentDayNumber: 1,
      days: newDays,
      streak: {
        current: 0,
        longest: Math.max(current.streak.longest, current.streak.current)
      },
      runHistory
    };

    this.setChallenge(newState);
    return newState;
  },

  /**
   * Export all applet data as portable JSON
   */
  exportAllData(): string {
    const data = {
      version: 'pulse75-v1.0',
      exportedAt: new Date().toISOString(),
      theme: this.getTheme(),
      profile: this.getProfile(),
      challenge: this.getChallenge(),
      habits: this.getHabits(),
      workouts: this.getWorkouts(),
      measurements: this.getMeasurements(),
      workoutLogs: this.getWorkoutLogs()
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import all applet data from JSON
   */
  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.theme) this.setTheme(data.theme);
      if (data.profile) this.setProfile(data.profile);
      if (data.challenge) this.setChallenge(data.challenge);
      if (data.habits) this.setHabits(data.habits);
      if (data.workouts) this.setWorkouts(data.workouts);
      if (data.measurements) this.setMeasurements(data.measurements);
      if (data.workoutLogs) this.setWorkoutLogs(data.workoutLogs);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
