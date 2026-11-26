import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { WHEEL_COLORS } from '../../utils/constants';
import { SPEED_DURATIONS } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';

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
  const bulbPhaseRef = useRef<number>(0);

  const numStudents = availableStudents.length;

  // Draw wheel on canvas
  const drawWheel = useCallback(
    (rotation: number, bulbPhase: number = 0) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) return;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 26;

      if (numStudents === 0) {
        ctx.restore();
        return;
      }

      const arc = (Math.PI * 2) / numStudents;

      // Outer decorative dark ring behind bulbs
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

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

        // Crisp slice divider
        ctx.lineWidth = numStudents > 30 ? 1.5 : 2.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.stroke();

        // Slice text rendering (high-contrast projector readability)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(sliceAngle + arc / 2);

        let fontSize = 17;
        let textOffset = radius * 0.86;
        let maxChars = 16;

        if (numStudents > 35) {
          fontSize = 11;
          textOffset = radius * 0.9;
          maxChars = 12;
        } else if (numStudents > 25) {
          fontSize = 13;
          textOffset = radius * 0.88;
          maxChars = 14;
        } else if (numStudents > 15) {
          fontSize = 15;
          textOffset = radius * 0.86;
        } else if (numStudents <= 6) {
          fontSize = 20;
          textOffset = radius * 0.82;
        }

        ctx.font = `800 ${fontSize}px 'Nunito', 'Be Vietnam Pro', sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        let displayName = student.name;
        if (displayName.length > maxChars) {
          displayName = displayName.substring(0, maxChars - 1) + '…';
        }

        const textToDraw =
          numStudents <= 24 ? `${displayName} ${student.avatarEmoji || ''}` : displayName;

        // Crisp dark outline + white fill for maximum projector legibility
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeText(textToDraw, textOffset, 0);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(textToDraw, textOffset, 0);

        ctx.restore();
      }

      // Metallic golden rim
      const rimGrad = ctx.createLinearGradient(0, 0, width, height);
      rimGrad.addColorStop(0, '#fde047');
      rimGrad.addColorStop(0.5, '#f59e0b');
      rimGrad.addColorStop(1, '#d97706');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
      ctx.lineWidth = 10;
      ctx.strokeStyle = rimGrad;
      ctx.stroke();

      // Glowing Marquee LED Bulbs around the rim
      const dotCount = Math.min(36, Math.max(18, numStudents * 2));
      for (let d = 0; d < dotCount; d++) {
        const dotAngle = (Math.PI * 2 * d) / dotCount;
        const dotX = centerX + (radius + 3) * Math.cos(dotAngle);
        const dotY = centerY + (radius + 3) * Math.sin(dotAngle);
        const isLit = (d + bulbPhase) % 2 === 0;

        ctx.beginPath();
        ctx.arc(dotX, dotY, isLit ? 4 : 2.8, 0, Math.PI * 2);
        ctx.fillStyle = isLit ? '#fef9c3' : '#78350f';
        ctx.shadowColor = isLit ? '#fef08a' : 'transparent';
        ctx.shadowBlur = isLit ? 8 : 0;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Center metallic golden hub
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(centerX - 8, centerY - 8, 4, centerX, centerY, 40);
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(0.5, '#fbbf24');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center crown icon
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', centerX, centerY + 1);

      ctx.restore();
    },
    [availableStudents, numStudents]
  );

  // Redraw when students change
  useEffect(() => {
    drawWheel(currentRotationRef.current, bulbPhaseRef.current);
  }, [drawWheel, numStudents]);

  // Ambient marquee bulb blink while idle
  useEffect(() => {
    if (isSpinning || numStudents === 0) return;
    const interval = window.setInterval(() => {
      bulbPhaseRef.current = (bulbPhaseRef.current + 1) % 2;
      drawWheel(currentRotationRef.current, bulbPhaseRef.current);
    }, 650);
    return () => clearInterval(interval);
  }, [isSpinning, numStudents, drawWheel]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawWheel(currentRotationRef.current, bulbPhaseRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  // Pointer position is at 12 o'clock (-PI / 2)
  const getSliceUnderPointer = useCallback(
    (rotation: number) => {
      if (numStudents === 0) return -1;
      const arc = (Math.PI * 2) / numStudents;
      let relativeAngle = (Math.PI * 1.5 - (rotation % (Math.PI * 2))) % (Math.PI * 2);
      if (relativeAngle < 0) relativeAngle += Math.PI * 2;
      return Math.floor(relativeAngle / arc) % numStudents;
    },
    [numStudents]
  );

  // Spin trigger
  const spin = useCallback(() => {
    if (isSpinning || numStudents === 0) return;

    soundManager.playClick();
    setIsSpinning(true);
    setSelectedStudentName(null);

    const winningIndex = Math.floor(Math.random() * numStudents);
    const targetStudent = availableStudents[winningIndex];

    const arc = (Math.PI * 2) / numStudents;
    const baseRounds = gameSpeed === 'fast' ? 4 : gameSpeed === 'normal' ? 7 : 10;
    const extraRotations = baseRounds * Math.PI * 2;
    const targetOffset = Math.PI * 1.5 - (winningIndex * arc + arc / 2);

    const startRotation = currentRotationRef.current;
    const targetRotation =
      startRotation +
      extraRotations +
      ((targetOffset - (startRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));

    const duration = SPEED_DURATIONS[gameSpeed];
    const startTime = performance.now();
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    lastSliceIndexRef.current = getSliceUnderPointer(startRotation);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentAngle = startRotation + (targetRotation - startRotation) * easedProgress;
      currentRotationRef.current = currentAngle;

      // Rapid bulb chase while spinning
      const phase = Math.floor(elapsed / 120) % 2;
      bulbPhaseRef.current = phase;

      drawWheel(currentAngle, phase);

      // Tick crossing sound + spring pointer bounce
      const currentSlice = getSliceUnderPointer(currentAngle);
      if (currentSlice !== lastSliceIndexRef.current && currentSlice >= 0) {
        lastSliceIndexRef.current = currentSlice;
        soundManager.playTick(620 + (currentSlice % 4) * 55);
        setPointerTickAnim(true);
        setTimeout(() => setPointerTickAnim(false), 55);
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setSelectedStudentName(targetStudent.name);
        setTimeout(() => {
          openWinnerModal(targetStudent, 'wheel');
        }, 350);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
  }, [isSpinning, numStudents, availableStudents, gameSpeed, getSliceUnderPointer, drawWheel, openWinnerModal]);

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <GameStageHUD
      gameId="wheel"
      subtitle="Nhấp trực tiếp vào vòng quay hoặc bấm SPACE để quay!"
      isRunning={isSpinning}
      actionLabel="QUAY NGAY"
      runningLabel="ĐANG QUAY..."
      actionGradient="from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950"
      onPrimaryAction={spin}
      statusExtra={
        selectedStudentName && !isSpinning ? (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-200 text-xs sm:text-sm font-black animate-pop-in">
            Vừa gọi: <span className="text-amber-300">{selectedStudentName}</span>
          </div>
        ) : undefined
      }
    >
      <div className="clay-card rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[450px]">
        {/* Ambient Spotlight Glow */}
        <div
          className={`absolute w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
            isSpinning
              ? 'bg-gradient-to-tr from-amber-500/30 via-orange-500/25 to-yellow-400/30 opacity-100'
              : 'bg-gradient-to-tr from-amber-500/15 via-orange-500/15 to-yellow-400/15 opacity-80'
          }`}
        />

        {/* Wheel Frame */}
        <div className="relative flex items-center justify-center w-full max-w-[460px] sm:max-w-[500px] aspect-square">
          {/* 12 o'clock golden-crimson pointer */}
          <div
            className={`absolute -top-4 z-20 flex flex-col items-center transform transition-transform duration-75 origin-top ${
              pointerTickAnim ? 'scale-110 -rotate-12' : 'scale-100 rotate-0'
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-b from-rose-500 to-red-600 rounded-xl shadow-2xl flex items-center justify-center text-white font-black text-sm border-2 border-amber-200">
              ▼
            </div>
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[20px] border-t-red-600 drop-shadow-lg -mt-1" />
          </div>

          {/* HTML5 Canvas Wheel */}
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-full shadow-[0_0_50px_rgba(245,158,11,0.22)] cursor-pointer transition-transform active:scale-[0.99]"
            onClick={!isSpinning ? spin : undefined}
            aria-label="Vòng quay may mắn - Nhấp để quay"
          />
        </div>
      </div>
    </GameStageHUD>
  );
};
