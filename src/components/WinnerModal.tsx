import React, { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useClassroom } from '../hooks/useClassroomStore';
import { soundManager } from '../utils/sound';
import { Trophy, CheckCircle, RotateCcw, X, Sparkles } from 'lucide-react';

export const WinnerModal: React.FC = () => {
  const { winnerState, handleWinnerRemoveFromNext, handleWinnerKeepInList } = useClassroom();
  const { isOpen, winner } = winnerState;

  const triggerConfetti = useCallback(() => {
    // Multi-stage fireworks and confetti blast
    const count = 200;
    const defaults = {
      origin: { y: 0.65 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 30,
      startVelocity: 55,
      colors: ['#FFE66D', '#FF6B6B', '#4ECDC4'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#FF9F1C', '#2EC4B6', '#E71D36'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 1.2,
      colors: ['#9B5DE5', '#F15BB5', '#00BBF9'],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 30,
      decay: 0.92,
      scalar: 1.4,
    });
    fire(0.1, {
      spread: 130,
      startVelocity: 45,
    });
  }, []);

  useEffect(() => {
    if (isOpen && winner) {
      soundManager.playFanfare();
      triggerConfetti();

      // Additional celebratory burst after 600ms
      const t = setTimeout(() => {
        triggerConfetti();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isOpen, winner, triggerConfetti]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Background glow circle */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-amber-400/20 via-pink-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-fast" />

      {/* Main card */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-white via-amber-50/50 to-white rounded-3xl shadow-2xl border-4 border-amber-300 p-8 sm:p-12 text-center overflow-hidden transform animate-in zoom-in-95 duration-300">
        {/* Decorative corner ribbons */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-500 rotate-45 flex items-end justify-center pb-2 text-white font-black text-xs shadow-md">
          VIP
        </div>

        {/* Close button */}
        <button
          onClick={handleWinnerKeepInList}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Đóng (Giữ lại trong danh sách)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Crown & Trophy badge */}
        <div className="inline-flex items-center justify-center relative mb-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 p-1.5 shadow-xl shadow-amber-500/30 flex items-center justify-center">
            <span className="text-5xl sm:text-6xl filter drop-shadow-md">
              {winner.avatarEmoji || '👑'}
            </span>
          </div>
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white p-2 rounded-full shadow-lg animate-bounce-slight">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Subtitle */}
        <div className="flex items-center justify-center gap-2 text-amber-600 font-extrabold uppercase tracking-widest text-sm sm:text-base mb-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Chúc Mừng Người May Mắn</span>
          <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        {/* Winner Name - Super Large for Projector / TV */}
        <div className="py-4 my-2 px-4 rounded-2xl bg-gradient-to-r from-amber-100/60 via-yellow-100/80 to-amber-100/60 border border-amber-200/80 shadow-inner">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight break-words drop-shadow-sm">
            {winner.name}
          </h2>
        </div>

        <p className="text-slate-500 text-sm sm:text-base font-medium mt-3 mb-8">
          Bạn đã được vương quốc gọi tên cho thử thách lần này! 🎉
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleWinnerRemoveFromNext}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <CheckCircle className="w-6 h-6 shrink-0" />
            <div className="text-left leading-tight">
              <div>Tiếp tục</div>
              <div className="text-xs text-emerald-100 font-normal">Loại khỏi lượt sau</div>
            </div>
          </button>

          <button
            onClick={handleWinnerKeepInList}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-extrabold text-base sm:text-lg border border-slate-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-6 h-6 shrink-0 text-slate-600" />
            <div className="text-left leading-tight">
              <div>Giữ lại</div>
              <div className="text-xs text-slate-500 font-normal">Vẫn có thể gọi lại</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
