import { useEffect } from 'react';
import { useClassroom } from './useClassroomStore';
import { GAME_INFOS } from '../utils/constants';
import { soundManager } from '../utils/sound';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Global classroom keyboard shortcuts (presentation clicker & teacher keyboard support).
 * - Esc: Close drawer or return to game lobby
 * - 1..9, 0, W: Switch directly to mini-game 1..11
 * - M: Toggle sound mute
 * - D: Toggle classroom management drawer
 * - F: Toggle fullscreen mode
 */
export function useGlobalKeyboardControls() {
  const {
    currentView,
    goToLobby,
    selectGame,
    toggleSound,
    isDrawerOpen,
    setIsDrawerOpen,
    winnerState,
  } = useClassroom();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Esc closes drawer first; otherwise returns to lobby if inside a game
      if (e.key === 'Escape') {
        if (winnerState.isOpen) return;
        if (isDrawerOpen) {
          e.preventDefault();
          soundManager.playClick();
          setIsDrawerOpen(false);
          return;
        }
        if (currentView === 'game') {
          e.preventDefault();
          goToLobby();
          return;
        }
      }

      // Do not trigger global navigation while modal or drawer is blocking
      if (winnerState.isOpen || isDrawerOpen) return;

      // Number keys 1-9 and 0 jump directly to mini-games 1-10
      if (/^[0-9]$/.test(e.key)) {
        const idx = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
        const targetGame = GAME_INFOS[idx];
        if (targetGame) {
          e.preventDefault();
          selectGame(targetGame.id);
        }
        return;
      }

      const lower = e.key.toLowerCase();

      if (lower === 'w') {
        const targetGame = GAME_INFOS[10];
        if (targetGame) {
          e.preventDefault();
          selectGame(targetGame.id);
        }
        return;
      }

      if (lower === 'm') {
        e.preventDefault();
        toggleSound();
        soundManager.playClick();
      } else if (lower === 'd') {
        e.preventDefault();
        soundManager.playClick();
        setIsDrawerOpen((prev) => !prev);
      } else if (lower === 'f') {
        e.preventDefault();
        soundManager.playClick();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentView,
    goToLobby,
    selectGame,
    toggleSound,
    isDrawerOpen,
    setIsDrawerOpen,
    winnerState.isOpen,
  ]);
}

interface UseGameShortcutsOptions {
  onPrimaryAction: () => void;
  onReset?: () => void;
  isRunning: boolean;
  disabled?: boolean;
}

/**
 * Per-game action shortcuts for the active mini-game stage.
 * - Space / Enter: Trigger primary game action (when idle)
 * - R: Reset current game
 */
export function useGameShortcuts({
  onPrimaryAction,
  onReset,
  isRunning,
  disabled = false,
}: UseGameShortcutsOptions) {
  const { isDrawerOpen, winnerState } = useClassroom();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isDrawerOpen || winnerState.isOpen) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        // Avoid double-triggering if user focused a button and pressed Space/Enter
        if (document.activeElement instanceof HTMLButtonElement) {
          return;
        }
        e.preventDefault();
        if (!isRunning && !disabled) {
          onPrimaryAction();
        }
      } else if (e.key.toLowerCase() === 'r' && onReset) {
        e.preventDefault();
        soundManager.playClick();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrimaryAction, onReset, isRunning, disabled, isDrawerOpen, winnerState.isOpen]);
}
