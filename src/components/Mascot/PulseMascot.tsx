import React, { useState } from 'react';
import { playSound } from '../../utils/soundEffects';

export type MascotMood = 'idle' | 'pumped' | 'cheering' | 'focused' | 'proud';

interface PulseMascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  quote?: string;
  showQuote?: boolean;
  className?: string;
}

const MOTIVATION_QUOTES = [
  "75 days to forge an unbreakable standard.",
  "Discipline outlasts fleeting motivation. Lock in.",
  "Hydration calibrated. Energy cell recharged.",
  "Rep by rep. Day by day. No compromises.",
  "Your physical transformation is mathematically inevitable.",
  "One day closer to Day 75 mastery. Keep pushing."
];

export const PulseMascot: React.FC<PulseMascotProps> = ({
  mood = 'idle',
  size = 'md',
  quote,
  showQuote = false,
  className = ''
}) => {
  const [isWinking, setIsWinking] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTap = () => {
    playSound('tap');
    setIsWinking(true);
    setIsExpanded(true);
    setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
    setTimeout(() => setIsWinking(false), 900);
  };

  const dim = size === 'sm' ? 42 : size === 'lg' ? 96 : 64;

  return (
    <div className={`relative flex items-center gap-3 select-none ${className}`}>
      {/* Interactive Mascot Core */}
      <button
        type="button"
        onClick={handleTap}
        aria-label="Pulse75 Cyber Mascot"
        className="relative group focus:outline-none transition-transform active:scale-95 cursor-pointer"
        style={{ width: dim, height: dim }}
      >
        {/* Outer Neon Glow Aura */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-cyber-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(0,240,255,0.4) 0%, rgba(157,0,255,0.3) 50%, rgba(255,0,122,0.2) 100%)'
          }}
        />

        {/* Orbit Ring 1 (Cyan/Purple) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full animate-cyber-orbit pointer-events-none"
        >
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="url(#pulse-cyan-grad)"
            strokeWidth="1.5"
            strokeDasharray="18 10 30 15"
            strokeLinecap="round"
          />
        </svg>

        {/* Orbit Ring 2 (Pink/Purple Reverse) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full animate-cyber-orbit-rev pointer-events-none"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#pulse-pink-grad)"
            strokeWidth="1.2"
            strokeDasharray="10 8 40 12"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* Main Head Unit */}
        <div className="relative w-full h-full rounded-full bg-slate-950/90 border border-cyan-400/40 shadow-inner flex items-center justify-center overflow-hidden">
          {/* Subtle interior tech grid backdrop */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)',
              backgroundSize: '8px 8px'
            }}
          />

          {/* SVG Visor Facial Features */}
          <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 z-10">
            <defs>
              <linearGradient id="pulse-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#9d00ff" />
              </linearGradient>
              <linearGradient id="pulse-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff007a" />
                <stop offset="100%" stopColor="#9d00ff" />
              </linearGradient>
              <linearGradient id="pulse-eye-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#00f0ff" />
              </linearGradient>
            </defs>

            {/* Left Eye */}
            {isWinking ? (
              // Wink line
              <line
                x1="26"
                y1="40"
                x2="42"
                y2="40"
                stroke="#00f0ff"
                strokeWidth="4"
                strokeLinecap="round"
                className="transition-all"
              />
            ) : mood === 'pumped' || mood === 'cheering' ? (
              // Energetic arch
              <path
                d="M 26 44 Q 34 32 42 44"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : (
              // Digital round visor eye with pupil dot
              <g>
                <circle cx="34" cy="40" r="7" fill="url(#pulse-eye-glow)" />
                <circle cx="36" cy="38" r="2.5" fill="#ffffff" />
              </g>
            )}

            {/* Right Eye */}
            {mood === 'pumped' || mood === 'cheering' ? (
              <path
                d="M 58 44 Q 66 32 74 44"
                fill="none"
                stroke="#ff007a"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : (
              <g>
                <circle cx="66" cy="40" r="7" fill="url(#pulse-pink-grad)" />
                <circle cx="68" cy="38" r="2.5" fill="#ffffff" />
              </g>
            )}

            {/* Neon Cheeks (Cyber sensor blushes) */}
            <circle cx="22" cy="50" r="2.5" fill="#00f0ff" opacity="0.6" />
            <circle cx="78" cy="50" r="2.5" fill="#ff007a" opacity="0.6" />

            {/* Glowing Smile / Mouth Line */}
            {mood === 'pumped' ? (
              // Open energetic tech smile
              <path
                d="M 32 58 Q 50 78 68 58"
                fill="rgba(157, 0, 255, 0.4)"
                stroke="#9d00ff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            ) : mood === 'cheering' ? (
              <path
                d="M 30 58 Q 50 82 70 58"
                fill="rgba(0, 240, 255, 0.3)"
                stroke="#00f0ff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            ) : (
              // Smooth confident smirk
              <path
                d="M 34 60 Q 50 72 66 60"
                fill="none"
                stroke="url(#pulse-cyan-grad)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
      </button>

      {/* Motivational Speech Pill / HUD Directive */}
      {(showQuote || isExpanded) && (
        <div
          onClick={() => setIsExpanded(false)}
          className="cursor-pointer max-w-xs px-3.5 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-lg text-left backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-semibold text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>PulseNeon AI</span>
            <span className="text-slate-500">· Tap to cycle</span>
          </div>
          <p className="text-xs font-medium text-slate-200 mt-0.5 leading-snug">
            {quote || MOTIVATION_QUOTES[currentQuoteIndex]}
          </p>
        </div>
      )}
    </div>
  );
};
