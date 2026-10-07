import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Palette,
  User,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Footprints,
  Shield,
  FileText,
  Award,
  Sparkles,
  Check,
  Smartphone
} from 'lucide-react';
import { ThemeConfig, ThemeAppearance, ThemeStyle, UserProfile } from '../../types';
import { Storage } from '../../utils/storage';
import { playSound, triggerVibration } from '../../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  profile: UserProfile;
  onUpdateTheme: (theme: ThemeConfig) => void;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onOpenResetChallenge: () => void;
  onOpenNativeAndroid?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  profile,
  onUpdateTheme,
  onUpdateProfile,
  onOpenResetChallenge,
  onOpenNativeAndroid
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'profile' | 'notifications' | 'backup'>('theme');
  const [copiedExport, setCopiedExport] = useState(false);

  // Profile form state
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [sex, setSex] = useState(profile.sex);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [currentWeightKg, setCurrentWeightKg] = useState(profile.currentWeightKg);
  const [goalWeightKg, setGoalWeightKg] = useState(profile.goalWeightKg);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);

  // Notifications simulation state
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);
  const [weighInReminders, setWeighInReminders] = useState(true);

  if (!isOpen) return null;

  const isDark = theme.appearance === 'dark';

  const handleAppearanceChange = (appearance: ThemeAppearance) => {
    onUpdateTheme({ ...theme, appearance });
    playSound('tap');
  };

  const handleStyleChange = (style: ThemeStyle) => {
    onUpdateTheme({ ...theme, style });
    playSound('tap');
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      age: Number(age),
      sex,
      heightCm: Number(heightCm),
      currentWeightKg: Number(currentWeightKg),
      goalWeightKg: Number(goalWeightKg),
      activityLevel
    });
    playSound('complete');
    onClose();
  };

  const handleExportData = () => {
    const jsonStr = Storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pulse75_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSound('achievement');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (Storage.importAllData(content)) {
          alert('Pulse75 data successfully imported! Refreshing state.');
          window.location.reload();
        } else {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Palette className="w-5 h-5 text-cyan-400" />
            </span>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">System & Profile Hub</h3>
              <p className="text-xs text-slate-400">Themes, anthropometry & backup configuration</p>
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

        {/* Tab switcher */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'theme' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'profile' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'notifications' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'backup' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sync / PDF
          </button>
        </div>

        {/* TAB 1: THEMES */}
        {activeTab === 'theme' && (
          <div className="space-y-6 text-xs">
            {/* Appearance (Light vs Dark) */}
            <div>
              <span className="font-bold text-slate-300 block mb-2">1. Appearance Mode</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAppearanceChange('dark')}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    theme.appearance === 'dark'
                      ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300 shadow-md shadow-cyan-950/40'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-5 h-5" />
                    <div>
                      <span className="font-bold text-sm block">Dark Mode</span>
                      <span className="text-[11px] text-slate-500">OLED black with neon accents</span>
                    </div>
                  </div>
                  {theme.appearance === 'dark' && <Check className="w-4 h-4 text-cyan-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleAppearanceChange('light')}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    theme.appearance === 'light'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="font-bold text-sm block">Light Mode</span>
                      <span className="text-[11px] text-slate-500">Clean crisp white background</span>
                    </div>
                  </div>
                  {theme.appearance === 'light' && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>
            </div>

            {/* Style (Tech vs Feminine vs Masculine) */}
            <div>
              <span className="font-bold text-slate-300 block mb-2">2. Visual Style Standard</span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleStyleChange('tech')}
                  className={`p-4 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                    theme.style === 'tech'
                      ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300 glow-cyan'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <span className="w-3 h-3 rounded-full bg-cyan-400 block mb-2 shadow-[0_0_8px_#00f0ff]" />
                    <span className="font-bold text-sm text-white block">Tech</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Futuristic neon cyan, hot magenta & cyber glow
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStyleChange('feminine')}
                  className={`p-4 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                    theme.style === 'feminine'
                      ? 'border-pink-400 bg-pink-950/20 text-pink-300 glow-pink'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <span className="w-3 h-3 rounded-full bg-pink-400 block mb-2 shadow-[0_0_8px_#ff007a]" />
                    <span className="font-bold text-sm text-white block">Feminine</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Soft rose pink, ice blue & elegant curves
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStyleChange('masculine')}
                  className={`p-4 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                    theme.style === 'masculine'
                      ? 'border-slate-300 bg-slate-800 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <span className="w-3 h-3 rounded-full bg-slate-200 block mb-2" />
                    <span className="font-bold text-sm text-white block">Masculine</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Clean dark geometric tactical HUD design
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE FORM */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Biological Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Non-specified</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 25)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 170)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px] focus:border-cyan-500 focus:outline-none"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="athlete">Athlete</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(parseFloat(e.target.value) || 70)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Goal Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalWeightKg}
                  onChange={(e) => setGoalWeightKg(parseFloat(e.target.value) || 64)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: NOTIFICATIONS / ALERTS */}
        {activeTab === 'notifications' && (
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-slate-200 block">Workout Schedule Alerts</span>
                <span className="text-[11px] text-slate-400">Reminders for morning and outdoor sessions</span>
              </div>
              <input
                type="checkbox"
                checked={workoutReminders}
                onChange={(e) => setWorkoutReminders(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-slate-200 block">Hourly Hydration Chimes</span>
                <span className="text-[11px] text-slate-400">Gentle reminders to reach 3.7L daily goal</span>
              </div>
              <input
                type="checkbox"
                checked={waterReminders}
                onChange={(e) => setWaterReminders(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-slate-200 block">Evening Habit Check-in</span>
                <span className="text-[11px] text-slate-400">Verify 100% adherence before bedtime</span>
              </div>
              <input
                type="checkbox"
                checked={habitReminders}
                onChange={(e) => setHabitReminders(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-slate-200 block">Weekly Weigh-in Prompt</span>
                <span className="text-[11px] text-slate-400">Sunday morning fasting weight & tape log</span>
              </div>
              <input
                type="checkbox"
                checked={weighInReminders}
                onChange={(e) => setWeighInReminders(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded"
              />
            </label>
          </div>
        )}

        {/* TAB 4: BACKUP, RESTORE & PDF REPORT */}
        {activeTab === 'backup' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="font-bold text-slate-200 block">Cloud / Local JSON Backup</span>
              <p className="text-slate-400 text-[11px]">
                Pulse75 stores all habits, workout logs, challenge days, and measurements offline in your browser. Export a portable JSON snapshot or restore from a previous file anytime.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup JSON</span>
                </button>

                <label className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore from Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Native Android App Hub */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-300 block flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Native Android App (APK)
                </span>
                <span className="text-[11px] text-slate-400">Direct installation package for your Android phone</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNativeAndroid?.();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-emerald-500 bg-emerald-600/20 text-emerald-300 font-bold text-xs hover:bg-emerald-600/30"
              >
                View APK Setup
              </button>
            </div>

            {/* Print / PDF Summary */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Export Progress Report (PDF)</span>
                <span className="text-[11px] text-slate-400">Generate a printable summary of your 75-Day metrics</span>
              </div>
              <button
                type="button"
                onClick={handlePrintSummary}
                className="px-4 py-2 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 font-bold flex items-center gap-1.5 hover:bg-purple-500/20"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            {/* Danger Zone: Reset Challenge */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-300 block">Reset 75-Day Challenge</span>
                <span className="text-[11px] text-slate-400">Restart from Day 1 with optional run history archive</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResetChallenge();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-rose-500 bg-rose-600/20 text-rose-400 font-bold text-xs hover:bg-rose-600/30"
              >
                Reset Challenge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
