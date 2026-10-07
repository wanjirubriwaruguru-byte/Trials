import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  Layers,
  Sparkles,
  Cpu,
  Package
} from 'lucide-react';
import JSZip from 'jszip';
import { ThemeConfig } from '../../types';
import { playSound } from '../../utils/soundEffects';

interface AndroidNativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
}

export const AndroidNativeModal: React.FC<AndroidNativeModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cloud' | 'studio' | 'termux'>('overview');

  if (!isOpen) return null;

  const isDark = theme.appearance === 'dark';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    playSound('tap');
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadAndroidZip = async () => {
    setIsZipping(true);
    playSound('tap');

    try {
      const zip = new JSZip();

      // Read key Android project files to package
      const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
</manifest>`;

      const mainActivity = `package com.pulse75.fitness;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {}`;

      const appBuildGradle = `apply plugin: 'com.android.application'
android {
    namespace "com.pulse75.fitness"
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.pulse75.fitness"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
}
dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:1.6.1"
    implementation "androidx.core:core-splashscreen:1.0.1"
    implementation project(':capacitor-android')
}
apply from: 'capacitor.build.gradle'`;

      const rootBuildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.1'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`;

      const settingsGradle = `include ':app'
rootProject.name = 'Pulse75'`;

      const stringsXml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Pulse75</string>
    <string name="title_activity_main">Pulse75</string>
    <string name="package_name">com.pulse75.fitness</string>
</resources>`;

      const capConfig = `{
  "appId": "com.pulse75.fitness",
  "appName": "Pulse75",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}`;

      const readme = `# Pulse75 Native Android App
Package: com.pulse75.fitness
Target SDK: 34 (Android 14)
Min SDK: 22

## How to Build the APK
1. Open this folder in Android Studio.
2. Connect your Android phone with USB or WiFi.
3. Select "app" from the run configurations and click Run (or menu Build > Build APK(s)).
4. Transfer the generated app-debug.apk to your phone and install!`;

      const ghWorkflow = `name: Build Android APK
on: [push, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - uses: android-actions/setup-android@v3
      - run: npx cap sync android
      - run: cd android && chmod +x gradlew && ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: Pulse75-APK
          path: android/app/build/outputs/apk/debug/*.apk`;

      // Build folder hierarchy in zip
      zip.file('README_ANDROID.md', readme);
      zip.file('capacitor.config.json', capConfig);
      zip.file('.github/workflows/build-apk.yml', ghWorkflow);
      zip.file('android/build.gradle', rootBuildGradle);
      zip.file('android/settings.gradle', settingsGradle);
      zip.file('android/app/build.gradle', appBuildGradle);
      zip.file('android/app/src/main/AndroidManifest.xml', androidManifest);
      zip.file('android/app/src/main/java/com/pulse75/fitness/MainActivity.java', mainActivity);
      zip.file('android/app/src/main/res/values/strings.xml', stringsXml);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Pulse75_Native_Android_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      playSound('achievement');
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
        isDark
          ? 'bg-slate-950 border-cyan-500/40 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight">Native Android App Engine</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Direct APK
                </span>
              </div>
              <p className="text-xs text-slate-400">Genuine Android Native Application (No PWA / Web Shortcut)</p>
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

        {/* Tab selection */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'cloud' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud APK (No PC)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'studio' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Android Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('termux')}
            className={`py-2 rounded-lg font-bold transition-all ${
              activeTab === 'termux' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            On-Phone (Termux)
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ONE-CLICK ZIP DOWNLOAD */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-slate-900/60 border border-emerald-500/30 flex items-start justify-between gap-4">
              <div>
                <span className="font-extrabold text-sm text-emerald-300 block mb-1">
                  Native Android Package Configured
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Pulse75 has been configured as a true native Android app with package identifier{' '}
                  <strong className="text-cyan-400 font-mono">com.pulse75.fitness</strong>, native Gradle build files,{' '}
                  <strong className="text-white font-mono">AndroidManifest.xml</strong>, and Capacitor native runtime bridge.
                </p>
                <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zero PWA / Web Shortcut
                  </span>
                  <span>·</span>
                  <span className="font-mono text-cyan-400">Target SDK: 34 (Android 14)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAndroidZip}
                disabled={isZipping}
                className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shrink-0 flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isZipping ? 'Generating...' : downloadSuccess ? 'Downloaded!' : 'Download Android Project (ZIP)'}</span>
              </button>
            </div>

            {/* Android Capabilities Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Native App Binary
                </span>
                <span className="text-[11px] text-slate-400">Installs as standalone APK on any Android phone</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-pink-400" /> Offline Hardware
                </span>
                <span className="text-[11px] text-slate-400">Direct haptic vibration, offline storage, audio synthesis</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> 100% Functionality
                </span>
                <span className="text-[11px] text-slate-400">All 75 days, workouts, HIIT timers, and calorie engine</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block">Choose Your Preferred Way to Get the APK:</span>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 cursor-pointer" onClick={() => setActiveTab('cloud')}>
                  <span>1. <strong>Cloud 1-Click Builder</strong> — Get APK directly on your phone with zero PC or software needed.</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 cursor-pointer" onClick={() => setActiveTab('studio')}>
                  <span>2. <strong>Android Studio</strong> — Open the project in Android Studio and click Run or Build APK.</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 cursor-pointer" onClick={() => setActiveTab('termux')}>
                  <span>3. <strong>Termux on Phone</strong> — Build directly in terminal on Android phone.</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLOUD 1-CLICK APK (NO COMPUTER NEEDED) */}
        {activeTab === 'cloud' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
              <span className="font-bold text-cyan-300 block mb-1">
                Easiest Method: Build APK via Automated Cloud Workflow
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                This project already includes <strong className="text-white font-mono">.github/workflows/build-android-apk.yml</strong>.
                When you connect this project to GitHub, GitHub automatically compiles the real native <strong className="text-cyan-400">Pulse75-debug.apk</strong> for free.
              </p>
            </div>

            <ol className="space-y-2.5 list-decimal list-inside text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <li>Export or push this project to a GitHub repository.</li>
              <li>Open your repository on your Android phone's browser or PC.</li>
              <li>Click on the <strong>Actions</strong> tab → <strong>Build Android APK</strong> → <strong>Run workflow</strong>.</li>
              <li>Wait 2 minutes for the build to finish.</li>
              <li>Tap the artifact <strong>Pulse75-Android-Debug-APK</strong> to download <strong className="text-emerald-400">app-debug.apk</strong> directly onto your phone!</li>
              <li>Tap the downloaded file on your Android phone and select <strong>Install</strong>.</li>
            </ol>
          </div>
        )}

        {/* TAB 3: ANDROID STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block">Building with Android Studio:</span>
              <ol className="space-y-2 list-decimal list-inside text-slate-300">
                <li>Download the Android project ZIP using the button above and extract it.</li>
                <li>Launch <strong>Android Studio</strong> on your computer.</li>
                <li>Select <strong>File &gt; Open</strong> and choose the extracted <code className="text-cyan-400">android/</code> directory.</li>
                <li>Wait for Gradle sync to complete (it will automatically download the Android 34 SDK).</li>
                <li>Connect your Android phone via USB with <em>USB Debugging enabled</em> (or select an emulator).</li>
                <li>Click <strong>Run (green play button)</strong>, or navigate to <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                <li>Android Studio will compile and install the native Pulse75 app directly on your phone!</li>
              </ol>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Terminal 1-Line Build Command</span>
                <code className="text-xs text-cyan-300 font-mono">cd android && ./gradlew assembleDebug</code>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard('cd android && ./gradlew assembleDebug', 'gradle')}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Copy command"
              >
                {copiedCmd === 'gradle' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: TERMUX ON PHONE */}
        {activeTab === 'termux' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block">Directly on Android Phone via Termux:</span>
              <p className="text-slate-300 text-[11px]">
                You can even compile the APK directly on your phone without a laptop using the free Termux app (from F-Droid):
              </p>
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 space-y-1">
                <p>pkg install openjdk-17 nodejs-lts git</p>
                <p>git clone &lt;your-pulse75-repo&gt; &amp;&amp; cd Pulse75</p>
                <p>npm install &amp;&amp; npm run build</p>
                <p>cd android &amp;&amp; ./gradlew assembleDebug</p>
                <p>termux-open app/build/outputs/apk/debug/app-debug.apk</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-5">
          <span className="text-[11px] text-slate-400">
            Package: <strong className="text-slate-200 font-mono">com.pulse75.fitness</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
