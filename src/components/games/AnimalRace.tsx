import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Flag, Trophy, Crown } from 'lucide-react';
import { GameStageHUD } from '../GameStageHUD';
import type { Student } from '../../types';

interface RacerState {
  student: Student;
  progress: number;
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

  useEffect(() => {
    return () => {
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const topRacers = useMemo(() => {
    return [...racers]
      .sort((a, b) => b.progress - a.progress)
      .slice(0, Math.min(3, racers.length));
  }, [racers]);

  const resetRace = useCallback(() => {
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
  }, []);

  const runRace = useCallback(() => {
    setRaceStatus('racing');

    if (availableStudents.length === 0) return;
    const winnerIndex = Math.floor(Math.random() * availableStudents.length);
    const chosenWinnerStudent = availableStudents[winnerIndex];

    const tickInterval = 220;
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
          const baseStep = 100 / totalTicks;

          let randomFactor = 0.55 + Math.random() * 1.1;
          let isBoosting = false;

          if (Math.random() < 0.25) {
            randomFactor *= 1.8;
            isBoosting = true;
          }

          if (progressRatio > 0.72 && isChosenWinner) {
            randomFactor *= 2.25;
            isBoosting = true;
          }

          if (racer.progress < progressRatio * 78) {
            randomFactor *= 1.3;
          }

          let newProgress = racer.progress + baseStep * randomFactor;

          if (!isChosenWinner && newProgress >= 97 && progressRatio < 0.96) {
            newProgress = 94 + Math.random() * 3;
          }

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
  }, [availableStudents, totalDuration, openWinnerModal]);

  const startCountdown = useCallback(() => {
    if (raceStatus !== 'idle' && raceStatus !== 'finished') return;
    if (availableStudents.length === 0) return;

    // Reset progress to 0 before starting new race if finished
    if (raceStatus === 'finished') {
      setRacers((prev) =>
        prev.map((r, idx) => ({
          ...r,
          progress: 0,
          speed: 1,
          isBoosting: false,
          rank: idx + 1,
        }))
      );
    }

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
    }, 800);
  }, [raceStatus, availableStudents.length, runRace]);

  const isClassLarge = racers.length > 15;
  const isRunning = raceStatus === 'countdown' || raceStatus === 'racing';

  return (
    <GameStageHUD
      gameId="race"
      subtitle="Đếm ngược 3-2-1 xuất phát! Thú cưng bứt tốc ⚡ về vạch đích cờ ca-rô!"
      isRunning={isRunning}
      actionLabel={raceStatus === 'finished' ? 'CHẠY LẠI VÒNG MỚI' : 'BẮT ĐẦU ĐUA'}
      runningLabel={raceStatus === 'countdown' ? 'CHUẨN BỊ...' : 'ĐANG ĐUA GAY CẤN...'}
      actionGradient="from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950"
      onPrimaryAction={startCountdown}
      onReset={resetRace}
      showResetWhenIdle={raceStatus === 'finished'}
      statusExtra={
        <div className="hidden md:flex items-center gap-2">
          <span className="flex items-center gap-1 text-amber-400 font-black text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4" aria-hidden="true" />
            <span>Top 3:</span>
          </span>
          {topRacers.map((racer, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={racer.student.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black ${
                  index === 0
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : index === 1
                    ? 'bg-slate-200/15 border-slate-300/60 text-slate-100'
                    : 'bg-orange-500/20 border-orange-400/60 text-orange-200'
                }`}
              >
                <span>{medals[index]}</span>
                <span>{racer.student.avatarEmoji}</span>
                <span className="truncate max-w-[85px]">{racer.student.name}</span>
                <span className="text-amber-300 font-mono">{Math.floor(racer.progress)}%</span>
              </div>
            );
          })}
        </div>
      }
    >
      {/* Countdown Overlay Modal */}
      {raceStatus === 'countdown' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="text-center animate-pop-in">
            <div className="text-7xl sm:text-9xl font-black bg-gradient-to-tr from-amber-300 via-orange-500 to-yellow-200 bg-clip-text text-transparent filter drop-shadow-2xl animate-bounce">
              {countdownNum}
            </div>
            <div className="text-white text-xl sm:text-3xl font-black mt-4 uppercase tracking-widest projector-text">
              Chuẩn bị bứt tốc!
            </div>
          </div>
        </div>
      )}

      {/* Stadium Racetrack Container */}
      <div className="relative rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/40 shadow-2xl bg-gradient-to-b from-[#0b1f1a] via-[#0f172a] to-[#090d16] overflow-hidden">
        {/* Starting Line Marker */}
        <div className="absolute top-0 bottom-0 left-14 w-1 border-l-2 border-dashed border-emerald-400/40 pointer-events-none z-10" />

        {/* Finish Line Checkered Banner */}
        <div className="absolute top-0 bottom-0 right-10 sm:right-14 w-8 pointer-events-none flex flex-col z-10 border-l-2 border-r-2 border-amber-300/70 shadow-lg">
          <div
            className="w-full h-full opacity-80"
            style={{
              backgroundImage: `repeating-conic-gradient(#ffffff 0% 25%, #0f172a 0% 50%)`,
              backgroundSize: '16px 16px',
            }}
          />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg">
            <Flag className="w-4 h-4 fill-slate-950" aria-hidden="true" />
          </div>
        </div>

        {/* Racers Track Lanes */}
        <div
          className={`space-y-2.5 overflow-y-auto pr-8 ${
            isClassLarge ? 'max-h-[54vh]' : 'max-h-[60vh]'
          }`}
        >
          {racers.map((racer, idx) => {
            const isLeader = racer.rank === 1 && racer.progress > 5;
            const laneHeight = isClassLarge ? 'py-1.5' : 'py-2.5';

            return (
              <div
                key={racer.student.id}
                className={`relative rounded-2xl border transition-all flex items-center ${laneHeight} px-3 ${
                  isLeader
                    ? 'bg-amber-950/40 border-amber-400/80 shadow-lg shadow-amber-500/15'
                    : racer.isBoosting
                    ? 'bg-orange-950/35 border-orange-400/60'
                    : idx % 2 === 0
                    ? 'bg-emerald-950/25 border-emerald-800/40'
                    : 'bg-slate-800/60 border-slate-700/70'
                }`}
              >
                {/* Rank Badge */}
                <div className="w-8 shrink-0 text-center font-black text-xs sm:text-sm">
                  {racer.rank === 1 ? (
                    <span className="text-amber-400 text-base">🥇</span>
                  ) : racer.rank === 2 ? (
                    <span className="text-slate-200 text-base">🥈</span>
                  ) : racer.rank === 3 ? (
                    <span className="text-orange-400 text-base">🥉</span>
                  ) : (
                    <span className="text-slate-300 font-mono">#{racer.rank}</span>
                  )}
                </div>

                {/* Track Running Area */}
                <div className="relative flex-1 h-11 sm:h-12 flex items-center mr-10">
                  <div className="absolute inset-x-0 h-0.5 border-b border-dashed border-slate-600/70" />

                  <div
                    className="absolute flex items-center gap-2 transform -translate-y-1/2 top-1/2 transition-all duration-200 ease-out"
                    style={{ left: `calc(${racer.progress}% * 0.87)` }}
                  >
                    {/* Dust Cloud when boosting */}
                    {racer.isBoosting && raceStatus === 'racing' && (
                      <span className="text-sm sm:text-base animate-ping opacity-80 -mr-1">💨</span>
                    )}

                    {/* Animal Emoji + Effects */}
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`text-2xl sm:text-3xl filter drop-shadow select-none inline-block transition-transform ${
                          raceStatus === 'racing' ? 'animate-bounce-slight' : ''
                        } ${racer.isBoosting ? 'scale-125' : 'scale-100'}`}
                      >
                        {racer.student.avatarEmoji || '🐰'}
                      </span>

                      {racer.isBoosting && raceStatus === 'racing' && (
                        <span className="absolute -top-3 -right-2 text-xs bg-amber-400 text-slate-950 rounded-full px-1 font-black shadow">
                          ⚡
                        </span>
                      )}

                      {isLeader && (
                        <Crown
                          className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400 fill-amber-400 animate-bounce"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Name Tag Pill */}
                    <div
                      className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black shadow-md border whitespace-nowrap transition-all ${
                        isLeader
                          ? 'bg-amber-400 text-slate-950 border-white scale-105'
                          : racer.isBoosting
                          ? 'bg-orange-500 text-white border-amber-300'
                          : 'bg-slate-800 text-white border-slate-600'
                      }`}
                    >
                      {racer.student.name}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GameStageHUD>
  );
};
