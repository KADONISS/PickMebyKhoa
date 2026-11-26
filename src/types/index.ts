export interface Student {
  id: string;
  name: string;
  isAbsent: boolean;
  isCalled: boolean;
  avatarEmoji?: string;
  color?: string;
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
  createdAt: number;
}

export type GameSpeed = 'fast' | 'normal' | 'dramatic';

export const SPEED_DURATIONS: Record<GameSpeed, number> = {
  fast: 3000,
  normal: 6000,
  dramatic: 10000,
};

export const SPEED_LABELS: Record<GameSpeed, { label: string; time: string; icon: string }> = {
  fast: { label: 'Nhanh', time: '3s', icon: '⚡' },
  normal: { label: 'Vừa', time: '6s', icon: '⏱️' },
  dramatic: { label: 'Kịch tính', time: '10s', icon: '🔥' },
};

export type GameType =
  | 'wheel'
  | 'race'
  | 'balloon'
  | 'chests'
  | 'ufo'
  | 'claw'
  | 'gacha'
  | 'fishing'
  | 'bomb'
  | 'caseopen'
  | 'wish';

export type CaseRarity = 'milspec' | 'restricted' | 'classified' | 'covert' | 'rare';

export type WishRarity = '3star' | '4star' | '5star';
export type WishElementKey =
  | 'pyro'
  | 'hydro'
  | 'anemo'
  | 'electro'
  | 'dendro'
  | 'cryo'
  | 'geo';

export type CurrentView = 'lobby' | 'game';

export interface GameInfo {
  id: GameType;
  title: string;
  icon: string;
  badge: string;
  description: string;
  colorGradient: string;
  borderAccent: string;
  highlightTags: string[];
  bannerIcon: string;
}

export interface WinnerState {
  isOpen: boolean;
  winner: Student | null;
  game: GameType | null;
}
