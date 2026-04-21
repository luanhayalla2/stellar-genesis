---
name: Upgrades, Ships & Weapons Shop
description: Spend score on planets for stat upgrades, ship purchases, and weapons (laser, triple, missile, plasma)
type: feature
---
Players spend lifetime score at planet shops. Three sections:
- **Stat upgrades** (HP, damage, speed, shield, drones) — leveled, costs scale.
- **Ship hangar** — 4 models with distinct silhouettes (classic, interceptor, destroyer, titan) and passive bonuses; rendered via shape switch in `drawShip`.
- **Weapons arsenal** — `laser` (default), `triple` (3-shot fan), `missile` (homing, +dmg, slower), `plasma` (heavy orb, big dmg). Defined in `WEAPONS` in `shop.ts`. Per-projectile cooldown/speed/damage/life. Missile homing handled in laser update loop.

Persistence: `user_upgrades` table includes `ship_skin`, `ships_owned`, `weapon_equipped`, `weapons_owned`.
Navigation: ↑↓ select, ENTER buy/equip, ESC takeoff.
