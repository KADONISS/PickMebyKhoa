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
    if (filterCategory === 'arcade') return ['claw', 'gacha', 'balloon'].includes(game.id);
    if (filterCategory === 'action') return ['race', 'ufo', 'fishing'].includes(game.id);
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-600/20 border-2 border-amber-400/30 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-extrabold text-xs tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sảnh Trò Chơi Lớp Học (9 Game)</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Chọn Trò Chơi Gọi Tên</span>
              <span className="text-3xl sm:text-4xl">👑</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Khám phá bộ sưu tập <strong>9 mini-game</strong> tương tác sinh động được thiết kế riêng
              cho máy chiếu & TV lớp học. Gọi tên công bằng, tạo hứng khởi học tập bất tận!
            </p>

            {/* Filter Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  filterCategory === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tất Cả ({GAME_INFOS.length})
              </button>
              <button
                onClick={() => setFilterCategory('classic')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  filterCategory === 'classic'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🎡 Cổ Điển & Rương Quà
              </button>
              <button
                onClick={() => setFilterCategory('arcade')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  filterCategory === 'arcade'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🕹️ Arcade & Gashapon
              </button>
              <button
                onClick={() => setFilterCategory('action')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  filterCategory === 'action'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🚀 Đua Thú & Không Gian
              </button>
            </div>
          </div>

          {/* Classroom quick info card */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/80 shadow-xl flex flex-col gap-3 min-w-[260px] w-full md:w-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Lớp đang chọn
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="font-black text-base text-amber-300 truncate">
              {activeClassroom ? activeClassroom.name : 'Chưa có lớp'}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Sẵn sàng gọi:</span>
              <span className="font-extrabold text-amber-400">
                {availableStudents.length} / {allStudents.length} HS
              </span>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsDrawerOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Users className="w-4 h-4" />
              <span>Quản lý danh sách lớp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 9 Mini-Game Cards Grid (3x3 Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => {
          return (
            <div
              key={game.id}
              onClick={() => handleStartGame(game.id)}
              className={`group relative overflow-hidden rounded-3xl bg-slate-900/90 border-2 ${game.borderAccent} shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-2 transform`}
            >
              {/* Card Top Banner with Gradient */}
              <div
                className={`p-6 bg-gradient-to-br ${game.colorGradient} text-white relative overflow-hidden`}
              >
                {/* Decorative background shapes */}
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg border border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {game.icon}
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/20 text-white shadow-sm">
                    {game.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm">
                  {game.title}
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {game.description}
                </p>

                {/* Highlights tags */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Điểm nổi bật:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {game.highlightTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartGame(game.id);
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r ${game.colorGradient} text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Vào Chơi Ngay</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Settings & Mode Controls Bar */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-300 font-extrabold text-sm">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Cài Đặt Vòng Chơi:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300">
            <span className="text-slate-400">Thời gian:</span>
            {(Object.keys(SPEED_LABELS) as GameSpeed[]).map((spd) => {
              const isSelected = gameSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => {
                    soundManager.playClick();
                    setGameSpeed(spd);
                  }}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{SPEED_LABELS[spd].icon}</span>
                  <span>{SPEED_LABELS[spd].label}</span>
                </button>
              );
            })}
          </div>

          {/* No Repeat Toggle */}
          <label className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noRepeat}
              onChange={(e) => setNoRepeat(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 border-slate-600 bg-slate-700"
            />
            <span>Không lặp lại học sinh</span>
          </label>

          {/* Reset Called Students */}
          {calledStudents.length > 0 && (
            <button
              onClick={() => resetCalledStudents()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Làm mới ({calledStudents.length} bạn đã gọi)</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              toggleSound();
              soundManager.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
