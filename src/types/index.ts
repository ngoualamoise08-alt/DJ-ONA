export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  bpm: number;
  camelotKey: string; // e.g. "8A", "4A", "11B"
  musicalKey: string; // e.g. "A minor", "E minor"
  duration: number; // in seconds
  genre: string;
  coverGradient: {
    from: string;
    via?: string;
    to: string;
    accent: string;
  };
  votes: number;
  votedByMe?: boolean;
}

export type SfxType = 'airhorn' | 'scratch' | 'rewind';

export interface SfxEvent {
  type: SfxType;
  senderName: string;
  timestamp: number;
}

export interface HypeTapEvent {
  count: number;
  multiplier: number;
  senderName: string;
  timestamp: number;
}

export interface VoteEvent {
  trackId: string;
  previousTrackId?: string;
  senderName: string;
  timestamp: number;
}

export interface RoomState {
  roomCode: string;
  currentTrack: Track;
  trackDuel: Track[];
  hypeLevel: number; // 0 to 100
  totalTaps: number;
  tapsPerSecond: number;
  activeGuests: number;
  lastSfx?: SfxEvent;
  isOverload: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
