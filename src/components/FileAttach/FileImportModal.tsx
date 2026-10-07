import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Dumbbell,
  Scale,
  CheckSquare,
  User,
  Loader2
} from 'lucide-react';
import { DetectedFileData, ThemeConfig, UserProfile, Workout, BodyMeasurement, Habit } from '../../types';
import { analyzeUploadedFile } from '../../utils/fileDetector';
import { playSound, triggerVibration } from '../../utils/soundEffects';
import { fireAchievementParticles } from '../../utils/confetti';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  onApplyUpdates: (updates: {
    profile?: Partial<UserProfile>;
    newWorkouts?: Workout[];
    newMeasurements?: BodyMeasurement[];
    newHabits?: Habit[];
  }) => void;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  theme,
  onApplyUpdates
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedData, setDetectedData] = useState<DetectedFileData | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<boolean[]>([]);
  const [selectedMeasurements, setSelectedMeasurements] = useState<boolean[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<boolean[]>([]);
  const [applyProfile, setApplyProfile] = useState(true);
  const [fileName, setFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isDark = theme.appearance === 'dark';

  const processFile = async (file: File) => {
    setIsAnalyzing(true);
    setFileName(file.name);
    playSound('tap');

    try {
      const data = await analyzeUploadedFile(file);
      setDetectedData(data);
      setSelectedWorkouts((data.detectedWorkouts || []).map(() => true));
      setSelectedMeasurements((data.detectedMeasurements || []).map(() => true));
      setSelectedHabits((data.detectedHabits || []).map(() => true));
      playSound('complete');
      triggerVibration(50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (!detectedData) return;

    const newWorkouts: Workout[] = [];
    (detectedData.detectedWorkouts || []).forEach((dw, idx) => {
      if (selectedWorkouts[idx]) {
        newWorkouts.push({
          id: `w-imported-${Date.now()}-${idx}`,
          title: dw.title || 'Imported Workout',
          type: 'custom',
          categories: dw.categories && dw.categories.length ? dw.categories : ['Full Body', 'Strength'],
          durationMinutes: dw.durationMinutes || 45,
          difficulty: 'intermediate',
          notes: dw.notes || 'Imported via Pulse75 File Engine',
          exercises: (dw.exercises || []).map((ex, eIdx) => ({
            id: `e-imp-${Date.now()}-${eIdx}`,
            name: ex.name,
            category: ex.category || 'General',
            targetSets: ex.targetSets || 3,
            targetReps: ex.targetReps || '10',
            targetWeightKg: ex.targetWeight,
            restSeconds: ex.restSeconds || 60,
            notes: ex.notes
          }))
        });
      }
    });

    const newMeasurements: BodyMeasurement[] = [];
    (detectedData.detectedMeasurements || []).forEach((dm, idx) => {
      if (selectedMeasurements[idx]) {
        newMeasurements.push({
          id: `m-imported-${Date.now()}-${idx}`,
          date: dm.date || new Date().toISOString().split('T')[0],
          weightKg: dm.weight || 73.5,
          waistCm: dm.waist,
          hipsCm: dm.hips,
          chestCm: dm.chest,
          armsCm: dm.arms,
          thighsCm: dm.thighs,
          bodyFatPercent: dm.bodyFat,
          notes: dm.notes || 'Imported from attached file'
        });
      }
    });

    const newHabits: Habit[] = [];
    (detectedData.detectedHabits || []).forEach((dh, idx) => {
      if (selectedHabits[idx]) {
        newHabits.push({
          id: `h-imported-${Date.now()}-${idx}`,
          title: dh.title,
          description: dh.description || 'Imported custom habit',
          category: dh.category || 'wellness',
          frequency: dh.frequency || 'daily',
          targetValue: dh.targetValue || 1,
          unit: dh.unit || 'times',
          icon: 'CheckSquare',
          color: '#00f0ff',
          order: 99
        });
      }
    });

    const profileUpdates: Partial<UserProfile> | undefined = applyProfile && detectedData.detectedProfile ? {
      ...(detectedData.detectedProfile.weight ? { currentWeightKg: detectedData.detectedProfile.weight } : {}),
      ...(detectedData.detectedProfile.currentWeightKg ? { currentWeightKg: detectedData.detectedProfile.currentWeightKg } : {}),
      ...(detectedData.detectedProfile.goalWeight ? { goalWeightKg: detectedData.detectedProfile.goalWeight } : {}),
      ...(detectedData.detectedProfile.goalWeightKg ? { goalWeightKg: detectedData.detectedProfile.goalWeightKg } : {}),
      ...(detectedData.detectedProfile.heightCm ? { heightCm: detectedData.detectedProfile.heightCm } : {}),
      ...(detectedData.detectedProfile.age ? { age: detectedData.detectedProfile.age } : {}),
      ...(detectedData.detectedProfile.sex ? { sex: detectedData.detectedProfile.sex } : {}),
      ...(detectedData.detectedProfile.activityLevel ? { activityLevel: detectedData.detectedProfile.activityLevel } : {})
    } : undefined;

    onApplyUpdates({
      profile: profileUpdates,
      newWorkouts: newWorkouts.length ? newWorkouts : undefined,
      newMeasurements: newMeasurements.length ? newMeasurements : undefined,
      newHabits: newHabits.length ? newHabits : undefined
    });

    fireAchievementParticles();
    playSound('achievement');
    onClose();
  };

  // Quick preset test samples
  const loadSampleFile = (type: 'gym' | 'body') => {
    if (type === 'gym') {
      const sampleText = `Pulse75 Coach Plan
Date: 2026-10-05
Workout: Cyber Strength Push & Core
Duration: 45
Exercises:
- Barbell Bench Press: 4 sets 8 reps @ 75kg (Rest 90s)
- Incline Dumbbell Flyes: 3 sets 12 reps @ 16kg (Rest 60s)
- Overhead Triceps Extension: 3 sets 12 reps @ 22kg
- Cable Woodchoppers: 3 sets 15 reps

Habit: 10 Minute Post-Workout Foam Rolling
Habit: High Protein Post-Workout Shake`;
      const blob = new Blob([sampleText], { type: 'text/plain' });
      const file = new File([blob], 'coach_push_routine.txt', { type: 'text/plain' });
      processFile(file);
    } else {
      const sampleText = `InBody Composition Scan Export
Date: 2026-10-05
Weight: 72.8
Waist: 80.5
Hips: 101.0
Body Fat: 25.2
Notes: Significant fat loss noted in midsection. Muscle retention optimal.`;
      const blob = new Blob([sampleText], { type: 'text/plain' });
      const file = new File([blob], 'inbody_scan_oct2026.txt', { type: 'text/plain' });
      processFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
        isDark
          ? 'bg-slate-950 border-cyan-500/40 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </span>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">Attach File & Smart Detection</h3>
              <p className="text-xs text-slate-400">Detect workouts, weight logs, and habits from files</p>
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

        {/* Upload Dropzone */}
        {!detectedData && !isAnalyzing && (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.csv,.json,.pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm text-slate-200 mb-1">
                Drop your fitness file, scale photo, or routine here
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Supports Images (JPG, PNG), CSV logs, Workout sheets, or Text notes
              </p>
              <span className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 inline-block hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                Browse File
              </span>
            </div>

            {/* Quick Demo Previews */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Or test with sample fitness files:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadSampleFile('gym')}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-cyan-500/40 text-xs text-cyan-300 font-medium flex items-center gap-1.5"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  Load Sample Workout Routine
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleFile('body')}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-purple-500/40 text-xs text-purple-300 font-medium flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Load InBody Weight Slip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading / Analyzing State */}
        {isAnalyzing && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
            <p className="font-extrabold text-base text-slate-200">
              AI Analyzing "{fileName}"...
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Detecting exercises, body metrics, habit targets, and updates...
            </p>
          </div>
        )}

        {/* Detected Results Review View */}
        {detectedData && !isAnalyzing && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Analysis Complete ({detectedData.confidenceScore}% Confidence)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{fileName}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{detectedData.summary}</p>
            </div>

            {/* Detected Profile Changes */}
            {detectedData.detectedProfile && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={applyProfile}
                    onChange={(e) => setApplyProfile(e.target.checked)}
                    className="rounded text-cyan-500 w-4 h-4"
                  />
                  <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-cyan-400" />
                    Update User Profile Metrics
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs ml-6">
                  {detectedData.detectedProfile.weight && (
                    <div className="text-slate-300">Weight: <strong className="text-cyan-400">{detectedData.detectedProfile.weight} kg</strong></div>
                  )}
                  {detectedData.detectedProfile.goalWeight && (
                    <div className="text-slate-300">Goal: <strong className="text-purple-400">{detectedData.detectedProfile.goalWeight} kg</strong></div>
                  )}
                  {detectedData.detectedProfile.activityLevel && (
                    <div className="text-slate-300">Activity: <strong className="text-pink-400">{detectedData.detectedProfile.activityLevel}</strong></div>
                  )}
                </div>
              </div>
            )}

            {/* Detected Workouts */}
            {detectedData.detectedWorkouts && detectedData.detectedWorkouts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-cyan-400" />
                  Detected Workouts ({detectedData.detectedWorkouts.length})
                </span>
                {detectedData.detectedWorkouts.map((w, idx) => (
                  <label key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedWorkouts[idx] ?? true}
                      onChange={(e) => {
                        const copy = [...selectedWorkouts];
                        copy[idx] = e.target.checked;
                        setSelectedWorkouts(copy);
                      }}
                      className="rounded text-cyan-500 w-4 h-4 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-100">{w.title} ({w.durationMinutes || 45}m)</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {w.exercises?.map(e => `${e.name} (${e.targetSets}x${e.targetReps}${e.targetWeight ? ` @ ${e.targetWeight}kg` : ''})`).join(' · ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Detected Measurements */}
            {detectedData.detectedMeasurements && detectedData.detectedMeasurements.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-400" />
                  Detected Body Measurements ({detectedData.detectedMeasurements.length})
                </span>
                {detectedData.detectedMeasurements.map((m, idx) => (
                  <label key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMeasurements[idx] ?? true}
                      onChange={(e) => {
                        const copy = [...selectedMeasurements];
                        copy[idx] = e.target.checked;
                        setSelectedMeasurements(copy);
                      }}
                      className="rounded text-purple-500 w-4 h-4 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-100">Date: {m.date}</div>
                      <div className="text-slate-400 text-[11px] flex gap-3 mt-0.5">
                        {m.weight && <span>Weight: <strong className="text-cyan-400">{m.weight}kg</strong></span>}
                        {m.waist && <span>Waist: <strong className="text-purple-400">{m.waist}cm</strong></span>}
                        {m.bodyFat && <span>Body Fat: <strong className="text-pink-400">{m.bodyFat}%</strong></span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Detected Habits */}
            {detectedData.detectedHabits && detectedData.detectedHabits.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-pink-400" />
                  Detected Habits to Track ({detectedData.detectedHabits.length})
                </span>
                {detectedData.detectedHabits.map((h, idx) => (
                  <label key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedHabits[idx] ?? true}
                      onChange={(e) => {
                        const copy = [...selectedHabits];
                        copy[idx] = e.target.checked;
                        setSelectedHabits(copy);
                      }}
                      className="rounded text-pink-500 w-4 h-4 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-100">{h.title}</div>
                      <div className="text-slate-400 text-[11px]">{h.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDetectedData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Scan Another File
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white flex items-center gap-1.5 shadow-lg shadow-cyan-900/30 hover:opacity-95 cursor-pointer"
              >
                <span>Apply Detected Changes to Pulse75</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
