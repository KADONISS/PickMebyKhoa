import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';

export const HotPotato: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [activeBombIndex, setActiveBombIndex] = useState<number | null>(null);
  const [isPassing, setIsPassing] = useState<boolean>(false);
  const [explodedIndex, setExplodedIndex] = useState<number | null>(null);

  const timeoutsRef = useRef<number[]>([]);

  const addTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    setIsPassing(false);
    setActiveBombIndex(null);
    setExplodedIndex(null);
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setIsPassing(false);
    setActiveBombIndex(null);
    setExplodedIndex(null);
  }, [clearAllTimers]);

  const startPassingBomb = useCallback(() => {
    if (isPassing || availableStudents.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsPassing(true);
    setExplodedIndex(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();
    const studentsCount = availableStudents.length;

    const winningIdx = Math.floor(Math.random() * studentsCount);
    let currentIdx = Math.floor(Math.random() * studentsCount);

    const passCycle = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / totalDuration;
      const urgency = Math.min(1, progress);

      soundManager.playBombTick(urgency);

      let nextIdx = Math.floor(Math.random() * studentsCount);
      if (studentsCount > 1 && nextIdx === currentIdx) {
        nextIdx = (nextIdx + 1) % studentsCount;
      }
      currentIdx = nextIdx;
      setActiveBombIndex(currentIdx);

      if (progress < 0.8) {
        const nextDelay = Math.max(75, 260 - Math.pow(progress / 0.8, 1.8) * 185);
        addTimeout(passCycle, nextDelay);
      } else if (progress < 0.98) {
        const finalDelay = 220 + Math.pow((progress - 0.8) / 0.18, 2) * 320;
        addTimeout(passCycle, finalDelay);
      } else {
        setActiveBombIndex(winningIdx);
        setExplodedIndex(winningIdx);
        soundManager.playBalloonPop();

        addTimeout(() => {
          soundManager.playFanfare();
          openWinnerModal(availableStudents[winningIdx], 'bomb');
          setIsPassing(false);
        }, 600);
      }
    };

    passCycle();
  }, [isPassing, availableStudents, gameSpeed, clearAllTimers, openWinnerModal]);

  const getGridColsClass = () => {
    const total = availableStudents.length;
    if (total <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (total <= 12) return 'grid-cols-3 sm:grid-cols-4';
    if (total <= 20) return 'grid-cols-4 sm:grid-cols-5';
    if (total <= 30) return 'grid-cols-5 sm:grid-cols-6';
    if (total <= 40) return 'grid-cols-6 sm:grid-cols-8';
    return 'grid-cols-6 sm:grid-cols-9';
  };

  return (
    <GameStageHUD
      gameId="bomb"
      subtitle="Bom Pháo Giấy bén ngòi nhảy chuyền tốc độ — bùng nổ kẹo ngọt bất ngờ!"
      isRunning={isPassing}
      actionLabel="CHÂM NGÒI CHUYỀN BOM"
      runningLabel="BOM ĐANG CHUYỀN..."
      actionGradient="from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white"
      onPrimaryAction={startPassingBomb}
      onReset={resetGame}
    >
      {/* Adaptive Viewport Card Grid Arena */}
      <div className="relative w-full h-[62vh] min-h-[450px] rounded-3xl overflow-hidden border-2 border-rose-500/40 bg-gradient-to-b from-[#1b0b1e] via-[#111827] to-[#090d16] shadow-2xl p-4 sm:p-5 flex flex-col justify-center">
        {/* Party Heat Glow */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            isPassing ? 'opacity-100' : 'opacity-40'
          }`}
          style={{
            background:
              'radial-gradient(circle at center, rgba(244, 63, 94, 0.16) 0%, transparent 70%)',
          }}
        />

        <div className={`relative grid gap-2.5 sm:gap-3 w-full h-full content-center ${getGridColsClass()}`}>
          {availableStudents.map((student, idx) => {
            const hasBomb = activeBombIndex === idx;
            const isExploded = explodedIndex === idx;

            return (
              <div
                key={student.id}
                className={`relative rounded-2xl p-2 sm:p-2.5 border-2 transition-all duration-100 flex flex-col items-center justify-center text-center shadow-lg select-none transform ${
                  isExploded
                    ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 border-white scale-110 z-30 shadow-[0_0_35px_rgba(244,63,94,0.9)]'
                    : hasBomb
                    ? 'bg-gradient-to-tr from-rose-600/70 via-amber-500/60 to-orange-500/70 border-amber-300 scale-105 z-20 animate-shake shadow-[0_0_24px_rgba(245,158,11,0.85)]'
                    : 'bg-slate-800/85 border-slate-700/90'
                }`}
              >
                {/* Festive Party Bomb Badge */}
                {hasBomb && !isExploded && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-2xl sm:text-3xl filter drop-shadow animate-bounce z-30">
                    <span>💣</span>
                    <span className="text-lg animate-ping">✨</span>
                  </div>
                )}

                {/* Confetti Explosion Badge */}
                {isExploded && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-3xl sm:text-4xl animate-bounce z-30">
                    <span>🎊</span>
                    <span>💥</span>
                  </div>
                )}

                {/* Avatar Emoji */}
                <span
                  className={`text-2xl sm:text-3xl filter drop-shadow transition-transform ${
                    hasBomb ? 'scale-125' : ''
                  }`}
                >
                  {student.avatarEmoji || '⭐'}
                </span>

                {/* Student Name (High Contrast) */}
                <span
                  className={`font-black text-xs sm:text-sm truncate max-w-full px-1 mt-1 projector-text ${
                    isExploded
                      ? 'text-white text-sm sm:text-base'
                      : hasBomb
                      ? 'text-amber-100'
                      : 'text-slate-100'
                  }`}
                >
                  {student.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GameStageHUD>
  );
};
