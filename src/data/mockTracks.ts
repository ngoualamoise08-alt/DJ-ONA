import { Track } from '../types';

export const CURRENT_PLAYING_TRACK: Track = {
  id: 'track-now',
  title: 'Neon Horizon',
  artist: 'Astral Echo',
  album: 'Cyber Odyssey LP',
  bpm: 124,
  camelotKey: '8A',
  musicalKey: 'A minor',
  duration: 218,
  genre: 'Melodic Techno',
  coverGradient: {
    from: '#7c3aed', // violet-600
    via: '#06b6d4',  // cyan-500
    to: '#0f172a',   // slate-900
    accent: '#a855f7',
  },
  votes: 0,
};

export const INITIAL_DUEL_TRACKS: Track[] = [
  {
    id: 'track-duel-1',
    title: 'Starlight Mirage',
    artist: 'Nova Lux',
    album: 'Luminescent Nights',
    bpm: 124,
    camelotKey: '8A',
    musicalKey: 'A minor',
    duration: 195,
    genre: 'Melodic House',
    coverGradient: {
      from: '#ec4899', // pink-500
      via: '#8b5cf6',  // purple-500
      to: '#1e1b4b',   // indigo-950
      accent: '#ec4899',
    },
    votes: 38,
  },
  {
    id: 'track-duel-2',
    title: 'Hyperdrive Overload',
    artist: 'CyberPulse',
    album: 'Neon Acid Vault',
    bpm: 126,
    camelotKey: '9A',
    musicalKey: 'E minor',
    duration: 224,
    genre: 'Peak-Time Techno',
    coverGradient: {
      from: '#06b6d4', // cyan-500
      via: '#3b82f6',  // blue-500
      to: '#020617',   // slate-950
      accent: '#06b6d4',
    },
    votes: 45,
  },
  {
    id: 'track-duel-3',
    title: 'Solar Eclipse',
    artist: 'Kroma & Vibe',
    album: 'Savanna Grooves',
    bpm: 122,
    camelotKey: '7A',
    musicalKey: 'D minor',
    duration: 210,
    genre: 'Afro Deep House',
    coverGradient: {
      from: '#f59e0b', // amber-500
      via: '#ef4444',  // red-500
      to: '#18181b',   // zinc-900
      accent: '#f59e0b',
    },
    votes: 19,
  },
];

export const RESERVE_TRACK_POOL: Track[] = [
  {
    id: 'track-reserve-1',
    title: 'Quantum Resonance',
    artist: 'Vektor 9',
    album: 'Subatomic Pulse',
    bpm: 125,
    camelotKey: '8B',
    musicalKey: 'C Major',
    duration: 204,
    genre: 'Future Rave',
    coverGradient: {
      from: '#10b981',
      via: '#06b6d4',
      to: '#022c22',
      accent: '#10b981',
    },
    votes: 0,
  },
  {
    id: 'track-reserve-2',
    title: 'Midnight Transmission',
    artist: 'Elena Cruz',
    album: 'Analog Dreams',
    bpm: 123,
    camelotKey: '9B',
    musicalKey: 'G Major',
    duration: 188,
    genre: 'Indie Dance',
    coverGradient: {
      from: '#6366f1',
      via: '#d946ef',
      to: '#1e1b4b',
      accent: '#d946ef',
    },
    votes: 0,
  },
];
