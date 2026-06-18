import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  NgZone,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ModsService, StampItem } from '../mods.service';

@Component({
  selector: 'mods-stamps',
  standalone: true,
  imports: [],
  template: `
    @if (visible()) {
      @for (stamp of stamps(); track stamp.id) {
        <img
          class="stamp-item"
          [src]="stamp.url"
          [style.left.px]="stamp.x"
          [style.top.px]="stamp.y"
          [style.width.px]="shapeW(stamp)"
          [style.height.px]="shapeH(stamp)"
          [style.borderRadius]="shapeR(stamp)"
          (pointerdown)="onDown($event, stamp)"
          (error)="onImgError($event)"
          alt=""
          draggable="false"
        />
      }
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 150;
      }
      .stamp-item {
        position: absolute;
        object-fit: cover;
        cursor: grab;
        pointer-events: all;
        touch-action: none;
        user-select: none;
        transition:
          filter 0.15s,
          transform 0.1s;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));

        &:hover {
          transform: scale(1.05);
        }
        &:active {
          cursor: grabbing;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StampsComponent {
  private readonly _modsService = inject(ModsService);
  private readonly _ngZone = inject(NgZone);
  private readonly _doc = inject(DOCUMENT);

  readonly visible = computed(() => this._modsService.config().stamps.visible);
  readonly stamps = computed(() => this._modsService.config().stamps.items);

  private _drag: {
    stamp: StampItem;
    startPx: number;
    startPy: number;
    startX: number;
    startY: number;
    el: HTMLImageElement;
    moved: boolean;
    onMove: (e: PointerEvent) => void;
    onUp: (e: PointerEvent) => void;
  } | null = null;

  shapeW(stamp: StampItem): number {
    return stamp.shape === 'rect-h' ? Math.round(stamp.size * 1.6) : stamp.size;
  }

  shapeH(stamp: StampItem): number {
    return stamp.shape === 'rect-v' ? Math.round(stamp.size * 1.6) : stamp.size;
  }

  shapeR(stamp: StampItem): string {
    switch (stamp.shape) {
      case 'oval':
        return '50%';
      case 'rect-h':
      case 'rect-v':
        return '10px';
      default:
        return '6px';
    }
  }

  onDown(event: PointerEvent, stamp: StampItem): void {
    event.preventDefault();
    const el = event.currentTarget as HTMLImageElement;
    el.setPointerCapture(event.pointerId);

    const drag = {
      stamp,
      startPx: event.clientX,
      startPy: event.clientY,
      startX: stamp.x,
      startY: stamp.y,
      el,
      moved: false,
      onMove: (e: PointerEvent) => this._onMove(e),
      onUp: (e: PointerEvent) => this._onUp(e),
    };
    this._drag = drag;

    this._ngZone.runOutsideAngular(() => {
      el.addEventListener('pointermove', drag.onMove);
      el.addEventListener('pointerup', drag.onUp);
      el.addEventListener('pointercancel', drag.onUp);
    });
  }

  private _onMove(event: PointerEvent): void {
    const d = this._drag;
    if (!d) return;
    const dx = event.clientX - d.startPx;
    const dy = event.clientY - d.startPy;
    if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    d.moved = true;
    const w = this.shapeW(d.stamp);
    const h = this.shapeH(d.stamp);
    const x = Math.max(0, Math.min(window.innerWidth - w, d.startX + dx));
    const y = Math.max(0, Math.min(window.innerHeight - h, d.startY + dy));
    d.el.style.left = `${x}px`;
    d.el.style.top = `${y}px`;
    d.stamp = { ...d.stamp, x, y };
  }

  private _onUp(event: PointerEvent): void {
    const d = this._drag;
    if (!d) return;
    d.el.removeEventListener('pointermove', d.onMove);
    d.el.removeEventListener('pointerup', d.onUp);
    d.el.removeEventListener('pointercancel', d.onUp);
    this._drag = null;

    if (d.moved) {
      this._ngZone.run(() => {
        this._modsService.moveStamp(d.stamp.id, d.stamp.x, d.stamp.y);
      });
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.opacity = '0.2';
  }
}
