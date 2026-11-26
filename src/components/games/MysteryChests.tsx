import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Shuffle, Lock, Unlock } from 'lucide-react';
import { GameStageHUD } from '../GameStageHUD';
import type { Student } from '../../types';

interface ChestItem {
  id: string;
  student: Student;
  isOpened: boolean;
  isHighlighted: boolean;
}

export const MysteryChests: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [chests, setChests] = useState<ChestItem[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [activeSweepIndex, setActiveSweepIndex] = useState<number | null>(null);
  const [openedChestId, setOpenedChestId] = useState<string | null>(null);

  const sweepTimeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (sweepTimeoutRef.current) clearTimeout(sweepTimeoutRef.current);
  };

  // Initialize and shuffle chests when students change
  useEffect(() => {
    const shuffledStudents = [...availableStudents].sort(() => Math.random() - 0.5);
    const newChests: ChestItem[] = shuffledStudents.map((s, idx) => ({
      id: `chest_${s.id}_${idx}`,
      student: s,
      isOpened: false,
      isHighlighted: false,
    }));
    setChests(newChests);
    setIsSweeping(false);
    setActiveSweepIndex(null);
    setOpenedChestId(null);
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    setIsSweeping(false);
    setActiveSweepIndex(null);
    setOpenedChestId(null);
    setChests((prev) => prev.map((c) => ({ ...c, isOpened: false, isHighlighted: false })));
  }, []);

  // Shuffle chests animation
  const handleShuffle = () => {
    if (isSweeping || isShuffling || chests.length <= 1) return;

    soundManager.playWhoosh();
    setIsShuffling(true);

    setTimeout(() => {
      setChests((prev) => [...prev].sort(() => Math.random() - 0.5));
      setIsShuffling(false);
    }, 450);
  };

  // Open a specific chest (direct click or auto selected)
  const openChest = useCallback(
    (chest: ChestItem) => {
      if (isSweeping && !chest.isHighlighted) return;
      if (isShuffling || openedChestId) return;

      soundManager.playChestOpen();
      setOpenedChestId(chest.id);

      setChests((prev) =>
        prev.map((c) => (c.id === chest.id ? { ...c, isOpened: true } : c))
      );

      setTimeout(() => {
        openWinnerModal(chest.student, 'chests');
        setOpenedChestId(null);
        setIsSweeping(false);
        setActiveSweepIndex(null);
      }, 600);
    },
    [isSweeping, isShuffling, openedChestId, openWinnerModal]
  );

  // Automated sweeping selection
  const startRandomSweep = useCallback(() => {
    if (isSweeping || isShuffling || chests.length === 0) return;

    soundManager.playClick();
    setIsSweeping(true);
    setOpenedChestId(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    const winningIdx = Math.floor(Math.random() * chests.length);
    let currentIndex = 0;
    let stepDelay = 80;

    const sweepStep = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / totalDuration;

      currentIndex = (currentIndex + 1) % chests.length;
      setActiveSweepIndex(currentIndex);
      soundManager.playTick(780 + (currentIndex % 6) * 55);

      if (progress < 0.88) {
        stepDelay = 75 + Math.pow(progress, 2.5) * 380;
        sweepTimeoutRef.current = window.setTimeout(sweepStep, stepDelay);
      } else {
        setActiveSweepIndex(winningIdx);
        soundManager.playTick(1350);

        sweepTimeoutRef.current = window.setTimeout(() => {
          const target = chests[winningIdx];
          if (target) {
            soundManager.playChestOpen();
            setOpenedChestId(target.id);
            setChests((prev) =>
              prev.map((c) => (c.id === target.id ? { ...c, isOpened: true } : c))
            );
            setTimeout(() => {
              openWinnerModal(target.student, 'chests');
              setOpenedChestId(null);
              setIsSweeping(false);
              setActiveSweepIndex(null);
            }, 600);
          }
        }, 480);
      }
    };

    sweepStep();
  }, [isSweeping, isShuffling, chests, gameSpeed, openWinnerModal]);

  const getGridColsClass = () => {
    const count = chests.length;
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (count <= 12) return 'grid-cols-3 sm:grid-cols-4';
    if (count <= 20) return 'grid-cols-4 sm:grid-cols-5';
    if (count <= 30) return 'grid-cols-4 sm:grid-cols-6';
    return 'grid-cols-5 sm:grid-cols-7 lg:grid-cols-8';
  };

  return (
    <GameStageHUD
      gameId="chests"
      subtitle="Chạm vào rương bất kỳ để mở, hoặc bấm SPACE để vệt sáng quét ngẫu nhiên!"
      isRunning={isSweeping || isShuffling}
      actionLabel="MỞ NGẪU NHIÊN"
      runningLabel="ĐANG QUÉT KHO BÁU..."
      actionGradient="from-purple-500 via-fuchsia-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white"
      onPrimaryAction={startRandomSweep}
      onReset={resetGame}
      secondaryAction={
        <button
          onClick={handleShuffle}
          disabled={isSweeping || isShuffling}
          className="arcade-btn min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-amber-200 border border-amber-400/35 text-xs sm:text-sm"
          title="Xáo trộn lại vị trí các rương"
        >
          <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Xáo Trộn</span>
        </button>
      }
    >
      {/* Chests Arena Grid */}
      <div className="relative rounded-3xl p-4 sm:p-6 border-2 border-purple-500/40 shadow-2xl bg-gradient-to-b from-[#130f26] via-[#0f172a] to-[#090d16] min-h-[460px] max-h-[64vh] overflow-y-auto">
        {/* Subtle magical spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_70%)] pointer-events-none" />

        <div className={`relative grid gap-3 sm:gap-4 ${getGridColsClass()}`}>
          {chests.map((chest, index) => {
            const isSelectedInSweep = activeSweepIndex === index;
            const isOpened = chest.isOpened || openedChestId === chest.id;

            return (
              <button
                key={chest.id}
                onClick={() => openChest(chest)}
                disabled={isSweeping || isShuffling}
                aria-label={`Rương kho báu số ${index + 1}`}
                className={`relative min-h-[96px] aspect-[4/3] rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-2.5 select-none group transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                  isShuffling ? 'scale-90 rotate-6 opacity-60' : ''
                } ${
                  isSelectedInSweep
                    ? 'bg-gradient-to-tr from-amber-500/40 via-yellow-400/35 to-orange-500/40 border-amber-300 ring-4 ring-amber-300/70 scale-105 shadow-[0_0_30px_rgba(251,191,36,0.55)] z-20'
                    : isOpened
                    ? 'bg-gradient-to-tr from-emerald-500/35 to-teal-400/30 border-emerald-300 ring-4 ring-emerald-400/50 scale-105 z-20'
                    : 'bg-gradient-to-b from-slate-800/95 to-slate-900/95 border-amber-500/30 hover:border-amber-400 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 shadow-lg'
                }`}
              >
                {/* Golden Chest Trim Accent */}
                <div className="absolute inset-x-3 top-0 h-1 rounded-b-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

                {/* Golden Sweep Glow Indicator */}
                {isSelectedInSweep && (
                  <div className="absolute inset-0 rounded-2xl bg-amber-300/20 blur-md pointer-events-none animate-pulse-fast" />
                )}

                {/* Chest Number Badge */}
                <div className="absolute top-2 left-2.5 text-xs font-black text-amber-300/90 bg-slate-950/60 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                  #{index + 1}
                </div>

                {/* Chest Graphic */}
                <div className="relative flex flex-col items-center justify-center mt-2">
                  {isOpened ? (
                    <div className="flex flex-col items-center animate-pop-in">
                      <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
                        {chest.student.avatarEmoji || '👑'}
                      </span>
                      <span className="text-emerald-200 font-black text-xs sm:text-sm mt-1 text-center line-clamp-1 projector-text">
                        {chest.student.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-3xl sm:text-4xl filter drop-shadow-md transition-transform ${
                          isSelectedInSweep ? 'scale-125' : 'group-hover:scale-110'
                        }`}
                        aria-hidden="true"
                      >
                        🎁
                      </span>
                      <span className="text-slate-300 font-bold text-xs mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" aria-hidden="true" />
                        <span>Bí mật</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Open badge */}
                {isOpened && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md animate-bounce">
                    <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameStageHUD>
  );
};
