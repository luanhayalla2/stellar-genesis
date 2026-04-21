import { Star, Nebula, Ship, Drone, EnemyShip, BlackHole, Particle, Laser, Asteroid, Explosion, PowerUp, Planet, GameState, Boss, BossLaser, WaveState } from './types';
import { seededRandom } from './generators';
import { LANDING_DIST } from './constants';
import { Upgrades, SHOP_ITEMS, SHIP_MODELS, WEAPONS, getItemCost, getItemLevel, ShipShape } from './shop';
import type { RemotePlayer } from './multiplayer';

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], camX: number, camY: number, w: number, h: number, frame: number) {
  for (const star of stars) {
    const sx = ((star.x - camX / star.z) % (w * 2) + w * 3) % (w * 2) - w * 0.5;
    const sy = ((star.y - camY / star.z) % (h * 2) + h * 3) % (h * 2) - h * 0.5;
    const twinkle = Math.sin(frame * 0.03 + star.x) * 0.2 + 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(200, 60%, 85%, ${star.brightness * twinkle})`;
    ctx.fill();
  }
}

export function drawNebulas(ctx: CanvasRenderingContext2D, nebulas: Nebula[], camX: number, camY: number, w: number, h: number, frame: number) {
  for (const n of nebulas) {
    // Parallax: nebulas move slower (30% speed)
    const px = n.x - camX * 0.3, py = n.y - camY * 0.3;
    
    // Bounds check
    if (px < -n.radius || px > w + n.radius || py < -n.radius || py > h + n.radius) continue;

    const g = ctx.createRadialGradient(px, py, 0, px, py, n.radius);
    g.addColorStop(0, `hsla(${n.hue}, 80%, 30%, ${n.alpha})`);
    g.addColorStop(0.5, `hsla(${n.hue + 20}, 70%, 20%, ${n.alpha * 0.4})`);
    g.addColorStop(1, `hsla(${n.hue}, 60%, 10%, 0)`);
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, n.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawPlanets(ctx: CanvasRenderingContext2D, planets: Planet[], camX: number, camY: number, w: number, h: number, ship: Ship) {
  for (const p of planets) {
    const px = p.x - camX, py = p.y - camY;
    if (px < -p.radius * 2 - 100 || px > w + p.radius * 2 + 100 || py < -p.radius * 2 - 100 || py > h + p.radius * 2 + 100) continue;

    const glow = ctx.createRadialGradient(px, py, p.radius * 0.8, px, py, p.radius * 1.6);
    glow.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.light + 20}%, 0.08)`);
    glow.addColorStop(1, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, p.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(px - p.radius * 0.3, py - p.radius * 0.3, p.radius * 0.1, px, py, p.radius);
    grad.addColorStop(0, `hsl(${p.hue}, ${p.sat + 10}%, ${p.light + 15}%)`);
    grad.addColorStop(0.7, `hsl(${p.hue}, ${p.sat}%, ${p.light}%)`);
    grad.addColorStop(1, `hsl(${p.hue}, ${p.sat - 10}%, ${p.light - 10}%)`);
    ctx.beginPath();
    ctx.arc(px, py, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    ctx.clip();
    for (let i = 0; i < 5; i++) {
      const rng = seededRandom(p.hue * 100 + i);
      const cx2 = px + (rng() - 0.5) * p.radius * 1.4;
      const cy2 = py + (rng() - 0.5) * p.radius * 1.4;
      const cr = rng() * p.radius * 0.4 + p.radius * 0.1;
      ctx.beginPath();
      ctx.arc(cx2, cy2, cr, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue + 20}, ${p.sat - 10}%, ${p.light - 8}%, 0.3)`;
      ctx.fill();
    }
    ctx.restore();

    if (p.rings) {
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.6, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${p.ringHue}, 50%, 60%, 0.4)`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.9, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${p.ringHue}, 40%, 50%, 0.25)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    const dist = Math.sqrt((ship.x - p.x) ** 2 + (ship.y - p.y) ** 2);
    if (dist < 600) {
      const alpha = Math.max(0, 1 - dist / 600);
      ctx.fillStyle = `hsla(${p.hue}, 60%, 75%, ${alpha * 0.8})`;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.name, px, py - p.radius - 18);
      ctx.fillText(`${Math.round(dist)} u`, px, py - p.radius - 6);
      if (dist < LANDING_DIST + p.radius) {
        ctx.fillStyle = `hsla(120, 80%, 60%, ${0.6 + Math.sin(Date.now() * 0.005) * 0.4})`;
        ctx.font = "bold 14px monospace";
        ctx.fillText("[ L ] POUSAR", px, py + p.radius + 24);
      }
      ctx.textAlign = "left";
    }
  }
}

export function drawAsteroids(ctx: CanvasRenderingContext2D, asteroids: Asteroid[], camX: number, camY: number, w: number, h: number) {
  for (const a of asteroids) {
    const ax = a.x - camX, ay = a.y - camY;
    if (ax < -50 || ax > w + 50 || ay < -50 || ay > h + 50) continue;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a.rotation);
    ctx.beginPath();
    const n = a.vertices.length;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const r = a.radius * a.vertices[i];
      if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
      else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath();
    const dmg = 1 - a.hp / a.maxHp;
    ctx.fillStyle = `hsl(30, ${10 + dmg * 20}%, ${22 + dmg * 10}%)`;
    ctx.fill();
    ctx.strokeStyle = `hsla(35, 20%, 45%, 0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    if (a.hp < a.maxHp) {
      const bw = a.radius * 2;
      ctx.fillStyle = "hsla(0, 0%, 20%, 0.6)";
      ctx.fillRect(ax - bw / 2, ay - a.radius - 10, bw, 3);
      ctx.fillStyle = "hsla(0, 70%, 50%, 0.8)";
      ctx.fillRect(ax - bw / 2, ay - a.radius - 10, bw * (a.hp / a.maxHp), 3);
    }
  }
}

export function drawBlackHoles(ctx: CanvasRenderingContext2D, blackHoles: BlackHole[], camX: number, camY: number, w: number, h: number, frame: number) {
  for (const bh of blackHoles) {
    const bx = bh.x - camX, by = bh.y - camY;
    if (bx < -bh.radius * 2 || bx > w + bh.radius * 2 || by < -bh.radius * 2 || by > h + bh.radius * 2) continue;
    
    // Accretion disk
    const pulse = 1 + Math.sin(frame * 0.05) * 0.05;
    const g = ctx.createRadialGradient(bx, by, bh.radius * 0.8, bx, by, bh.radius * 2.5);
    g.addColorStop(0, "rgba(255, 100, 0, 0.4)");
    g.addColorStop(0.2, "rgba(100, 0, 255, 0.3)");
    g.addColorStop(0.5, "rgba(50, 0, 100, 0.1)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, bh.radius * 2.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Event Horizon
    ctx.beginPath();
    ctx.arc(bx, by, bh.radius, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "white";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

export function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, camX: number, camY: number, frame: number) {
  const bx = boss.x - camX, by = boss.y - camY;
  const g = ctx.createRadialGradient(bx, by, boss.radius * 0.5, bx, by, boss.radius * 2);
  g.addColorStop(0, `hsla(0, 80%, 50%, 0.1)`);
  g.addColorStop(1, `hsla(0, 80%, 50%, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(bx, by, boss.radius * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(boss.rotation);
  const sides = boss.type === 'mothership' ? 6 : boss.type === 'destroyer' ? 8 : 5;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2;
    const wobble = 1 + Math.sin(frame * 0.05 + i) * 0.05;
    const r = boss.radius * wobble;
    if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  ctx.closePath();
  const bossGrad = ctx.createRadialGradient(0, 0, boss.radius * 0.2, 0, 0, boss.radius);
  bossGrad.addColorStop(0, `hsl(0, 60%, 35%)`);
  bossGrad.addColorStop(0.6, `hsl(350, 50%, 25%)`);
  bossGrad.addColorStop(1, `hsl(340, 40%, 15%)`);
  ctx.fillStyle = bossGrad;
  ctx.fill();
  ctx.strokeStyle = `hsla(0, 70%, 55%, 0.8)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  const pulse = Math.sin(frame * 0.08) * 3 + 8;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(0, 90%, 60%, ${0.6 + Math.sin(frame * 0.1) * 0.3})`;
  ctx.fill();
  ctx.restore();
  const bw = boss.radius * 3;
  ctx.fillStyle = "hsla(0, 0%, 15%, 0.7)";
  ctx.fillRect(bx - bw / 2, by - boss.radius - 20, bw, 6);
  const hpRatio = boss.hp / boss.maxHp;
  ctx.fillStyle = `hsla(${hpRatio * 120}, 70%, 50%, 0.9)`;
  ctx.fillRect(bx - bw / 2, by - boss.radius - 20, bw * hpRatio, 6);
  ctx.strokeStyle = "hsla(0, 50%, 40%, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx - bw / 2, by - boss.radius - 20, bw, 6);
  ctx.fillStyle = "hsla(0, 80%, 65%, 0.9)";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(boss.name, bx, by - boss.radius - 26);
  ctx.textAlign = "left";
}

export function drawEnemyShips(ctx: CanvasRenderingContext2D, enemies: EnemyShip[], camX: number, camY: number) {
  for (const e of enemies) {
    const ex = e.x - camX, ey = e.y - camY;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(e.angle + Math.PI / 2);
    
    // Body
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-8, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fillStyle = "#331111"; // Dark red/brown
    ctx.fill();
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Core
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ff0000";
    ctx.fill();
    ctx.restore();
  }
}

export function drawBossLasers(ctx: CanvasRenderingContext2D, lasers: BossLaser[], camX: number, camY: number) {
  for (const l of lasers) {
    const lx = l.x - camX, ly = l.y - camY;
    const angle = Math.atan2(l.vy, l.vx);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.shadowColor = "hsla(0, 100%, 60%, 0.8)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, 0);
    ctx.strokeStyle = "hsla(0, 90%, 55%, 0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = "hsla(0, 100%, 80%, 1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function drawExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[], camX: number, camY: number) {
  for (const e of explosions) {
    const ex = e.x - camX, ey = e.y - camY;
    
    if (e.age !== undefined && e.age < 20) {
      ctx.beginPath();
      ctx.arc(ex, ey, e.age * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(30, 100%, 70%, ${(20 - e.age) / 20})`;
      ctx.lineWidth = 2 + (20 - e.age) / 5;
      ctx.stroke();
    }

    for (const p of e.particles) {
      const pex = p.x - camX, pey = p.y - camY;
      ctx.beginPath();
      ctx.arc(pex, pey, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 90%, 55%, ${p.life})`;
      if (p.life > 0.7) { // Sparkle effect for fresh particles
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

export function drawLasers(ctx: CanvasRenderingContext2D, lasers: Laser[], camX: number, camY: number) {
  for (const l of lasers) {
    const lx = l.x - camX, ly = l.y - camY;
    const angle = Math.atan2(l.vy, l.vx);
    const weapon = l.weapon ?? 'laser';

    if (weapon === 'plasma') {
      // Big glowing magenta orb
      ctx.save();
      ctx.translate(lx, ly);
      const pulse = 0.85 + Math.sin(Date.now() * 0.02) * 0.15;
      const r = 9 * pulse;
      ctx.shadowColor = "hsla(300, 100%, 65%, 0.95)";
      ctx.shadowBlur = 22;
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
      g.addColorStop(0, "hsla(300, 100%, 95%, 1)");
      g.addColorStop(0.4, "hsla(300, 95%, 70%, 0.9)");
      g.addColorStop(1, "hsla(280, 90%, 40%, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      continue;
    }

    if (weapon === 'missile') {
      // Slim missile body with flame trail
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      // Trail
      ctx.shadowColor = "hsla(20, 100%, 60%, 0.9)";
      ctx.shadowBlur = 14;
      const tg = ctx.createLinearGradient(-18, 0, 0, 0);
      tg.addColorStop(0, "hsla(40, 100%, 70%, 0)");
      tg.addColorStop(1, "hsla(20, 100%, 60%, 0.9)");
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(-18, -2);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-18, 2);
      ctx.closePath();
      ctx.fill();
      // Body
      ctx.shadowBlur = 0;
      ctx.fillStyle = "hsl(0, 0%, 85%)";
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -2.5);
      ctx.lineTo(-4, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "hsl(20, 90%, 55%)";
      ctx.fillRect(-4, -2.5, 2, 5);
      ctx.restore();
      continue;
    }

    // Default laser / triple → colored beam
    const hue = weapon === 'triple' ? 200 : 120;
    const len = 12;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, 0);
    ctx.strokeStyle = `hsla(${hue}, 90%, 65%, 0.9)`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = `hsla(${hue}, 100%, 90%, 1)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camX: number, camY: number) {
  for (const p of particles) {
    const px = p.x - camX, py = p.y - camY;
    ctx.beginPath();
    ctx.arc(px, py, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.life * 0.8})`;
    ctx.fill();
  }
}

export function drawPowerUps(ctx: CanvasRenderingContext2D, powerUps: PowerUp[], camX: number, camY: number, frame: number) {
  for (const pu of powerUps) {
    const px = pu.x - camX, py = pu.y - camY;
    const pulse = Math.sin(frame * 0.08) * 3 + 10;
    let hue = 0, label = '';
    switch (pu.type) {
      case 'shield': hue = 200; label = '🛡'; break;
      case 'doubleShot': hue = 0; label = '🔫'; break;
      case 'speed': hue = 50; label = '⚡'; break;
    }
    const g = ctx.createRadialGradient(px, py, 2, px, py, pulse + 5);
    g.addColorStop(0, `hsla(${hue}, 90%, 65%, 0.6)`);
    g.addColorStop(1, `hsla(${hue}, 90%, 65%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pulse + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, 0.9)`;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, px, py + 5);
    ctx.textAlign = "left";
  }
}

export function drawDrones(ctx: CanvasRenderingContext2D, drones: Drone[], camX: number, camY: number, frame: number) {
  for (const d of drones) {
    const dx = d.x - camX, dy = d.y - camY;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(d.angle + Math.PI / 2);
    
    // Glow
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
    glow.addColorStop(0, "rgba(0, 255, 255, 0.4)");
    glow.addColorStop(1, "rgba(0, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-5, 5);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fillStyle = "#112233";
    ctx.fill();
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
}

export function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, w: number, h: number, hullColor: string = "200, 85%, 55%", shape: ShipShape = 'classic') {
  const sx = w / 2, sy = h / 2;
  if (ship.invincible > 0 && Math.floor(ship.invincible / 4) % 2 === 0) return;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ship.angle + Math.PI / 2);

  // Engine Flame
  if (ship.thrust) {
    const flameH = (ship.boosting ? 45 : 25) + Math.sin(Date.now() * 0.05) * 5;
    const flameW = (ship.boosting ? 12 : 8) + Math.sin(Date.now() * 0.03) * 2;
    const fg = ctx.createLinearGradient(0, 10, 0, 10 + flameH);
    const hue = ship.boosting ? 260 : 200;
    fg.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.8)`);
    fg.addColorStop(0.4, `hsla(${hue}, 80%, 50%, 0.4)`);
    fg.addColorStop(1, `hsla(${hue}, 70%, 30%, 0)`);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(-flameW / 2, 10);
    ctx.quadraticCurveTo(0, 10 + flameH * 1.2, flameW / 2, 10);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-flameW / 4, 10);
    ctx.quadraticCurveTo(0, 10 + flameH * 0.6, flameW / 4, 10);
    ctx.fillStyle = `hsla(${hue}, 100%, 90%, 0.6)`;
    ctx.fill();
    ctx.restore();
  }

  if (ship.shield) {
    const sg = ctx.createRadialGradient(0, 0, 15, 0, 0, 32);
    sg.addColorStop(0, "hsla(200, 90%, 60%, 0.05)");
    sg.addColorStop(0.8, "hsla(200, 90%, 60%, 0.15)");
    sg.addColorStop(1, "hsla(200, 90%, 60%, 0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "hsla(200, 90%, 65%, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const shipGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, 34);
  shipGlow.addColorStop(0, `hsla(${hullColor}, 0.18)`);
  shipGlow.addColorStop(1, `hsla(${hullColor}, 0)`);
  ctx.fillStyle = shipGlow;
  ctx.fillRect(-34, -34, 68, 68);

  const hullFill = "hsl(210, 30%, 18%)";
  const hullStroke = `hsl(${hullColor})`;
  ctx.fillStyle = hullFill;
  ctx.strokeStyle = hullStroke;
  ctx.lineWidth = 1.5;

  if (shape === 'interceptor') {
    // Long, sleek arrow with swept wings
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-14, 12);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-3, 14);
    ctx.lineTo(3, 14);
    ctx.lineTo(6, 8);
    ctx.lineTo(14, 12);
    ctx.lineTo(4, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Twin engines
    ctx.fillStyle = `hsl(${hullColor})`;
    ctx.fillRect(-9, 10, 3, 4);
    ctx.fillRect(6, 10, 3, 4);
    // Cockpit
    ctx.beginPath();
    ctx.arc(0, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'destroyer') {
    // Wide, bulky hull with side cannons
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-16, 6);
    ctx.lineTo(-14, 14);
    ctx.lineTo(-4, 12);
    ctx.lineTo(0, 16);
    ctx.lineTo(4, 12);
    ctx.lineTo(14, 14);
    ctx.lineTo(16, 6);
    ctx.lineTo(8, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Side cannons
    ctx.fillStyle = `hsl(${hullColor})`;
    ctx.fillRect(-13, -4, 3, 10);
    ctx.fillRect(10, -4, 3, 10);
    // Cockpit (rectangular)
    ctx.fillRect(-3, -8, 6, 6);
  } else if (shape === 'titan') {
    // Alien diamond with crystalline wings
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-10, 6);
    ctx.lineTo(-12, 16);
    ctx.lineTo(0, 10);
    ctx.lineTo(12, 16);
    ctx.lineTo(10, 6);
    ctx.lineTo(18, 0);
    ctx.lineTo(6, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Glowing core
    const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, 8);
    cg.addColorStop(0, `hsla(${hullColor}, 1)`);
    cg.addColorStop(1, `hsla(${hullColor}, 0)`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    // Wing tip lights
    ctx.fillStyle = `hsl(${hullColor})`;
    ctx.beginPath(); ctx.arc(-18, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, 0, 2, 0, Math.PI * 2); ctx.fill();
  } else {
    // Classic triangle
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-4, 8);
    ctx.lineTo(0, 10);
    ctx.lineTo(4, 8);
    ctx.lineTo(12, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hullColor})`;
    ctx.fill();
  }

  ctx.restore();
}

export function drawRemotePlayers(ctx: CanvasRenderingContext2D, players: RemotePlayer[], camX: number, camY: number) {
  for (const p of players) {
    const px = p.x - camX, py = p.y - camY;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.angle + Math.PI / 2);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-10, 11);
    ctx.lineTo(0, 7);
    ctx.lineTo(10, 11);
    ctx.closePath();
    ctx.fillStyle = "hsl(280, 50%, 30%)";
    ctx.fill();
    ctx.strokeStyle = "hsl(280, 70%, 55%)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -3, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(280, 70%, 55%)";
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Name tag
    ctx.fillStyle = "hsla(280, 60%, 70%, 0.7)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(p.name, px, py - 22);
    ctx.textAlign = "left";
  }
}

export function drawHUD(ctx: CanvasRenderingContext2D, ship: Ship, score: number, w: number, h: number, planets: Planet[], gameState: GameState, waveState: WaveState, onlinePlayers: number) {
  const speed = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
  ctx.fillStyle = "hsla(200, 60%, 70%, 0.7)";
  ctx.font = "13px monospace";
  ctx.fillText(`SPEED: ${speed.toFixed(1)}`, 20, 30);
  ctx.fillText(`POS: ${Math.round(ship.x)}, ${Math.round(ship.y)}`, 20, 48);
  ctx.fillText(`SCORE: ${score}`, 20, 66);

  // HP bar
  const hpW = 120, hpH = 8, hpX = 20, hpY = 78;
  ctx.fillStyle = "hsla(0, 0%, 20%, 0.6)";
  ctx.fillRect(hpX, hpY, hpW, hpH);
  const hpRatio = ship.hp / ship.maxHp;
  const hpHue = hpRatio > 0.5 ? 120 : hpRatio > 0.25 ? 40 : 0;
  ctx.fillStyle = `hsla(${hpHue}, 70%, 50%, 0.9)`;
  ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH);
  ctx.strokeStyle = "hsla(200, 50%, 40%, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(hpX, hpY, hpW, hpH);
  ctx.fillStyle = "hsla(200, 60%, 70%, 0.7)";
  ctx.fillText(`HP: ${ship.hp}/${ship.maxHp}`, hpX + hpW + 8, hpY + 8);

  // Wave info
  ctx.fillStyle = "hsla(50, 80%, 65%, 0.9)";
  ctx.font = "bold 14px monospace";
  ctx.fillText(`ONDA ${waveState.wave}`, 20, 108);
  ctx.font = "12px monospace";
  ctx.fillStyle = "hsla(200, 60%, 70%, 0.7)";
  const remaining = waveState.asteroidsToSpawn - waveState.asteroidsSpawned + (waveState.bossActive ? 1 : 0);
  ctx.fillText(`Inimigos: ${remaining > 0 ? remaining : 0}`, 20, 124);
  ctx.fillText(`Destruídos: ${waveState.asteroidsDestroyed}`, 20, 140);

  // Online players
  if (onlinePlayers > 0) {
    ctx.fillStyle = "hsla(280, 60%, 65%, 0.8)";
    ctx.fillText(`🌐 Online: ${onlinePlayers + 1}`, 20, 156);
  }

  // Wave transition
  if (waveState.waveComplete && waveState.waveTimer > 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "hsla(50, 90%, 65%, 0.9)";
    ctx.font = "bold 28px monospace";
    ctx.fillText(`ONDA ${waveState.wave + 1} EM ${Math.ceil(waveState.waveTimer / 60)}...`, w / 2, h / 2 - 60);
    if (waveState.wave % 3 === 0) {
      ctx.fillStyle = "hsla(0, 80%, 60%, 0.9)";
      ctx.font = "bold 20px monospace";
      ctx.fillText("⚠ BOSS PRÓXIMO! ⚠", w / 2, h / 2 - 25);
    }
    ctx.textAlign = "left";
  }

  // Active power-ups
  let puY = onlinePlayers > 0 ? 174 : 158;
  if (ship.shield) {
    ctx.fillStyle = "hsla(200, 80%, 65%, 0.8)";
    ctx.font = "12px monospace";
    ctx.fillText(`🛡 ESCUDO ${Math.ceil(ship.shieldTimer / 60)}s`, 20, puY);
    puY += 18;
  }
  if (ship.doubleShot) {
    ctx.fillStyle = "hsla(0, 80%, 65%, 0.8)";
    ctx.font = "12px monospace";
    ctx.fillText(`🔫 TIRO TRIPLO ${Math.ceil(ship.doubleShotTimer / 60)}s`, 20, puY);
    puY += 18;
  }
  if (ship.speedBoost) {
    ctx.fillStyle = "hsla(50, 80%, 65%, 0.8)";
    ctx.font = "12px monospace";
    ctx.fillText(`⚡ VELOCIDADE ${Math.ceil(ship.speedBoostTimer / 60)}s`, 20, puY);
    puY += 18;
  }
  if (ship.boosting && ship.thrust) {
    ctx.fillStyle = "hsla(260, 80%, 65%, 0.9)";
    ctx.font = "12px monospace";
    ctx.fillText("⚡ BOOST", 20, puY);
  }

  // Minimap (Sci-Fi Radar)
  const mmRadius = 65;
  const mmX = w - mmRadius - 20;
  const mmY = mmRadius + 20;
  const mmScale = 6000;
  
  ctx.save();
  // Base background (Glassmorphism circle)
  ctx.beginPath();
  ctx.arc(mmX, mmY, mmRadius, 0, Math.PI * 2);
  ctx.fillStyle = "hsla(220, 30%, 8%, 0.7)";
  ctx.fill();
  
  // Outer glowing ring
  ctx.lineWidth = 2;
  ctx.strokeStyle = "hsla(200, 80%, 50%, 0.6)";
  ctx.stroke();
  
  // Inner rings
  ctx.beginPath();
  ctx.arc(mmX, mmY, mmRadius * 0.66, 0, Math.PI * 2);
  ctx.strokeStyle = "hsla(200, 80%, 50%, 0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(mmX, mmY, mmRadius * 0.33, 0, Math.PI * 2);
  ctx.strokeStyle = "hsla(200, 80%, 50%, 0.15)";
  ctx.stroke();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(mmX - mmRadius, mmY);
  ctx.lineTo(mmX + mmRadius, mmY);
  ctx.moveTo(mmX, mmY - mmRadius);
  ctx.lineTo(mmX, mmY + mmRadius);
  ctx.strokeStyle = "hsla(200, 80%, 60%, 0.2)";
  ctx.stroke();

  // Clip content inside the minimap
  ctx.beginPath();
  ctx.arc(mmX, mmY, mmRadius, 0, Math.PI * 2);
  ctx.clip();

  // Moving Grid
  const gridSpacing = 20;
  const offsetX = -((ship.x / mmScale) * mmRadius * 2) % gridSpacing;
  const offsetY = -((ship.y / mmScale) * mmRadius * 2) % gridSpacing;
  
  ctx.beginPath();
  ctx.strokeStyle = "hsla(200, 50%, 40%, 0.2)";
  ctx.lineWidth = 1;
  for (let x = -gridSpacing * 2; x <= mmRadius * 2 + gridSpacing * 2; x += gridSpacing) {
    ctx.moveTo(mmX - mmRadius + x + offsetX, mmY - mmRadius);
    ctx.lineTo(mmX - mmRadius + x + offsetX, mmY + mmRadius);
  }
  for (let y = -gridSpacing * 2; y <= mmRadius * 2 + gridSpacing * 2; y += gridSpacing) {
    ctx.moveTo(mmX - mmRadius, mmY - mmRadius + y + offsetY);
    ctx.lineTo(mmX + mmRadius, mmY - mmRadius + y + offsetY);
  }
  ctx.stroke();

  // Draw Planets
  for (const p of planets) {
    const relX = (p.x - ship.x) / mmScale;
    const relY = (p.y - ship.y) / mmScale;
    const mx = mmX + relX * mmRadius * 2; 
    const my = mmY + relY * mmRadius * 2;
    
    // Only draw if reasonably close to radar bounds
    const distFromCenter = Math.sqrt((mx - mmX) ** 2 + (my - mmY) ** 2);
    if (distFromCenter < mmRadius + 15) {
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(3, p.radius / 25), 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light + 20}%, 0.95)`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsl(${p.hue}, ${p.sat}%, ${p.light + 10}%)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Radar Sweep Animation
  const sweepAngle = (Date.now() / 800) % (Math.PI * 2);
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(mmX, mmY);
    ctx.arc(mmX, mmY, mmRadius, sweepAngle - (i * 0.04), sweepAngle - ((i - 1) * 0.04));
    ctx.fillStyle = `hsla(180, 100%, 60%, ${0.25 - i * 0.012})`;
    ctx.fill();
  }
  // Sweep leader line
  ctx.beginPath();
  ctx.moveTo(mmX, mmY);
  ctx.lineTo(mmX + Math.cos(sweepAngle) * mmRadius, mmY + Math.sin(sweepAngle) * mmRadius);
  ctx.strokeStyle = "hsla(180, 100%, 70%, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ship (Player marker)
  ctx.translate(mmX, mmY);
  ctx.rotate(ship.angle + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, 4);
  ctx.lineTo(0, 2);
  ctx.lineTo(4, 4);
  ctx.closePath();
  ctx.fillStyle = "hsla(140, 100%, 60%, 1)";
  ctx.shadowBlur = 6;
  ctx.shadowColor = "hsla(140, 100%, 50%, 0.8)";
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();

  // Controls
  ctx.fillStyle = "hsla(200, 40%, 60%, 0.4)";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("WASD mover · SHIFT boost · ESPAÇO atirar · L pousar · TAB ranking", w / 2, h - 20);
  ctx.textAlign = "left";
}

export function drawGameOver(ctx: CanvasRenderingContext2D, w: number, h: number, score: number, wave: number, asteroidsDestroyed: number) {
  ctx.fillStyle = "hsla(0, 0%, 0%, 0.75)";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";

  // Brand name
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = "hsla(200, 60%, 55%, 0.5)";
  ctx.fillText("✦ AppInfinity Galaxy ✦", w / 2, h / 2 - 95);

  ctx.fillStyle = "hsla(0, 80%, 55%, 1)";
  ctx.font = "bold 48px monospace";
  ctx.fillText("GAME OVER", w / 2, h / 2 - 55);
  ctx.fillStyle = "hsla(200, 60%, 70%, 0.9)";
  ctx.font = "24px monospace";
  ctx.fillText(`Score: ${score}`, w / 2, h / 2 - 8);
  ctx.fillStyle = "hsla(50, 60%, 65%, 0.8)";
  ctx.font = "18px monospace";
  ctx.fillText(`Onda: ${wave} · Asteroides: ${asteroidsDestroyed}`, w / 2, h / 2 + 28);
  ctx.fillStyle = "hsla(200, 50%, 60%, 0.7)";
  ctx.font = "14px monospace";
  ctx.fillText("Score salvo automaticamente!", w / 2, h / 2 + 58);
  ctx.fillStyle = "hsla(120, 60%, 60%, 0.8)";
  ctx.font = "18px monospace";
  ctx.fillText("Pressione ENTER para recomeçar", w / 2, h / 2 + 93);
  ctx.textAlign = "left";
}

export function drawExploration(ctx: CanvasRenderingContext2D, w: number, h: number, planet: Planet, upgrades: Upgrades, availableScore: number, selectedItem: number) {
  ctx.fillStyle = "hsla(0, 0%, 0%, 0.85)";
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h * 0.22;
  const r = 60;
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, `hsl(${planet.hue}, ${planet.sat + 10}%, ${planet.light + 15}%)`);
  grad.addColorStop(1, `hsl(${planet.hue}, ${planet.sat - 10}%, ${planet.light - 10}%)`);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = `hsla(${planet.hue}, 60%, 75%, 1)`;
  ctx.font = "bold 28px monospace";
  ctx.fillText(planet.name, cx, cy + r + 30);

  ctx.fillStyle = "hsla(200, 50%, 70%, 0.8)";
  ctx.font = "14px monospace";
  ctx.fillText(`Bioma: ${planet.biome}`, cx, cy + r + 52);
  ctx.fillText(`Recursos: ${planet.resources.join(", ")}`, cx, cy + r + 70);
  ctx.fillStyle = "hsla(200, 40%, 60%, 0.7)";
  ctx.font = "13px monospace";
  ctx.fillText(planet.description, cx, cy + r + 90);

  // === SHOP ===
  const shopY = cy + r + 120;
  ctx.fillStyle = "hsla(50, 80%, 65%, 0.9)";
  ctx.font = "bold 20px monospace";
  ctx.fillText("🏪 LOJA DE UPGRADES", cx, shopY);

  ctx.fillStyle = "hsla(200, 50%, 65%, 0.7)";
  ctx.font = "13px monospace";
  ctx.fillText(`Score disponível: ${availableScore}`, cx, shopY + 22);

  const itemStartY = shopY + 45;
  const itemH = 50;

  for (let i = 0; i < SHOP_ITEMS.length; i++) {
    const item = SHOP_ITEMS[i];
    const level = getItemLevel(upgrades, item);
    const cost = getItemCost(item, level);
    const maxed = level >= item.maxLevel;
    const canBuy = !maxed && availableScore >= cost;
    const y = itemStartY + i * itemH;
    const isSelected = i === selectedItem;

    // Background
    const boxW = 400;
    ctx.fillStyle = isSelected ? "hsla(200, 40%, 20%, 0.6)" : "hsla(200, 20%, 12%, 0.4)";
    ctx.fillRect(cx - boxW / 2, y - 16, boxW, itemH - 6);
    if (isSelected) {
      ctx.strokeStyle = "hsla(200, 70%, 55%, 0.7)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - boxW / 2, y - 16, boxW, itemH - 6);
    }

    // Icon + name
    ctx.textAlign = "left";
    ctx.font = "15px monospace";
    ctx.fillStyle = maxed ? "hsla(120, 50%, 55%, 0.8)" : canBuy ? "hsla(200, 60%, 75%, 0.9)" : "hsla(0, 40%, 55%, 0.7)";
    ctx.fillText(`${item.icon} ${item.name}`, cx - boxW / 2 + 10, y + 2);

    // Level
    ctx.font = "12px monospace";
    ctx.fillStyle = "hsla(200, 50%, 60%, 0.7)";
    const levelText = maxed ? "MAX" : `Nv.${level}→${level + 1}`;
    ctx.fillText(levelText, cx - boxW / 2 + 10, y + 20);

    // Description
    ctx.fillText(item.description, cx - 20, y + 2);

    // Cost
    ctx.textAlign = "right";
    ctx.fillStyle = maxed ? "hsla(120, 50%, 55%, 0.6)" : canBuy ? "hsla(50, 80%, 65%, 0.9)" : "hsla(0, 50%, 50%, 0.7)";
    ctx.font = "13px monospace";
    ctx.fillText(maxed ? "✓" : `${cost} pts`, cx + boxW / 2 - 10, y + 2);
  }

  // === SHIPS HANGAR ===
  const shipsTitleY = itemStartY + SHOP_ITEMS.length * itemH + 20;
  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(280, 80%, 70%, 0.9)";
  ctx.font = "bold 18px monospace";
  ctx.fillText("🛸 HANGAR DE NAVES", cx, shipsTitleY);

  const shipStartY = shipsTitleY + 25;
  const shipH = 44;
  for (let j = 0; j < SHIP_MODELS.length; j++) {
    const model = SHIP_MODELS[j];
    const owned = upgrades.ships_owned.includes(model.id);
    const equipped = upgrades.ship_skin === model.id;
    const canBuy = !owned && availableScore >= model.cost;
    const y = shipStartY + j * shipH;
    const idx = SHOP_ITEMS.length + j;
    const isSelected = idx === selectedItem;

    const boxW = 460;
    ctx.fillStyle = isSelected ? "hsla(280, 40%, 22%, 0.7)" : "hsla(280, 20%, 12%, 0.4)";
    ctx.fillRect(cx - boxW / 2, y - 16, boxW, shipH - 4);
    if (isSelected) {
      ctx.strokeStyle = `hsla(${model.color}, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - boxW / 2, y - 16, boxW, shipH - 4);
    }

    ctx.textAlign = "left";
    ctx.font = "14px monospace";
    ctx.fillStyle = equipped ? "hsla(140, 70%, 65%, 0.95)" : owned ? `hsla(${model.color}, 0.9)` : canBuy ? "hsla(50, 80%, 70%, 0.9)" : "hsla(0, 30%, 55%, 0.7)";
    ctx.fillText(`${model.icon} ${model.name}`, cx - boxW / 2 + 10, y + 2);

    ctx.font = "11px monospace";
    ctx.fillStyle = "hsla(200, 40%, 60%, 0.7)";
    ctx.fillText(model.description, cx - boxW / 2 + 10, y + 18);

    ctx.textAlign = "right";
    ctx.font = "13px monospace";
    if (equipped) {
      ctx.fillStyle = "hsla(140, 70%, 65%, 0.95)";
      ctx.fillText("EQUIPADA", cx + boxW / 2 - 10, y + 2);
    } else if (owned) {
      ctx.fillStyle = "hsla(200, 60%, 70%, 0.85)";
      ctx.fillText("Equipar (ENTER)", cx + boxW / 2 - 10, y + 2);
    } else {
      ctx.fillStyle = canBuy ? "hsla(50, 80%, 65%, 0.9)" : "hsla(0, 50%, 50%, 0.7)";
      ctx.fillText(`${model.cost} pts`, cx + boxW / 2 - 10, y + 2);
    }
  }

  // === WEAPONS HANGAR ===
  const weaponsTitleY = shipStartY + SHIP_MODELS.length * shipH + 20;
  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(120, 80%, 70%, 0.9)";
  ctx.font = "bold 18px monospace";
  ctx.fillText("⚔️ ARSENAL DE ARMAS", cx, weaponsTitleY);

  const weaponStartY = weaponsTitleY + 25;
  const weaponH = 44;
  for (let k = 0; k < WEAPONS.length; k++) {
    const wpn = WEAPONS[k];
    const owned = upgrades.weapons_owned.includes(wpn.id);
    const equipped = upgrades.weapon_equipped === wpn.id;
    const canBuy = !owned && availableScore >= wpn.cost;
    const y = weaponStartY + k * weaponH;
    const idx = SHOP_ITEMS.length + SHIP_MODELS.length + k;
    const isSelected = idx === selectedItem;

    const boxW = 460;
    ctx.fillStyle = isSelected ? "hsla(120, 35%, 18%, 0.7)" : "hsla(120, 20%, 10%, 0.4)";
    ctx.fillRect(cx - boxW / 2, y - 16, boxW, weaponH - 4);
    if (isSelected) {
      ctx.strokeStyle = `hsla(${wpn.color}, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - boxW / 2, y - 16, boxW, weaponH - 4);
    }

    ctx.textAlign = "left";
    ctx.font = "14px monospace";
    ctx.fillStyle = equipped ? "hsla(140, 70%, 65%, 0.95)" : owned ? `hsla(${wpn.color}, 0.95)` : canBuy ? "hsla(50, 80%, 70%, 0.9)" : "hsla(0, 30%, 55%, 0.7)";
    ctx.fillText(`${wpn.icon} ${wpn.name}`, cx - boxW / 2 + 10, y + 2);

    ctx.font = "11px monospace";
    ctx.fillStyle = "hsla(200, 40%, 60%, 0.7)";
    ctx.fillText(wpn.description, cx - boxW / 2 + 10, y + 18);

    ctx.textAlign = "right";
    ctx.font = "13px monospace";
    if (equipped) {
      ctx.fillStyle = "hsla(140, 70%, 65%, 0.95)";
      ctx.fillText("EQUIPADA", cx + boxW / 2 - 10, y + 2);
    } else if (owned) {
      ctx.fillStyle = "hsla(200, 60%, 70%, 0.85)";
      ctx.fillText("Equipar (ENTER)", cx + boxW / 2 - 10, y + 2);
    } else {
      ctx.fillStyle = canBuy ? "hsla(50, 80%, 65%, 0.9)" : "hsla(0, 50%, 50%, 0.7)";
      ctx.fillText(`${wpn.cost} pts`, cx + boxW / 2 - 10, y + 2);
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(200, 40%, 60%, 0.5)";
  ctx.font = "12px monospace";
  ctx.fillText("↑↓ selecionar · ENTER comprar/equipar · ESC decolar", cx, weaponStartY + WEAPONS.length * weaponH + 20);
  ctx.textAlign = "left";
}

export interface LeaderboardEntry {
  score: number;
  wave: number;
  asteroids_destroyed: number;
  email: string;
  created_at: string;
}

export function drawLeaderboard(ctx: CanvasRenderingContext2D, w: number, h: number, entries: LeaderboardEntry[]) {
  ctx.fillStyle = "hsla(0, 0%, 0%, 0.92)";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";

  // Brand
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "hsla(200, 60%, 55%, 0.45)";
  ctx.fillText("✦ AppInfinity Galaxy ✦", w / 2, 28);

  ctx.fillStyle = "hsla(50, 80%, 65%, 1)";
  ctx.font = "bold 36px monospace";
  ctx.fillText("🏆 RANKING GLOBAL", w / 2, 66);
  ctx.fillStyle = "hsla(200, 50%, 50%, 0.4)";
  ctx.fillRect(w / 2 - 320, 85, 640, 1);

  const startY = 110;
  const rowH = 32;

  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "hsla(200, 60%, 65%, 0.8)";
  ctx.textAlign = "left";
  ctx.fillText("#", w / 2 - 280, startY);
  ctx.fillText("PILOTO", w / 2 - 240, startY);
  ctx.textAlign = "right";
  ctx.fillText("SCORE", w / 2 + 80, startY);
  ctx.fillText("ONDA", w / 2 + 160, startY);
  ctx.fillText("KILLS", w / 2 + 260, startY);

  ctx.fillStyle = "hsla(200, 50%, 50%, 0.3)";
  ctx.fillRect(w / 2 - 300, startY + 6, 600, 1);

  for (let i = 0; i < entries.length && i < 15; i++) {
    const e = entries[i];
    const y = startY + (i + 1) * rowH + 8;
    const isTop3 = i < 3;
    const colors = ["hsla(50, 90%, 65%, 0.9)", "hsla(0, 0%, 75%, 0.9)", "hsla(25, 60%, 50%, 0.9)"];
    ctx.font = isTop3 ? "bold 14px monospace" : "13px monospace";
    ctx.fillStyle = isTop3 ? colors[i] : "hsla(200, 50%, 65%, 0.7)";
    ctx.textAlign = "left";
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
    ctx.fillText(medal, w / 2 - 280, y);
    const name = e.email ? e.email.split("@")[0] : "Anônimo";
    ctx.fillText(name.substring(0, 16), w / 2 - 240, y);
    ctx.textAlign = "right";
    ctx.fillText(`${e.score}`, w / 2 + 80, y);
    ctx.fillText(`${e.wave}`, w / 2 + 160, y);
    ctx.fillText(`${e.asteroids_destroyed}`, w / 2 + 260, y);
  }

  if (entries.length === 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "hsla(200, 40%, 60%, 0.6)";
    ctx.font = "16px monospace";
    ctx.fillText("Nenhum score ainda. Seja o primeiro!", w / 2, startY + 60);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(120, 60%, 60%, 0.8)";
  ctx.font = "16px monospace";
  ctx.fillText("[ TAB ] Fechar ranking", w / 2, h - 40);
  ctx.textAlign = "left";
}
