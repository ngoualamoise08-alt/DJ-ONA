import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../lib/audioEngine';
import { Disc3, Waves, BarChart2 } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  bpm: number;
  hypeLevel: number;
  className?: string;
}

type VisualizerMode = 'radial' | 'bars' | 'wave';

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  bpm,
  hypeLevel,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('radial');
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    // Buffer for frequency data
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear with dark trail persistence
      ctx.fillStyle = 'rgba(9, 9, 11, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Get real audio data or procedural fallback
      const analyser = audioEngine.getAnalyser();
      let averageVolume = 0;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        averageVolume = sum / 32 / 255;
      } else {
        // Procedural simulation pulse based on BPM and hype
        phaseRef.current += 0.04 + (hypeLevel / 100) * 0.05;
        const beatPulse = Math.sin(phaseRef.current * (bpm / 120)) * 0.5 + 0.5;
        averageVolume = (isPlaying ? 0.4 : 0.15) + beatPulse * 0.25;

        for (let i = 0; i < bufferLength; i++) {
          const wave = Math.sin(phaseRef.current + i * 0.15);
          dataArray[i] = Math.max(20, Math.floor((wave * 0.5 + 0.5) * 160 * averageVolume));
        }
      }

      // Visualizer glow color based on hype level
      const hue1 = 270; // violet
      const hue2 = 190; // cyan
      const hypeBoost = (hypeLevel / 100) * 0.8;

      if (mode === 'radial') {
        // RADIAL / CIRCULAR SPECTRUM VORTEX
        const radius = Math.min(centerX, centerY) * 0.45;
        const barCount = 64;
        const angleStep = (Math.PI * 2) / barCount;

        // Dynamic center pulse circle
        const pulseRadius = radius * (0.65 + averageVolume * 0.2 + hypeBoost * 0.1);
        const centerGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          pulseRadius * 0.2,
          centerX,
          centerY,
          pulseRadius
        );
        centerGradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        centerGradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.15)');
        centerGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = centerGradient;
        ctx.fill();

        // Draw radial frequency bars
        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i % 32] / 255;
          const barHeight = Math.max(6, value * (radius * 0.85) * (1 + hypeBoost * 0.5));
          const angle = i * angleStep + phaseRef.current * 0.1;

          const x1 = centerX + Math.cos(angle) * (pulseRadius * 0.9);
          const y1 = centerY + Math.sin(angle) * (pulseRadius * 0.9);
          const x2 = centerX + Math.cos(angle) * (pulseRadius * 0.9 + barHeight);
          const y2 = centerY + Math.sin(angle) * (pulseRadius * 0.9 + barHeight);

          const t = i / barCount;
          const r = Math.floor(139 + Math.sin(t * Math.PI) * 100);
          const g = Math.floor(92 + Math.cos(t * Math.PI) * 90);
          const b = 250;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = Math.max(2, (width / 500) * 3);
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
          ctx.shadowBlur = 10;
          ctx.stroke();
        }

        // Inner vinyl spindle disc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8 + averageVolume * 8, 0, Math.PI * 2);
        ctx.fillStyle = hypeLevel > 80 ? '#ec4899' : '#06b6d4';
        ctx.shadowColor = hypeLevel > 80 ? '#ec4899' : '#06b6d4';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;

      } else if (mode === 'bars') {
        // FREQUENCY COLUMNS / BARS
        const barWidth = (width / 48) * 0.7;
        const gap = (width / 48) * 0.3;
        const totalBars = 36;
        const startX = (width - (totalBars * (barWidth + gap))) / 2;

        for (let i = 0; i < totalBars; i++) {
          const val = dataArray[i % 32] / 255;
          const barHeight = Math.max(8, val * (height * 0.7) * (1 + hypeBoost * 0.4));
          const x = startX + i * (barWidth + gap);
          const y = height - barHeight - 40;

          const grad = ctx.createLinearGradient(x, y + barHeight, x, y);
          grad.addColorStop(0, '#7c3aed');
          grad.addColorStop(0.5, '#06b6d4');
          grad.addColorStop(1, '#ec4899');

          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
          ctx.shadowBlur = 8;
          ctx.fillRect(x, y, barWidth, barHeight);
          ctx.shadowBlur = 0;
        }

      } else {
        // OSCILLOSCOPE WAVEFORM
        ctx.lineWidth = 3;
        ctx.strokeStyle = hypeLevel > 70 ? '#ec4899' : '#06b6d4';
        ctx.shadowColor = hypeLevel > 70 ? '#ec4899' : '#06b6d4';
        ctx.shadowBlur = 14;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Handle high DPI
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying, bpm, hypeLevel, mode]);

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 ${className}`}>
      {/* Top visualizer status bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-mono tabular-nums text-zinc-300 font-semibold">60 FPS</span>
          <span aria-hidden="true">·</span>
          <span>{isPlaying ? 'Live Audio Stream' : 'Reactive Standby'}</span>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-lg">
          <button
            onClick={() => setMode('radial')}
            title="Radial Vortex"
            className={`p-1.5 rounded text-xs transition-colors ${
              mode === 'radial'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode('bars')}
            title="Frequency Bars"
            className={`p-1.5 rounded text-xs transition-colors ${
              mode === 'bars'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode('wave')}
            title="Oscilloscope Wave"
            className={`p-1.5 rounded text-xs transition-colors ${
              mode === 'wave'
                ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Waves className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 60 FPS HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block rounded-xl touch-none select-none"
        style={{ minHeight: '340px' }}
      />
    </div>
  );
};
