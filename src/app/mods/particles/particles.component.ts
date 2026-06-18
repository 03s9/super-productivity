/* eslint-disable no-mixed-operators */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ModsService, ParticleMode } from '../mods.service';

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
  phase: number;
  color: string;
  rot?: number; // rotation (confetti)
  life?: number; // 0-1 lifetime (sparkles)
  maxLife?: number;
}

@Component({
  selector: 'mods-particles',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        display: block;
      }
      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticlesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly _modsService = inject(ModsService);
  private readonly _ngZone = inject(NgZone);
  private readonly _doc = inject(DOCUMENT);
  private readonly _destroyRef = inject(DestroyRef);

  private _ctx!: CanvasRenderingContext2D;
  private _particles: Particle[] = [];
  private _rafId = 0;
  private _w = 0;
  private _h = 0;
  private _resizeObs?: ResizeObserver;

  // Matrix rain state
  private _matrixCols: number[] = [];

  readonly _cfg = computed(() => this._modsService.config().particles);

  constructor() {
    effect(() => {
      const cfg = this._cfg();
      if (this._ctx) this._reset(cfg.count, cfg.mode, cfg.color);
    });
  }

  ngAfterViewInit(): void {
    this._ngZone.runOutsideAngular(() => {
      const canvas = this.canvasRef.nativeElement;
      this._ctx = canvas.getContext('2d')!;
      this._resize();
      this._resizeObs = new ResizeObserver(() => this._resize());
      this._resizeObs.observe(this._doc.documentElement);
      this._doc.addEventListener('visibilitychange', this._onVis);
      this._loop();
    });
    this._destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this._rafId);
    this._resizeObs?.disconnect();
    this._doc.removeEventListener('visibilitychange', this._onVis);
  }

  private readonly _onVis = (): void => {
    if (this._doc.hidden) cancelAnimationFrame(this._rafId);
    else this._loop();
  };

  private _resize(): void {
    const canvas = this.canvasRef.nativeElement;
    this._w = canvas.width = window.innerWidth;
    this._h = canvas.height = window.innerHeight;
    const cfg = this._cfg();
    this._reset(cfg.count, cfg.mode, cfg.color);
  }

  private _reset(count: number, mode: ParticleMode, color: string): void {
    if (mode === 'matrix') {
      const cols = Math.floor(this._w / 14);
      this._matrixCols = Array.from({ length: cols }, () => -(Math.random() * this._h));
      this._particles = [];
    } else if (mode === 'sparkles') {
      this._particles = [];
    } else {
      this._particles = Array.from({ length: count }, () =>
        this._make(mode, color, true),
      );
    }
  }

  private _make(mode: ParticleMode, color: string, random = false): Particle {
    const w = this._w || window.innerWidth;
    const h = this._h || window.innerHeight;

    switch (mode) {
      case 'stars':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: 1 + Math.random() * 2.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.15,
          opacity: Math.random(),
          phase: Math.random() * Math.PI * 2,
          color,
        };
      case 'petals':
        return {
          x: Math.random() * w,
          y: random ? Math.random() * h : -12,
          size: 5 + Math.random() * 5,
          vx: 0,
          vy: 0.6 + Math.random() * 0.8,
          opacity: 0.6 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          color: `hsl(${330 + Math.random() * 30},80%,${75 + Math.random() * 15}%)`,
        };
      case 'snow':
        return {
          x: Math.random() * w,
          y: random ? Math.random() * h : -8,
          size: 2 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.5 + Math.random() * 0.6,
          opacity: 0.6 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          color: '#fff',
        };
      case 'bubbles':
        return {
          x: Math.random() * w,
          y: random ? Math.random() * h : h + 20,
          size: 10 + Math.random() * 20,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(0.4 + Math.random() * 0.5),
          opacity: 0.15 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
          color,
        };
      case 'confetti':
        return {
          x: Math.random() * w,
          y: random ? Math.random() * h : -15,
          size: 8 + Math.random() * 8,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0.8 + Math.random() * 1.2,
          opacity: 0.7 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI * 2,
          color: `hsl(${Math.random() * 360},90%,60%)`,
        };
      case 'fireflies':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: 2 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          opacity: Math.random(),
          phase: Math.random() * Math.PI * 2,
          color,
        };
      default:
        return { x: 0, y: 0, size: 2, vx: 0, vy: 0, opacity: 1, phase: 0, color };
    }
  }

  private _loop(): void {
    const cfg = this._cfg();
    const { mode, speed, opacity: baseOpacity, count, color } = cfg;
    const ctx = this._ctx;
    const w = this._w,
      h = this._h;

    if (mode === 'matrix') {
      this._drawMatrix(ctx, w, h, speed, color, baseOpacity);
    } else if (mode === 'sparkles') {
      ctx.clearRect(0, 0, w, h);
      this._drawSparkles(ctx, w, h, speed, count, baseOpacity, color);
    } else {
      ctx.clearRect(0, 0, w, h);
      for (const p of this._particles) {
        p.phase += 0.025 * speed;
        this._drawParticle(p, mode, speed, baseOpacity, w, h, color, ctx);
      }
    }

    this._rafId = requestAnimationFrame(() => this._loop());
  }

  // ── Matrix Rain ───────────────────────────────────────────
  private _drawMatrix(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    speed: number,
    color: string,
    opacity: number,
  ): void {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.08 * speed + 0.03, 0.15)})`;
    ctx.fillRect(0, 0, w, h);

    const fontSize = 13;
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = color.startsWith('#') ? color : '#00ff41';

    for (let i = 0; i < this._matrixCols.length; i++) {
      const char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
      const x = i * 14 + 2;
      const y = this._matrixCols[i];

      // Bright head
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(char, x, y);

      // Trail color
      ctx.fillStyle = color.startsWith('#') ? color : '#00ff41';
      ctx.globalAlpha = opacity * 0.7;
      ctx.fillText(char, x, y - fontSize);

      ctx.globalAlpha = 1;

      if (y > h + fontSize && Math.random() > 0.975) {
        this._matrixCols[i] = 0;
      } else {
        this._matrixCols[i] += fontSize * speed * 0.8;
      }
    }
  }

  // ── Sparkles ──────────────────────────────────────────────
  private _sparklePool: Array<{
    x: number;
    y: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
  }> = [];

  private _drawSparkles(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    speed: number,
    count: number,
    opacity: number,
    color: string,
  ): void {
    // Spawn new sparkles
    const spawnRate = Math.max(1, Math.floor(count / 60));
    for (let i = 0; i < spawnRate; i++) {
      if (Math.random() > 0.3) continue;
      this._sparklePool.push({
        x: Math.random() * w,
        y: Math.random() * h,
        life: 0,
        maxLife: 40 + Math.random() * 60,
        size: 4 + Math.random() * 12,
        color,
      });
    }

    // Draw & age
    this._sparklePool = this._sparklePool.filter((s) => {
      s.life += speed;
      if (s.life >= s.maxLife) return false;

      const t = s.life / s.maxLife;
      const alpha = opacity * (t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7);
      const sz = s.size * (t < 0.3 ? t / 0.3 : 1);

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = Math.max(0, alpha);
      this._drawStar4(ctx, sz, s.color);
      ctx.restore();

      return true;
    });

    ctx.globalAlpha = 1;
  }

  private _drawStar4(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const inner = size * 0.15;
      ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
      ctx.lineTo(
        Math.cos(angle + Math.PI / 4) * inner,
        Math.sin(angle + Math.PI / 4) * inner,
      );
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // glow
    ctx.shadowBlur = size * 1.5;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Regular particle draw/update ─────────────────────────
  private _drawParticle(
    p: Particle,
    mode: ParticleMode,
    speed: number,
    baseOpacity: number,
    w: number,
    h: number,
    color: string,
    ctx: CanvasRenderingContext2D,
  ): void {
    switch (mode) {
      case 'stars': {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        const tw = 0.5 + 0.5 * Math.sin(p.phase * 1.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = this._rgba(color, tw * baseOpacity);
        ctx.fill();
        break;
      }
      case 'petals': {
        p.x += Math.sin(p.phase) * 1.2 * speed;
        p.y += p.vy * speed;
        if (p.y > h + 15) Object.assign(p, this._make('petals', color));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.65, 0, 0, Math.PI * 2);
        ctx.fillStyle = this._rgba(p.color, p.opacity * baseOpacity);
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'snow': {
        p.x += p.vx * speed + Math.sin(p.phase) * 0.3;
        p.y += p.vy * speed;
        if (p.y > h + 10) Object.assign(p, this._make('snow', color));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity * baseOpacity})`;
        ctx.fill();
        break;
      }
      case 'bubbles': {
        p.x += p.vx * speed + Math.sin(p.phase * 0.5) * 0.4;
        p.y += p.vy * speed;
        if (p.y < -30) Object.assign(p, this._make('bubbles', color));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.strokeStyle = this._rgba(color, p.opacity * baseOpacity);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity * 0.5})`;
        ctx.fill();
        break;
      }
      case 'confetti': {
        p.x += p.vx * speed + Math.sin(p.phase) * 0.5;
        p.y += p.vy * speed;
        p.rot = (p.rot ?? 0) + 0.06 * speed;
        if (p.y > h + 20) Object.assign(p, this._make('confetti', color));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot ?? 0);
        ctx.fillStyle = this._rgba(p.color, p.opacity * baseOpacity);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
        break;
      }
      case 'fireflies': {
        p.x += p.vx * speed + Math.sin(p.phase * 0.7) * 0.5;
        p.y += p.vy * speed + Math.cos(p.phase * 0.5) * 0.3;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        const glow = 0.4 + 0.6 * Math.sin(p.phase);
        const alpha = glow * baseOpacity;
        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = this._rgba(color, alpha);
        ctx.fill();
        // Outer glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        grad.addColorStop(0, this._rgba(color, alpha * 0.6));
        grad.addColorStop(1, this._rgba(color, 0));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        break;
      }
    }
  }

  private _rgba(hex: string, alpha: number): string {
    if (hex.startsWith('#') && hex.length >= 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
    }
    return hex;
  }
}
