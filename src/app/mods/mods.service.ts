import { Injectable, signal } from '@angular/core';
import { nanoid } from 'nanoid';

export type CursorPreset =
  | 'default'
  | 'anime-arrow'
  | 'heart'
  | 'star'
  | 'wand'
  | 'mummy'
  | 'custom';
export type ParticleMode =
  | 'stars'
  | 'petals'
  | 'snow'
  | 'bubbles'
  | 'confetti'
  | 'matrix'
  | 'fireflies'
  | 'sparkles';
export type StampShape = 'square' | 'oval' | 'rect-h' | 'rect-v';

export interface StampItem {
  id: string;
  url: string;
  x: number;
  y: number;
  size: number;
  shape: StampShape;
}

export interface ModsConfig {
  cursor: {
    enabled: boolean;
    preset: CursorPreset;
    customUrl: string;
    customPointerUrl: string;
    size: number;
    opacity: number;
  };
  background: {
    enabled: boolean;
    type: 'color' | 'image';
    color: string;
    imageUrl: string;
    opacity: number;
    blur: number;
  };
  stamps: {
    visible: boolean;
    size: number;
    items: StampItem[];
  };
  particles: {
    enabled: boolean;
    mode: ParticleMode;
    count: number;
    speed: number;
    opacity: number;
    color: string;
  };
}

const LS_KEY = 'sp-mods-config';

const DEFAULT: ModsConfig = {
  cursor: {
    enabled: false,
    preset: 'anime-arrow',
    customUrl: '',
    customPointerUrl: '',
    size: 32,
    opacity: 1,
  },
  background: {
    enabled: false,
    type: 'color',
    color: '#1a1a2e',
    imageUrl: '',
    opacity: 1,
    blur: 0,
  },
  stamps: { visible: false, size: 100, items: [] },
  particles: {
    enabled: false,
    mode: 'stars',
    count: 80,
    speed: 0.5,
    opacity: 0.7,
    color: '#ffffff',
  },
};

@Injectable({ providedIn: 'root' })
export class ModsService {
  readonly config = signal<ModsConfig>(this._load());

  patchCursor(p: Partial<ModsConfig['cursor']>): void {
    this._patch({ cursor: { ...this.config().cursor, ...p } });
  }
  patchBackground(p: Partial<ModsConfig['background']>): void {
    this._patch({ background: { ...this.config().background, ...p } });
  }
  patchStamps(p: Partial<ModsConfig['stamps']>): void {
    this._patch({ stamps: { ...this.config().stamps, ...p } });
  }
  patchParticles(p: Partial<ModsConfig['particles']>): void {
    this._patch({ particles: { ...this.config().particles, ...p } });
  }

  addStamp(url: string): void {
    const existing = this.config().stamps.items;
    const col = existing.length % 5;
    const row = Math.floor(existing.length / 5);
    const x = 40 + col * 110; // eslint-disable-line no-mixed-operators
    const y = 40 + row * 110; // eslint-disable-line no-mixed-operators
    const size = this.config().stamps.size;
    const items: StampItem[] = [
      ...existing,
      { id: nanoid(8), url, x, y, size, shape: 'square' },
    ];
    this.patchStamps({ items });
  }

  moveStamp(id: string, x: number, y: number): void {
    const items = this.config().stamps.items.map((s) =>
      s.id === id ? { ...s, x, y } : s,
    );
    this.patchStamps({ items });
  }

  setStampShape(id: string, shape: StampShape): void {
    const items = this.config().stamps.items.map((s) =>
      s.id === id ? { ...s, shape } : s,
    );
    this.patchStamps({ items });
  }

  removeStamp(id: string): void {
    const items = this.config().stamps.items.filter((s) => s.id !== id);
    this.patchStamps({ items });
  }

  resetAll(): void {
    const clean = JSON.parse(JSON.stringify(DEFAULT)) as ModsConfig;
    this.config.set(clean);
    localStorage.removeItem(LS_KEY);
  }

  private _patch(partial: Partial<ModsConfig>): void {
    const next = { ...this.config(), ...partial };
    this.config.set(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  private _load(): ModsConfig {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<ModsConfig>;
        return {
          cursor: { ...DEFAULT.cursor, ...(p.cursor ?? {}) },
          background: { ...DEFAULT.background, ...(p.background ?? {}) },
          stamps: {
            ...DEFAULT.stamps,
            ...(p.stamps ?? {}),
            // migrate old stamps that lack a shape field
            items: ((p.stamps?.items ?? []) as StampItem[]).map((s) => ({
              ...s,
              shape: s.shape ?? 'square',
            })),
          },
          particles: { ...DEFAULT.particles, ...(p.particles ?? {}) },
        };
      }
    } catch (_) {
      /* ignore */
    }
    return JSON.parse(JSON.stringify(DEFAULT)) as ModsConfig;
  }
}
