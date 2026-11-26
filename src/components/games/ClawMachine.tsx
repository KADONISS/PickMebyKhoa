import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { WHEEL_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';
import type { Student } from '../../types';

interface PrizeBall {
  student: Student;
  color: string;
  x: number;
  y: number;
  radius: number;
}

export const ClawMachine: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [balls, setBalls] = useState<PrizeBall[]>([]);
  const [clawX, setClawX] = useState<number>(55);
  const [clawY, setClawY] = useState<number>(10);
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

  const clearAllTimers = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  // Populate balls in cabinet
  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setBalls([]);
      return;
    }

    const cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(total * 2))));
    const ballRadius = total > 30 ? 30 : total > 20 ? 36 : 42;

    const newBalls: PrizeBall[] = availableStudents.map((s, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const xStep = 70 / cols;
      const baseX = 24 + col * xStep + (row % 2) * (xStep * 0.4);
      const baseY = 18 + row * (ballRadius * 0.85);
      const color = s.color || WHEEL_COLORS[idx % WHEEL_COLORS.length];

      return {
        student: s,
        color,
        x: Math.max(22, Math.min(92, baseX)),
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
  }, [clearAllTimers]);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setIsOperating(false);
    setGrabbedBall(null);
    setClawX(55);
    setClawY(10);
    setClawOpen(false);
    setIsWobbling(false);
  }, [clearAllTimers]);

  const startClawGrab = useCallback(() => {
    if (isOperating || balls.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsOperating(true);
    setGrabbedBall(null);
    setClawOpen(false);
    setIsWobbling(false);

    const targetIdx = Math.floor(Math.random() * balls.length);
    const targetBall = balls[targetIdx];
    const targetX = targetBall.x;

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();
    const railMoveDuration = totalDuration * 0.45;

    const animateRailMove = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < railMoveDuration) {
        const progress = elapsed / railMoveDuration;
        const currentRailX = 24 + ((Math.sin(progress * Math.PI * 3) + 1) / 2) * 64;
        const finalX = currentRailX * (1 - progress) + targetX * progress;
        setClawX(Math.max(20, Math.min(92, finalX)));

        if (Math.floor(elapsed / 150) % 2 === 0) {
          soundManager.playClawMove();
        }

        animFrameRef.current = requestAnimationFrame(animateRailMove);
      } else {
        setClawX(targetX);
        soundManager.playClawMove();

        addTimeout(() => {
          setClawOpen(true);
          soundManager.playTick(500);

          const dropStartTime = performance.now();
          const targetY = 70;

          const animateDrop = (t: number) => {
            const dropElapsed = t - dropStartTime;
            const dropProgress = Math.min(dropElapsed / 950, 1);
            setClawY(10 + (targetY - 10) * dropProgress);

            if (dropProgress < 1) {
              animFrameRef.current = requestAnimationFrame(animateDrop);
            } else {
              setClawOpen(false);
              setGrabbedBall(targetBall);
              soundManager.playTick(950);

              addTimeout(() => {
                const pullStartTime = performance.now();
                const isDramatic = gameSpeed === 'dramatic';

                const animatePull = (pt: number) => {
                  const pullElapsed = pt - pullStartTime;
                  const pullProgress = Math.min(pullElapsed / 1150, 1);
                  setClawY(targetY - (targetY - 10) * pullProgress);

                  if (isDramatic && pullProgress > 0.35 && pullProgress < 0.72) {
                    setIsWobbling(true);
                  } else {
                    setIsWobbling(false);
                  }

                  if (pullProgress < 1) {
                    animFrameRef.current = requestAnimationFrame(animatePull);
                  } else {
                    const chuteMoveStartTime = performance.now();
                    const chuteTargetX = 11;
                    const currentClawX = targetX;

                    const animateChuteMove = (ct: number) => {
                      const cElapsed = ct - chuteMoveStartTime;
                      const cProgress = Math.min(cElapsed / 950, 1);

                      setClawX(currentClawX - (currentClawX - chuteTargetX) * cProgress);

                      if (cProgress < 1) {
                        animFrameRef.current = requestAnimationFrame(animateChuteMove);
                      } else {
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
              }, 380);
            }
          };

          animFrameRef.current = requestAnimationFrame(animateDrop);
        }, 280);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateRailMove);
  }, [isOperating, balls, gameSpeed, clearAllTimers, openWinnerModal]);

  return (
    <GameStageHUD
      gameId="claw"
      subtitle="Máy Gắp Thú Arcade: Càng gắp trượt trên ray bắt quả cầu mang tên học sinh!"
      isRunning={isOperating}
      actionLabel="THẢ CÀNG GẮP"
      runningLabel="CÀNG ĐANG GẮP..."
      actionGradient="from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white"
      onPrimaryAction={startClawGrab}
      onReset={resetGame}
    >
      {/* Arcade Claw Machine Cabinet */}
      <div className="relative w-full h-[62vh] min-h-[460px] rounded-3xl overflow-hidden border-8 border-pink-400/90 shadow-[0_0_45px_rgba(244,114,182,0.35)] bg-gradient-to-b from-[#130d24] via-[#26113b] to-[#0c1020] flex flex-col justify-between">
        {/* Neon Side Bezel Stripes */}
        <div className="absolute inset-y-12 left-0 w-2 bg-gradient-to-b from-cyan-400 via-pink-500 to-amber-400 opacity-80 z-20" />
        <div className="absolute inset-y-12 right-0 w-2 bg-gradient-to-b from-amber-400 via-pink-500 to-cyan-400 opacity-80 z-20" />

        {/* Machine Top Frame & Metal Rail */}
        <div className="relative h-14 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 border-b-4 border-pink-300 flex items-center px-6 shadow-md z-30">
          <div className="flex gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-300 animate-ping" />
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
          </div>
          <div className="mx-auto font-black text-white text-sm sm:text-base tracking-widest uppercase flex items-center gap-2 projector-text">
            <span>⭐ SIÊU MÁY GẮP THÚ HOÀNG GIA ⭐</span>
          </div>
          <div className="flex gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="w-3.5 h-3.5 rounded-full bg-pink-200 animate-ping" />
          </div>

          <div className="absolute bottom-0 inset-x-4 h-2 bg-gradient-to-b from-slate-200 to-slate-500 rounded-full" />
        </div>

        {/* Inner Glass Cabinet Display Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Glass Reflection */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none transform -skew-x-12 z-20" />

          {/* Prize Chute at Bottom-Left */}
          <div className="absolute bottom-0 left-3 w-32 sm:w-36 h-36 bg-gradient-to-t from-slate-900 to-slate-800 border-4 border-pink-400 rounded-t-2xl shadow-2xl z-10 flex flex-col items-center justify-between p-2.5">
            <div className="w-full text-center text-xs font-black text-amber-300 uppercase tracking-wider bg-slate-950/90 py-1 rounded-lg border border-amber-400/30">
              🎁 HỘC NHẬN QUÀ
            </div>
            <div className="text-3xl animate-bounce">👇</div>
            <div className="w-full h-8 bg-slate-950 rounded-lg border-2 border-dashed border-pink-300/50 shadow-inner" />
          </div>

          {/* Moving Crane Assembly */}
          <div
            className="absolute top-0 transform -translate-x-1/2 z-25 pointer-events-none transition-all duration-75"
            style={{ left: `${clawX}%`, top: '0px' }}
          >
            {/* Rail Trolley Carriage */}
            <div className="w-14 h-7 bg-gradient-to-r from-slate-600 via-slate-100 to-slate-600 rounded-b-lg shadow-md mx-auto border border-slate-400" />

            {/* Cable String */}
            <div
              className="w-1.5 bg-slate-200 mx-auto transition-all duration-75 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              style={{ height: `${clawY * 3.8}px` }}
            />

            {/* Claw Head & 3-Prong Visual */}
            <div className={`relative flex flex-col items-center ${isWobbling ? 'animate-wobble' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-sm">
                ⚙️
              </div>

              <div className="flex items-center justify-center gap-1 -mt-1">
                <div
                  className={`w-3.5 h-9 bg-gradient-to-b from-slate-300 to-slate-100 border border-slate-500 rounded-l-full shadow-md origin-top transition-transform duration-200 ${
                    clawOpen ? '-rotate-45' : 'rotate-12'
                  }`}
                />
                <div className="w-1.5 h-7 bg-slate-300/80 rounded-full -mt-1" />
                <div
                  className={`w-3.5 h-9 bg-gradient-to-b from-slate-300 to-slate-100 border border-slate-500 rounded-r-full shadow-md origin-top transition-transform duration-200 ${
                    clawOpen ? 'rotate-45' : '-rotate-12'
                  }`}
                />
              </div>

              {/* Grabbed Ball */}
              {grabbedBall && (
                <div
                  className="absolute top-9 transform scale-115 z-30 flex flex-col items-center animate-pulse"
                  style={{ filter: 'drop-shadow(0 0 18px rgba(253, 224, 71, 0.9))' }}
                >
                  <div
                    className="rounded-full flex flex-col items-center justify-center p-2 border-2 border-white text-center shadow-2xl"
                    style={{
                      background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 50%), ${grabbedBall.color}`,
                      width: `${grabbedBall.radius * 2}px`,
                      height: `${grabbedBall.radius * 2}px`,
                    }}
                  >
                    <span className="text-xl">{grabbedBall.student.avatarEmoji || '⭐'}</span>
                    <span className="text-white font-black text-xs truncate px-1.5 py-0.5 rounded bg-slate-950/60 max-w-full projector-text">
                      {grabbedBall.student.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pile of Prize Balls */}
          <div className="absolute inset-x-0 bottom-0 h-52 pointer-events-none z-10">
            {balls.map((b) => {
              if (grabbedBall?.student.id === b.student.id) return null;

              return (
                <div
                  key={b.student.id}
                  className="absolute transform -translate-x-1/2 rounded-full border-2 border-white/80 shadow-xl flex flex-col items-center justify-center"
                  style={{
                    left: `${b.x}%`,
                    bottom: `${b.y}px`,
                    width: `${b.radius * 2}px`,
                    height: `${b.radius * 2}px`,
                    background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 50%), ${b.color}`,
                  }}
                >
                  <span className="text-lg select-none filter drop-shadow">
                    {b.student.avatarEmoji || '🧸'}
                  </span>
                  <span className="text-white font-black text-xs text-center px-1.5 py-0.5 rounded bg-slate-950/55 truncate max-w-[92%] projector-text">
                    {b.student.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Arcade Cabinet Border */}
        <div className="h-11 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 border-t-4 border-pink-300 px-6 flex items-center justify-between z-30">
          <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 projector-text">
            <span>🪙 SẴN SÀNG THẢ CÀNG</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-yellow-200 projector-text">
            SĨ SỐ TRONG TỦ: {balls.length} BÓNG
          </span>
        </div>
      </div>
    </GameStageHUD>
  );
};
