import React, { useEffect, useState } from 'react';
import { PassengerSpeech } from '../types';
import { X, MessageSquareQuote } from 'lucide-react';

interface PassengerSpeechBubbleProps {
  speech: PassengerSpeech | null;
  onDismiss?: () => void;
}

export const PassengerSpeechBubble: React.FC<PassengerSpeechBubbleProps> = ({
  speech,
  onDismiss,
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (speech) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 4200);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [speech, onDismiss]);

  if (!speech || !visible) return null;

  // Category-specific visual theme
  const categoryStyles = {
    dropping: {
      bubbleBg: 'bg-amber-50 text-neutral-950 border-amber-500 shadow-[0_10px_35px_rgba(245,158,11,0.35)]',
      badgeBg: 'bg-amber-500 text-neutral-950',
      tag: 'DROPPING PASSENGER',
      tailColor: 'border-t-amber-50',
      borderColor: 'border-t-amber-500',
    },
    boarding: {
      bubbleBg: 'bg-emerald-50 text-neutral-950 border-emerald-500 shadow-[0_10px_35px_rgba(16,185,129,0.3)]',
      badgeBg: 'bg-emerald-600 text-white',
      tag: 'COMMUTER BOARDING',
      tailColor: 'border-t-emerald-50',
      borderColor: 'border-t-emerald-500',
    },
    alighting: {
      bubbleBg: 'bg-sky-50 text-neutral-950 border-sky-500 shadow-[0_10px_35px_rgba(14,165,233,0.3)]',
      badgeBg: 'bg-sky-600 text-white',
      tag: 'PASSENGER ALIGHTING',
      tailColor: 'border-t-sky-50',
      borderColor: 'border-t-sky-500',
    },
    missed: {
      bubbleBg: 'bg-rose-50 text-neutral-950 border-rose-500 shadow-[0_10px_35px_rgba(244,63,94,0.35)]',
      badgeBg: 'bg-rose-600 text-white',
      tag: 'MISSED DROP STOP',
      tailColor: 'border-t-rose-50',
      borderColor: 'border-t-rose-500',
    },
    ride: {
      bubbleBg: 'bg-neutral-50 text-neutral-950 border-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.25)]',
      badgeBg: 'bg-neutral-800 text-neutral-100',
      tag: 'COMMUTER CHAT',
      tailColor: 'border-t-neutral-50',
      borderColor: 'border-t-amber-400',
    },
  }[speech.category];

  return (
    <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-sm sm:max-w-md w-[92%] animate-in fade-in zoom-in-95 duration-200">
      <div
        className={`relative rounded-3xl border-3 p-3.5 sm:p-4 transition-all ${categoryStyles.bubbleBg}`}
      >
        {/* Header Tag & Speaker */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl filter drop-shadow-sm leading-none">
              {speech.avatarEmoji}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight uppercase">
                  {speech.speakerName}
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${categoryStyles.badgeBg}`}
                >
                  {categoryStyles.tag}
                </span>
              </div>
              {speech.destStop && (
                <div className="text-[10px] text-neutral-600 font-semibold flex items-center gap-1">
                  <span>📍 Destination:</span>
                  <span className="underline decoration-amber-500">{speech.destStop}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="p-1 rounded-full hover:bg-black/10 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            aria-label="Dismiss speech"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Pidgin Dialogue Text */}
        <div className="pl-8 sm:pl-9 pr-2">
          <div className="text-base sm:text-lg font-black tracking-tight leading-snug font-sans text-neutral-900 flex items-start gap-1.5">
            <MessageSquareQuote className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span>&ldquo;{speech.text}&rdquo;</span>
          </div>
        </div>

        {/* Speech Bubble Triangular Pointer Tail pointing downward */}
        <div
          className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-14 border-t-current"
          style={{
            borderTopColor: speech.category === 'missed' ? '#f43f5e' : speech.category === 'dropping' ? '#f59e0b' : speech.category === 'boarding' ? '#10b981' : '#f59e0b',
          }}
        />
        <div
          className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-10 ${categoryStyles.tailColor}`}
        />
      </div>
    </div>
  );
};
