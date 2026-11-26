import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';
import type { Student } from '../../types';

interface CrowdPerson {
  student: Student;
  row: number;
  baseX: number;
  offsetY: number;
  isAbducted: boolean;
}

export const UfoAbduction: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [crowd, setCrowd] = useState<CrowdPerson[]>([]);
  const [isAbducting, setIsAbducting] = useState(false);
  const [ufoX, setUfoX] = useState<number>(50);
  const [ufoY, setUfoY] = useState<number>(16);
  const [isBeamActive, setIsBeamActive] = useState(false);
  const [abductedStudent, setAbductedStudent] = useState<Student | null>(null);
  const [liftHeight, setLiftHeight] = useState<number>(0);

  const ufoXRef = useRef<number>(50);
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

  useEffect(() => {
    const total = availableStudents.length;
    if (total === 0) {
      setCrowd([]);
      return;
    }

    const rowsCount = total > 30 ? 3 : total > 15 ? 2 : 1;
    const itemsPerRow = Math.ceil(total / rowsCount);

    const newCrowd: CrowdPerson[] = availableStudents.map((s, idx) => {
      const row = idx % rowsCount;
      const col = Math.floor(idx / rowsCount);
      const span = 84;
      const step = span / Math.max(1, itemsPerRow - 1 || 1);
      const jitter = (Math.random() - 0.5) * (step * 0.38);
      const baseX = Math.max(7, Math.min(93, 8 + col * step + jitter));
      const offsetY = row * 26;

      return {
        student: s,
        row,
        baseX,
        offsetY,
        isAbducted: false,
      };
    });

    setCrowd(newCrowd);
    setIsAbducting(false);
    setIsBeamActive(false);
    setAbductedStudent(null);
    setLiftHeight(0);
    ufoXRef.current = 50;
    setUfoX(50);
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setIsAbducting(false);
    setIsBeamActive(false);
    setAbductedStudent(null);
    setLiftHeight(0);
    ufoXRef.current = 50;
    setUfoX(50);
    setUfoY(16);
  }, [clearAllTimers]);

  const summonUfo = useCallback(() => {
    if (isAbducting || crowd.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsAbducting(true);
    setIsBeamActive(false);
    setAbductedStudent(null);
    setLiftHeight(0);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    const winningIdx = Math.floor(Math.random() * crowd.length);
    const targetPerson = crowd[winningIdx];
    const targetX = targetPerson.baseX;

    const searchPhaseDuration = totalDuration * 0.68;
    const lockPhaseDuration = totalDuration * 0.16;
    let lockStartX: number | null = null;

    const animateFlight = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < searchPhaseDuration) {
        const freq = gameSpeed === 'fast' ? 0.005 : 0.003;
        const currentX = Math.max(
          10,
          Math.min(90, 50 + Math.sin(elapsed * freq) * 38 + Math.cos(elapsed * freq * 1.7) * 8)
        );
        const currentY = 14 + Math.sin(elapsed * freq * 2) * 4;
        ufoXRef.current = currentX;
        setUfoX(currentX);
        setUfoY(currentY);

        if (Math.floor(elapsed / 200) % 3 === 0) {
          soundManager.playTick(450 + (elapsed % 400));
        }

        animFrameRef.current = requestAnimationFrame(animateFlight);
      } else if (elapsed < searchPhaseDuration + lockPhaseDuration) {
        if (lockStartX === null) lockStartX = ufoXRef.current;
        const lockProgress = (elapsed - searchPhaseDuration) / lockPhaseDuration;
        const eased = 1 - Math.pow(1 - lockProgress, 3);
        const nextX = lockStartX + (targetX - lockStartX) * eased;
        ufoXRef.current = nextX;
        setUfoX(nextX);
        setUfoY(16);

        animFrameRef.current = requestAnimationFrame(animateFlight);
      } else {
        ufoXRef.current = targetX;
        setUfoX(targetX);
        setUfoY(16);

        setIsBeamActive(true);
        soundManager.playUfoBeam(1.5);

        addTimeout(() => {
          setAbductedStudent(targetPerson.student);

          const liftStartTime = performance.now();
          const liftDuration = 1350;

          const animateLift = (nowTime: number) => {
            const liftElapsed = nowTime - liftStartTime;
            const progress = Math.min(liftElapsed / liftDuration, 1);
            const easedLift = Math.pow(progress, 2);
            setLiftHeight(easedLift);

            if (progress < 1) {
              animFrameRef.current = requestAnimationFrame(animateLift);
            } else {
              addTimeout(() => {
                openWinnerModal(targetPerson.student, 'ufo');
                setIsAbducting(false);
              }, 380);
            }
          };

          animFrameRef.current = requestAnimationFrame(animateLift);
        }, 280);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFlight);
  }, [isAbducting, crowd, gameSpeed, clearAllTimers, openWinnerModal]);

  return (
    <GameStageHUD
      gameId="ufo"
      subtitle="Đĩa Bay Bắt Cóc: UFO rọi luồng sáng Tractor Beam hút học sinh lên phi thuyền!"
      isRunning={isAbducting}
      actionLabel="TRIỆU HỒI UFO"
      runningLabel="UFO ĐANG QUÉT MỤC TIÊU..."
      actionGradient="from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white"
      onPrimaryAction={summonUfo}
      onReset={resetGame}
    >
      {/* Sci-Fi Alien Night Stage */}
      <div className="relative w-full h-[62vh] min-h-[460px] rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl bg-gradient-to-b from-[#07091c] via-[#10153d] to-[#1e123c]">
        {/* Cosmic Nebula Glow */}
        <div className="absolute -top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Twinkling Night Stars */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-12 text-yellow-200 text-sm animate-ping">✦</div>
          <div className="absolute top-16 right-24 text-cyan-200 text-base animate-pulse">★</div>
          <div className="absolute top-36 left-1/4 text-white text-xs animate-pulse">✦</div>
          <div className="absolute top-24 right-1/3 text-indigo-200 text-sm animate-ping">★</div>
          <div className="absolute top-10 right-1/2 text-yellow-100 text-xs animate-pulse">✦</div>
          <div className="absolute top-8 right-12 text-4xl sm:text-5xl filter drop-shadow-[0_0_16px_rgba(253,224,71,0.55)]">
            🌙
          </div>
        </div>

        {/* UFO Tractor Beam Light */}
        {isBeamActive && (
          <div
            className="absolute pointer-events-none transition-all duration-300 transform -translate-x-1/2 z-20"
            style={{
              left: `${ufoX}%`,
              top: `${ufoY + 6}%`,
              width: '260px',
              height: '72%',
            }}
          >
            <div
              className="w-full h-full opacity-75 animate-pulse"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                background:
                  'linear-gradient(to bottom, rgba(52, 211, 153, 0.95), rgba(6, 182, 212, 0.45) 60%, rgba(16, 185, 129, 0.15) 100%)',
                filter: 'drop-shadow(0 0 18px rgba(52, 211, 153, 0.85))',
              }}
            />
            <div className="absolute bottom-8 left-1/4 text-emerald-300 text-sm animate-bounce">✨</div>
            <div className="absolute bottom-20 right-1/4 text-cyan-200 text-sm animate-ping">✨</div>
            <div className="absolute bottom-32 left-1/3 text-green-200 text-base animate-pulse">⚡</div>
          </div>
        )}

        {/* UFO Flying Saucer */}
        <div
          className="absolute z-30 transform -translate-x-1/2 transition-transform duration-100 ease-out flex flex-col items-center"
          style={{ left: `${ufoX}%`, top: `${ufoY}%` }}
        >
          <div className="relative w-32 sm:w-40 h-14 flex items-center justify-center">
            <div className="absolute -top-4 w-14 sm:w-18 h-9 sm:h-11 rounded-t-full bg-cyan-300/45 border-2 border-cyan-200 backdrop-blur-sm shadow-[0_0_18px_rgba(6,182,212,0.85)] flex items-center justify-center">
              <span className="text-base sm:text-lg animate-bounce">👽</span>
            </div>
            <div className="relative w-full h-9 sm:h-11 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border-2 border-cyan-300 shadow-2xl flex items-center justify-around px-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" />
            </div>
          </div>

          <div
            className={`w-8 h-2.5 rounded-full transition-colors ${
              isBeamActive
                ? 'bg-emerald-300 shadow-[0_0_24px_#10b981]'
                : 'bg-cyan-400/60 shadow-sm'
            }`}
          />
        </div>

        {/* Rolling Grass Hills */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-emerald-900 via-emerald-800 to-teal-900/60 rounded-t-[40%] border-t-2 border-emerald-400/40" />
        <div className="absolute -bottom-4 inset-x-0 h-28 bg-gradient-to-t from-emerald-950 to-emerald-900 rounded-t-[30%]" />

        {/* Crowd of Students */}
        <div className="absolute bottom-6 inset-x-0 h-32 px-4 flex items-end justify-center pointer-events-none">
          {crowd.map((person) => {
            const isThisAbducted = abductedStudent?.id === person.student.id;
            const bottomOffset = isThisAbducted ? 24 + liftHeight * 280 : 24 - person.offsetY;

            return (
              <div
                key={person.student.id}
                className={`absolute transform -translate-x-1/2 flex flex-col items-center transition-all ${
                  isThisAbducted ? 'z-40' : 'z-10'
                }`}
                style={{
                  left: `${person.baseX}%`,
                  bottom: `${bottomOffset}px`,
                  transform: isThisAbducted
                    ? `translateX(-50%) scale(${1 + liftHeight * 0.75}) rotate(${liftHeight * 14}deg)`
                    : 'translateX(-50%) scale(1)',
                }}
              >
                <div
                  className={`px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black shadow-md border whitespace-nowrap transition-all ${
                    isThisAbducted
                      ? 'bg-emerald-400 text-slate-950 border-white ring-4 ring-emerald-300 shadow-[0_0_22px_#10b981]'
                      : 'bg-slate-900/90 text-white border-slate-600'
                  }`}
                >
                  {person.student.name}
                </div>

                <div
                  className={`text-2xl sm:text-3xl filter drop-shadow mt-1 ${
                    isThisAbducted ? 'animate-bounce' : ''
                  }`}
                >
                  {person.student.avatarEmoji || '🧑‍🚀'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GameStageHUD>
  );
};
