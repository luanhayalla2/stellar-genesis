// Shop system for planet upgrades
export interface Upgrades {
  max_hp_bonus: number;
  damage_bonus: number;
  speed_bonus: number;
  shield_duration_bonus: number;
  drone_count: number;
  score_spent: number;
  ship_skin: string;
  ships_owned: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  field: keyof Omit<Upgrades, 'score_spent' | 'ship_skin' | 'ships_owned'>;
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

export interface ShipModel {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string; // primary HSL color for hull
  // Passive bonuses applied while equipped
  bonusHp: number;
  bonusDamage: number;
  bonusSpeed: number; // multiplier extra (e.g. 0.1 = +10%)
}

export const SHIP_MODELS: ShipModel[] = [
  { id: 'default', name: 'Caça Padrão', description: 'A nave inicial. Equilibrada.', cost: 0, icon: '🛸', color: '180, 80%, 60%', bonusHp: 0, bonusDamage: 0, bonusSpeed: 0 },
  { id: 'interceptor', name: 'Interceptador', description: 'Rápida e ágil. +20% velocidade.', cost: 2500, icon: '✈️', color: '50, 90%, 60%', bonusHp: 0, bonusDamage: 0, bonusSpeed: 0.2 },
  { id: 'destroyer', name: 'Destruidor', description: 'Pesada. +2 HP e +1 dano.', cost: 5000, icon: '🚀', color: '0, 80%, 55%', bonusHp: 2, bonusDamage: 1, bonusSpeed: -0.05 },
  { id: 'titan', name: 'Titã Galáctico', description: 'Lendária. +4 HP, +2 dano, +10% vel.', cost: 12000, icon: '👽', color: '280, 80%, 65%', bonusHp: 4, bonusDamage: 2, bonusSpeed: 0.1 },
];

export function getItemCost(item: ShopItem, currentLevel: number): number {
  return Math.round(item.baseCost * Math.pow(item.costMultiplier, currentLevel));
}

export function getItemLevel(upgrades: Upgrades, item: ShopItem): number {
  return upgrades[item.field];
}

export function getEquippedShip(upgrades: Upgrades): ShipModel {
  return SHIP_MODELS.find(s => s.id === upgrades.ship_skin) ?? SHIP_MODELS[0];
}
