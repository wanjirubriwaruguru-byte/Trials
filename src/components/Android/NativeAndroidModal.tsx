import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ThemeConfig } from '../../types';
import { playSound } from '../../utils/soundEffects';

interface NativeAndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
}

export const NativeAndroidModal: React.FC<NativeAndroidModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const isDark = theme.appearance === 'dark';

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    playSound('tap');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadArchive = () => {
    playSound('start');
    const a = document.createElement('a');
    a.href = '/api/download-android-project';
    a.download = 'Pulse75-Android-Native.tar.gz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
        isDark ? 'bg-slate-950 border-cyan-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight">Native Android App (APK)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REAL ANDROID APK
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct installation package for your Android phone</p>
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

        {/* Verification Callout */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 mb-4 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-300 block mb-0.5">Native Android Architecture Configured:</span>
            Pulse75 is now built as a native Android project (`com.pulse75.app`) with Gradle, native hardware haptics, AndroidManifest permissions, and full offline persistence. It installs as a real Android application (`.apk`), not a web shortcut or PWA.
          </div>
        </div>

        {/* Project Technical Specifications */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block font-sans">PACKAGE ID</span>
            <strong className="text-cyan-400 text-[11px] truncate block">com.pulse75.app</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block font-sans">VERSION</span>
            <strong className="text-white text-[11px]">1.0.0 (Code 1)</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block font-sans">ANDROID SDK</span>
            <strong className="text-purple-400 text-[11px]">Target SDK 34</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block font-sans">NATIVE ENGINE</span>
            <strong className="text-pink-400 text-[11px]">Capacitor 8</strong>
          </div>
        </div>

        {/* 3 Step-by-Step Installation Paths */}
        <div className="space-y-3.5 text-xs">
          {/* Method 1: GitHub 1-Click Cloud APK Build */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                Option 1: 1-Click Cloud Build (GitHub Actions)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Recommended
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              We generated <code className="text-cyan-300">.github/workflows/build-android-apk.yml</code>. Whenever this repo is on GitHub, the workflow automatically compiles the installable Android APK and uploads it to GitHub Actions.
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 flex items-center justify-between">
              <span>Go to GitHub Repo → "Actions" → Download "Pulse75-Android-Installable-APK"</span>
            </div>
          </div>

          {/* Method 2: Android Studio 1-Click Run on Device */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
                Option 2: Android Studio (Direct USB / Wi-Fi Install)
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Open the generated <code className="text-purple-300">android/</code> directory in Android Studio:
            </p>
            <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px] pl-1">
              <li>Open Android Studio → Choose <strong>Open</strong> → Select the <code className="text-cyan-300">android</code> folder.</li>
              <li>Connect your Android phone with USB (or Wi-Fi debugging).</li>
              <li>Click the green <strong>Run (Play)</strong> button or <strong>Build → Build APK(s)</strong>.</li>
              <li>The APK installs immediately onto your phone home screen!</li>
            </ol>
          </div>

          {/* Method 3: Command Line / Gradle Wrapper */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
                Option 3: Terminal / Gradle Command
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 flex items-center justify-between">
              <code>cd android && ./gradlew assembleDebug</code>
              <button
                type="button"
                onClick={() => handleCopy('cd android && ./gradlew assembleDebug', 3)}
                className="text-slate-500 hover:text-cyan-400"
              >
                {copiedIndex === 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              The compiled APK will be located at: <code className="text-slate-400">android/app/build/outputs/apk/debug/app-debug.apk</code>
            </p>
          </div>
        </div>

        {/* Download Android Native Project Bundle Button */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadArchive}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Native Android Project (.tar.gz)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
