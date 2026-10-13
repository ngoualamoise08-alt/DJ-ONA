import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, ExternalLink, Smartphone } from 'lucide-react';

interface QRCodeDisplayProps {
  roomCode: string;
  guestUrl: string;
  onOpenGuestPreview?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  roomCode,
  guestUrl,
  onOpenGuestPreview,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      guestUrl,
      {
        width: 170,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (err) => {
        if (err) console.error('Error generating QR Code:', err);
      }
    );
  }, [guestUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex flex-col items-center bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 w-full h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span>JOIN ROOM</span>
        </div>
        <span className="font-mono text-xs font-bold text-violet-400 tracking-wider">
          {roomCode}
        </span>
      </div>

      {/* QR Code Canvas container */}
      <div className="relative p-2.5 bg-white rounded-xl shadow-lg shadow-violet-950/20 my-auto">
        <canvas ref={canvasRef} className="block rounded-lg" />
        <div className="absolute inset-0 border-2 border-violet-500/20 rounded-xl pointer-events-none" />
      </div>

      {/* Direct Room Code & Action buttons */}
      <div className="w-full space-y-2 mt-3 pt-2 border-t border-zinc-900">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Scan to vote & tap</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>

        {onOpenGuestPreview && (
          <button
            onClick={onOpenGuestPreview}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
            <span>Open Guest Mobile View</span>
          </button>
        )}
      </div>
    </div>
  );
};
