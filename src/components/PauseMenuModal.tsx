import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, CloudSun, Car, X, ShieldAlert } from 'lucide-react';
import { OnboardPassenger, TimeOfDayInfo, VehicleKey, WeatherPreset } from '../types';
import { VEHICLE_CONFIGS } from '../game/GameEngine';

interface PauseMenuModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onRestart: (key: VehicleKey) => void;
  currentVehicle: VehicleKey;
  money: number;
  dist: number;
  passengers: OnboardPassenger[];
  weather: WeatherPreset;
  timeInfo?: TimeOfDayInfo;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenWeatherDrawer: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  isOpen,
  onContinue,
  onRestart,
  currentVehicle,
  money,
  dist,
  passengers,
  weather,
  timeInfo,
  isMuted,
  onToggleMute,
  onOpenWeatherDrawer,
}) => {
  if (!isOpen) return null;

  const currentCfg = VEHICLE_CONFIGS[currentVehicle];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-md w-full p-6 text-neutral-100 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-amber-400">
              Game Paused
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Abuja Expressway Hustle
            </p>
          </div>
          <button
            onClick={onContinue}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Continue game"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Trip Snapshot */}
        <div className="my-4 p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Current Revenue</span>
            <span className="font-mono font-bold text-amber-400 text-sm">₦{money.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Distance Travelled</span>
            <span className="font-bold text-white">{dist.toLocaleString()} meters</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Current Ride</span>
            <span className="font-semibold text-emerald-400">{currentCfg.icon} {currentCfg.name}</span>
          </div>
          {timeInfo && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Time & Lighting</span>
              <span className="font-semibold text-amber-300">{timeInfo.icon} {timeInfo.timeString} · {timeInfo.periodLabel}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Climate</span>
            <span className="font-semibold text-neutral-200">{weather.icon} {weather.label} ({weather.temp})</span>
          </div>

          {passengers.length > 0 && (
            <div className="pt-2 border-t border-neutral-700/40">
              <div className="text-[11px] text-neutral-400 mb-1.5 font-medium">Onboard Commuters:</div>
              <div className="flex flex-wrap gap-1.5">
                {passengers.map((p, idx) => (
                  <span
                    key={p.id || idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-[11px]"
                  >
                    📍 {p.destStop}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5">
          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-bold text-white text-base shadow-lg transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Continue Game</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => onRestart(currentVehicle)}
            className="w-full py-3 px-5 rounded-2xl bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 border border-neutral-700/80 font-bold text-amber-300 text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Current Run</span>
          </button>
        </div>

        {/* Quick Utility Row */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Sound' : 'Mute Sound'}</span>
          </button>

          <button
            onClick={() => {
              onContinue();
              onOpenWeatherDrawer();
            }}
            className="p-2.5 rounded-xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>Change Weather</span>
          </button>
        </div>

        {/* Shortcut hint */}
        <div className="mt-3 text-center text-[11px] text-neutral-500">
          Press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-neutral-300">Esc</kbd> or <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-neutral-300">P</kbd> to resume
        </div>
      </div>
    </div>
  );
};
