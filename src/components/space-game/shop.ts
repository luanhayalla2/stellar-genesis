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
  weapon_equipped: string;
  weapons_owned: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  field: keyof Omit<Upgrades, 'score_spent' | 'ship_skin' | 'ships_owned' | 'weapon_equipped' | 'weapons_owned'>;
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

export type ShipShape = 'classic' | 'interceptor' | 'destroyer' | 'titan';

export interface ShipModel {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string; // primary HSL color for hull
  shape: ShipShape;
  // Passive bonuses applied while equipped
  bonusHp: number;
  bonusDamage: number;
  bonusSpeed: number; // multiplier extra (e.g. 0.1 = +10%)
}

export const SHIP_MODELS: ShipModel[] = [
  { id: 'default', name: 'Caça Padrão', description: 'A nave inicial. Equilibrada.', cost: 0, icon: '🛸', color: '180, 80%, 60%', shape: 'classic', bonusHp: 0, bonusDamage: 0, bonusSpeed: 0 },
  { id: 'interceptor', name: 'Interceptador', description: 'Esguia e veloz. +20% velocidade.', cost: 2500, icon: '✈️', color: '50, 90%, 60%', shape: 'interceptor', bonusHp: 0, bonusDamage: 0, bonusSpeed: 0.2 },
  { id: 'destroyer', name: 'Destruidor', description: 'Pesada e larga. +2 HP e +1 dano.', cost: 5000, icon: '🚀', color: '0, 80%, 55%', shape: 'destroyer', bonusHp: 2, bonusDamage: 1, bonusSpeed: -0.05 },
  { id: 'titan', name: 'Titã Galáctico', description: 'Lendária angular. +4 HP, +2 dano, +10% vel.', cost: 12000, icon: '👽', color: '280, 80%, 65%', shape: 'titan', bonusHp: 4, bonusDamage: 2, bonusSpeed: 0.1 },
];

// === WEAPONS ===
export type WeaponId = 'laser' | 'triple' | 'missile' | 'plasma';

export interface WeaponModel {
  id: WeaponId;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string;          // HSL "h, s%, l%"
  cooldown: number;       // frames between shots
  speed: number;          // projectile speed
  damage: number;         // base per-projectile damage
  life: number;           // projectile lifetime in frames
  homing?: boolean;       // missile homing
  size: number;           // visual size
}

export const WEAPONS: WeaponModel[] = [
  { id: 'laser',   name: 'Laser Padrão',  description: 'Tiro rápido e confiável.',                   cost: 0,    icon: '🔫', color: '120, 90%, 65%', cooldown: 8,  speed: 12,  damage: 1, life: 60, size: 12 },
  { id: 'triple',  name: 'Laser Triplo',  description: '3 feixes em leque. Mais cobertura.',         cost: 2000, icon: '🔱', color: '200, 95%, 65%', cooldown: 14, speed: 11,  damage: 1, life: 55, size: 11 },
  { id: 'missile', name: 'Mísseis Teleguiados', description: 'Lentos, mas perseguem alvos. +2 dano.', cost: 4500, icon: '🚀', color: '20, 90%, 60%',  cooldown: 24, speed: 6.5, damage: 3, life: 110, homing: true, size: 6 },
  { id: 'plasma',  name: 'Canhão de Plasma', description: 'Esfera devastadora. +4 dano.',            cost: 8000, icon: '💥', color: '300, 95%, 65%', cooldown: 32, speed: 8,   damage: 5, life: 80, size: 9 },
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

export function getEquippedWeapon(upgrades: Upgrades): WeaponModel {
  return WEAPONS.find(w => w.id === upgrades.weapon_equipped) ?? WEAPONS[0];
}
