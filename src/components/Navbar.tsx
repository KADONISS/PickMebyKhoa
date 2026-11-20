import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../hooks/useClassroomStore';
import { GAME_INFOS } from '../utils/constants';
import { SPEED_LABELS } from '../types';
import type { GameSpeed, GameType } from '../types';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Users,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  X,
} from 'lucide-react';
import { soundManager } from '../utils/sound';

export const Navbar: React.FC = () => {
  const {
    activeGame,
    currentView,
    goToLobby,
    selectGame,
    gameSpeed,
    setGameSpeed,
    soundEnabled,
    toggleSound,
    setIsDrawerOpen,
    availableStudents,
    allStudents,
    activeClassroom,
  } = useClassroom();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close 3x3 menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsGameMenuOpen(false);
      }
    };
    if (isGameMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGameMenuOpen]);

  const toggleFullscreen = async () => {
    soundManager.playClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // ignore
    }
  };

  const handleGameSelect = (id: GameType) => {
    soundManager.playClick();
    selectGame(id);
    setIsGameMenuOpen(false);
  };

  const handleSpeedChange = (speed: GameSpeed) => {
    soundManager.playClick();
    setGameSpeed(speed);
  };

  const currentGame = GAME_INFOS.find((g) => g.id === activeGame);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: App Logo & Classroom Badge Pill */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div
            onClick={goToLobby}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            title="Quay lại Sảnh Trò Chơi"
          >
            <span className="text-3xl animate-bounce-slight filter drop-shadow">👑</span>
            <div>
              <h1 className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent flex items-center gap-1.5">
                Vương Quốc Gọi Tên
              </h1>
              <div className="text-[11px] text-amber-200/70 font-semibold flex items-center gap-1">
                <span>9 Mini-Game Lớp Học</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Classroom drawer trigger pill */}
          <button
            onClick={() => {
              soundManager.playClick();
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all font-bold text-xs shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            title="Mở quản lý lớp học và danh sách"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span className="truncate max-w-[110px] sm:max-w-[150px]">
              {activeClassroom ? activeClassroom.name : 'Chọn lớp'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black text-[11px]">
              {availableStudents.length}/{allStudents.length}
            </span>
          </button>
        </div>

        {/* Center: Quick Switcher + "Chọn Trò Chơi (9)" Dropdown Button */}
        <div className="relative flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 max-w-full">
          {/* Lobby Button */}
          <button
            onClick={goToLobby}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'lobby'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sảnh Game</span>
          </button>

          {/* "Chọn Trò Chơi (9)" 3x3 Menu Trigger Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                soundManager.playClick();
                setIsGameMenuOpen((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border whitespace-nowrap cursor-pointer ${
                isGameMenuOpen || currentView === 'game'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-slate-700/80 text-amber-300 border-slate-600 hover:bg-slate-700'
              }`}
            >
              <span>{currentView === 'game' ? currentGame?.icon : '🎮'}</span>
              <span>
                {currentView === 'game' ? currentGame?.title : 'Chọn Trò Chơi (9)'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isGameMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* 3x3 Visual Grid Dropdown Popover */}
            {isGameMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[340px] sm:w-[460px] bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-4 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <span className="font-black text-sm text-amber-300 uppercase tracking-wide">
                      Danh Sách 9 Mini-Game
                    </span>
                  </div>
                  <button
                    onClick={() => setIsGameMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 3x3 Grid of Games */}
                <div className="grid grid-cols-3 gap-2.5">
                  {GAME_INFOS.map((game) => {
                    const isSelected = currentView === 'game' && activeGame === game.id;
                    return (
                      <button
                        key={game.id}
                        onClick={() => handleGameSelect(game.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer group hover:scale-105 active:scale-95 ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400 text-amber-300 shadow-lg'
                            : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl mb-1 filter drop-shadow group-hover:scale-110 transition-transform">
                          {game.icon}
                        </span>
                        <span className="text-[11px] sm:text-xs font-black line-clamp-1">
                          {game.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold line-clamp-1 mt-0.5">
                          {game.badge.split('•')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick horizontal scroll pill strip for 9 games on desktop */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto max-w-[420px] pl-1">
            {GAME_INFOS.map((game) => {
              const isActive = currentView === 'game' && activeGame === game.id;
              return (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className={`p-1.5 rounded-xl text-sm transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 scale-110 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={game.title}
                >
                  <span>{game.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Utility Controls (Speed Selector, Sound Toggle, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
            {(Object.keys(SPEED_LABELS) as GameSpeed[]).map((spd) => {
              const isSelected = gameSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Thời gian chạy: ${SPEED_LABELS[spd].time}`}
                >
                  <span>{SPEED_LABELS[spd].icon}</span>
                  <span className="hidden sm:inline">{SPEED_LABELS[spd].label}</span>
                </button>
              );
            })}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              toggleSound();
              soundManager.playClick();
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
            }`}
            title={soundEnabled ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình chiếu lớp học'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
