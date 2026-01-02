import { AppearanceState } from '../types';
import { RATIO_VALUES } from '../constants';

interface PreCalculatedLayout {
    bg: {
        draw: boolean;
        type: 'solid' | 'gradient' | 'media';
        colorOrGradient?: string | CanvasGradient;
        mediaElement?: CanvasImageSource;
        dx: number; dy: number; dw: number; dh: number;
    };
    textCenter: {
        x: number; y: number;
    };
}

// Interface para cada "letra" desenhada na tela
interface RenderItem {
    char: string;
    x: number; // Posição absoluta X no canvas final
    y: number; // Posição absoluta Y no canvas final
    w: number; // Largura do sprite
    h: number; // Altura do sprite
    sourceX: number; // Onde buscar no Atlas
}

export class VideoRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private appearance: AppearanceState;
    private duration: number;
    private isPro: boolean;
    private videoElement: HTMLVideoElement | null;

    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];

    private startTime: number = 0;
    private animationFrameId: number = 0;
    private onProgress: (progress: number, stats: any) => void;
    private onComplete: (url: string) => void;

    // --- SPRITE ATLAS SYSTEM ---
    private glyphCache: HTMLCanvasElement | null = null; // O "Atlas" com 0-9 e :
    private glyphMap: Record<string, { x: number, w: number }> = {}; // Onde está cada char no Atlas
    private glyphHeight: number = 0;
    private numberWidth: number = 0; // Largura fixa para números (Monospace)
    private colonWidth: number = 0;

    // --- RENDER STATE ---
    private currentRenderItems: RenderItem[] = []; // Lista de comandos de desenho para o frame atual
    private lastRenderedSecond: number = -1;

    // --- STATS & TIMING ---
    private frameCount: number = 0;
    private lastFpsTime: number = 0;
    private readonly FPS = 30;
    private readonly INTERVAL = 1000 / 30;
    private lastFrameTime: number = 0;

    private layout: PreCalculatedLayout | null = null;
    private warmupFrames: number = 0;
    private readonly WARMUP_DURATION_FRAMES = 5;

    // --- WATERMARK STATE ---
    private watermarkY: number = 0;
    private watermarkX: number = 0;
    private lastWatermarkMove: number = 0;
    private readonly WATERMARK_INTERVAL = 5; // Mover a cada 5s
    private isWatermarkAtTop: boolean = false;



    constructor(
        canvas: HTMLCanvasElement,
        videoElement: HTMLVideoElement | null,
        appearance: AppearanceState,
        duration: number,
        isPro: boolean,
        onProgress: (p: number, s: any) => void,
        onComplete: (u: string) => void
    ) {
        this.canvas = canvas;
        this.videoElement = videoElement;
        this.appearance = appearance;
        this.duration = Number(duration); // FIX: Garantir que é número para evitar "5" + 2 = "52"
        this.isPro = isPro;
        this.onProgress = onProgress;
        this.onComplete = onComplete;

        this.ctx = this.canvas.getContext('2d', {
            alpha: false,
            desynchronized: true,
            willReadFrequently: false
        })!;
    }

    // --- HELPER: Formatação de Tempo ---
    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // --- FASE 1: PREPARAÇÃO DO LAYOUT E SPRITES ---

    private calculateBackgroundLayout() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        const bgConfig: PreCalculatedLayout['bg'] = {
            draw: true,
            type: this.appearance.backgroundType,
            dx: 0, dy: 0, dw: width, dh: height
        };

        if (this.appearance.backgroundType === 'solid') {
            bgConfig.colorOrGradient = this.appearance.backgroundColor;
        }
        else if (this.appearance.backgroundType === 'gradient') {
            const gradient = this.ctx.createLinearGradient(0, 0, width, height);
            const colors = this.appearance.backgroundGradient.match(/#[0-9a-fA-F]{6}/g);
            if (colors && colors.length >= 2) {
                gradient.addColorStop(0, colors[0]);
                gradient.addColorStop(1, colors[1]);
            } else {
                gradient.addColorStop(0, '#000');
                gradient.addColorStop(1, '#fff');
            }
            bgConfig.colorOrGradient = gradient;
        }
        else if (this.appearance.backgroundType === 'media' && this.appearance.media) {
            const media = this.appearance.media;
            let drawable: CanvasImageSource | null = null;

            if (media.type === 'video' && this.videoElement) {
                drawable = this.videoElement;
            } else if (media.type === 'image') {
                const img = document.querySelector('#preview-image') as HTMLImageElement;
                if (img) drawable = img;
            }

            bgConfig.mediaElement = drawable || undefined;

            if (drawable) {
                const scaleFactor = height / 800;
                const finalScale = this.appearance.mediaScale * scaleFactor;
                const dw = Math.round(media.width * finalScale);
                const dh = Math.round(media.height * finalScale);
                // Math.floor/round evita sub-pixel rendering (borrão)
                const dx = Math.round((width / 2) + (this.appearance.mediaPosition.x * scaleFactor) - (dw / 2));
                const dy = Math.round((height / 2) + (this.appearance.mediaPosition.y * scaleFactor) - (dh / 2));
                bgConfig.dx = dx; bgConfig.dy = dy; bgConfig.dw = dw; bgConfig.dh = dh;
            }
        }

        const xPct = this.appearance.textPosition.x;
        const yPct = this.appearance.textPosition.y;
        const textX = Math.round((width / 2) + (xPct * (width / 100)));
        const textY = Math.round((height / 2) + (yPct * (height / 100)));

        this.layout = { bg: bgConfig, textCenter: { x: textX, y: textY } };
    }

    // O "Segredo": Cria um Sprite Sheet com todos os números
    private buildGlyphCache() {
        // 1. Configurações de Fonte
        const baseRef = 1080;
        const currentHeight = this.canvas.height;
        const scale = currentHeight / baseRef;
        const fontSize = Math.round(this.appearance.fontSize * scale);
        const fontName = this.appearance.fontFamily || 'Inter';
        const fontString = `bold ${fontSize}px "${fontName}", sans-serif`;

        // 2. Criar Canvas Temporário para medição e desenho
        // Precisamos de altura suficiente (fontSize * 1.5 para segurança de descenders/ascenders)
        const bufferHeight = Math.ceil(fontSize * 1.5);

        // Medir Largura Monospace (usando o '0' ou '8' como referência de largura máxima)
        const tempCtx = document.createElement('canvas').getContext('2d')!;
        tempCtx.font = fontString;

        const measure0 = tempCtx.measureText('0');
        const measure8 = tempCtx.measureText('8');
        const maxNumWidth = Math.ceil(Math.max(measure0.width, measure8.width));
        const colonMeasure = tempCtx.measureText(':');
        const colonW = Math.ceil(colonMeasure.width);

        this.numberWidth = maxNumWidth;
        this.colonWidth = colonW;
        this.glyphHeight = bufferHeight;

        // 3. Criar o Canvas do Atlas
        // Largura total = (10 números * larguraMaxima) + (1 dois-pontos * larguraColon) + padding
        const totalWidth = (this.numberWidth * 10) + this.colonWidth + 20;

        this.glyphCache = document.createElement('canvas');
        this.glyphCache.width = totalWidth;
        this.glyphCache.height = bufferHeight;

        const ctx = this.glyphCache.getContext('2d', { alpha: true })!;
        ctx.font = fontString;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Sombra (Aplicada uma vez no Atlas)
        if (this.appearance.fontShadow) {
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            const offset = Math.max(2, (fontSize * 0.04) | 0);

            // Desenha sombras
            let cursorX = 0;
            // Números 0-9
            for (let i = 0; i <= 9; i++) {
                const char = i.toString();
                const centerX = cursorX + (this.numberWidth / 2);
                const centerY = bufferHeight / 2;
                ctx.fillText(char, centerX + offset, centerY + offset);
                cursorX += this.numberWidth;
            }
            // Dois pontos
            const cX = cursorX + (this.colonWidth / 2);
            const cY = bufferHeight / 2;
            ctx.fillText(':', cX + offset, cY + offset);
        }

        // Cor Principal (Resetar shadow para não duplicar)
        ctx.shadowColor = "transparent";
        ctx.fillStyle = this.appearance.fontColor;

        // Desenha Caracteres
        let cursorX = 0;
        // 0-9
        for (let i = 0; i <= 9; i++) {
            const char = i.toString();
            const centerX = cursorX + (this.numberWidth / 2);
            const centerY = bufferHeight / 2;
            ctx.fillText(char, centerX, centerY);

            // Registra posição no mapa
            this.glyphMap[char] = { x: cursorX, w: this.numberWidth };
            cursorX += this.numberWidth;
        }
        // :
        const colX = cursorX + (this.colonWidth / 2);
        ctx.fillText(':', colX, bufferHeight / 2);
        this.glyphMap[':'] = { x: cursorX, w: this.colonWidth };
    }

    // Calcula onde cada dígito vai ficar na tela baseada no tempo atual
    private updateLayoutForTime(seconds: number) {
        const textString = this.formatTime(seconds);

        // Calcular largura total da string
        let totalWidth = 0;
        for (const char of textString) {
            totalWidth += (char === ':' ? this.colonWidth : this.numberWidth);
        }

        // Ponto de partida (X) para centralizar
        const startX = this.layout!.textCenter.x - (totalWidth / 2);
        const startY = this.layout!.textCenter.y - (this.glyphHeight / 2);

        this.currentRenderItems = [];
        let currentX = startX;

        // Validar glyphMap
        const keys = Object.keys(this.glyphMap);
        if (keys.length === 0) {
            console.warn("⚠️ GlyphMap está vazio! Tentando reconstruir...");
            this.buildGlyphCache();
        }

        for (const char of textString) {
            // Fallback se char não existir (não deve ocorrer)
            const glyph = this.glyphMap[char] || this.glyphMap['0'];
            if (glyph) {
                this.currentRenderItems.push({
                    char,
                    x: currentX,
                    y: startY,
                    w: glyph.w,
                    h: this.glyphHeight,
                    sourceX: glyph.x
                });
                currentX += glyph.w;
            }
        }
    }

    public async start(bitrate: number) {
        const baseHeight = this.appearance.resolution || 720;
        const ratioValue = this.appearance.aspectRatio === 'custom'
            ? (this.appearance.customRatioValue || 1)
            : RATIO_VALUES[this.appearance.aspectRatio as keyof typeof RATIO_VALUES];

        this.canvas.height = baseHeight;
        this.canvas.width = Math.round(baseHeight * ratioValue) & ~1;

        this.calculateBackgroundLayout();

        const fontName = this.appearance.fontFamily || 'Inter';
        try {
            await document.fonts.load(`bold 100px "${fontName}"`);
        } catch (e) { console.warn("Fallback font"); }

        this.buildGlyphCache();
        // CORREÇÃO: Usar Math.floor para iniciar no número EXATO, sem arredondar para cima (que causava +1)
        this.updateLayoutForTime(Math.floor(this.duration));

        this.warmupFrames = 0;
        this.lastFpsTime = performance.now();
        this.lastFrameTime = performance.now();

        // Inicializar Posição da Marca D'água (Começa padrão em baixo)
        this.resetWatermarkPosition();

        const stream = this.canvas.captureStream(this.FPS);
        const mimeTypes = [
            'video/mp4;codecs=avc1.424028',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9',
            'video/webm'
        ];
        let selectedMime = '';
        for (const t of mimeTypes) {
            if (MediaRecorder.isTypeSupported(t)) { selectedMime = t; break; }
        }

        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: selectedMime || undefined,
            videoBitsPerSecond: bitrate
        });

        this.chunks = [];
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.chunks, { type: selectedMime || 'video/webm' });
            const url = URL.createObjectURL(blob);
            this.onComplete(url);
        };

        // Safety timeout in case loop dies (GLOBAL FAILURE SAFEGUARD)
        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                console.warn("⚠️ Watchdog: Forçando parada por tempo excedido.");
                this.stop();
            }
        }, (this.duration + 5) * 1000);

        if (this.appearance.backgroundType === 'media' && this.appearance.media?.type === 'video' && this.videoElement) {
            this.videoElement.currentTime = 0;
            this.videoElement.muted = true;
            if (this.appearance.syncVideoToTimer && this.appearance.media?.duration) {
                this.videoElement.playbackRate = this.appearance.media.duration / this.duration;
                this.videoElement.loop = false;
            } else {
                this.videoElement.playbackRate = 1;
                this.videoElement.loop = true;
            }
            this.videoElement.play().catch(console.error);
        }

        this.loop();
    }

    private loop = () => {
        if (!this.mediaRecorder || !this.layout) return;

        const now = performance.now();
        const delta = now - this.lastFrameTime;

        if (delta < this.INTERVAL) {
            this.animationFrameId = requestAnimationFrame(this.loop);
            return;
        }

        this.lastFrameTime = now - (delta % this.INTERVAL);

        if (this.warmupFrames < this.WARMUP_DURATION_FRAMES) {
            this.renderFrame(this.duration);
            this.warmupFrames++;
            if (this.warmupFrames === this.WARMUP_DURATION_FRAMES) {
                this.startTime = performance.now();
                if (this.mediaRecorder.state === 'inactive') {
                    this.mediaRecorder.start();
                }
            }
            this.animationFrameId = requestAnimationFrame(this.loop);
            return;
        }

        // Se passamos do tempo de warmup e recorder não está gravando, algo deu errado.
        // Tentar iniciar novamente ou ignorar (para pelo menos desenhar na tela)
        if (this.mediaRecorder.state !== 'recording') {
            // Se já passamos muito tempo tentando iniciar, abortamos o loop de espera ativa
            const elapsedSinceStart = (now - this.startTime) / 1000;
            if (elapsedSinceStart > 1.0) {
                console.warn("⚠️ MediaRecorder não iniciou. Forçando start ou continuando...");
                if (this.mediaRecorder.state === 'inactive') this.mediaRecorder.start();
            }
            // Retornar mas continuar loop para checar novamente
            this.animationFrameId = requestAnimationFrame(this.loop);
            return;
        }

        const elapsed = (now - this.startTime) / 1000;
        const remaining = Math.max(0, this.duration - elapsed);

        this.renderFrame(remaining);

        this.frameCount++;
        if (now - this.lastFpsTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
            this.onProgress(remaining, { fps, resolution: this.canvas.height });
            this.lastFpsTime = now;
            this.frameCount = 0;
        }

        // CORREÇÃO: Buffer aumentado para 2.0s
        // SAFEGUARD: Sempre checar tempo, independente do estado do recorder
        if (elapsed >= this.duration + 2.0) {
            console.log("✅ Renderização finalizada por tempo.");
            this.stop();
            return;
        }

        // Force extra "ending" frames to ensure 00:00 is captured even if lag occurred
        if (remaining === 0 && elapsed > this.duration) {
            // Force redraw of 00:00
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    private renderFrame(timeLeft: number) {
        if (!this.layout || !this.glyphCache) return;

        // CORREÇÃO: Math.floor garante que 6.9s seja tratado como "6" rolando para baixo, e não "7" estático
        const remainingInt = Math.floor(timeLeft);
        const bg = this.layout.bg;

        // 1. Draw Background
        if (bg.type === 'solid' && bg.colorOrGradient) {
            this.ctx.fillStyle = bg.colorOrGradient;
            this.ctx.fillRect(0, 0, bg.dw, bg.dh);
        }
        else if (bg.type === 'gradient' && bg.colorOrGradient) {
            this.ctx.fillStyle = bg.colorOrGradient;
            this.ctx.fillRect(0, 0, bg.dw, bg.dh);
        }
        else if (bg.type === 'media' && bg.mediaElement) {
            this.ctx.drawImage(bg.mediaElement, bg.dx, bg.dy, bg.dw, bg.dh);
        }

        // 2. Lógica de Comparação
        const currentString = this.formatTime(remainingInt);
        // O segundo anterior na verdade é o próximo número na contagem (t+1) pois estamos descendo
        const previousString = this.formatTime(remainingInt + 1);

        // Atualiza layout apenas para calcular posições (RenderItems) do estado ATUAL
        if (remainingInt !== this.lastRenderedSecond) {
            this.updateLayoutForTime(remainingInt);
            this.lastRenderedSecond = remainingInt;
        }

        const animType = this.appearance.animationType;
        const fraction = timeLeft - Math.floor(timeLeft); // 0.99 -> 0.00

        // Itera sobre cada char da string ATUAL
        for (let i = 0; i < this.currentRenderItems.length; i++) {
            const item = this.currentRenderItems[i];
            const previousChar = previousString[i] || item.char; // Fallback se tamanho mudar

            const charHasChanged = item.char !== previousChar;

            // SE ESTÁTICO OU SEM ANIMAÇÃO
            if (!charHasChanged || animType === 'none') {
                this.ctx.drawImage(this.glyphCache, item.sourceX, 0, item.w, item.h, item.x, item.y, item.w, item.h);
                continue;
            }

            // === ANIMAÇÕES ===
            // Configurações comuns
            const centerX = item.x + (item.w / 2);
            const centerY = item.y + (item.h / 2);

            // Animação acontece nos primeiros 50% do segundo para ser "Snappy"
            // T vai de 0 a 1 durante a animação
            let t = 0;
            // CORREÇÃO: Animação agora acontece no FINAL do segundo (0.6 -> 0.1)
            // Isso garante que o número (ex: 5) fique estático por 0.4s antes de começar a mudar
            const animDuration = 0.5; // 500ms
            const startThreshold = 0.6; // Começa quando faltar 0.6s (fraction 0.6)
            const endThreshold = 0.6 - animDuration; // Termina em 0.1s

            if (fraction <= startThreshold && fraction > endThreshold) {
                t = (startThreshold - fraction) / animDuration; // 0 -> 1
            } else if (fraction <= endThreshold) {
                t = 1; // Terminou
            }

            // Easing
            const easeInOut = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const easeOutCubic = 1 - Math.pow(1 - t, 3);
            const easeInCubic = t * t * t;

            // Pega dados do sprite ANTERIOR para desenhar a transição
            const prevGlyphData = this.glyphMap[previousChar];
            const prevSourceX = prevGlyphData ? prevGlyphData.x : item.sourceX;

            this.ctx.save();

            if (animType === 'roller-mechanical') {
                // Efeito Slot Machine / Taxímetro
                this.ctx.beginPath();
                this.ctx.rect(item.x, item.y, item.w, item.h);
                this.ctx.clip();

                const offset = item.h * easeInOut;

                // Desenha o Velho (Saindo para cima)
                if (t < 1) {
                    this.ctx.drawImage(
                        this.glyphCache,
                        prevSourceX, 0, item.w, item.h,
                        item.x, item.y - offset, item.w, item.h
                    );
                }

                // Desenha o Novo (Entrando de baixo)
                this.ctx.drawImage(
                    this.glyphCache,
                    item.sourceX, 0, item.w, item.h,
                    item.x, item.y + item.h - offset, item.w, item.h
                );
            }
            else if (animType === 'slide-horizontal') {
                // Efeito Fita Métrica (Lateral)
                // Velho vai para esquerda (-100%), Novo vem da direita (+100%)
                this.ctx.beginPath();
                this.ctx.rect(item.x, item.y, item.w, item.h);
                this.ctx.clip();

                const offset = item.w * easeInOut;

                // Desenha o Velho (Saindo para esquerda)
                if (t < 1) {
                    this.ctx.drawImage(
                        this.glyphCache,
                        prevSourceX, 0, item.w, item.h,
                        item.x - offset, item.y, item.w, item.h
                    );
                }

                // Desenha o Novo (Entrando da direita)
                this.ctx.drawImage(
                    this.glyphCache,
                    item.sourceX, 0, item.w, item.h,
                    item.x + item.w - offset, item.y, item.w, item.h
                );
            }
            else if (animType === 'zoom-depth') {
                // Efeito Profundidade
                // Velho: Scale 1 -> 1.5, Alpha 1 -> 0 (Vem pra frente e some)
                // Novo: Scale 0.5 -> 1, Alpha 0 -> 1 (Vem do fundo)

                this.ctx.translate(centerX, centerY);

                // Desenha o Velho (Saindo)
                if (t < 1) {
                    this.ctx.save();
                    const scaleOld = 1 + (t * 0.5);
                    this.ctx.globalAlpha = 1 - t;
                    this.ctx.scale(scaleOld, scaleOld);
                    this.ctx.drawImage(
                        this.glyphCache,
                        prevSourceX, 0, item.w, item.h,
                        -item.w / 2, -item.h / 2, item.w, item.h
                    );
                    this.ctx.restore();
                }

                // Desenha o Novo (Entrando)
                this.ctx.save();
                const scaleNew = 0.5 + (t * 0.5);
                this.ctx.globalAlpha = t;
                this.ctx.scale(scaleNew, scaleNew);
                this.ctx.drawImage(
                    this.glyphCache,
                    item.sourceX, 0, item.w, item.h,
                    -item.w / 2, -item.h / 2, item.w, item.h
                );
                this.ctx.restore();
            }
            else if (animType === 'flip-classic') {
                // Efeito Placa Giratória (Aeroporto)
                this.ctx.translate(centerX, centerY);

                if (t < 0.5) {
                    // Fase 1: Encolhendo o Velho
                    const tPhase1 = t * 2;
                    const scale = 1 - tPhase1;
                    this.ctx.scale(1, Math.max(0, scale));
                    this.ctx.filter = `brightness(${50 + (50 * scale)}%)`;
                    this.ctx.drawImage(
                        this.glyphCache,
                        prevSourceX, 0, item.w, item.h,
                        -item.w / 2, -item.h / 2, item.w, item.h
                    );
                } else {
                    // Fase 2: Crescendo o Novo
                    const tPhase2 = (t - 0.5) * 2;
                    const scale = tPhase2;
                    this.ctx.scale(1, scale);
                    this.ctx.filter = `brightness(${50 + (50 * scale)}%)`;
                    this.ctx.drawImage(
                        this.glyphCache,
                        item.sourceX, 0, item.w, item.h,
                        -item.w / 2, -item.h / 2, item.w, item.h
                    );
                }
            }
            else if (animType === 'spin-3d') {
                // Efeito Moeda (Giro no eixo Y)
                this.ctx.translate(centerX, centerY);
                if (t < 0.5) {
                    const scale = 1 - (t * 2);
                    this.ctx.scale(Math.max(0, scale), 1);
                    this.ctx.filter = `brightness(${70 + (30 * scale)}%)`;
                    this.ctx.drawImage(
                        this.glyphCache,
                        prevSourceX, 0, item.w, item.h,
                        -item.w / 2, -item.h / 2, item.w, item.h
                    );
                } else {
                    const scale = (t - 0.5) * 2;
                    this.ctx.scale(scale, 1);
                    this.ctx.filter = `brightness(${70 + (30 * scale)}%)`;
                    this.ctx.drawImage(
                        this.glyphCache,
                        item.sourceX, 0, item.w, item.h,
                        -item.w / 2, -item.h / 2, item.w, item.h
                    );
                }
            }
            else if (animType === 'pop') {
                // Pop mantém apenas o Novo, mas com efeito elástico
                this.ctx.translate(centerX, centerY);
                const scale = t < 0.5 ? 0.5 + t : 1 + (Math.sin(t * Math.PI * 4) * 0.1);
                this.ctx.scale(scale, scale);

                this.ctx.drawImage(
                    this.glyphCache,
                    item.sourceX, 0, item.w, item.h,
                    -item.w / 2, -item.h / 2, item.w, item.h
                );
            }

            this.ctx.restore();
        }

        if (!this.isPro) {
            // Passar o tempo decorrido para a animação da marca d'água
            const elapsed = Math.max(0, this.duration - timeLeft);
            this.drawWatermark(elapsed);
        }
    }

    private resetWatermarkPosition() {
        // Inicializa no canto inferior direito padrão
        const padding = this.canvas.height * 0.05; // 5% de margem
        this.watermarkX = this.canvas.width - padding;
        this.watermarkY = this.canvas.height - padding;
        this.isWatermarkAtTop = false;
        this.lastWatermarkMove = 0;
    }

    private updateWatermarkPosition(elapsed: number) {
        // Se vídeo curto (< 20s), mantém estático em baixo
        if (this.duration <= 20) return;

        // Se já passou o tempo, move
        if (elapsed - this.lastWatermarkMove > this.WATERMARK_INTERVAL) {
            const padding = this.canvas.height * 0.05;

            // Alternar entre Topo e Base
            this.isWatermarkAtTop = !this.isWatermarkAtTop;

            // Y: Topo ou Base (com safe area)
            // Se Topo: padding. Se Base: height - padding
            this.watermarkY = this.isWatermarkAtTop ? padding + (this.canvas.height * 0.03) : this.canvas.height - padding;

            // X: Aleatório na horizontal (mantendo margem)
            // Queremos que o texto fique alinhado à direita, então o X é a ancoragem direita.
            // O X pode variar entre 50% e 100% da largura para não ficar muito no meio
            const minX = this.canvas.width * 0.6;
            const maxX = this.canvas.width - padding;
            this.watermarkX = minX + Math.random() * (maxX - minX);

            this.lastWatermarkMove = elapsed;
        }
    }

    private drawWatermark(elapsed: number) {
        const text = "321-go.vercel.app"; // URL Final (Vercel)

        // Atualiza posição se necessário
        this.updateWatermarkPosition(elapsed);

        this.ctx.save();
        // Math.max garante legibilidade mínima em resoluções baixas
        const fontSize = Math.max(16, Math.round(this.canvas.height * 0.025));
        this.ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.textAlign = "right";
        this.ctx.textBaseline = "bottom";
        this.ctx.shadowColor = "rgba(0,0,0,0.8)";
        this.ctx.shadowBlur = 4;

        // Desenha na posição calculada
        this.ctx.fillText(text, this.watermarkX, this.watermarkY);
        this.ctx.restore();
    }

    public stop() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        cancelAnimationFrame(this.animationFrameId);
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.currentTime = 0;
            this.videoElement.loop = true;
            this.videoElement.playbackRate = 1;
        }
    }
}