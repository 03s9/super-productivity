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

export interface TrinketState {
  unlockedIds: string[];
  totalDone: number;
  coins: number;
  featuredId: string;
}

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
