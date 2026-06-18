import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TrinketService } from '../trinket.service';
import { TrinketDef, RARITY_COLOR, RARITY_LABEL } from '../trinket.model';

@Component({
  selector: 'trinket-shelf',
  standalone: true,
  templateUrl: './trinket-shelf.component.html',
  styleUrls: ['./trinket-shelf.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, MatTooltip],
})
export class TrinketShelfComponent {
  private readonly _svc = inject(TrinketService);

  readonly allTrinkets = this._svc.allTrinkets;
  readonly unlockedIds = this._svc.unlockedIds;
  readonly totalDone = this._svc.totalDone;

  readonly selectedTrinket = signal<TrinketDef | null>(null);

  readonly nextMilestone = computed(() => {
    const done = this.totalDone();
    const next5 = Math.ceil((done + 1) / 5) * 5;
    return next5;
  });

  readonly progressToNext = computed(() => {
    const done = this.totalDone();
    return ((done % 5) / 5) * 100;
  });

  readonly unlockedCount = computed(() => this.unlockedIds().length);
  readonly totalCount = this.allTrinkets.length;

  isUnlocked(id: string): boolean {
    return this.unlockedIds().includes(id);
  }

  rarityColor(t: TrinketDef): string {
    return RARITY_COLOR[t.raridade];
  }

  rarityLabel(t: TrinketDef): string {
    return RARITY_LABEL[t.raridade];
  }

  previewSrc(t: TrinketDef): string {
    return `assets/trinkets/previews/${t.preview}`;
  }

  select(t: TrinketDef): void {
    if (!this.isUnlocked(t.id)) return;
    this.selectedTrinket.update((prev) => (prev?.id === t.id ? null : t));
  }
}
