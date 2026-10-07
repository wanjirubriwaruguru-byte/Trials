import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Dumbbell,
  CheckSquare,
  Activity,
  Flame
} from 'lucide-react';
import { ThemeConfig } from '../../types';

export type NavTab = 'dashboard' | 'challenge' | 'workouts' | 'habits' | 'body' | 'nutrition';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  theme: ThemeConfig;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  theme
}) => {
  const isDark = theme.appearance === 'dark';

  const tabs: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
    { id: 'challenge', label: '75-Day', icon: CalendarCheck },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'body', label: 'Body', icon: Activity },
    { id: 'nutrition', label: 'Calories', icon: Flame }
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors ${
      isDark
        ? 'bg-slate-950/90 border-slate-800/80 text-slate-400'
        : 'bg-white/90 border-slate-200/90 text-slate-600 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
    }`}>
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          let activeClass = '';
          if (isActive) {
            if (theme.style === 'tech') {
              activeClass = 'text-cyan-400 font-bold';
            } else if (theme.style === 'feminine') {
              activeClass = 'text-pink-500 font-bold';
            } else {
              activeClass = 'text-white font-bold';
            }
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 cursor-pointer relative ${
                isActive ? activeClass : 'hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      theme.style === 'tech'
                        ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                        : theme.style === 'feminine'
                        ? 'bg-pink-400 shadow-[0_0_8px_#ff007a]'
                        : 'bg-white'
                    }`}
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
