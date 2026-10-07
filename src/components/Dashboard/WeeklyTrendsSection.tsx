import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area
} from 'recharts';
import {
  TrendingDown,
  Dumbbell,
  Scale,
  Calendar,
  CheckCircle2,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import {
  ChallengeState,
  BodyMeasurement,
  UserProfile,
  ThemeConfig
} from '../../types';

interface WeeklyTrendsSectionProps {
  challenge: ChallengeState;
  measurements: BodyMeasurement[];
  profile: UserProfile;
  theme: ThemeConfig;
  onNavigateToBody?: () => void;
  onNavigateToWorkouts?: () => void;
}

export interface WeeklyTrendDataPoint {
  week: number;
  label: string;
  dayRange: string;
  startDay: number;
  endDay: number;
  weightKg: number | null;
  targetWeightKg: number;
  activeWorkoutDays: number;
  totalWorkouts: number;
  consistencyPercent: number | null;
  isCurrentWeek: boolean;
  isPastOrCurrent: boolean;
  status: 'completed' | 'current' | 'upcoming';
}

export const WeeklyTrendsSection: React.FC<WeeklyTrendsSectionProps> = ({
  challenge,
  measurements,
  profile,
  theme,
  onNavigateToBody,
  onNavigateToWorkouts
}) => {
  const isDark = theme.appearance === 'dark';
  const [viewMode, setViewMode] = useState<'combined' | 'weight' | 'workouts'>('combined');

  const currentDayNum = challenge.currentDayNumber || 1;
  const currentWeekNum = Math.min(11, Math.ceil(currentDayNum / 7));

  // Sort measurements chronologically
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [measurements]);

  const baselineWeight = sortedMeasurements[0]?.weightKg || profile.currentWeightKg || 75.0;
  const goalWeight = profile.goalWeightKg || 65.0;

  // Process 75 days into 11 weeks of data
  const weeklyData = useMemo<WeeklyTrendDataPoint[]>(() => {
    const points: WeeklyTrendDataPoint[] = [];
    const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();

    let lastKnownWeight = baselineWeight;

    for (let w = 1; w <= 11; w++) {
      const startDay = (w - 1) * 7 + 1;
      const endDay = Math.min(75, w * 7);
      const totalDaysInWeek = endDay - startDay + 1;

      // Dates for this week
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (startDay - 1));
      const weekEndDate = new Date(startDate);
      weekEndDate.setDate(startDate.getDate() + (endDay - 1));

      const isCurrent = currentDayNum >= startDay && currentDayNum <= endDay;
      const isPastOrCurrent = startDay <= currentDayNum;

      // 1. Calculate weight for this week
      // Match measurements by date range or by day weight
      const matchingMeasurements = sortedMeasurements.filter((m) => {
        const mDate = new Date(m.date);
        return mDate >= weekStartDate && mDate <= weekEndDate;
      });

      let weekWeight: number | null = null;
      if (matchingMeasurements.length > 0) {
        // Average or latest measurement in this week
        const latest = matchingMeasurements[matchingMeasurements.length - 1];
        weekWeight = Number(latest.weightKg.toFixed(1));
        lastKnownWeight = weekWeight;
      } else if (w === 1 && sortedMeasurements.length > 0) {
        weekWeight = Number(baselineWeight.toFixed(1));
        lastKnownWeight = weekWeight;
      } else if (isPastOrCurrent) {
        // Carry forward previous known weight for consistency
        weekWeight = Number(lastKnownWeight.toFixed(1));
      }

      // Linear guideline target from baseline to goal over 11 weeks
      const targetWeightKg = Number(
        (baselineWeight - ((baselineWeight - goalWeight) * (w / 11))).toFixed(1)
      );

      // 2. Calculate workout consistency for this week
      let activeWorkoutDays = 0;
      let totalWorkouts = 0;

      for (let day = startDay; day <= endDay; day++) {
        const dayRecord = challenge.days[day];
        if (dayRecord) {
          const workoutsCompletedCount = dayRecord.workoutsCompleted?.length || 0;
          totalWorkouts += workoutsCompletedCount;

          if (workoutsCompletedCount > 0 || dayRecord.status === 'completed') {
            activeWorkoutDays++;
          }
        }
      }

      let consistencyPercent: number | null = null;
      if (isPastOrCurrent) {
        if (isCurrent) {
          const daysElapsedThisWeek = Math.max(1, currentDayNum - startDay + 1);
          consistencyPercent = Math.min(
            100,
            Math.round((activeWorkoutDays / daysElapsedThisWeek) * 100)
          );
        } else {
          consistencyPercent = Math.min(
            100,
            Math.round((activeWorkoutDays / totalDaysInWeek) * 100)
          );
        }
      }

      const status = isCurrent ? 'current' : isPastOrCurrent ? 'completed' : 'upcoming';

      points.push({
        week: w,
        label: `Wk ${w}`,
        dayRange: `Days ${startDay}–${endDay}`,
        startDay,
        endDay,
        weightKg: weekWeight,
        targetWeightKg,
        activeWorkoutDays,
        totalWorkouts,
        consistencyPercent,
        isCurrentWeek: isCurrent,
        isPastOrCurrent,
        status
      });
    }

    return points;
  }, [challenge, sortedMeasurements, baselineWeight, goalWeight, currentDayNum]);

  // Overall KPI statistics
  const currentWeekData = weeklyData.find((w) => w.isCurrentWeek) || weeklyData[0];
  const completedWeeks = weeklyData.filter((w) => w.status === 'completed');
  
  const averageConsistency = useMemo(() => {
    const valid = weeklyData.filter((w) => w.consistencyPercent !== null);
    if (!valid.length) return 0;
    const sum = valid.reduce((acc, curr) => acc + (curr.consistencyPercent || 0), 0);
    return Math.round(sum / valid.length);
  }, [weeklyData]);

  const latestLoggedWeight = useMemo(() => {
    const logged = weeklyData.filter((w) => w.weightKg !== null);
    return logged.length > 0 ? logged[logged.length - 1].weightKg : baselineWeight;
  }, [weeklyData, baselineWeight]);

  const totalWeightDelta = Number(
    ((latestLoggedWeight || baselineWeight) - baselineWeight).toFixed(1)
  );

  // Min and max for weight axis scale
  const weightValues = weeklyData
    .map((d) => d.weightKg)
    .filter((v): v is number => v !== null);
  const minWeight = Math.floor(Math.min(...weightValues, goalWeight) - 1);
  const maxWeight = Math.ceil(Math.max(...weightValues, baselineWeight) + 1);

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isDark
          ? 'bg-slate-900/40 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* 1. Header & View Filter Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base tracking-tight text-white">
              75-Day Weekly Trends & Adherence
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weekly weight trajectory & workout consistency mapped across 11 challenge weeks
          </p>
        </div>

        {/* View mode toggle pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Combined
          </button>
          <button
            type="button"
            onClick={() => setViewMode('weight')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'weight'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3 h-3" />
            Weight
          </button>
          <button
            type="button"
            onClick={() => setViewMode('workouts')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'workouts'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3 h-3" />
            Consistency
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            Challenge Phase
          </span>
          <div className="mt-1">
            <strong className="text-base font-extrabold font-mono text-cyan-300">
              Week {currentWeekNum} of 11
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">
              Day {currentDayNum}/75 ({Math.round((currentDayNum / 75) * 100)}%)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Scale className="w-3 h-3 text-cyan-400" />
            Net Weight Change
          </span>
          <div className="mt-1">
            <strong className={`text-base font-extrabold font-mono flex items-center gap-0.5 ${
              totalWeightDelta <= 0 ? 'text-emerald-400' : 'text-pink-400'
            }`}>
              {totalWeightDelta <= 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              {Math.abs(totalWeightDelta)} kg
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">
              Start: {baselineWeight}kg · Now: {latestLoggedWeight}kg
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Dumbbell className="w-3 h-3 text-purple-400" />
            Avg Adherence
          </span>
          <div className="mt-1">
            <strong className="text-base font-extrabold font-mono text-purple-300">
              {averageConsistency}%
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">
              {completedWeeks.length} full weeks tracked
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-pink-400" />
            Goal Benchmark
          </span>
          <div className="mt-1">
            <strong className="text-base font-extrabold font-mono text-pink-300">
              {goalWeight} kg
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">
              {(latestLoggedWeight || baselineWeight) - goalWeight > 0
                ? `${Number(((latestLoggedWeight || baselineWeight) - goalWeight).toFixed(1))}kg to goal`
                : 'Goal reached!'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualization Area */}
      <div className="w-full h-72 sm:h-80 relative pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={weeklyData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#00c3ff" />
              </linearGradient>
              <linearGradient id="workoutBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9d00ff" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#9d00ff" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            {/* Left Y-Axis: Weight in kg */}
            {(viewMode === 'combined' || viewMode === 'weight') && (
              <YAxis
                yAxisId="weight"
                domain={[minWeight, maxWeight]}
                stroke="#00f0ff"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}kg`}
                orientation="left"
              />
            )}

            {/* Right Y-Axis: Workout Consistency % */}
            {(viewMode === 'combined' || viewMode === 'workouts') && (
              <YAxis
                yAxisId="consistency"
                domain={[0, 100]}
                stroke="#a855f7"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
                orientation={viewMode === 'workouts' ? 'left' : 'right'}
              />
            )}

            {/* Goal Weight Reference Line */}
            {(viewMode === 'combined' || viewMode === 'weight') && (
              <ReferenceLine
                yAxisId="weight"
                y={goalWeight}
                stroke="#ff007a"
                strokeDasharray="4 4"
                label={{
                  value: `Goal ${goalWeight}kg`,
                  fill: '#ff007a',
                  fontSize: 10,
                  position: 'insideBottomRight'
                }}
              />
            )}

            {/* 100% Consistency Benchmark */}
            {viewMode === 'workouts' && (
              <ReferenceLine
                yAxisId="consistency"
                y={100}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: '100% Target',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as WeeklyTrendDataPoint;

                return (
                  <div className="p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-xs min-w-48 z-50">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                      <div>
                        <span className="font-extrabold text-sm text-white">
                          Week {data.week}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {data.dayRange}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          data.isCurrentWeek
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                            : data.isPastOrCurrent
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Weight row */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          Weight:
                        </span>
                        <span className="font-mono font-bold text-cyan-300">
                          {data.weightKg !== null ? `${data.weightKg} kg` : 'Pending log'}
                        </span>
                      </div>

                      {/* Target line */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <span className="w-2 h-0.5 bg-pink-500" />
                          Target Pace:
                        </span>
                        <span className="font-mono text-pink-400">
                          {data.targetWeightKg} kg
                        </span>
                      </div>

                      {/* Workout Consistency row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          Workout Consistency:
                        </span>
                        <span className="font-mono font-bold text-purple-300">
                          {data.consistencyPercent !== null ? `${data.consistencyPercent}%` : 'Upcoming'}
                        </span>
                      </div>

                      {/* Active Days */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Active Workout Days:</span>
                        <span className="font-mono text-slate-200">
                          {data.activeWorkoutDays} / {data.endDay - data.startDay + 1} days
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Consistency Bars */}
            {(viewMode === 'combined' || viewMode === 'workouts') && (
              <Bar
                yAxisId="consistency"
                dataKey="consistencyPercent"
                name="Consistency (%)"
                fill="url(#workoutBarGrad)"
                radius={[4, 4, 0, 0]}
                barSize={viewMode === 'workouts' ? 24 : 14}
              />
            )}

            {/* Weight Area / Line */}
            {(viewMode === 'combined' || viewMode === 'weight') && (
              <>
                {viewMode === 'weight' && (
                  <Area
                    yAxisId="weight"
                    type="monotone"
                    dataKey="weightKg"
                    stroke="none"
                    fill="url(#weightAreaGrad)"
                  />
                )}
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  name="Weight (kg)"
                  stroke="url(#weightLineGrad)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#00f0ff', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#00f0ff', stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls
                />
              </>
            )}

            {/* Ideal target trajectory line */}
            {viewMode === 'weight' && (
              <Line
                yAxisId="weight"
                type="linear"
                dataKey="targetWeightKg"
                name="Projected Target"
                stroke="#ff007a"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Chart Legend & Quick Context Info */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          {(viewMode === 'combined' || viewMode === 'weight') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-cyan-400" />
              <span>Weight Measurement (kg)</span>
            </div>
          )}

          {(viewMode === 'combined' || viewMode === 'workouts') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-500/80" />
              <span>Workout Consistency (%)</span>
            </div>
          )}

          {(viewMode === 'combined' || viewMode === 'weight') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-pink-500 border-dashed" />
              <span>Goal Target ({goalWeight}kg)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToBody && (
            <button
              type="button"
              onClick={onNavigateToBody}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
            >
              + Log Weigh-in
            </button>
          )}
          {onNavigateToWorkouts && (
            <>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={onNavigateToWorkouts}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
              >
                View Workouts
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
