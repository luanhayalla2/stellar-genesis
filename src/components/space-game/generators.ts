import { Planet, Nebula, BlackHole } from './types';
import { PLANET_NAMES, BIOMES, RESOURCES_LIST, DESCRIPTIONS } from './constants';

export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generatePlanets(): Planet[] {
  const planets: Planet[] = [];
  const rng = seededRandom(42);
  for (let i = 0; i < 20; i++) {
    const numRes = Math.floor(rng() * 3) + 1;
    const resources: string[] = [];
    for (let r = 0; r < numRes; r++) {
      resources.push(RESOURCES_LIST[Math.floor(rng() * RESOURCES_LIST.length)]);
    }
    planets.push({
      x: (rng() - 0.5) * 12000,
      y: (rng() - 0.5) * 12000,
      radius: rng() * 80 + 40,
      hue: rng() * 360,
      sat: rng() * 40 + 30,
      light: rng() * 25 + 25,
      rings: rng() > 0.6,
      ringHue: rng() * 360,
      name: PLANET_NAMES[i],
      biome: BIOMES[Math.floor(rng() * BIOMES.length)],
      resources,
      description: DESCRIPTIONS[Math.floor(rng() * DESCRIPTIONS.length)],
    });
  }
  return planets;
}

export function generateAsteroidShape(): number[] {
  const verts: number[] = [];
  const n = Math.floor(Math.random() * 4) + 6;
  for (let i = 0; i < n; i++) {
    verts.push(0.6 + Math.random() * 0.4);
  }
  return verts;
}

export function generateNebulas(): Nebula[] {
  const nebulas: Nebula[] = [];
  const rng = seededRandom(123);
  for (let i = 0; i < 12; i++) {
    nebulas.push({
      x: (rng() - 0.5) * 15000,
      y: (rng() - 0.5) * 15000,
      radius: rng() * 1000 + 800,
      hue: rng() * 60 + 240, // Purple-Blue range
      alpha: rng() * 0.15 + 0.05,
    });
  }
  return nebulas;
}

export function generateBlackHoles(): BlackHole[] {
  const blackHoles: BlackHole[] = [];
  const rng = seededRandom(999);
  for (let i = 0; i < 5; i++) {
    blackHoles.push({
      x: (rng() - 0.5) * 20000,
      y: (rng() - 0.5) * 20000,
      radius: rng() * 50 + 40,
    });
  }
  return blackHoles;
}
