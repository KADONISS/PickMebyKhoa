import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Sparkles, RotateCcw } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import type { Student } from '../../types';

interface CrowdPerson {
  student: Student;
  row: number; // 0, 1, 2 (depth rows)
  baseX: number; // percentage along grass (5% to 95%)
  offsetY: number; // depth offset
  isAbducted: boolean;
}

export const UfoAbduction: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [crowd, setCrowd] = useState<CrowdPerson[]>([]);
  const [isAbducting, setIsAbducting] = useState(false);
  const [ufoX, setUfoX] = useState<number>(50); // percentage (0 - 100)
  const [ufoY, setUfoY] = useState<number>(18); // percentage from top
  const [isBeamActive, setIsBeamActive] = useState(false);
  const [abductedStudent, setAbductedStudent] = useState<Student | null>(null);
  const [liftHeight, setLiftHeight] = useState<number>(0); // 0 (ground) to 1 (into UFO)

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

  // Initialize crowd arrangement
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
      const span = 86; // percentage width to spread across
      const step = span / Math.max(1, itemsPerRow - 1 || 1);
      const jitter = (Math.random() - 0.5) * (step * 0.4);
      const baseX = Math.max(6, Math.min(94, 7 + col * step + jitter));
      const offsetY = row * 24; // depth layer offset

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
    setUfoX(50);
  }, [availableStudents]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const resetGame = () => {
    clearAllTimers();
    setIsAbducting(false);
    setIsBeamActive(false);
    setAbductedStudent(null);
    setLiftHeight(0);
    setUfoX(50);
  };

  const summonUfo = () => {
    if (isAbducting || crowd.length === 0) return;

    clearAllTimers();
    soundManager.playClick();
    setIsAbducting(true);
    setIsBeamActive(false);
    setAbductedStudent(null);
    setLiftHeight(0);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    // Pick target winner
    const winningIdx = Math.floor(Math.random() * crowd.length);
    const targetPerson = crowd[winningIdx];
    const targetX = targetPerson.baseX;

    let searchPhaseDuration = totalDuration * 0.7; // search and fly around
    let lockPhaseDuration = totalDuration * 0.15; // slow down and hover precisely above target

    const animateFlight = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < searchPhaseDuration) {
        // Fast flying & zig-zag scanning
        const freq = gameSpeed === 'fast' ? 0.005 : 0.003;
        const currentX = 50 + Math.sin(elapsed * freq) * 38 + Math.cos(elapsed * freq * 1.7) * 8;
        const currentY = 16 + Math.sin(elapsed * freq * 2) * 5;
        setUfoX(Math.max(10, Math.min(90, currentX)));
        setUfoY(currentY);

        if (Math.floor(elapsed / 200) % 3 === 0) {
          soundManager.playTick(450 + (elapsed % 400));
        }

        animFrameRef.current = requestAnimationFrame(animateFlight);
      } else if (elapsed < searchPhaseDuration + lockPhaseDuration) {
        // Decelerating and smoothly centering directly above target
        const lockProgress = (elapsed - searchPhaseDuration) / lockPhaseDuration;
        const eased = 1 - Math.pow(1 - lockProgress, 3);
        const lastX = ufoX;
        setUfoX(lastX + (targetX - lastX) * eased);
        setUfoY(18);

        animFrameRef.current = requestAnimationFrame(animateFlight);
      } else {
        // Locked on target student!
        setUfoX(targetX);
        setUfoY(18);

        // Turn ON Tractor Beam!
        setIsBeamActive(true);
        soundManager.playUfoBeam(1.5);

        // Abduct student upward
        addTimeout(() => {
          setAbductedStudent(targetPerson.student);

          // Animate levitation upward
          const liftStartTime = performance.now();
          const liftDuration = 1400; // 1.4s levitation

          const animateLift = (nowTime: number) => {
            const liftElapsed = nowTime - liftStartTime;
            const progress = Math.min(liftElapsed / liftDuration, 1);
            const easedLift = Math.pow(progress, 2); // Accelerate upward

            setLiftHeight(easedLift);

            if (progress < 1) {
              animFrameRef.current = requestAnimationFrame(animateLift);
            } else {
              // Sucked into UFO!
              addTimeout(() => {
                openWinnerModal(targetPerson.student, 'ufo');
                setIsAbducting(false);
              }, 400);
            }
          };

          animFrameRef.current = requestAnimationFrame(animateLift);
        }, 300);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFlight);
  };

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full select-none">
      {crowd.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Control Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
              <span className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>
                🛸
              </span>
              <span>Đĩa Bay Bắt Cóc: UFO quét luồng sáng và hút học sinh lên phi thuyền!</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={summonUfo}
                disabled={isAbducting}
                className={`px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                  isAbducting
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/30 hover:scale-105 active:scale-95'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isAbducting ? 'animate-spin' : ''}`} />
                <span>{isAbducting ? 'UFO ĐANG QUÉT MỤC TIÊU...' : 'TRIỆU HỒI UFO'}</span>
              </button>

              {isAbducting && (
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

          {/* Sci-Fi Alien Night Stage */}
          <div className="relative w-full h-[66vh] min-h-[480px] rounded-3xl overflow-hidden border-4 border-indigo-900/80 shadow-2xl bg-gradient-to-b from-[#090a1f] via-[#101438] to-[#1e1338]">
            {/* Twinkling Night Stars */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-8 left-12 text-yellow-200 text-xs animate-ping">✦</div>
              <div
                className="absolute top-16 right-24 text-cyan-200 text-sm animate-pulse"
                style={{ animationDuration: '2s' }}
              >
                ★
              </div>
              <div
                className="absolute top-36 left-1/4 text-white text-xs animate-pulse"
                style={{ animationDuration: '3s' }}
              >
                ✦
              </div>
              <div className="absolute top-24 right-1/3 text-indigo-300 text-sm animate-ping">★</div>
              <div
                className="absolute top-10 right-1/2 text-yellow-100 text-xs animate-pulse"
                style={{ animationDuration: '4s' }}
              >
                ✦
              </div>
              {/* Crescent Moon */}
              <div className="absolute top-8 right-12 text-4xl filter drop-shadow-[0_0_12px_rgba(253,224,71,0.5)]">
                🌙
              </div>
            </div>

            {/* UFO Tractor Beam Light (Cone of green/cyan luminescence) */}
            {isBeamActive && (
              <div
                className="absolute pointer-events-none transition-all duration-300 transform -translate-x-1/2 z-20"
                style={{
                  left: `${ufoX}%`,
                  top: `${ufoY + 6}%`,
                  width: '240px',
                  height: '70%',
                }}
              >
                {/* Glowing Beam Cone */}
                <div
                  className="w-full h-full opacity-70 animate-pulse"
                  style={{
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    background:
                      'linear-gradient(to bottom, rgba(52, 211, 153, 0.95), rgba(6, 182, 212, 0.4) 60%, rgba(16, 185, 129, 0.15) 100%)',
                    filter: 'drop-shadow(0 0 15px rgba(52, 211, 153, 0.8))',
                  }}
                />
                {/* Rising glowing dust particles */}
                <div className="absolute bottom-6 left-1/4 text-emerald-300 text-xs animate-bounce">
                  ✨
                </div>
                <div className="absolute bottom-16 right-1/4 text-cyan-200 text-xs animate-ping">
                  ✨
                </div>
                <div className="absolute bottom-28 left-1/3 text-green-200 text-sm animate-pulse">
                  ⚡
                </div>
              </div>
            )}

            {/* UFO Flying Saucer */}
            <div
              className="absolute z-30 transform -translate-x-1/2 transition-transform duration-100 ease-out flex flex-col items-center"
              style={{
                left: `${ufoX}%`,
                top: `${ufoY}%`,
              }}
            >
              {/* Cockpit Dome */}
              <div className="relative w-28 sm:w-36 h-12 sm:h-14 flex items-center justify-center">
                {/* Glass Dome */}
                <div className="absolute -top-3 w-12 sm:w-16 h-8 sm:h-10 rounded-t-full bg-cyan-300/40 border-2 border-cyan-200 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.8)] flex items-center justify-center">
                  <span className="text-sm sm:text-base animate-bounce">👽</span>
                </div>
                {/* Saucer Metallic Hull */}
                <div className="relative w-full h-8 sm:h-10 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border-2 border-cyan-300 shadow-2xl flex items-center justify-around px-3">
                  {/* Glowing Saucer Lights */}
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"
                    style={{ animationDuration: '0.6s' }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"
                    style={{ animationDelay: '0.3s' }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse"
                    style={{ animationDuration: '0.8s' }}
                  />
                </div>
              </div>

              {/* Bottom Spotlight Emitter */}
              <div
                className={`w-6 h-2 rounded-full transition-colors ${
                  isBeamActive
                    ? 'bg-emerald-300 shadow-[0_0_20px_#10b981]'
                    : 'bg-cyan-400/50 shadow-sm'
                }`}
              />
            </div>

            {/* Rolling Grass Hills at Bottom */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-emerald-900 via-emerald-800 to-teal-900/60 rounded-t-[40%] border-t-2 border-emerald-500/40" />
            <div className="absolute -bottom-4 inset-x-0 h-28 bg-gradient-to-t from-emerald-950 to-emerald-900 rounded-t-[30%]" />

            {/* Crowd of Students on the Grass */}
            <div className="absolute bottom-6 inset-x-0 h-32 px-4 flex items-end justify-center pointer-events-none">
              {crowd.map((person) => {
                const isThisAbducted = abductedStudent?.id === person.student.id;
                // If this student is being abducted, calculate their vertical elevation towards UFO
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
                        ? `translateX(-50%) scale(${1 + liftHeight * 0.8}) rotate(${liftHeight * 15}deg)`
                        : 'translateX(-50%) scale(1)',
                    }}
                  >
                    {/* Name Pill Tag */}
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-md border whitespace-nowrap transition-all ${
                        isThisAbducted
                          ? 'bg-emerald-400 text-slate-950 border-white ring-4 ring-emerald-300 text-sm shadow-[0_0_20px_#10b981]'
                          : 'bg-slate-900/90 text-slate-200 border-slate-700'
                      }`}
                    >
                      {person.student.name}
                    </div>

                    {/* Character Avatar */}
                    <div
                      className={`text-2xl sm:text-3xl filter drop-shadow mt-1 transition-transform ${
                        isThisAbducted ? 'animate-bounce' : 'hover:scale-110'
                      }`}
                    >
                      {person.student.avatarEmoji || '🧑‍🚀'}
                    </div>
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
