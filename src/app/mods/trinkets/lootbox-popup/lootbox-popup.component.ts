import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { TrinketService } from '../trinket.service';
import { RARITY_COLOR, RARITY_GLOW, RARITY_LABEL } from '../trinket.model';

@Component({
  selector: 'trinket-lootbox-popup',
  standalone: true,
  templateUrl: './lootbox-popup.component.html',
  styleUrls: ['./lootbox-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, MatButton, MatIconButton],
})
export class LootboxPopupComponent {
  private readonly _svc = inject(TrinketService);

  private readonly _pending = this._svc.pendingUnlock;

  readonly trinket = computed(() => this._pending()?.trinket ?? null);
  readonly isDuplicate = computed(() => this._pending()?.isDuplicate ?? false);
  readonly coinsEarned = computed(() => this._pending()?.coinsEarned ?? 0);

  readonly rarityLabel = computed(() => {
    const t = this.trinket();
    return t ? RARITY_LABEL[t.raridade] : '';
  });

  readonly rarityColor = computed(() => {
    const t = this.trinket();
    return t ? RARITY_COLOR[t.raridade] : '#fff';
  });

  readonly rarityGlow = computed(() => {
    const t = this.trinket();
    return t ? RARITY_GLOW[t.raridade] : 'transparent';
  });

  readonly previewSrc = computed(() => {
    const t = this.trinket();
    return t ? `assets/trinkets/previews/${t.preview}` : '';
  });

  dismiss(): void {
    this._svc.dismissPending();
  }
}
