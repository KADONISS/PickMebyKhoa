import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';
import type { Student } from '../../types';

const SEA_CREATURES = ['🐟', '🐠', '🐡', '🐢', '🐙', '🦀', '🐬', '🦈', '🦐'];

interface SwimmingFish {
  student: Student;
  emoji: string;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  depthLayer: number;
  isHooked: boolean;
}

export const OceanFishing: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [fishes, setFishes] = useState<SwimmingFish[]>([]);
  const [isFishing, setIsFishing] = useState<boolean>(false);
  const [hookX, setHookX] = useState<number>(50);
  const [hookY, setHookY] = useState<number>(18);
  const [hookedFish, setHookedFish] = useState<SwimmingFish | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const addTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const clearAllTimers = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setFishes([]);
      return;
    }

    const newFishes: SwimmingFish[] = availableStudents.map((s, idx) => {
      const creatureEmoji = SEA_CREATURES[idx % SEA_CREATURES.length];
      const dir = idx % 2 === 0 ? 1 : -1;
      const depthY = 26 + (idx % 6) * 10 + (Math.random() - 0.5) * 4;

      return {
        student: s,
        emoji: creatureEmoji,
        x: Math.random() * 84 + 8,
        y: Math.max(24, Math.min(84, depthY)),
        speed: 0.14 + (idx % 4) * 0.07,
        direction: dir,
        depthLayer: idx % 3,
        isHooked: false,
      };
    });

    setFishes(newFishes);
    setIsFishing(false);
    setHookedFish(null);
    setHookX(50);
    setHookY(18);
  }, [availableStudents]);

  // Ambient swimming loop
  useEffect(() => {
    let lastTime = performance.now();
    let swimRaf: number;

    const ambientSwim = (now: number) => {
      const dt = (now - lastTime) / 16.66;
      lastTime = now;

      setFishes((prev) =>
        prev.map((f) => {
          if (f.isHooked) return f;
          let nx = f.x + f.speed * f.direction * dt * 0.4;
          let ndir = f.direction;

          if (nx > 93) {
            nx = 93;
            ndir = -1;
          } else if (nx < 7) {
            nx = 7;
            ndir = 1;
          }

          return {
            ...f,
            x: nx,
            direction: ndir,
          };
        })
      );

      swimRaf = requestAnimationFrame(ambientSwim);
    };

    swimRaf = requestAnimationFrame(ambientSwim);

    return () => {
      cancelAnimationFrame(swimRaf);
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setIsFishing(false);
    setHookedFish(null);
    setHookX(50);
    setHookY(18);
    setFishes((prev) => prev.map((f) => ({ ...f, isHooked: false })));
  }, [clearAllTimers]);

  const castFishingRod = useCallback(() => {
    if (isFishing || fishes.length === 0) return;

    clearAllTimers();
    soundManager.playWaterSplash();
    setIsFishing(true);
    setHookedFish(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    const targetIdx = Math.floor(Math.random() * fishes.length);
    const target = fishes[targetIdx];
    const searchPhase = totalDuration * 0.65;

    const animateHook = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < searchPhase) {
        const progress = elapsed / searchPhase;
        const targetDepth = target.y;
        const currentHookDepth = 18 + (targetDepth - 18) * progress;
        const currentHookX =
          50 + Math.sin(progress * Math.PI * 2) * 20 * (1 - progress) + (target.x - 50) * progress;

        setHookX(currentHookX);
        setHookY(currentHookDepth);

        animFrameRef.current = requestAnimationFrame(animateHook);
      } else {
        soundManager.playTick(1300);
        setHookX(target.x);
        setHookY(target.y);

        const hookedFishState = { ...target, isHooked: true };
        setHookedFish(hookedFishState);

        setFishes((prev) =>
          prev.map((f) => (f.student.id === target.student.id ? { ...f, isHooked: true } : f))
        );

        soundManager.playWaterSplash();

        addTimeout(() => {
          const reelStartTime = performance.now();
          const reelDuration = 1150;

          const animateReel = (rt: number) => {
            const reelElapsed = rt - reelStartTime;
            const reelProgress = Math.min(reelElapsed / reelDuration, 1);
            const eased = Math.pow(reelProgress, 2);

            const reeledY = target.y - (target.y - 18) * eased;
            setHookY(reeledY);

            if (reelProgress < 1) {
              animFrameRef.current = requestAnimationFrame(animateReel);
            } else {
              soundManager.playFanfare();
              openWinnerModal(target.student, 'fishing');
              setIsFishing(false);
            }
          };

          animFrameRef.current = requestAnimationFrame(animateReel);
        }, 480);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateHook);
  }, [isFishing, fishes, gameSpeed, clearAllTimers, openWinnerModal]);

  return (
    <GameStageHUD
      gameId="fishing"
      subtitle="Câu Cá Đại Dương: Thả dây câu xuống lòng biển sâu kéo chú cá trúng thưởng!"
      isRunning={isFishing}
      actionLabel="THẢ CÂU NGAY"
      runningLabel="ĐANG RÀ ĐÀN CÁ..."
      actionGradient="from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white"
      onPrimaryAction={castFishingRod}
      onReset={resetGame}
    >
      {/* Deep Ocean Stage */}
      <div className="relative w-full h-[62vh] min-h-[460px] rounded-3xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl bg-gradient-to-b from-sky-400 via-blue-800 to-[#031333] flex flex-col justify-between">
        {/* Sea Surface & Wooden Boat */}
        <div className="relative h-20 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-500 border-b-2 border-white/50 flex items-center justify-between px-8 z-30">
          <div
            className="absolute top-2 transform -translate-x-1/2 flex items-center gap-1 transition-all duration-150"
            style={{ left: `${hookX}%` }}
          >
            <div className="relative text-4xl sm:text-5xl filter drop-shadow animate-wobble">
              ⛵
            </div>
            <div className="absolute -top-3 left-3 text-xl animate-bounce">🐱</div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-4 bg-white/25 backdrop-blur-sm rounded-t-full animate-pulse" />
        </div>

        {/* Ocean Depths */}
        <div className="relative flex-1 overflow-hidden">
          {/* Sunlight Rays piercing water */}
          <div
            className="absolute -top-8 left-1/4 w-44 h-full bg-gradient-to-b from-cyan-200/20 to-transparent transform -skew-x-12 pointer-events-none"
          />
          <div
            className="absolute -top-8 right-1/3 w-32 h-full bg-gradient-to-b from-sky-200/15 to-transparent transform skew-x-12 pointer-events-none"
          />

          {/* Rising Air Bubbles */}
          <div className="absolute bottom-8 left-1/4 text-sm text-white/60 animate-float">🫧</div>
          <div className="absolute bottom-20 right-1/3 text-base text-white/65 animate-bounce">🫧</div>
          <div className="absolute bottom-32 left-2/3 text-sm text-white/55 animate-pulse">🫧</div>

          {/* Fishing Line & Hook */}
          <div
            className="absolute top-0 z-25 pointer-events-none transition-all duration-75"
            style={{ left: `${hookX}%`, height: `${hookY}%` }}
          >
            <div className="w-[2px] h-full bg-white/90 shadow-[0_0_6px_white] mx-auto" />
            <div className="text-2xl filter drop-shadow -mt-1 -ml-2 animate-wobble">🪝</div>
          </div>

          {/* Swimming Fish (Students) */}
          {fishes.map((fish) => {
            const isBitten = hookedFish?.student.id === fish.student.id;
            const currentY = isBitten ? hookY : fish.y;
            const currentX = isBitten ? hookX : fish.x;

            return (
              <div
                key={fish.student.id}
                className={`absolute flex items-center gap-1.5 transition-all duration-75 transform -translate-x-1/2 -translate-y-1/2 ${
                  isBitten
                    ? 'z-30 scale-125 ring-4 ring-amber-400 rounded-2xl p-1.5 bg-amber-400/25'
                    : 'z-10'
                }`}
                style={{ left: `${currentX}%`, top: `${currentY}%` }}
              >
                <span
                  className={`text-2xl sm:text-3xl filter drop-shadow select-none inline-block ${
                    fish.direction === -1 ? 'scale-x-[-1]' : 'scale-x-100'
                  } ${isBitten ? 'animate-bounce' : ''}`}
                >
                  {fish.emoji}
                </span>

                <div
                  className={`px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black shadow-md border whitespace-nowrap ${
                    isBitten
                      ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_18px_#f59e0b]'
                      : 'bg-slate-950/85 text-cyan-100 border-cyan-400/50'
                  }`}
                >
                  {fish.student.name}
                </div>
              </div>
            );
          })}

          {/* Seaweed Bed & Coral Floor */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#020b1c] to-transparent pointer-events-none flex justify-around items-end px-4">
            <span className="text-3xl animate-wobble opacity-80">🌿</span>
            <span className="text-4xl animate-wobble opacity-75" style={{ animationDelay: '0.4s' }}>
              🪸
            </span>
            <span className="text-3xl animate-wobble opacity-80" style={{ animationDelay: '0.8s' }}>
              🌿
            </span>
            <span className="text-4xl animate-wobble opacity-75" style={{ animationDelay: '0.2s' }}>
              🪸
            </span>
            <span className="text-3xl animate-wobble opacity-80" style={{ animationDelay: '0.6s' }}>
              🌿
            </span>
          </div>
        </div>
      </div>
    </GameStageHUD>
  );
};
