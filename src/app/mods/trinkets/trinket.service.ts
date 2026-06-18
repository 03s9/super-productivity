import { inject, Injectable, signal, computed } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { filter, tap } from 'rxjs/operators';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import {
  TrinketDef,
  TrinketRarity,
  TrinketState,
  PendingUnlock,
  PlacedCompanion,
  RARITY_COINS,
} from './trinket.model';
import TRINKETS_DATA from '../../../assets/trinkets/trinkets.json';

const LS_KEY = 'sp-trinkets';

const COMMON_WEIGHTS: Record<TrinketRarity, number> = {
  comum: 60,
  incomum: 30,
  raro: 9,
  epico: 1,
};

const RARE_WEIGHTS: Record<TrinketRarity, number> = {
  comum: 15,
  incomum: 40,
  raro: 35,
  epico: 10,
};

const ALL_TRINKETS: TrinketDef[] = TRINKETS_DATA as TrinketDef[];

@Injectable({ providedIn: 'root' })
export class TrinketService {
  private readonly _actions$ = inject(Actions);

  readonly allTrinkets: TrinketDef[] = ALL_TRINKETS;

  private readonly _state = signal<TrinketState>(this._load());

  readonly unlockedIds = computed(() => this._state().unlockedIds);
  readonly totalDone = computed(() => this._state().totalDone);
  readonly coins = computed(() => this._state().coins);
  readonly featuredId = computed(() => this._state().featuredId);
  readonly placedCompanions = computed(() => this._state().placedCompanions);

  readonly featuredPreview = computed(() => {
    const id = this._state().featuredId;
    if (!id) return '';
    const t = this.allTrinkets.find((x) => x.id === id);
    return t ? `assets/trinkets/previews/${t.preview}` : '';
  });

  readonly unlockedTrinkets = computed(() =>
    this.allTrinkets.filter((t) => this._state().unlockedIds.includes(t.id)),
  );

  readonly pendingUnlock = signal<PendingUnlock | null>(null);
  readonly shelfOpen = signal(false);

  constructor() {
    this._actions$
      .pipe(
        ofType(TaskSharedActions.updateTask),
        filter(({ task }) => !!task.changes['isDone']),
        tap(() => this._onTaskDone()),
      )
      .subscribe();
  }

  dismissPending(): void {
    this.pendingUnlock.set(null);
  }

  setFeatured(id: string): void {
    const state = this._state();
    const nextId = state.featuredId === id ? '' : id;
    this._save({ ...state, featuredId: nextId });
  }

  placeCompanion(trinketId: string): void {
    const state = this._state();
    if (state.placedCompanions.some((c) => c.trinketId === trinketId)) return;
    if (state.placedCompanions.length >= 6) return;
    this._save({
      ...state,
      placedCompanions: [...state.placedCompanions, { trinketId, x: 0.15, y: 0.75 }],
    });
  }

  removeCompanion(trinketId: string): void {
    const state = this._state();
    this._save({
      ...state,
      placedCompanions: state.placedCompanions.filter((c) => c.trinketId !== trinketId),
    });
  }

  updateCompanionPosition(trinketId: string, x: number, y: number): void {
    const state = this._state();
    this._save({
      ...state,
      placedCompanions: state.placedCompanions.map((c) =>
        c.trinketId === trinketId ? { ...c, x, y } : c,
      ),
    });
  }

  private _onTaskDone(): void {
    const state = this._state();
    const newTotal = state.totalDone + 1;

    let weights: Record<TrinketRarity, number> | null = null;
    if (newTotal % 10 === 0) {
      weights = RARE_WEIGHTS;
    } else if (newTotal % 5 === 0) {
      weights = COMMON_WEIGHTS;
    }

    const base: TrinketState = { ...state, totalDone: newTotal };

    if (!weights) {
      this._save(base);
      return;
    }

    const drawn = this._drawFromAll(weights);
    const isDuplicate = state.unlockedIds.includes(drawn.id);
    const coinsEarned = isDuplicate ? RARITY_COINS[drawn.raridade] : 0;

    this._save({
      ...base,
      unlockedIds: isDuplicate ? state.unlockedIds : [...state.unlockedIds, drawn.id],
      coins: state.coins + coinsEarned,
    });

    this.pendingUnlock.set({ trinket: drawn, isDuplicate, coinsEarned });
  }

  private _drawFromAll(weights: Record<TrinketRarity, number>): TrinketDef {
    const order: TrinketRarity[] = ['epico', 'raro', 'incomum', 'comum'];
    const totalWeight = order.reduce((s, r) => s + weights[r], 0);
    let roll = Math.random() * totalWeight;
    for (const r of order) {
      roll -= weights[r];
      if (roll <= 0) {
        const pool = this.allTrinkets.filter((t) => t.raridade === r);
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    const fallback = this.allTrinkets.filter((t) => t.raridade === 'comum');
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  private _save(state: TrinketState): void {
    this._state.set(state);
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  private _load(): TrinketState {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<TrinketState>;
        return {
          unlockedIds: saved.unlockedIds ?? [],
          totalDone: saved.totalDone ?? 0,
          coins: saved.coins ?? 0,
          featuredId: saved.featuredId ?? '',
          placedCompanions: (saved.placedCompanions ?? []) as PlacedCompanion[],
        };
      }
    } catch (_) {
      /* ignore */
    }
    return {
      unlockedIds: [],
      totalDone: 0,
      coins: 0,
      featuredId: '',
      placedCompanions: [],
    };
  }
}
