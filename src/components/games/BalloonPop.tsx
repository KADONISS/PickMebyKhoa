import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { BALLOON_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Crosshair, Hand } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import type { Student } from '../../types';

interface BalloonItem {
  student: Student;
  color: { bg: string; string: string };
  x: number; // percentage 5% to 90%
  y: number; // percentage 10% to 85%
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetTimeoutRef = useRef<number | null>(null);

  // Initialize balloon positions when students change
  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setBalloons([]);
      return;
    }

    // Grid layout with jitter for natural floating sky look
    const cols = Math.ceil(Math.sqrt(total * 1.5));
    const rows = Math.ceil(total / cols);

    const newBalloons: BalloonItem[] = availableStudents.map((s, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;

      const baseColPct = ((col + 0.5) / cols) * 85 + 5;
      const baseRowPct = ((row + 0.5) / rows) * 75 + 10;

      // Jitter
      const jitterX = (Math.random() - 0.5) * (70 / cols);
      const jitterY = (Math.random() - 0.5) * (50 / rows);

      const color = BALLOON_COLORS[idx % BALLOON_COLORS.length];

      return {
        student: s,
        color,
        x: Math.max(8, Math.min(92, baseColPct + jitterX)),
        y: Math.max(12, Math.min(88, baseRowPct + jitterY)),
        floatDelay: Math.random() * 3,
        floatDuration: 3 + Math.random() * 2.5,
        isPopping: false,
      };
    });

    setBalloons(newBalloons);
    setIsTargeting(false);
    setTargetStudentId(null);
    setPoppedStudentId(null);
  }, [availableStudents]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (targetTimeoutRef.current) clearTimeout(targetTimeoutRef.current);
    };
  }, []);

  // Pop a specific balloon (Manual click or auto targeted)
  const popBalloon = (student: Student) => {
    if (isTargeting && targetStudentId !== student.id) return;
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
    }, 450);
  };

  // Automated Crosshair Targeting Animation
  const startRandomAiming = () => {
    if (isTargeting || availableStudents.length === 0 || balloons.length === 0) return;

    soundManager.playClick();
    setIsTargeting(true);
    setPoppedStudentId(null);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    // Select the final winning student
    const winningIndex = Math.floor(Math.random() * balloons.length);
    const chosenWinner = balloons[winningIndex].student;

    // Sequence of jump intervals that gradually decelerate
    let currentInterval = 100;

    const cycleTarget = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / totalDuration;

      if (progress < 0.85) {
        // Pick random balloon to highlight
        const randomIdx = Math.floor(Math.random() * balloons.length);
        const randomTarget = balloons[randomIdx].student;
        setTargetStudentId(randomTarget.id);
        soundManager.playTick(700 + Math.random() * 200);

        // Gradually increase delay
        currentInterval = 80 + Math.pow(progress, 2) * 350;
        targetTimeoutRef.current = window.setTimeout(cycleTarget, currentInterval);
      } else {
        // Lock on final target
        setTargetStudentId(chosenWinner.id);
        soundManager.playTick(1200);

        // Lock on pause, then POP!
        targetTimeoutRef.current = window.setTimeout(() => {
          popBalloon(chosenWinner);
        }, 550);
      }
    };

    cycleTarget();
  };

  const targetedBalloon = balloons.find((b) => b.student.id === targetStudentId);

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full">
      {balloons.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Bar with actions */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
              <span className="text-xl">🎈</span>
              <span>Bấm "Ngắm Bắn Ngẫu Nhiên" hoặc</span>
              <span className="flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-400/30">
                <Hand className="w-3.5 h-3.5" /> Chạm trực tiếp vào bóng
              </span>
            </div>

            <button
              onClick={startRandomAiming}
              disabled={isTargeting}
              className={`px-8 py-3 rounded-2xl font-black text-base shadow-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                isTargeting
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40 animate-pulse'
                  : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-rose-500/30 hover:scale-105 active:scale-95'
              }`}
            >
              <Crosshair className={`w-5 h-5 ${isTargeting ? 'animate-spin' : ''}`} />
              <span>{isTargeting ? 'ĐANG KHÓA MỤC TIÊU...' : 'NGẮM BẮN NGẪU NHIÊN'}</span>
            </button>
          </div>

          {/* Sky Canvas / Balloon Arena */}
          <div
            ref={containerRef}
            className="relative w-full h-[65vh] min-h-[450px] bg-gradient-to-b from-sky-400 via-sky-300 to-indigo-100 rounded-3xl border-4 border-white/60 shadow-2xl overflow-hidden select-none"
          >
            {/* Fluffy clouds background */}
            <div className="absolute top-6 left-12 w-32 h-10 bg-white/70 rounded-full blur-sm animate-float opacity-80" />
            <div
              className="absolute top-20 right-20 w-44 h-14 bg-white/60 rounded-full blur-sm opacity-70"
              style={{ animation: 'float 5s ease-in-out infinite' }}
            />
            <div
              className="absolute bottom-16 left-1/3 w-36 h-12 bg-white/50 rounded-full blur-sm opacity-60"
              style={{ animation: 'float 4s ease-in-out infinite' }}
            />

            {/* Crosshair Target Reticle overlay */}
            {isTargeting && targetedBalloon && (
              <div
                className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
                style={{
                  left: `${targetedBalloon.x}%`,
                  top: `${targetedBalloon.y}%`,
                }}
              >
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-rose-500 shadow-2xl" />
                  <div className="absolute inset-4 rounded-full border-2 border-rose-600 animate-ping opacity-75" />
                  <div className="w-4 h-4 bg-rose-600 rounded-full shadow-lg" />
                  {/* Crosshair lines */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500" />
                  <div className="absolute left-0 right-0 h-0.5 bg-rose-500" />
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md">
                  MỤC TIÊU 🎯
                </div>
              </div>
            )}

            {/* Floating Balloons */}
            {balloons.map((b) => {
              const isTarget = b.student.id === targetStudentId;
              const isPopping = b.isPopping;

              return (
                <div
                  key={b.student.id}
                  onClick={() => popBalloon(b.student)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform cursor-pointer group ${
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
                  {/* Balloon Pop Particles */}
                  {isPopping && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl animate-ping">💥</span>
                    </div>
                  )}

                  {!isPopping && (
                    <div className="relative flex flex-col items-center">
                      {/* Balloon Body */}
                      <div
                        className={`relative rounded-[50%_50%_50%_50%/40%_40%_60%_60%] p-3 shadow-xl transition-all flex flex-col items-center justify-center border-2 border-white/50 ${
                          isTarget
                            ? 'ring-4 ring-rose-500 ring-offset-2 scale-110'
                            : 'group-hover:shadow-2xl'
                        }`}
                        style={{
                          backgroundColor: b.color.bg,
                          width: availableStudents.length > 25 ? '78px' : '96px',
                          height: availableStudents.length > 25 ? '92px' : '114px',
                        }}
                      >
                        {/* Balloon Shine Highlight */}
                        <div className="absolute top-2.5 left-2.5 w-4 h-6 bg-white/40 rounded-full transform -rotate-45 blur-[0.5px]" />

                        {/* Student Avatar Emoji */}
                        <span className="text-xl sm:text-2xl filter drop-shadow select-none">
                          {b.student.avatarEmoji || '🎈'}
                        </span>

                        {/* Student Name */}
                        <span className="text-white font-black text-[11px] sm:text-xs text-center drop-shadow px-1 line-clamp-2 leading-tight">
                          {b.student.name}
                        </span>
                      </div>

                      {/* Balloon Knot */}
                      <div
                        className="w-3 h-2 rounded-b-md shadow-sm -mt-0.5"
                        style={{ backgroundColor: b.color.bg }}
                      />

                      {/* Balloon String */}
                      <div
                        className="w-0.5 h-7 origin-top animate-wobble"
                        style={{ backgroundColor: b.color.string }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
