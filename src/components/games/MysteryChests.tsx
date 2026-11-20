import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Sparkles, Shuffle, Lock, Unlock } from 'lucide-react';
import { EmptyState } from '../EmptyState';
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

  // Initialize and shuffle chests when students change
  useEffect(() => {
    // Shuffled copy
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

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (sweepTimeoutRef.current) clearTimeout(sweepTimeoutRef.current);
    };
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
  const openChest = (chest: ChestItem) => {
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
    }, 550);
  };

  // Automated sweeping selection
  const startRandomSweep = () => {
    if (isSweeping || isShuffling || chests.length === 0) return;

    soundManager.playClick();
    setIsSweeping(true);
    setOpenedChestId(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    // Winning target index
    const winningIdx = Math.floor(Math.random() * chests.length);
    let currentIndex = 0;
    let stepDelay = 80;

    const sweepStep = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / totalDuration;

      currentIndex = (currentIndex + 1) % chests.length;
      setActiveSweepIndex(currentIndex);
      soundManager.playTick(800 + (currentIndex % 5) * 50);

      if (progress < 0.88) {
        // Continue sweeping, gradually slowing down
        stepDelay = 80 + Math.pow(progress, 2.5) * 400;
        sweepTimeoutRef.current = window.setTimeout(sweepStep, stepDelay);
      } else {
        // Slowing to the target index
        setActiveSweepIndex(winningIdx);
        soundManager.playTick(1300);

        sweepTimeoutRef.current = window.setTimeout(() => {
          openChest(chests[winningIdx]);
        }, 500);
      }
    };

    sweepStep();
  };

  // Calculate dynamic grid column classes based on student count
  const getGridColsClass = () => {
    const count = chests.length;
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (count <= 12) return 'grid-cols-3 sm:grid-cols-4';
    if (count <= 20) return 'grid-cols-4 sm:grid-cols-5';
    if (count <= 30) return 'grid-cols-4 sm:grid-cols-6';
    return 'grid-cols-5 sm:grid-cols-7 lg:grid-cols-8';
  };

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full">
      {chests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Control Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
              <span className="text-xl">🎁</span>
              <span>Bấm vào một rương bất kỳ hoặc chọn</span>
              <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-400/30">
                Mở ngẫu nhiên
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Shuffle button */}
              <button
                onClick={handleShuffle}
                disabled={isSweeping || isShuffling}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-600 shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
                title="Xáo trộn lại vị trí các rương"
              >
                <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
                <span>Xáo Trộn</span>
              </button>

              {/* Random Sweep Open */}
              <button
                onClick={startRandomSweep}
                disabled={isSweeping || isShuffling}
                className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer ${
                  isSweeping
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isSweeping ? 'animate-spin' : ''}`} />
                <span>{isSweeping ? 'ĐANG CHẠY CHỌN...' : 'MỞ NGẪU NHIÊN'}</span>
              </button>
            </div>
          </div>

          {/* Chests Arena Grid */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-4 sm:p-6 border-2 border-slate-700 shadow-2xl min-h-[480px] max-h-[70vh] overflow-y-auto">
            <div className={`grid gap-3 sm:gap-4 ${getGridColsClass()}`}>
              {chests.map((chest, index) => {
                const isSelectedInSweep = activeSweepIndex === index;
                const isOpened = chest.isOpened || openedChestId === chest.id;

                return (
                  <div
                    key={chest.id}
                    onClick={() => openChest(chest)}
                    className={`relative aspect-[4/3] rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-2 select-none group transform ${
                      isShuffling ? 'scale-90 rotate-6 opacity-60' : ''
                    } ${
                      isSelectedInSweep
                        ? 'bg-gradient-to-tr from-amber-400/30 via-yellow-400/40 to-amber-300/30 border-amber-300 scale-110 shadow-2xl shadow-amber-400/40 z-20'
                        : isOpened
                        ? 'bg-gradient-to-tr from-emerald-500/30 to-teal-400/30 border-emerald-400 scale-105'
                        : 'bg-slate-800/80 border-slate-700 hover:border-amber-400/60 hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-md'
                    }`}
                  >
                    {/* Golden Sweep Glow Indicator */}
                    {isSelectedInSweep && (
                      <div className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-md pointer-events-none animate-pulse-fast" />
                    )}

                    {/* Chest Number Badge */}
                    <div className="absolute top-1.5 left-2 text-[10px] font-mono font-bold text-slate-400">
                      #{index + 1}
                    </div>

                    {/* Chest graphic / representation */}
                    <div className="relative flex flex-col items-center justify-center">
                      {isOpened ? (
                        <div className="flex flex-col items-center animate-in zoom-in-75 duration-300">
                          <span className="text-3xl sm:text-4xl filter drop-shadow">
                            {chest.student.avatarEmoji || '👑'}
                          </span>
                          <span className="text-emerald-300 font-black text-xs sm:text-sm mt-1 text-center line-clamp-1">
                            {chest.student.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-3xl sm:text-4xl filter drop-shadow transition-transform ${
                              isSelectedInSweep ? 'scale-125' : 'group-hover:scale-110'
                            }`}
                          >
                            🎁
                          </span>
                          <span className="text-slate-400 font-bold text-[10px] mt-1 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Bí mật
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Open badge if opened */}
                    {isOpened && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md animate-bounce">
                        <Unlock className="w-3 h-3" />
                      </div>
                    )}
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
