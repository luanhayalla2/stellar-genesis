// Touch input state for mobile controls
export interface TouchState {
  // Joystick
  joystickActive: boolean;
  joystickAngle: number; // radians
  joystickMagnitude: number; // 0-1
  // Buttons
  firing: boolean;
  boosting: boolean;
  landing: boolean;
}

let touchState: TouchState = {
  joystickActive: false,
  joystickAngle: 0,
  joystickMagnitude: 0,
  firing: false,
  boosting: false,
  landing: false,
};

// Joystick tracking
let joystickTouchId: number | null = null;
let joystickCenterX = 0;
let joystickCenterY = 0;
const JOYSTICK_RADIUS = 60;
const JOYSTICK_DEAD_ZONE = 0.15;

// Button zones (will be set by renderer)
interface ButtonZone {
  x: number;
  y: number;
  radius: number;
  id: string;
}

let buttonZones: ButtonZone[] = [];
let activeTouches = new Map<number, string>(); // touchId -> buttonId

export function getTouchState(): TouchState {
  return touchState;
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function setupButtonZones(canvasWidth: number, canvasHeight: number) {
  const r = Math.min(36, canvasWidth * 0.06);
  const margin = r + 16;
  const rightX = canvasWidth - margin;
  const bottomY = canvasHeight - margin;
  
  buttonZones = [
    { x: rightX, y: bottomY - r * 2.5, id: 'fire', radius: r },
    { x: rightX - r * 2.5, y: bottomY, id: 'boost', radius: r },
    { x: rightX, y: bottomY, id: 'land', radius: r * 0.7 },
  ];
}

export function getButtonZones(): ButtonZone[] {
  return buttonZones;
}

export function getJoystickState(): { centerX: number; centerY: number; active: boolean; angle: number; magnitude: number } {
  return {
    centerX: joystickCenterX,
    centerY: joystickCenterY,
    active: touchState.joystickActive,
    angle: touchState.joystickAngle,
    magnitude: touchState.joystickMagnitude,
  };
}

function isInJoystickZone(x: number, y: number, canvasWidth: number, canvasHeight: number): boolean {
  // Left half of screen, bottom 40%
  return x < canvasWidth * 0.45 && y > canvasHeight * 0.5;
}

function findButton(x: number, y: number): string | null {
  for (const btn of buttonZones) {
    const dx = x - btn.x, dy = y - btn.y;
    if (Math.sqrt(dx * dx + dy * dy) < btn.radius * 1.4) {
      return btn.id;
    }
  }
  return null;
}

function updateButtonState() {
  touchState.firing = false;
  touchState.boosting = false;
  touchState.landing = false;
  for (const btnId of activeTouches.values()) {
    if (btnId === 'fire') touchState.firing = true;
    if (btnId === 'boost') touchState.boosting = true;
    if (btnId === 'land') touchState.landing = true;
  }
}

export function initTouchControls(canvas: HTMLCanvasElement) {
  const getPos = (touch: Touch) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const pos = getPos(touch);

      // Check buttons first
      const btn = findButton(pos.x, pos.y);
      if (btn) {
        activeTouches.set(touch.identifier, btn);
        updateButtonState();
        continue;
      }

      // Check joystick zone
      if (joystickTouchId === null && isInJoystickZone(pos.x, pos.y, canvas.width, canvas.height)) {
        joystickTouchId = touch.identifier;
        joystickCenterX = pos.x;
        joystickCenterY = pos.y;
        touchState.joystickActive = true;
        touchState.joystickMagnitude = 0;
      }
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const pos = getPos(touch);

      if (touch.identifier === joystickTouchId) {
        const dx = pos.x - joystickCenterX;
        const dy = pos.y - joystickCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        touchState.joystickAngle = Math.atan2(dy, dx);
        touchState.joystickMagnitude = Math.min(1, dist / JOYSTICK_RADIUS);
        if (touchState.joystickMagnitude < JOYSTICK_DEAD_ZONE) {
          touchState.joystickMagnitude = 0;
        }
      }
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === joystickTouchId) {
        joystickTouchId = null;
        touchState.joystickActive = false;
        touchState.joystickMagnitude = 0;
      }

      activeTouches.delete(touch.identifier);
      updateButtonState();
    }
  };

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

  return () => {
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('touchcancel', onTouchEnd);
  };
}

// Draw mobile controls on canvas
export function drawTouchControls(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();

  // === JOYSTICK ===
  const joyX = touchState.joystickActive ? joystickCenterX : w * 0.15;
  const joyY = touchState.joystickActive ? joystickCenterY : h * 0.78;

  // Outer ring
  ctx.beginPath();
  ctx.arc(joyX, joyY, JOYSTICK_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner knob
  let knobX = joyX, knobY = joyY;
  if (touchState.joystickActive && touchState.joystickMagnitude > 0) {
    knobX += Math.cos(touchState.joystickAngle) * touchState.joystickMagnitude * JOYSTICK_RADIUS;
    knobY += Math.sin(touchState.joystickAngle) * touchState.joystickMagnitude * JOYSTICK_RADIUS;
  }
  ctx.beginPath();
  ctx.arc(knobX, knobY, 22, 0, Math.PI * 2);
  ctx.fillStyle = touchState.joystickActive ? 'rgba(100,180,255,0.4)' : 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,180,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // === BUTTONS ===
  for (const btn of buttonZones) {
    const isActive = (btn.id === 'fire' && touchState.firing) ||
                     (btn.id === 'boost' && touchState.boosting) ||
                     (btn.id === 'land' && touchState.landing);

    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);

    if (btn.id === 'fire') {
      ctx.fillStyle = isActive ? 'rgba(255,80,80,0.5)' : 'rgba(255,80,80,0.15)';
      ctx.strokeStyle = 'rgba(255,80,80,0.6)';
    } else if (btn.id === 'boost') {
      ctx.fillStyle = isActive ? 'rgba(80,160,255,0.5)' : 'rgba(80,160,255,0.15)';
      ctx.strokeStyle = 'rgba(80,160,255,0.6)';
    } else {
      ctx.fillStyle = isActive ? 'rgba(80,255,120,0.5)' : 'rgba(80,255,120,0.15)';
      ctx.strokeStyle = 'rgba(80,255,120,0.6)';
    }
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `bold ${Math.max(11, btn.radius * 0.4)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = btn.id === 'fire' ? '🔫' : btn.id === 'boost' ? '🚀' : '🛬';
    ctx.fillText(label, btn.x, btn.y);
  }

  ctx.restore();
}
