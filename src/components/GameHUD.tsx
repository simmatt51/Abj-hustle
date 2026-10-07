import React from 'react';
import { Volume2, VolumeX, CloudSun, Eye, Zap, Wind, Megaphone, Menu, Clock } from 'lucide-react';
import { OnboardPassenger, PassengerSpeech, TimeOfDayInfo, WeatherPreset } from '../types';
import { PassengerSpeechBubble } from './PassengerSpeechBubble';

interface GameHUDProps {
  money: number;
  lives: number;
  riders: number;
  capacity: number;
  speed: number;
  dist: number;
  weather: WeatherPreset;
  timeInfo?: TimeOfDayInfo;
  passengers: OnboardPassenger[];
  currentSpeech?: PassengerSpeech | null;
  onDismissSpeech?: () => void;
  toastMsg: string | null;
  isMuted: boolean;
  cameraView: 'chase' | 'hood';
  wipersActive: boolean;
  headlightsOn: boolean;
  onOpenMenu: () => void;
  onToggleMute: () => void;
  onToggleWeatherDrawer: () => void;
  onToggleCamera: () => void;
  onToggleWipers: () => void;
  onToggleHeadlights: () => void;
  onHonk: () => void;
  onSteerLeft: () => void;
  onSteerRight: () => void;
  onBrakeStart: () => void;
  onBrakeEnd: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  money,
  lives,
  riders,
  capacity,
  speed,
  dist,
  weather,
  timeInfo,
  passengers,
  currentSpeech,
  onDismissSpeech,
  toastMsg,
  isMuted,
  cameraView,
  wipersActive,
  headlightsOn,
  onOpenMenu,
  onToggleMute,
  onToggleWeatherDrawer,
  onToggleCamera,
  onToggleWipers,
  onToggleHeadlights,
  onHonk,
  onSteerLeft,
  onSteerRight,
  onBrakeStart,
  onBrakeEnd,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar HUD */}
      <div>
        <div className="flex items-start justify-between gap-3 text-white">
          {/* Earnings & Telemetry */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-lg max-w-sm">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-amber-400 font-mono">
              ₦{money.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-300 mt-0.5">
              <span>{speed} km/h</span>
              <span aria-hidden="true" className="text-neutral-500">·</span>
              <span>{dist} m</span>
              <span aria-hidden="true" className="text-neutral-500">·</span>
              <span className="text-emerald-400 font-medium">👥 {riders}/{capacity}</span>
            </div>
          </div>

          {/* Center: Day-Night Clock & Dynamic Weather Badges */}
          <div className="flex items-center gap-2">
            {/* Live Clock / Time of Day Widget */}
            {timeInfo && (
              <button
                onClick={onToggleWeatherDrawer}
                className="pointer-events-auto bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-md border border-white/15 rounded-xl px-3 py-1.5 text-left shadow-lg cursor-pointer flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-amber-400"
                title="Time of Day & Lighting (Click to configure)"
              >
                <span className="text-lg">{timeInfo.icon}</span>
                <div>
                  <div className="text-xs font-bold font-mono text-amber-300 leading-tight">
                    {timeInfo.timeString}
                  </div>
                  <div className="text-[10px] text-neutral-300 leading-tight flex items-center gap-1">
                    <span>{timeInfo.periodLabel}</span>
                    {timeInfo.autoLightsActive && (
                      <span className="text-[9px] bg-amber-500/25 text-amber-300 px-1 py-0.2 rounded font-semibold border border-amber-400/40">
                        AUTO
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )}

            {/* Dynamic Weather Badge */}
            <button
              onClick={onToggleWeatherDrawer}
              className="pointer-events-auto bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-1.5 text-center shadow-lg group cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              title="Click to change weather and lighting conditions"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-100">
                <span className="text-base">{weather.icon}</span>
                <span>{weather.label}</span>
                <span className="text-[11px] text-neutral-400 font-normal">({weather.temp})</span>
              </div>
              {weather.fareMultiplier > 1.0 ? (
                <div className="text-[10px] font-medium text-amber-300 mt-0.5">
                  +{Math.round((weather.fareMultiplier - 1.0) * 100)}% Surge Fare
                </div>
              ) : (
                <div className="text-[10px] text-neutral-400 group-hover:text-amber-300 transition-colors mt-0.5">
                  Weather & Sun
                </div>
              )}
            </button>
          </div>

          {/* Right: Lives & Controls */}
          <div className="flex items-center gap-2">
            {/* Health */}
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex items-center gap-1 text-sm shadow-lg">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? 'opacity-100' : 'opacity-20'}>
                  ❤️
                </span>
              ))}
            </div>

            {/* Quick utility toggles */}
            <button
              onClick={onToggleMute}
              className="pointer-events-auto p-2.5 rounded-xl bg-black/60 hover:bg-black/80 transition-colors border border-white/10 text-neutral-200 hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* In-Game Menu Button */}
            <button
              onClick={onOpenMenu}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 transition-colors border border-white/15 text-neutral-200 hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 text-xs font-semibold shadow-lg"
              aria-label="Open pause and restart menu"
              title="Pause Menu (Esc / P)"
            >
              <Menu className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>

        {/* Active Passenger Destination Badges */}
        {passengers.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 max-w-lg">
            {passengers.map((p, idx) => (
              <div
                key={p.id || idx}
                className="bg-black/70 backdrop-blur-md border border-emerald-500/50 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs"
              >
                <span className="text-emerald-400 font-bold">📍 To {p.destStop}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-amber-300 font-mono font-semibold">₦{p.fare}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Animated Passenger Speech Bubble Callout */}
      <PassengerSpeechBubble speech={currentSpeech || null} onDismiss={onDismissSpeech} />

      {/* Center Toast Banner */}
      {toastMsg && (
        <div className="self-center -mt-10 px-5 py-2.5 bg-neutral-900/90 text-amber-200 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-md font-semibold text-sm max-w-[90%] text-center animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Interactive Environment Action Bar + Driving Controls */}
      <div className="flex flex-col gap-3">
        {/* Secondary Car Utilities (Honk, Lights, Wipers, Camera) */}
        <div className="self-center flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-lg">
          {/* Honk Horn */}
          <button
            onClick={onHonk}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer active:scale-95"
            title="Honk at hawkers for tips & clear slow traffic (Key: H)"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Honk (H)</span>
          </button>

          {/* Headlights */}
          <button
            onClick={onToggleHeadlights}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
              headlightsOn
                ? 'bg-amber-400/25 text-amber-200 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                : 'bg-white/5 text-neutral-400 border border-white/10'
            }`}
            title="Toggle vehicle headlights (Key: L)"
          >
            <Zap className={`w-3.5 h-3.5 ${headlightsOn ? 'text-amber-300' : 'text-neutral-400'}`} />
            <span>{headlightsOn ? (timeInfo?.autoLightsActive ? 'Auto Lights (ON)' : 'Lights (ON)') : 'Lights (OFF)'}</span>
          </button>

          {/* Windshield Wipers */}
          <button
            onClick={onToggleWipers}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
              wipersActive
                ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                : 'bg-white/5 text-neutral-400 border border-white/10'
            }`}
            title="Toggle windshield wipers (Key: W)"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wipers (W)</span>
          </button>

          {/* Camera View */}
          <button
            onClick={onToggleCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-neutral-200 border border-white/10 transition-colors cursor-pointer active:scale-95"
            title="Toggle chase cam or cockpit hood cam (Key: C)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{cameraView === 'chase' ? 'Cockpit' : 'Chase'}</span>
          </button>
        </div>

        {/* Primary Driving Controls (Left, Stop/Brake, Right) */}
        <div className="flex items-end justify-between gap-4 pointer-events-auto">
          {/* Steer Left */}
          <button
            onClick={onSteerLeft}
            aria-label="Steer Left"
            className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl bg-white/90 active:bg-amber-300 text-neutral-900 font-bold text-2xl shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer border border-neutral-300"
          >
            ◀
          </button>

          {/* Stop / Brake & Passenger Boarding Button */}
          <button
            onPointerDown={onBrakeStart}
            onPointerUp={onBrakeEnd}
            onPointerLeave={onBrakeEnd}
            onPointerCancel={onBrakeEnd}
            aria-label="Hold to Stop"
            className="w-32 h-16 sm:w-40 sm:h-20 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-lg sm:text-xl shadow-xl flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer border border-rose-400/50"
          >
            <span>HOLD STOP</span>
            <span className="text-[10px] sm:text-xs font-normal text-rose-200 uppercase tracking-wide">
              Left Lane · Board Passengers
            </span>
          </button>

          {/* Steer Right */}
          <button
            onClick={onSteerRight}
            aria-label="Steer Right"
            className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl bg-white/90 active:bg-amber-300 text-neutral-900 font-bold text-2xl shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer border border-neutral-300"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
