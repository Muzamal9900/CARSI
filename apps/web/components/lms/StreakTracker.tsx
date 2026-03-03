'use client';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakTracker({ currentStreak, longestStreak }: StreakTrackerProps) {
  const isHot = currentStreak >= 7;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span
          className={`text-2xl transition-all ${isHot ? 'drop-shadow-[0_0_8px_#f97316]' : 'opacity-40'}`}
          aria-label="streak flame"
        >
          🔥
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-xl leading-none font-bold text-white">
            {currentStreak}
          </span>
          <span className="text-xs text-white/40">day streak</span>
        </div>
      </div>

      {longestStreak > 0 && (
        <div className="flex flex-col border-l border-white/10 pl-4">
          <span className="font-mono text-sm leading-none text-white/60">{longestStreak}</span>
          <span className="text-xs text-white/30">best streak</span>
        </div>
      )}

      {currentStreak >= 7 && (
        <span className="rounded-sm bg-amber-950 px-2 py-0.5 font-mono text-xs text-amber-400">
          7-day bonus active
        </span>
      )}
    </div>
  );
}
