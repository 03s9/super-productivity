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
import { SoundConfig, SoundService, TaskDoneSound, TypingSound } from '../sound.service';

interface SoundOption<T> {
  value: T;
  label: string;
  icon: string;
}

const TYPING_OPTIONS: SoundOption<TypingSound>[] = [
  { value: 'pencil', label: 'Lápis', icon: 'edit' },
  { value: 'pen', label: 'Blocos', icon: 'grid_view' },
  { value: 'pixel', label: 'Pixel / 8-bit', icon: 'gamepad' },
  { value: 'typewriter', label: 'Máquina de escrever', icon: 'keyboard' },
  { value: 'custom', label: 'Personalizado', icon: 'upload_file' },
  { value: 'off', label: 'Desligado', icon: 'volume_off' },
];

const DONE_OPTIONS: SoundOption<TaskDoneSound>[] = [
  { value: 'crumple', label: 'Papel amassado', icon: 'description' },
  { value: 'sword', label: 'Vento', icon: 'air' },
  { value: 'pixel', label: 'Pixel / 8-bit', icon: 'gamepad' },
  { value: 'chime', label: 'Chime suave', icon: 'music_note' },
  { value: 'custom', label: 'Personalizado', icon: 'upload_file' },
  { value: 'off', label: 'Desligado', icon: 'volume_off' },
];

@Component({
  selector: 'sound-settings-panel',
  templateUrl: './sound-settings-panel.component.html',
  styleUrls: ['./sound-settings-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    MatIcon,
    MatIconButton,
    MatButton,
    MatTooltip,
    MatSlider,
    MatSliderThumb,
  ],
})
export class SoundSettingsPanelComponent {
  readonly soundService = inject(SoundService);

  isOpen = signal(false);

  readonly typingOptions = TYPING_OPTIONS;
  readonly doneOptions = DONE_OPTIONS;

  readonly volume = computed(() => this.soundService.config().volume);
  readonly typingSound = computed(() => this.soundService.config().typingSound);
  readonly taskDoneSound = computed(() => this.soundService.config().taskDoneSound);

  hasCustomTyping = signal(false);
  hasCustomDone = signal(false);

  togglePanel(): void {
    this.isOpen.update((v) => !v);
  }

  setTypingSound(val: TypingSound): void {
    this._patch({ typingSound: val });
  }

  setTaskDoneSound(val: TaskDoneSound): void {
    this._patch({ taskDoneSound: val });
  }

  setVolume(val: number): void {
    this._patch({ volume: val });
  }

  previewTyping(): void {
    this.soundService.playTypingSound(true);
  }

  previewDone(): void {
    this.soundService.playTaskDoneSound(true);
  }

  async importTyping(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await this.soundService.saveCustomSound('typing', file);
    this.hasCustomTyping.set(true);
    this._patch({ typingSound: 'custom' });
    (event.target as HTMLInputElement).value = '';
  }

  async importDone(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await this.soundService.saveCustomSound('taskDone', file);
    this.hasCustomDone.set(true);
    this._patch({ taskDoneSound: 'custom' });
    (event.target as HTMLInputElement).value = '';
  }

  private _patch(partial: Partial<SoundConfig>): void {
    this.soundService.saveConfig({ ...this.soundService.config(), ...partial });
  }
}
