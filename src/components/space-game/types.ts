export interface Star {
  x: number; y: number; z: number; size: number; brightness: number;
}
export interface Nebula {
  x: number; y: number; radius: number; hue: number; alpha: number;
}
export interface Ship {
  x: number; y: number; angle: number; vx: number; vy: number;
  thrust: boolean; boosting: boolean;
  hp: number; maxHp: number;
  shield: boolean; shieldTimer: number;
  doubleShot: boolean; doubleShotTimer: number;
  speedBoost: boolean; speedBoostTimer: number;
  invincible: number;
}
export interface Drone {
  x: number; y: number; vx: number; vy: number; angle: number; cooldown: number;
}
export interface EnemyShip {
  x: number; y: number; vx: number; vy: number; hp: number; maxHp: number;
  angle: number; shootCooldown: number;
}
export interface BlackHole {
  x: number; y: number; radius: number;
}
export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; size: number; hue: number;
}
export interface Laser {
  x: number; y: number; vx: number; vy: number; life: number;
  weapon?: 'laser' | 'triple' | 'missile' | 'plasma';
  damage?: number;
  homing?: boolean;
  speed?: number;
}
export interface Planet {
  x: number; y: number; radius: number;
  hue: number; sat: number; light: number;
  rings: boolean; ringHue: number;
  name: string;
  biome: string;
  resources: string[];
  description: string;
}
export interface Asteroid {
  x: number; y: number; vx: number; vy: number;
  radius: number; hp: number; maxHp: number;
  vertices: number[]; rotation: number; rotSpeed: number;
  isBoss?: boolean;
}
export interface Boss {
  x: number; y: number; vx: number; vy: number;
  radius: number; hp: number; maxHp: number;
  rotation: number; rotSpeed: number;
  shootCooldown: number;
  phase: number; // visual phase for animation
  type: 'mothership' | 'destroyer' | 'titan';
  name: string;
}
export interface BossLaser {
  x: number; y: number; vx: number; vy: number; life: number;
}
export interface Explosion {
  x: number; y: number; age?: number; particles: { x: number; y: number; vx: number; vy: number; life: number; hue: number; size: number }[];
}
export interface PowerUp {
  x: number; y: number;
  type: 'shield' | 'doubleShot' | 'speed';
  life: number;
  angle: number;
}
export interface WaveState {
  wave: number;
  asteroidsRemaining: number;
  asteroidsSpawned: number;
  asteroidsToSpawn: number;
  bossActive: boolean;
  bossDefeated: boolean;
  waveComplete: boolean;
  waveTimer: number; // countdown between waves
  asteroidsDestroyed: number; // total across all waves
}
export interface GameState {
  phase: 'playing' | 'gameover' | 'exploring' | 'leaderboard';
  exploringPlanet: Planet | null;
}
