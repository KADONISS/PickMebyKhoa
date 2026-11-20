import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { WHEEL_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { Play, Sparkles } from 'lucide-react';
import { EmptyState } from '../EmptyState';

export const LuckyWheel: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [pointerTickAnim, setPointerTickAnim] = useState(false);

  // Animation state refs
  const currentRotationRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const lastSliceIndexRef = useRef<number>(-1);

  const numStudents = availableStudents.length;

  // Draw wheel on canvas
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 24;

      if (numStudents === 0) {
        // Draw empty decorative wheel
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 16px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Chưa có học sinh khả dụng', centerX, centerY);
        ctx.restore();
        return;
      }

      const arc = (Math.PI * 2) / numStudents;

      // Draw slices
      for (let i = 0; i < numStudents; i++) {
        const student = availableStudents[i];
        const sliceAngle = rotation + i * arc;
        const color = student.color || WHEEL_COLORS[i % WHEEL_COLORS.length];

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, sliceAngle, sliceAngle + arc);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();

        // Slice text rendering
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(sliceAngle + arc / 2);

        // Adjust font size dynamically based on student count
        let fontSize = 16;
        let textOffset = radius * 0.62;
        let maxChars = 16;

        if (numStudents > 35) {
          fontSize = 10;
          textOffset = radius * 0.72;
          maxChars = 12;
        } else if (numStudents > 25) {
          fontSize = 12;
          textOffset = radius * 0.68;
          maxChars = 14;
        } else if (numStudents > 15) {
          fontSize = 13;
          textOffset = radius * 0.65;
        } else if (numStudents <= 6) {
          fontSize = 18;
          textOffset = radius * 0.55;
        }

        ctx.font = `bold ${fontSize}px 'Nunito', 'Be Vietnam Pro', sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        let displayName = student.name;
        if (displayName.length > maxChars) {
          displayName = displayName.substring(0, maxChars - 1) + '…';
        }

        // Render emoji + name
        const textToDraw = numStudents <= 25 ? `${student.avatarEmoji || ''} ${displayName}` : displayName;
        ctx.fillText(textToDraw, textOffset, 0);

        ctx.restore();
      }

      // Outer rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      // Outer golden dots around the rim
      const dotCount = Math.min(36, Math.max(16, numStudents * 2));
      for (let d = 0; d < dotCount; d++) {
        const dotAngle = (Math.PI * 2 * d) / dotCount;
        const dotX = centerX + (radius + 2) * Math.cos(dotAngle);
        const dotY = centerY + (radius + 2) * Math.sin(dotAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = d % 2 === 0 ? '#fef08a' : '#ffffff';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 3;
        ctx.fill();
      }

      // Center cap
      ctx.beginPath();
      ctx.arc(centerX, centerY, 36, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 36);
      grad.addColorStop(0, '#fef3c7');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Center icon
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('👑', centerX, centerY);

      ctx.restore();
    },
    [availableStudents, numStudents]
  );

  // Redraw when students change
  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [drawWheel, numStudents]);

  // Handle window resize for canvas responsiveness
  useEffect(() => {
    const handleResize = () => {
      drawWheel(currentRotationRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  // Pointer position is at 12 o'clock (-PI / 2)
  // Calculate current slice under pointer
  const getSliceUnderPointer = useCallback(
    (rotation: number) => {
      if (numStudents === 0) return -1;
      const arc = (Math.PI * 2) / numStudents;
      // Pointer is at 12 o'clock: angle = 3*PI/2 (or -PI/2)
      let relativeAngle = (Math.PI * 1.5 - (rotation % (Math.PI * 2))) % (Math.PI * 2);
      if (relativeAngle < 0) relativeAngle += Math.PI * 2;
      return Math.floor(relativeAngle / arc) % numStudents;
    },
    [numStudents]
  );

  // Spin trigger
  const spin = () => {
    if (isSpinning || numStudents === 0) return;

    soundManager.playClick();
    setIsSpinning(true);
    setSelectedStudentName(null);

    // Pick random target winner
    const winningIndex = Math.floor(Math.random() * numStudents);
    const targetStudent = availableStudents[winningIndex];

    const arc = (Math.PI * 2) / numStudents;
    // Calculate target final rotation angle so that target slice stops precisely at 12 o'clock
    // At pointer: (3*PI/2 - (finalRot % 2PI)) % 2PI = winningIndex * arc + arc / 2
    // So finalRot % 2PI = 3*PI/2 - (winningIndex * arc + arc / 2)
    const baseRounds = gameSpeed === 'fast' ? 4 : gameSpeed === 'normal' ? 7 : 10;
    const extraRotations = baseRounds * Math.PI * 2;
    const targetOffset = Math.PI * 1.5 - (winningIndex * arc + arc / 2);

    const startRotation = currentRotationRef.current;
    // Ensure we rotate forward
    let targetRotation = startRotation + extraRotations + ((targetOffset - (startRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));

    const duration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();

    // EaseOutQuart easing function
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    lastSliceIndexRef.current = getSliceUnderPointer(startRotation);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentAngle = startRotation + (targetRotation - startRotation) * easedProgress;
      currentRotationRef.current = currentAngle;

      drawWheel(currentAngle);

      // Check for tick crossing
      const currentSlice = getSliceUnderPointer(currentAngle);
      if (currentSlice !== lastSliceIndexRef.current && currentSlice >= 0) {
        lastSliceIndexRef.current = currentSlice;
        soundManager.playTick(600 + (currentSlice % 3) * 60);
        setPointerTickAnim(true);
        setTimeout(() => setPointerTickAnim(false), 50);
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Finished
        setIsSpinning(false);
        setSelectedStudentName(targetStudent.name);
        setTimeout(() => {
          openWinnerModal(targetStudent, 'wheel');
        }, 350);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-4xl mx-auto">
      {numStudents === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col items-center w-full">
          {/* Wheel Frame */}
          <div className="relative flex items-center justify-center w-full max-w-[460px] aspect-square">
            {/* Ambient Background Glow */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-amber-400/20 via-orange-500/20 to-yellow-300/20 blur-2xl pointer-events-none" />

            {/* 12 o'clock pointer */}
            <div
              className={`absolute -top-3 z-20 flex flex-col items-center transform transition-transform duration-75 origin-top ${
                pointerTickAnim ? 'scale-110 -rotate-6' : 'scale-100 rotate-0'
              }`}
            >
              <div className="w-8 h-10 bg-gradient-to-b from-rose-500 to-red-600 rounded-t-md shadow-xl flex items-center justify-center text-white font-black text-xs border-2 border-white">
                ▼
              </div>
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-red-600 drop-shadow-md" />
            </div>

            {/* HTML5 Canvas Wheel */}
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-full shadow-2xl border-4 border-amber-300/60 bg-slate-900 cursor-pointer"
              onClick={!isSpinning ? spin : undefined}
            />
          </div>

          {/* Controls & Status */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={spin}
              disabled={isSpinning || numStudents === 0}
              className={`relative group overflow-hidden px-10 py-5 rounded-3xl font-black text-xl sm:text-2xl tracking-wide shadow-2xl transition-all transform flex items-center gap-3 ${
                isSpinning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed scale-95 shadow-none'
                  : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 hover:scale-105 active:scale-95 shadow-amber-500/40 hover:shadow-amber-500/60 cursor-pointer'
              }`}
            >
              <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Play className={`w-7 h-7 ${isSpinning ? 'animate-spin' : 'fill-slate-950'}`} />
              <span>{isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}</span>
              <Sparkles className="w-6 h-6 text-slate-950" />
            </button>

            <div className="text-center">
              <span className="text-xs sm:text-sm font-bold text-slate-400 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
                🎯 {numStudents} học sinh trong vòng quay • Nhấp vào vòng quay hoặc bấm nút để quay
              </span>
            </div>

            {selectedStudentName && !isSpinning && (
              <div className="text-sm font-bold text-amber-400 animate-pulse">
                Đã gọi: {selectedStudentName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
