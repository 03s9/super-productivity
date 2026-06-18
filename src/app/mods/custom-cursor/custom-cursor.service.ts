import { effect, inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ModsService, CursorPreset } from '../mods.service';

// ── SVG preset definitions ────────────────────────────────────────────────────
// Each returns an SVG string that gets sized and tinted at apply-time.

// Scale a point from the base 24×24 viewport
const r = (n: number): string => `${n}`;

/* eslint-disable @typescript-eslint/naming-convention */
const SVG_PRESETS: Partial<Record<CursorPreset, string>> = {
  'anime-arrow': `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE">
    <polygon points="0,0 0,${r(18)} ${r(5)},${r(13)} ${r(8)},${r(22)} ${r(11)},${r(20)} ${r(8)},${r(11)} ${r(13)},${r(11)}"
      fill="white" stroke="black" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`,

  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE">
    <path d="M${r(12)} ${r(20)} C${r(12)} ${r(20)} ${r(2)} ${r(13)} ${r(2)} ${r(7.5)}
      A${r(5)} ${r(5)} 0 0 1 ${r(12)} ${r(5.2)}
      A${r(5)} ${r(5)} 0 0 1 ${r(22)} ${r(7.5)}
      C${r(22)} ${r(13)} ${r(12)} ${r(20)} ${r(12)} ${r(20)} Z"
      fill="#ff69b4" stroke="white" stroke-width="1.5"/>
  </svg>`,

  // prettier-ignore
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE">
    <polygon points="${r(12)},${r(2)} ${r(14.5)},${r(9)} ${r(22)},${r(9)} ${r(16)},${r(14)}
      ${r(18.5)},${r(21)} ${r(12)},${r(16.5)} ${r(5.5)},${r(21)} ${r(8)},${r(14)} ${r(2)},${r(9)} ${r(9.5)},${r(9)}"
      fill="#ffd700" stroke="white" stroke-width="1" stroke-linejoin="round"/>
  </svg>`,

  wand: `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE">
    <line x1="${r(2)}" y1="${r(22)}" x2="${r(15)}" y2="${r(9)}" stroke="black" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="${r(2)}" y1="${r(22)}" x2="${r(15)}" y2="${r(9)}" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="${r(18)}" cy="${r(6)}" r="${r(4)}" fill="#b39ddb" stroke="white" stroke-width="1.5"/>
    <circle cx="${r(18)}" cy="${r(6)}" r="${r(1.5)}" fill="white" opacity="0.7"/>
  </svg>`,
};
/* eslint-enable @typescript-eslint/naming-convention */

const buildSvgCursor = (preset: CursorPreset, size: number, opacity: number): string => {
  const template = SVG_PRESETS[preset];
  if (!template) return 'auto';
  const scale = size / 24;
  // Replace SIZE placeholder and scale all numeric coordinate values
  const svg = template
    .replace(/SIZE/g, String(size))
    .replace(/<svg /g, `<svg opacity="${opacity}" `)
    .replace(/(\d+(?:\.\d+)?)/g, (_, n) => {
      const num = parseFloat(n);
      // Only scale values that look like coordinates (exclude stroke-width, opacity etc.)
      return String(Math.round(num * scale * 10) / 10);
    });
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0, auto`;
};

// ── CSS selector for interactive elements ─────────────────────────────────────
const POINTER_SELECTOR = [
  'a',
  'button',
  '[role="button"]',
  'label[for]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'select',
  '.mat-mdc-button',
  '.mat-mdc-icon-button',
  '.mat-mdc-fab',
  '.mat-mdc-mini-fab',
  '.chip',
  '.tab-btn',
  '.mods-fab',
].join(', ');

const STYLE_ID = 'mods-cursor-pointer-style';

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CustomCursorService {
  private readonly _modsService = inject(ModsService);
  private readonly _doc = inject(DOCUMENT);
  private _generation = 0;

  constructor() {
    effect(() => {
      this._apply();
    });
  }

  private _apply(): void {
    const { enabled, preset, customUrl, customPointerUrl, size, opacity } =
      this._modsService.config().cursor;

    const gen = ++this._generation;
    const body = this._doc.body;
    this._removePointerStyle();

    if (!enabled) {
      body.style.cursor = '';
      return;
    }

    // SVG presets — fully synchronous
    if (preset in SVG_PRESETS) {
      body.style.cursor = buildSvgCursor(preset, size, opacity);
      return;
    }

    if (preset === 'default') {
      body.style.cursor = 'auto';
      return;
    }

    // PNG-based presets (mummy / custom) — async canvas processing
    const cursorSrc =
      preset === 'mummy'
        ? 'assets/cursors/mummy-cursor.png'
        : preset === 'custom'
          ? customUrl
          : '';
    const pointerSrc =
      preset === 'mummy'
        ? 'assets/cursors/mummy-pointer.png'
        : preset === 'custom'
          ? customPointerUrl
          : '';

    if (cursorSrc) {
      void this._processPng(cursorSrc, size, opacity).then((url) => {
        if (this._generation !== gen) return;
        body.style.cursor = `url("${url}") 0 0, auto`;
      });
    }

    if (pointerSrc) {
      void this._processPng(pointerSrc, size, opacity).then((url) => {
        if (this._generation !== gen) return;
        this._injectPointerStyle(`url("${url}") 0 0, pointer`);
      });
    }
  }

  private _processPng(src: string, size: number, opacity: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = this._doc.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(src); // fallback: use original
      img.src = src;
    });
  }

  private _injectPointerStyle(cursorValue: string): void {
    const style = this._doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `${POINTER_SELECTOR} { cursor: ${cursorValue} !important; }`;
    this._doc.head.appendChild(style);
  }

  private _removePointerStyle(): void {
    this._doc.getElementById(STYLE_ID)?.remove();
  }
}
