import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Sparkles, RotateCcw } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import type { Student } from '../../types';

const SEA_CREATURES = ['🐟', '🐠', '🐡', '🐢', '🐙', '🦀', '🐬', '🦈', '🦐'];

interface SwimmingFish {
  student: Student;
  emoji: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage in ocean (25% - 90%)
  speed: number;
  direction: 1 | -1; // 1: moving right, -1: moving left
  depthLayer: number;
  isHooked: boolean;
}

export const OceanFishing: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [fishes, setFishes] = useState<SwimmingFish[]>([]);
  const [isFishing, setIsFishing] = useState<boolean>(false);
  const [hookX, setHookX] = useState<number>(50); // percentage
  const [hookY, setHookY] = useState<number>(18); // percentage depth
  const [hookedFish, setHookedFish] = useState<SwimmingFish | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const addTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const clearAllTimers = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  // Populate swimming fish
  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setFishes([]);
      return;
    }

    const newFishes: SwimmingFish[] = availableStudents.map((s, idx) => {
      const creatureEmoji = SEA_CREATURES[idx % SEA_CREATURES.length];
      const dir = idx % 2 === 0 ? 1 : -1;
      const depthY = 28 + (idx % 6) * 10 + (Math.random() - 0.5) * 5;

      return {
        student: s,
        emoji: creatureEmoji,
        x: Math.random() * 85 + 5,
        y: Math.max(25, Math.min(88, depthY)),
        speed: 0.15 + (idx % 4) * 0.08,
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

  // Ambient swimming animation loop when idle
  useEffect(() => {
    let lastTime = performance.now();

    const ambientSwim = (now: number) => {
      const dt = (now - lastTime) / 16.66;
      lastTime = now;

      setFishes((prev) =>
        prev.map((f) => {
          if (f.isHooked) return f;
          let nx = f.x + f.speed * f.direction * dt * 0.4;
          let ndir = f.direction;

          if (nx > 95) {
            nx = 95;
            ndir = -1;
          } else if (nx < 5) {
            nx = 5;
            ndir = 1;
          }

          return {
            ...f,
            x: nx,
            direction: ndir,
          };
        })
      );

      animFrameRef.current = requestAnimationFrame(ambientSwim);
    };

    animFrameRef.current = requestAnimationFrame(ambientSwim);

    return () => {
      clearAllTimers();
    };
  }, []);

  const resetGame = () => {
    clearAllTimers();
    setIsFishing(false);
    setHookedFish(null);
    setHookX(50);
    setHookY(18);
  };

  const castFishingRod = () => {
    if (isFishing || fishes.length === 0) return;

    soundManager.playWaterSplash();
    setIsFishing(true);
    setHookedFish(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    // Pick target winning fish
    const targetIdx = Math.floor(Math.random() * fishes.length);
    const target = fishes[targetIdx];

    // Stage 1: Lower hook and search ocean
    const searchPhase = totalDuration * 0.65;

    const animateHook = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < searchPhase) {
        const progress = elapsed / searchPhase;
        // Hook lowers down and sweeps towards target fish's x
        const targetDepth = target.y;
        const currentHookDepth = 18 + (targetDepth - 18) * progress;
        const currentHookX = 50 + Math.sin(progress * Math.PI * 2) * 20 * (1 - progress) + (target.x - 50) * progress;

        setHookX(currentHookX);
        setHookY(currentHookDepth);

        animFrameRef.current = requestAnimationFrame(animateHook);
      } else {
        // Target Fish Bites Hook!
        soundManager.playTick(1300);
        setHookX(target.x);
        setHookY(target.y);

        const hookedFishState = { ...target, isHooked: true };
        setHookedFish(hookedFishState);

        setFishes((prev) =>
          prev.map((f) => (f.student.id === target.student.id ? { ...f, isHooked: true } : f))
        );

        // Shake line with bite struggle!
        soundManager.playWaterSplash();

        // Stage 2: Reel fish up to the boat!
        addTimeout(() => {
          const reelStartTime = performance.now();
          const reelDuration = 1200;

          const animateReel = (rt: number) => {
            const reelElapsed = rt - reelStartTime;
            const reelProgress = Math.min(reelElapsed / reelDuration, 1);
            const eased = Math.pow(reelProgress, 2);

            const reeledY = target.y - (target.y - 18) * eased;
            setHookY(reeledY);

            if (reelProgress < 1) {
              animFrameRef.current = requestAnimationFrame(animateReel);
            } else {
              // Pulled onto boat!
              soundManager.playFanfare();
              openWinnerModal(target.student, 'fishing');
              setIsFishing(false);
            }
          };

          animFrameRef.current = requestAnimationFrame(animateReel);
        }, 500);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateHook);
  };

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full select-none">
      {fishes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Control Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
              <span className="text-2xl">🎣</span>
              <span>Câu Cá Đại Dương: Thả dây câu xuống lòng biển sâu kéo chú cá trúng thưởng!</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={castFishingRod}
                disabled={isFishing}
                className={`px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                  isFishing
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white shadow-blue-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isFishing ? 'animate-spin' : ''}`} />
                <span>{isFishing ? 'ĐANG RÀ ĐÀN CÁ...' : 'THẢ CÂU NGAY'}</span>
              </button>

              {isFishing && (
                <button
                  onClick={resetGame}
                  className="p-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                  title="Dừng / Đặt lại"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Deep Ocean Stage */}
          <div className="relative w-full h-[66vh] min-h-[480px] rounded-3xl overflow-hidden border-4 border-cyan-700 shadow-2xl bg-gradient-to-b from-sky-400 via-blue-800 to-[#031333] flex flex-col justify-between">
            {/* Top 15%: Sea Surface with gentle waves & Wooden Fishing Boat */}
            <div className="relative h-20 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-500 border-b border-white/40 flex items-center justify-between px-8 z-30">
              {/* Wooden Boat at (hookX - 10%) */}
              <div
                className="absolute top-2 transform -translate-x-1/2 flex items-center gap-1 transition-all duration-150"
                style={{ left: `${hookX}%` }}
              >
                {/* Boat hull */}
                <div className="relative text-4xl sm:text-5xl filter drop-shadow animate-wobble">
                  ⛵
                </div>
                {/* Fisherman Character */}
                <div className="absolute -top-3 left-3 text-xl animate-bounce">
                  🐱
                </div>
              </div>

              {/* Water Wave ripples */}
              <div className="absolute inset-x-0 bottom-0 h-4 bg-white/20 backdrop-blur-sm rounded-t-full animate-pulse" />
            </div>

            {/* Ocean Depths: 85% */}
            <div className="relative flex-1 overflow-hidden">
              {/* Sunlight Rays piercing water from surface */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/10 via-transparent to-transparent pointer-events-none" />

              {/* Rising Air Bubbles */}
              <div className="absolute bottom-6 left-1/4 text-xs text-white/40 animate-float">🫧</div>
              <div className="absolute bottom-16 right-1/3 text-sm text-white/50 animate-bounce">🫧</div>
              <div className="absolute bottom-28 left-2/3 text-xs text-white/40 animate-pulse">🫧</div>

              {/* Fishing Line & Hook dropping down from boat */}
              <div
                className="absolute top-0 z-25 pointer-events-none transition-all duration-75"
                style={{
                  left: `${hookX}%`,
                  height: `${hookY}%`,
                }}
              >
                {/* Thin Fishing Line */}
                <div className="w-[1.5px] h-full bg-white/80 shadow-[0_0_4px_white] mx-auto" />
                {/* Metal Hook */}
                <div className="text-xl sm:text-2xl filter drop-shadow -mt-1 -ml-2 animate-wobble">
                  🪝
                </div>
              </div>

              {/* Swimming Fish (Students) */}
              {fishes.map((fish) => {
                const isBitten = hookedFish?.student.id === fish.student.id;
                // If hooked, fish vertical position follows the hook
                const currentY = isBitten ? hookY : fish.y;
                const currentX = isBitten ? hookX : fish.x;

                return (
                  <div
                    key={fish.student.id}
                    className={`absolute flex items-center gap-1.5 transition-all duration-75 transform -translate-x-1/2 -translate-y-1/2 ${
                      isBitten ? 'z-30 scale-125 ring-4 ring-amber-400 rounded-2xl p-1 bg-amber-400/20' : 'z-10'
                    }`}
                    style={{
                      left: `${currentX}%`,
                      top: `${currentY}%`,
                    }}
                  >
                    {/* Fish creature icon (flips with direction) */}
                    <span
                      className={`text-2xl sm:text-3xl filter drop-shadow select-none inline-block ${
                        fish.direction === -1 ? 'scale-x-[-1]' : 'scale-x-100'
                      } ${isBitten ? 'animate-bounce' : ''}`}
                    >
                      {fish.emoji}
                    </span>

                    {/* Student Name Pill */}
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-md border whitespace-nowrap ${
                        isBitten
                          ? 'bg-amber-400 text-slate-950 border-white text-sm shadow-[0_0_15px_#f59e0b]'
                          : 'bg-slate-900/80 text-cyan-200 border-cyan-500/40'
                      }`}
                    >
                      {fish.student.name}
                    </div>
                  </div>
                );
              })}

              {/* Bottom Seaweed Bed & Sandy Floor */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#020b1c] to-transparent pointer-events-none flex justify-around items-end px-4">
                <span className="text-3xl animate-wobble opacity-70">🌿</span>
                <span className="text-4xl animate-wobble opacity-60" style={{ animationDelay: '0.4s' }}>
                  🪸
                </span>
                <span className="text-3xl animate-wobble opacity-70" style={{ animationDelay: '0.8s' }}>
                  🌿
                </span>
                <span className="text-4xl animate-wobble opacity-60" style={{ animationDelay: '0.2s' }}>
                  🪸
                </span>
                <span className="text-3xl animate-wobble opacity-70" style={{ animationDelay: '0.6s' }}>
                  🌿
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
