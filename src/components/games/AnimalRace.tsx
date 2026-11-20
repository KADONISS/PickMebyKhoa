import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Play, RotateCcw, Zap, Flag, Trophy, Crown } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import type { Student } from '../../types';

interface RacerState {
  student: Student;
  progress: number; // 0 to 100
  speed: number;
  isBoosting: boolean;
  rank: number;
}

export const AnimalRace: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [racers, setRacers] = useState<RacerState[]>([]);
  const [raceStatus, setRaceStatus] = useState<'idle' | 'countdown' | 'racing' | 'finished'>('idle');
  const [countdownNum, setCountdownNum] = useState<number | string>(3);

  const raceIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const totalDuration = SPEED_DURATIONS[gameSpeed];

  // Initialize racers when students change
  useEffect(() => {
    const initialRacers: RacerState[] = availableStudents.map((s, idx) => ({
      student: s,
      progress: 0,
      speed: 1,
      isBoosting: false,
      rank: idx + 1,
    }));
    setRacers(initialRacers);
    setRaceStatus('idle');
  }, [availableStudents]);

  // Clean intervals on unmount
  useEffect(() => {
    return () => {
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Compute live Top 3
  const topRacers = useMemo(() => {
    return [...racers]
      .sort((a, b) => b.progress - a.progress)
      .slice(0, Math.min(3, racers.length));
  }, [racers]);

  // Reset race
  const resetRace = () => {
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setRaceStatus('idle');
    setRacers((prev) =>
      prev.map((r, idx) => ({
        ...r,
        progress: 0,
        speed: 1,
        isBoosting: false,
        rank: idx + 1,
      }))
    );
  };

  // Start Race with 3-2-1 countdown
  const startCountdown = () => {
    if (raceStatus !== 'idle' && raceStatus !== 'finished') return;
    if (availableStudents.length === 0) return;

    soundManager.playClick();
    setRaceStatus('countdown');
    let count = 3;
    setCountdownNum(count);
    soundManager.playCountdown(false);

    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        soundManager.playCountdown(false);
      } else if (count === 0) {
        setCountdownNum('XUẤT PHÁT! 🚀');
        soundManager.playCountdown(true);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        runRace();
      }
    }, 850);
  };

  // Run the dramatic race simulation
  const runRace = () => {
    setRaceStatus('racing');

    // Pre-select a genuine winner so the ending is definitive and thrilling
    const winnerIndex = Math.floor(Math.random() * racers.length);
    const chosenWinnerStudent = racers[winnerIndex].student;

    const tickInterval = 250; // update speed and progress every 250ms
    const totalTicks = Math.max(12, Math.floor(totalDuration / tickInterval));
    let currentTick = 0;

    raceIntervalRef.current = window.setInterval(() => {
      currentTick += 1;
      const progressRatio = currentTick / totalTicks;

      setRacers((prevRacers) => {
        let hasWinner = false;
        let winningRacer: RacerState | null = null;

        const updated = prevRacers.map((racer) => {
          const isChosenWinner = racer.student.id === chosenWinnerStudent.id;

          // Base step increment to reach ~100% near totalTicks
          const baseStep = 100 / totalTicks;

          // Dynamic speed variations: random boost or slow down
          let randomFactor = 0.5 + Math.random() * 1.1; // 0.5x to 1.6x
          let isBoosting = false;

          // 25% chance of turbo boost
          if (Math.random() < 0.25) {
            randomFactor *= 1.8;
            isBoosting = true;
          }

          // Near the end (last 25% of race), give chosen winner strong surge
          if (progressRatio > 0.75 && isChosenWinner) {
            randomFactor *= 2.2;
            isBoosting = true;
          }

          // Slight catch-up mechanic for lagging runners to keep race tight
          if (racer.progress < progressRatio * 80) {
            randomFactor *= 1.3;
          }

          let newProgress = racer.progress + baseStep * randomFactor;

          // Prevent non-winners from crossing 100% before the chosen winner
          if (!isChosenWinner && newProgress >= 98 && progressRatio < 0.95) {
            newProgress = 95 + Math.random() * 3;
          }

          // Check if chosen winner hits finish line or final tick reached
          if (isChosenWinner && (newProgress >= 100 || currentTick >= totalTicks)) {
            newProgress = 100;
            hasWinner = true;
            winningRacer = { ...racer, progress: 100 };
          }

          return {
            ...racer,
            progress: Math.min(newProgress, 100),
            speed: randomFactor,
            isBoosting,
          };
        });

        // Compute rankings
        const sorted = [...updated].sort((a, b) => b.progress - a.progress);
        const ranked = updated.map((racer) => {
          const rank = sorted.findIndex((s) => s.student.id === racer.student.id) + 1;
          return { ...racer, rank };
        });

        if (hasWinner || currentTick >= totalTicks) {
          if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
          setRaceStatus('finished');

          const finalWinner = winningRacer ? (winningRacer as RacerState).student : sorted[0].student;

          setTimeout(() => {
            openWinnerModal(finalWinner, 'race');
          }, 500);
        }

        return ranked;
      });
    }, tickInterval);
  };

  const isClassLarge = racers.length > 15;

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-6 w-full max-w-6xl mx-auto h-full">
      {racers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Top Control & Leaderboard Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Live Top 3 Leaderboard */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm uppercase tracking-wider shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Top 3 Dẫn Đầu:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {topRacers.map((racer, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={racer.student.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        index === 0
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md'
                          : index === 1
                          ? 'bg-slate-200/20 border-slate-300 text-slate-200'
                          : 'bg-orange-500/20 border-orange-400 text-orange-300'
                      }`}
                    >
                      <span className="text-base">{medals[index]}</span>
                      <span className="text-base">{racer.student.avatarEmoji}</span>
                      <span className="truncate max-w-[90px] sm:max-w-[120px]">
                        {racer.student.name}
                      </span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {Math.floor(racer.progress)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {raceStatus === 'idle' || raceStatus === 'finished' ? (
                <button
                  onClick={startCountdown}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>{raceStatus === 'finished' ? 'CHẠY LẠI' : 'BẮT ĐẦU ĐUA'}</span>
                </button>
              ) : (
                <div className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-sm animate-pulse flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-amber-400" />
                  <span>ĐANG ĐUA GAY CẤN...</span>
                </div>
              )}

              {raceStatus !== 'idle' && (
                <button
                  onClick={resetRace}
                  className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
                  title="Đặt lại đường đua"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Countdown Overlay Modal */}
          {raceStatus === 'countdown' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
              <div className="text-center transform animate-in zoom-in-75 duration-200">
                <div className="text-8xl sm:text-9xl font-black bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent filter drop-shadow-2xl animate-bounce">
                  {countdownNum}
                </div>
                <div className="text-white text-xl sm:text-2xl font-black mt-4 uppercase tracking-widest">
                  Chuẩn bị bứt tốc!
                </div>
              </div>
            </div>
          )}

          {/* Racetrack Container */}
          <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-4 sm:p-6 border-2 border-slate-700 shadow-2xl overflow-hidden">
            {/* Finish Line Checkered Banner */}
            <div className="absolute top-0 bottom-0 right-12 sm:right-16 w-8 pointer-events-none flex flex-col z-10 border-l border-r border-slate-600 shadow-lg">
              <div
                className="w-full h-full opacity-70"
                style={{
                  backgroundImage: `repeating-conic-gradient(#ffffff 0% 25%, #000000 0% 50%)`,
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 p-1 rounded-full shadow-md">
                <Flag className="w-4 h-4 fill-slate-900" />
              </div>
            </div>

            {/* Racers Track Lanes */}
            <div
              className={`space-y-2.5 overflow-y-auto pr-8 ${
                isClassLarge ? 'max-h-[58vh]' : 'max-h-[68vh]'
              }`}
            >
              {racers.map((racer) => {
                const isLeader = racer.rank === 1 && racer.progress > 5;
                const laneHeight = isClassLarge ? 'py-1.5' : 'py-2.5';

                return (
                  <div
                    key={racer.student.id}
                    className={`relative rounded-2xl border transition-all flex items-center ${laneHeight} px-3 ${
                      isLeader
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : racer.isBoosting
                        ? 'bg-orange-950/30 border-orange-500/50'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800/90'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="w-7 shrink-0 text-center font-black text-xs">
                      {racer.rank === 1 ? (
                        <span className="text-amber-400 text-sm">🥇</span>
                      ) : racer.rank === 2 ? (
                        <span className="text-slate-300 text-sm">🥈</span>
                      ) : racer.rank === 3 ? (
                        <span className="text-orange-400 text-sm">🥉</span>
                      ) : (
                        <span className="text-slate-500 font-mono">#{racer.rank}</span>
                      )}
                    </div>

                    {/* Track Running Area */}
                    <div className="relative flex-1 h-10 sm:h-12 flex items-center mr-10">
                      {/* Lane Dash Line */}
                      <div className="absolute inset-x-0 h-0.5 border-b border-dashed border-slate-700/60" />

                      {/* Moving Runner Character */}
                      <div
                        className="absolute flex items-center gap-2 transform -translate-y-1/2 top-1/2 transition-all duration-300 ease-out"
                        style={{
                          left: `calc(${racer.progress}% * 0.88)`,
                        }}
                      >
                        {/* Animal Emoji + Effects */}
                        <div className="relative flex items-center justify-center">
                          <span
                            className={`text-2xl sm:text-3xl filter drop-shadow select-none inline-block transition-transform ${
                              raceStatus === 'racing' ? 'animate-bounce-slight' : ''
                            } ${racer.isBoosting ? 'scale-125' : 'scale-100'}`}
                          >
                            {racer.student.avatarEmoji || '🐰'}
                          </span>

                          {/* Turbo boost icon */}
                          {racer.isBoosting && raceStatus === 'racing' && (
                            <span className="absolute -top-3 -right-2 text-xs bg-amber-400 text-slate-900 rounded-full px-1 font-black animate-ping">
                              ⚡
                            </span>
                          )}

                          {/* Leader crown */}
                          {isLeader && (
                            <Crown className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                          )}
                        </div>

                        {/* Name Tag Pill */}
                        <div
                          className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-md border whitespace-nowrap transition-all ${
                            isLeader
                              ? 'bg-amber-400 text-slate-950 border-amber-300 scale-105'
                              : racer.isBoosting
                              ? 'bg-orange-500 text-white border-orange-400'
                              : 'bg-slate-700 text-slate-200 border-slate-600'
                          }`}
                        >
                          <span>{racer.student.name}</span>
                        </div>
                      </div>
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
