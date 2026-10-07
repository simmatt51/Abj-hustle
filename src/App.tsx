/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameHUD } from './components/GameHUD';
import { WeatherSelector } from './components/WeatherSelector';
import { VehicleSelectModal } from './components/VehicleSelectModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseMenuModal } from './components/PauseMenuModal';
import { sound } from './audio';
import { OnboardPassenger, TimeOfDayInfo, VehicleKey, WeatherKey, WeatherPreset } from './types';
import { WEATHER_PRESETS } from './weatherData';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<'menu' | 'play' | 'over'>('menu');
  const [currentVehicle, setCurrentVehicle] = useState<VehicleKey>('cab');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [money, setMoney] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [riders, setRiders] = useState<number>(0);
  const [capacity, setCapacity] = useState<number>(3);
  const [onboardPassengers, setOnboardPassengers] = useState<OnboardPassenger[]>([]);
  const [speed, setSpeed] = useState<number>(0);
  const [dist, setDist] = useState<number>(0);
  const [weather, setWeather] = useState<WeatherPreset>(WEATHER_PRESETS.sunny);
  const [timeInfo, setTimeInfo] = useState<TimeOfDayInfo | undefined>(undefined);
  const [isDayCycleActive, setIsDayCycleActive] = useState<boolean>(true);
  const [autoCycleWeather, setAutoCycleWeather] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraView, setCameraView] = useState<'chase' | 'hood'>('chase');
  const [wipersActive, setWipersActive] = useState<boolean>(false);
  const [headlightsOn, setHeadlightsOn] = useState<boolean>(true);
  const [showWeatherDrawer, setShowWeatherDrawer] = useState<boolean>(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('abujaBest3d')) || 0;
    } catch {
      return 0;
    }
  });

  const [gameOverStats, setGameOverStats] = useState<{
    money: number;
    dist: number;
    passengers: number;
    puddles: number;
    hawkers: number;
  } | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2200);
  }, []);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onMoneyChange: (newMoney) => {
        setMoney(newMoney);
        setBestScore((prev) => {
          if (newMoney > prev) {
            try {
              localStorage.setItem('abujaBest3d', String(newMoney));
            } catch {}
            return newMoney;
          }
          return prev;
        });
      },
      onLivesChange: (newLives) => setLives(newLives),
      onRidersChange: (newRiders, newCap) => {
        setRiders(newRiders);
        setCapacity(newCap);
      },
      onPassengersChange: (passengers, newCap) => {
        setOnboardPassengers(passengers);
        setCapacity(newCap);
      },
      onSpeedChange: (newSpeed) => setSpeed(newSpeed),
      onDistChange: (newDist) => setDist(newDist),
      onWeatherChange: (newWeather) => setWeather(newWeather),
      onTimeChange: (newTimeInfo) => setTimeInfo(newTimeInfo),
      onHeadlightsChange: (lightsOn) => setHeadlightsOn(lightsOn),
      onToast: (msg) => triggerToast(msg),
      onGameOver: (stats) => {
        setGameOverStats(stats);
        setGameState('over');
      },
    });

    engineRef.current = engine;
    engine.startAnimation();

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, [triggerToast]);

  // Touch Swipe Gesture for Lane Change
  const touchStartX = useRef<number | null>(null);
  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 30 && engineRef.current) {
      engineRef.current.steer(dx > 0 ? 1 : -1);
    }
  };

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const k = e.key;

      if (k === 'Escape' || k === 'p' || k === 'P') {
        if (gameState === 'play') {
          if (isMenuOpen) {
            handleContinue();
          } else {
            handleOpenMenu();
          }
        }
        return;
      }

      if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        engineRef.current.steer(-1);
      } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        engineRef.current.steer(1);
      } else if (k === 'ArrowDown' || k === 's' || k === 'S' || k === ' ') {
        engineRef.current.setBrake(true);
        e.preventDefault();
      } else if (k === 'h' || k === 'H') {
        engineRef.current.honkHorn();
      } else if (k === 'l' || k === 'L') {
        const nextState = engineRef.current.toggleHeadlights();
        setHeadlightsOn(nextState);
      } else if (k === 'w' || k === 'W') {
        const nextState = engineRef.current.toggleWipers();
        setWipersActive(nextState);
      } else if (k === 'c' || k === 'C') {
        const nextView = engineRef.current.toggleCameraView();
        setCameraView(nextView);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === ' ') {
        engineRef.current.setBrake(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isMenuOpen]);

  const handleStartGame = (vKey: VehicleKey) => {
    setCurrentVehicle(vKey);
    setGameState('play');
    setIsMenuOpen(false);
    engineRef.current?.startGame(vKey);
  };

  const handleOpenMenu = useCallback(() => {
    if (gameState !== 'play') return;
    engineRef.current?.pause();
    setIsMenuOpen(true);
  }, [gameState]);

  const handleContinue = useCallback(() => {
    engineRef.current?.resume();
    setIsMenuOpen(false);
  }, []);

  const handleRestart = useCallback((vKey?: VehicleKey) => {
    setIsMenuOpen(false);
    handleStartGame(vKey || currentVehicle);
  }, [currentVehicle]);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    triggerToast(muted ? 'Sound Muted' : 'Sound On');
  };

  const handleSelectWeather = (key: WeatherKey) => {
    engineRef.current?.setWeather(key);
  };

  const handleToggleAutoCycle = () => {
    if (engineRef.current) {
      const active = engineRef.current.toggleAutoCycleWeather();
      setAutoCycleWeather(active);
    }
  };

  const handleSetTimeOfDay = (hours: number) => {
    engineRef.current?.setTimeOfDay(hours);
  };

  const handleToggleDayCycle = () => {
    if (engineRef.current) {
      const active = engineRef.current.toggleDayCycle();
      setIsDayCycleActive(active);
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Three.js 3D Viewport */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Primary In-Game HUD */}
      {gameState === 'play' && (
        <GameHUD
          money={money}
          lives={lives}
          riders={riders}
          capacity={capacity}
          speed={speed}
          dist={dist}
          weather={weather}
          timeInfo={timeInfo}
          passengers={onboardPassengers}
          toastMsg={toastMsg}
          isMuted={isMuted}
          cameraView={cameraView}
          wipersActive={wipersActive}
          headlightsOn={headlightsOn}
          onOpenMenu={handleOpenMenu}
          onToggleMute={handleToggleMute}
          onToggleWeatherDrawer={() => setShowWeatherDrawer(true)}
          onToggleCamera={() => {
            if (engineRef.current) {
              setCameraView(engineRef.current.toggleCameraView());
            }
          }}
          onToggleWipers={() => {
            if (engineRef.current) {
              setWipersActive(engineRef.current.toggleWipers());
            }
          }}
          onToggleHeadlights={() => {
            if (engineRef.current) {
              setHeadlightsOn(engineRef.current.toggleHeadlights());
            }
          }}
          onHonk={() => engineRef.current?.honkHorn()}
          onSteerLeft={() => engineRef.current?.steer(-1)}
          onSteerRight={() => engineRef.current?.steer(1)}
          onBrakeStart={() => engineRef.current?.setBrake(true)}
          onBrakeEnd={() => engineRef.current?.setBrake(false)}
        />
      )}

      {/* In-Game Pause Menu Modal */}
      <PauseMenuModal
        isOpen={isMenuOpen}
        onContinue={handleContinue}
        onRestart={handleRestart}
        currentVehicle={currentVehicle}
        money={money}
        dist={dist}
        passengers={onboardPassengers}
        weather={weather}
        timeInfo={timeInfo}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenWeatherDrawer={() => setShowWeatherDrawer(true)}
      />

      {/* Dynamic Weather & Day-Night Drawer */}
      <WeatherSelector
        isOpen={showWeatherDrawer}
        onClose={() => setShowWeatherDrawer(false)}
        currentWeather={weather}
        onSelectWeather={handleSelectWeather}
        autoCycle={autoCycleWeather}
        onToggleAutoCycle={handleToggleAutoCycle}
        timeInfo={timeInfo}
        onSetTimeOfDay={handleSetTimeOfDay}
        isDayCycleActive={isDayCycleActive}
        onToggleDayCycle={handleToggleDayCycle}
      />

      {/* Start Game Modal */}
      {gameState === 'menu' && (
        <VehicleSelectModal
          bestScore={bestScore}
          onSelectVehicle={handleStartGame}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'over' && gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          bestScore={bestScore}
          onRestart={handleStartGame}
        />
      )}
    </div>
  );
}
