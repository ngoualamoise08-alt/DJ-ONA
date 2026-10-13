import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { HypeTapEvent, VoteEvent, SfxEvent, RoomState } from '../types';

type EventCallback<T> = (payload: T) => void;

interface RealtimeListeners {
  hype_tap: EventCallback<HypeTapEvent>[];
  vote: EventCallback<VoteEvent>[];
  sfx: EventCallback<SfxEvent>[];
  state_sync: EventCallback<RoomState>[];
}

class PulseRealtimeManager {
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private localBroadcast: BroadcastChannel | null = null;
  private roomCode: string = 'PULSE-808';
  private supabaseUrl: string = '';
  private supabaseAnonKey: string = '';
  private isConnectedToSupabase: boolean = false;

  private listeners: RealtimeListeners = {
    hype_tap: [],
    vote: [],
    sfx: [],
    state_sync: [],
  };

  constructor() {
    this.loadSavedConfig();
    this.initLocalBroadcast();
    this.tryInitSupabase();
  }

  private loadSavedConfig() {
    try {
      const envUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
      const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';
      const savedUrl = localStorage.getItem('pulsedj_supabase_url') || envUrl;
      const savedKey = localStorage.getItem('pulsedj_supabase_key') || envKey;

      if (savedUrl && savedKey) {
        this.supabaseUrl = savedUrl;
        this.supabaseAnonKey = savedKey;
      }
    } catch {
      // ignore SSR or storage restrictions
    }
  }

  public getSavedConfig() {
    return {
      url: this.supabaseUrl,
      anonKey: this.supabaseAnonKey,
      isConnected: this.isConnectedToSupabase,
    };
  }

  public setSupabaseConfig(url: string, key: string) {
    this.supabaseUrl = url.trim();
    this.supabaseAnonKey = key.trim();
    try {
      localStorage.setItem('pulsedj_supabase_url', this.supabaseUrl);
      localStorage.setItem('pulsedj_supabase_key', this.supabaseAnonKey);
    } catch {
      // ignore
    }
    this.tryInitSupabase();
  }

  private initLocalBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        if (this.localBroadcast) {
          this.localBroadcast.close();
        }
        this.localBroadcast = new BroadcastChannel(`pulsedj_channel_${this.roomCode}`);
        this.localBroadcast.onmessage = (event) => {
          const { eventName, payload } = event.data || {};
          if (eventName && this.listeners[eventName as keyof RealtimeListeners]) {
            this.emitLocalEvent(eventName as keyof RealtimeListeners, payload);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not available:', err);
      }
    }
  }

  private tryInitSupabase() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      this.isConnectedToSupabase = false;
      return;
    }

    try {
      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 20,
          },
        },
      });

      this.subscribeToChannel(this.roomCode);
      this.isConnectedToSupabase = true;
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      this.isConnectedToSupabase = false;
    }
  }

  public setRoom(roomCode: string) {
    if (this.roomCode === roomCode) return;
    this.roomCode = roomCode;
    this.initLocalBroadcast();
    if (this.client) {
      this.subscribeToChannel(roomCode);
    }
  }

  private subscribeToChannel(roomCode: string) {
    if (!this.client) return;

    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = this.client.channel(`room:${roomCode}`, {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    this.channel
      .on('broadcast', { event: 'hype_tap' }, ({ payload }) => {
        this.emitLocalEvent('hype_tap', payload as HypeTapEvent);
      })
      .on('broadcast', { event: 'vote' }, ({ payload }) => {
        this.emitLocalEvent('vote', payload as VoteEvent);
      })
      .on('broadcast', { event: 'sfx' }, ({ payload }) => {
        this.emitLocalEvent('sfx', payload as SfxEvent);
      })
      .on('broadcast', { event: 'state_sync' }, ({ payload }) => {
        this.emitLocalEvent('state_sync', payload as RoomState);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnectedToSupabase = true;
        }
      });
  }

  private emitLocalEvent<K extends keyof RealtimeListeners>(
    eventName: K,
    payload: Parameters<RealtimeListeners[K][number]>[0]
  ) {
    // Call all registered listeners
    const list = this.listeners[eventName];
    if (list) {
      list.forEach((cb) => {
        try {
          (cb as (p: typeof payload) => void)(payload);
        } catch (err) {
          console.error(`Error in listener for ${eventName}:`, err);
        }
      });
    }
  }

  // --- BROADCAST EMITTERS ---

  public sendHypeTap(event: HypeTapEvent) {
    // 1. Send via local BroadcastChannel for zero-latency local/multi-tab sync
    if (this.localBroadcast) {
      this.localBroadcast.postMessage({ eventName: 'hype_tap', payload: event });
    }

    // 2. Also send via Supabase Realtime Broadcast if active
    if (this.channel && this.isConnectedToSupabase) {
      this.channel.send({
        type: 'broadcast',
        event: 'hype_tap',
        payload: event,
      });
    }
  }

  public sendVote(event: VoteEvent) {
    if (this.localBroadcast) {
      this.localBroadcast.postMessage({ eventName: 'vote', payload: event });
    }

    if (this.channel && this.isConnectedToSupabase) {
      this.channel.send({
        type: 'broadcast',
        event: 'vote',
        payload: event,
      });
    }
  }

  public sendSfx(event: SfxEvent) {
    if (this.localBroadcast) {
      this.localBroadcast.postMessage({ eventName: 'sfx', payload: event });
    }

    if (this.channel && this.isConnectedToSupabase) {
      this.channel.send({
        type: 'broadcast',
        event: 'sfx',
        payload: event,
      });
    }
  }

  public sendStateSync(state: RoomState) {
    if (this.localBroadcast) {
      this.localBroadcast.postMessage({ eventName: 'state_sync', payload: state });
    }

    if (this.channel && this.isConnectedToSupabase) {
      this.channel.send({
        type: 'broadcast',
        event: 'state_sync',
        payload: state,
      });
    }
  }

  // --- SUBSCRIPTIONS ---

  public on<K extends keyof RealtimeListeners>(
    eventName: K,
    callback: RealtimeListeners[K][number]
  ): () => void {
    (this.listeners[eventName] as unknown[]).push(callback);
    return () => {
      this.listeners[eventName] = (this.listeners[eventName] as unknown[]).filter(
        (cb) => cb !== callback
      ) as RealtimeListeners[K];
    };
  }
}

export const realtimeManager = new PulseRealtimeManager();
