import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PackageOpen, Sparkles } from 'lucide-react';
import { useClassroom } from '../../hooks/useClassroomStore';
import { SPEED_DURATIONS, SPEED_LABELS } from '../../types';
import type { CaseRarity, Student } from '../../types';
import { soundManager } from '../../utils/sound';
import { GameStageHUD } from '../GameStageHUD';

// Viewport-independent geometry constants (px)
const CARD_WIDTH = 164;
const CARD_GAP = 12;
const STRIDE = CARD_WIDTH + CARD_GAP; // 176px
const START_INDEX = 6;
const TRAILING_BUFFER = 7;
const INITIAL_OFFSET = START_INDEX * STRIDE + CARD_WIDTH / 2; // 1138px
const MAX_NEAR_MISS_OFFSET = 0.35 * CARD_WIDTH; // 57.4px

type CaseThemeId = 'classroom' | 'superpower' | 'schoolfun';
type CasePhase = 'idle' | 'unlocking' | 'spinning' | 'revealing';

interface RarityConfig {
  label: string;
  shortBadge: string;
  vnTitle: string;
  color: string;
  glowRgba: string;
  weight: number;
}

const CASE_RARITY_CONFIG: Record<CaseRarity, RarityConfig> = {
  milspec: {
    label: 'Chăm Chỉ',
    shortBadge: 'CHĂM CHỈ',
    vnTitle: 'Ong Chăm Chỉ',
    color: '#4b69ff',
    glowRgba: 'rgba(75, 105, 255, 0.38)',
    weight: 0.55,
  },
  restricted: {
    label: 'Năng Nổ',
    shortBadge: 'NĂNG NỔ',
    vnTitle: 'Ngôi Sao Năng Nổ',
    color: '#8847ff',
    glowRgba: 'rgba(136, 71, 255, 0.42)',
    weight: 0.22,
  },
  classified: {
    label: 'Sáng Tạo',
    shortBadge: 'SÁNG TẠO',
    vnTitle: 'Tinh Anh Sáng Tạo',
    color: '#d32ce6',
    glowRgba: 'rgba(211, 44, 230, 0.46)',
    weight: 0.12,
  },
  covert: {
    label: 'Xuất Sắc',
    shortBadge: 'XUẤT SẮC',
    vnTitle: 'Chiến Thần Xuất Sắc',
    color: '#eb4b4b',
    glowRgba: 'rgba(235, 75, 75, 0.55)',
    weight: 0.06,
  },
  rare: {
    label: 'Huyền Thoại',
    shortBadge: '★ HUYỀN THOẠI ★',
    vnTitle: '★ Báu Vật Lớp Học ★',
    color: '#ffd700',
    glowRgba: 'rgba(255, 215, 0, 0.68)',
    weight: 0.05,
  },
};

const RARITY_ORDER: CaseRarity[] = ['milspec', 'restricted', 'classified', 'covert', 'rare'];

interface CaseTheme {
  id: CaseThemeId;
  name: string;
  icon: string;
  skins: Record<CaseRarity, string[]>;
}

const CASE_THEMES: Record<CaseThemeId, CaseTheme> = {
  classroom: {
    id: 'classroom',
    name: 'Hòm Lớp Học',
    icon: '🧰',
    skins: {
      milspec: [
        'Ong Chăm Chỉ | Ghi Chép Đầy Đủ',
        'Bút Bi Hết Mực | Chép Bài Thần Tốc',
        'Vở Sạch Chữ Đẹp | Nắn Nót Từng Dòng',
        'Thước Kẻ Thẳng Tắp | Gọn Gàng Vô Địch',
      ],
      restricted: [
        'Tay Giơ Cao Nhất | Xung Phong',
        'Phấn Trắng Bảng Xanh | Lên Bảng Tự Tin',
        'Chuông Vào Lớp | Luôn Đúng Giờ',
        'Cộng Sự Tin Cậy | Hỗ Trợ Bạn Bè',
      ],
      classified: [
        'Ý Tưởng Táo Bạo | Sáng Tạo Không Ngừng',
        'Họa Sĩ Tập Sự | Vẽ Sơ Đồ Tư Duy',
        'Nhà Hùng Biện Nhí | Thuyết Trình Cuốn Hút',
        'Kho Sáng Kiến | Giải Pháp Độc Đáo',
      ],
      covert: [
        'Chiến Thần Điểm 10 | Bất Bại',
        'Học Bá Ẩn Danh | Giải Đề Thần Sầu',
        'Ngôi Sao Bảng Vàng | Top Đầu Lớp Học',
        'Đỉnh Cao Chuyên Cần | Không Vắng Buổi Nào',
      ],
      rare: [
        '★ Báu Vật Lớp Học | Thủ Khoa Tương Lai',
        '★ Ấn Tín Trạng Nguyên | Đỗ Đạt Cao',
        '★ Huy Hiệu Kim Cương | Niềm Tự Hào Của Lớp',
        '★ Cúp Vàng Danh Dự | Toàn Diện Xuất Sắc',
      ],
    },
  },
  superpower: {
    id: 'superpower',
    name: 'Hòm Siêu Năng Lực',
    icon: '⚡',
    skins: {
      milspec: [
        'Tia Chớp Chép Bài | Tốc Độ Ánh Sáng',
        'Bình Tĩnh Tự Tin | Không Sợ Kiểm Tra',
        'Trí Nhớ Siêu Phàm | Thuộc Lòng Trong 5 Phút',
        'Khiên Kiên Trì | Làm Hết Bài Tập',
      ],
      restricted: [
        'Ra Đa Bắt Ý | Hiểu Bài Tức Thì',
        'Năng Lượng Tích Cực | Truyền Lửa Cả Tổ',
        'Mắt Đại Bàng | Soi Lỗi Chính Tả',
        'Bước Nhảy Lượng Tử | Tiến Bộ Vượt Bậc',
      ],
      classified: [
        'Phù Thủy Công Thức | Biến Hóa Khôn Lường',
        'Bộ Não Thiên Tài | Tư Duy Đa Chiều',
        'Kiến Trúc Sư Ý Tưởng | Dẫn Đầu Xu Hướng',
        'Sóng Âm Thuyết Phục | Phát Biểu Cực Chất',
      ],
      covert: [
        'Cú Đêm Ôn Thi | Cày Đề Xuyên Đêm',
        'Siêu Chiến Binh Tri Thức | Phá Đảo Mọi Đề',
        'Thợ Săn Điểm Cộng | Thu Thập Đầy Bảng',
        'Hào Quang Học Đường | Tỏa Sáng Mọi Môn',
      ],
      rare: [
        '★ Găng Tay Tri Thức | Chinh Phục Mọi Kỳ Thi',
        '★ Áo Choàng Thủ Lĩnh | Dẫn Dắt Tập Thể',
        '★ Ngôi Sao Tinh Vân | Tỏa Sáng Rực Rỡ',
        '★ Vương Miện Siêu Đẳng | Bất Khả Chiến Bại',
      ],
    },
  },
  schoolfun: {
    id: 'schoolfun',
    name: 'Hòm Học Đường Vui Nhộn',
    icon: '🎒',
    skins: {
      milspec: [
        'Cây Bút May Mắn | Khoanh Đâu Trúng Đó',
        'Hộp Bút Đầy Màu | Trang Trí Siêu Đẹp',
        'Bạn Cùng Bàn Vàng | Nhắc Bài Kịp Lúc',
        'Chuyên Gia Mượn Tẩy | Luôn Có Đồ Dự Phòng',
      ],
      restricted: [
        'Cây Hài Quốc Dân | Vui Tính',
        'Trùm Hoạt Náo | Khuấy Động Tiết Học',
        'Biệt Đội Trực Nhật | Sạch Bóng Từng Góc',
        'Thần Tài Giờ Ra Chơi | Mang Niềm Vui Tới',
      ],
      classified: [
        'Trạng Nguyên Nhí | Giải Đố Tài Tình',
        'Thánh Đặt Câu Hỏi | Hỏi Xoáy Đáp Xoay',
        'Đạo Diễn Sân Khấu | Văn Nghệ Số 1',
        'Nhà Phát Minh Bàn Cuối | Nghìn Lẻ Một Chiêu',
      ],
      covert: [
        'Quán Quân Đố Vui | Phản Ứng Cực Nhanh',
        'Thủ Lĩnh Cả Lớp | Nói Là Nghe Ngay',
        'Đại Sứ Thân Thiện | Ai Cũng Quý Mến',
        'Kỷ Lục Gia Phát Biểu | Chạm Đỉnh Bảng Vàng',
      ],
      rare: [
        '★ Chiếc Cặp Thần Kỳ | Chứa Đầy Tri Thức',
        '★ Tấm Vé Vàng | Miễn Trừ Một Lần Chép Phạt',
        '★ Quyền Trượng Lớp Trưởng | Uy Tín Tuyệt Đối',
        '★ Bảng Vàng Học Đường | Danh Hiệu Độc Nhất',
      ],
    },
  },
};

const CASE_THEME_LIST: CaseTheme[] = [
  CASE_THEMES.classroom,
  CASE_THEMES.superpower,
  CASE_THEMES.schoolfun,
];

const SPEED_STRIP_CONFIG = {
  fast: { totalCards: 28, unlockMs: 0 },
  normal: { totalCards: 38, unlockMs: 250 },
  dramatic: { totalCards: 48, unlockMs: 320 },
} as const;

interface StripCard {
  key: string;
  student: Student;
  rarity: CaseRarity;
  skinName: string;
}

interface LastOpenedResult {
  student: Student;
  rarity: CaseRarity;
  skinName: string;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function rollDecorativeRarity(): CaseRarity {
  const r = Math.random();
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += CASE_RARITY_CONFIG[rarity].weight;
    if (r < cumulative) return rarity;
  }
  return 'milspec';
}

function pickSkinName(theme: CaseTheme, rarity: CaseRarity): string {
  const list = theme.skins[rarity];
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generates the horizontal card strip strictly AFTER the winner has been chosen uniformly.
 * Decorative rarities and skins never influence student selection probability.
 */
function buildCaseStrip(
  students: Student[],
  winner: Student | null,
  totalCards: number,
  winIndex: number,
  themeId: CaseThemeId
): { strip: StripCard[]; winCard: StripCard | null; nearMissOffset: number } {
  const theme = CASE_THEMES[themeId];
  if (students.length === 0) {
    return { strip: [], winCard: null, nearMissOffset: 0 };
  }

  let pool = shuffleArray(students);
  let poolCursor = 0;

  const nextFillerStudent = (avoidStudentId?: string): Student => {
    if (students.length === 1) return students[0];

    if (poolCursor >= pool.length) {
      pool = shuffleArray(students);
      poolCursor = 0;
    }

    let candidate = pool[poolCursor++];
    if (avoidStudentId && candidate.id === avoidStudentId) {
      // Find a different student in the remaining pool or full list without risking an infinite loop
      const swapIdx = pool.findIndex((s, idx) => idx >= poolCursor && s.id !== avoidStudentId);
      if (swapIdx !== -1) {
        [pool[poolCursor - 1], pool[swapIdx]] = [pool[swapIdx], candidate];
        candidate = pool[poolCursor - 1];
      } else {
        const fallback = students.find((s) => s.id !== avoidStudentId);
        if (fallback) candidate = fallback;
      }
    }
    return candidate;
  };

  const strip: StripCard[] = [];
  for (let i = 0; i < totalCards; i++) {
    const isWinSlot = winner !== null && i === winIndex;
    const avoidId =
      winner && students.length >= 2 && (i === winIndex - 1 || i === winIndex + 1)
        ? winner.id
        : undefined;
    const student = isWinSlot ? winner : nextFillerStudent(avoidId);
    const rarity = rollDecorativeRarity();

    strip.push({
      key: `${i}-${student.id}`,
      student,
      rarity,
      skinName: pickSkinName(theme, rarity),
    });
  }

  // Optional near-miss bait on winIndex - 1 or winIndex + 1 (purely cosmetic, only when >= 2 students)
  let baitSide: -1 | 1 | 0 = 0;
  if (winner && students.length >= 2) {
    const winCard = strip[winIndex];
    if (winCard && winCard.rarity !== 'rare' && Math.random() < 0.65) {
      baitSide = Math.random() < 0.5 ? -1 : 1;
      const baitIdx = winIndex + baitSide;
      if (strip[baitIdx]) {
        const baitRarity: CaseRarity = Math.random() < 0.45 ? 'rare' : 'covert';
        strip[baitIdx] = {
          ...strip[baitIdx],
          rarity: baitRarity,
          skinName: pickSkinName(theme, baitRarity),
        };
      }
    }
  }

  let rawNearMissOffset: number;
  if (baitSide === -1) {
    // Lean slightly toward winIndex - 1 while staying safely inside the winning card
    rawNearMissOffset = -(0.18 + Math.random() * 0.17) * CARD_WIDTH;
  } else if (baitSide === 1) {
    // Lean slightly toward winIndex + 1 while staying safely inside the winning card
    rawNearMissOffset = (0.18 + Math.random() * 0.17) * CARD_WIDTH;
  } else {
    rawNearMissOffset = (Math.random() * 0.6 - 0.3) * CARD_WIDTH;
  }

  const nearMissOffset = Math.max(
    -MAX_NEAR_MISS_OFFSET,
    Math.min(MAX_NEAR_MISS_OFFSET, rawNearMissOffset)
  );

  return {
    strip,
    winCard: winner ? strip[winIndex] ?? null : null,
    nearMissOffset,
  };
}

export const CaseOpening: React.FC = () => {
  const { availableStudents, openWinnerModal, gameSpeed } = useClassroom();

  const [themeId, setThemeId] = useState<CaseThemeId>('classroom');
  const [phase, setPhase] = useState<CasePhase>('idle');
  const [needlePulse, setNeedlePulse] = useState(false);
  const [winningCardIndex, setWinningCardIndex] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<LastOpenedResult | null>(null);
  const [cards, setCards] = useState<StripCard[]>(() =>
    buildCaseStrip(availableStudents, null, 24, -1, 'classroom').strip
  );

  // Refs for 60fps rAF positioning & complete timer cleanup
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentOffsetRef = useRef<number>(INITIAL_OFFSET);
  const rafIdRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const needleTimerRef = useRef<number | null>(null);
  const lastSlotRef = useRef<number>(START_INDEX);
  const lastTickSoundTimeRef = useRef<number>(0);
  const prevPreviewDepsRef = useRef<{ students: Student[]; themeId: CaseThemeId }>({
    students: availableStudents,
    themeId,
  });

  const isRunning = phase !== 'idle';
  const activeTheme = CASE_THEMES[themeId];

  const applyTrackOffset = useCallback((offsetPx: number) => {
    currentOffsetRef.current = offsetPx;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetPx}px, 0, 0)`;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (needleTimerRef.current !== null) {
      window.clearTimeout(needleTimerRef.current);
      needleTimerRef.current = null;
    }
  }, []);

  const triggerNeedlePulse = useCallback(() => {
    setNeedlePulse(true);
    if (needleTimerRef.current !== null) {
      window.clearTimeout(needleTimerRef.current);
    }
    needleTimerRef.current = window.setTimeout(() => {
      setNeedlePulse(false);
      needleTimerRef.current = null;
    }, 65);
  }, []);

  // Rebuild preview strip only when students or theme change while idle (keep landed card visible after spin)
  useEffect(() => {
    const prev = prevPreviewDepsRef.current;
    if (prev.students === availableStudents && prev.themeId === themeId) return;
    if (phase !== 'idle') return;

    prevPreviewDepsRef.current = { students: availableStudents, themeId };
    const { strip } = buildCaseStrip(availableStudents, null, 24, -1, themeId);
    setCards(strip);
    setWinningCardIndex(null);
    lastSlotRef.current = START_INDEX;
    applyTrackOffset(INITIAL_OFFSET);
  }, [availableStudents, themeId, phase, applyTrackOffset]);

  // Re-apply track transform after cards DOM updates so React renders never drop offset
  useLayoutEffect(() => {
    applyTrackOffset(currentOffsetRef.current);
  }, [cards, phase, applyTrackOffset]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const handleReset = useCallback(() => {
    clearAllTimers();
    setPhase('idle');
    setNeedlePulse(false);
    setWinningCardIndex(null);
    lastSlotRef.current = START_INDEX;
    applyTrackOffset(INITIAL_OFFSET);
    const { strip } = buildCaseStrip(availableStudents, null, 24, -1, themeId);
    setCards(strip);
  }, [clearAllTimers, applyTrackOffset, availableStudents, themeId]);

  const startOpenCase = useCallback(() => {
    if (phase !== 'idle' || availableStudents.length === 0) return;

    clearAllTimers();

    // 1. STRICT FAIRNESS DECOUPLING: Uniform random winner chosen BEFORE strip & rarity generation
    const winnerIndex = Math.floor(Math.random() * availableStudents.length);
    const winner = availableStudents[winnerIndex];

    // 2. Build decorative strip & viewport-independent target offset
    const speedSpec = SPEED_STRIP_CONFIG[gameSpeed];
    const winIndex = speedSpec.totalCards - 1 - TRAILING_BUFFER;
    const { strip, winCard, nearMissOffset } = buildCaseStrip(
      availableStudents,
      winner,
      speedSpec.totalCards,
      winIndex,
      themeId
    );

    const winnerRarity: CaseRarity = winCard?.rarity ?? 'milspec';
    const winnerSkinName = winCard?.skinName ?? pickSkinName(activeTheme, winnerRarity);
    const targetOffset = winIndex * STRIDE + CARD_WIDTH / 2 + nearMissOffset;

    setCards(strip);
    setWinningCardIndex(winIndex);
    setNeedlePulse(false);
    lastSlotRef.current = START_INDEX;
    lastTickSoundTimeRef.current = 0;
    applyTrackOffset(INITIAL_OFFSET);

    const finishToReveal = () => {
      rafIdRef.current = null;
      applyTrackOffset(targetOffset);
      setPhase('revealing');
      soundManager.playCaseRareReveal(winnerRarity);

      revealTimerRef.current = window.setTimeout(() => {
        revealTimerRef.current = null;
        setLastResult({
          student: winner,
          rarity: winnerRarity,
          skinName: winnerSkinName,
        });
        setPhase('idle');
        openWinnerModal(winner, 'caseopen');
      }, 600);
    };

    const beginSpin = () => {
      unlockTimerRef.current = null;
      setPhase('spinning');
      const spinDuration = Math.max(400, SPEED_DURATIONS[gameSpeed] - speedSpec.unlockMs);
      const spinStartTime = performance.now();

      const animate = (now: number) => {
        const progress = Math.max(0, Math.min((now - spinStartTime) / spinDuration, 1));
        const eased = easeOutCubic(progress);
        const currentOffset = INITIAL_OFFSET + (targetOffset - INITIAL_OFFSET) * eased;

        applyTrackOffset(currentOffset);

        // Boundary-crossing tick detection with 22ms audio throttle
        const currentSlot = Math.floor((currentOffset + CARD_GAP / 2) / STRIDE);
        if (currentSlot > lastSlotRef.current) {
          lastSlotRef.current = currentSlot;
          const nowMs = performance.now();
          if (nowMs - lastTickSoundTimeRef.current >= 22) {
            lastTickSoundTimeRef.current = nowMs;
            const pitch = 980 - eased * 180;
            soundManager.playCaseTick(pitch);
          }
          triggerNeedlePulse();
        }

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(animate);
        } else {
          finishToReveal();
        }
      };

      rafIdRef.current = requestAnimationFrame(animate);
    };

    soundManager.playCaseUnlock();
    if (speedSpec.unlockMs > 0) {
      setPhase('unlocking');
      unlockTimerRef.current = window.setTimeout(beginSpin, speedSpec.unlockMs);
    } else {
      beginSpin();
    }
  }, [
    phase,
    availableStudents,
    clearAllTimers,
    gameSpeed,
    themeId,
    activeTheme,
    applyTrackOffset,
    openWinnerModal,
    triggerNeedlePulse,
  ]);

  const winningCard = useMemo(
    () => (winningCardIndex !== null ? cards[winningCardIndex] ?? null : null),
    [cards, winningCardIndex]
  );

  const statusExtra = useMemo(() => {
    if (isRunning) {
      const speedMeta = SPEED_LABELS[gameSpeed];
      return (
        <div className="px-3.5 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-black flex items-center gap-1.5">
          <span>{speedMeta.icon}</span>
          <span>
            {speedMeta.label} ({speedMeta.time})
          </span>
        </div>
      );
    }

    if (lastResult) {
      const rarityCfg = CASE_RARITY_CONFIG[lastResult.rarity];
      return (
        <div
          className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black animate-pop-in flex items-center gap-2 border"
          style={{
            backgroundColor: `${rarityCfg.color}24`,
            borderColor: `${rarityCfg.color}88`,
            color: '#ffffff',
          }}
        >
          <span className="text-slate-300 font-bold">Vừa mở:</span>
          <span className="text-white">{lastResult.student.name}</span>
          <span className="opacity-70">•</span>
          <span style={{ color: rarityCfg.color }}>{rarityCfg.label}</span>
        </div>
      );
    }

    return undefined;
  }, [isRunning, gameSpeed, lastResult]);

  const secondaryAction = (
    <div
      className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-600/80"
      role="group"
      aria-label="Chọn chủ đề hòm"
    >
      {CASE_THEME_LIST.map((theme) => {
        const isSelected = theme.id === themeId;
        return (
          <button
            key={theme.id}
            type="button"
            disabled={isRunning}
            onClick={() => {
              soundManager.playClick();
              setThemeId(theme.id);
            }}
            className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              isSelected
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
            title={`Đổi sang ${theme.name} (chỉ đổi trang trí thẻ)`}
          >
            <span aria-hidden="true">{theme.icon}</span>
            <span className="hidden md:inline">{theme.name}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <GameStageHUD
      gameId="caseopen"
      subtitle="Băng chuyền mở hòm danh hiệu — Nhấn MỞ HÒM NGAY hoặc SPACE để quay!"
      isRunning={isRunning}
      actionLabel="MỞ HÒM NGAY"
      runningLabel="ĐANG MỞ HÒM..."
      actionGradient="from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-slate-950"
      onPrimaryAction={startOpenCase}
      onReset={handleReset}
      showResetWhenIdle={false}
      statusExtra={statusExtra}
      secondaryAction={secondaryAction}
    >
      <div className="clay-card rounded-3xl p-4 sm:p-6 flex flex-col justify-between gap-4 relative overflow-hidden min-h-[430px] bg-gradient-to-b from-[#0d1117] via-[#131922] to-[#0d1117]">
        {/* Top Case Banner */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
              {activeTheme.icon}
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <PackageOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{activeTheme.name}</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-300">
                Công bằng tuyệt đối • Xác suất mỗi học sinh:{' '}
                <span className="text-emerald-400 font-black">
                  1/{availableStudents.length}
                </span>
              </div>
            </div>
          </div>

          {phase === 'revealing' && winningCard && (
            <div
              className="px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 animate-pop-in border"
              style={{
                backgroundColor: `${CASE_RARITY_CONFIG[winningCard.rarity].color}28`,
                borderColor: CASE_RARITY_CONFIG[winningCard.rarity].color,
                color: '#ffffff',
                boxShadow: `0 0 20px ${CASE_RARITY_CONFIG[winningCard.rarity].glowRgba}`,
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>{winningCard.student.name}</span>
              <span className="text-xs opacity-90">
                ({CASE_RARITY_CONFIG[winningCard.rarity].vnTitle})
              </span>
            </div>
          )}
        </div>

        {/* Case Roulette Viewport */}
        <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-[#0d1117] border-2 border-slate-700/80 shadow-[inset_0_0_40px_rgba(0,0,0,0.85)] overflow-hidden select-none">
          {/* Subtle stage spotlight texture */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.08) 0%, transparent 65%)',
            }}
          />

          {/* Reveal Spotlight Backdrop */}
          {phase === 'revealing' && winningCard && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${CASE_RARITY_CONFIG[winningCard.rarity].glowRgba} 0%, transparent 55%)`,
              }}
            />
          )}

          {/* Unlock Intro Flash Overlay */}
          {phase === 'unlocking' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] pointer-events-none">
              <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25 border-2 border-amber-300 shadow-[0_0_32px_rgba(255,215,0,0.45)] flex items-center gap-3 animate-pop-in">
                <span className="text-2xl sm:text-3xl animate-bounce-slight" aria-hidden="true">
                  🗝️
                </span>
                <span className="font-black text-base sm:text-lg text-amber-200 tracking-wide projector-text">
                  ĐANG TRA CHÌA MỞ HÒM...
                </span>
              </div>
            </div>
          )}

          {/* Left & Right Blurred Vignette Edges */}
          <div className="absolute inset-y-0 left-0 w-[16%] max-w-[140px] bg-gradient-to-r from-[#0d1117] via-[#0d1117]/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-[16%] max-w-[140px] bg-gradient-to-l from-[#0d1117] via-[#0d1117]/80 to-transparent z-10 pointer-events-none" />

          {/* Center Vertical Golden Needle */}
          <div
            className={`absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-between transition-transform duration-75 ${
              needlePulse ? 'scale-110 brightness-125' : 'scale-100'
            }`}
          >
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[13px] border-t-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.95)]" />
            <div className="w-[3px] flex-1 bg-[#ffd700] shadow-[0_0_16px_rgba(255,215,0,0.9)]" />
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[13px] border-b-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.95)]" />
          </div>

          {/* Viewport-independent anchor at x = 50% */}
          <div className="absolute top-1/2 left-1/2 -translate-y-1/2">
            {/* Horizontal Track driven solely by translate3d(-currentOffset, 0, 0) */}
            <div
              ref={trackRef}
              className="flex items-center w-max will-change-transform"
              style={{ gap: `${CARD_GAP}px` }}
            >
              {cards.map((card, idx) => {
                const cfg = CASE_RARITY_CONFIG[card.rarity];
                const isWinnerSlot = phase === 'revealing' && idx === winningCardIndex;
                const isDimmed = phase === 'revealing' && idx !== winningCardIndex;
                const isRare = card.rarity === 'rare';

                return (
                  <div
                    key={card.key}
                    style={{
                      width: `${CARD_WIDTH}px`,
                      borderColor: isWinnerSlot ? cfg.color : `${cfg.color}55`,
                      boxShadow: isWinnerSlot
                        ? `0 0 28px ${cfg.glowRgba}, inset 0 0 20px ${cfg.glowRgba}`
                        : `0 6px 14px rgba(0,0,0,0.5)`,
                    }}
                    className={`shrink-0 h-44 sm:h-48 rounded-xl border-2 bg-gradient-to-b from-[#1b2433] via-[#151c28] to-[#0f141d] relative overflow-hidden flex flex-col items-center justify-between pt-2.5 pb-3 px-2.5 transition-all duration-300 ${
                      isWinnerSlot ? 'scale-[1.06] z-10' : ''
                    } ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
                  >
                    {/* Radial glow behind avatar */}
                    <div
                      className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-xl pointer-events-none"
                      style={{ backgroundColor: cfg.glowRgba, opacity: isRare ? 0.55 : 0.35 }}
                    />

                    {/* Rare gold shimmer sweep */}
                    {isRare && (
                      <div
                        className="absolute inset-0 pointer-events-none animate-shimmer"
                        style={{
                          background:
                            'linear-gradient(125deg, transparent 25%, rgba(255,215,0,0.16) 50%, transparent 75%)',
                        }}
                      />
                    )}

                    {/* Top Rarity Pill */}
                    <div
                      className="relative z-10 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border truncate max-w-full"
                      style={{
                        backgroundColor: `${cfg.color}28`,
                        borderColor: `${cfg.color}70`,
                        color: isRare ? '#fde047' : '#f8fafc',
                      }}
                    >
                      {cfg.shortBadge}
                    </div>

                    {/* Avatar Emoji */}
                    <div className="relative z-10 text-3xl sm:text-4xl filter drop-shadow-md leading-none my-0.5">
                      {isRare ? '🌟' : card.student.avatarEmoji || '🎓'}
                    </div>

                    {/* High-Contrast Student Name for Projector */}
                    <div className="relative z-10 w-full flex-1 flex items-center justify-center px-0.5">
                      <span className="font-black text-white text-base sm:text-lg leading-tight text-center line-clamp-2 projector-text break-words">
                        {card.student.name}
                      </span>
                    </div>

                    {/* Decorative Skin Name */}
                    <div className="relative z-10 w-full text-center text-[11px] font-bold text-slate-300/90 truncate px-1 mb-0.5">
                      {card.skinName}
                    </div>

                    {/* 5px Signature CS:GO Bottom Rarity Bar */}
                    <div
                      className="absolute bottom-0 inset-x-0 h-[5px]"
                      style={{
                        backgroundColor: cfg.color,
                        boxShadow: `0 0 12px ${cfg.color}`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rarity Legend Footer (Decorative Tiers) */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-1 pt-1 border-t border-slate-800/90">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {RARITY_ORDER.map((rarity) => {
              const cfg = CASE_RARITY_CONFIG[rarity];
              return (
                <div key={rarity} className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.glowRgba}` }}
                    aria-hidden="true"
                  />
                  <span className={rarity === 'rare' ? 'text-amber-300 font-black' : ''}>
                    {cfg.vnTitle}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Màu sắc chỉ để tạo kịch tính, không ảnh hưởng xác suất gọi tên
          </span>
        </div>
      </div>
    </GameStageHUD>
  );
};
