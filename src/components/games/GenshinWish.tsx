import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS } from '../../types';
import type { Student, WishElementKey, WishRarity } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';

interface RarityConfig {
  rarity: WishRarity;
  stars: number;
  title: string;
  subtitle: string;
  color: string;
  glow: string;
  badgeBg: string;
  borderColor: string;
}

const RARITY_CONFIGS: Record<WishRarity, RarityConfig> = {
  '3star': {
    rarity: '3star',
    stars: 3,
    title: 'Lam Tinh',
    subtitle: 'Ngôi Sao Chăm Chỉ',
    color: '#4B8BFF',
    glow: '#93C5FD',
    badgeBg: 'rgba(75, 139, 255, 0.2)',
    borderColor: 'rgba(147, 197, 253, 0.65)',
  },
  '4star': {
    rarity: '4star',
    stars: 4,
    title: 'Tử Tinh',
    subtitle: 'Tinh Tú Đột Phá',
    color: '#A855F7',
    glow: '#E879F9',
    badgeBg: 'rgba(168, 85, 247, 0.22)',
    borderColor: 'rgba(232, 121, 249, 0.72)',
  },
  '5star': {
    rarity: '5star',
    stars: 5,
    title: 'Kim Tinh',
    subtitle: 'Huyền Thoại Lớp Học',
    color: '#FFD700',
    glow: '#FEF08A',
    badgeBg: 'rgba(255, 215, 0, 0.22)',
    borderColor: 'rgba(254, 240, 138, 0.85)',
  },
};

interface ElementConfig {
  key: WishElementKey;
  name: string;
  icon: string;
  color: string;
  title: string;
  wishText: string;
}

const ELEMENT_CONFIGS: Record<WishElementKey, ElementConfig> = {
  pyro: {
    key: 'pyro',
    name: 'Hỏa',
    icon: '🔥',
    color: '#FF6B35',
    title: 'Ngọn Lửa Nhiệt Huyết',
    wishText: 'Xung phong rực cháy!',
  },
  hydro: {
    key: 'hydro',
    name: 'Thủy',
    icon: '💧',
    color: '#38BDF8',
    title: 'Dòng Chảy Điềm Tĩnh',
    wishText: 'Tư duy mượt mà, linh hoạt!',
  },
  anemo: {
    key: 'anemo',
    name: 'Phong',
    icon: '🌪️',
    color: '#34D399',
    title: 'Cơn Gió Tự Do',
    wishText: 'Ý tưởng sáng tạo bay cao!',
  },
  electro: {
    key: 'electro',
    name: 'Lôi',
    icon: '⚡',
    color: '#C084FC',
    title: 'Tia Chớp Nhạy Bén',
    wishText: 'Phản xạ siêu tốc, bắt bài cực nhanh!',
  },
  dendro: {
    key: 'dendro',
    name: 'Thảo',
    icon: '🌿',
    color: '#4ADE80',
    title: 'Mầm Xanh Tri Thức',
    wishText: 'Ham học hỏi, nảy mầm sáng kiến!',
  },
  cryo: {
    key: 'cryo',
    name: 'Băng',
    icon: '❄️',
    color: '#67E8F9',
    title: 'Băng Tâm Tập Trung',
    wishText: 'Bình tĩnh tự tin, cái đầu lạnh!',
  },
  geo: {
    key: 'geo',
    name: 'Nham',
    icon: '🪨',
    color: '#FBBF24',
    title: 'Nền Tảng Vững Chắc',
    wishText: 'Kiên trì bền bỉ, điểm tựa cả nhóm!',
  },
};

const ELEMENT_KEYS: WishElementKey[] = [
  'pyro',
  'hydro',
  'anemo',
  'electro',
  'dendro',
  'cryo',
  'geo',
];

const PITY_THRESHOLD = 5;

interface StarPoint {
  nx: number;
  ny: number;
  radius: number;
  speed: number;
  phase: number;
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface PulseRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface RevealedWish {
  student: Student;
  rarity: WishRarity;
  element: WishElementKey;
}

function getStudentElement(student: Student): WishElementKey {
  const seed = student.id || student.name;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ELEMENT_KEYS[hash % ELEMENT_KEYS.length];
}

function generateBackgroundStars(count: number): StarPoint[] {
  const stars: StarPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      nx: Math.random(),
      ny: Math.random(),
      radius: 0.8 + Math.random() * 1.9,
      speed: 1.2 + Math.random() * 2.6,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r1 = (a >> 16) & 255;
  const g1 = (a >> 8) & 255;
  const b1 = a & 255;
  const r2 = (b >> 16) & 255;
  const g2 = (b >> 8) & 255;
  const b2 = b & 255;
  const r = Math.round(r1 + (r2 - r1) * clamped);
  const g = Math.round(g1 + (g2 - g1) * clamped);
  const bl = Math.round(b1 + (b2 - b1) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}

function quadBezier(p0: number, p1: number, p2: number, t: number): number {
  const inv = 1 - t;
  return inv * inv * p0 + 2 * inv * t * p1 + t * t * p2;
}

export const GenshinWish: React.FC = () => {
  const { availableStudents, gameSpeed, openWinnerModal } = useClassroom();

  const [isWishing, setIsWishing] = useState(false);
  const [revealedWish, setRevealedWish] = useState<RevealedWish | null>(null);
  const [showRevealCard, setShowRevealCard] = useState(false);
  const [litStars, setLitStars] = useState(0);
  const [pityEnabled, setPityEnabled] = useState(true);
  const [pityCount, setPityCount] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 800,
    height: 460,
    dpr: 1,
  });

  const rafRef = useRef<number | null>(null);
  const idleRafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const runIdRef = useRef(0);
  const isWishingRef = useRef(false);
  isWishingRef.current = isWishing;
  const starsRef = useRef<StarPoint[]>(generateBackgroundStars(85));
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const particlesRef = useRef<SparkleParticle[]>([]);
  const ringsRef = useRef<PulseRing[]>([]);
  const colorShiftedRef = useRef(false);
  const impactTriggeredRef = useRef(false);

  const constellationPairs = useMemo(
    () => [
      [0, 5],
      [5, 12],
      [12, 19],
      [8, 15],
      [15, 23],
      [23, 31],
      [34, 42],
      [42, 49],
      [52, 61],
      [61, 70],
    ],
    [],
  );

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAnimations = useCallback(() => {
    runIdRef.current += 1;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const drawNightSky = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, timeSec: number) => {
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        width * 0.05,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85,
      );
      bgGrad.addColorStop(0, '#1A103C');
      bgGrad.addColorStop(0.55, '#0D1538');
      bgGrad.addColorStop(1, '#050816');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const stars = starsRef.current;

      // Constellation lines
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      for (const [i, j] of constellationPairs) {
        const a = stars[i];
        const b = stars[j];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.nx * width, a.ny * height);
        ctx.lineTo(b.nx * width, b.ny * height);
        ctx.stroke();
      }
      ctx.restore();

      // Twinkling starfield
      for (const s of stars) {
        const alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(timeSec * s.speed + s.phase));
        ctx.fillStyle = `rgba(226, 232, 240, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.nx * width, s.ny * height, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [constellationPairs],
  );

  // Sync canvas dimensions with ResizeObserver & devicePixelRatio (<= 2)
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const updateCanvasSize = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!isWishingRef.current) {
          drawNightSky(ctx, width, height, performance.now() / 1000);
        }
      }
    };

    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(stage);

    return () => {
      observer.disconnect();
    };
  }, [drawNightSky]);

  // Gentle idle starfield twinkle when not wishing
  useEffect(() => {
    if (isWishing) return;

    let active = true;
    const renderIdle = (now: number) => {
      if (!active) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const { width, height, dpr } = sizeRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawNightSky(ctx, width, height, now / 1000);
      }
      idleRafRef.current = requestAnimationFrame(renderIdle);
    };

    idleRafRef.current = requestAnimationFrame(renderIdle);
    return () => {
      active = false;
      if (idleRafRef.current !== null) {
        cancelAnimationFrame(idleRafRef.current);
        idleRafRef.current = null;
      }
    };
  }, [drawNightSky, isWishing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimations();
    };
  }, [clearAnimations]);

  const handleReset = useCallback(() => {
    clearAnimations();
    setIsWishing(false);
    setRevealedWish(null);
    setShowRevealCard(false);
    setLitStars(0);
    if (canvasRef.current) {
      canvasRef.current.style.transform = 'scale(1)';
    }
    trailRef.current = [];
    particlesRef.current = [];
    ringsRef.current = [];
    colorShiftedRef.current = false;
    impactTriggeredRef.current = false;
  }, [clearAnimations]);

  const startWish = useCallback(() => {
    if (isWishing || availableStudents.length === 0) return;

    // 1. STRICT FAIRNESS DECOUPLING: pick winner FIRST with uniform 1/N probability
    const winnerIndex = Math.floor(Math.random() * availableStudents.length);
    const winner = availableStudents[winnerIndex];

    // 2. AFTER winner is chosen, roll cosmetic rarity & deterministic element
    let rarity: WishRarity;
    if (pityEnabled && pityCount + 1 >= PITY_THRESHOLD) {
      rarity = '5star';
    } else {
      const roll = Math.random();
      if (roll < 0.15) {
        rarity = '5star';
      } else if (roll < 0.5) {
        rarity = '4star';
      } else {
        rarity = '3star';
      }
    }

    const nextPityCount = rarity === '5star' ? 0 : pityCount + 1;
    setPityCount(nextPityCount);

    const element = getStudentElement(winner);
    const rarityCfg = RARITY_CONFIGS[rarity];

    clearAnimations();
    const currentRunId = runIdRef.current;

    trailRef.current = [];
    particlesRef.current = [];
    ringsRef.current = [];
    colorShiftedRef.current = false;
    impactTriggeredRef.current = false;

    setRevealedWish({ student: winner, rarity, element });
    setShowRevealCard(false);
    setLitStars(0);
    if (canvasRef.current) {
      canvasRef.current.style.transform = 'scale(1)';
    }
    setIsWishing(true);

    const totalDuration = SPEED_DURATIONS[gameSpeed];
    soundManager.playWishWhoosh(totalDuration / 1000);

    const startTime = performance.now();

    const triggerRevealCard = () => {
      if (runIdRef.current !== currentRunId) return;
      setShowRevealCard(true);
      setLitStars(0);
      for (let i = 1; i <= rarityCfg.stars; i += 1) {
        addTimer(() => {
          if (runIdRef.current !== currentRunId) return;
          setLitStars(i);
        }, i * 90);
      }
    };

    const tick = (now: number) => {
      if (runIdRef.current !== currentRunId) return;

      const elapsed = now - startTime;
      const p = Math.min(elapsed / totalDuration, 1);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const { width, height, dpr } = sizeRef.current;

      // Subtle camera zoom in stages 1 & 2 (direct DOM transform, avoiding 60fps React re-renders)
      if (canvas) {
        canvas.style.transform = p < 0.72 ? `scale(${(1 + (p / 0.72) * 0.06).toFixed(4)})` : 'scale(1)';
      }

      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawNightSky(ctx, width, height, now / 1000);

        const portalX = width * 0.85;
        const portalY = height * 0.14;
        const impactX = width * 0.5;
        const impactY = height * 0.52;

        // Stage 1 (0% -> 18%): Astral Portal opening
        if (p < 0.3) {
          const portalAlpha =
            p < 0.18 ? Math.min(1, p / 0.14) : Math.max(0, 1 - (p - 0.18) / 0.12);
          const portalRadius =
            (p < 0.18 ? 10 + (p / 0.18) * 34 : 44) * Math.min(width, height) * 0.0022;

          ctx.save();
          ctx.globalAlpha = portalAlpha;
          const portalGrad = ctx.createRadialGradient(
            portalX,
            portalY,
            2,
            portalX,
            portalY,
            Math.max(12, portalRadius * 2.2),
          );
          portalGrad.addColorStop(0, '#FFFFFF');
          portalGrad.addColorStop(0.35, '#93C5FD');
          portalGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
          ctx.fillStyle = portalGrad;
          ctx.beginPath();
          ctx.arc(portalX, portalY, Math.max(12, portalRadius * 2.2), 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(portalX, portalY, Math.max(6, portalRadius), now * 0.004, now * 0.004 + Math.PI * 1.5);
          ctx.stroke();
          ctx.restore();
        }

        // Stage 2 (18% -> 72%): Bezier Meteor Flight & Color Shift
        if (p >= 0.18 && p < 0.72) {
          const u = (p - 0.18) / 0.54;
          const easedU = 0.14 * u + 0.86 * u * u * u;

          const mx = quadBezier(portalX, width * 0.62, impactX, easedU);
          const my = quadBezier(portalY, height * 0.18, impactY, easedU);

          trailRef.current.push({ x: mx, y: my });
          if (trailRef.current.length > 22) {
            trailRef.current.shift();
          }

          if (p >= 0.48 && !colorShiftedRef.current) {
            colorShiftedRef.current = true;
            soundManager.playWishColorShift(rarity);
            ringsRef.current.push({
              x: mx,
              y: my,
              radius: 10,
              maxRadius: Math.min(width, height) * 0.28,
              alpha: 0.95,
              color: rarityCfg.color,
            });
          }

          const morphT = p < 0.48 ? 0 : Math.min(1, (p - 0.48) / 0.06);
          const activeColor = morphT === 0 ? '#93C5FD' : lerpHex('#93C5FD', rarityCfg.color, morphT);
          const activeGlow = morphT === 0 ? '#E0F2FE' : lerpHex('#E0F2FE', rarityCfg.glow, morphT);

          // Spawn sparkle particles
          const spawnCount = rarity === '5star' && p >= 0.48 ? 3 : 2;
          for (let i = 0; i < spawnCount; i += 1) {
            if (particlesRef.current.length < 65) {
              particlesRef.current.push({
                x: mx + (Math.random() - 0.5) * 10,
                y: my + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 2.8,
                vy: (Math.random() - 0.5) * 2.8,
                size: 1.5 + Math.random() * 2.6,
                alpha: 0.95,
                color: activeGlow,
              });
            }
          }

          // Draw comet tail
          const trail = trailRef.current;
          if (trail.length > 1) {
            ctx.save();
            ctx.lineCap = 'round';
            for (let i = 1; i < trail.length; i += 1) {
              const frac = i / trail.length;
              ctx.strokeStyle = activeColor;
              ctx.shadowColor = activeColor;
              ctx.shadowBlur = 18 * frac;
              ctx.globalAlpha = frac * 0.85;
              ctx.lineWidth = Math.max(1.5, 14 * frac);
              ctx.beginPath();
              ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
              ctx.lineTo(trail[i].x, trail[i].y);
              ctx.stroke();

              // Bright white core
              ctx.strokeStyle = '#FFFFFF';
              ctx.shadowBlur = 0;
              ctx.globalAlpha = frac * 0.9;
              ctx.lineWidth = Math.max(1, 5 * frac);
              ctx.beginPath();
              ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
              ctx.lineTo(trail[i].x, trail[i].y);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Draw meteor head + 5★ golden flares
          ctx.save();
          ctx.shadowColor = activeColor;
          ctx.shadowBlur = 28;
          ctx.fillStyle = activeGlow;
          ctx.beginPath();
          ctx.arc(mx, my, 10 + u * 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(mx, my, 5 + u * 3, 0, Math.PI * 2);
          ctx.fill();

          if (rarity === '5star' && p >= 0.48) {
            ctx.strokeStyle = '#FEF08A';
            ctx.lineWidth = 2.2;
            const flareLen = 28 + u * 22;
            for (let f = 0; f < 4; f += 1) {
              const angle = (Math.PI / 4) * f + now * 0.005;
              ctx.beginPath();
              ctx.moveTo(mx - Math.cos(angle) * flareLen, my - Math.sin(angle) * flareLen);
              ctx.lineTo(mx + Math.cos(angle) * flareLen, my + Math.sin(angle) * flareLen);
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        // Stage 3 (72% -> 100%): Impact Flash, Starburst & Shockwave
        if (p >= 0.72) {
          if (!impactTriggeredRef.current) {
            impactTriggeredRef.current = true;
            soundManager.playWishReveal(rarity);
            ringsRef.current.push({
              x: impactX,
              y: impactY,
              radius: 14,
              maxRadius: Math.max(width, height) * 0.65,
              alpha: 1,
              color: rarityCfg.color,
            });
            triggerRevealCard();
          }

          const impactU = Math.min(1, (p - 0.72) / 0.14);
          if (impactU < 1) {
            // Starburst rays
            ctx.save();
            ctx.translate(impactX, impactY);
            ctx.rotate(now * 0.0012);
            const rayCount = 12;
            const rayLen = Math.max(width, height) * 0.75 * (0.4 + 0.6 * impactU);
            for (let r = 0; r < rayCount; r += 1) {
              const angle = (Math.PI * 2 * r) / rayCount;
              ctx.save();
              ctx.rotate(angle);
              const rayGrad = ctx.createLinearGradient(0, 0, rayLen, 0);
              rayGrad.addColorStop(0, `rgba(255, 255, 255, ${(1 - impactU) * 0.85})`);
              rayGrad.addColorStop(0.35, rarityCfg.glow);
              rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
              ctx.fillStyle = rayGrad;
              ctx.globalAlpha = 1 - impactU;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(rayLen, -16);
              ctx.lineTo(rayLen, 16);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
            ctx.restore();

            // Screen flash
            ctx.save();
            ctx.globalAlpha = Math.max(0, (1 - impactU) * 0.88);
            ctx.fillStyle = impactU < 0.25 ? '#FFFFFF' : rarityCfg.glow;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
          }
        }

        // Update & draw sparkle particles
        for (let i = particlesRef.current.length - 1; i >= 0; i -= 1) {
          const pt = particlesRef.current[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vx *= 0.96;
          pt.vy *= 0.96;
          pt.alpha -= 0.025;
          if (pt.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Update & draw pulse / shockwave rings
        for (let i = ringsRef.current.length - 1; i >= 0; i -= 1) {
          const ring = ringsRef.current[i];
          ring.radius += (ring.maxRadius - ring.radius) * 0.16 + 4;
          ring.alpha -= 0.032;
          if (ring.alpha <= 0) {
            ringsRef.current.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = ring.alpha;
          ctx.strokeStyle = ring.color;
          ctx.shadowColor = ring.color;
          ctx.shadowBlur = 14;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        addTimer(() => {
          if (runIdRef.current !== currentRunId) return;
          setIsWishing(false);
          openWinnerModal(winner, 'wish');
        }, 350);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [
    addTimer,
    availableStudents,
    clearAnimations,
    drawNightSky,
    gameSpeed,
    isWishing,
    openWinnerModal,
    pityCount,
    pityEnabled,
  ]);

  const activeRarity = revealedWish ? RARITY_CONFIGS[revealedWish.rarity] : null;
  const activeElement = revealedWish ? ELEMENT_CONFIGS[revealedWish.element] : null;

  const statusExtra = (
    <div className="flex items-center gap-2 flex-wrap">
      {revealedWish && activeRarity && activeElement && (
        <div
          className="px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-black flex items-center gap-2"
          style={{
            backgroundColor: activeRarity.badgeBg,
            borderColor: activeRarity.borderColor,
            color: '#FFFFFF',
          }}
        >
          <span>{activeElement.icon}</span>
          <span className="max-w-[140px] truncate">{revealedWish.student.name}</span>
          <span style={{ color: activeRarity.glow }}>
            {'★'.repeat(activeRarity.stars)}
          </span>
        </div>
      )}
      {pityEnabled && (
        <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/35 text-xs font-bold text-amber-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
          <span>
            Bảo hiểm 5★: <span className="font-black text-amber-300">{pityCount}/{PITY_THRESHOLD}</span>
          </span>
        </div>
      )}
    </div>
  );

  const secondaryAction = (
    <button
      type="button"
      onClick={() => setPityEnabled((prev) => !prev)}
      disabled={isWishing}
      className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        pityEnabled
          ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
          : 'bg-slate-800/90 border-slate-600/70 text-slate-300 hover:bg-slate-700'
      }`}
      title="Tùy chọn trang trí: chắc chắn ra sao băng 5★ vàng kim sau 5 lượt (không đổi xác suất chọn học sinh)"
    >
      <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
      <span>Bảo hiểm 5★: {pityEnabled ? 'BẬT' : 'TẮT'}</span>
    </button>
  );

  return (
    <GameStageHUD
      gameId="wish"
      subtitle="Triệu hồi sao băng vũ trụ — chọn học sinh công bằng 100%"
      isRunning={isWishing}
      actionLabel="CẦU NGUYỆN NGAY"
      runningLabel="ĐANG TRIỆU HỒI..."
      actionGradient="from-indigo-500 via-purple-500 to-amber-400 hover:from-indigo-400 hover:to-amber-300 text-white"
      onPrimaryAction={startWish}
      onReset={handleReset}
      showResetWhenIdle={Boolean(revealedWish)}
      statusExtra={statusExtra}
      secondaryAction={secondaryAction}
    >
      <div
        ref={stageRef}
        className="relative w-full h-[62vh] min-h-[460px] shrink-0 rounded-3xl overflow-hidden bg-[#050816] border border-indigo-400/30 shadow-2xl"
        style={{ minHeight: '460px' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block transition-transform duration-150 ease-out"
        />

        {/* Idle prompt overlay */}
        {!isWishing && !showRevealCard && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="px-5 py-3 rounded-2xl bg-slate-950/65 backdrop-blur-md border border-indigo-300/25 shadow-xl max-w-md">
              <div className="text-4xl mb-2" aria-hidden="true">
                🌠
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-wide mb-1">
                Bầu Trời Đêm Cầu Nguyện
              </h3>
              <p className="text-xs sm:text-sm text-indigo-200/90 font-semibold">
                Nhấn <span className="text-amber-300 font-black">CẦU NGUYỆN NGAY</span> hoặc phím{' '}
                <span className="kbd-badge">SPACE</span> để triệu hồi sao băng!
              </p>
            </div>
          </div>
        )}

        {/* Splash Reveal Card */}
        {showRevealCard && revealedWish && activeRarity && activeElement && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-slate-950/88 backdrop-blur-xl text-center overflow-hidden shadow-2xl"
              style={{
                border: `2px solid ${activeRarity.borderColor}`,
                boxShadow: `0 0 48px ${activeRarity.color}55, inset 0 0 28px ${activeRarity.color}22`,
                animation: 'wishCardPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
            >
              {/* Element Watermark */}
              <div
                className="absolute -right-6 -bottom-6 text-[140px] sm:text-[170px] opacity-10 select-none pointer-events-none leading-none"
                aria-hidden="true"
              >
                {activeElement.icon}
              </div>

              {/* Rarity Pill */}
              <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider mb-3 border"
                style={{
                  backgroundColor: activeRarity.badgeBg,
                  borderColor: activeRarity.borderColor,
                  color: activeRarity.glow,
                }}
              >
                <span>{activeRarity.title}</span>
                <span>•</span>
                <span>{activeRarity.subtitle}</span>
              </div>

              {/* Student Name */}
              <h3 className="relative z-10 text-2xl sm:text-4xl font-black text-white tracking-tight mb-3 drop-shadow-lg break-words">
                {revealedWish.student.name}
              </h3>

              {/* Classroom Element Badge */}
              <div
                className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-900/90 border text-sm sm:text-base font-bold mb-4"
                style={{ borderColor: `${activeElement.color}66`, color: activeElement.color }}
              >
                <span className="text-lg" aria-hidden="true">
                  {activeElement.icon}
                </span>
                <span>
                  Nguyên Tố {activeElement.name} — {activeElement.title}
                </span>
              </div>

              {/* Sequential Animated Stars */}
              <div className="relative z-10 flex items-center justify-center gap-2 mb-3" aria-label={`${activeRarity.stars} sao`}>
                {Array.from({ length: activeRarity.stars }).map((_, idx) => {
                  const isLit = idx < litStars;
                  return (
                    <Star
                      key={idx}
                      className={`w-7 h-7 sm:w-9 sm:h-9 transition-all duration-200 ${
                        isLit ? 'scale-110 opacity-100' : 'scale-75 opacity-20'
                      }`}
                      style={{
                        color: isLit ? activeRarity.glow : '#475569',
                        fill: isLit ? activeRarity.color : 'transparent',
                        filter: isLit ? `drop-shadow(0 0 10px ${activeRarity.color})` : 'none',
                      }}
                    />
                  );
                })}
              </div>

              <p className="relative z-10 text-xs sm:text-sm font-semibold text-slate-300 italic">
                “{activeElement.wishText}”
              </p>
            </div>
          </div>
        )}

        <style>{`
          @keyframes wishCardPop {
            0% {
              opacity: 0;
              transform: scale(0.7);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </GameStageHUD>
  );
};
