export type ThemeAppearance = 'dark' | 'light';
export type ThemeStyle = 'tech' | 'feminine' | 'masculine';

export interface ThemeConfig {
  appearance: ThemeAppearance;
  style: ThemeStyle;
}

export type DayStatus = 'completed' | 'missed' | 'pending' | 'in_progress';

export interface DayRecord {
  dayNumber: number; // 1 - 75
  date: string; // YYYY-MM-DD
  status: DayStatus;
  notes: string;
  mood: number; // 1 to 5
  energy: number; // 1 to 5
  photoUrl?: string;
  habitsCompleted: string[]; // Habit IDs
  workoutsCompleted: string[]; // Workout IDs
  waterMl: number;
  steps: number;
  weight?: number;
}

export interface ChallengeState {
  startDate: string; // YYYY-MM-DD
  currentDayNumber: number; // 1 - 75
  days: Record<number, DayRecord>;
  streak: {
    current: number;
    longest: number;
  };
  runHistory: Array<{
    id: string;
    startDate: string;
    resetDate: string;
    daysCompleted: number;
    notes?: string;
  }>;
}

export type HabitCategory = 'fitness' | 'nutrition' | 'mindset' | 'wellness' | 'custom';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  customDays?: number[]; // 0=Sunday, 1=Monday, etc.
  targetValue?: number;
  unit?: string;
  icon: string;
  color: string;
  reminderTime?: string;
  order: number;
  isDefault?: boolean;
}

export type WorkoutCategory =
  | 'Legs'
  | 'Glutes'
  | 'Abs'
  | 'Core'
  | 'Arms'
  | 'Back'
  | 'Full Body'
  | 'Cardio'
  | 'HIIT'
  | 'Stretching'
  | 'Mobility'
  | 'Strength'
  | 'Pilates'
  | 'Dance'
  | 'Walking'
  | 'Running';

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  targetSets: number;
  targetReps: string;
  targetWeightKg?: number;
  restSeconds: number;
  notes?: string;
  loggedSets?: ExerciseSet[];
}

export interface Workout {
  id: string;
  title: string;
  type: 'custom' | 'youtube';
  categories: WorkoutCategory[];
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scheduledDays?: string[]; // e.g. ['monday', 'thursday']
  notes: string;
  // YouTube specific
  youtubeUrl?: string;
  youtubeVideoId?: string;
  trainerName?: string;
  thumbnailUrl?: string;
  // Custom workout specific
  exercises: Exercise[];
}

export interface WorkoutLogEntry {
  id: string;
  workoutId: string;
  workoutTitle: string;
  date: string;
  durationMinutes: number;
  volumeKg: number;
  notes: string;
  categories: WorkoutCategory[];
}

export interface BodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  armsCm?: number;
  thighsCm?: number;
  bodyFatPercent?: number;
  photoUrl?: string;
  notes?: string;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type DeficitLevel = 'aggressive' | 'moderate' | 'mild' | 'maintenance' | 'lean_bulk';

export interface UserProfile {
  name: string;
  age: number;
  sex: 'female' | 'male' | 'other';
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  deficitGoal: DeficitLevel;
  waterGoalMl: number;
  stepsGoal: number;
  workoutsGoalPerWeek: number;
  unitSystem: 'metric' | 'imperial';
}

export interface CalorieCalculation {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  calorieTarget: number;
  deficitKcal: number;
  macros: {
    proteinGrams: number;
    proteinKcal: number;
    carbsGrams: number;
    carbsKcal: number;
    fatsGrams: number;
    fatsKcal: number;
    fiberGrams: number;
  };
  weeklyLossKg: number;
  weeksToGoal: number;
  projectedGoalDate: string;
}

export interface FoodMacroReference {
  name: string;
  category: 'Grains & Roots' | 'Legumes' | 'Vegetables' | 'Proteins & Meat' | 'Dairy' | 'Street Food & Snacks' | 'Beverages';
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  notes: string;
}

export interface DetectedFileData {
  summary: string;
  confidenceScore: number;
  detectedProfile?: {
    weight?: number;
    currentWeightKg?: number;
    goalWeight?: number;
    goalWeightKg?: number;
    heightCm?: number;
    age?: number;
    sex?: 'female' | 'male' | 'other';
    activityLevel?: ActivityLevel;
  };
  detectedMeasurements?: Array<{
    date: string;
    weight?: number;
    waist?: number;
    hips?: number;
    chest?: number;
    arms?: number;
    thighs?: number;
    bodyFat?: number;
    notes?: string;
  }>;
  detectedWorkouts?: Array<{
    title: string;
    categories: WorkoutCategory[];
    durationMinutes: number;
    exercises: Array<{
      name: string;
      category: string;
      targetSets: number;
      targetReps: string;
      targetWeight?: number;
      restSeconds: number;
      notes?: string;
    }>;
    notes?: string;
  }>;
  detectedHabits?: Array<{
    title: string;
    description: string;
    category: HabitCategory;
    frequency: HabitFrequency;
    targetValue?: number;
    unit?: string;
  }>;
  detectedNotes?: string;
}
