import type { GameInfo, Student } from '../types';

export const DEMO_STUDENT_NAMES: string[] = [
  'Nguyễn An Nhiên',
  'Trần Bảo Long',
  'Lê Hoàng Phúc',
  'Phạm Minh Triết',
  'Hoàng Gia Hân',
  'Vũ Tuấn Kiệt',
  'Đặng Thùy Dương',
  'Bùi Quang Hải',
  'Đỗ Phương Linh',
  'Ngô Quốc Bảo',
  'Dương Khánh Ngọc',
  'Lý Thái Sơn',
  'Phan Bảo Trâm',
  'Võ Trí Dũng',
  'Trịnh Kim Ngân',
  'Mai Đăng Khoa',
  'Đoàn Thảo My',
  'Lâm Hải Đăng',
  'Huỳnh Tuệ Mẫn',
  'Cao Nhật Minh',
];

export const ANIMAL_EMOJIS = [
  '🦆', '🐇', '🐢', '🐱', '🐶', '🦊', '🐼', '🐸',
  '🐵', '🦁', '🐯', '🐨', '🐧', '🦄', '🐙', '🐝',
  '🦉', '🐬', '🦖', '🦔', '🦒', '🐘', '🦩', '🦭',
  '🐹', '🐿️', '🦥', '🦨', '🦓', '🦘', '🦚', '🦜'
];

export const WHEEL_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Mint Turquoise
  '#FFE66D', // Warm Yellow
  '#1A535C', // Deep Teal
  '#FF9F1C', // Amber Orange
  '#2EC4B6', // Tiffany Blue
  '#E71D36', // Bright Crimson
  '#011627', // Dark Navy
  '#9B5DE5', // Purple
  '#F15BB5', // Pink
  '#00BBF9', // Sky Blue
  '#00F5D4', // Seafoam Green
  '#FB5607', // Orange Red
  '#FF006E', // Neon Pink
  '#8338EC', // Violet
  '#3A86FF', // Royal Blue
  '#06D6A0', // Emerald Green
  '#118AB2', // Ocean Blue
  '#F72585', // Deep Fuchsia
  '#7209B7', // Indigo
];

export const BALLOON_COLORS = [
  { bg: '#FF477E', string: '#D81159' }, // Strawberry Pink
  { bg: '#FF70A6', string: '#FF477E' }, // Rose Pink
  { bg: '#FF9770', string: '#FF70A6' }, // Peach
  { bg: '#FFD670', string: '#E0A922' }, // Warm Yellow
  { bg: '#E9FF70', string: '#B2CC18' }, // Lime Green
  { bg: '#06D6A0', string: '#049E75' }, // Teal
  { bg: '#118AB2', string: '#0C6381' }, // Cyan Blue
  { bg: '#4361EE', string: '#2A44B6' }, // Indigo
  { bg: '#7209B7', string: '#4F0580' }, // Purple
  { bg: '#F72585', string: '#B80F5E' }, // Magenta
  { bg: '#3A0CA3', string: '#210565' }, // Deep Purple
  { bg: '#4CC9F0', string: '#179EC7' }, // Sky Blue
];

export const GAME_INFOS: GameInfo[] = [
  {
    id: 'wheel',
    title: 'Vòng Quay May Mắn',
    icon: '🎡',
    bannerIcon: '🎯',
    badge: 'Kinh điển • Dễ dùng',
    description: 'Vòng quay sắc màu hồi hộp với kim chỉ 12 giờ rung chuyển theo từng nhịp tick sống động!',
    colorGradient: 'from-amber-500 via-orange-500 to-amber-600',
    borderAccent: 'border-amber-400/40 hover:border-amber-400',
    highlightTags: ['Kim chỉ rung giật', 'Âm thanh tạch tạch', 'Co giãn 45 học sinh'],
  },
  {
    id: 'race',
    title: 'Đường Đua Thú Cưng',
    icon: '🏁',
    bannerIcon: '⚡',
    badge: 'Kịch tính • Cổ vũ sôi nổi',
    description: 'Cuộc đua nghẹt thở giữa các linh vật đáng yêu với những pha bứt tốc ⚡ và Top 3 dẫn đầu!',
    colorGradient: 'from-emerald-500 via-teal-600 to-emerald-600',
    borderAccent: 'border-emerald-400/40 hover:border-emerald-400',
    highlightTags: ['Đếm ngược 3-2-1', 'Bứt tốc ngẫu nhiên', 'Bảng xếp hạng trực tiếp'],
  },
  {
    id: 'balloon',
    title: 'Bắn Bóng Bay',
    icon: '🎈',
    bannerIcon: '🎯',
    badge: 'Tương tác cao • Chạm tay',
    description: 'Tâm ngắm lướt nhanh trên bầu trời khóa mục tiêu làm nổ tung quả bóng, hoặc chạm tay trực tiếp!',
    colorGradient: 'from-sky-500 via-blue-600 to-indigo-600',
    borderAccent: 'border-sky-400/40 hover:border-sky-400',
    highlightTags: ['Tâm ngắm khóa mục tiêu', 'Học sinh chạm bảng', 'Hiệu ứng nổ bóng'],
  },
  {
    id: 'chests',
    title: 'Rương Kho Báu Bí Ẩn',
    icon: '🎁',
    bannerIcon: '✨',
    badge: 'Hồi hộp • Bất ngờ',
    description: 'Lưới các rương quà giấu kín tên học sinh, có hiệu ứng xáo trộn và quét sáng chọn ngẫu nhiên!',
    colorGradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    borderAccent: 'border-purple-400/40 hover:border-purple-400',
    highlightTags: ['Xáo trộn đảo vị trí', 'Vệt sáng quét chọn', 'Kho báu phát sáng'],
  },
  {
    id: 'ufo',
    title: 'Đĩa Bay Bắt Cóc',
    icon: '🛸',
    bannerIcon: '👽',
    badge: 'Khoa học viễn tưởng • Hút sáng',
    description: 'UFO bay lượn trên bầu trời đêm, khóa mục tiêu và chiếu luồng tia sáng xanh hút học sinh bay lên phi thuyền!',
    colorGradient: 'from-violet-600 via-indigo-600 to-cyan-600',
    borderAccent: 'border-cyan-400/40 hover:border-cyan-400',
    highlightTags: ['Tia hút Tractor Beam', 'Học sinh bay lơ lửng', 'Âm thanh Sci-Fi LFO'],
  },
  {
    id: 'claw',
    title: 'Máy Gắp Thú',
    icon: '🕹️',
    bannerIcon: '🧸',
    badge: 'Arcade • Siêu hồi hộp',
    description: 'Tủ gắp thú phong cách game thùng: càng gắp di chuyển trên ray, thả ngàm kẹp quả cầu tên học sinh lên hộc quà!',
    colorGradient: 'from-pink-500 via-rose-500 to-amber-500',
    borderAccent: 'border-pink-400/40 hover:border-pink-400',
    highlightTags: ['Càng gắp di động', 'Rung kịch tính lúc kéo', 'Thả rơi hộc nhận quà'],
  },
  {
    id: 'gacha',
    title: 'Máy Quay Gacha',
    icon: '🎰',
    bannerIcon: '🔮',
    badge: 'Gashapon • Xóc nảy tưng bừng',
    description: 'Vặn tay quay cạch cạch, lồng kính xóc nảy hỗn loạn các viên nang và nhả quả bóng bí ẩn tách đôi phát sáng!',
    colorGradient: 'from-rose-600 via-red-500 to-amber-500',
    borderAccent: 'border-rose-400/40 hover:border-rose-400',
    highlightTags: ['Xoay núm cạch cạch', 'Viên nang xóc nảy', 'Bóng mở đôi phát sáng'],
  },
  {
    id: 'fishing',
    title: 'Câu Cá Đại Dương',
    icon: '🎣',
    bannerIcon: '🐟',
    badge: 'Dưới nước • Bong bóng sinh động',
    description: 'Thả dây câu từ thuyền xuống lòng đại dương bao la, rà theo đàn cá bơi lội và giật câu kéo chú cá trúng thưởng!',
    colorGradient: 'from-blue-600 via-cyan-500 to-teal-500',
    borderAccent: 'border-blue-400/40 hover:border-blue-400',
    highlightTags: ['Đại dương sâu thẳm', 'Cá bơi qua lại', 'Giật cần kéo vút lên'],
  },
  {
    id: 'bomb',
    title: 'Chuyền Bom Pháo Giấy',
    icon: '💣',
    bannerIcon: '💥',
    badge: 'Gay cấn đỉnh điểm • Dồn dập',
    description: 'Quả bom bén lửa nhảy chuyền ngẫu nhiên qua các học sinh với nhịp tít tít tăng tốc dồn dập rồi nổ tung pháo giấy!',
    colorGradient: 'from-amber-600 via-red-600 to-rose-700',
    borderAccent: 'border-red-400/40 hover:border-red-400',
    highlightTags: ['Vừa vặn 1 màn hình 45 HS', 'Tít tít dồn dập', 'Nổ pháo giấy bất ngờ'],
  },
];

export function createStudent(name: string, index: number = 0): Student {
  const cleanName = name.trim();
  const animal = ANIMAL_EMOJIS[index % ANIMAL_EMOJIS.length];
  const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
  return {
    id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${index}`,
    name: cleanName,
    isAbsent: false,
    isCalled: false,
    avatarEmoji: animal,
    color: color,
  };
}
