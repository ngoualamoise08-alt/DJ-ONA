import React from 'react';
import { Track } from '../types';
import { Music, CheckCircle2, Flame, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface TrackCardProps {
  track: Track;
  totalVotes: number;
  isHost?: boolean;
  isLeading?: boolean;
  onVote?: (trackId: string) => void;
  onSelectAsNext?: (track: Track) => void;
  isVotedByMe?: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  totalVotes,
  isHost = false,
  isLeading = false,
  onVote,
  onSelectAsNext,
  isVotedByMe = false,
}) => {
  const percentage = totalVotes > 0 ? Math.round((track.votes / totalVotes) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => {
        if (!isHost && onVote) {
          onVote(track.id);
        }
      }}
      className={`relative flex flex-col p-3.5 rounded-2xl bg-zinc-900/90 border transition-all select-none ${
        isVotedByMe
          ? 'border-violet-500 shadow-lg shadow-violet-500/20 ring-1 ring-violet-500/40'
          : isLeading
          ? 'border-cyan-500/50 shadow-md shadow-cyan-500/10'
          : 'border-zinc-800 hover:border-zinc-700'
      } ${!isHost ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      {/* Top row: Artwork + Track details */}
      <div className="flex items-center gap-3">
        {/* Generative vinyl album cover */}
        <div
          className="relative w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${track.coverGradient.from}, ${track.coverGradient.via || track.coverGradient.to}, ${track.coverGradient.to})`,
          }}
        >
          {/* Subtle vinyl groove texture */}
          <div className="absolute inset-0 bg-black/20" />
          <Music className="w-6 h-6 text-white/90 drop-shadow" />

          {/* Voted check indicator badge */}
          {isVotedByMe && (
            <div className="absolute top-1 right-1 bg-violet-600 rounded-full p-0.5 text-white shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}

          {isLeading && (
            <div className="absolute bottom-1 left-1 bg-cyan-600/90 rounded-full p-0.5 text-white shadow" title="Leading track">
              <Award className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Text info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 justify-between">
            <h4 className="text-sm font-semibold text-zinc-100 truncate">{track.title}</h4>
            <span className="text-xs font-bold font-mono text-zinc-300 tabular-nums shrink-0">
              {percentage}%
            </span>
          </div>

          <p className="text-xs text-zinc-400 truncate">{track.artist}</p>

          {/* Camelot key & BPM tag */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-medium">
              {track.camelotKey} · {track.bpm} BPM
            </span>
            <span className="text-zinc-500 hidden sm:inline">·</span>
            <span className="text-zinc-400 hidden sm:inline truncate">{track.genre}</span>
          </div>
        </div>
      </div>

      {/* Vote Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-zinc-400 font-medium">
            {isVotedByMe ? 'Your Vote Recorded' : 'Live Crowd Votes'}
          </span>
          <span className="font-mono text-zinc-300 tabular-nums font-semibold">
            {track.votes} {track.votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full"
            style={{
              backgroundColor: track.coverGradient.accent,
              boxShadow: `0 0 10px ${track.coverGradient.accent}`,
            }}
          />
        </div>
      </div>

      {/* Host Action: Lock In Winner */}
      {isHost && onSelectAsNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectAsNext(track);
          }}
          className="mt-2.5 w-full py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/60 flex items-center justify-center gap-1.5"
        >
          <Flame className="w-3.5 h-3.5 text-violet-400" />
          <span>Queue As Next Track</span>
        </button>
      )}
    </motion.div>
  );
};
