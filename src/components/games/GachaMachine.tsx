import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { WHEEL_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';
import type { Student } from '../../types';

interface CapsuleBall {
  student: Student;
  topColor: string;
  x: number;
  y: number;
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

  const clearAllTimers = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  // Populate capsule balls inside glass sphere
  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setCapsules([]);
      return;
    }

    const newCapsules: CapsuleBall[] = availableStudents.map((s, idx) => {
      const angle = (Math.PI * 2 * idx) / total;
      const dist = Math.random() * 32;
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
  }, [clearAllTimers]);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setIsCranking(false);
    setCrankAngle(0);
    setDispensedCapsule(null);
    setCapsulePhase('hidden');
  }, [clearAllTimers]);

  const crankGacha = useCallback(() => {
    if (isCranking || capsules.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsCranking(true);
    setDispensedCapsule(null);
    setCapsulePhase('hidden');

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    const winningIdx = Math.floor(Math.random() * capsules.length);
    const chosenCapsule = capsules[winningIdx];
    let lastCrankClickTime = 0;

    const animateCrank = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / totalDuration;

      const currentRot = (elapsed * 0.72) % 360;
      setCrankAngle(currentRot);

      if (currentTime - lastCrankClickTime > 200) {
        soundManager.playGachaCrank();
        lastCrankClickTime = currentTime;
      }

      setCapsules((prev) =>
        prev.map((c) => {
          let nx = c.x + (Math.random() - 0.5) * 7;
          let ny = c.y + (Math.random() - 0.5) * 7;

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
        soundManager.playTick(1100);
        setDispensedCapsule(chosenCapsule);
        setCapsulePhase('rolling');

        addTimeout(() => {
          setCapsulePhase('opening');
          soundManager.playChestOpen();

          addTimeout(() => {
            setCapsulePhase('revealed');
            soundManager.playFanfare();

            addTimeout(() => {
              openWinnerModal(chosenCapsule.student, 'gacha');
              setIsCranking(false);
            }, 650);
          }, 550);
        }, 750);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateCrank);
  }, [isCranking, capsules, gameSpeed, clearAllTimers, openWinnerModal]);

  return (
    <GameStageHUD
      gameId="gacha"
      subtitle="Nhấp vào tay vặn vàng hoặc bấm SPACE để xóc nảy lồng kính Gashapon!"
      isRunning={isCranking}
      actionLabel="VẶN GACHA NGAY"
      runningLabel="ĐANG QUAY GACHA..."
      actionGradient="from-red-500 via-rose-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white"
      onPrimaryAction={crankGacha}
      onReset={resetGame}
    >
      {/* Gacha Machine Arena */}
      <div className="relative w-full h-[62vh] min-h-[460px] rounded-3xl overflow-hidden border-2 border-rose-500/40 bg-gradient-to-b from-[#1a0a16] via-[#111827] to-[#090d16] shadow-2xl flex flex-col items-center justify-center p-4">
        <div className="absolute w-[480px] h-[480px] bg-gradient-to-tr from-rose-500/20 via-amber-400/20 to-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Main Gacha Machine Physical Structure */}
        <div className="relative flex flex-col items-center">
          {/* Top Glass Globe Dome */}
          <div className="relative w-64 sm:w-80 h-64 sm:h-80 rounded-full border-[6px] border-white/75 bg-gradient-to-b from-white/25 via-cyan-300/15 to-white/10 backdrop-blur-md shadow-[0_0_55px_rgba(255,255,255,0.28)] flex items-center justify-center overflow-hidden z-10">
            {/* Curved Glass Highlight */}
            <div className="absolute top-5 left-9 w-24 h-12 rounded-full bg-white/45 blur-[1px] transform -rotate-45 pointer-events-none" />

            {/* Tumbling Capsule Balls */}
            {capsules.map((ball) => (
              <div
                key={ball.student.id}
                className="absolute w-11 sm:w-12 h-11 sm:h-12 rounded-full border-2 border-white shadow-lg flex flex-col overflow-hidden pointer-events-none transition-transform"
                style={{
                  left: `calc(${ball.x}% - 22px)`,
                  top: `calc(${ball.y}% - 22px)`,
                  transform: `rotate(${ball.rot}deg)`,
                }}
              >
                <div
                  className="w-full h-1/2 flex items-center justify-center text-xs"
                  style={{ backgroundColor: ball.topColor }}
                >
                  <span className="opacity-95">{ball.student.avatarEmoji || '⭐'}</span>
                </div>
                <div className="w-full h-1/2 bg-white border-t border-slate-300" />
              </div>
            ))}
          </div>

          {/* Bottom Gacha Machine Body */}
          <div className="relative w-72 sm:w-88 h-48 sm:h-52 -mt-10 bg-gradient-to-b from-red-600 via-rose-600 to-red-700 rounded-3xl border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-between p-4 z-20">
            <div className="w-full flex items-center justify-between px-3">
              <span className="w-3 h-3 rounded-full bg-yellow-300 animate-ping" />
              <span className="text-amber-200 font-black text-xs sm:text-sm uppercase tracking-widest projector-text">
                ★ GASHAPON HOÀNG GIA ★
              </span>
              <span className="w-3 h-3 rounded-full bg-yellow-300 animate-ping" />
            </div>

            {/* Central Rotating Crank Wheel */}
            <button
              onClick={!isCranking ? crankGacha : undefined}
              disabled={isCranking}
              aria-label="Vặn tay quay Gacha"
              className="relative w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border-4 border-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              style={{ transform: `rotate(${crankAngle}deg)` }}
              title="Nhấp để quay Gacha!"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-white z-10" />
              <div className="absolute w-full h-4 bg-amber-400 border-y border-amber-600 rounded-full" />
              <div className="absolute h-full w-4 bg-amber-400 border-x border-amber-600 rounded-full" />
            </button>

            {/* Prize Dispenser Flap Hatch */}
            <div className="relative w-32 sm:w-36 h-10 bg-slate-900 border-2 border-amber-300 rounded-t-xl flex items-center justify-center shadow-inner">
              <span className="text-xs font-black text-amber-300 tracking-wider">
                CỬA NHẢ BÓNG ⬇
              </span>
            </div>
          </div>
        </div>

        {/* Dispensed Capsule Animation Overlay */}
        {dispensedCapsule && capsulePhase !== 'hidden' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
            <div className="relative flex flex-col items-center transform transition-all duration-500 scale-125 sm:scale-150">
              {capsulePhase === 'opening' && (
                <div className="absolute w-64 h-64 bg-amber-300 rounded-full blur-2xl animate-ping opacity-80" />
              )}

              <div className="relative flex flex-col items-center">
                <div
                  className={`w-32 h-16 rounded-t-full border-2 border-white shadow-2xl transition-all duration-500 flex items-center justify-center ${
                    capsulePhase === 'revealed'
                      ? 'transform -translate-y-8 -rotate-12'
                      : 'transform translate-y-0'
                  }`}
                  style={{ backgroundColor: dispensedCapsule.topColor }}
                >
                  <span className="text-3xl filter drop-shadow">
                    {dispensedCapsule.student.avatarEmoji || '👑'}
                  </span>
                </div>

                {capsulePhase === 'revealed' && (
                  <div className="my-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xl sm:text-2xl shadow-2xl border-2 border-white animate-bounce-slight text-center">
                    <div>{dispensedCapsule.student.name}</div>
                  </div>
                )}

                <div
                  className={`w-32 h-16 rounded-b-full bg-white border-2 border-slate-300 shadow-2xl transition-all duration-500 flex items-center justify-center ${
                    capsulePhase === 'revealed'
                      ? 'transform translate-y-8 rotate-12'
                      : 'transform translate-y-0'
                  }`}
                >
                  <span className="text-xs font-black text-slate-600">GACHA WINNER</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameStageHUD>
  );
};
