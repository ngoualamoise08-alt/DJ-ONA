import React, { useState, useEffect } from 'react';
import { Track, RoomState, SfxEvent } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { HypeMeter } from './HypeMeter';
import { QRCodeDisplay } from './QRCodeDisplay';
import { TrackCard } from './TrackCard';
import { audioEngine } from '../lib/audioEngine';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Disc,
  Radio,
  Sparkles,
  Users,
  Flame,
  RotateCw,
  Bell,
} from 'lucide-react';

interface HostViewProps {
  roomState: RoomState;
  onSelectNextTrack: (track: Track) => void;
  onRotateDuel: () => void;
  onOpenGuestPreview: () => void;
}

export const HostView: React.FC<HostViewProps> = ({
  roomState,
  onSelectNextTrack,
  onRotateDuel,
  onOpenGuestPreview,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sfxBanner, setSfxBanner] = useState<string | null>(null);

  const { currentTrack, trackDuel, hypeLevel, totalTaps, tapsPerSecond, activeGuests, isOverload } =
    roomState;

  // Compute total votes
  const totalVotes = trackDuel.reduce((sum, t) => sum + t.votes, 0);

  // Find leading track
  const leadingTrack = [...trackDuel].sort((a, b) => b.votes - a.votes)[0];

  const togglePlay = () => {
    const nextState = audioEngine.toggleBeat();
    setIsPlaying(nextState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (!isMuted) {
      audioEngine.setVolume(val);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  // Listen to recent SFX alerts
  useEffect(() => {
    if (roomState.lastSfx) {
      const labels: Record<string, string> = {
        airhorn: '📢 AIRHORN BLAST',
        scratch: '🎚️ TURNTABLE SCRATCH',
        rewind: '⏪ TAPE REWIND',
      };
      setSfxBanner(`${labels[roomState.lastSfx.type] || 'DJ SFX'} received from crowd!`);
      const t = setTimeout(() => setSfxBanner(null), 3000);
      return () => clearTimeout(t);
    }
  }, [roomState.lastSfx]);

  const guestUrl = `${window.location.origin}/?room=${roomState.roomCode}#guest`;

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* Top DJ Status Bar */}
      <div className="border-b border-zinc-900 bg-zinc-950/90 px-6 py-2.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              PULSEDJ BROADCAST
            </span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-xs text-zinc-400 font-mono">ROOM: {roomState.roomCode}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400">
          {sfxBanner && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-900/50 text-violet-300 border border-violet-700/60 animate-bounce">
              <Bell className="w-3.5 h-3.5" />
              <span className="font-medium">{sfxBanner}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-zinc-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono tabular-nums">{Math.max(1, activeGuests)} live party guests</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Top 3 columns (Current Track & Controls / Center Visualizer / Right QR & Hype) */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column (3 cols): Currently Playing Track + DJ Deck Controls */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 flex flex-col relative overflow-hidden shadow-xl">
            {/* Header label */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-violet-400 animate-spin-slow" />
                NOW PLAYING
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-medium">DECK A</span>
            </div>

            {/* Album Cover Art with Glow */}
            <div
              className="relative w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden mb-4 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${currentTrack.coverGradient.from}, ${currentTrack.coverGradient.via || currentTrack.coverGradient.to}, ${currentTrack.coverGradient.to})`,
              }}
            >
              {/* Radial vinyl grooves */}
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/40" />
                </div>
              </div>

              {/* Camelot Key Badge in Top Left */}
              <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 shadow-lg">
                {currentTrack.camelotKey} · {currentTrack.bpm} BPM
              </div>

              {/* Genre tag bottom right */}
              <div className="absolute bottom-3 right-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-700/60 rounded-md px-2 py-0.5 text-[10px] text-zinc-300">
                {currentTrack.genre}
              </div>
            </div>

            {/* Title & Artist */}
            <div className="space-y-1 mb-5">
              <h2 className="text-xl font-bold text-white tracking-tight truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm text-zinc-400 truncate">{currentTrack.artist}</p>
              <p className="text-xs text-zinc-500 truncate">{currentTrack.album}</p>
            </div>

            {/* DJ Playback Controls */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                    isPlaying
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-900/40'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Beat</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play DJ Beat</span>
                    </>
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Master Volume */}
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>VOL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 accent-violet-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono w-7 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column (6 cols): 60 FPS Audio Visualizer */}
        <div className="lg:col-span-6 flex flex-col min-h-[380px]">
          <AudioVisualizer
            isPlaying={isPlaying}
            bpm={currentTrack.bpm}
            hypeLevel={hypeLevel}
            className="flex-1 w-full"
          />
        </div>

        {/* Right Column (3 cols): QR Code + Hype Meter */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* QR Code Container */}
          <div className="min-h-[220px]">
            <QRCodeDisplay
              roomCode={roomState.roomCode}
              guestUrl={guestUrl}
              onOpenGuestPreview={onOpenGuestPreview}
            />
          </div>

          {/* Vertical Hype Meter Container */}
          <div className="min-h-[260px]">
            <HypeMeter
              hypeLevel={hypeLevel}
              totalTaps={totalTaps}
              tapsPerSecond={tapsPerSecond}
              isOverload={isOverload}
            />
          </div>
        </div>

        {/* Bottom Full-Width Section: "Next Track Duel" (3 tracks submitted to vote) */}
        <div className="lg:col-span-12 flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                NEXT TRACK DUEL — CROWD VOTES
              </h3>
              <span className="text-xs text-zinc-400">
                ({totalVotes} votes cast by guests)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRotateDuel}
                className="flex items-center gap-1.5 py-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-medium transition-colors"
                title="Shuffle voting candidate pool"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Shuffle Duel</span>
              </button>

              {leadingTrack && (
                <button
                  onClick={() => onSelectNextTrack(leadingTrack)}
                  className="flex items-center gap-1.5 py-1 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-violet-900/30 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Lock & Transition to Winner ({leadingTrack.title})</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Duel Track Cards in a 3-column row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trackDuel.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                totalVotes={totalVotes}
                isHost={true}
                isLeading={leadingTrack?.id === track.id && track.votes > 0}
                onSelectAsNext={onSelectNextTrack}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
