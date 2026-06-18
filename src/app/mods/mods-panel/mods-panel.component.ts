import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ModsService, CursorPreset, ParticleMode, StampShape } from '../mods.service';
import { TrinketService } from '../trinkets/trinket.service';
import { TrinketShelfComponent } from '../trinkets/trinket-shelf/trinket-shelf.component';
import { LootboxPopupComponent } from '../trinkets/lootbox-popup/lootbox-popup.component';

type Tab = 'cursor' | 'bg' | 'particles' | 'stamps' | 'trinkets';

interface Opt<T> {
  value: T;
  label: string;
  icon: string;
}

const CURSOR_OPTS: Opt<CursorPreset>[] = [
  { value: 'default', label: 'Padrão', icon: 'arrow_selector_tool' },
  { value: 'anime-arrow', label: 'Anime →', icon: 'near_me' },
  { value: 'heart', label: 'Coração', icon: 'favorite' },
  { value: 'star', label: 'Estrela', icon: 'star' },
  { value: 'wand', label: 'Varinha', icon: 'auto_fix_high' },
  { value: 'mummy', label: 'Mummy', icon: 'front_hand' },
  { value: 'custom', label: 'Arquivo', icon: 'upload_file' },
];

const PARTICLE_OPTS: Opt<ParticleMode>[] = [
  { value: 'stars', label: 'Estrelas', icon: 'star' },
  { value: 'petals', label: 'Pétalas', icon: 'local_florist' },
  { value: 'snow', label: 'Neve', icon: 'ac_unit' },
  { value: 'bubbles', label: 'Bolhas', icon: 'bubble_chart' },
  { value: 'confetti', label: 'Confete', icon: 'celebration' },
  { value: 'matrix', label: 'Matrix', icon: 'terminal' },
  { value: 'fireflies', label: 'Vagalumes', icon: 'nights_stay' },
  { value: 'sparkles', label: 'Brilhos', icon: 'auto_awesome' },
];

@Component({
  selector: 'mods-panel',
  standalone: true,
  templateUrl: './mods-panel.component.html',
  styleUrls: ['./mods-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatIcon,
    MatIconButton,
    MatButton,
    MatTooltip,
    MatSlider,
    MatSliderThumb,
    MatSlideToggle,
    TrinketShelfComponent,
    LootboxPopupComponent,
  ],
})
export class ModsPanelComponent {
  private readonly _svc = inject(ModsService);
  readonly trinketSvc = inject(TrinketService);

  isOpen = signal(false);
  activeTab = signal<Tab>('cursor');

  readonly cfg = this._svc.config;
  readonly cursor = computed(() => this.cfg().cursor);
  readonly bg = computed(() => this.cfg().background);
  readonly particles = computed(() => this.cfg().particles);
  readonly stamps = computed(() => this.cfg().stamps);

  readonly cursorOpts = CURSOR_OPTS;
  readonly particleOpts = PARTICLE_OPTS;

  newBgUrl = signal('');

  togglePanel(): void {
    this.isOpen.update((v) => !v);
  }
  resetAll(): void {
    this._svc.resetAll();
  }

  // ── Cursor ──────────────────────────────────────────────
  setCursorEnabled(v: boolean): void {
    this._svc.patchCursor({ enabled: v });
  }
  setCursorPreset(v: CursorPreset): void {
    this._svc.patchCursor({ preset: v });
  }
  setCursorSize(v: number): void {
    this._svc.patchCursor({ size: v });
  }
  setCursorOpacity(v: number): void {
    this._svc.patchCursor({ opacity: v });
  }

  importCursorFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () =>
      this._svc.patchCursor({ customUrl: r.result as string, preset: 'custom' });
    r.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  importPointerFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => this._svc.patchCursor({ customPointerUrl: r.result as string });
    r.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  // ── Fundo ────────────────────────────────────────────────
  setBgEnabled(v: boolean): void {
    this._svc.patchBackground({ enabled: v });
  }
  setBgType(v: 'color' | 'image'): void {
    this._svc.patchBackground({ type: v });
  }
  setBgColor(e: Event): void {
    this._svc.patchBackground({ color: (e.target as HTMLInputElement).value });
  }
  setBgOpacity(v: number): void {
    this._svc.patchBackground({ opacity: v });
  }
  setBgBlur(v: number): void {
    this._svc.patchBackground({ blur: v });
  }

  applyBgUrl(): void {
    const url = this.newBgUrl().trim();
    if (!url) return;
    this._svc.patchBackground({ imageUrl: url, type: 'image' });
  }

  importBgFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () =>
      this._svc.patchBackground({ imageUrl: r.result as string, type: 'image' });
    r.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  // ── Partículas ───────────────────────────────────────────
  setParticlesEnabled(v: boolean): void {
    this._svc.patchParticles({ enabled: v });
  }
  setParticleMode(v: ParticleMode): void {
    this._svc.patchParticles({ mode: v });
  }
  setParticleCount(v: number): void {
    this._svc.patchParticles({ count: v });
  }
  setParticleSpeed(v: number): void {
    this._svc.patchParticles({ speed: v });
  }
  setParticleOpacity(v: number): void {
    this._svc.patchParticles({ opacity: v });
  }
  setParticleColor(e: Event): void {
    this._svc.patchParticles({ color: (e.target as HTMLInputElement).value });
  }

  // ── Stamps ───────────────────────────────────────────────
  setStampsVisible(v: boolean): void {
    this._svc.patchStamps({ visible: v });
  }
  setStampSize(v: number): void {
    this._svc.patchStamps({ size: v });
  }
  setStampShape(id: string, shape: StampShape): void {
    this._svc.setStampShape(id, shape);
  }

  importStampFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => this._svc.addStamp(r.result as string);
    r.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeStamp(id: string): void {
    this._svc.removeStamp(id);
  }
}
