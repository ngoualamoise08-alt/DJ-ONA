import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Track,
  RoomState,
  HypeTapEvent,
  VoteEvent,
  SfxEvent,
} from './types';
import { CURRENT_PLAYING_TRACK, INITIAL_DUEL_TRACKS, RESERVE_TRACK_POOL } from './data/mockTracks';
import { HostView } from './components/HostView';
import { GuestView } from './components/GuestView';
import { HeaderNav } from './components/HeaderNav';
import { realtimeManager } from './lib/supabase';
import { audioEngine } from './lib/audioEngine';

export default function App() {
  const [roomCode, setRoomCode] = useState<string>('PULSE-808');
  const [currentView, setCurrentView] = useState<'host' | 'guest' | 'split'>('host');
  const [myVotedTrackId, setMyVotedTrackId] = useState<string | undefined>(undefined);

  // Central Room State
  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: 'PULSE-808',
    currentTrack: CURRENT_PLAYING_TRACK,
    trackDuel: INITIAL_DUEL_TRACKS,
    hypeLevel: 28,
    totalTaps: 42,
    tapsPerSecond: 0,
    activeGuests: 12,
    isOverload: false,
  });

  // Rolling tap timestamps for TPS calculation
  const tapTimestampsRef = useRef<number[]>([]);

  // Parse Initial URL Route: e.g. /host or /room/XYZ or ?room=XYZ#guest
  useEffect(() => {
    const checkRoute = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);

      const queryRoom = searchParams.get('room');
      if (queryRoom) {
        setRoomCode(queryRoom.toUpperCase());
        realtimeManager.setRoom(queryRoom.toUpperCase());
      }

      if (pathname.startsWith('/room/') || hash === '#guest' || searchParams.has('guest')) {
        const pathRoom = pathname.split('/room/')[1];
        if (pathRoom) {
          const cleanCode = pathRoom.split('/')[0].toUpperCase();
          setRoomCode(cleanCode);
          realtimeManager.setRoom(cleanCode);
        }
        setCurrentView('guest');
      } else if (pathname === '/host' || hash === '#host') {
        setCurrentView('host');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Update Route in Browser Address Bar when view changes
  const handleViewChange = (view: 'host' | 'guest' | 'split') => {
    setCurrentView(view);
    const newPath = view === 'host' ? '/host' : view === 'guest' ? `/room/${roomCode}` : '/';
    window.history.pushState({}, '', newPath);
  };

  // --- Realtime Event Subscriptions ---
  useEffect(() => {
    // 1. On Hype Tap received
    const unsubTap = realtimeManager.on('hype_tap', (event: HypeTapEvent) => {
      const now = Date.now();
      tapTimestampsRef.current.push(now);

      setRoomState((prev) => {
        const newHype = Math.min(100, prev.hypeLevel + 2.4 * event.multiplier);
        return {
          ...prev,
          hypeLevel: newHype,
          totalTaps: prev.totalTaps + event.count,
          isOverload: newHype >= 85,
        };
      });
    });

    // 2. On Vote received
    const unsubVote = realtimeManager.on('vote', (event: VoteEvent) => {
      setRoomState((prev) => {
        const nextDuel = prev.trackDuel.map((t) => {
          if (t.id === event.trackId) {
            return { ...t, votes: t.votes + 1 };
          }
          if (event.previousTrackId && t.id === event.previousTrackId) {
            return { ...t, votes: Math.max(0, t.votes - 1) };
          }
          return t;
        });
        return { ...prev, trackDuel: nextDuel };
      });
    });

    // 3. On SFX received
    const unsubSfx = realtimeManager.on('sfx', (event: SfxEvent) => {
      // If we are in Host view or Split view, play sound effect through audio engine
      audioEngine.setVolume(0.7);
      if (event.type === 'airhorn') audioEngine.playAirhorn();
      if (event.type === 'scratch') audioEngine.playScratch();
      if (event.type === 'rewind') audioEngine.playRewind();

      setRoomState((prev) => ({
        ...prev,
        lastSfx: event,
      }));
    });

    // 4. On State Sync
    const unsubSync = realtimeManager.on('state_sync', (syncedState: RoomState) => {
      setRoomState(syncedState);
    });

    return () => {
      unsubTap();
      unsubVote();
      unsubSfx();
      unsubSync();
    };
  }, []);

  // --- Hype Natural Decay & TPS Tick Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Keep only taps in last 3 seconds
      tapTimestampsRef.current = tapTimestampsRef.current.filter((t) => now - t < 3000);
      const currentTps = tapTimestampsRef.current.length / 3;

      setRoomState((prev) => {
        // Decay faster if above 80%, gentle decay if low
        const decayRate = prev.hypeLevel > 75 ? 0.75 : 0.35;
        const newHype = Math.max(8, prev.hypeLevel - decayRate);

        return {
          ...prev,
          hypeLevel: newHype,
          tapsPerSecond: currentTps,
          isOverload: newHype >= 85,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Guest cast vote handler
  const handleVote = useCallback(
    (trackId: string) => {
      if (myVotedTrackId === trackId) return;

      const prevVote = myVotedTrackId;
      setMyVotedTrackId(trackId);

      // Optimistic local state update
      setRoomState((prev) => {
        const updated = prev.trackDuel.map((t) => {
          if (t.id === trackId) return { ...t, votes: t.votes + 1 };
          if (prevVote && t.id === prevVote) return { ...t, votes: Math.max(0, t.votes - 1) };
          return t;
        });
        return { ...prev, trackDuel: updated };
      });

      // Broadcast to room
      realtimeManager.sendVote({
        trackId,
        previousTrackId: prevVote,
        senderName: 'Guest',
        timestamp: Date.now(),
      });
    },
    [myVotedTrackId]
  );

  // Host transition to next track
  const handleSelectNextTrack = useCallback(
    (winnerTrack: Track) => {
      // Pick a replacement track from the reserve pool
      const availablePool = RESERVE_TRACK_POOL.filter(
        (r) => r.id !== winnerTrack.id && !roomState.trackDuel.some((d) => d.id === r.id)
      );
      const replacement = availablePool[0] || {
        ...roomState.currentTrack,
        id: `track-cycled-${Date.now()}`,
        votes: 0,
      };

      const newDuel = roomState.trackDuel
        .filter((t) => t.id !== winnerTrack.id)
        .concat({ ...replacement, votes: 0 });

      const updatedState: RoomState = {
        ...roomState,
        currentTrack: { ...winnerTrack, votes: 0 },
        trackDuel: newDuel,
      };

      setRoomState(updatedState);
      audioEngine.setBpm(winnerTrack.bpm);
      audioEngine.playRewind(); // DJ transition effect
      realtimeManager.sendStateSync(updatedState);
    },
    [roomState]
  );

  // Host shuffle/rotate candidates
  const handleRotateDuel = useCallback(() => {
    const shuffled = [...roomState.trackDuel].sort(() => Math.random() - 0.5);
    const updatedState = { ...roomState, trackDuel: shuffled };
    setRoomState(updatedState);
    realtimeManager.sendStateSync(updatedState);
  }, [roomState]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* Top Bar with Host, Guest, and Split view switch */}
      <HeaderNav
        currentView={currentView}
        onChangeView={handleViewChange}
        roomCode={roomCode}
      />

      {/* Main View Router */}
      {currentView === 'host' && (
        <HostView
          roomState={roomState}
          onSelectNextTrack={handleSelectNextTrack}
          onRotateDuel={handleRotateDuel}
          onOpenGuestPreview={() => handleViewChange('split')}
        />
      )}

      {currentView === 'guest' && (
        <GuestView
          roomState={roomState}
          onVote={handleVote}
          myVotedTrackId={myVotedTrackId}
        />
      )}

      {currentView === 'split' && (
        <div className="flex-1 flex flex-col xl:flex-row bg-zinc-950">
          {/* Left: Host Screen */}
          <div className="flex-1 border-b xl:border-b-0 xl:border-r border-zinc-850 overflow-y-auto">
            <div className="p-3 bg-zinc-900/60 text-xs text-zinc-400 font-semibold border-b border-zinc-800 flex items-center justify-between">
              <span>HOST STAGE SCREEN (Large Display)</span>
              <span className="font-mono text-cyan-400">/host</span>
            </div>
            <HostView
              roomState={roomState}
              onSelectNextTrack={handleSelectNextTrack}
              onRotateDuel={handleRotateDuel}
              onOpenGuestPreview={() => {}}
            />
          </div>

          {/* Right: Guest Smartphone Simulator */}
          <div className="w-full xl:w-[420px] bg-black p-4 flex flex-col items-center justify-start border-l border-zinc-800 shrink-0">
            <div className="w-full text-center text-xs font-semibold text-zinc-400 mb-3 flex items-center justify-between px-2">
              <span>GUEST PHONE (Scan Simulation)</span>
              <span className="font-mono text-violet-400">/room/{roomCode}</span>
            </div>

            {/* Mobile frame device wrapper */}
            <div className="w-full max-w-[370px] border-4 border-zinc-800 rounded-[38px] overflow-hidden shadow-2xl bg-zinc-950 relative">
              {/* Speaker notch */}
              <div className="w-28 h-4 bg-zinc-850 rounded-b-xl mx-auto flex items-center justify-center">
                <div className="w-8 h-1 bg-zinc-700 rounded-full" />
              </div>

              {/* Guest View inside mobile frame */}
              <div className="max-h-[720px] overflow-y-auto">
                <GuestView
                  roomState={roomState}
                  onVote={handleVote}
                  myVotedTrackId={myVotedTrackId}
                />
              </div>

              {/* Home indicator bar */}
              <div className="w-full py-1.5 bg-zinc-950 flex items-center justify-center">
                <div className="w-24 h-1 bg-zinc-700 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
