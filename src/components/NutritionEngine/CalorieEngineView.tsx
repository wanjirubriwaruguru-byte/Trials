import React, { useState } from 'react';
import {
  Flame,
  Scale,
  Sparkles,
  TrendingDown,
  Calendar,
  Search,
  BookOpen,
  PieChart,
  Zap,
  Info,
  Check
} from 'lucide-react';
import { UserProfile, ThemeConfig } from '../../types';
import { calculateCalorieTargets, FOOD_DATABASE_REFERENCE } from '../../utils/calorieEngine';
import { playSound } from '../../utils/soundEffects';

interface CalorieEngineViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  theme: ThemeConfig;
}

export const CalorieEngineView: React.FC<CalorieEngineViewProps> = ({
  profile,
  onUpdateProfile,
  theme
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'calculator' | 'database'>('calculator');

  const isDark = theme.appearance === 'dark';
  const calculation = calculateCalorieTargets(profile);

  const categories = ['All', 'Grains & Roots', 'Legumes', 'Vegetables', 'Proteins & Meat', 'Dairy', 'Street Food & Snacks', 'Beverages'];

  const filteredFoods = FOOD_DATABASE_REFERENCE.filter((food) => {
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          food.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/30">
              <Flame className="w-5 h-5 text-pink-500" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Precision Calorie Engine</h2>
              <p className="text-xs text-slate-400">Metabolic TDEE, deficit targets & macro composition</p>
            </div>
          </div>
        </div>

        {/* Segmented Tab */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'calculator'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calorie Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'database'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Macro Food Reference ({FOOD_DATABASE_REFERENCE.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CALORIE & MACRO CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {/* Main Hero Results HUD */}
          <div className={`p-6 rounded-2xl border relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-pink-500/30 glow-pink'
              : 'bg-white border-pink-200 shadow-md'
          }`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Target Calories */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 block mb-1">
                  Daily Calorie Target
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-white glow-text-pink">
                    {calculation.calorieTarget.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kcal</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {calculation.deficitKcal > 0 ? `-${calculation.deficitKcal} kcal deficit` : 'Maintenance standard'}
                </span>
              </div>

              {/* TDEE */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                  Total Energy (TDEE)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-cyan-300">
                    {calculation.tdee.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kcal</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  BMR: {calculation.bmr} kcal
                </span>
              </div>

              {/* Weekly Loss Pace */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  Projected Pace
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-purple-300">
                    {calculation.weeklyLossKg}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kg/wk</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  ~{(calculation.weeklyLossKg * 2.2).toFixed(1)} lbs / week
                </span>
              </div>

              {/* Estimated Goal Date */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Goal Arrival
                </span>
                <div className="text-xl font-bold font-mono text-emerald-300 truncate mt-1">
                  {calculation.projectedGoalDate}
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {calculation.weeksToGoal ? `in ${calculation.weeksToGoal} weeks` : 'At target!'}
                </span>
              </div>
            </div>

            {/* Macro Composition Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">Macronutrient Target Distribution</span>
                <span className="font-mono text-slate-400">{calculation.calorieTarget} kcal total</span>
              </div>

              {/* Progress bar split */}
              <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
                <div
                  style={{ width: `${(calculation.macros.proteinKcal / calculation.calorieTarget) * 100}%` }}
                  className="bg-cyan-400 h-full transition-all"
                  title="Protein"
                />
                <div
                  style={{ width: `${(calculation.macros.carbsKcal / calculation.calorieTarget) * 100}%` }}
                  className="bg-purple-400 h-full transition-all"
                  title="Carbohydrates"
                />
                <div
                  style={{ width: `${(calculation.macros.fatsKcal / calculation.calorieTarget) * 100}%` }}
                  className="bg-pink-400 h-full transition-all"
                  title="Healthy Fats"
                />
              </div>

              {/* Macro Pills Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold mb-1">
                    <span>Protein (35%)</span>
                    <span className="font-mono">{calculation.macros.proteinKcal} kcal</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    {calculation.macros.proteinGrams}g
                  </div>
                  <span className="text-[10px] text-slate-400">Muscle synthesis & satiety</span>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1">
                    <span>Carbs (40%)</span>
                    <span className="font-mono">{calculation.macros.carbsKcal} kcal</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    {calculation.macros.carbsGrams}g
                  </div>
                  <span className="text-[10px] text-slate-400">Glycogen & workout stamina</span>
                </div>

                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30">
                  <div className="flex items-center justify-between text-xs text-pink-300 font-semibold mb-1">
                    <span>Fats (25%)</span>
                    <span className="font-mono">{calculation.macros.fatsKcal} kcal</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    {calculation.macros.fatsGrams}g
                  </div>
                  <span className="text-[10px] text-slate-400">Hormonal & cellular balance</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
                    <span>Fiber Target</span>
                    <span className="font-mono">Digestive</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    {calculation.macros.fiberGrams}g+
                  </div>
                  <span className="text-[10px] text-slate-400">Gut health & fullness</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Profile Calibrator */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Adjust Profile Parameters to Recalibrate
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.currentWeightKg}
                  onChange={(e) => onUpdateProfile({ currentWeightKg: parseFloat(e.target.value) || 70 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Goal Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.goalWeightKg}
                  onChange={(e) => onUpdateProfile({ goalWeightKg: parseFloat(e.target.value) || 65 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={profile.heightCm}
                  onChange={(e) => onUpdateProfile({ heightCm: parseInt(e.target.value, 10) || 170 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => onUpdateProfile({ age: parseInt(e.target.value, 10) || 28 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Activity Level</label>
                <select
                  value={profile.activityLevel}
                  onChange={(e) => onUpdateProfile({ activityLevel: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="sedentary">Sedentary (desk work, low activity)</option>
                  <option value="light">Lightly Active (1-3 workouts/week)</option>
                  <option value="moderate">Moderately Active (3-5 intense workouts/wk)</option>
                  <option value="active">Very Active (6-7 workouts/wk or 2/day)</option>
                  <option value="athlete">Athlete / Extreme Training</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Deficit Target</label>
                <select
                  value={profile.deficitGoal}
                  onChange={(e) => onUpdateProfile({ deficitGoal: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="aggressive">Aggressive Fat Loss (-25% TDEE)</option>
                  <option value="moderate">Moderate Standard (-20% TDEE)</option>
                  <option value="mild">Mild Deficit (-15% TDEE)</option>
                  <option value="maintenance">Maintenance (Recomposition)</option>
                  <option value="lean_bulk">Lean Muscle Surplus (+10% TDEE)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NUTRITIONAL MACRO REFERENCE GUIDE */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-300 block mb-0.5">Macro Density & Nutrition Guide</span>
              Consult macronutrient and calorie profiles for authentic staple foods to hit your personalized target of{' '}
              <strong className="text-white font-mono">{calculation.calorieTarget} kcal</strong> and{' '}
              <strong className="text-white font-mono">{calculation.macros.proteinGrams}g protein</strong> daily.
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search food (e.g. Ugali, Tilapia, Sukuma Wiki, Beans, Omena)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-semibold ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Food Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredFoods.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-800/80 hover:border-cyan-500/40'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{item.serving}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold font-mono text-pink-400">
                      {item.calories}
                    </span>
                    <span className="text-[10px] text-slate-500 block">kcal</span>
                  </div>
                </div>

                {/* Macro Strip */}
                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-center text-[11px] mb-2 font-mono">
                  <div>
                    <span className="text-[9px] text-cyan-400 block font-sans">PROTEIN</span>
                    <strong className="text-slate-200">{item.protein}g</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-purple-400 block font-sans">CARBS</span>
                    <strong className="text-slate-200">{item.carbs}g</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-pink-400 block font-sans">FATS</span>
                    <strong className="text-slate-200">{item.fat}g</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-400 block font-sans">FIBER</span>
                    <strong className="text-slate-200">{item.fiber}g</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  {item.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
