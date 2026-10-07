import React, { useState } from 'react';
import {
  Scale,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Camera,
  Target,
  ArrowRight,
  Droplets,
  Footprints,
  Dumbbell,
  CheckSquare,
  Maximize2
} from 'lucide-react';
import { BodyMeasurement, UserProfile, ThemeConfig } from '../../types';
import { playSound, triggerVibration } from '../../utils/soundEffects';
import { fireAchievementParticles } from '../../utils/confetti';

interface BodyTrackingViewProps {
  measurements: BodyMeasurement[];
  profile: UserProfile;
  onSaveMeasurements: (measurements: BodyMeasurement[]) => void;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  theme: ThemeConfig;
}

export const BodyTrackingView: React.FC<BodyTrackingViewProps> = ({
  measurements,
  profile,
  onSaveMeasurements,
  onUpdateProfile,
  theme
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [photoComparisonMode, setPhotoComparisonMode] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState(profile.currentWeightKg);
  const [waistCm, setWaistCm] = useState<number | undefined>(81);
  const [hipsCm, setHipsCm] = useState<number | undefined>(102);
  const [chestCm, setChestCm] = useState<number | undefined>(95);
  const [armsCm, setArmsCm] = useState<number | undefined>(30.5);
  const [thighsCm, setThighsCm] = useState<number | undefined>(60);
  const [bodyFatPercent, setBodyFatPercent] = useState<number | undefined>(26);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const isDark = theme.appearance === 'dark';

  // Sorted measurements by date ascending
  const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1] || { weightKg: profile.currentWeightKg, date: 'Today' };

  const totalWeightLost = baseline ? Number((baseline.weightKg - latest.weightKg).toFixed(1)) : 0;
  const totalWaistLost = baseline?.waistCm && latest?.waistCm ? Number((baseline.waistCm - latest.waistCm).toFixed(1)) : 0;
  const totalBfLost = baseline?.bodyFatPercent && latest?.bodyFatPercent ? Number((baseline.bodyFatPercent - latest.bodyFatPercent).toFixed(1)) : 0;

  // Weight goal progress %
  const totalWeightToLose = baseline ? Math.max(0.1, baseline.weightKg - profile.goalWeightKg) : 10;
  const weightProgressPct = Math.min(100, Math.max(0, Math.round((totalWeightLost / totalWeightToLose) * 100)));

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: BodyMeasurement = {
      id: `m-${Date.now()}`,
      date,
      weightKg: Number(weightKg),
      waistCm: waistCm ? Number(waistCm) : undefined,
      hipsCm: hipsCm ? Number(hipsCm) : undefined,
      chestCm: chestCm ? Number(chestCm) : undefined,
      armsCm: armsCm ? Number(armsCm) : undefined,
      thighsCm: thighsCm ? Number(thighsCm) : undefined,
      bodyFatPercent: bodyFatPercent ? Number(bodyFatPercent) : undefined,
      photoUrl,
      notes
    };

    const updated = [...measurements, newEntry];
    onSaveMeasurements(updated);
    onUpdateProfile({ currentWeightKg: Number(weightKg) });

    fireAchievementParticles();
    playSound('achievement');
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onSaveMeasurements(measurements.filter((m) => m.id !== id));
    playSound('tap');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Scale className="w-5 h-5 text-purple-400" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Body Transformation Tracking</h2>
              <p className="text-xs text-slate-400">Date-based anthropometry, progress photos & goal forecasts</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-900/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Measurements</span>
        </button>
      </div>

      {/* Baseline vs Current vs Goal Comparison */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Transformation Milestones
          </span>
          <span className="text-xs font-bold text-cyan-400">
            {weightProgressPct}% of Weight Goal Achieved
          </span>
        </div>

        {/* Triple Column Comparison */}
        <div className="grid grid-cols-3 gap-3 text-center mb-6">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Baseline (Start)</span>
            <div className="text-2xl font-extrabold font-mono text-slate-300">
              {baseline ? `${baseline.weightKg} kg` : '75.0 kg'}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">{baseline?.date || 'Day 1'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <span className="text-[11px] text-cyan-400 font-bold block mb-1">Current (Day 14)</span>
            <div className="text-2xl font-extrabold font-mono text-cyan-300 glow-text-cyan">
              {latest.weightKg} kg
            </div>
            <span className="text-[10px] text-cyan-400/80 font-bold block mt-0.5">
              {totalWeightLost > 0 ? `-${totalWeightLost} kg lost` : 'On track'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <span className="text-[11px] text-purple-400 font-bold block mb-1">Target Goal</span>
            <div className="text-2xl font-extrabold font-mono text-purple-300">
              {profile.goalWeightKg} kg
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {Number((latest.weightKg - profile.goalWeightKg).toFixed(1))} kg remaining
            </span>
          </div>
        </div>

        {/* Tape Metric Changes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Waist</span>
            <strong className="text-slate-200">{latest.waistCm || 81} cm</strong>
            <span className="text-[10px] text-cyan-400 block">(-{totalWaistLost} cm)</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Body Fat %</span>
            <strong className="text-slate-200">{latest.bodyFatPercent || 26}%</strong>
            <span className="text-[10px] text-pink-400 block">(-{totalBfLost}%)</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Hips</span>
            <strong className="text-slate-200">{latest.hipsCm || 102} cm</strong>
            <span className="text-[10px] text-slate-400 block">Sculpted</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Thighs</span>
            <strong className="text-slate-200">{latest.thighsCm || 60} cm</strong>
            <span className="text-[10px] text-slate-400 block">Toned</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Weight Trend Chart */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-cyan-400" />
            <h3 className="font-extrabold text-sm text-slate-100">Weight Progression & Target Horizon</h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            Goal: {profile.goalWeightKg} kg
          </span>
        </div>

        {/* SVG Line Chart */}
        <div className="w-full h-48 relative">
          <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chart-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="0" y1="30" x2="500" y2="30" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
            <line x1="0" y1="80" x2="500" y2="80" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
            <line x1="0" y1="130" x2="500" y2="130" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />

            {/* Goal Line */}
            <line x1="0" y1="140" x2="500" y2="140" stroke="#9d00ff" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.8" />
            <text x="4" y="137" fill="#9d00ff" fontSize="10" fontWeight="bold">Target Goal ({profile.goalWeightKg}kg)</text>

            {/* Path calculation */}
            {(() => {
              const weights = sorted.map((s) => s.weightKg);
              const maxW = Math.max(...weights, profile.goalWeightKg + 5);
              const minW = Math.min(...weights, profile.goalWeightKg - 2);
              const range = maxW - minW || 1;

              const points = sorted.map((s, idx) => {
                const x = (idx / Math.max(1, sorted.length - 1)) * 480 + 10;
                const y = 140 - ((s.weightKg - minW) / range) * 110;
                return { x, y, weight: s.weightKg, date: s.date };
              });

              const dStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaStr = `${dStr} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

              return (
                <g>
                  {/* Area fill */}
                  <path d={areaStr} fill="url(#chart-area-grad)" />

                  {/* Line */}
                  <path
                    d={dStr}
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Nodes */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="5" fill="#00f0ff" stroke="#020617" strokeWidth="2" />
                      <text
                        x={p.x}
                        y={p.y - 8}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {p.weight}kg
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Target Goals System */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-pink-400" />
          <h3 className="font-extrabold text-sm text-slate-100">Pulse75 Transformation Goals</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Water Goal */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" /> Daily Water Goal
              </span>
              <span className="font-mono text-cyan-400 font-bold">{profile.waterGoalMl} ml</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: '85%' }} />
            </div>
            <span className="text-[10px] text-slate-400">Essential for flushing toxins and muscle recovery</span>
          </div>

          {/* Steps Goal */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-pink-400" /> Daily Steps Goal
              </span>
              <span className="font-mono text-pink-400 font-bold">{profile.stepsGoal.toLocaleString()} steps</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-pink-500" style={{ width: '70%' }} />
            </div>
            <span className="text-[10px] text-slate-400">Non-Exercise Activity Thermogenesis (NEAT) fuel</span>
          </div>

          {/* Workouts Goal */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-purple-400" /> Weekly Workout Target
              </span>
              <span className="font-mono text-purple-400 font-bold">{profile.workoutsGoalPerWeek} sessions/wk</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: '100%' }} />
            </div>
            <span className="text-[10px] text-slate-400">2 workouts daily (1 indoor, 1 outdoor)</span>
          </div>

          {/* Habits Adherence Target */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Daily Habit Adherence
              </span>
              <span className="font-mono text-emerald-400 font-bold">100% Target</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: '92%' }} />
            </div>
            <span className="text-[10px] text-slate-400">Zero compromises on daily foundational standards</span>
          </div>
        </div>
      </div>

      {/* Measurement History Table */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className="font-extrabold text-sm text-slate-100 mb-3">Measurement History Log</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Weight</th>
                <th className="py-2.5 px-3">Waist</th>
                <th className="py-2.5 px-3">Hips</th>
                <th className="py-2.5 px-3">Body Fat</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {sorted.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{m.date}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{m.weightKg} kg</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.waistCm ? `${m.waistCm} cm` : '—'}</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.hipsCm ? `${m.hipsCm} cm` : '—'}</td>
                  <td className="py-2.5 px-3 text-purple-400">{m.bodyFatPercent ? `${m.bodyFatPercent}%` : '—'}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400 truncate max-w-xs">{m.notes || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Measurement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSaveMeasurement}
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-slate-950 border-cyan-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="font-extrabold text-base mb-4">Log Date-Based Measurement</h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waistCm || ''}
                    onChange={(e) => setWaistCm(parseFloat(e.target.value) || undefined)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hips (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hipsCm || ''}
                    onChange={(e) => setHipsCm(parseFloat(e.target.value) || undefined)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFatPercent || ''}
                    onChange={(e) => setBodyFatPercent(parseFloat(e.target.value) || undefined)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={chestCm || ''}
                    onChange={(e) => setChestCm(parseFloat(e.target.value) || undefined)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Arms (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={armsCm || ''}
                    onChange={(e) => setArmsCm(parseFloat(e.target.value) || undefined)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Thighs (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={thighsCm || ''}
                    onChange={(e) => setThighsCm(parseFloat(e.target.value) || undefined)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Check-in Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Weigh-in morning fasted, waist feeling tighter"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Attach Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              >
                Record Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
