import { AspectRatio, AnimationType } from './types';

// We will use numeric ratios for calculations, but keep string labels for UI
export const RATIO_VALUES: Record<Exclude<AspectRatio, 'custom'>, number> = {
  '16:9': 16/9,
  '9:16': 9/16,
  '4:5': 4/5,
  '5:4': 5/4,
  '1:1': 1,
  '4:3': 4/3,
  '21:9': 21/9,
};

export const RATIO_LABELS: Record<AspectRatio, string> = {
  '9:16': '9:16 (Stories/Reels/TikTok)',
  '16:9': '16:9 (YouTube/TV)',
  '4:5': '4:5 (Instagram Portrait)',
  '5:4': '5:4 (Antigo/Monitor)',
  '1:1': '1:1 (Quadrado)',
  '4:3': '4:3 (Padrão)',
  '21:9': '21:9 (Ultrawide)',
  'custom': 'Original da Mídia'
};

export const FONT_FAMILIES = [
  { label: 'Inter (Moderno)', value: 'Inter' },
  { label: 'Roboto (Padrão)', value: 'Roboto' },
  { label: 'Oswald (Condensado)', value: 'Oswald' },
  { label: 'Montserrat (Geométrico)', value: 'Montserrat' },
  { label: 'Playfair (Elegante)', value: 'Playfair Display' },
  { label: 'Bangers (Quadrinhos)', value: 'Bangers' },
  { label: 'Orbitron (Futurista)', value: 'Orbitron' },
  { label: 'Pacifico (Manuscrito)', value: 'Pacifico' },
];

export const ANIMATION_TYPES: Record<AnimationType, string> = {
  'none': 'Estático (Nenhuma)',
  'roller-mechanical': 'Rolagem Vertical (Slot Machine)',
  'slide-horizontal': 'Deslize Lateral (Fita Métrica)',
  'flip-classic': 'Placa Giratória (Flip Clock)',
  'spin-3d': 'Giro 3D (Moeda)',
  'zoom-depth': 'Zoom de Profundidade (Cinemático)',
  'pop': 'Pop / Explosão'
};

export const DEFAULT_FONT_SIZE = 120;
export const MIN_FONT_SIZE = 20;
export const MAX_FONT_SIZE = 1500;

export const SOLID_COLORS = [
  '#f3f4f6', // Gray 100 (Default)
  '#000000',
  '#ffffff',
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
];

export const GRADIENTS = [
  'linear-gradient(to bottom right, #c084fc, #7e22ce)', // Lilac/Purple (New Default)
  'linear-gradient(to bottom right, #4f46e5, #9333ea)', // Indigo to Purple
  'linear-gradient(to bottom right, #ec4899, #8b5cf6)', // Pink to Violet
  'linear-gradient(to bottom right, #3b82f6, #2dd4bf)', // Blue to Teal
  'linear-gradient(to bottom right, #f59e0b, #ef4444)', // Amber to Red
  'linear-gradient(to bottom right, #10b981, #3b82f6)', // Emerald to Blue
  'linear-gradient(to bottom right, #1f2937, #000000)', // Dark
  'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // Cloud (Light)
  'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)', // Warm
];