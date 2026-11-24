/**
 * <3 Luminous Particle Heart
 * Pure Canvas 2D Glowing Particle Engine with Cardiac ECG Pulse
 */

// --- Configuration & State ---
const state = {
  themeIndex: 0,
  soundEnabled: false,
  baseScale: 1,
  centerX: window.innerWidth / 2,
  centerY: window.innerHeight * 0.44,
  mouseX: -9999,
  mouseY: -9999,
  isMouseDown: false,
};

// Radiant Color Palettes
const THEMES = [
  {
    name: 'Sakura Rose',
    accent: '#ff2a7a',
    colors: [
      { r: 255, g: 30,  b: 100 },  // neon rose
      { r: 255, g: 85,  b: 140 },  // soft magenta
      { r: 255, g: 150, b: 185 },  // blushing pink
      { r: 255, g: 235, b: 245 },  // pure starlight white
    ],
  },
  {
    name: 'Violet Dream',
    accent: '#c084fc',
    colors: [
      { r: 168, g: 85,  b: 247 },  // violet
      { r: 236, g: 72,  b: 153 },  // hot pink
      { r: 192, g: 132, b: 252 },  // lavender
      { r: 255, g: 255, b: 255 },  // white
    ],
  },
  {
    name: 'Golden Sunset',
    accent: '#f59e0b',
    colors: [
      { r: 245, g: 158, b: 11 },   // gold
      { r: 239, g: 68,  b: 68 },   // coral flame
      { r: 254, g: 240, b: 138 },  // champagne
      { r: 255, g: 255, b: 255 },  // radiant white
    ],
  },
  {
    name: 'Neon Cyber',
    accent: '#00f0ff',
    colors: [
      { r: 255, g: 0,   b: 128 },  // cyberpunk magenta
      { r: 0,   g: 240, b: 255 },  // electric cyan
      { r: 168, g: 85,  b: 247 },  // neon purple
      { r: 255, g: 255, b: 255 },  // laser white
    ],
  }
];

// Canvas Setup
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');
let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

function updateDimensions() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  state.centerX = width / 2;
  state.centerY = height * 0.44;

  // Scale heart so it fits perfectly on all screens (mobile, tablet, 4K)
  state.baseScale = Math.min(width, height) / 36;
}
updateDimensions();

// --- Mathematical <3 Heart Curve ---
// Parametric formula:
// x = 16 sin^3(t)
// y = -(13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t))
function getHeartPosition(t) {
  const sinT = Math.sin(t);
  const cosT = Math.cos(t);
  const x = 16 * Math.pow(sinT, 3);
  const y = -(13 * cosT - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return { x, y };
}

// --- Sound Synthesizer (Tender Heartbeat & Shimmer) ---
class AudioController {
  constructor() {
    this.ctx = null;
    this.gain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0.5;
      this.gain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playThump(isSecond = false) {
    if (!state.soundEnabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSecond ? 62 : 48, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.14);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, t);

      const vol = isSecond ? 0.35 : 0.6;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.gain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }

  playChime() {
    if (!state.soundEnabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + i * 0.04);
        g.gain.setValueAtTime(0.08, t + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 0.7);
        osc.connect(g);
        g.connect(this.gain);
        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 0.75);
      });
    } catch (e) {}
  }
}

const audio = new AudioController();

// --- Particle Classes ---

// 1. Core <3 Heart Particle
class HeartParticle {
  constructor(t, r, layer = 'contour') {
    this.t = t;
    this.r = r; // radial distance from center (0 to 1)
    this.layer = layer; // 'contour', 'body', 'inner'

    const pos = getHeartPosition(t);
    this.rawX = pos.x * r;
    this.rawY = pos.y * r;

    this.x = state.centerX + this.rawX * state.baseScale;
    this.y = state.centerY + this.rawY * state.baseScale;

    this.vx = 0;
    this.vy = 0;

    // Organic drift / breathing noise offset
    this.driftAngle = Math.random() * Math.PI * 2;
    this.driftSpeed = Math.random() * 0.03 + 0.01;
    this.driftRadius = Math.random() * 3 + 1;

    // Visual attributes
    this.size = layer === 'contour' ? (Math.random() * 2.2 + 1.2) : (Math.random() * 1.8 + 0.8);
    this.baseAlpha = layer === 'contour' ? (Math.random() * 0.4 + 0.6) : (Math.random() * 0.35 + 0.3);
    this.alpha = this.baseAlpha;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.06 + 0.02;

    this.colorIdx = Math.floor(Math.random() * 4);
  }

  explode(magnitude = 1) {
    const dx = this.x - state.centerX;
    const dy = this.y - state.centerY;
    const dist = Math.hypot(dx, dy) || 1;

    const speed = (Math.random() * 14 + 8) * magnitude;
    this.vx = (dx / dist) * speed + (Math.random() - 0.5) * 6;
    this.vy = (dy / dist) * speed + (Math.random() - 0.5) * 6;
  }

  update(currentBeatScale, deltaFactor) {
    // Target position scaled by current cardiac pulse
    const targetX = state.centerX + (this.rawX * state.baseScale * currentBeatScale) + Math.cos(this.driftAngle) * this.driftRadius;
    const targetY = state.centerY + (this.rawY * state.baseScale * currentBeatScale) + Math.sin(this.driftAngle) * this.driftRadius;

    this.driftAngle += this.driftSpeed * deltaFactor;
    this.twinklePhase += this.twinkleSpeed * deltaFactor;

    // Spring physics bringing particle back smoothly
    const spring = 0.065;
    const friction = 0.87;

    this.vx += (targetX - this.x) * spring;
    this.vy += (targetY - this.y) * spring;

    // Interactive mouse proximity push/attraction
    const mdx = this.x - state.mouseX;
    const mdy = this.y - state.mouseY;
    const mDist = Math.hypot(mdx, mdy);
    if (mDist < 100 && mDist > 0) {
      const force = (1 - mDist / 100) * 4;
      this.vx += (mdx / mDist) * force;
      this.vy += (mdy / mDist) * force;
    }

    this.vx *= friction;
    this.vy *= friction;

    this.x += this.vx * deltaFactor;
    this.y += this.vy * deltaFactor;
  }

  draw(ctx, themeColors) {
    const flicker = 0.8 + Math.sin(this.twinklePhase) * 0.2;
    const a = Math.min(Math.max(this.alpha * flicker, 0), 1);
    const c = themeColors[this.colorIdx];

    ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Extra luminous glow on crisp contour particles
    if (this.layer === 'contour' && this.size > 1.8) {
      ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${(a * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 2. Floating Romantic Ember / Stardust
class FloatingEmber {
  constructor() {
    this.reset(true);
  }

  reset(initial = false) {
    // Spawn near the heart contour or edges
    const t = Math.random() * Math.PI * 2;
    const pos = getHeartPosition(t);
    const spread = (Math.random() - 0.5) * 40;

    this.x = state.centerX + pos.x * state.baseScale + spread;
    this.y = state.centerY + pos.y * state.baseScale + spread;

    if (initial) {
      // Scatter throughout screen initially
      this.x = Math.random() * width;
      this.y = Math.random() * height;
    }

    // Drifting velocity: floating gently upward and outward
    const angle = Math.atan2(this.y - state.centerY, this.x - state.centerX);
    const speed = Math.random() * 0.9 + 0.3;
    this.vx = Math.cos(angle) * speed * 0.6 + (Math.random() - 0.5) * 0.4;
    this.vy = Math.sin(angle) * speed * 0.6 - Math.random() * 0.8; // upwards drift

    this.size = Math.random() * 1.8 + 0.6;
    this.maxLife = Math.random() * 120 + 80;
    this.life = initial ? Math.random() * this.maxLife : this.maxLife;
    this.colorIdx = Math.floor(Math.random() * 4);
  }

  update(deltaFactor) {
    this.x += this.vx * deltaFactor;
    this.y += this.vy * deltaFactor;
    this.life -= deltaFactor;

    if (this.life <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.reset();
    }
  }

  draw(ctx, themeColors) {
    const progress = this.life / this.maxLife;
    const alpha = Math.sin(progress * Math.PI) * 0.65;
    const c = themeColors[this.colorIdx];

    ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 3. Mini Floating <3 Heart Sparkles (On Click/Burst)
class MiniHeart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = -(Math.random() * 4 + 2);
    this.scale = (Math.random() * 0.35 + 0.2) * (state.baseScale / 18);
    this.rotation = (Math.random() - 0.5) * 0.6;
    this.rotSpeed = (Math.random() - 0.5) * 0.04;
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.012;
  }

  update(deltaFactor) {
    this.x += this.vx * deltaFactor;
    this.y += this.vy * deltaFactor;
    this.rotation += this.rotSpeed * deltaFactor;
    this.alpha -= this.decay * deltaFactor;
    return this.alpha > 0.01;
  }

  draw(ctx, accentColor) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = accentColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = accentColor;

    // Draw miniature <3 shape
    ctx.beginPath();
    ctx.moveTo(0, -5);
    for (let t = 0; t <= Math.PI * 2; t += 0.15) {
      const p = getHeartPosition(t);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// --- Population Generation ---
let heartParticles = [];
let floatingEmbers = [];
let miniHearts = [];

function populateParticles() {
  heartParticles = [];
  floatingEmbers = [];

  const totalHeartCount = 2600;

  // 1. Crisp Outer Contour Particles (55% of particles)
  const contourCount = Math.floor(totalHeartCount * 0.55);
  for (let i = 0; i < contourCount; i++) {
    const t = Math.random() * Math.PI * 2;
    // Slight variance near edge for natural luminous sparkle
    const r = 1 + (Math.random() - 0.5) * 0.04;
    heartParticles.push(new HeartParticle(t, r, 'contour'));
  }

  // 2. Soft Glowing Body & Interior (45% of particles)
  const bodyCount = totalHeartCount - contourCount;
  for (let i = 0; i < bodyCount; i++) {
    const t = Math.random() * Math.PI * 2;
    // Power distribution for beautiful edge-biased gradient
    const r = Math.pow(Math.random(), 0.55);
    heartParticles.push(new HeartParticle(t, r, 'body'));
  }

  // 3. Ambient Floating Embers (350 embers)
  const emberCount = 380;
  for (let i = 0; i < emberCount; i++) {
    floatingEmbers.push(new FloatingEmber());
  }
}

populateParticles();

// --- Cardiac Pulse ECG Dynamics ---
let beatPhase = 0;
let lastBeatThump = 0;
let lastTime = performance.now();
const BPM = 70; // Romantic, resting heartbeat tempo

function getBeatScale(phase) {
  // Classic cardiac double-thump:
  // Phase 0.00 - 0.12: primary contraction (Lub)
  // Phase 0.18 - 0.30: secondary rebound (Dub)
  // Phase 0.30 - 1.00: tender breathing resting diastole
  if (phase < 0.12) {
    return 1 + Math.sin((phase / 0.12) * Math.PI) * 0.18;
  } else if (phase >= 0.18 && phase < 0.30) {
    return 1 + Math.sin(((phase - 0.18) / 0.12) * Math.PI) * 0.09;
  } else {
    // Gentle breathing wave
    return 1 + Math.sin(phase * Math.PI * 2) * 0.015;
  }
}

// --- Main Animation Render Loop ---
function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;
  const deltaFactor = delta * 60;

  // Velvety Motion Blur Trail
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(3, 1, 6, 0.18)';
  ctx.fillRect(0, 0, width, height);

  // Cardiac BPM Progression
  const cycleDuration = 60 / BPM;
  beatPhase = (beatPhase + delta / cycleDuration) % 1;

  // Sound triggers on heartbeat peaks
  if (beatPhase < 0.1 && currentTime - lastBeatThump > cycleDuration * 600) {
    audio.playThump(false);
    lastBeatThump = currentTime;
  } else if (beatPhase >= 0.18 && beatPhase < 0.22 && currentTime - lastBeatThump > cycleDuration * 160) {
    audio.playThump(true);
  }

  const currentBeatScale = getBeatScale(beatPhase);
  const currentTheme = THEMES[state.themeIndex];

  // Luminous Additive Blending
  ctx.globalCompositeOperation = 'lighter';

  // 1. Draw Floating Embers
  for (let i = 0; i < floatingEmbers.length; i++) {
    const ember = floatingEmbers[i];
    ember.update(deltaFactor);
    ember.draw(ctx, currentTheme.colors);
  }

  // 2. Draw Heart Particles
  for (let i = 0; i < heartParticles.length; i++) {
    const p = heartParticles[i];
    p.update(currentBeatScale, deltaFactor);
    p.draw(ctx, currentTheme.colors);
  }

  // 3. Draw Mini Floating Hearts
  for (let i = miniHearts.length - 1; i >= 0; i--) {
    const mini = miniHearts[i];
    if (mini.update(deltaFactor)) {
      mini.draw(ctx, currentTheme.accent);
    } else {
      miniHearts.splice(i, 1);
    }
  }
}

requestAnimationFrame(animate);

// --- Interactions & Triggers ---
function triggerHeartBurst() {
  audio.playChime();

  // Burst main heart particles outwards
  for (let i = 0; i < heartParticles.length; i++) {
    heartParticles[i].explode(1.2);
  }

  // Spawn mini floating <3 hearts
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 40;
    miniHearts.push(new MiniHeart(state.centerX + Math.cos(angle) * r, state.centerY + Math.sin(angle) * r));
  }
}

// Window Resize
window.addEventListener('resize', () => {
  updateDimensions();
  populateParticles();
});

// Mouse & Touch Tracking
window.addEventListener('mousemove', (e) => {
  state.mouseX = e.clientX;
  state.mouseY = e.clientY;
});

window.addEventListener('mouseleave', () => {
  state.mouseX = -9999;
  state.mouseY = -9999;
});

// Click / Tap on Screen
canvas.addEventListener('click', (e) => {
  audio.init();
  triggerHeartBurst();
});

// Touch support for phones
canvas.addEventListener('touchstart', (e) => {
  audio.init();
  if (e.touches.length > 0) {
    state.mouseX = e.touches[0].clientX;
    state.mouseY = e.touches[0].clientY;
  }
  triggerHeartBurst();
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    state.mouseX = e.touches[0].clientX;
    state.mouseY = e.touches[0].clientY;
  }
}, { passive: true });

canvas.addEventListener('touchend', () => {
  state.mouseX = -9999;
  state.mouseY = -9999;
});

// Buttons
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
  state.themeIndex = (state.themeIndex + 1) % THEMES.length;
  const theme = THEMES[state.themeIndex];
  document.documentElement.style.setProperty('--primary-pink', theme.accent);
  document.documentElement.style.setProperty('--secondary-glow', theme.colors[1] ? `rgb(${theme.colors[1].r},${theme.colors[1].g},${theme.colors[1].b})` : theme.accent);

  const dot = themeBtn.querySelector('.color-dot');
  if (dot) {
    dot.style.background = theme.accent;
    dot.style.boxShadow = `0 0 8px ${theme.accent}`;
  }
});

const soundBtn = document.getElementById('soundBtn');
const soundIcon = document.getElementById('soundIcon');
soundBtn.addEventListener('click', () => {
  audio.init();
  state.soundEnabled = !state.soundEnabled;
  soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
  soundBtn.style.borderColor = state.soundEnabled ? 'var(--primary-pink)' : 'rgba(255, 255, 255, 0.15)';
  if (state.soundEnabled) {
    audio.playThump(false);
  }
});

const burstBtn = document.getElementById('burstBtn');
burstBtn.addEventListener('click', () => {
  audio.init();
  triggerHeartBurst();
});

const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Spacebar to burst
window.addEventListener('keydown', (e) => {
  if (e.target.getAttribute('contenteditable') === 'true') return;
  if (e.code === 'Space') {
    e.preventDefault();
    audio.init();
    triggerHeartBurst();
  }
});
