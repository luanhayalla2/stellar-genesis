import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Ship, Star, Nebula, Drone, EnemyShip, BlackHole, Particle, Laser, Asteroid, Explosion, PowerUp, GameState, Boss, BossLaser, WaveState } from './space-game/types';
import { NUM_STARS, SHIP_ACCEL, BOOST_ACCEL, FRICTION, ROTATION_SPEED, MAX_SPEED, MAX_BOOST_SPEED, LASER_SPEED, LASER_COOLDOWN, ASTEROID_SPAWN_DIST, SHIP_MAX_HP, INVINCIBLE_FRAMES, POWERUP_DURATION, LANDING_DIST, BASE_ASTEROIDS_PER_WAVE, ASTEROIDS_INCREMENT, BOSS_EVERY_N_WAVES, WAVE_BREAK_TIME, BOSS_SHOOT_COOLDOWN, BOSS_LASER_SPEED, BOSS_NAMES } from './space-game/constants';
import { generatePlanets, generateAsteroidShape, generateNebulas, generateBlackHoles } from './space-game/generators';
import { drawStars, drawNebulas, drawBlackHoles, drawPlanets, drawAsteroids, drawEnemyShips, drawDrones, drawExplosions, drawLasers, drawParticles, drawPowerUps, drawShip, drawHUD, drawGameOver, drawExploration, drawBoss, drawBossLasers, drawLeaderboard, drawRemotePlayers, LeaderboardEntry } from './space-game/renderer';
import { playLaser, playExplosion, playCollision, playBossHit, playPowerUp, playBossAppear, playWaveComplete, playShieldHit } from './space-game/audio';
import { Upgrades, SHOP_ITEMS, getItemCost, getItemLevel } from './space-game/shop';
import { initMultiplayer, broadcastState, cleanupMultiplayer, getRemotePlayers, sendChatMessage, getChatMessages, setOnChat } from './space-game/multiplayer';
import { startMusic, stopMusic, setMusicIntensity, updateMusic, isMusicPlaying } from './space-game/music';
import { initTouchControls, getTouchState, isTouchDevice, setupButtonZones, drawTouchControls } from './space-game/touch-controls';

const createShip = (upgrades: Upgrades): Ship => ({
  x: 0, y: 0, angle: -Math.PI / 2, vx: 0, vy: 0,
  thrust: false, boosting: false,
  hp: SHIP_MAX_HP + upgrades.max_hp_bonus, maxHp: SHIP_MAX_HP + upgrades.max_hp_bonus,
  shield: false, shieldTimer: 0,
  doubleShot: false, doubleShotTimer: 0,
  speedBoost: false, speedBoostTimer: 0,
  invincible: 0,
});

const createWaveState = (): WaveState => ({
  wave: 1,
  asteroidsRemaining: BASE_ASTEROIDS_PER_WAVE,
  asteroidsSpawned: 0,
  asteroidsToSpawn: BASE_ASTEROIDS_PER_WAVE,
  bossActive: false,
  bossDefeated: false,
  waveComplete: false,
  waveTimer: 0,
  asteroidsDestroyed: 0,
});

const SpaceGame = () => {
  const { signOut, user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const upgradesRef = useRef<Upgrades>({ max_hp_bonus: 0, damage_bonus: 0, speed_bonus: 0, shield_duration_bonus: 0, drone_count: 0, score_spent: 0 });
  const shipRef = useRef<Ship>(createShip(upgradesRef.current));
  const starsRef = useRef<Star[]>([]);
  const nebulasRef = useRef<Nebula[]>([]);
  const blackHolesRef = useRef<BlackHole[]>(generateBlackHoles());
  const dronesRef = useRef<Drone[]>([]);
  const enemyShipsRef = useRef<EnemyShip[]>([]);
  const enemyLasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const planetsRef = useRef(generatePlanets());
  const asteroidsRef = useRef<Asteroid[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const bossRef = useRef<Boss | null>(null);
  const bossLasersRef = useRef<BossLaser[]>([]);
  const frameRef = useRef(0);
  const cooldownRef = useRef(0);
  const scoreRef = useRef(0);
  const totalScoreRef = useRef(0); // lifetime score for shop
  const waveStateRef = useRef<WaveState>(createWaveState());
  const gameStateRef = useRef<GameState>({ phase: 'playing', exploringPlanet: null });
  const scoreSavedRef = useRef(false);
  const leaderboardRef = useRef<LeaderboardEntry[]>([]);
  const tabPressedRef = useRef(false);
  const shopSelectionRef = useRef(0);
  const broadcastTimerRef = useRef(0);
  const chatInputRef = useRef('');
  const chatOpenRef = useRef(false);
  const musicStartedRef = useRef(false);
  const [, forceUpdate] = useState(0);

  // Load upgrades from DB
  const loadUpgrades = useCallback(async () => {
    if (!user || user.id === 'guest') return;
    const { data } = await supabase.from('user_upgrades').select('*').eq('user_id', user.id).single();
    if (data) {
      upgradesRef.current = {
        max_hp_bonus: data.max_hp_bonus,
        damage_bonus: data.damage_bonus,
        speed_bonus: data.speed_bonus,
        shield_duration_bonus: data.shield_duration_bonus,
        drone_count: data.drone_count,
        score_spent: data.score_spent,
      };
      shipRef.current.maxHp = SHIP_MAX_HP + data.max_hp_bonus;
      shipRef.current.hp = shipRef.current.maxHp;
    }
    // Load total score earned
    const { data: scores } = await supabase.from('scores').select('score').eq('user_id', user.id);
    if (scores) {
      totalScoreRef.current = scores.reduce((sum, s) => sum + s.score, 0);
    }
  }, [user]);

  const saveUpgrades = useCallback(async (upgrades: Upgrades) => {
    if (!user || user.id === 'guest') return;
    const { data: existing } = await supabase.from('user_upgrades').select('id').eq('user_id', user.id).single();
    if (existing) {
      await supabase.from('user_upgrades').update({
        max_hp_bonus: upgrades.max_hp_bonus,
        damage_bonus: upgrades.damage_bonus,
        speed_bonus: upgrades.speed_bonus,
        shield_duration_bonus: upgrades.shield_duration_bonus,
        drone_count: upgrades.drone_count,
        score_spent: upgrades.score_spent,
      }).eq('user_id', user.id);
    } else {
      await supabase.from('user_upgrades').insert({
        user_id: user.id,
        ...upgrades,
      });
    }
  }, [user]);

  const saveScore = useCallback(async () => {
    if (scoreSavedRef.current || !user || user.id === 'guest' || scoreRef.current === 0) return;
    scoreSavedRef.current = true;
    const ws = waveStateRef.current;
    await supabase.from('scores').insert({
      user_id: user.id,
      score: scoreRef.current,
      wave: ws.wave,
      asteroids_destroyed: ws.asteroidsDestroyed,
    });
    totalScoreRef.current += scoreRef.current;
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    const { data: fullData } = await supabase
      .from('scores')
      .select('score, wave, asteroids_destroyed, created_at, user_id')
      .order('score', { ascending: false })
      .limit(15);
    
    if (fullData) {
      leaderboardRef.current = fullData.map(d => ({
        score: d.score,
        wave: d.wave,
        asteroids_destroyed: d.asteroids_destroyed,
        email: '',
        created_at: d.created_at,
      }));
    }
  }, []);

  const initStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: (Math.random() - 0.5) * w * 4,
        y: (Math.random() - 0.5) * h * 4,
        z: Math.random() * 3 + 0.5,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }
    starsRef.current = stars;
  }, []);

  const spawnParticle = useCallback((ship: Ship) => {
    const spread = 0.4;
    const backAngle = ship.angle + Math.PI;
    const speed = ship.boosting ? 4 : 2;
    particlesRef.current.push({
      x: ship.x - Math.cos(ship.angle) * 18,
      y: ship.y - Math.sin(ship.angle) * 18,
      vx: Math.cos(backAngle + (Math.random() - 0.5) * spread) * (Math.random() * speed + 1),
      vy: Math.sin(backAngle + (Math.random() - 0.5) * spread) * (Math.random() * speed + 1),
      life: 1, size: Math.random() * 3 + 1, hue: ship.boosting ? 260 : 200,
    });
  }, []);

  const resetGame = useCallback(() => {
    shipRef.current = createShip(upgradesRef.current);
    asteroidsRef.current = [];
    lasersRef.current = [];
    explosionsRef.current = [];
    powerUpsRef.current = [];
    bossRef.current = null;
    bossLasersRef.current = [];
    scoreRef.current = 0;
    waveStateRef.current = createWaveState();
    gameStateRef.current = { phase: 'playing', exploringPlanet: null };
    scoreSavedRef.current = false;
  }, []);

  const spawnBoss = useCallback((ship: Ship, wave: number) => {
    const types: Boss['type'][] = ['mothership', 'destroyer', 'titan'];
    const type = types[Math.floor(wave / BOSS_EVERY_N_WAVES - 1) % types.length];
    const bossHp = 15 + wave * 5;
    const angle = Math.random() * Math.PI * 2;
    bossRef.current = {
      x: ship.x + Math.cos(angle) * 800,
      y: ship.y + Math.sin(angle) * 800,
      vx: 0, vy: 0,
      radius: 40 + wave * 2,
      hp: bossHp, maxHp: bossHp,
      rotation: 0, rotSpeed: 0.01,
      shootCooldown: BOSS_SHOOT_COOLDOWN,
      phase: 0,
      type,
      name: BOSS_NAMES[Math.floor(wave / BOSS_EVERY_N_WAVES - 1) % BOSS_NAMES.length],
    };
    waveStateRef.current.bossActive = true;
    playBossAppear();
  }, []);

  // Init multiplayer, music & load upgrades
  useEffect(() => {
    fetchLeaderboard();
    loadUpgrades();
    if (user) {
      const name = user.email?.split('@')[0] || 'Piloto';
      initMultiplayer(user.id, name);
      setOnChat(() => forceUpdate(n => n + 1));
    }
    return () => {
      cleanupMultiplayer();
      stopMusic();
    };
  }, [fetchLeaderboard, loadUpgrades, user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = isTouchDevice();
    let cleanupTouch: (() => void) | null = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) initStars(canvas.width, canvas.height);
      if (nebulasRef.current.length === 0) nebulasRef.current = generateNebulas();
      if (isMobile) setupButtonZones(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    if (isMobile) {
      cleanupTouch = initTouchControls(canvas);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Chat mode intercepts all keys
      if (chatOpenRef.current) {
        e.preventDefault();
        if (e.key === 'Escape') {
          chatOpenRef.current = false;
          chatInputRef.current = '';
        } else if (e.key === 'Enter') {
          if (chatInputRef.current.trim()) {
            const name = user?.email?.split('@')[0] || 'Piloto';
            sendChatMessage(chatInputRef.current, name);
          }
          chatOpenRef.current = false;
          chatInputRef.current = '';
        } else if (e.key === 'Backspace') {
          chatInputRef.current = chatInputRef.current.slice(0, -1);
        } else if (e.key.length === 1) {
          chatInputRef.current += e.key;
        }
        return;
      }

      // Start music on first interaction
      if (!musicStartedRef.current) {
        musicStartedRef.current = true;
        startMusic();
      }

      keysRef.current.add(e.key.toLowerCase());
      if (["arrowup","arrowdown","arrowleft","arrowright"," ","tab"].includes(e.key.toLowerCase())) e.preventDefault();
      
      // T to open chat
      if (e.key.toLowerCase() === 't' && gameStateRef.current.phase === 'playing') {
        e.preventDefault();
        chatOpenRef.current = true;
        chatInputRef.current = '';
        keysRef.current.delete('t');
        return;
      }

      if (e.key.toLowerCase() === 'tab' && !tabPressedRef.current) {
        tabPressedRef.current = true;
        const gs = gameStateRef.current;
        if (gs.phase === 'leaderboard') {
          gs.phase = 'playing';
        } else if (gs.phase === 'playing') {
          gs.phase = 'leaderboard';
          fetchLeaderboard();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    const onMouseDown = () => { mouseRef.current.down = true; mouseRef.current.active = true; };
    const onMouseUp = () => mouseRef.current.down = false;

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    let animId: number;
    let prevWaveComplete = false;

    const loop = () => {
      const w = canvas.width, h = canvas.height;
      const keys = keysRef.current;
      const ship = shipRef.current;
      const gs = gameStateRef.current;
      const ws = waveStateRef.current;
      const upgrades = upgradesRef.current;
      frameRef.current++;
      const touch = getTouchState();
      if (cooldownRef.current > 0) cooldownRef.current--;

      // === BROADCAST MULTIPLAYER ===
      broadcastTimerRef.current++;
      if (broadcastTimerRef.current >= 6 && gs.phase === 'playing') { // ~10fps broadcast
        broadcastTimerRef.current = 0;
        const name = user?.email?.split('@')[0] || 'Piloto';
        broadcastState(ship, name);
      }

      // === LEADERBOARD ===
      if (gs.phase === 'leaderboard') {
        ctx.fillStyle = "hsl(240, 20%, 3%)";
        ctx.fillRect(0, 0, w, h);
        drawLeaderboard(ctx, w, h, leaderboardRef.current);
        animId = requestAnimationFrame(loop);
        return;
      }

      // === GAME OVER ===
      if (gs.phase === 'gameover') {
        ctx.fillStyle = "hsl(240, 20%, 3%)";
        ctx.fillRect(0, 0, w, h);
        const camX = ship.x - w / 2, camY = ship.y - h / 2;
        drawStars(ctx, starsRef.current, camX, camY, w, h, frameRef.current);
        drawGameOver(ctx, w, h, scoreRef.current, ws.wave, ws.asteroidsDestroyed);
        saveScore();
        if (keys.has("enter") || (isMobile && touch.firing)) resetGame();
        animId = requestAnimationFrame(loop);
        return;
      }

      // === EXPLORING (with shop) ===
      if (gs.phase === 'exploring' && gs.exploringPlanet) {
        ctx.fillStyle = "hsl(240, 20%, 3%)";
        ctx.fillRect(0, 0, w, h);
        const availableScore = totalScoreRef.current - upgrades.score_spent;
        drawExploration(ctx, w, h, gs.exploringPlanet, upgrades, availableScore, shopSelectionRef.current);
        
        // Shop navigation
        if (keys.has("arrowup") || keys.has("w")) {
          shopSelectionRef.current = Math.max(0, shopSelectionRef.current - 1);
          keys.delete("arrowup"); keys.delete("w");
        }
        if (keys.has("arrowdown") || keys.has("s")) {
          shopSelectionRef.current = Math.min(SHOP_ITEMS.length - 1, shopSelectionRef.current + 1);
          keys.delete("arrowdown"); keys.delete("s");
        }
        if (keys.has("enter") || keys.has(" ")) {
          keys.delete("enter"); keys.delete(" ");
          const item = SHOP_ITEMS[shopSelectionRef.current];
          const level = getItemLevel(upgrades, item);
          if (level < item.maxLevel) {
            const cost = getItemCost(item, level);
            if (availableScore >= cost) {
              upgrades[item.field]++;
              upgrades.score_spent += cost;
              // Apply immediately
              ship.maxHp = SHIP_MAX_HP + upgrades.max_hp_bonus;
              ship.hp = ship.maxHp;
              saveUpgrades(upgrades);
              playPowerUp();
            }
          }
        }
        
        if (keys.has("escape")) {
          gs.phase = 'playing';
          gs.exploringPlanet = null;
        }
        animId = requestAnimationFrame(loop);
        return;
      }

      // === INPUT (keyboard + mouse + touch) ===
      if (isMobile && touch.joystickActive && touch.joystickMagnitude > 0) {
        const targetAngle = touch.joystickAngle;
        let angleDiff = targetAngle - ship.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        ship.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), ROTATION_SPEED * 2);
        ship.thrust = touch.joystickMagnitude > 0.2;
      } else if (!isMobile && mouseRef.current.active) {
        // Mouse controls: Angle points to cursor, movement follows cursor
        const dx = mouseRef.current.x - w / 2;
        const dy = mouseRef.current.y - h / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          const targetAngle = Math.atan2(dy, dx);
          let angleDiff = targetAngle - ship.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          ship.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), ROTATION_SPEED * 1.5);
          
          // Auto-thrust if cursor is far enough
          ship.thrust = dist > 60 || keys.has("w") || keys.has("arrowup");
        } else {
          ship.thrust = keys.has("w") || keys.has("arrowup");
        }
        
        // Horizontal strafing/adjustments still possible via keyboard
        if (keys.has("a") || keys.has("arrowleft")) ship.vx -= accel * 0.3;
        if (keys.has("d") || keys.has("arrowright")) ship.vx += accel * 0.3;
      } else {
        if (keys.has("a") || keys.has("arrowleft")) ship.angle -= ROTATION_SPEED;
        if (keys.has("d") || keys.has("arrowright")) ship.angle += ROTATION_SPEED;
        ship.thrust = keys.has("w") || keys.has("arrowup");
      }
      ship.boosting = keys.has("shift") || (isMobile && touch.boosting);

      const speedMul = (ship.speedBoost ? 1.5 : 1) * (1 + upgrades.speed_bonus * 0.15);
      const accel = (ship.boosting ? BOOST_ACCEL : SHIP_ACCEL) * speedMul;
      const maxSpd = (ship.boosting ? MAX_BOOST_SPEED : MAX_SPEED) * speedMul;

      if (ship.thrust) {
        ship.vx += Math.cos(ship.angle) * accel;
        ship.vy += Math.sin(ship.angle) * accel;
      }
      if (keys.has("s") || keys.has("arrowdown")) {
        ship.vx -= Math.cos(ship.angle) * accel * 0.5;
        ship.vy -= Math.sin(ship.angle) * accel * 0.5;
      }

      const spd = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
      if (spd > maxSpd) { ship.vx = (ship.vx / spd) * maxSpd; ship.vy = (ship.vy / spd) * maxSpd; }
      ship.vx *= FRICTION;
      ship.vy *= FRICTION;

      // === BLACK HOLE GRAVITY ===
      for (const bh of blackHolesRef.current) {
        const dx = bh.x - ship.x, dy = bh.y - ship.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        if (dist < 3000) {
          const force = (bh.radius * 200) / (distSq + 1000);
          ship.vx += (dx / dist) * force;
          ship.vy += (dy / dist) * force;
          
          if (dist < bh.radius && ship.invincible <= 0) {
            ship.hp -= 10; // Instakill or heavy damage
            if (ship.hp <= 0) { ship.hp = 0; gs.phase = 'gameover'; }
          }
        }
      }

      ship.x += ship.vx;
      ship.y += ship.vy;

      // === DRONES ===
      const targetDroneCount = upgrades.drone_count || 0;
      while (dronesRef.current.length < targetDroneCount) {
        dronesRef.current.push({ x: ship.x, y: ship.y, vx: 0, vy: 0, angle: ship.angle, cooldown: 0 });
      }
      dronesRef.current.forEach((d, i) => {
        const offsetAng = (frameRef.current * 0.02) + (i * Math.PI);
        const tx = ship.x + Math.cos(offsetAng) * 60;
        const ty = ship.y + Math.sin(offsetAng) * 60;
        d.vx += (tx - d.x) * 0.05;
        d.vy += (ty - d.y) * 0.05;
        d.vx *= 0.8; d.vy *= 0.8;
        d.x += d.vx; d.y += d.vy;
        d.angle = ship.angle;

        if (d.cooldown > 0) d.cooldown--;
        else if (asteroidsRef.current.length > 0 || enemyShipsRef.current.length > 0) {
          // Auto-target nearest
          let nearestDist = 500;
          let target = null;
          [...asteroidsRef.current, ...enemyShipsRef.current].forEach(e => {
            const dist = Math.sqrt((e.x - d.x) ** 2 + (e.y - d.y) ** 2);
            if (dist < nearestDist) { nearestDist = dist; target = e; }
          });
          if (target) {
            d.cooldown = 30; // Drone fires slower than ship
            const ang = Math.atan2((target as any).y - d.y, (target as any).x - d.x);
            lasersRef.current.push({
              x: d.x + Math.cos(ang) * 10,
              y: d.y + Math.sin(ang) * 10,
              vx: Math.cos(ang) * LASER_SPEED,
              vy: Math.sin(ang) * LASER_SPEED,
              life: 45,
            });
          }
        }
      });

      // === INVINCIBILITY ===
      if (ship.invincible > 0) ship.invincible--;

      // === POWER-UP TIMERS ===
      const shieldBonus = upgrades.shield_duration_bonus * 180; // 3s per level
      if (ship.shield) { ship.shieldTimer--; if (ship.shieldTimer <= 0) ship.shield = false; }
      if (ship.doubleShot) { ship.doubleShotTimer--; if (ship.doubleShotTimer <= 0) ship.doubleShot = false; }
      if (ship.speedBoost) { ship.speedBoostTimer--; if (ship.speedBoostTimer <= 0) ship.speedBoost = false; }

      // === LAND ON PLANET ===
      if (keys.has("l") || (isMobile && touch.landing)) {
        for (const p of planetsRef.current) {
          const dist = Math.sqrt((ship.x - p.x) ** 2 + (ship.y - p.y) ** 2);
          if (dist < LANDING_DIST + p.radius) {
            gs.phase = 'exploring';
            gs.exploringPlanet = p;
            ship.vx = 0; ship.vy = 0;
            shopSelectionRef.current = 0;
            keys.delete("l");
            break;
          }
        }
      }

      // === SHOOT ===
      const firing = keys.has(" ") || keys.has("enter") || (isMobile && touch.firing) || (!isMobile && mouseRef.current.down);
      if (firing && cooldownRef.current <= 0) {
        cooldownRef.current = LASER_COOLDOWN;
        playLaser();
        const shootLaser = (offsetAngle: number) => {
          lasersRef.current.push({
            x: ship.x + Math.cos(ship.angle + offsetAngle) * 22,
            y: ship.y + Math.sin(ship.angle + offsetAngle) * 22,
            vx: Math.cos(ship.angle + offsetAngle) * LASER_SPEED + ship.vx * 0.3,
            vy: Math.sin(ship.angle + offsetAngle) * LASER_SPEED + ship.vy * 0.3,
            life: 60,
          });
        };
        if (ship.doubleShot) { shootLaser(-0.1); shootLaser(0.1); }
        else { shootLaser(0); }
      }

      // === WAVE SYSTEM ===
      if (ws.waveComplete) {
        if (!prevWaveComplete) {
          prevWaveComplete = true;
          playWaveComplete();
        }
        ws.waveTimer--;
        if (ws.waveTimer <= 0) {
          ws.wave++;
          ws.asteroidsToSpawn = BASE_ASTEROIDS_PER_WAVE + (ws.wave - 1) * ASTEROIDS_INCREMENT;
          ws.asteroidsSpawned = 0;
          ws.asteroidsRemaining = ws.asteroidsToSpawn;
          ws.bossActive = false;
          ws.bossDefeated = false;
          ws.waveComplete = false;
          prevWaveComplete = false;
          if (ws.wave % BOSS_EVERY_N_WAVES === 0) {
            spawnBoss(ship, ws.wave);
          }
        }
      } else {
        prevWaveComplete = false;
        const allSpawned = ws.asteroidsSpawned >= ws.asteroidsToSpawn;
        const allDead = asteroidsRef.current.length === 0;
        const bossGone = !ws.bossActive || ws.bossDefeated;
        if (allSpawned && allDead && bossGone) {
          ws.waveComplete = true;
          ws.waveTimer = WAVE_BREAK_TIME;
          ship.hp = Math.min(ship.hp + 1, ship.maxHp);
        }
      }

      // === SPAWN ASTEROIDS ===
      if (!ws.waveComplete && ws.asteroidsSpawned < ws.asteroidsToSpawn) {
        const maxOnScreen = 8 + ws.wave * 2;
        if (asteroidsRef.current.length < maxOnScreen && Math.random() < 0.03 + ws.wave * 0.005) {
          const angle = Math.random() * Math.PI * 2;
          const speedMul2 = 1 + ws.wave * 0.1;
          asteroidsRef.current.push({
            x: ship.x + Math.cos(angle) * ASTEROID_SPAWN_DIST,
            y: ship.y + Math.sin(angle) * ASTEROID_SPAWN_DIST,
            vx: (Math.random() - 0.5) * 1.5 * speedMul2,
            vy: (Math.random() - 0.5) * 1.5 * speedMul2,
            radius: Math.random() * 20 + 12,
            hp: 2 + Math.floor(ws.wave / 2), maxHp: 2 + Math.floor(ws.wave / 2),
            vertices: generateAsteroidShape(),
            rotation: 0, rotSpeed: (Math.random() - 0.5) * 0.03,
          });
          ws.asteroidsSpawned++;
        }
        
        // Spawn Enemy Scouts starting from Wave 2
        if (ws.wave >= 2 && enemyShipsRef.current.length < 2 + Math.floor(ws.wave / 3) && Math.random() < 0.005 + ws.wave * 0.001) {
          const angle = Math.random() * Math.PI * 2;
          enemyShipsRef.current.push({
            x: ship.x + Math.cos(angle) * ASTEROID_SPAWN_DIST,
            y: ship.y + Math.sin(angle) * ASTEROID_SPAWN_DIST,
            vx: 0, vy: 0,
            hp: 3 + Math.floor(ws.wave / 2),
            maxHp: 3 + Math.floor(ws.wave / 2),
            angle: 0,
            shootCooldown: 60,
          });
        }
      }

      // === UPDATE BOSS ===
      const boss = bossRef.current;
      if (boss && boss.hp > 0) {
        boss.rotation += boss.rotSpeed;
        boss.phase++;
        const toShipAngle = Math.atan2(ship.y - boss.y, ship.x - boss.x);
        const bossSpeed = 0.5 + waveStateRef.current.wave * 0.05;
        boss.vx += Math.cos(toShipAngle) * 0.02 * bossSpeed;
        boss.vy += Math.sin(toShipAngle) * 0.02 * bossSpeed;
        const bs = Math.sqrt(boss.vx ** 2 + boss.vy ** 2);
        if (bs > bossSpeed) { boss.vx = (boss.vx / bs) * bossSpeed; boss.vy = (boss.vy / bs) * bossSpeed; }
        boss.x += boss.vx;
        boss.y += boss.vy;

        boss.shootCooldown--;
        if (boss.shootCooldown <= 0) {
          boss.shootCooldown = BOSS_SHOOT_COOLDOWN - Math.min(ws.wave, 20);
          const shootAngle = toShipAngle + (Math.random() - 0.5) * 0.3;
          bossLasersRef.current.push({
            x: boss.x + Math.cos(shootAngle) * boss.radius,
            y: boss.y + Math.sin(shootAngle) * boss.radius,
            vx: Math.cos(shootAngle) * BOSS_LASER_SPEED,
            vy: Math.sin(shootAngle) * BOSS_LASER_SPEED,
            life: 120,
          });
          if (ws.wave >= 6) {
            const shootAngle2 = toShipAngle + (Math.random() - 0.5) * 0.5;
            bossLasersRef.current.push({
              x: boss.x + Math.cos(shootAngle2) * boss.radius,
              y: boss.y + Math.sin(shootAngle2) * boss.radius,
              vx: Math.cos(shootAngle2) * BOSS_LASER_SPEED,
              vy: Math.sin(shootAngle2) * BOSS_LASER_SPEED,
              life: 120,
            });
          }
        }

        // Boss-ship collision
        const bDist = Math.sqrt((ship.x - boss.x) ** 2 + (ship.y - boss.y) ** 2);
        if (bDist < boss.radius + 14 && ship.invincible <= 0) {
          if (ship.shield) {
            playShieldHit();
            const knockAngle = Math.atan2(ship.y - boss.y, ship.x - boss.x);
            ship.vx += Math.cos(knockAngle) * 6;
            ship.vy += Math.sin(knockAngle) * 6;
          } else {
            ship.hp -= 2;
            ship.invincible = INVINCIBLE_FRAMES;
            playCollision();
            const knockAngle = Math.atan2(ship.y - boss.y, ship.x - boss.x);
            ship.vx += Math.cos(knockAngle) * 6;
            ship.vy += Math.sin(knockAngle) * 6;
            if (ship.hp <= 0) { ship.hp = 0; gs.phase = 'gameover'; }
          }
        }

        // Laser-boss collision
        const dmg = 1 + upgrades.damage_bonus;
        for (let li = lasersRef.current.length - 1; li >= 0; li--) {
          const l = lasersRef.current[li];
          const dx = l.x - boss.x, dy = l.y - boss.y;
          if (Math.sqrt(dx * dx + dy * dy) < boss.radius + 4) {
            boss.hp -= dmg;
            lasersRef.current.splice(li, 1);
            if (boss.hp <= 0) {
              scoreRef.current += 500 + ws.wave * 100;
              ws.bossDefeated = true;
              ws.asteroidsDestroyed++;
              playBossHit();
              const ep: Explosion["particles"] = [];
              for (let i = 0; i < 30; i++) {
                const ea = Math.random() * Math.PI * 2;
                const es = Math.random() * 6 + 2;
                ep.push({ x: boss.x, y: boss.y, vx: Math.cos(ea) * es, vy: Math.sin(ea) * es, life: 1, hue: Math.random() * 60, size: Math.random() * 6 + 3 });
              }
              explosionsRef.current.push({ x: boss.x, y: boss.y, particles: ep });
              const types: PowerUp['type'][] = ['shield', 'doubleShot', 'speed'];
              for (const t of types) {
                powerUpsRef.current.push({
                  x: boss.x + (Math.random() - 0.5) * 60,
                  y: boss.y + (Math.random() - 0.5) * 60,
                  type: t, life: 900, angle: 0,
                });
              }
              bossRef.current = null;
              bossLasersRef.current = [];
            }
            break;
          }
        }
      }

      // === UPDATE ENEMY SHIPS ===
      enemyShipsRef.current = enemyShipsRef.current.filter(e => {
        const dist = Math.sqrt((e.x - ship.x) ** 2 + (e.y - ship.y) ** 2);
        const angleToShip = Math.atan2(ship.y - e.y, ship.x - e.x);
        e.angle = angleToShip;

        // AI: Maintain distance
        const speed = 2.5 + Math.min(ws.wave * 0.2, 3);
        if (dist > 450) {
          e.vx += Math.cos(angleToShip) * 0.08;
          e.vy += Math.sin(angleToShip) * 0.08;
        } else if (dist < 350) {
          e.vx -= Math.cos(angleToShip) * 0.08;
          e.vy -= Math.sin(angleToShip) * 0.08;
        }
        e.vx *= 0.98; e.vy *= 0.98;
        e.x += e.vx; e.y += e.vy;

        e.shootCooldown--;
        if (e.shootCooldown <= 0 && dist < 800) {
          e.shootCooldown = 60 + Math.random() * 60 - Math.min(ws.wave * 2, 40);
          enemyLasersRef.current.push({
            x: e.x + Math.cos(e.angle) * 15,
            y: e.y + Math.sin(e.angle) * 15,
            vx: Math.cos(e.angle) * 7.5,
            vy: Math.sin(e.angle) * 7.5,
            life: 90,
          });
        }

        // Collision with player lasers
        for (let li = lasersRef.current.length - 1; li >= 0; li--) {
          const l = lasersRef.current[li];
          const ldist = Math.sqrt((l.x - e.x) ** 2 + (l.y - e.y) ** 2);
          if (ldist < 18) {
            e.hp -= (1 + upgrades.damage_bonus);
            lasersRef.current.splice(li, 1);
            if (e.hp <= 0) {
              scoreRef.current += 150 + ws.wave * 20;
              ws.asteroidsDestroyed++;
              playExplosion();
              return false;
            }
          }
        }
        return dist < 3000;
      });

      // === UPDATE ENEMY LASERS ===
      enemyLasersRef.current = enemyLasersRef.current.filter(l => {
        l.x += l.vx; l.y += l.vy; l.life--;
        const dist = Math.sqrt((l.x - ship.x) ** 2 + (l.y - ship.y) ** 2);
        if (dist < 15 && ship.invincible <= 0) {
          if (ship.shield) {
            playShieldHit();
          } else {
            ship.hp--;
            ship.invincible = INVINCIBLE_FRAMES;
            playCollision();
            if (ship.hp <= 0) { ship.hp = 0; gs.phase = 'gameover'; }
          }
          return false;
        }
        return l.life > 0;
      });

      // === UPDATE BOSS LASERS ===
      bossLasersRef.current = bossLasersRef.current.filter(l => {
        l.x += l.vx; l.y += l.vy; l.life--;
        if (ship.invincible <= 0) {
          const dx = l.x - ship.x, dy = l.y - ship.y;
          if (Math.sqrt(dx * dx + dy * dy) < 14) {
            if (ship.shield) {
              playShieldHit();
            } else {
              ship.hp--;
              ship.invincible = INVINCIBLE_FRAMES;
              playCollision();
              if (ship.hp <= 0) { ship.hp = 0; gs.phase = 'gameover'; }
            }
            return false;
          }
        }
        return l.life > 0;
      });

      // === UPDATE LASERS ===
      lasersRef.current = lasersRef.current.filter(l => {
        l.x += l.vx; l.y += l.vy; l.life--;
        return l.life > 0;
      });

      // === UPDATE ASTEROIDS ===
      asteroidsRef.current = asteroidsRef.current.filter(a => {
        a.x += a.vx; a.y += a.vy;
        a.rotation += a.rotSpeed;
        const distToShip = Math.sqrt((a.x - ship.x) ** 2 + (a.y - ship.y) ** 2);
        if (distToShip > 2000) return false;
        return a.hp > 0;
      });

      // === SHIP-ASTEROID COLLISION ===
      if (ship.invincible <= 0) {
        for (let ai = asteroidsRef.current.length - 1; ai >= 0; ai--) {
          const a = asteroidsRef.current[ai];
          const dx = ship.x - a.x, dy = ship.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < a.radius + 14) {
            if (ship.shield) {
              playShieldHit();
              const ep: Explosion["particles"] = [];
              for (let i = 0; i < 8; i++) {
                const ea = Math.random() * Math.PI * 2;
                ep.push({ x: a.x, y: a.y, vx: Math.cos(ea) * 3, vy: Math.sin(ea) * 3, life: 1, hue: 200, size: 3 });
              }
              explosionsRef.current.push({ x: a.x, y: a.y, particles: ep });
              asteroidsRef.current.splice(ai, 1);
              ws.asteroidsDestroyed++;
            } else {
              ship.hp--;
              ship.invincible = INVINCIBLE_FRAMES;
              playCollision();
              const knockAngle = Math.atan2(dy, dx);
              ship.vx += Math.cos(knockAngle) * 4;
              ship.vy += Math.sin(knockAngle) * 4;
              if (ship.hp <= 0) { ship.hp = 0; gs.phase = 'gameover'; }
            }
            break;
          }
        }
      }

      // === LASER-ASTEROID COLLISION ===
      const dmg = 1 + upgrades.damage_bonus;
      for (let li = lasersRef.current.length - 1; li >= 0; li--) {
        const l = lasersRef.current[li];
        for (let ai = asteroidsRef.current.length - 1; ai >= 0; ai--) {
          const a = asteroidsRef.current[ai];
          const dx = l.x - a.x, dy = l.y - a.y;
          if (Math.sqrt(dx * dx + dy * dy) < a.radius + 4) {
            a.hp -= dmg;
            lasersRef.current.splice(li, 1);
            if (a.hp <= 0) {
              scoreRef.current += Math.round(a.radius) + ws.wave * 5;
              ws.asteroidsDestroyed++;
              playExplosion();
              const ep: Explosion["particles"] = [];
              for (let i = 0; i < 12; i++) {
                const ea = Math.random() * Math.PI * 2;
                ep.push({ x: a.x, y: a.y, vx: Math.cos(ea) * (Math.random() * 4 + 1), vy: Math.sin(ea) * (Math.random() * 4 + 1), life: 1, hue: 30 + Math.random() * 30, size: Math.random() * 4 + 2 });
              }
              explosionsRef.current.push({ x: a.x, y: a.y, particles: ep });

              if (Math.random() < 0.3) {
                const types: PowerUp['type'][] = ['shield', 'doubleShot', 'speed'];
                powerUpsRef.current.push({
                  x: a.x, y: a.y,
                  type: types[Math.floor(Math.random() * types.length)],
                  life: 600, angle: 0,
                });
              }
              asteroidsRef.current.splice(ai, 1);
            }
            break;
          }
        }
      }

      // === UPDATE POWER-UPS ===
      const shieldDuration = POWERUP_DURATION + upgrades.shield_duration_bonus * 180;
      powerUpsRef.current = powerUpsRef.current.filter(pu => {
        pu.life--;
        pu.angle += 0.03;
        const dx = ship.x - pu.x, dy = ship.y - pu.y;
        if (Math.sqrt(dx * dx + dy * dy) < 24) {
          playPowerUp();
          switch (pu.type) {
            case 'shield': ship.shield = true; ship.shieldTimer = shieldDuration; break;
            case 'doubleShot': ship.doubleShot = true; ship.doubleShotTimer = POWERUP_DURATION; break;
            case 'speed': ship.speedBoost = true; ship.speedBoostTimer = POWERUP_DURATION; break;
          }
          return false;
        }
        return pu.life > 0;
      });

      // === UPDATE EXPLOSIONS ===
      explosionsRef.current = explosionsRef.current.filter(e => {
        e.particles = e.particles.filter(p => {
          p.x += p.vx; p.y += p.vy; p.life -= 0.03;
          return p.life > 0;
        });
        return e.particles.length > 0;
      });

      // === THRUST PARTICLES ===
      if (ship.thrust) {
        const count = ship.boosting ? 3 : 1;
        for (let i = 0; i < count; i++) spawnParticle(ship);
      }
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        return p.life > 0;
      });

      // === MUSIC INTENSITY ===
      if (musicStartedRef.current) {
        const hasEnemies = asteroidsRef.current.length > 0;
        const hasBoss = bossRef.current && bossRef.current.hp > 0;
        const lowHp = ship.hp / ship.maxHp < 0.3;
        let intensity = 0;
        if (hasEnemies) intensity += 0.3;
        if (hasBoss) intensity += 0.4;
        if (lowHp) intensity += 0.2;
        if (ship.boosting) intensity += 0.1;
        setMusicIntensity(Math.min(1, intensity));
        updateMusic();
      }

      // === DRAW ===
      ctx.fillStyle = "hsl(240, 20%, 3%)";
      ctx.fillRect(0, 0, w, h);

      const camX = ship.x - w / 2, camY = ship.y - h / 2;

      drawNebulas(ctx, nebulasRef.current, camX, camY, w, h, frameRef.current);
      drawBlackHoles(ctx, blackHolesRef.current, camX, camY, w, h, frameRef.current);
      drawStars(ctx, starsRef.current, camX, camY, w, h, frameRef.current);
      drawPlanets(ctx, planetsRef.current, camX, camY, w, h, ship);
      drawAsteroids(ctx, asteroidsRef.current, camX, camY, w, h);
      drawEnemyShips(ctx, enemyShipsRef.current, camX, camY);
      drawDrones(ctx, dronesRef.current, camX, camY, frameRef.current);
      drawExplosions(ctx, explosionsRef.current, camX, camY);
      drawLasers(ctx, lasersRef.current, camX, camY);
      drawLasers(ctx, enemyLasersRef.current, camX, camY); // Re-use laser renderer for enemies
      drawBossLasers(ctx, bossLasersRef.current, camX, camY);
      drawParticles(ctx, particlesRef.current, camX, camY);
      drawPowerUps(ctx, powerUpsRef.current, camX, camY, frameRef.current);
      drawRemotePlayers(ctx, getRemotePlayers(), camX, camY);
      if (bossRef.current && bossRef.current.hp > 0) {
        drawBoss(ctx, bossRef.current, camX, camY, frameRef.current);
      }
      drawShip(ctx, ship, w, h);
      drawHUD(ctx, ship, scoreRef.current, w, h, planetsRef.current, gameStateRef.current, waveStateRef.current, getRemotePlayers().length);

      // === DRAW TOUCH CONTROLS ===
      if (isMobile) {
        drawTouchControls(ctx, w, h);
        // Start music on first touch
        if (!musicStartedRef.current && touch.joystickActive) {
          musicStartedRef.current = true;
          startMusic();
        }
      }

      // === DRAW CHAT ===
      const msgs = getChatMessages();
      if (msgs.length > 0 || chatOpenRef.current) {
        // === DRAW CROSSHAIR ===
      if (!isMobile && mouseRef.current.active && gs.phase === 'playing') {
        ctx.strokeStyle = "hsla(180, 100%, 50%, 0.5)";
        ctx.lineWidth = 1.5;
        const mx = mouseRef.current.x, my = mouseRef.current.y;
        ctx.beginPath();
        ctx.arc(mx, my, 12, 0, Math.PI * 2);
        ctx.moveTo(mx - 18, my); ctx.lineTo(mx - 6, my);
        ctx.moveTo(mx + 6, my); ctx.lineTo(mx + 18, my);
        ctx.moveTo(mx, my - 18); ctx.lineTo(mx, my - 6);
        ctx.moveTo(mx, my + 6); ctx.lineTo(mx, my + 18);
        ctx.stroke();
      }

      ctx.save();
        const chatX = 12, chatY = h - 180;
        ctx.font = '13px monospace';
        const visibleMsgs = msgs.slice(-6);
        visibleMsgs.forEach((msg, i) => {
          const age = (Date.now() - msg.time) / 30000;
          const alpha = chatOpenRef.current ? 0.9 : Math.max(0, 1 - age * 1.5);
          ctx.fillStyle = `rgba(0,0,0,${alpha * 0.5})`;
          const text = `${msg.name}: ${msg.text}`;
          const tw = ctx.measureText(text).width;
          ctx.fillRect(chatX - 4, chatY + i * 20 - 13, tw + 8, 18);
          ctx.fillStyle = `rgba(200,220,255,${alpha})`;
          ctx.fillText(text, chatX, chatY + i * 20);
        });
        if (chatOpenRef.current) {
          const inputY = chatY + visibleMsgs.length * 20 + 6;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(chatX - 4, inputY - 13, 300, 20);
          ctx.strokeStyle = 'rgba(100,180,255,0.8)';
          ctx.strokeRect(chatX - 4, inputY - 13, 300, 20);
          ctx.fillStyle = '#fff';
          ctx.fillText('> ' + chatInputRef.current + (frameRef.current % 60 < 30 ? '|' : ''), chatX, inputY);
        } else if (msgs.length > 0) {
          ctx.fillStyle = 'rgba(150,170,200,0.4)';
          ctx.font = '11px monospace';
          ctx.fillText('[T] Chat', chatX, chatY + visibleMsgs.length * 20 + 6);
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      if (cleanupTouch) cleanupTouch();
    };
  }, [initStars, spawnParticle, resetGame, saveScore, fetchLeaderboard, spawnBoss, loadUpgrades, saveUpgrades, user]);

  return (
    <div className="fixed inset-0">
      <canvas ref={canvasRef} className="w-full h-full" />
      <button
        onClick={signOut}
        className="absolute top-4 right-4 px-4 py-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-md text-sm font-medium backdrop-blur-sm transition-colors z-10"
      >
        Sair
      </button>
    </div>
  );
};

export default SpaceGame;
