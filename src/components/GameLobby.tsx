import React, { useState } from 'react';
import { useClassroom } from '../hooks/useClassroomStore';
import { GAME_INFOS } from '../utils/constants';
import { SPEED_LABELS } from '../types';
import type { GameSpeed, GameType } from '../types';
import {
  Sparkles,
  Users,
  Play,
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { soundManager } from '../utils/sound';

export const GameLobby: React.FC = () => {
  const {
    activeClassroom,
    availableStudents,
    allStudents,
    calledStudents,
    selectGame,
    setIsDrawerOpen,
    gameSpeed,
    setGameSpeed,
    noRepeat,
    setNoRepeat,
    soundEnabled,
    toggleSound,
    resetCalledStudents,
  } = useClassroom();

  const [filterCategory, setFilterCategory] = useState<'all' | 'classic' | 'arcade' | 'action'>('all');

  const handleStartGame = (gameId: GameType) => {
    soundManager.playClick();
    selectGame(gameId);
  };

  const filteredGames = GAME_INFOS.filter((game) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'classic') return ['wheel', 'chests', 'bomb'].includes(game.id);
    if (filterCategory === 'arcade') return ['claw', 'gacha', 'balloon', 'caseopen', 'wish'].includes(game.id);
    if (filterCategory === 'action') return ['race', 'ufo', 'fishing'].includes(game.id);
    return true;
  });

  const readyPercent =
    allStudents.length > 0 ? Math.round((availableStudents.length / allStudents.length) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-7 animate-pop-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-600/20 border-2 border-amber-400/40 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-200 font-black text-xs sm:text-sm tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Sảnh Trò Chơi Lớp Học ({GAME_INFOS.length} Game)</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5 projector-text">
              <span>Chọn Trò Chơi Gọi Tên</span>
              <span className="text-3xl sm:text-4xl" aria-hidden="true">👑</span>
            </h2>

            <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
              Bộ sưu tập <strong className="text-amber-300">{GAME_INFOS.length} mini-game</strong> tối ưu cho máy chiếu
              & bảng tương tác Smartboard. Bấm phím <span className="kbd-badge">1</span>–<span className="kbd-badge">9</span>, <span className="kbd-badge">0</span>, <span className="kbd-badge">W</span> để mở nhanh trò chơi!
            </p>

            {/* Filter Category Tabs (44px+ touch targets) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2" role="tablist" aria-label="Phân loại trò chơi">
              {[
                { id: 'all', label: `Tất Cả (${GAME_INFOS.length})` },
                { id: 'classic', label: '🎡 Cổ Điển & Rương Quà' },
                { id: 'arcade', label: '🕹️ Arcade & Gashapon' },
                { id: 'action', label: '🚀 Đua Thú & Không Gian' },
              ].map((tab) => {
                const isActive = filterCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setFilterCategory(tab.id as typeof filterCategory)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-lg ring-2 ring-amber-200'
                        : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Classroom quick info card */}
          <div className="clay-card rounded-2xl p-5 flex flex-col gap-3 min-w-[270px] w-full md:w-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-extrabold uppercase tracking-wider">
                Lớp đang chọn
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            </div>

            <div className="font-black text-lg text-amber-300 truncate projector-text">
              {activeClassroom ? activeClassroom.name : 'Chưa có lớp'}
            </div>

            <div className="space-y-1.5 bg-slate-800/90 px-3.5 py-2.5 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200">
                <span className="font-semibold">Sẵn sàng gọi:</span>
                <span className="font-black text-amber-400">
                  {availableStudents.length} / {allStudents.length} HS
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-300"
                  style={{ width: `${readyPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsDrawerOpen(true);
              }}
              className="arcade-btn min-h-[46px] w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 font-black text-xs sm:text-sm"
            >
              <Users className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Quản lý danh sách lớp</span>
              <span className="kbd-badge">D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini-Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => {
          const gameIndex = GAME_INFOS.findIndex((g) => g.id === game.id);
          const shortcutKey = gameIndex === 9 ? '0' : gameIndex === 10 ? 'W' : String(gameIndex + 1);
          return (
            <div
              key={game.id}
              onClick={() => handleStartGame(game.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartGame(game.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Mở trò chơi ${game.title}`}
              className={`group relative overflow-hidden rounded-3xl clay-card border-2 ${game.borderAccent} transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400`}
            >
              {/* Card Top Banner with Gradient */}
              <div className={`p-6 bg-gradient-to-br ${game.colorGradient} text-white relative overflow-hidden`}>
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/15 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg border border-white/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span aria-hidden="true">{game.icon}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-black/35 backdrop-blur-sm border border-white/25 text-white shadow-sm">
                      {game.badge}
                    </span>
                    <span
                      className="kbd-badge bg-black/45"
                      title={`Phím tắt ${shortcutKey}`}
                    >
                      #{shortcutKey}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black tracking-tight projector-text">
                  {game.title}
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <p className="text-slate-200 text-sm leading-relaxed font-medium">
                  {game.description}
                </p>

                {/* Highlights tags */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                    Điểm nổi bật:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {game.highlightTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-600/80 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Start Button (52px+ Arcade tactile CTA) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartGame(game.id);
                  }}
                  tabIndex={-1}
                  className={`arcade-btn min-h-[52px] w-full py-3 px-4 rounded-2xl bg-gradient-to-r ${game.colorGradient} text-white text-base`}
                >
                  <Play className="w-5 h-5 fill-white" aria-hidden="true" />
                  <span>Vào Chơi Ngay</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Settings & Mode Controls Bar */}
      <div className="clay-card rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-100 font-black text-sm sm:text-base">
          <Sliders className="w-5 h-5 text-amber-400" aria-hidden="true" />
          <span>Cài Đặt Vòng Chơi:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs sm:text-sm font-bold text-slate-200">
            <span className="text-slate-300 mr-1">Thời gian:</span>
            {(Object.keys(SPEED_LABELS) as GameSpeed[]).map((spd) => {
              const isSelected = gameSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => {
                    soundManager.playClick();
                    setGameSpeed(spd);
                  }}
                  aria-pressed={isSelected}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <span aria-hidden="true">{SPEED_LABELS[spd].icon}</span>
                  <span>{SPEED_LABELS[spd].label}</span>
                </button>
              );
            })}
          </div>

          {/* No Repeat Toggle */}
          <label className="min-h-[44px] flex items-center gap-2.5 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 text-xs sm:text-sm font-bold text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noRepeat}
              onChange={(e) => setNoRepeat(e.target.checked)}
              className="w-5 h-5 text-amber-500 rounded focus:ring-amber-400 border-slate-600 bg-slate-700 cursor-pointer"
            />
            <span>Không lặp lại học sinh</span>
          </label>

          {/* Reset Called Students */}
          {calledStudents.length > 0 && (
            <button
              onClick={() => resetCalledStudents()}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Làm mới ({calledStudents.length} bạn đã gọi)</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              toggleSound();
              soundManager.playClick();
            }}
            aria-pressed={soundEnabled}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
