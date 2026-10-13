import React, { useState } from 'react';
import { Radio, Database, Sparkles, Smartphone, Monitor, Columns, Check, Settings } from 'lucide-react';
import { realtimeManager } from '../lib/supabase';

interface HeaderNavProps {
  currentView: 'host' | 'guest' | 'split';
  onChangeView: (view: 'host' | 'guest' | 'split') => void;
  roomCode: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onChangeView,
  roomCode,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const config = realtimeManager.getSavedConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseKey, setSupabaseKey] = useState(config.anonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    realtimeManager.setSupabaseConfig(supabaseUrl, supabaseKey);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettings(false);
    }, 1200);
  };

  return (
    <>
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-zinc-950 border-b border-zinc-900 text-zinc-100 z-40 sticky top-0">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-900/40">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            PulseDJ
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-4 text-xs font-medium text-zinc-400">
          <button
            onClick={() => onChangeView('host')}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'host'
                ? 'text-white bg-zinc-900 border border-zinc-800'
                : 'hover:text-zinc-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-violet-400" />
            <span>Host Stage (/host)</span>
          </button>

          <button
            onClick={() => onChangeView('guest')}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'guest'
                ? 'text-white bg-zinc-900 border border-zinc-800'
                : 'hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guest Mobile (/room/{roomCode})</span>
          </button>

          <button
            onClick={() => onChangeView('split')}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'split'
                ? 'text-white bg-zinc-900 border border-zinc-800'
                : 'hover:text-zinc-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-rose-400" />
            <span>Dual Live Preview</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Realtime Broadcast Active</span>
            <Settings className="w-3 h-3 text-zinc-500 ml-1" />
          </button>
        </div>
      </header>

      {/* Supabase Realtime Configuration Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Supabase Realtime Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              PulseDJ uses Supabase Realtime Broadcast channels (<code className="text-emerald-400 font-mono">room:{roomCode}</code>).
              It operates with zero-latency synchronized broadcast across tabs and guest phones. You can also paste your Supabase Project credentials below.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-md shadow-emerald-950"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save & Connect</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
