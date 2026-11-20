import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Sparkles, RotateCcw } from 'lucide-react';
import { EmptyState } from '../EmptyState';

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

  const clearAllTimers = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    setIsPassing(false);
    setActiveBombIndex(null);
    setExplodedIndex(null);
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const resetGame = () => {
    clearAllTimers();
    setIsPassing(false);
    setActiveBombIndex(null);
    setExplodedIndex(null);
  };

  const startPassingBomb = () => {
    if (isPassing || availableStudents.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsPassing(true);
    setExplodedIndex(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();
    const studentsCount = availableStudents.length;

    // Pre-determine winner
    const winningIdx = Math.floor(Math.random() * studentsCount);
    let currentIdx = Math.floor(Math.random() * studentsCount);

    const passCycle = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / totalDuration;

      // Calculate urgency from 0.0 to 1.0
      const urgency = Math.min(1, progress);

      // Play tick sound with rising pitch
      soundManager.playBombTick(urgency);

      // Pick next student card (different from current)
      let nextIdx = Math.floor(Math.random() * studentsCount);
      if (studentsCount > 1 && nextIdx === currentIdx) {
        nextIdx = (nextIdx + 1) % studentsCount;
      }
      currentIdx = nextIdx;
      setActiveBombIndex(currentIdx);

      if (progress < 0.8) {
        // Accelerating phase: delay decreases from ~260ms down to ~75ms
        const nextDelay = Math.max(75, 260 - Math.pow(progress / 0.8, 1.8) * 185);
        addTimeout(passCycle, nextDelay);
      } else if (progress < 0.98) {
        // Dramatic final decelerating beats (2-3 tense slow ticks)
        const finalDelay = 220 + Math.pow((progress - 0.8) / 0.18, 2) * 320;
        addTimeout(passCycle, finalDelay);
      } else {
        // Detonation on final winner!
        setActiveBombIndex(winningIdx);
        setExplodedIndex(winningIdx);
        soundManager.playBalloonPop();

        addTimeout(() => {
          soundManager.playFanfare();
          openWinnerModal(availableStudents[winningIdx], 'bomb');
          setIsPassing(false);
        }, 550);
      }
    };

    passCycle();
  };

  // Adaptive Grid configuration so up to 45 students fit on one single 16:9 screen
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
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full select-none">
      {availableStudents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Control Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
              <span className="text-2xl animate-bounce-slight">💣</span>
              <span>Chuyền Bom Pháo Giấy: Bom xẹt lửa chuyền dồn dập, bùng nổ thẻ học sinh!</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={startPassingBomb}
                disabled={isPassing}
                className={`px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                  isPassing
                    ? 'bg-red-500/30 text-red-300 border border-red-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 via-red-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-red-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isPassing ? 'animate-spin' : ''}`} />
                <span>{isPassing ? 'BOM ĐANG CHUYỀN...' : 'BẮT ĐẦU CHUYỀN BOM'}</span>
              </button>

              {isPassing && (
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

          {/* Adaptive Viewport Card Grid Arena (Guaranteed no vertical scrolling) */}
          <div className="relative w-full h-[66vh] min-h-[480px] rounded-3xl overflow-hidden border-4 border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl p-4 flex flex-col justify-center">
            {/* Background heat glow */}
            <div className="absolute inset-0 bg-radial from-red-600/10 via-transparent to-transparent pointer-events-none" />

            <div className={`grid gap-2 sm:gap-2.5 w-full h-full content-center ${getGridColsClass()}`}>
              {availableStudents.map((student, idx) => {
                const hasBomb = activeBombIndex === idx;
                const isExploded = explodedIndex === idx;

                return (
                  <div
                    key={student.id}
                    className={`relative rounded-2xl p-2 border-2 transition-all flex flex-col items-center justify-center text-center shadow-md select-none transform ${
                      isExploded
                        ? 'bg-gradient-to-tr from-amber-400 via-red-500 to-rose-600 border-white scale-110 z-30 shadow-[0_0_30px_#ef4444]'
                        : hasBomb
                        ? 'bg-gradient-to-tr from-red-600/40 via-amber-500/40 to-red-600/40 border-amber-400 scale-105 z-20 animate-wobble shadow-[0_0_20px_#f59e0b]'
                        : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    {/* Bomb Badge if active */}
                    {hasBomb && !isExploded && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl filter drop-shadow animate-bounce">
                        💣
                      </div>
                    )}

                    {/* Exploded effect badge */}
                    {isExploded && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl animate-ping">
                        💥
                      </div>
                    )}

                    {/* Avatar Emoji */}
                    <span
                      className={`text-xl sm:text-2xl filter drop-shadow transition-transform ${
                        hasBomb ? 'scale-125' : ''
                      }`}
                    >
                      {student.avatarEmoji || '⭐'}
                    </span>

                    {/* Student Name */}
                    <span
                      className={`font-black text-[11px] sm:text-xs truncate max-w-full px-1 mt-0.5 ${
                        isExploded
                          ? 'text-white text-sm'
                          : hasBomb
                          ? 'text-amber-200'
                          : 'text-slate-200'
                      }`}
                    >
                      {student.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
