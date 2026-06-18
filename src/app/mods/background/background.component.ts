import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ModsService } from '../mods.service';

@Component({
  selector: 'mods-background',
  standalone: true,
  imports: [NgStyle],
  template: `
    @if (show()) {
      <div
        class="mod-bg"
        [ngStyle]="bgStyle()"
      ></div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        display: block;
      }
      .mod-bg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundComponent {
  private readonly _modsService = inject(ModsService);
  private readonly _bg = computed(() => this._modsService.config().background);

  readonly show = computed(() => this._bg().enabled);

  readonly bgStyle = computed((): Record<string, string> => {
    const bg = this._bg();
    if (bg.type === 'color') {
      return { background: bg.color, opacity: String(bg.opacity) };
    }
    // image
    const styles: Record<string, string> = {
      backgroundImage: `url("${bg.imageUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: String(bg.opacity),
    };
    if (bg.blur > 0) {
      styles['filter'] = `blur(${bg.blur}px)`;
    }
    return styles;
  });
}
