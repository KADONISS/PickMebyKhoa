import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { WHEEL_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { RotateCcw, Sparkles } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import type { Student } from '../../types';

interface PrizeBall {
  student: Student;
  color: string;
  x: number; // percentage inside machine (18% to 92%)
  y: number; // vertical position in pile
  radius: number;
}

export const ClawMachine: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [balls, setBalls] = useState<PrizeBall[]>([]);
  const [clawX, setClawX] = useState<number>(55); // percentage along top rail (20% to 90%)
  const [clawY, setClawY] = useState<number>(10); // claw descent height percentage (10% up, ~70% down)
  const [clawOpen, setClawOpen] = useState<boolean>(false);
  const [isWobbling, setIsWobbling] = useState<boolean>(false);
  const [isOperating, setIsOperating] = useState<boolean>(false);
  const [grabbedBall, setGrabbedBall] = useState<PrizeBall | null>(null);

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

  // Populate balls in cabinet
  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setBalls([]);
      return;
    }

    const cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(total * 2))));
    const ballRadius = total > 30 ? 26 : total > 20 ? 32 : 38;

    const newBalls: PrizeBall[] = availableStudents.map((s, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const xStep = 72 / cols;
      const baseX = 22 + col * xStep + (row % 2) * (xStep * 0.4);
      const baseY = 20 + row * (ballRadius * 0.85);

      const color = s.color || WHEEL_COLORS[idx % WHEEL_COLORS.length];

      return {
        student: s,
        color,
        x: Math.max(18, Math.min(92, baseX)),
        y: baseY,
        radius: ballRadius,
      };
    });

    setBalls(newBalls);
    setIsOperating(false);
    setGrabbedBall(null);
    setClawX(55);
    setClawY(10);
    setClawOpen(false);
    setIsWobbling(false);
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const resetGame = () => {
    clearAllTimers();
    setIsOperating(false);
    setGrabbedBall(null);
    setClawX(55);
    setClawY(10);
    setClawOpen(false);
    setIsWobbling(false);
  };

  const startClawGrab = () => {
    if (isOperating || balls.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsOperating(true);
    setGrabbedBall(null);
    setClawOpen(false);
    setIsWobbling(false);

    // Pick target ball
    const targetIdx = Math.floor(Math.random() * balls.length);
    const targetBall = balls[targetIdx];
    const targetX = targetBall.x;

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();
    const railMoveDuration = totalDuration * 0.45;

    // Stage 1: Move claw horizontally on rail
    const animateRailMove = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < railMoveDuration) {
        const progress = elapsed / railMoveDuration;
        // Natural crane sweep back and forth then align to targetX
        const currentRailX = 22 + ((Math.sin(progress * Math.PI * 3) + 1) / 2) * 65;
        // Blend towards targetX as progress approaches 1
        const finalX = currentRailX * (1 - progress) + targetX * progress;
        setClawX(Math.max(18, Math.min(90, finalX)));

        if (Math.floor(elapsed / 150) % 2 === 0) {
          soundManager.playClawMove();
        }

        animFrameRef.current = requestAnimationFrame(animateRailMove);
      } else {
        // Aligned above target ball!
        setClawX(targetX);
        soundManager.playClawMove();

        // Stage 2: Open claw and drop down!
        addTimeout(() => {
          setClawOpen(true);
          soundManager.playTick(500);

          // Lower claw down to ball
          const dropStartTime = performance.now();
          const targetY = 70; // Depth towards bottom pile

          const animateDrop = (t: number) => {
            const dropElapsed = t - dropStartTime;
            const dropProgress = Math.min(dropElapsed / 1000, 1);

            setClawY(10 + (targetY - 10) * dropProgress);

            if (dropProgress < 1) {
              animFrameRef.current = requestAnimationFrame(animateDrop);
            } else {
              // At bottom: Grab ball!
              setClawOpen(false);
              setGrabbedBall(targetBall);
              soundManager.playTick(950);

              // Stage 3: Pull claw up!
              addTimeout(() => {
                const pullStartTime = performance.now();
                const isDramatic = gameSpeed === 'dramatic';

                const animatePull = (pt: number) => {
                  const pullElapsed = pt - pullStartTime;
                  const pullProgress = Math.min(pullElapsed / 1200, 1);

                  setClawY(targetY - (targetY - 10) * pullProgress);

                  // Suspense wobble halfway during dramatic mode
                  if (isDramatic && pullProgress > 0.4 && pullProgress < 0.7) {
                    setIsWobbling(true);
                  } else {
                    setIsWobbling(false);
                  }

                  if (pullProgress < 1) {
                    animFrameRef.current = requestAnimationFrame(animatePull);
                  } else {
                    // Stage 4: Move claw with grabbed ball to prize drop chute (Left side: 10%)
                    const chuteMoveStartTime = performance.now();
                    const chuteTargetX = 10;
                    const currentClawX = targetX;

                    const animateChuteMove = (ct: number) => {
                      const cElapsed = ct - chuteMoveStartTime;
                      const cProgress = Math.min(cElapsed / 1000, 1);

                      setClawX(currentClawX - (currentClawX - chuteTargetX) * cProgress);

                      if (cProgress < 1) {
                        animFrameRef.current = requestAnimationFrame(animateChuteMove);
                      } else {
                        // At chute: Open claw and drop ball into prize box!
                        setClawOpen(true);
                        soundManager.playTick(1200);

                        addTimeout(() => {
                          setGrabbedBall(null);
                          soundManager.playFanfare();
                          openWinnerModal(targetBall.student, 'claw');
                          setIsOperating(false);
                        }, 500);
                      }
                    };

                    animFrameRef.current = requestAnimationFrame(animateChuteMove);
                  }
                };

                animFrameRef.current = requestAnimationFrame(animatePull);
              }, 400);
            }
          };

          animFrameRef.current = requestAnimationFrame(animateDrop);
        }, 300);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateRailMove);
  };

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full select-none">
      {balls.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Control Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
              <span className="text-2xl">🕹️</span>
              <span>Máy Gắp Thú: Càng gắp kim loại hạ xuống bắt quả cầu may mắn!</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={startClawGrab}
                disabled={isOperating}
                className={`px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                  isOperating
                    ? 'bg-pink-500/30 text-pink-300 border border-pink-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white shadow-pink-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isOperating ? 'animate-spin' : ''}`} />
                <span>{isOperating ? 'CÀNG ĐANG GẮP...' : 'BẮT ĐẦU GẮP'}</span>
              </button>

              {isOperating && (
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

          {/* Arcade Claw Machine Cabinet */}
          <div className="relative w-full h-[66vh] min-h-[480px] rounded-3xl overflow-hidden border-8 border-pink-400/80 shadow-[0_0_40px_rgba(244,114,182,0.3)] bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex flex-col justify-between">
            {/* Machine Top Frame & Metal Rail */}
            <div className="relative h-12 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 border-b-4 border-pink-300/80 flex items-center px-6 shadow-md z-30">
              {/* Flashing Arcade Lights */}
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-300 animate-ping" />
                <span
                  className="w-3 h-3 rounded-full bg-cyan-300 animate-pulse"
                  style={{ animationDuration: '0.8s' }}
                />
                <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              </div>
              <div className="mx-auto font-black text-white text-xs sm:text-sm tracking-widest uppercase flex items-center gap-1 drop-shadow">
                <span>⭐ SIÊU MÁY GẮP THÚ HOÀNG GIA ⭐</span>
              </div>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-300 animate-pulse" />
                <span className="w-3 h-3 rounded-full bg-pink-300 animate-ping" />
              </div>

              {/* Metal Sliding Rail Line */}
              <div className="absolute bottom-0 inset-x-4 h-1.5 bg-gradient-to-b from-slate-300 to-slate-500 rounded-full" />
            </div>

            {/* Inner Glass Cabinet Display Area */}
            <div className="relative flex-1 overflow-hidden">
              {/* Glass Reflection Highlight */}
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none transform -skew-x-12 z-20" />

              {/* Prize Chute at Bottom-Left */}
              <div className="absolute bottom-0 left-2 w-28 sm:w-32 h-36 bg-gradient-to-t from-slate-800 to-slate-700 border-4 border-pink-400 rounded-t-2xl shadow-2xl z-10 flex flex-col items-center justify-between p-2">
                <div className="w-full text-center text-[10px] font-black text-amber-300 uppercase tracking-wider bg-slate-900/80 py-1 rounded-md border border-slate-600">
                  🎁 HỘC NHẬN QUÀ
                </div>
                <div className="text-3xl animate-bounce">👇</div>
                <div className="w-full h-8 bg-slate-950 rounded-lg border-2 border-dashed border-pink-300/40" />
              </div>

              {/* Moving Crane Assembly */}
              <div
                className="absolute top-0 transform -translate-x-1/2 z-25 pointer-events-none transition-all duration-75"
                style={{
                  left: `${clawX}%`,
                  top: '0px',
                }}
              >
                {/* Rail Trolley Carriage */}
                <div className="w-12 h-6 bg-gradient-to-r from-slate-600 via-slate-200 to-slate-600 rounded-b-md shadow-md mx-auto border border-slate-400" />

                {/* Cable String lowering down */}
                <div
                  className="w-1 bg-slate-300 mx-auto transition-all duration-75 shadow-sm"
                  style={{ height: `${clawY * 3.8}px` }}
                />

                {/* Claw Head & Fingers */}
                <div
                  className={`relative flex flex-col items-center transform transition-transform ${
                    isWobbling ? 'animate-wobble' : ''
                  }`}
                >
                  {/* Metal Head Junction */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-xs">
                    ⚙️
                  </div>

                  {/* 2 Mechanical Claw Fingers */}
                  <div className="flex items-center justify-center gap-1 -mt-1">
                    {/* Left Claw Prong */}
                    <div
                      className={`w-3 h-8 bg-gradient-to-b from-slate-400 to-slate-200 border border-slate-500 rounded-l-full shadow-md origin-top transition-transform duration-200 ${
                        clawOpen ? '-rotate-35' : 'rotate-12'
                      }`}
                    />
                    {/* Right Claw Prong */}
                    <div
                      className={`w-3 h-8 bg-gradient-to-b from-slate-400 to-slate-200 border border-slate-500 rounded-r-full shadow-md origin-top transition-transform duration-200 ${
                        clawOpen ? 'rotate-35' : '-rotate-12'
                      }`}
                    />
                  </div>

                  {/* Currently Grabbed Ball attached to Claw */}
                  {grabbedBall && (
                    <div
                      className="absolute top-8 transform scale-110 z-30 flex flex-col items-center animate-pulse"
                      style={{
                        filter: 'drop-shadow(0 0 12px rgba(253, 224, 71, 0.8))',
                      }}
                    >
                      <div
                        className="rounded-full flex flex-col items-center justify-center p-2 border-2 border-white text-center shadow-2xl"
                        style={{
                          backgroundColor: grabbedBall.color,
                          width: `${grabbedBall.radius * 2}px`,
                          height: `${grabbedBall.radius * 2}px`,
                        }}
                      >
                        <span className="text-lg">{grabbedBall.student.avatarEmoji || '⭐'}</span>
                        <span className="text-white font-black text-[11px] truncate px-1">
                          {grabbedBall.student.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pile of Prize Balls in the Cabinet */}
              <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-10">
                {balls.map((b) => {
                  const isGrabbed = grabbedBall?.student.id === b.student.id;
                  if (isGrabbed) return null; // rendered at the claw

                  return (
                    <div
                      key={b.student.id}
                      className="absolute transform -translate-x-1/2 rounded-full border-2 border-white/70 shadow-lg flex flex-col items-center justify-center transition-all hover:scale-105"
                      style={{
                        left: `${b.x}%`,
                        bottom: `${b.y}px`,
                        width: `${b.radius * 2}px`,
                        height: `${b.radius * 2}px`,
                        backgroundColor: b.color,
                      }}
                    >
                      {/* Shine reflex */}
                      <div className="absolute top-1.5 left-2 w-3 h-3 rounded-full bg-white/50 blur-[0.5px]" />
                      <span className="text-base select-none filter drop-shadow">
                        {b.student.avatarEmoji || '🧸'}
                      </span>
                      <span className="text-white font-black text-[10px] text-center px-1 truncate max-w-full drop-shadow">
                        {b.student.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Arcade Cabinet Border with Coin Slot */}
            <div className="h-10 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 border-t-4 border-pink-400 px-6 flex items-center justify-between z-30">
              <span className="text-[11px] font-black text-pink-100 flex items-center gap-1">
                <span>🪙 1 LƯỢT CHƠI MIỄN PHÍ</span>
              </span>
              <span className="text-[11px] font-mono text-yellow-200">
                SĨ SỐ TRONG TỦ: {balls.length} BÓNG
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
