/* eslint-disable no-mixed-operators */
import { Injectable, signal } from '@angular/core';
import { getAudioBuffer, getAudioContext } from '../../util/audio-context';

export type TypingSound = 'pencil' | 'pen' | 'pixel' | 'typewriter' | 'custom' | 'off';
export type TaskDoneSound = 'crumple' | 'sword' | 'pixel' | 'chime' | 'custom' | 'off';

export interface SoundConfig {
  typingSound: TypingSound;
  taskDoneSound: TaskDoneSound;
  volume: number;
}

const LS_KEY = 'sp-sound-config';
const IDB_DB = 'sp-custom-sounds';
const IDB_STORE = 'sounds';

const DEFAULT_CONFIG: SoundConfig = {
  typingSound: 'pencil',
  taskDoneSound: 'crumple',
  volume: 0.6,
};

const SILENT_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'Tab',
  'Escape',
  'Enter',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'PrintScreen',
  'ScrollLock',
  'Pause',
  'NumLock',
  'ContextMenu',
]);

// Pre-load audio assets eagerly so the first keystroke is never silent.
// Decoding works fine even on a suspended AudioContext — it only affects playback.
const PENCIL_PATH = 'assets/snd/pencil-writing.mp3';
const CRUMPLE_PATH = 'assets/snd/paper-crumple.mp3';

@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly config = signal<SoundConfig>(this._loadConfig());

  private _customBuffers: Record<string, AudioBuffer> = {};
  private _pencilBuffer: AudioBuffer | null = null;
  private _crumpleBuffer: AudioBuffer | null = null;
  private _activeTypingGain: GainNode | null = null;

  // ── Single shared AudioContext (the util's singleton) ─────────────────────
  // All sound production goes through this one context.  Using a second
  // AudioContext in the service was the root cause: _resumeCtx() would resume
  // the wrong context, leaving pencil/crumple silent when the shared context
  // was suspended (e.g. after a focus-mode white-noise session ends).
  private get _ctx(): AudioContext {
    return getAudioContext();
  }

  constructor() {
    // Eagerly fetch + decode both real-audio files as soon as the module loads.
    // AudioContext.decodeAudioData works on a suspended context; playback will
    // start correctly once the context is resumed by the first user gesture.
    this._preload();
  }

  saveConfig(cfg: SoundConfig): void {
    this.config.set({ ...cfg });
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  }

  isSilentKey(key: string): boolean {
    return SILENT_KEYS.has(key);
  }

  playTypingSound(isPreview = false): void {
    const cfg = this.config();
    if (!isPreview && cfg.typingSound === 'off') return;
    const vol = cfg.volume * (isPreview ? 0.7 : 1);
    try {
      this._resumeCtx();
      switch (cfg.typingSound) {
        case 'pencil':
          this._synthPencil(vol);
          break;
        case 'pen':
          this._synthPen(vol);
          break;
        case 'pixel':
          this._synthPixelType(vol);
          break;
        case 'typewriter':
          this._synthTypewriter(vol);
          break;
        case 'custom':
          void this._playCustom('typing', vol);
          break;
        case 'off':
          break;
      }
    } catch (_) {
      /* suppress to avoid interrupting typing */
    }
  }

  playTaskDoneSound(isPreview = false): void {
    const cfg = this.config();
    if (!isPreview && cfg.taskDoneSound === 'off') return;

    // Fade out any still-playing typing grain so the two don't overlap.
    this._fadeOutTypingSound();

    const vol = cfg.volume * (isPreview ? 0.7 : 1);
    try {
      this._resumeCtx();
      switch (cfg.taskDoneSound) {
        case 'crumple':
          this._synthCrumple(vol);
          break;
        case 'sword':
          this._synthSword(vol);
          break;
        case 'pixel':
          this._synthPixelDone(vol);
          break;
        case 'chime':
          this._synthChime(vol);
          break;
        case 'custom':
          void this._playCustom('taskDone', vol);
          break;
        case 'off':
          break;
      }
    } catch (_) {
      /* suppress */
    }
  }

  async saveCustomSound(slot: 'typing' | 'taskDone', file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    delete this._customBuffers[slot];
    const db = await this._openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(arrayBuffer, slot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async removeCustomSound(slot: 'typing' | 'taskDone'): Promise<void> {
    delete this._customBuffers[slot];
    const db = await this._openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(slot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── SYNTHESIZERS ──────────────────────────────────────────────────────────

  /**
   * Pencil on paper: granular playback — a short random 60-90 ms grain from
   * a random position in the real recording, with slight pitch variation.
   * Falls back to synthesis only while the file is still loading.
   */
  private _synthPencil(vol: number): void {
    if (this._pencilBuffer) {
      this._playPencilGrain(vol);
    } else {
      // File still loading — use fallback synthesis immediately, then set the
      // buffer for subsequent keypresses.
      this._synthPencilFallback(vol);
      void getAudioBuffer(PENCIL_PATH)
        .then((buf) => {
          this._pencilBuffer = buf;
        })
        .catch(() => {
          /* will keep using synthesis fallback */
        });
    }
  }

  private _playPencilGrain(vol: number): void {
    const buf = this._pencilBuffer;
    if (!buf) return;
    try {
      const ctx = this._ctx;
      const grainDur = 0.06 + Math.random() * 0.03; // 60–90 ms
      const maxOffset = Math.max(0, buf.duration - grainDur - 0.05);
      const offset = Math.random() * maxOffset;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 0.93 + Math.random() * 0.14; // ±7% pitch

      const gn = ctx.createGain();
      const now = ctx.currentTime;
      gn.gain.setValueAtTime(0, now);
      gn.gain.linearRampToValueAtTime(vol * 1.0, now + 0.006); // fast attack
      gn.gain.setValueAtTime(vol * 1.0, now + grainDur - 0.012);
      gn.gain.linearRampToValueAtTime(0, now + grainDur); // soft release

      src.connect(gn);
      gn.connect(ctx.destination);
      src.start(now, offset, grainDur);

      this._activeTypingGain = gn;
    } catch (_) {}
  }

  /** Fallback when the recording file hasn't loaded yet */
  private _synthPencilFallback(vol: number): void {
    const ctx = this._ctx;
    const dur = 0.07;
    const noise = this._noiseSource(dur);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 800 + Math.random() * 400;
    hp.Q.value = 0.05;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2500 + Math.random() * 500;
    lp.Q.value = 0.05;

    const gn = ctx.createGain();
    const now = ctx.currentTime;
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(vol * 0.18, now + 0.006);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(hp);
    hp.connect(lp);
    lp.connect(gn);
    gn.connect(ctx.destination);
    noise.start(now);

    this._activeTypingGain = gn;
  }

  /** Ballpoint pen: slightly softer and lower than pencil */
  private _synthPen(vol: number): void {
    const ctx = this._ctx;
    const dur = 0.045 + Math.random() * 0.02;
    const noise = this._noiseSource(dur);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900 + Math.random() * 400;
    lp.Q.value = 0.05;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300 + Math.random() * 150;
    hp.Q.value = 0.05;

    const gn = ctx.createGain();
    const now = ctx.currentTime;
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(vol * 0.12, now + 0.004);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(lp);
    lp.connect(hp);
    hp.connect(gn);
    gn.connect(ctx.destination);
    noise.start(now);

    this._activeTypingGain = gn;
  }

  /** Pixel / 8-bit: short square wave blip */
  private _synthPixelType(vol: number): void {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 260 + Math.random() * 130;

    const gn = ctx.createGain();
    const now = ctx.currentTime;
    gn.gain.setValueAtTime(vol * 0.06, now);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gn);
    gn.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);

    this._activeTypingGain = gn;
  }

  /** Typewriter: mechanical high-frequency clack */
  private _synthTypewriter(vol: number): void {
    const ctx = this._ctx;
    const dur = 0.05 + Math.random() * 0.02;
    const noise = this._noiseSource(dur);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4000 + Math.random() * 1500;
    lp.Q.value = 0.05;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800 + Math.random() * 1000;
    hp.Q.value = 0.05;

    const gn = ctx.createGain();
    const now = ctx.currentTime;
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(vol * 0.18, now + 0.004);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(lp);
    lp.connect(hp);
    hp.connect(gn);
    gn.connect(ctx.destination);
    noise.start(now);

    this._activeTypingGain = gn;
  }

  /**
   * Paper crumple: plays the full real recording from start with slight pitch
   * variation. Falls back to multi-burst synthesis while the file loads.
   */
  private _synthCrumple(vol: number): void {
    if (this._crumpleBuffer) {
      this._playCrumpleFromFile(vol);
    } else {
      this._synthCrumpleFallback(vol);
      void getAudioBuffer(CRUMPLE_PATH)
        .then((buf) => {
          this._crumpleBuffer = buf;
        })
        .catch(() => {
          /* keep using synthesis */
        });
    }
  }

  private _playCrumpleFromFile(vol: number): void {
    const buf = this._crumpleBuffer;
    if (!buf) return;
    try {
      const ctx = this._ctx;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 0.9 + Math.random() * 0.2; // ±10% pitch

      const gn = ctx.createGain();
      gn.gain.value = vol * 1.4; // slight boost — crumple is quiet

      src.connect(gn);
      gn.connect(ctx.destination);
      src.start(ctx.currentTime);

      src.onended = () => {
        src.disconnect();
        gn.disconnect();
      };
    } catch (_) {}
  }

  /** Synthesis fallback for crumple (multiple short noise bursts) */
  private _synthCrumpleFallback(vol: number): void {
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const numBursts = 8 + Math.floor(Math.random() * 5);
    const totalSpan = 0.65;
    for (let i = 0; i < numBursts; i++) {
      const offset = Math.max(
        0,
        (i / numBursts + (Math.random() * 0.14 - 0.07)) * totalSpan,
      );
      const burstDur = 0.055 + Math.random() * 0.09;
      const noise = this._noiseSource(burstDur);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 500 + Math.random() * 1000;
      lp.Q.value = 0.05;
      const gn = ctx.createGain();
      const t = now + offset;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(vol * 0.4 * (1 - i / numBursts), t + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + burstDur);
      noise.connect(lp);
      lp.connect(gn);
      gn.connect(ctx.destination);
      noise.start(t);
    }
  }

  /** Sword/vento swoosh: noise filtered high-to-low */
  private _synthSword(vol: number): void {
    const ctx = this._ctx;
    const dur = 0.32;
    const noise = this._noiseSource(dur);
    const now = ctx.currentTime;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.05;
    lp.frequency.setValueAtTime(5000, now);
    lp.frequency.exponentialRampToValueAtTime(300, now + dur);

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(vol * 0.35, now + 0.04);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(lp);
    lp.connect(gn);
    gn.connect(ctx.destination);
    noise.start(now);
  }

  /** Pixel done: 8-bit ascending arpeggio */
  private _synthPixelDone(vol: number): void {
    const ctx = this._ctx;
    const notes = [330, 392, 494, 659];
    const noteLen = 0.09;
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const t = now + i * noteLen;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(vol * 0.07, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + noteLen * 0.9);
      osc.connect(gn);
      gn.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteLen);
    });
  }

  /** Soft chime: clean sine tones with long decay */
  private _synthChime(vol: number): void {
    const ctx = this._ctx;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const t = now + i * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(vol * (i === 0 ? 0.22 : 0.12), t + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      osc.connect(gn);
      gn.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.77);
    });
  }

  // ── CUSTOM FILE PLAYBACK ──────────────────────────────────────────────────

  private async _playCustom(slot: 'typing' | 'taskDone', vol: number): Promise<void> {
    try {
      const ctx = this._ctx;
      let audioBuf = this._customBuffers[slot];
      if (!audioBuf) {
        const db = await this._openDB();
        const arrayBuf = await new Promise<ArrayBuffer | null>((res, rej) => {
          const tx = db.transaction(IDB_STORE, 'readonly');
          const req = tx.objectStore(IDB_STORE).get(slot);
          req.onsuccess = () => res(req.result ?? null);
          req.onerror = () => rej(req.error);
        });
        if (!arrayBuf) return;
        audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
        this._customBuffers[slot] = audioBuf;
      }
      const src = ctx.createBufferSource();
      src.buffer = audioBuf;
      const gn = ctx.createGain();
      gn.gain.value = vol;
      src.connect(gn);
      gn.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (_) {}
  }

  // ── UTILS ─────────────────────────────────────────────────────────────────

  /** Resume the single shared AudioContext if it was suspended. */
  private _resumeCtx(): void {
    const ctx = this._ctx;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  /** Fade out any currently-playing typing sound in ~15 ms */
  private _fadeOutTypingSound(): void {
    const gn = this._activeTypingGain;
    if (!gn) return;
    this._activeTypingGain = null;
    try {
      const ctx = this._ctx;
      const now = ctx.currentTime;
      gn.gain.cancelScheduledValues(now);
      gn.gain.setValueAtTime(gn.gain.value, now);
      gn.gain.linearRampToValueAtTime(0, now + 0.015);
    } catch (_) {}
  }

  private _noiseSource(duration: number): AudioBufferSourceNode {
    const ctx = this._ctx;
    const size = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  /** Eagerly fetch and decode both real-audio files so the first event is never silent. */
  private _preload(): void {
    void getAudioBuffer(PENCIL_PATH)
      .then((buf) => {
        this._pencilBuffer = buf;
      })
      .catch(() => {
        /* fallback synthesis will be used */
      });

    void getAudioBuffer(CRUMPLE_PATH)
      .then((buf) => {
        this._crumpleBuffer = buf;
      })
      .catch(() => {
        /* fallback synthesis will be used */
      });
  }

  private _openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private _loadConfig(): SoundConfig {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch (_) {}
    return { ...DEFAULT_CONFIG };
  }
}
