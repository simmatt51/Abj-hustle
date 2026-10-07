import React from 'react';
import { X, CloudRain, Sun, Moon, CloudLightning, Sunset, Wind, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import { TimeOfDayInfo, WeatherKey, WeatherPreset } from '../types';
import { WEATHER_PRESETS } from '../weatherData';

interface WeatherSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeather: WeatherPreset;
  onSelectWeather: (key: WeatherKey) => void;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
  timeInfo?: TimeOfDayInfo;
  onSetTimeOfDay?: (hours: number) => void;
  isDayCycleActive?: boolean;
  onToggleDayCycle?: () => void;
}

export const WeatherSelector: React.FC<WeatherSelectorProps> = ({
  isOpen,
  onClose,
  currentWeather,
  onSelectWeather,
  autoCycle,
  onToggleAutoCycle,
  timeInfo,
  onSetTimeOfDay,
  isDayCycleActive = true,
  onToggleDayCycle,
}) => {
  if (!isOpen) return null;

  const presets = Object.values(WEATHER_PRESETS);

  const timePresets = [
    { label: 'Dawn', hours: 6.2, icon: '🌅', desc: 'Golden sunrise' },
    { label: 'Noon', hours: 12.5, icon: '☀️', desc: 'Bright daylight' },
    { label: 'Sunset', hours: 18.5, icon: '🌆', desc: 'Dusk & Streetlights' },
    { label: 'Midnight', hours: 0.0, icon: '🌙', desc: 'Dark starry night' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 text-neutral-100 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>🌦️</span> Atmosphere & Day-Night Cycle
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live lighting transitions, streetlights, headlights, and seasons
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close weather panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Day-Night Cycle & Lighting Controls */}
        <div className="my-3.5 p-3.5 bg-neutral-800/80 rounded-2xl border border-neutral-700/60">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Gradual Day-Night Cycle</span>
              {timeInfo && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  {timeInfo.timeString} · {timeInfo.periodLabel}
                </span>
              )}
            </div>
            {onToggleDayCycle && (
              <button
                onClick={onToggleDayCycle}
                className="text-amber-400 hover:text-amber-300 transition-colors p-1 cursor-pointer"
                aria-label="Toggle gradual day-night cycle"
                title={isDayCycleActive ? 'Pause Day-Night progression' : 'Resume Day-Night progression'}
              >
                {isDayCycleActive ? (
                  <ToggleRight className="w-7 h-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-500" />
                )}
              </button>
            )}
          </div>

          {/* Quick Time Jumps */}
          <div className="grid grid-cols-4 gap-2">
            {timePresets.map((tp) => (
              <button
                key={tp.label}
                onClick={() => onSetTimeOfDay?.(tp.hours)}
                className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-750 border border-neutral-700/80 hover:border-amber-400/60 transition-all text-center cursor-pointer active:scale-95 group"
              >
                <div className="text-xl group-hover:scale-110 transition-transform">{tp.icon}</div>
                <div className="text-xs font-bold text-neutral-200 mt-1">{tp.label}</div>
                <div className="text-[10px] text-neutral-400">{tp.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-2.5 text-[11px] text-neutral-400 leading-tight">
            💡 As dusk falls (Sunset & Midnight), streetlights and vehicle headlights automatically turn on!
          </div>
        </div>

        {/* 2. Weather Presets */}
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Weather & Road Conditions
          </div>
          <button
            onClick={onToggleAutoCycle}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>Auto Climate: {autoCycle ? 'ON' : 'OFF'}</span>
            {autoCycle ? (
              <ToggleRight className="w-5 h-5 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-neutral-500" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto pr-1">
          {presets.map((preset) => {
            const isSelected = currentWeather.key === preset.key;
            return (
              <button
                key={preset.key}
                onClick={() => {
                  onSelectWeather(preset.key);
                }}
                className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400/80 ring-1 ring-amber-400/50'
                    : 'bg-neutral-800/50 hover:bg-neutral-800 border-neutral-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="text-xs font-mono text-neutral-400">{preset.temp}</span>
                  </div>
                  <div className="font-bold text-sm text-white mt-1">{preset.label}</div>
                  <div className="text-xs text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-700/40 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">
                    Grip: {Math.round(preset.roadFriction * 100)}%
                  </span>
                  {preset.fareMultiplier > 1.0 ? (
                    <span className="text-emerald-400 font-semibold">
                      +{Math.round((preset.fareMultiplier - 1.0) * 100)}% Tip
                    </span>
                  ) : (
                    <span className="text-neutral-500">Normal Fare</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3.5 pt-3 border-t border-neutral-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors cursor-pointer text-sm"
          >
            Apply & Return to Highway
          </button>
        </div>
      </div>
    </div>
  );
};
