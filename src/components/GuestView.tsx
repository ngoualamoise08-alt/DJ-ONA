import React, { useState } from 'react';
import { Track, RoomState, SfxType } from '../types';
import { TrackCard } from './TrackCard';
import { realtimeManager } from '../lib/supabase';
import { audioEngine } from '../lib/audioEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Radio, Volume2, Sparkles, Disc } from 'lucide-react';

interface GuestViewProps {
  roomState: RoomState;
  onVote: (trackId: string) => void;
  myVotedTrackId?: string;
}

interface FloatingTap {
  id: number;
  x: number;
  y: number;
}

export const GuestView: React.FC<GuestViewProps> = ({
  roomState,
  onVote,
  myVotedTrackId,
}) => {
  const [personalTaps, setPersonalTaps] = useState<number>(0);
  const [floatingTaps, setFloatingTaps] = useState<FloatingTap[]>([]);
  const [activeSfx, setActiveSfx] = useState<SfxType | null>(null);

  const { currentTrack, trackDuel, hypeLevel } = roomState;
  const totalVotes = trackDuel.reduce((sum, t) => sum + t.votes, 0);

  // Handle Hype Tap
  const handleHypeTap = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // 1. Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }

    // 2. Increment personal tap
    setPersonalTaps((prev) => prev + 1);

    // 3. Floating particle effect
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = ('clientX' in e ? e.clientX : e.touches[0]?.clientX || rect.left + rect.width / 2) - rect.left;
    const clickY = ('clientY' in e ? e.clientY : e.touches[0]?.clientY || rect.top + rect.height / 2) - rect.top;

    const newTap: FloatingTap = {
      id: Date.now() + Math.random(),
      x: clickX,
      y: clickY,
    };
    setFloatingTaps((prev) => [...prev.slice(-8), newTap]);

    // 4. Send Realtime broadcast
    realtimeManager.sendHypeTap({
      count: 1,
      multiplier: 1,
      senderName: 'Guest',
      timestamp: Date.now(),
    });
  };

  // Handle Soundboard trigger
  const triggerSfx = (type: SfxType) => {
    setActiveSfx(type);
    setTimeout(() => setActiveSfx(null), 400);

    // Haptic
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 40, 25]);
      } catch {
        // ignore
      }
    }

    // Play local audio synthesis
    if (type === 'airhorn') audioEngine.playAirhorn();
    if (type === 'scratch') audioEngine.playScratch();
    if (type === 'rewind') audioEngine.playRewind();

    // Broadcast to room
    realtimeManager.sendSfx({
      type,
      senderName: 'Guest',
      timestamp: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans pb-24 selection:bg-rose-500 selection:text-white">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-sm font-bold tracking-tight text-white">PulseDJ</span>
          <span className="text-xs font-mono text-violet-400 px-1.5 py-0.5 rounded bg-violet-950/60 border border-violet-800/40">
            {roomState.roomCode}
          </span>
        </div>

        {/* Live hype pill indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
          <Flame className={`w-3.5 h-3.5 ${hypeLevel > 70 ? 'text-rose-400 animate-bounce' : 'text-purple-400'}`} />
          <span className="font-mono font-bold tabular-nums text-zinc-200">
            {Math.round(hypeLevel)}% HYPE
          </span>
        </div>
      </header>

      {/* Main Content Area (Mobile Container) */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 flex flex-col gap-5">
        {/* Current track banner */}
        <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentTrack.coverGradient.from}, ${currentTrack.coverGradient.to})`,
            }}
          >
            <Disc className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">
              NOW PLAYING ON STAGE
            </span>
            <h3 className="text-sm font-bold text-white truncate">{currentTrack.title}</h3>
            <p className="text-xs text-zinc-400 truncate">
              {currentTrack.artist} · <span className="font-mono text-cyan-400">{currentTrack.camelotKey}</span>
            </p>
          </div>
        </section>

        {/* SECTION 1: THE ENORMOUS "TAP FOR HYPE 🔥" BUTTON */}
        <section className="flex flex-col items-center justify-center py-4 relative">
          {/* Subtle pulsating backdrop aura */}
          <div
            className="absolute w-56 h-56 rounded-full pointer-events-none transition-all duration-300 blur-2xl"
            style={{
              background:
                hypeLevel > 80
                  ? 'radial-gradient(circle, rgba(244,63,94,0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={handleHypeTap}
              onTouchStart={handleHypeTap}
              className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-violet-600 via-pink-600 to-rose-500 p-1.5 shadow-2xl shadow-rose-950/60 flex items-center justify-center cursor-pointer select-none touch-manipulation focus:outline-none"
              style={{
                boxShadow:
                  hypeLevel > 75
                    ? '0 0 45px rgba(244, 63, 94, 0.7)'
                    : '0 0 35px rgba(168, 85, 247, 0.5)',
              }}
            >
              {/* Inner button surface */}
              <div className="w-full h-full rounded-full bg-zinc-950/95 border-2 border-white/20 flex flex-col items-center justify-center text-center p-3 relative overflow-hidden">
                {/* Background glow sheen */}
                <div className="absolute inset-0 bg-gradient-to-t from-rose-500/20 via-transparent to-white/10" />

                <Flame className="w-12 h-12 text-rose-500 mb-1 drop-shadow" />
                <span className="text-base font-extrabold tracking-wide text-white drop-shadow">
                  TAP FOR HYPE
                </span>
                <span className="text-[11px] font-bold text-rose-400 mt-0.5 tracking-wider">
                  🔥 FUEL THE DJ 🔥
                </span>
              </div>
            </motion.button>

            {/* Floating tap particle animations */}
            <AnimatePresence>
              {floatingTaps.map((tap) => (
                <motion.div
                  key={tap.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -70, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  onAnimationComplete={() => {
                    setFloatingTaps((prev) => prev.filter((t) => t.id !== tap.id));
                  }}
                  className="absolute pointer-events-none font-extrabold text-sm text-yellow-300 drop-shadow-md flex items-center gap-0.5"
                  style={{ left: tap.x, top: tap.y }}
                >
                  <span>+1</span>
                  <span>🔥</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Personal tap count */}
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              You tapped <strong className="text-white font-mono">{personalTaps}</strong> times!
            </span>
          </div>
        </section>

        {/* SECTION 2: NEXT TRACK DUEL (3 Track Cards with Optimistic Voting) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>NEXT TRACK DUEL</span>
                <span className="text-xs font-normal text-zinc-400">· Tap to vote</span>
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400 tabular-nums">
              {totalVotes} total votes
            </span>
          </div>

          <div className="space-y-2.5">
            {trackDuel.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                totalVotes={totalVotes}
                isHost={false}
                isVotedByMe={myVotedTrackId === track.id}
                onVote={onVote}
              />
            ))}
          </div>
        </section>

        {/* SECTION 3: MINI SOUNDBOARD (Airhorn, Scratch, Rewind) */}
        <section className="mt-2 pt-4 border-t border-zinc-900">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              CROWD SOUNDBOARD SFX
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Klaxon / Airhorn */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => triggerSfx('airhorn')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all text-center select-none ${
                activeSfx === 'airhorn'
                  ? 'bg-rose-500/30 border-rose-400 shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                  : 'bg-zinc-950 border-zinc-800 hover:border-rose-500/50'
              }`}
            >
              <span className="text-2xl" role="img" aria-label="Airhorn">
                📢
              </span>
              <span className="text-xs font-bold text-zinc-100">KLAXON</span>
              <span className="text-[10px] text-zinc-400">Airhorn</span>
            </motion.button>

            {/* Turntable Scratch */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => triggerSfx('scratch')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all text-center select-none ${
                activeSfx === 'scratch'
                  ? 'bg-cyan-500/30 border-cyan-400 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400'
                  : 'bg-zinc-950 border-zinc-800 hover:border-cyan-500/50'
              }`}
            >
              <span className="text-2xl" role="img" aria-label="Scratch">
                🎚️
              </span>
              <span className="text-xs font-bold text-zinc-100">SCRATCH</span>
              <span className="text-[10px] text-zinc-400">Turntable</span>
            </motion.button>

            {/* Tape Rewind */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => triggerSfx('rewind')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all text-center select-none ${
                activeSfx === 'rewind'
                  ? 'bg-violet-500/30 border-violet-400 shadow-lg shadow-violet-500/30 ring-2 ring-violet-400'
                  : 'bg-zinc-950 border-zinc-800 hover:border-violet-500/50'
              }`}
            >
              <span className="text-2xl" role="img" aria-label="Rewind">
                ⏪
              </span>
              <span className="text-xs font-bold text-zinc-100">REWIND</span>
              <span className="text-[10px] text-zinc-400">Backspin</span>
            </motion.button>
          </div>
        </section>
      </main>
    </div>
  );
};
