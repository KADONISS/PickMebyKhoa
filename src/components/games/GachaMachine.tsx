import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { WHEEL_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Sparkles, RotateCcw } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import type { Student } from '../../types';

interface CapsuleBall {
  student: Student;
  topColor: string;
  x: number; // percentage in sphere
  y: number; // percentage in sphere
  vx: number;
  vy: number;
  rot: number;
}

export const GachaMachine: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [capsules, setCapsules] = useState<CapsuleBall[]>([]);
  const [isCranking, setIsCranking] = useState<boolean>(false);
  const [crankAngle, setCrankAngle] = useState<number>(0);
  const [dispensedCapsule, setDispensedCapsule] = useState<CapsuleBall | null>(null);
  const [capsulePhase, setCapsulePhase] = useState<'hidden' | 'rolling' | 'opening' | 'revealed'>('hidden');

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

  // Populate capsule balls inside glass sphere
  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setCapsules([]);
      return;
    }

    const newCapsules: CapsuleBall[] = availableStudents.map((s, idx) => {
      const angle = (Math.PI * 2 * idx) / total;
      const dist = Math.random() * 32; // stay inside globe
      return {
        student: s,
        topColor: s.color || WHEEL_COLORS[idx % WHEEL_COLORS.length],
        x: 50 + Math.cos(angle) * dist,
        y: 52 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        rot: Math.random() * 360,
      };
    });

    setCapsules(newCapsules);
    setIsCranking(false);
    setCrankAngle(0);
    setDispensedCapsule(null);
    setCapsulePhase('hidden');
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const resetGame = () => {
    clearAllTimers();
    setIsCranking(false);
    setCrankAngle(0);
    setDispensedCapsule(null);
    setCapsulePhase('hidden');
  };

  const crankGacha = () => {
    if (isCranking || capsules.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsCranking(true);
    setDispensedCapsule(null);
    setCapsulePhase('hidden');

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    // Pick target winner
    const winningIdx = Math.floor(Math.random() * capsules.length);
    const chosenCapsule = capsules[winningIdx];

    // Shake and bounce physics inside globe
    let lastCrankClickTime = 0;

    const animateCrank = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / totalDuration;

      // Rotate crank
      const currentRot = (elapsed * 0.72) % 360;
      setCrankAngle(currentRot);

      // Play crank ratchet sound every ~200ms
      if (currentTime - lastCrankClickTime > 200) {
        soundManager.playGachaCrank();
        lastCrankClickTime = currentTime;
      }

      // Chaotic bouncing simulation for capsules inside globe
      setCapsules((prev) =>
        prev.map((c) => {
          let nx = c.x + (Math.random() - 0.5) * 7;
          let ny = c.y + (Math.random() - 0.5) * 7;

          // Keep within radius of ~40 from (50, 50)
          const dx = nx - 50;
          const dy = ny - 50;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 38) {
            nx = 50 + (dx / dist) * 36;
            ny = 50 + (dy / dist) * 36;
          }

          return {
            ...c,
            x: nx,
            y: ny,
            rot: (c.rot + 15) % 360,
          };
        })
      );

      if (progress < 0.75) {
        animFrameRef.current = requestAnimationFrame(animateCrank);
      } else {
        // Crank completes: Dispense capsule!
        soundManager.playTick(1100);
        setDispensedCapsule(chosenCapsule);
        setCapsulePhase('rolling');

        // Roll out and scale up in center
        addTimeout(() => {
          setCapsulePhase('opening');
          soundManager.playChestOpen();

          // Split open and reveal winner!
          addTimeout(() => {
            setCapsulePhase('revealed');
            soundManager.playFanfare();

            addTimeout(() => {
              openWinnerModal(chosenCapsule.student, 'gacha');
              setIsCranking(false);
            }, 600);
          }, 600);
        }, 800);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateCrank);
  };

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full select-none">
      {capsules.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Control Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
              <span className="text-2xl">🎰</span>
              <span>Máy Quay Gacha: Vặn núm cạch cạch, viên nang xóc nảy rồi tách đôi phát sáng!</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={crankGacha}
                disabled={isCranking}
                className={`px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                  isCranking
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white shadow-rose-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isCranking ? 'animate-spin' : ''}`} />
                <span>{isCranking ? 'ĐANG QUAY GACHA...' : 'VẶN GACHA NGAY'}</span>
              </button>

              {isCranking && (
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

          {/* Gacha Machine Arena */}
          <div className="relative w-full h-[66vh] min-h-[480px] rounded-3xl overflow-hidden border-4 border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl flex flex-col items-center justify-center p-4">
            {/* Ambient Backlight Glow */}
            <div className="absolute w-[450px] h-[450px] bg-gradient-to-tr from-rose-500/20 via-amber-400/20 to-red-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Main Gacha Machine Physical Structure */}
            <div className="relative flex flex-col items-center">
              {/* Top Glass Globe Dome */}
              <div className="relative w-64 sm:w-80 h-64 sm:h-80 rounded-full border-6 border-white/60 bg-gradient-to-b from-white/20 via-cyan-300/10 to-white/10 backdrop-blur-md shadow-[0_0_50px_rgba(255,255,255,0.25)] flex items-center justify-center overflow-hidden z-10">
                {/* Curved Glass Highlight */}
                <div className="absolute top-4 left-8 w-20 h-10 rounded-full bg-white/40 blur-[1px] transform -rotate-45" />

                {/* Tumbling Capsule Balls inside globe */}
                {capsules.map((ball) => (
                  <div
                    key={ball.student.id}
                    className="absolute w-10 sm:w-12 h-10 sm:h-12 rounded-full border border-white shadow-md flex flex-col overflow-hidden pointer-events-none transition-transform"
                    style={{
                      left: `calc(${ball.x}% - 22px)`,
                      top: `calc(${ball.y}% - 22px)`,
                      transform: `rotate(${ball.rot}deg)`,
                    }}
                  >
                    {/* Top Hemisphere (Color) */}
                    <div
                      className="w-full h-1/2 flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: ball.topColor }}
                    >
                      <span className="opacity-90">{ball.student.avatarEmoji || '⭐'}</span>
                    </div>
                    {/* Bottom Hemisphere (White/Translucent) */}
                    <div className="w-full h-1/2 bg-white/95 border-t border-slate-300" />
                  </div>
                ))}
              </div>

              {/* Bottom Gacha Machine Body (Vibrant Red & Gold Cabinet) */}
              <div className="relative w-72 sm:w-88 h-48 sm:h-52 -mt-10 bg-gradient-to-b from-red-600 via-rose-600 to-red-700 rounded-3xl border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-between p-4 z-20">
                {/* Machine Header Trim */}
                <div className="w-full flex items-center justify-between px-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
                  <span className="text-amber-200 font-black text-xs uppercase tracking-widest drop-shadow">
                    ★ GASHAPON HOÀNG GIA ★
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
                </div>

                {/* Central Rotating Crank Wheel */}
                <div
                  onClick={!isCranking ? crankGacha : undefined}
                  className="relative w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border-4 border-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  style={{ transform: `rotate(${crankAngle}deg)` }}
                  title="Nhấp để quay Gacha!"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-white" />
                  {/* Crank handle wings */}
                  <div className="absolute w-full h-4 bg-amber-400 border-y border-amber-600 rounded-full" />
                  <div className="absolute h-full w-4 bg-amber-400 border-x border-amber-600 rounded-full" />
                </div>

                {/* Prize Dispenser Flap Hatch at Bottom */}
                <div className="relative w-28 sm:w-32 h-10 bg-slate-900 border-2 border-amber-300 rounded-t-xl flex items-center justify-center shadow-inner">
                  <span className="text-[10px] font-black text-amber-300 tracking-wider">
                    CỬA NHẢ BÓNG ⬇
                  </span>
                </div>
              </div>
            </div>

            {/* Dispensed Capsule Animation Overlay (Rolling out & Opening) */}
            {dispensedCapsule && capsulePhase !== 'hidden' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
                {/* Capsule in Center */}
                <div className="relative flex flex-col items-center transform transition-all duration-500 scale-125 sm:scale-150">
                  {/* Glowing Flash effect when opening */}
                  {capsulePhase === 'opening' && (
                    <div className="absolute w-60 h-60 bg-amber-300 rounded-full blur-2xl animate-ping opacity-80" />
                  )}

                  {/* Split Capsule Parts */}
                  <div className="relative flex flex-col items-center">
                    {/* Top Shell */}
                    <div
                      className={`w-28 h-14 rounded-t-full border-2 border-white shadow-2xl transition-all duration-500 flex items-center justify-center ${
                        capsulePhase === 'revealed'
                          ? 'transform -translate-y-8 -rotate-15'
                          : 'transform translate-y-0'
                      }`}
                      style={{ backgroundColor: dispensedCapsule.topColor }}
                    >
                      <span className="text-2xl filter drop-shadow">
                        {dispensedCapsule.student.avatarEmoji || '👑'}
                      </span>
                    </div>

                    {/* Content inside revealed capsule */}
                    {capsulePhase === 'revealed' && (
                      <div className="my-2 px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-lg sm:text-xl shadow-2xl border-2 border-white animate-bounce-slight text-center">
                        <div>{dispensedCapsule.student.name}</div>
                      </div>
                    )}

                    {/* Bottom Shell */}
                    <div
                      className={`w-28 h-14 rounded-b-full bg-white border-2 border-slate-300 shadow-2xl transition-all duration-500 flex items-center justify-center ${
                        capsulePhase === 'revealed'
                          ? 'transform translate-y-8 rotate-15'
                          : 'transform translate-y-0'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-400">GACHA WINNER</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
