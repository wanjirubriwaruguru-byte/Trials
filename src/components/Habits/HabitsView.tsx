import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  Calendar,
  Check,
  Dumbbell,
  Droplets,
  Apple,
  BookOpen,
  Moon,
  PenLine,
  Camera,
  Footprints,
  Flame
} from 'lucide-react';
import { Habit, ThemeConfig, HabitCategory, HabitFrequency } from '../../types';
import { playSound, triggerVibration } from '../../utils/soundEffects';
import { fireAchievementParticles } from '../../utils/confetti';

interface HabitsViewProps {
  habits: Habit[];
  todayCompletedIds: string[];
  onToggleHabit: (habitId: string) => void;
  onSaveHabits: (habits: Habit[]) => void;
  theme: ThemeConfig;
}

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  fitness: '#00f0ff',
  nutrition: '#ff007a',
  mindset: '#9d00ff',
  wellness: '#00ffb2',
  custom: '#ffaa00'
};

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  todayCompletedIds,
  onToggleHabit,
  onSaveHabits,
  theme
}) => {
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('fitness');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('times');
  const [reminderTime, setReminderTime] = useState('08:00');

  const isDark = theme.appearance === 'dark';

  const openAddModal = () => {
    setEditingHabit(null);
    setTitle('');
    setDescription('');
    setCategory('fitness');
    setFrequency('daily');
    setTargetValue(1);
    setUnit('times');
    setReminderTime('08:00');
    setIsModalOpen(true);
  };

  const openEditModal = (h: Habit) => {
    setEditingHabit(h);
    setTitle(h.title);
    setDescription(h.description);
    setCategory(h.category);
    setFrequency(h.frequency);
    setTargetValue(h.targetValue || 1);
    setUnit(h.unit || 'times');
    setReminderTime(h.reminderTime || '08:00');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingHabit) {
      const updated = habits.map((h) =>
        h.id === editingHabit.id
          ? {
              ...h,
              title,
              description,
              category,
              frequency,
              targetValue,
              unit,
              color: CATEGORY_COLORS[category],
              reminderTime
            }
          : h
      );
      onSaveHabits(updated);
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        title,
        description,
        category,
        frequency,
        targetValue,
        unit,
        icon: category === 'fitness' ? 'Dumbbell' : category === 'nutrition' ? 'Apple' : 'CheckSquare',
        color: CATEGORY_COLORS[category],
        reminderTime,
        order: habits.length + 1
      };
      onSaveHabits([...habits, newHabit]);
    }

    playSound('tap');
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onSaveHabits(habits.filter((h) => h.id !== id));
    playSound('tap');
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...habits];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    onSaveHabits(copy);
  };

  const moveDown = (index: number) => {
    if (index === habits.length - 1) return;
    const copy = [...habits];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    onSaveHabits(copy);
  };

  const completedCount = habits.filter((h) => todayCompletedIds.includes(h.id)).length;
  const completionPercent = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <CheckSquare className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Core Transformation Habits</h2>
              <p className="text-xs text-slate-400">Customizable standards for 75-Day consistency</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-900/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Progress Metric Card */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <span className="text-xs text-slate-400 font-medium block">Today's Habit Adherence</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-cyan-400">{completedCount}/{habits.length}</span>
            <span className="text-xs font-bold text-slate-300">({completionPercent}%)</span>
          </div>
        </div>
        <div className="w-36 h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.map((habit, idx) => {
          const isDone = todayCompletedIds.includes(habit.id);

          return (
            <div
              key={habit.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isDark
                  ? isDone
                    ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  : isDone
                  ? 'bg-cyan-50/70 border-cyan-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Checkbox & Details */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleHabit(habit.id)}
                  aria-label={`Toggle habit ${habit.title}`}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    isDone
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 border-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'border-slate-700 bg-slate-950/60 hover:border-cyan-400'
                  }`}
                >
                  {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {habit.title}
                    </h4>
                    <span
                      className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${habit.color}20`,
                        color: habit.color,
                        border: `1px solid ${habit.color}40`
                      }}
                    >
                      {habit.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {habit.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {habit.reminderTime || 'Daily'}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{habit.frequency}</span>
                    {habit.targetValue && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-cyan-400">{habit.targetValue} {habit.unit}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Reorder, Edit, Delete) */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === habits.length - 1}
                    className="p-1 text-slate-500 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(habit)}
                  className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
                  title="Edit habit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(habit.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                  title="Delete habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSave}
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-slate-950 border-cyan-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="font-extrabold text-base mb-4">
              {editingHabit ? 'Edit Habit' : 'Create Custom Habit'}
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45-Min Workout or Read 10 Pages"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Must be outdoors with no excuses"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="fitness">Fitness</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="mindset">Mindset</option>
                    <option value="wellness">Wellness</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="daily">Daily (75 Hard Standard)</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="weekends">Weekends Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Value</label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="min, pages, L"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Reminder</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              >
                {editingHabit ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
