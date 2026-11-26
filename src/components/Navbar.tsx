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
  Keyboard,
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
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close dropdown popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsGameMenuOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setIsShortcutHelpOpen(false);
      }
    };
    if (isGameMenuOpen || isShortcutHelpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGameMenuOpen, isShortcutHelpOpen]);

  const toggleFullscreen = async () => {
    soundManager.playClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen?.();
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
    <header className="sticky top-0 z-40 glass-panel-dark border-b border-slate-700/80 text-white shadow-xl px-3 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: App Logo & Classroom Badge Pill */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <button
            onClick={goToLobby}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl px-1 py-0.5"
            title="Quay lại Sảnh Trò Chơi (Esc)"
          >
            <span className="text-3xl animate-bounce-slight filter drop-shadow" aria-hidden="true">
              👑
            </span>
            <div>
              <h1 className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
                Vương Quốc Gọi Tên
              </h1>
              <div className="text-xs text-amber-200/85 font-bold flex items-center gap-1">
                <span>{GAME_INFOS.length} Mini-Game Lớp Học</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              </div>
            </div>
          </button>

          {/* Classroom drawer trigger pill (44px+ touch target) */}
          <button
            onClick={() => {
              soundManager.playClick();
              setIsDrawerOpen(true);
            }}
            className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 hover:text-white transition-all font-bold text-xs sm:text-sm shadow-sm active:scale-95 cursor-pointer"
            title="Mở quản lý lớp học (Phím D)"
            aria-label="Mở quản lý lớp học và danh sách"
          >
            <Users className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[110px] sm:max-w-[160px]">
              {activeClassroom ? activeClassroom.name : 'Chọn lớp'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
              {availableStudents.length}/{allStudents.length}
            </span>
          </button>
        </div>

        {/* Center: Quick Switcher + "Chọn Trò Chơi (9)" Dropdown Button */}
        <div className="relative flex items-center gap-1.5 p-1.5 bg-slate-800/95 rounded-2xl border border-slate-700 max-w-full">
          {/* Lobby Button */}
          <button
            onClick={goToLobby}
            aria-pressed={currentView === 'lobby'}
            className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'lobby'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-200 hover:text-white hover:bg-slate-700/70'
            }`}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sảnh Game</span>
          </button>

          {/* "Chọn Trò Chơi (10)" Menu Trigger Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                soundManager.playClick();
                setIsGameMenuOpen((prev) => !prev);
              }}
              aria-expanded={isGameMenuOpen}
              className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all border whitespace-nowrap cursor-pointer ${
                isGameMenuOpen || currentView === 'game'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-slate-700/90 text-amber-300 border-slate-600 hover:bg-slate-700'
              }`}
            >
              <span aria-hidden="true">{currentView === 'game' ? currentGame?.icon : '🎮'}</span>
              <span>
                {currentView === 'game' ? currentGame?.title : `Chọn Trò Chơi (${GAME_INFOS.length})`}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isGameMenuOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {/* 2x5 Visual Grid Dropdown Popover */}
            {isGameMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[340px] sm:w-[660px] max-w-[calc(100vw-2rem)] bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-4 shadow-2xl z-50 animate-pop-in">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">👑</span>
                    <span className="font-black text-sm text-amber-300 uppercase tracking-wide">
                      {GAME_INFOS.length} Mini-Game (Phím 1-9, 0)
                    </span>
                  </div>
                  <button
                    onClick={() => setIsGameMenuOpen(false)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                    aria-label="Đóng danh sách trò chơi"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                {/* 2x5 Grid of Games */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {GAME_INFOS.map((game, idx) => {
                    const isSelected = currentView === 'game' && activeGame === game.id;
                    const keyLabel = idx === 9 ? '0' : String(idx + 1);
                    return (
                      <button
                        key={game.id}
                        onClick={() => handleGameSelect(game.id)}
                        className={`relative flex flex-col items-center justify-center p-3 min-h-[92px] rounded-2xl border text-center transition-all cursor-pointer group hover:scale-[1.03] active:scale-95 ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400 text-amber-200 shadow-lg'
                            : 'bg-slate-800/90 border-slate-700 hover:bg-slate-800 text-slate-100 hover:border-slate-500'
                        }`}
                      >
                        <span className="absolute top-1.5 left-2 text-[11px] font-black text-slate-400 bg-slate-900/80 px-1.5 rounded">
                          {keyLabel}
                        </span>
                        <span
                          className="text-2xl sm:text-3xl mb-1.5 filter drop-shadow group-hover:scale-110 transition-transform"
                          aria-hidden="true"
                        >
                          {game.icon}
                        </span>
                        <span className="text-xs font-black line-clamp-1">
                          {game.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick horizontal scroll pill strip for games on desktop */}
          <div className="hidden xl:flex items-center gap-1 pl-1">
            {GAME_INFOS.map((game, idx) => {
              const isActive = currentView === 'game' && activeGame === game.id;
              const keyLabel = idx === 9 ? '0' : String(idx + 1);
              return (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className={`min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 scale-105 shadow-md ring-2 ring-amber-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
                  }`}
                  title={`${game.title} (Phím ${keyLabel})`}
                  aria-label={`Chọn ${game.title}`}
                >
                  <span aria-hidden="true">{game.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Utility Controls (Speed Selector, Sound Toggle, Shortcuts, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div
            className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs sm:text-sm"
            role="group"
            aria-label="Chọn tốc độ trò chơi"
          >
            {(Object.keys(SPEED_LABELS) as GameSpeed[]).map((spd) => {
              const isSelected = gameSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  aria-pressed={isSelected}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={`Thời gian chạy: ${SPEED_LABELS[spd].time}`}
                >
                  <span aria-hidden="true">{SPEED_LABELS[spd].icon}</span>
                  <span className="hidden sm:inline">{SPEED_LABELS[spd].label}</span>
                </button>
              );
            })}
          </div>

          {/* Sound Toggle (44x44px) */}
          <button
            onClick={() => {
              toggleSound();
              soundManager.playClick();
            }}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
            }`}
            title={soundEnabled ? 'Âm thanh: BẬT (Phím M)' : 'Âm thanh: TẮT (Phím M)'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" aria-hidden="true" />
            ) : (
              <VolumeX className="w-5 h-5" aria-hidden="true" />
            )}
          </button>

          {/* Keyboard Shortcuts Help Button (44x44px) */}
          <div className="relative hidden sm:block" ref={helpRef}>
            <button
              onClick={() => {
                soundManager.playClick();
                setIsShortcutHelpOpen((prev) => !prev);
              }}
              aria-expanded={isShortcutHelpOpen}
              aria-label="Xem phím tắt điều khiển lớp học"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 transition-all cursor-pointer"
              title="Phím tắt giáo viên & bút thuyết trình"
            >
              <Keyboard className="w-5 h-5" aria-hidden="true" />
            </button>

            {isShortcutHelpOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border-2 border-amber-400/70 rounded-2xl p-4 shadow-2xl z-50 animate-pop-in text-sm">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                  <span className="font-black text-amber-300 flex items-center gap-2">
                    <Keyboard className="w-4 h-4" aria-hidden="true" />
                    Phím Tắt Giáo Viên
                  </span>
                  <button
                    onClick={() => setIsShortcutHelpOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    aria-label="Đóng bảng phím tắt"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center justify-between">
                    <span>Quay / Bắt đầu game</span>
                    <span className="kbd-badge">SPACE / ENTER</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Chọn nhanh {GAME_INFOS.length} game</span>
                    <span className="kbd-badge">1 – 9, 0</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Đặt lại màn chơi</span>
                    <span className="kbd-badge">R</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Quay về sảnh / Đóng</span>
                    <span className="kbd-badge">ESC</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Toàn màn hình</span>
                    <span className="kbd-badge">F</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Bật / Tắt âm thanh</span>
                    <span className="kbd-badge">M</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Quản lý lớp học</span>
                    <span className="kbd-badge">D</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle (44x44px) */}
          <button
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình chiếu lớp học'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Thoát toàn màn hình (Phím F)' : 'Toàn màn hình chiếu lớp học (Phím F)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
