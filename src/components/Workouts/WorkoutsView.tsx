import React, { useState } from 'react';
import {
  Dumbbell,
  Play,
  Plus,
  Video,
  CheckCircle2,
  Trash2,
  Edit2,
  ExternalLink,
  Flame,
  Calendar,
  Check,
  ChevronRight,
  Filter,
  X,
  Sparkles
} from 'lucide-react';
import { Workout, WorkoutCategory, Exercise, ThemeConfig, WorkoutLogEntry } from '../../types';
import { playSound, triggerVibration } from '../../utils/soundEffects';
import { fireAchievementParticles } from '../../utils/confetti';

interface WorkoutsViewProps {
  workouts: Workout[];
  workoutLogs: WorkoutLogEntry[];
  onSaveWorkouts: (workouts: Workout[]) => void;
  onLogCompletedWorkout: (log: WorkoutLogEntry) => void;
  onOpenRestTimer: (seconds: number) => void;
  theme: ThemeConfig;
}

const ALL_CATEGORIES: WorkoutCategory[] = [
  'Legs', 'Glutes', 'Abs', 'Core', 'Arms', 'Back', 'Full Body',
  'Cardio', 'HIIT', 'Stretching', 'Mobility', 'Strength', 'Pilates', 'Dance', 'Walking', 'Running'
];

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  workouts,
  workoutLogs,
  onSaveWorkouts,
  onLogCompletedWorkout,
  onOpenRestTimer,
  theme
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [activeSetsState, setActiveSetsState] = useState<Record<string, { weight: number; reps: number; done: boolean }[]>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'workouts' | 'history'>('workouts');

  // Workout Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'custom' | 'youtube'>('custom');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [categories, setCategories] = useState<WorkoutCategory[]>(['Strength']);
  const [notes, setNotes] = useState('');
  // YouTube fields
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [trainerName, setTrainerName] = useState('');
  // Custom exercises
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const isDark = theme.appearance === 'dark';

  const filteredWorkouts = workouts.filter((w) => {
    if (selectedCategory === 'All') return true;
    return w.categories.includes(selectedCategory as WorkoutCategory);
  });

  // Start live workout session
  const handleStartWorkout = (w: Workout) => {
    setActiveWorkout(w);
    setActiveExerciseIdx(0);
    playSound('start');

    // Initialize set tracker state for exercises
    const setsMap: Record<string, { weight: number; reps: number; done: boolean }[]> = {};
    w.exercises.forEach((ex) => {
      const targetRepsNum = parseInt(ex.targetReps, 10) || 10;
      setsMap[ex.id] = Array.from({ length: ex.targetSets || 3 }).map((_, idx) => ({
        weight: ex.targetWeightKg || 0,
        reps: targetRepsNum,
        done: false
      }));
    });
    setActiveSetsState(setsMap);
  };

  // Toggle set done
  const handleToggleSet = (exId: string, setIdx: number, restSeconds: number) => {
    const current = activeSetsState[exId] ? [...activeSetsState[exId]] : [];
    const isNowDone = !current[setIdx]?.done;
    current[setIdx] = {
      ...current[setIdx],
      done: isNowDone
    };
    setActiveSetsState({
      ...activeSetsState,
      [exId]: current
    });

    if (isNowDone) {
      playSound('complete');
      triggerVibration(40);
      onOpenRestTimer(restSeconds || 60);
    } else {
      playSound('tap');
    }
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    if (!activeWorkout) return;
    let volumeKg = 0;
    Object.values(activeSetsState).forEach((sets) => {
      sets.forEach((s) => {
        if (s.done) volumeKg += s.weight * s.reps;
      });
    });

    const newLog: WorkoutLogEntry = {
      id: `wlog-${Date.now()}`,
      workoutId: activeWorkout.id,
      workoutTitle: activeWorkout.title,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: activeWorkout.durationMinutes,
      volumeKg,
      notes: activeWorkout.notes || 'Crushed during 75-Day Challenge!',
      categories: activeWorkout.categories
    };

    onLogCompletedWorkout(newLog);
    fireAchievementParticles();
    playSound('achievement');
    setActiveWorkout(null);
  };

  // Open Create/Edit modal
  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setType('custom');
    setDurationMinutes(45);
    setDifficulty('intermediate');
    setCategories(['Full Body', 'Strength']);
    setNotes('');
    setYoutubeUrl('');
    setTrainerName('');
    setExercises([
      {
        id: `e-${Date.now()}-1`,
        name: 'Barbell Back Squat',
        category: 'Legs',
        targetSets: 4,
        targetReps: '10',
        targetWeightKg: 60,
        restSeconds: 90
      }
    ]);
    setIsEditorOpen(true);
  };

  const handleSaveWorkoutForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let youtubeVideoId = '';
    let thumb = '';
    if (type === 'youtube' && youtubeUrl) {
      const match = youtubeUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/)([^#&?]*)/);
      if (match && match[1]) {
        youtubeVideoId = match[1];
        thumb = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
      }
    }

    const savedWorkout: Workout = {
      id: editingId || `workout-${Date.now()}`,
      title,
      type,
      categories,
      durationMinutes,
      difficulty,
      notes,
      youtubeUrl: type === 'youtube' ? youtubeUrl : undefined,
      youtubeVideoId: type === 'youtube' ? youtubeVideoId : undefined,
      trainerName: type === 'youtube' ? trainerName : undefined,
      thumbnailUrl: type === 'youtube' ? thumb : undefined,
      exercises: type === 'custom' ? exercises : []
    };

    if (editingId) {
      onSaveWorkouts(workouts.map((w) => (w.id === editingId ? savedWorkout : w)));
    } else {
      onSaveWorkouts([...workouts, savedWorkout]);
    }

    playSound('tap');
    setIsEditorOpen(false);
  };

  const toggleCategorySelection = (cat: WorkoutCategory) => {
    if (categories.includes(cat)) {
      if (categories.length > 1) {
        setCategories(categories.filter((c) => c !== cat));
      }
    } else {
      setCategories([...categories, cat]);
    }
  };

  const addExerciseRow = () => {
    setExercises([
      ...exercises,
      {
        id: `e-${Date.now()}-${exercises.length}`,
        name: 'New Exercise',
        category: 'General',
        targetSets: 3,
        targetReps: '12',
        targetWeightKg: 20,
        restSeconds: 60
      }
    ]);
  };

  const removeExerciseRow = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Dumbbell className="w-5 h-5 text-cyan-400" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Workout Protocols</h2>
              <p className="text-xs text-slate-400">Custom weight training, YouTube routines & active tracker</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workouts vs Logs Segmented */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('workouts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'workouts'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Routines
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Logs ({workoutLogs.length})
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      {activeTab === 'workouts' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-semibold ${
              selectedCategory === 'All'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            All Workouts
          </button>
          {ALL_CATEGORIES.map((cat) => (
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
      )}

      {/* ACTIVE WORKOUT PLAYER MODAL */}
      {activeWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
            isDark ? 'bg-slate-950 border-cyan-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  LIVE WORKOUT SESSION
                </span>
                <h3 className="font-extrabold text-xl text-white">{activeWorkout.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeWorkout.durationMinutes} min · {activeWorkout.categories.join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveWorkout(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Workout Exercises Tracker */}
            {activeWorkout.type === 'custom' ? (
              <div className="space-y-6">
                {activeWorkout.exercises.map((exercise, eIdx) => {
                  const sets = activeSetsState[exercise.id] || [];
                  return (
                    <div
                      key={exercise.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-sm text-cyan-300">{exercise.name}</h4>
                          <span className="text-xs text-slate-400">
                            Target: {exercise.targetSets} sets × {exercise.targetReps} reps · Rest {exercise.restSeconds}s
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenRestTimer(exercise.restSeconds)}
                          className="px-2.5 py-1 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/10"
                        >
                          Rest ({exercise.restSeconds}s)
                        </button>
                      </div>

                      {/* Sets checklist */}
                      <div className="space-y-2">
                        {sets.map((set, sIdx) => (
                          <div
                            key={sIdx}
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                              set.done
                                ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                                : 'bg-slate-950/40 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="font-bold text-slate-400 w-16">Set {sIdx + 1}</span>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1">
                                <span className="text-slate-400">Weight:</span>
                                <input
                                  type="number"
                                  value={set.weight}
                                  onChange={(e) => {
                                    const copy = [...sets];
                                    copy[sIdx].weight = parseFloat(e.target.value) || 0;
                                    setActiveSetsState({ ...activeSetsState, [exercise.id]: copy });
                                  }}
                                  className="w-16 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-center"
                                />
                                <span className="text-slate-400">kg</span>
                              </label>

                              <label className="flex items-center gap-1">
                                <span className="text-slate-400">Reps:</span>
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) => {
                                    const copy = [...sets];
                                    copy[sIdx].reps = parseInt(e.target.value, 10) || 0;
                                    setActiveSetsState({ ...activeSetsState, [exercise.id]: copy });
                                  }}
                                  className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-center"
                                />
                              </label>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleSet(exercise.id, sIdx, exercise.restSeconds)}
                              className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                                set.done
                                  ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                  : 'border-slate-700 bg-slate-900 hover:border-cyan-400'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // YouTube player / guide
              <div className="space-y-4">
                {activeWorkout.youtubeVideoId ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeWorkout.youtubeVideoId}?autoplay=1`}
                      title={activeWorkout.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-sm text-slate-300">YouTube session ready to stream.</p>
                    <a
                      href={activeWorkout.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold underline"
                    >
                      Open Video in YouTube <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Complete workout button */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setActiveWorkout(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Quit Workout
              </button>
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-pink-500 text-white flex items-center gap-1.5 shadow-lg shadow-cyan-900/40 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete & Log Workout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: WORKOUTS LIST */}
      {activeTab === 'workouts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkouts.map((workout) => {
            const isYT = workout.type === 'youtube';

            return (
              <div
                key={workout.id}
                className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all ${
                  isDark
                    ? 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/40 hover:shadow-lg'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Media Thumbnail or Header */}
                {isYT && workout.thumbnailUrl && (
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={workout.thumbnailUrl}
                      alt={workout.title}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-red-400 flex items-center gap-1">
                      <Video className="w-3 h-3 text-red-500" />
                      YouTube
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                      {workout.durationMinutes} min
                    </div>
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-extrabold text-base text-slate-100">{workout.title}</h3>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 shrink-0">
                        {workout.difficulty}
                      </span>
                    </div>

                    {/* Categories */}
                    <div className="flex items-center gap-1.5 flex-wrap my-2">
                      {workout.categories.map((c) => (
                        <span key={c} className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                      {workout.notes || (isYT ? `Trainer: ${workout.trainerName || 'Online Coach'}` : `${workout.exercises.length} Exercises included`)}
                    </p>

                    {/* Exercises preview snippet */}
                    {!isYT && (
                      <div className="space-y-1 mb-4">
                        {workout.exercises.slice(0, 3).map((ex, i) => (
                          <div key={i} className="text-[11px] text-slate-400 flex justify-between">
                            <span className="truncate">{ex.name}</span>
                            <span className="font-mono text-cyan-400 shrink-0">{ex.targetSets}x{ex.targetReps}</span>
                          </div>
                        ))}
                        {workout.exercises.length > 3 && (
                          <span className="text-[10px] text-slate-500 block">+{workout.exercises.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                    <button
                      type="button"
                      onClick={() => onSaveWorkouts(workouts.filter((w) => w.id !== workout.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                      title="Delete workout"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartWorkout(workout)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-900/30 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Session</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: WORKOUT HISTORY LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {workoutLogs.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/30">
              <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No completed workouts logged yet</p>
              <p className="text-xs text-slate-500 mt-1">Start a workout above to record volume, sets and duration!</p>
            </div>
          ) : (
            workoutLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-100">{log.workoutTitle}</h4>
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono">
                      {log.durationMinutes} min
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span className="font-mono text-slate-500">{log.date}</span>
                    {log.volumeKg > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-pink-400 font-mono font-semibold">
                          Total Volume: {log.volumeKg.toLocaleString()} kg
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className="p-2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE WORKOUT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSaveWorkoutForm}
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-slate-950 border-cyan-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="font-extrabold text-lg mb-4">
              {editingId ? 'Edit Workout' : 'Create New Workout'}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Workout Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber Glutes & Quads Blast"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="custom">Custom Exercises</option>
                    <option value="youtube">YouTube Video</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Categories multi-selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Target Categories (Multi-select)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSel = categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategorySelection(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isSel
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* YouTube inputs */}
              {type === 'youtube' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">YouTube Link / URL</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Trainer / Channel Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Move With Nicole"
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Custom Exercises inputs */}
              {type === 'custom' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Exercises ({exercises.length})</span>
                    <button
                      type="button"
                      onClick={addExerciseRow}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Exercise
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {exercises.map((ex, idx) => (
                      <div key={ex.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Exercise Name"
                            value={ex.name}
                            onChange={(e) => {
                              const copy = [...exercises];
                              copy[idx].name = e.target.value;
                              setExercises(copy);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeExerciseRow(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                          <input
                            type="number"
                            placeholder="Sets"
                            value={ex.targetSets}
                            onChange={(e) => {
                              const copy = [...exercises];
                              copy[idx].targetSets = parseInt(e.target.value, 10) || 3;
                              setExercises(copy);
                            }}
                            className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-center font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Reps"
                            value={ex.targetReps}
                            onChange={(e) => {
                              const copy = [...exercises];
                              copy[idx].targetReps = e.target.value;
                              setExercises(copy);
                            }}
                            className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-center font-mono"
                          />
                          <input
                            type="number"
                            placeholder="Weight (kg)"
                            value={ex.targetWeightKg || ''}
                            onChange={(e) => {
                              const copy = [...exercises];
                              copy[idx].targetWeightKg = parseFloat(e.target.value) || 0;
                              setExercises(copy);
                            }}
                            className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-center font-mono"
                          />
                          <input
                            type="number"
                            placeholder="Rest (s)"
                            value={ex.restSeconds}
                            onChange={(e) => {
                              const copy = [...exercises];
                              copy[idx].restSeconds = parseInt(e.target.value, 10) || 60;
                              setExercises(copy);
                            }}
                            className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-center font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Coaching Cues</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Focus on deep contraction, maintain neutral spine"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              >
                Save Workout
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
