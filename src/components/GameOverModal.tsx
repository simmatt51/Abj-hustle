import React from 'react';
import { VehicleKey } from '../types';
import { VEHICLE_CONFIGS } from '../game/GameEngine';

interface GameOverModalProps {
  stats: {
    money: number;
    dist: number;
    passengers: number;
    puddles: number;
    hawkers: number;
  };
  bestScore: number;
  onRestart: (key: VehicleKey) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestScore,
  onRestart,
}) => {
  const isNewBest = stats.money >= bestScore && stats.money > 0;
  const vehicles = Object.entries(VEHICLE_CONFIGS) as [VehicleKey, typeof VEHICLE_CONFIGS.bike][];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 text-neutral-100 shadow-2xl relative my-auto text-center">
        {/* Title */}
        <div className="text-3xl font-extrabold text-amber-400">
          Day's Hustle Over!
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Your shift on the Abuja expressway has ended.
        </p>

        {/* Big Earnings Callout */}
        <div className="my-5 p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80">
          <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
            Total Revenue
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono mt-1">
            ₦{stats.money.toLocaleString()}
          </div>
          {isNewBest ? (
            <div className="text-xs font-bold text-amber-300 mt-1">
              🏆 New Record Day!
            </div>
          ) : (
            <div className="text-xs text-neutral-400 mt-1">
              Best Day: ₦{bestScore.toLocaleString()}
            </div>
          )}
        </div>

        {/* Run Telemetry & Interactions */}
        <div className="grid grid-cols-2 gap-2.5 text-left mb-6">
          <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="text-[11px] text-neutral-400">Distance Covered</div>
            <div className="text-base font-bold text-white mt-0.5">{stats.dist.toLocaleString()} m</div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="text-[11px] text-neutral-400">Passengers Served</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{stats.passengers}</div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="text-[11px] text-neutral-400">Puddles Splashed</div>
            <div className="text-base font-bold text-sky-400 mt-0.5">💦 {stats.puddles}</div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="text-[11px] text-neutral-400">Hawkers Honked</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">📢 {stats.hawkers}</div>
          </div>
        </div>

        {/* Play Again Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
            Run It Again
          </div>
          {vehicles.map(([k, v]) => (
            <button
              key={k}
              onClick={() => onRestart(k)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{v.icon}</span>
              <span>Ride again with {v.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
