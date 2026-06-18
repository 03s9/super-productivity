export type TrinketRarity = 'comum' | 'incomum' | 'raro' | 'epico';

export interface TrinketDef {
  id: string;
  nome: string;
  descricao: string;
  modelo: string;
  preview: string;
  raridade: TrinketRarity;
  fonte: { origem: string; licenca: string; url: string };
}

export interface PlacedCompanion {
  trinketId: string;
  x: number; // viewport fraction 0–1 (left → right)
  y: number; // viewport fraction 0–1 (top → bottom)
}

export interface TrinketState {
  unlockedIds: string[];
  totalDone: number;
  coins: number;
  featuredId: string;
  placedCompanions: PlacedCompanion[];
}

// Keyed by trinket id — overrides the neutral gray from the shared Kenney atlas.
// Map avoids naming-convention lint errors that object literals with hyphenated keys would trigger.
export const ANIMAL_COLORS = new Map<string, number>([
  ['animal-cat', 0xe8975a],
  ['animal-dog', 0xc4813a],
  ['animal-bunny', 0xf0ddc8],
  ['animal-chick', 0xf5d84a],
  ['animal-pig', 0xf0a8a0],
  ['animal-fish', 0x5ab4f0],
  ['animal-bee', 0xf5c832],
  ['animal-parrot', 0x45c832],
  ['animal-penguin', 0x404848],
  ['animal-fox', 0xe07030],
  ['animal-beaver', 0x8a5c2c],
  ['animal-koala', 0x909090],
  ['animal-cow', 0xe8e4d8],
  ['animal-monkey', 0xc48030],
  ['animal-deer', 0xc8924a],
  ['animal-panda', 0xe8e8e8],
  ['animal-crab', 0xe83030],
  ['animal-caterpillar', 0x60c040],
  ['animal-hog', 0xe0a0c0],
  ['animal-polar', 0xf0f0f8],
  ['animal-elephant', 0x8090a8],
  ['animal-giraffe', 0xe8c850],
  ['animal-lion', 0xe0a840],
  ['animal-tiger', 0xe87030],
]);

export interface PendingUnlock {
  trinket: TrinketDef;
  isDuplicate: boolean;
  coinsEarned: number;
}

export const RARITY_COINS: Record<TrinketRarity, number> = {
  comum: 10,
  incomum: 25,
  raro: 50,
  epico: 100,
};

export const RARITY_LABEL: Record<TrinketRarity, string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  epico: 'Épico',
};

export const RARITY_COLOR: Record<TrinketRarity, string> = {
  comum: '#9e9e9e',
  incomum: '#4caf50',
  raro: '#2196f3',
  epico: '#9c27b0',
};

export const RARITY_GLOW: Record<TrinketRarity, string> = {
  comum: 'rgba(158,158,158,0.4)',
  incomum: 'rgba(76,175,80,0.5)',
  raro: 'rgba(33,150,243,0.6)',
  epico: 'rgba(156,39,176,0.7)',
};
