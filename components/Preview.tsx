import React, { useRef, useState, useEffect } from 'react';
import { AppearanceState } from '../types';
import { RATIO_VALUES, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../constants';

interface PreviewProps {
  appearance: AppearanceState;
  setAppearance: React.Dispatch<React.SetStateAction<AppearanceState>>;
  timeLeft: number;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Função auxiliar para calcular distância entre dois pontos de toque
const getDistance = (p1: React.PointerEvent, p2: React.PointerEvent) => {
  return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
};

export const Preview: React.FC<PreviewProps> = ({ appearance, setAppearance, timeLeft, videoRef }) => {
  const {
    aspectRatio,
    customRatioValue,
    fontSize,
    fontFamily, // FIX: Extrair fontFamily
    fontColor,
    fontShadow,
    textPosition,
    backgroundType,
    backgroundColor,
    backgroundGradient,
    media,
    mediaScale,
    mediaPosition
  } = appearance;

  // Gerenciamento de Ponteiros (Touch/Mouse)
  const [dragTarget, setDragTarget] = useState<'media' | 'text' | null>(null);
  const activePointers = useRef<Map<number, React.PointerEvent>>(new Map());
  const prevPinchDistRef = useRef<number | null>(null);
  const lastDragPosRef = useRef<{ x: number, y: number } | null>(null);

  // Refs para os elementos DOM
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado para armazenar o tamanho disponível na tela
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });

  const currentMediaPosRef = useRef(mediaPosition);
  const currentTextPosRef = useRef(textPosition);
  const currentFontSizeRef = useRef(fontSize);
  const currentMediaScaleRef = useRef(mediaScale);

  // Sincronizar refs com state para acesso rápido nos eventos
  useEffect(() => { currentMediaPosRef.current = mediaPosition; }, [mediaPosition]);
  useEffect(() => { currentTextPosRef.current = textPosition; }, [textPosition]);
  useEffect(() => { currentFontSizeRef.current = fontSize; }, [fontSize]);
  useEffect(() => { currentMediaScaleRef.current = mediaScale; }, [mediaScale]);

  // Observer: Monitora o tamanho do PAI para redimensionamento responsivo
  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWrapperSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Captura o ponteiro para garantir rastreamento mesmo se sair do elemento
    (e.target as Element).setPointerCapture(e.pointerId);

    // Armazena o evento do ponteiro
    activePointers.current.set(e.pointerId, e);

    // Identifica o alvo (Texto ou Mídia)
    // Se clicou direto no span do texto, é texto. Caso contrário, assume mídia/fundo.
    const targetId = (e.target as HTMLElement).id;
    const isText = targetId === 'timer-display';

    // Se for o primeiro dedo, define o alvo e a posição inicial
    if (activePointers.current.size === 1) {
      if (isText) {
        setDragTarget('text');
      } else if (backgroundType === 'media' && media) {
        setDragTarget('media');
      }
      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Atualiza o ponteiro no mapa
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, e);
    }

    const pointers = Array.from(activePointers.current.values());

    // --- LÓGICA DE PINÇA (ZOOM) - 2 Dedos ---
    if (pointers.length === 2) {
      const dist = getDistance(pointers[0], pointers[1]);

      if (prevPinchDistRef.current) {
        const delta = dist - prevPinchDistRef.current;

        // Ajusta sensibilidade do zoom
        const zoomSensitivity = 1;

        if (dragTarget === 'text') {
          // Zoom no Texto
          const newSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, currentFontSizeRef.current + delta * zoomSensitivity));
          setAppearance(prev => ({ ...prev, fontSize: newSize }));
        } else if (dragTarget === 'media') {
          // Zoom na Mídia
          const scaleSensitivity = 0.005;
          const newScale = Math.max(0.1, Math.min(5, currentMediaScaleRef.current + delta * scaleSensitivity));
          setAppearance(prev => ({ ...prev, mediaScale: newScale }));
        }
      }

      prevPinchDistRef.current = dist;

      // Reseta a referência de arrasto para evitar "pulo" ao voltar para 1 dedo
      lastDragPosRef.current = null;
      return;
    }

    // --- LÓGICA DE ARRASTAR (DRAG) - 1 Dedo ---
    if (pointers.length === 1 && dragTarget && lastDragPosRef.current) {
      // Se estávamos fazendo pinça antes, reseta a distância
      prevPinchDistRef.current = null;

      const deltaX = e.clientX - lastDragPosRef.current.x;
      const deltaY = e.clientY - lastDragPosRef.current.y;

      if (dragTarget === 'media') {
        setAppearance(prev => ({
          ...prev,
          mediaPosition: {
            x: currentMediaPosRef.current.x + deltaX,
            y: currentMediaPosRef.current.y + deltaY
          }
        }));
      } else if (dragTarget === 'text' && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;

        // Move em porcentagem relativa ao container
        setAppearance(prev => ({
          ...prev,
          textPosition: {
            x: currentTextPosRef.current.x + (deltaX / w) * 100,
            y: currentTextPosRef.current.y + (deltaY / h) * 100
          }
        }));
      }

      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Se soltou todos os dedos
    if (activePointers.current.size === 0) {
      setDragTarget(null);
      prevPinchDistRef.current = null;
      lastDragPosRef.current = null;
    }
    // Se soltou um dedo mas sobrou outro (terminou pinça, continua arrasto)
    else if (activePointers.current.size === 1) {
      prevPinchDistRef.current = null;
      const remainingPointer = activePointers.current.values().next().value;
      if (remainingPointer) {
        lastDragPosRef.current = { x: remainingPointer.clientX, y: remainingPointer.clientY };
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (backgroundType === 'media' && media) {
      const newScale = Math.max(0.1, Math.min(5, mediaScale - (e.deltaY * 0.001)));
      setAppearance(prev => ({ ...prev, mediaScale: newScale }));
    }
  };

  // --- LÓGICA DE RENDERIZAÇÃO ---

  const ratioValue = aspectRatio === 'custom' ? (customRatioValue || 1) : RATIO_VALUES[aspectRatio as keyof typeof RATIO_VALUES];

  let boxWidth = 0;
  let boxHeight = 0;

  if (wrapperSize.width > 0 && wrapperSize.height > 0) {
    const wrapperRatio = wrapperSize.width / wrapperSize.height;

    if (ratioValue > wrapperRatio) {
      boxWidth = wrapperSize.width;
      boxHeight = wrapperSize.width / ratioValue;
    } else {
      boxHeight = wrapperSize.height;
      boxWidth = wrapperSize.height * ratioValue;
    }
  }

  // Escala para renderização do texto (simulando 1080p)
  const previewScaleFactor = boxHeight / 1080;
  const safeScale = previewScaleFactor > 0 ? previewScaleFactor : 0.001;
  // Proteção contra NaN ou valores inválidos
  const safeFontSize = isNaN(fontSize) || fontSize < MIN_FONT_SIZE ? MIN_FONT_SIZE : fontSize;
  const scaledFontSize = safeFontSize * safeScale;

  return (
    <div ref={wrapperRef} className="w-full h-full flex items-center justify-center select-none overflow-hidden touch-none relative bg-slate-950">

      <div
        ref={containerRef}
        id="preview-container"
        className="relative shadow-2xl overflow-hidden bg-slate-900 border border-slate-700/50"
        style={{
          width: boxWidth > 0 ? boxWidth : '100%',
          height: boxHeight > 0 ? boxHeight : 'auto',
          cursor: dragTarget ? 'grabbing' : 'grab'
        }}
        // Eventos agora no container pai para capturar tudo
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Background Layer */}
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            backgroundColor: backgroundType === 'solid' ? backgroundColor : undefined,
            background: backgroundType === 'gradient' ? backgroundGradient : undefined,
          }}
        >
          {/* Label de Prévia */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 pointer-events-none">
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">PRÉVIA</span>
          </div>

          {backgroundType === 'media' && media && (
            <div
              style={{
                transform: `translate(${mediaPosition.x * safeScale}px, ${mediaPosition.y * safeScale}px) scale(${mediaScale * safeScale})`,
                width: media.width,
                height: media.height,
                // IMPORTANTE: maxWidth/Height 'none' para não ser limitado pelo tamanho da div pai
                maxWidth: 'none',
                maxHeight: 'none',
                position: 'absolute',
                transformOrigin: 'center center',
                willChange: 'transform' // Otimização de renderização
              }}
            >
              {media.type === 'video' ? (
                <video
                  ref={videoRef}
                  src={media.url}
                  width={media.width}
                  height={media.height}
                  autoPlay loop muted playsInline
                  className="w-full h-full pointer-events-none block object-contain"
                />
              ) : (
                <img
                  id="preview-image"
                  src={media.url}
                  width={media.width}
                  height={media.height}
                  alt="Fundo"
                  className="w-full h-full pointer-events-none block object-contain"
                />
              )}
            </div>
          )}
        </div>

        {/* Text Layer */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span
            id="timer-display"
            className="font-bold tabular-nums leading-none tracking-tighter absolute select-none pointer-events-auto touch-none"
            style={{
              fontSize: `${scaledFontSize}px`,
              fontFamily: fontFamily, // FIX: Aplicar fontFamily selecionada
              color: fontColor,
              textShadow: fontShadow ? `0 ${4 * safeScale}px ${12 * safeScale}px rgba(0,0,0,0.8)` : 'none',
              left: `${50 + textPosition.x}%`,
              top: `${50 + textPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              whiteSpace: 'nowrap'
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
    </div>
  );
};