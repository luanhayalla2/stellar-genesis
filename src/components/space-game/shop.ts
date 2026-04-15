// Shop system for planet upgrades
export interface Upgrades {
  max_hp_bonus: number;
  damage_bonus: number;
  speed_bonus: number;
  shield_duration_bonus: number;
  drone_count: number;
  score_spent: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  field: keyof Omit<Upgrades, 'score_spent'>;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'hp', name: 'Blindagem', description: '+1 HP máximo', field: 'max_hp_bonus', maxLevel: 5, baseCost: 200, costMultiplier: 1.8, icon: '❤️' },
  { id: 'dmg', name: 'Laser Potente', description: '+1 dano por tiro', field: 'damage_bonus', maxLevel: 3, baseCost: 500, costMultiplier: 2.0, icon: '🔫' },
  { id: 'spd', name: 'Propulsor', description: '+15% velocidade', field: 'speed_bonus', maxLevel: 4, baseCost: 300, costMultiplier: 1.6, icon: '🚀' },
  { id: 'shd', name: 'Escudo+', description: '+3s duração escudo', field: 'shield_duration_bonus', maxLevel: 4, baseCost: 250, costMultiplier: 1.7, icon: '🛡️' },
  { id: 'drn', name: 'Drone', description: 'Drone de suporte autônomo', field: 'drone_count', maxLevel: 2, baseCost: 1500, costMultiplier: 3.0, icon: '🤖' },
];

export function getItemCost(item: ShopItem, currentLevel: number): number {
  return Math.round(item.baseCost * Math.pow(item.costMultiplier, currentLevel));
}

export function getItemLevel(upgrades: Upgrades, item: ShopItem): number {
  return upgrades[item.field];
}
