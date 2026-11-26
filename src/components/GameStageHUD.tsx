import React from 'react';
import { useClassroom } from '../hooks/useClassroomStore';
import { useGameShortcuts } from '../hooks/useKeyboardControls';
import { GAME_INFOS } from '../utils/constants';
import type { GameType } from '../types';
import { EmptyState } from './EmptyState';
import { ArrowLeft, LayoutGrid, Play, RotateCcw, Sparkles, Keyboard } from 'lucide-react';

interface GameStageHUDProps {
  gameId: GameType;
  subtitle: string;
  isRunning: boolean;
  actionLabel: string;
  runningLabel: string;
  actionGradient?: string;
  onPrimaryAction: () => void;
  onReset?: () => void;
  showResetWhenIdle?: boolean;
  secondaryAction?: React.ReactNode;
  statusExtra?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}

export const GameStageHUD: React.FC<GameStageHUDProps> = ({
  gameId,
  subtitle,
  isRunning,
  actionLabel,
  runningLabel,
  actionGradient = 'from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950',
  onPrimaryAction,
  onReset,
  showResetWhenIdle = false,
  secondaryAction,
  statusExtra,
  disabled = false,
  children,
}) => {
  const { availableStudents, allStudents, goToLobby } = useClassroom();
  const gameInfo = GAME_INFOS.find((g) => g.id === gameId);

  useGameShortcuts({
    onPrimaryAction,
    onReset,
    isRunning,
    disabled: disabled || availableStudents.length === 0,
  });

  if (availableStudents.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 flex-1 flex items-center justify-center">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 py-2 sm:py-3 flex flex-col gap-3 flex-1 justify-between select-none">
      {/* Top Unified Stage Header */}
      <div className="clay-card rounded-2xl px-3.5 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back Button + Game Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={goToLobby}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/35 text-amber-300 hover:text-amber-200 font-black text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            title="Quay lại Sảnh Trò Chơi (Phím Esc)"
            aria-label="Quay lại Sảnh Trò Chơi"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <LayoutGrid className="w-4 h-4 text-amber-400 hidden sm:inline" aria-hidden="true" />
            <span>Đổi Trò</span>
            <span className="kbd-badge hidden md:inline-flex">ESC</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl sm:text-3xl filter drop-shadow shrink-0" aria-hidden="true">
              {gameInfo?.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg text-white truncate projector-text">
                  {gameInfo?.title}
                </h2>
                {gameInfo && (
                  <span className="hidden lg:inline-block text-xs font-bold text-amber-300 bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    {gameInfo.badge.split('•')[0].trim()}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold truncate">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Extra Game Status (e.g. Live Top 3) + Student Counter */}
        <div className="flex items-center gap-3 flex-wrap">
          {statusExtra}

          <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-600/80 text-xs sm:text-sm font-black text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>
              Sẵn sàng:{' '}
              <span className="text-amber-400 text-sm sm:text-base">{availableStudents.length}</span>
              <span className="text-slate-400 font-bold"> / {allStudents.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Arena Content */}
      <div className="w-full flex-1 flex flex-col justify-center min-h-0">
        {children}
      </div>

      {/* Bottom Master Action Dock */}
      <div className="clay-card rounded-3xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Keyboard Hint + Optional Secondary Action */}
        <div className="flex items-center gap-3">
          {secondaryAction}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/80">
            <Keyboard className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Phím tắt:</span>
            <span className="kbd-badge">SPACE</span>
            <span className="text-slate-400">Chạy</span>
            {onReset && (
              <>
                <span className="text-slate-600">•</span>
                <span className="kbd-badge">R</span>
                <span className="text-slate-400">Đặt lại</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Primary Giant 3D Arcade CTA */}
        <button
          onClick={onPrimaryAction}
          disabled={isRunning || disabled}
          className={`arcade-btn min-h-[56px] sm:min-h-[60px] px-8 sm:px-12 rounded-2xl text-base sm:text-xl mx-auto sm:mx-0 ${
            isRunning
              ? 'bg-slate-700 text-amber-300 border-2 border-amber-400/40 animate-pulse'
              : `bg-gradient-to-r ${actionGradient} border-2 border-white/25`
          }`}
          aria-label={isRunning ? runningLabel : actionLabel}
        >
          {isRunning ? (
            <Sparkles className="w-6 h-6 animate-spin shrink-0" aria-hidden="true" />
          ) : (
            <Play className="w-6 h-6 fill-current shrink-0" aria-hidden="true" />
          )}
          <span>{isRunning ? runningLabel : actionLabel}</span>
          {!isRunning && (
            <span className="kbd-badge hidden sm:inline-flex ml-1">SPACE</span>
          )}
        </button>

        {/* Right: Reset Button */}
        <div className="flex items-center gap-2 min-w-[48px] justify-end">
          {onReset && (isRunning || showResetWhenIdle) && (
            <button
              onClick={() => {
                onReset();
              }}
              className="arcade-btn min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-500/60 text-sm"
              title="Dừng / Đặt lại (Phím R)"
              aria-label="Đặt lại trò chơi"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Đặt lại</span>
              <span className="kbd-badge hidden md:inline-flex">R</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
