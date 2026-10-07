import React from 'react';
import { VehicleKey } from '../types';
import { VEHICLE_CONFIGS } from '../game/GameEngine';

interface VehicleSelectModalProps {
  bestScore: number;
  onSelectVehicle: (key: VehicleKey) => void;
}

export const VehicleSelectModal: React.FC<VehicleSelectModalProps> = ({
  bestScore,
  onSelectVehicle,
}) => {
  const vehicles = Object.entries(VEHICLE_CONFIGS) as [VehicleKey, typeof VEHICLE_CONFIGS.bike][];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-neutral-100 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="text-center pb-5">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-400">
            Abuja Hustle 3D
          </div>
          <div className="text-sm text-neutral-300 font-medium mt-1">
            Dynamic Weather & Highway Simulator
          </div>
          {bestScore > 0 && (
            <div className="mt-2 text-xs font-mono text-emerald-400">
              Personal Best: ₦{bestScore.toLocaleString()}
            </div>
          )}
        </div>

        {/* Gameplay Instructions & Immersive Features */}
        <div className="bg-neutral-800/60 rounded-2xl p-4 border border-neutral-700/60 text-xs text-neutral-300 space-y-2 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-base">🛑</span>
            <span>
              <strong className="text-white">Bus Stops:</strong> Steer into the leftmost lane and <strong className="text-rose-400">HOLD STOP</strong> to pick up waiting commuters.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">⛈️</span>
            <span>
              <strong className="text-white">Dynamic Weather:</strong> Heavy rains create road puddles, reduce tire grip, and reward up to <strong className="text-amber-300">+50% Storm Surge Fares</strong>!
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">📢</span>
            <span>
              <strong className="text-white">Interactive Hawkers:</strong> Tap <strong className="text-amber-300">Honk (H)</strong> when passing Mai Suya or Pure Water hawkers for tips and to clear slow cars.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">🏛️</span>
            <span>
              <strong className="text-white">Abuja Landmarks:</strong> Pass through the monumental Abuja City Gate for ₦1,500 milestone bonuses!
            </span>
          </div>
        </div>

        {/* Vehicle Selection List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Select Your Hustle Ride
          </div>
          {vehicles.map(([key, v]) => (
            <button
              key={key}
              onClick={() => onSelectVehicle(key)}
              className="w-full text-left p-4 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700/80 hover:border-amber-400/60 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {v.icon}
                </div>
                <div>
                  <div className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                    {v.name}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {v.desc}
                  </div>
                </div>
              </div>

              <div className="text-right pl-3 border-l border-neutral-700/60">
                <div className="font-bold text-sm text-emerald-400">
                  ₦{v.fare}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5 whitespace-nowrap">
                  {v.cap} {v.cap === 1 ? 'seat' : 'seats'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Controls Quick Reminder */}
        <div className="mt-5 text-center text-[11px] text-neutral-500">
          Keyboard: Left/Right / A/D · Hold Space / Down to Stop · H: Honk · L: Lights · W: Wipers · C: Cam
        </div>
      </div>
    </div>
  );
};
