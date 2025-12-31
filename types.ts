export type AspectRatio = '16:9' | '9:16' | '4:5' | '5:4' | '1:1' | '4:3' | '21:9' | 'custom';

export type BackgroundType = 'solid' | 'gradient' | 'media';

// 'pop' mantido. Novos estilos 'duais' (entrada/saida) adicionados.
export type AnimationType = 'none' | 'flip-classic' | 'roller-mechanical' | 'spin-3d' | 'slide-horizontal' | 'zoom-depth' | 'pop';

export interface MediaType {
  type: 'image' | 'video';
  url: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  duration?: number; // duration in seconds for video
}

export interface TimerState {
  initialMinutes: number;
  timeLeft: number; // in seconds
  isActive: boolean;
  isFinished: boolean;
}

export interface AppearanceState {
  // Typography
  fontSize: number; // in pixels
  fontColor: string;
  fontShadow: boolean;
  fontFamily: string;
  textPosition: { x: number; y: number }; // Percentage 0-100 relative to center
  animationType: AnimationType;

  // Layout
  aspectRatio: AspectRatio;
  customRatioValue?: number; // Used when aspectRatio is 'custom'
  
  // Background
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundGradient: string;
  
  // Media
  media: MediaType | null;
  mediaScale: number;
  mediaPosition: { x: number; y: number };
  syncVideoToTimer: boolean;
  
  // Export
  resolution: number; // Altura em pixels (ex: 480, 720, 1080)
}