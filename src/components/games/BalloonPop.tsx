import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { BALLOON_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Hand } from 'lucide-react';
import { GameStageHUD } from '../GameStageHUD';
import type { Student } from '../../types';

interface BalloonItem {
  student: Student;
  color: { bg: string; string: string };
  x: number; // percentage 8% to 92%
  y: number; // percentage 12% to 84%
  floatDelay: number;
  floatDuration: number;
  isPopping: boolean;
}

export const BalloonPop: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [isTargeting, setIsTargeting] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [poppedStudentId, setPoppedStudentId] = useState<string | null>(null);

  const targetTimeoutRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (targetTimeoutRef.current) clearTimeout(targetTimeoutRef.current);
  }, []);

  // Initialize balloon positions when students change
  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setBalloons([]);
      return;
    }

    const cols = Math.ceil(Math.sqrt(total * 1.5));
    const rows = Math.ceil(total / cols);

    const newBalloons: BalloonItem[] = availableStudents.map((s, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;

      const baseColPct = ((col + 0.5) / cols) * 84 + 8;
      const baseRowPct = ((row + 0.5) / rows) * 70 + 12;

      const jitterX = (Math.random() - 0.5) * (55 / cols);
      const jitterY = (Math.random() - 0.5) * (40 / rows);

      const color = BALLOON_COLORS[idx % BALLOON_COLORS.length];

      return {
        student: s,
        color,
        x: Math.max(8, Math.min(92, baseColPct + jitterX)),
        y: Math.max(12, Math.min(82, baseRowPct + jitterY)),
        floatDelay: Math.random() * 2.5,
        floatDuration: 3 + Math.random() * 2.5,
        isPopping: false,
      };
    });

    setBalloons(newBalloons);
    setIsTargeting(false);
    setTargetStudentId(null);
    setPoppedStudentId(null);
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const resetGame = useCallback(() => {
    clearTimers();
    setIsTargeting(false);
    setTargetStudentId(null);
    setPoppedStudentId(null);
    setBalloons((prev) => prev.map((b) => ({ ...b, isPopping: false })));
  }, [clearTimers]);

  const popBalloon = useCallback(
    (student: Student, forceAuto = false) => {
      if (!forceAuto && isTargeting && targetStudentId !== student.id) return;
      if (poppedStudentId) return;

      soundManager.playBalloonPop();
      setPoppedStudentId(student.id);

      setBalloons((prev) =>
        prev.map((b) => (b.student.id === student.id ? { ...b, isPopping: true } : b))
      );

      setTimeout(() => {
        openWinnerModal(student, 'balloon');
        setPoppedStudentId(null);
        setIsTargeting(false);
        setTargetStudentId(null);
      }, 480);
    },
    [isTargeting, targetStudentId, poppedStudentId, openWinnerModal]
  );

  const startRandomAiming = useCallback(() => {
    if (isTargeting || availableStudents.length === 0 || balloons.length === 0) return;

    clearTimers();
    soundManager.playClick();
    setIsTargeting(true);
    setPoppedStudentId(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    const winningIndex = Math.floor(Math.random() * balloons.length);
    const chosenWinner = balloons[winningIndex].student;

    let currentInterval = 100;

    const cycleTarget = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / totalDuration;

      if (progress < 0.85) {
        const randomIdx = Math.floor(Math.random() * balloons.length);
        const randomTarget = balloons[randomIdx].student;
        setTargetStudentId(randomTarget.id);
        soundManager.playTick(700 + Math.random() * 200);

        currentInterval = 80 + Math.pow(progress, 2) * 340;
        targetTimeoutRef.current = window.setTimeout(cycleTarget, currentInterval);
      } else {
        setTargetStudentId(chosenWinner.id);
        soundManager.playTick(1250);

        targetTimeoutRef.current = window.setTimeout(() => {
          popBalloon(chosenWinner, true);
        }, 550);
      }
    };

    cycleTarget();
  }, [isTargeting, availableStudents.length, balloons, gameSpeed, clearTimers, popBalloon]);

  const targetedBalloon = balloons.find((b) => b.student.id === targetStudentId);

  return (
    <GameStageHUD
      gameId="balloon"
      subtitle="Bấm SPACE để tâm ngắm khóa mục tiêu hoặc chạm trực tiếp bóng trên bảng!"
      isRunning={isTargeting}
      actionLabel="NGẮM BẮN NGẪU NHIÊN"
      runningLabel="ĐANG KHÓA MỤC TIÊU..."
      actionGradient="from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white"
      onPrimaryAction={startRandomAiming}
      onReset={resetGame}
      secondaryAction={
        <div className="hidden sm:flex items-center gap-1.5 bg-sky-500/20 text-sky-200 px-3.5 py-2 rounded-xl border border-sky-400/40 text-xs sm:text-sm font-bold">
          <Hand className="w-4 h-4 text-sky-300" aria-hidden="true" />
          <span>Hỗ trợ chạm nổ bóng trực tiếp</span>
        </div>
      }
    >
      {/* Sky Canvas / Balloon Arena */}
      <div className="relative w-full h-[62vh] min-h-[450px] bg-gradient-to-b from-sky-500 via-sky-300 to-indigo-100 rounded-3xl border-4 border-sky-200/70 shadow-2xl overflow-hidden select-none">
        {/* Sun & Fluffy clouds background */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-300/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-6 left-12 w-36 h-11 bg-white/75 rounded-full blur-[2px] animate-float opacity-85 pointer-events-none" />
        <div className="absolute top-20 right-20 w-48 h-14 bg-white/65 rounded-full blur-[2px] animate-float-slow opacity-75 pointer-events-none" />
        <div className="absolute bottom-14 left-1/3 w-40 h-12 bg-white/55 rounded-full blur-[2px] animate-float opacity-65 pointer-events-none" />

        {/* Crosshair Target Reticle overlay */}
        {isTargeting && targetedBalloon && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
            style={{
              left: `${targetedBalloon.x}%`,
              top: `${targetedBalloon.y}%`,
            }}
          >
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center animate-spin-slow">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-rose-600 shadow-2xl" />
              <div className="absolute inset-4 rounded-full border-2 border-rose-500 animate-ping opacity-80" />
              <div className="w-5 h-5 bg-rose-600 rounded-full shadow-lg border-2 border-white" />
              <div className="absolute top-0 bottom-0 w-1 bg-rose-600/80" />
              <div className="absolute left-0 right-0 h-1 bg-rose-600/80" />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shadow-lg border border-white/50">
              KHÓA MỤC TIÊU 🎯
            </div>
          </div>
        )}

        {/* Floating Balloons */}
        {balloons.map((b) => {
          const isTarget = b.student.id === targetStudentId;
          const isPopping = b.isPopping;

          return (
            <button
              key={b.student.id}
              onClick={() => popBalloon(b.student)}
              aria-label={`Bắn bóng bay của ${b.student.name}`}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform cursor-pointer group focus-visible:outline-none ${
                isPopping ? 'scale-150 opacity-0 transition-all duration-300' : 'hover:scale-110 active:scale-95'
              }`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                animation: `float ${b.floatDuration}s ease-in-out infinite alternate`,
                animationDelay: `${b.floatDelay}s`,
                zIndex: isTarget ? 25 : 10,
              }}
            >
              {isPopping && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl animate-ping">💥</span>
                </div>
              )}

              {!isPopping && (
                <div className="relative flex flex-col items-center">
                  {/* Glossy 3D Candy Balloon Body */}
                  <div
                    className={`relative rounded-[50%_50%_50%_50%/42%_42%_58%_58%] p-2.5 shadow-xl transition-all flex flex-col items-center justify-center border-2 border-white/70 ${
                      isTarget
                        ? 'ring-4 ring-rose-500 ring-offset-2 scale-115 shadow-[0_0_25px_rgba(244,63,94,0.8)]'
                        : 'group-hover:shadow-2xl'
                    }`}
                    style={{
                      background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 45%), ${b.color.bg}`,
                      width: availableStudents.length > 25 ? '86px' : '106px',
                      height: availableStudents.length > 25 ? '100px' : '122px',
                    }}
                  >
                    {/* Shine Highlight */}
                    <div className="absolute top-2.5 left-3 w-4 h-6 bg-white/50 rounded-full transform -rotate-35 blur-[0.5px]" />

                    {/* Avatar Emoji */}
                    <span className="text-xl sm:text-2xl filter drop-shadow select-none">
                      {b.student.avatarEmoji || '🎈'}
                    </span>

                    {/* High-Contrast Student Name */}
                    <span className="mt-0.5 text-white font-black text-xs sm:text-sm text-center px-1.5 py-0.5 rounded-lg bg-slate-950/35 backdrop-blur-[1px] line-clamp-2 leading-tight projector-text">
                      {b.student.name}
                    </span>
                  </div>

                  {/* Balloon Knot */}
                  <div
                    className="w-3.5 h-2 rounded-b-md shadow-sm -mt-0.5"
                    style={{ backgroundColor: b.color.bg }}
                  />

                  {/* Balloon String */}
                  <div
                    className="w-0.5 h-8 origin-top animate-wobble"
                    style={{ backgroundColor: b.color.string }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </GameStageHUD>
  );
};
