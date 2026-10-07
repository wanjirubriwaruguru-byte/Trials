import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Timer as TimerIcon,
  Clock,
  Zap,
  Repeat,
  SlidersHorizontal,
  Flame,
  Check,
  ChevronRight,
  FastForward,
  Rewind
} from 'lucide-react';
import { playSound, triggerVibration } from '../../utils/soundEffects';
import { ThemeConfig } from '../../types';

interface TimerSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  initialMode?: 'countdown' | 'stopwatch' | 'rest' | 'circuit';
  initialRestSeconds?: number;
}

interface CircuitPreset {
  name: string;
  description: string;
  work: number;
  rest: number;
  rounds: number;
}

const CIRCUIT_PRESETS: CircuitPreset[] = [
  { name: 'Tabata Protocol', description: 'Maximum metabolic rate burn', work: 20, rest: 10, rounds: 8 },
  { name: 'Pulse Classic', description: 'Functional strength & cardio standard', work: 40, rest: 20, rounds: 5 },
  { name: 'Heavy Burn', description: 'Lactic threshold & muscular power', work: 45, rest: 15, rounds: 6 },
  { name: 'Sprint Intervals', description: 'Explosive cardiovascular speed', work: 30, rest: 30, rounds: 10 },
  { name: 'Endurance Flow', description: 'Sustained aerobic conditioning', work: 60, rest: 30, rounds: 4 },
  { name: 'Quick 7-Min', description: 'Full body rapid circuit', work: 30, rest: 10, rounds: 12 },
];

export const TimerSuiteModal: React.FC<TimerSuiteModalProps> = ({
  isOpen,
  onClose,
  theme,
  initialMode = 'rest',
  initialRestSeconds = 60
}) => {
  const [mode, setMode] = useState<'countdown' | 'stopwatch' | 'rest' | 'circuit'>(initialMode);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Countdown state
  const [countdownDuration, setCountdownDuration] = useState(180); // 3 mins default
  const [countdownLeft, setCountdownLeft] = useState(180);
  const [countdownRunning, setCountdownRunning] = useState(false);

  // Stopwatch state
  const [swTimeMs, setSwTimeMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Rest Timer state
  const [restDuration, setRestDuration] = useState(initialRestSeconds);
  const [restLeft, setRestLeft] = useState(initialRestSeconds);
  const [restRunning, setRestRunning] = useState(false);

  // Circuit Timer state with localStorage persistence
  const [workSec, setWorkSec] = useState<number>(() => {
    if (typeof window === 'undefined') return 40;
    try {
      const saved = localStorage.getItem('pulse75_hiit_config');
      return saved ? JSON.parse(saved).work || 40 : 40;
    } catch {
      return 40;
    }
  });

  const [circuitRestSec, setCircuitRestSec] = useState<number>(() => {
    if (typeof window === 'undefined') return 20;
    try {
      const saved = localStorage.getItem('pulse75_hiit_config');
      return saved ? JSON.parse(saved).rest ?? 20 : 20;
    } catch {
      return 20;
    }
  });

  const [totalRounds, setTotalRounds] = useState<number>(() => {
    if (typeof window === 'undefined') return 5;
    try {
      const saved = localStorage.getItem('pulse75_hiit_config');
      return saved ? JSON.parse(saved).rounds || 5 : 5;
    } catch {
      return 5;
    }
  });

  const [prepSec, setPrepSec] = useState<number>(() => {
    if (typeof window === 'undefined') return 5;
    try {
      const saved = localStorage.getItem('pulse75_hiit_config');
      return saved ? JSON.parse(saved).prep ?? 5 : 5;
    } catch {
      return 5;
    }
  });

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [circuitPhase, setCircuitPhase] = useState<'prep' | 'work' | 'rest'>('work');
  const [circuitSecLeft, setCircuitSecLeft] = useState<number>(workSec);
  const [circuitRunning, setCircuitRunning] = useState<boolean>(false);
  const [isEditingCircuit, setIsEditingCircuit] = useState<boolean>(false);

  // Persist circuit config
  const saveCircuitConfig = (w: number, r: number, rnds: number, p: number = prepSec) => {
    try {
      localStorage.setItem(
        'pulse75_hiit_config',
        JSON.stringify({ work: w, rest: r, rounds: rnds, prep: p })
      );
    } catch (e) {
      console.debug('Failed to save HIIT config', e);
    }
  };

  const countdownIntervalRef = useRef<any>(null);
  const swIntervalRef = useRef<any>(null);
  const restIntervalRef = useRef<any>(null);
  const circuitIntervalRef = useRef<any>(null);

  // Sync initial mode / rest
  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialRestSeconds) {
      setRestDuration(initialRestSeconds);
      setRestLeft(initialRestSeconds);
    }
  }, [initialMode, initialRestSeconds]);

  // Countdown runner
  useEffect(() => {
    if (countdownRunning) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdownLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setCountdownRunning(false);
            if (soundEnabled) playSound('complete');
            triggerVibration([80, 50, 80]);
            return 0;
          }
          if (prev <= 4 && soundEnabled) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownIntervalRef.current);
    }
    return () => clearInterval(countdownIntervalRef.current);
  }, [countdownRunning, soundEnabled]);

  // Stopwatch runner
  useEffect(() => {
    let startTimestamp = Date.now() - swTimeMs;
    if (swRunning) {
      swIntervalRef.current = setInterval(() => {
        setSwTimeMs(Date.now() - startTimestamp);
      }, 33);
    } else {
      clearInterval(swIntervalRef.current);
    }
    return () => clearInterval(swIntervalRef.current);
  }, [swRunning]);

  // Rest Timer runner
  useEffect(() => {
    if (restRunning) {
      restIntervalRef.current = setInterval(() => {
        setRestLeft((prev) => {
          if (prev <= 1) {
            clearInterval(restIntervalRef.current);
            setRestRunning(false);
            if (soundEnabled) playSound('rest_done');
            triggerVibration([100, 50, 100, 50, 100]);
            return 0;
          }
          if (prev <= 3 && soundEnabled) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restIntervalRef.current);
    }
    return () => clearInterval(restIntervalRef.current);
  }, [restRunning, soundEnabled]);

  // Circuit Timer runner
  useEffect(() => {
    if (circuitRunning) {
      circuitIntervalRef.current = setInterval(() => {
        setCircuitSecLeft((prev: number) => {
          if (prev <= 1) {
            if (circuitPhase === 'prep') {
              // Switch from prep to work
              setCircuitPhase('work');
              if (soundEnabled) playSound('start');
              triggerVibration(60);
              return workSec;
            } else if (circuitPhase === 'work') {
              if (circuitRestSec === 0) {
                // If 0 rest interval, advance straight to next round
                if (currentRound >= totalRounds) {
                  setCircuitRunning(false);
                  if (soundEnabled) playSound('achievement');
                  triggerVibration([150, 80, 200]);
                  return 0;
                } else {
                  setCurrentRound((r) => r + 1);
                  setCircuitPhase('work');
                  if (soundEnabled) playSound('start');
                  triggerVibration(60);
                  return workSec;
                }
              }
              // Switch to rest
              setCircuitPhase('rest');
              if (soundEnabled) playSound('complete');
              triggerVibration(60);
              return circuitRestSec;
            } else {
              // Rest finished, advance round
              if (currentRound >= totalRounds) {
                // Done!
                setCircuitRunning(false);
                if (soundEnabled) playSound('achievement');
                triggerVibration([150, 80, 200]);
                return 0;
              } else {
                setCurrentRound((r) => r + 1);
                setCircuitPhase('work');
                if (soundEnabled) playSound('start');
                triggerVibration(60);
                return workSec;
              }
            }
          }
          if (prev <= 3 && soundEnabled) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(circuitIntervalRef.current);
    }
    return () => clearInterval(circuitIntervalRef.current);
  }, [circuitRunning, circuitPhase, currentRound, totalRounds, workSec, circuitRestSec, soundEnabled]);

  // Circuit edit helper functions
  const handleAdjustWork = (delta: number) => {
    const next = Math.max(5, Math.min(300, workSec + delta));
    setWorkSec(next);
    saveCircuitConfig(next, circuitRestSec, totalRounds, prepSec);
    if (!circuitRunning && circuitPhase === 'work') {
      setCircuitSecLeft(next);
    }
    playSound('tap');
  };

  const handleAdjustRest = (delta: number) => {
    const next = Math.max(0, Math.min(300, circuitRestSec + delta));
    setCircuitRestSec(next);
    saveCircuitConfig(workSec, next, totalRounds, prepSec);
    if (!circuitRunning && circuitPhase === 'rest') {
      setCircuitSecLeft(next);
    }
    playSound('tap');
  };

  const handleAdjustRounds = (delta: number) => {
    const next = Math.max(1, Math.min(50, totalRounds + delta));
    setTotalRounds(next);
    saveCircuitConfig(workSec, circuitRestSec, next, prepSec);
    playSound('tap');
  };

  const handleApplyPreset = (preset: CircuitPreset) => {
    setWorkSec(preset.work);
    setCircuitRestSec(preset.rest);
    setTotalRounds(preset.rounds);
    saveCircuitConfig(preset.work, preset.rest, preset.rounds, prepSec);
    setCircuitRunning(false);
    setCurrentRound(1);
    setCircuitPhase('work');
    setCircuitSecLeft(preset.work);
    playSound('start');
    triggerVibration(40);
  };

  const handleResetCircuit = () => {
    setCircuitRunning(false);
    setCurrentRound(1);
    setCircuitPhase('work');
    setCircuitSecLeft(workSec);
    playSound('tap');
  };

  const handleSkipPhase = () => {
    if (circuitPhase === 'prep') {
      setCircuitPhase('work');
      setCircuitSecLeft(workSec);
      if (soundEnabled) playSound('start');
    } else if (circuitPhase === 'work') {
      if (circuitRestSec === 0) {
        if (currentRound >= totalRounds) {
          setCircuitRunning(false);
          if (soundEnabled) playSound('achievement');
        } else {
          setCurrentRound((r) => r + 1);
          setCircuitSecLeft(workSec);
          if (soundEnabled) playSound('start');
        }
      } else {
        setCircuitPhase('rest');
        setCircuitSecLeft(circuitRestSec);
        if (soundEnabled) playSound('complete');
      }
    } else {
      if (currentRound >= totalRounds) {
        setCircuitRunning(false);
        if (soundEnabled) playSound('achievement');
      } else {
        setCurrentRound((r) => r + 1);
        setCircuitPhase('work');
        setCircuitSecLeft(workSec);
        if (soundEnabled) playSound('start');
      }
    }
  };

  const handlePrevRound = () => {
    if (currentRound > 1) {
      setCurrentRound((r) => r - 1);
      setCircuitPhase('work');
      setCircuitSecLeft(workSec);
      playSound('tap');
    }
  };

  const handleToggleCircuitStart = () => {
    if (!circuitRunning) {
      if (circuitSecLeft === 0) {
        setCurrentRound(1);
        setCircuitPhase('work');
        setCircuitSecLeft(workSec);
      }
      setCircuitRunning(true);
      if (soundEnabled) playSound('start');
    } else {
      setCircuitRunning(false);
    }
  };

  if (!isOpen) return null;

  const isDark = theme.appearance === 'dark';

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStopwatch = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto ${
        isDark
          ? 'bg-slate-950 border-cyan-500/30 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <TimerIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">Pulse Suite Timers</h3>
              <p className="text-xs text-slate-400">Precision interval & rest engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                  : 'text-slate-500 border-slate-800 bg-slate-900'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-6">
          <button
            type="button"
            onClick={() => setMode('rest')}
            className={`py-2 px-1 rounded-lg font-semibold transition-all ${
              mode === 'rest'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rest
          </button>
          <button
            type="button"
            onClick={() => setMode('countdown')}
            className={`py-2 px-1 rounded-lg font-semibold transition-all ${
              mode === 'countdown'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Timer
          </button>
          <button
            type="button"
            onClick={() => setMode('stopwatch')}
            className={`py-2 px-1 rounded-lg font-semibold transition-all ${
              mode === 'stopwatch'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stopwatch
          </button>
          <button
            type="button"
            onClick={() => setMode('circuit')}
            className={`py-2 px-1 rounded-lg font-semibold transition-all ${
              mode === 'circuit'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            HIIT
          </button>
        </div>

        {/* 1. REST TIMER VIEW */}
        {mode === 'rest' && (
          <div className="flex flex-col items-center">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mb-5 flex-wrap justify-center">
              {[30, 45, 60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setRestDuration(sec);
                    setRestLeft(sec);
                    setRestRunning(false);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                    restDuration === sec
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                </button>
              ))}
            </div>

            {/* Glowing Digital Dial */}
            <div className="relative w-52 h-52 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  stroke="url(#rest-gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 92}
                  strokeDashoffset={2 * Math.PI * 92 * (1 - restLeft / (restDuration || 1))}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="rest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#9d00ff" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold tracking-tight font-mono text-cyan-300 glow-text-cyan">
                  {formatMinSec(restLeft)}
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-semibold">
                  {restRunning ? 'Resting...' : restLeft === 0 ? 'Ready!' : 'Rest Interval'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setRestLeft(restDuration);
                  setRestRunning(false);
                }}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (restLeft === 0) setRestLeft(restDuration);
                  setRestRunning(!restRunning);
                  if (!restRunning && soundEnabled) playSound('start');
                }}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
              >
                {restRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{restRunning ? 'Pause' : 'Start Rest'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestLeft((p) => p + 30);
                  setRestDuration((d) => d + 30);
                }}
                title="Add 30 seconds"
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. COUNTDOWN TIMER VIEW */}
        {mode === 'countdown' && (
          <div className="flex flex-col items-center">
            {/* Quick Presets */}
            <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
              {[1, 2, 3, 5, 10, 15].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    const sec = m * 60;
                    setCountdownDuration(sec);
                    setCountdownLeft(sec);
                    setCountdownRunning(false);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                    countdownDuration === m * 60
                      ? 'border-purple-400 bg-purple-500/20 text-purple-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="text-5xl font-extrabold tracking-tight font-mono text-purple-300 my-6">
              {formatMinSec(countdownLeft)}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setCountdownLeft(countdownDuration);
                  setCountdownRunning(false);
                }}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (countdownLeft === 0) setCountdownLeft(countdownDuration);
                  setCountdownRunning(!countdownRunning);
                  if (!countdownRunning && soundEnabled) playSound('start');
                }}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(157,0,255,0.4)] transition-all cursor-pointer"
              >
                {countdownRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{countdownRunning ? 'Pause' : 'Start'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. STOPWATCH VIEW */}
        {mode === 'stopwatch' && (
          <div className="flex flex-col items-center">
            <div className="text-5xl font-extrabold tracking-tight font-mono text-cyan-300 my-6">
              {formatStopwatch(swTimeMs)}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setSwTimeMs(0);
                  setSwRunning(false);
                  setLaps([]);
                }}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSwRunning(!swRunning);
                  if (!swRunning && soundEnabled) playSound('start');
                }}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-500 text-slate-950 font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
              >
                {swRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{swRunning ? 'Stop' : 'Start'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (swRunning) {
                    setLaps((prev) => [swTimeMs, ...prev]);
                    if (soundEnabled) playSound('tap');
                  }
                }}
                disabled={!swRunning}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-cyan-400 hover:text-cyan-300 disabled:opacity-40"
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Lap times */}
            {laps.length > 0 && (
              <div className="w-full max-h-36 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-900/40 p-2 space-y-1 text-xs">
                {laps.map((lap, i) => (
                  <div key={i} className="flex justify-between items-center py-1 px-2 text-slate-300">
                    <span className="font-semibold text-slate-500">Lap {laps.length - i}</span>
                    <span className="font-mono text-cyan-400">{formatStopwatch(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CIRCUIT / HIIT VIEW */}
        {mode === 'circuit' && (() => {
          const currentPhaseDuration = circuitPhase === 'prep' ? (prepSec || 1) : circuitPhase === 'work' ? (workSec || 1) : (circuitRestSec || 1);
          const totalHiitSec = (workSec + circuitRestSec) * totalRounds;
          const totalHiitFormatted = `${Math.floor(totalHiitSec / 60)}m ${totalHiitSec % 60 ? `${totalHiitSec % 60}s` : ''}`;
          const activePreset = CIRCUIT_PRESETS.find(p => p.work === workSec && p.rest === circuitRestSec && p.rounds === totalRounds);

          return (
            <div className="flex flex-col items-center w-full">
              {/* Header Summary & Edit Toggle */}
              <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    Total: <strong className="text-white">{totalHiitFormatted}</strong>
                  </span>
                  {activePreset && (
                    <span className="text-[10px] font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                      {activePreset.name}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingCircuit(!isEditingCircuit)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isEditingCircuit
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isEditingCircuit ? 'Done' : 'Customize HIIT'}</span>
                </button>
              </div>

              {/* Collapsible HIIT Config / Presets Drawer */}
              {isEditingCircuit && (
                <div className="w-full mb-5 p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-4 animate-fadeIn">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-pink-500" />
                        HIIT Protocols & Presets
                      </span>
                      <span className="text-[10px] text-slate-400">1-Tap Apply</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {CIRCUIT_PRESETS.map((preset) => {
                        const isSelected = workSec === preset.work && circuitRestSec === preset.rest && totalRounds === preset.rounds;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500 text-white shadow-sm'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <span className="font-bold text-[11px] block text-slate-200">{preset.name}</span>
                            <span className="text-[10px] font-mono text-cyan-400 mt-0.5 block">
                              {preset.work}s / {preset.rest}s · {preset.rounds} Rds
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fine-Tuning Sliders & Precision Adjusters */}
                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 font-semibold flex items-center gap-1 text-[11px]">
                          <Flame className="w-3 h-3 text-pink-400" /> Work Duration
                        </span>
                        <span className="font-mono text-pink-400 font-bold">{workSec}s</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={workSec}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setWorkSec(val);
                          saveCircuitConfig(val, circuitRestSec, totalRounds, prepSec);
                          if (!circuitRunning && circuitPhase === 'work') setCircuitSecLeft(val);
                        }}
                        className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 font-semibold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-cyan-400" /> Rest Interval
                        </span>
                        <span className="font-mono text-cyan-400 font-bold">{circuitRestSec}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="5"
                        value={circuitRestSec}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCircuitRestSec(val);
                          saveCircuitConfig(workSec, val, totalRounds, prepSec);
                          if (!circuitRunning && circuitPhase === 'rest') setCircuitSecLeft(val);
                        }}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 font-semibold flex items-center gap-1 text-[11px]">
                          <Repeat className="w-3 h-3 text-purple-400" /> Total Circuit Rounds
                        </span>
                        <span className="font-mono text-purple-400 font-bold">{totalRounds} Rounds</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={totalRounds}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTotalRounds(val);
                          saveCircuitConfig(workSec, circuitRestSec, val, prepSec);
                        }}
                        className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3 Interactive Stepper Cards (Instant +/- Tapping) */}
              <div className="w-full grid grid-cols-3 gap-2 mb-4">
                {/* Work Stepper Card */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Work</span>
                  <div className="my-1 flex items-baseline">
                    <span className="text-lg font-extrabold font-mono text-white">{workSec}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-0.5">s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustWork(-5)}
                      className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
                      title="Minus 5s"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustWork(5)}
                      className="w-6 h-6 rounded-md bg-pink-500/20 text-pink-300 hover:text-white flex items-center justify-center hover:bg-pink-500/30 transition-colors"
                      title="Plus 5s"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Rest Stepper Card */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Rest</span>
                  <div className="my-1 flex items-baseline">
                    <span className="text-lg font-extrabold font-mono text-white">{circuitRestSec}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-0.5">s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustRest(-5)}
                      className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
                      title="Minus 5s"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustRest(5)}
                      className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 hover:text-white flex items-center justify-center hover:bg-cyan-500/30 transition-colors"
                      title="Plus 5s"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Rounds Stepper Card */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Rounds</span>
                  <div className="my-1 flex items-baseline">
                    <span className="text-lg font-extrabold font-mono text-white">{totalRounds}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-0.5">rds</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustRounds(-1)}
                      className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
                      title="Minus 1 round"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustRounds(1)}
                      className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 hover:text-white flex items-center justify-center hover:bg-purple-500/30 transition-colors"
                      title="Plus 1 round"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Glowing Circular Progress Dial for HIIT */}
              <div className="relative w-52 h-52 flex items-center justify-center my-1">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="104"
                    cy="104"
                    r="90"
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="104"
                    cy="104"
                    r="90"
                    stroke={
                      circuitPhase === 'work'
                        ? 'url(#hiit-work-grad)'
                        : circuitPhase === 'rest'
                        ? 'url(#hiit-rest-grad)'
                        : 'url(#hiit-prep-grad)'
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 90}
                    strokeDashoffset={2 * Math.PI * 90 * (1 - circuitSecLeft / currentPhaseDuration)}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="hiit-work-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff007a" />
                      <stop offset="100%" stopColor="#ff6a00" />
                    </linearGradient>
                    <linearGradient id="hiit-rest-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="100%" stopColor="#0072ff" />
                    </linearGradient>
                    <linearGradient id="hiit-prep-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9d00ff" />
                      <stop offset="100%" stopColor="#00f0ff" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute flex flex-col items-center text-center">
                  {/* Phase Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest mb-1 ${
                      circuitPhase === 'work'
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50 glow-pink'
                        : circuitPhase === 'rest'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 glow-cyan'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                    }`}
                  >
                    {circuitPhase === 'work' ? 'WORK' : circuitPhase === 'rest' ? 'REST' : 'GET READY'}
                  </span>

                  {/* Digital Seconds */}
                  <span
                    className={`text-5xl font-extrabold font-mono tracking-tight leading-none ${
                      circuitPhase === 'work'
                        ? 'text-pink-400 glow-text-pink'
                        : circuitPhase === 'rest'
                        ? 'text-cyan-400 glow-text-cyan'
                        : 'text-purple-300'
                    }`}
                  >
                    {circuitSecLeft}
                    <span className="text-xl font-normal ml-0.5">s</span>
                  </span>

                  {/* Round Counter */}
                  <span className="text-xs font-bold text-slate-300 mt-1">
                    Round {currentRound} / {totalRounds}
                  </span>
                </div>
              </div>

              {/* Round Indicator Pips (Dots) */}
              <div className="flex items-center gap-1.5 my-3 flex-wrap justify-center max-w-xs">
                {Array.from({ length: Math.min(totalRounds, 20) }).map((_, idx) => {
                  const roundNum = idx + 1;
                  const isPast = roundNum < currentRound;
                  const isCurrent = roundNum === currentRound;
                  return (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCurrent
                          ? 'w-6 bg-gradient-to-r from-pink-500 to-cyan-400 shadow-[0_0_8px_rgba(255,0,122,0.6)]'
                          : isPast
                          ? 'w-2 bg-cyan-400'
                          : 'w-2 bg-slate-800'
                      }`}
                      title={`Round ${roundNum}`}
                    />
                  );
                })}
              </div>

              {/* Tactical Controls Bar */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleResetCircuit}
                  title="Reset to Round 1"
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePrevRound}
                  disabled={currentRound <= 1}
                  title="Previous Round"
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Rewind className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleCircuitStart}
                  className={`px-7 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    circuitPhase === 'work'
                      ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-pink-900/30 hover:opacity-95'
                      : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-cyan-900/30 hover:opacity-95'
                  }`}
                >
                  {circuitRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  <span>{circuitRunning ? 'Pause' : 'Start HIIT'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipPhase}
                  title="Skip to Next Interval / Round"
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FastForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
