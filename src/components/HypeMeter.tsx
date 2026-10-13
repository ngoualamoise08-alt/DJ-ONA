import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Zap, Sparkles } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';

interface HypeMeterProps {
  hypeLevel: number; // 0 to 100
  totalTaps: number;
  tapsPerSecond: number;
  isOverload: boolean;
  onResetOverload?: () => void;
}

export const HypeMeter: React.FC<HypeMeterProps> = ({
  hypeLevel,
  totalTaps,
  tapsPerSecond,
  isOverload,
}) => {
  const previousHypeRef = useRef(hypeLevel);

  useEffect(() => {
    // Check if climax reached
    if (hypeLevel >= 100 && previousHypeRef.current < 100) {
      audioEngine.playHypeClimax();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#ffffff'],
        });
      } catch {
        // ignore
      }
    }
    previousHypeRef.current = hypeLevel;
  }, [hypeLevel]);

  // Color gradient stages
  let stageLabel = 'Warmup';
  let gaugeGradient = 'from-cyan-500 to-blue-600';
  let glowColor = 'rgba(6, 182, 212, 0.4)';

  if (hypeLevel >= 85) {
    stageLabel = 'OVERLOAD 🔥';
    gaugeGradient = 'from-amber-400 via-rose-500 to-purple-600';
    glowColor = 'rgba(244, 63, 94, 0.8)';
  } else if (hypeLevel >= 60) {
    stageLabel = 'On Fire';
    gaugeGradient = 'from-pink-500 via-rose-500 to-purple-600';
    glowColor = 'rgba(236, 72, 153, 0.6)';
  } else if (hypeLevel >= 30) {
    stageLabel = 'Vibing';
    gaugeGradient = 'from-purple-500 via-violet-600 to-indigo-600';
    glowColor = 'rgba(168, 85, 247, 0.5)';
  }

  return (
    <div className="flex flex-col items-center bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 w-full h-full relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${glowColor} 0%, transparent 70%)`,
          opacity: Math.max(0.2, hypeLevel / 100),
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3 z-10">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Flame className={`w-4 h-4 ${hypeLevel > 70 ? 'text-rose-400 animate-bounce' : 'text-purple-400'}`} />
          <span>HYPE METER</span>
        </div>
        <span
          className={`text-xs font-bold font-mono tracking-wider px-2 py-0.5 rounded ${
            hypeLevel >= 85
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          {stageLabel}
        </span>
      </div>

      {/* Main Gauge Body (Vertical) */}
      <div className="flex-1 w-full flex items-center justify-center gap-4 py-2 z-10">
        {/* Scale Numbers */}
        <div className="flex flex-col justify-between h-56 text-[10px] font-mono text-zinc-500 select-none">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* The Vertical Tube Bar */}
        <div className="relative w-12 h-56 bg-zinc-900 border border-zinc-700/60 rounded-full p-1.5 flex flex-col justify-end overflow-hidden shadow-inner">
          {/* Subtle hash tick marks */}
          <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between pointer-events-none py-2 px-1 opacity-25">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-full h-0.5 bg-zinc-400" />
            ))}
          </div>

          {/* Liquid Fill Level */}
          <div
            className={`w-full rounded-full bg-gradient-to-t ${gaugeGradient} transition-all duration-300 relative`}
            style={{
              height: `${Math.max(4, Math.min(100, hypeLevel))}%`,
              boxShadow: `0 0 20px ${glowColor}`,
            }}
          >
            {/* Top liquid surface glow cap */}
            <div className="absolute -top-1 left-0 right-0 h-2 rounded-full bg-white/70 blur-[1px]" />

            {/* Bubble particle sparks for high hype */}
            {hypeLevel > 40 && (
              <div className="absolute inset-0 overflow-hidden rounded-full opacity-60">
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute bottom-2 left-2 animate-ping" />
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute bottom-8 right-2 animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* Real-time Taps & Rate Column */}
        <div className="flex flex-col justify-center gap-3">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-center min-w-[76px]">
            <span className="block text-[10px] text-zinc-400 font-medium">HYPE</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {Math.round(hypeLevel)}%
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-center min-w-[76px]">
            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>TPS</span>
            </div>
            <span className="text-sm font-semibold font-mono text-cyan-300 tabular-nums">
              {tapsPerSecond.toFixed(1)}/s
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-center min-w-[76px]">
            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>TAPS</span>
            </div>
            <span className="text-sm font-semibold font-mono text-purple-300 tabular-nums">
              {totalTaps}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full text-center text-[11px] text-zinc-500 z-10 pt-2 border-t border-zinc-900">
        {hypeLevel >= 85 ? (
          <span className="text-rose-400 font-semibold animate-pulse">
            DANCEFLOOR OVERLOAD TRIGGERED!
          </span>
        ) : (
          <span>Tap to fuel the crowd energy gauge</span>
        )}
      </div>
    </div>
  );
};
