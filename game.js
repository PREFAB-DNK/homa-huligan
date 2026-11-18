/* ============================================================
   ХОМА-ХУЛИГАН — игровой движок
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const normAngle = (a) => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };

  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const hud = $('hud');
  const SAVE_KEY = 'homaHuliganSaveV1';
  const MAX_LEVELS = 4;
  const START_RADIUS = 20;

  function defaultSave() {
    return { stars: {}, unlocked: 1, muted: false, lastLevel: 1, played: false, words: {} };
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const data = JSON.parse(raw);
      const base = defaultSave();
      base.stars = data.stars && typeof data.stars === 'object' ? data.stars : {};
      base.unlocked = clamp(Number(data.unlocked) || 1, 1, MAX_LEVELS);
      base.muted = !!data.muted;
      base.lastLevel = clamp(Number(data.lastLevel) || 1, 1, MAX_LEVELS);
      base.played = !!data.played;
      base.words = data.words && typeof data.words === 'object' ? data.words : {};
      return base;
    } catch (e) {
      return defaultSave();
    }
  }
  const save = loadSave();
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* private mode */ }
  }
  function totalStars() {
    let n = 0;
    for (let i = 1; i <= MAX_LEVELS; i++) n += Number(save.stars[i]) || 0;
    return n;
  }
  function starsFor(id) { return Number(save.stars[id]) || 0; }
  function wordsLearnedCount() { return Object.keys(save.words || {}).length; }
  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }
  function firstUnfinished() {
    for (let i = 1; i <= MAX_LEVELS; i++) if (!starsFor(i)) return i;
    return 1;
  }

  // ============================================================
  // Sound
  // ============================================================
  const Sound = (function () {
    let ac = null;
    let master = null;
    let musicGain = null;
    let sfxGain = null;
    let noiseBuffer = null;
    let musicTimer = null;
    let active = false;
    let mood = 'calm';
    let step = 0;
    let nextNote = 0;

    const CALM_MELODY = [72, null, 76, 79, 76, null, 74, 77, 72, null, 76, 79, 84, 79, 76, null];
    const CALM_BASS = [48, null, null, null, 53, null, null, null, 50, null, null, null, 55, null, null, null];
    const CHASE_MELODY = [69, 72, 74, null, 76, 74, 72, 69, 69, 72, 76, 79, 77, 74, 72, null];
    const CHASE_BASS = [45, null, 45, null, 48, null, 48, null, 43, null, 43, null, 50, null, 50, null];

    function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

    function makeNoise() {
      const length = Math.floor(ac.sampleRate * 0.4);
      const buffer = ac.createBuffer(1, length, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    function ensure() {
      if (ac) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ac = new AC();
        master = ac.createGain();
        master.gain.value = save.muted ? 0 : 0.85;
        master.connect(ac.destination);
        musicGain = ac.createGain();
        musicGain.gain.value = 0.24;
        musicGain.connect(master);
        sfxGain = ac.createGain();
        sfxGain.gain.value = 0.8;
        sfxGain.connect(master);
        noiseBuffer = makeNoise();
        return true;
      } catch (e) {
        ac = null;
        return false;
      }
    }

    function osc(freq, when, dur, type, vol, dest) {
      if (!ac) return;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(Math.max(30, freq), when);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      g.connect(dest || sfxGain);
      o.start(when);
      o.stop(when + dur + 0.02);
    }

    function glide(freq1, freq2, when, dur, type, vol, dest) {
      if (!ac) return;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(Math.max(30, freq1), when);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, freq2), when + dur);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(dest || sfxGain);
      o.start(when); o.stop(when + dur + 0.02);
    }

    function noise(when, dur, vol, freq, dest) {
      if (!ac || !noiseBuffer) return;
      const src = ac.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = freq || 1200;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      src.connect(filter); filter.connect(g); g.connect(dest || sfxGain);
      src.start(when); src.stop(when + dur);
    }

    function scheduler() {
      if (!ac || !active) return;
      if (!ac || ac.state === 'suspended') return;
      const beat = mood === 'chase' ? 0.205 : 0.285;
      const melody = mood === 'chase' ? CHASE_MELODY : CALM_MELODY;
      const bass = mood === 'chase' ? CHASE_BASS : CALM_BASS;
      while (nextNote < ac.currentTime + 0.26) {
        const i = step % 16;
        if (melody[i] != null) {
          osc(midi(melody[i]), nextNote, beat * 1.35, 'triangle', 0.09, musicGain);
          if (mood === 'chase' && i % 4 === 0) osc(midi(melody[i] + 12), nextNote, beat, 'square', 0.018, musicGain);
        }
        if (bass[i] != null) osc(midi(bass[i]), nextNote, beat * 2.2, 'sine', 0.11, musicGain);
        if (i % 2 === 0) noise(nextNote, 0.035, mood === 'chase' ? 0.035 : 0.018, 4500, musicGain);
        nextNote += beat;
        step++;
      }
    }

    function setActive(v) {
      if (v) {
        if (!ensure()) return;
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        if (!active) {
          active = true;
          step = 0;
          nextNote = ac.currentTime + 0.08;
          if (!musicTimer) musicTimer = setInterval(scheduler, 70);
        }
      } else {
        active = false;
      }
    }

    function setMood(m) {
      if (m === mood) return;
      mood = m;
      if (ac) {
        step = 0;
        nextNote = ac.currentTime + 0.05;
      }
    }

    function setEnabled(v) {
      if (ac && master) {
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(v ? 0.85 : 0, ac.currentTime, 0.05);
      }
    }

    function unlock() {
      if (!ensure()) return;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
    }

    function play(name) {
      if (!ensure()) return;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const t = ac.currentTime + 0.005;
      switch (name) {
        case 'click':
          osc(740, t, 0.055, 'triangle', 0.12);
          osc(980, t + 0.035, 0.05, 'triangle', 0.09);
          break;
        case 'pop':
          glide(360, 760, t, 0.12, 'sine', 0.22);
          break;
        case 'crash':
          noise(t, 0.18, 0.28, 1500);
          glide(190, 70, t, 0.22, 'triangle', 0.18);
          break;
        case 'seed':
          [1046, 1318, 1568].forEach((f, i) => osc(f, t + i * 0.055, 0.15, 'sine', 0.12));
          break;
        case 'dash':
          noise(t, 0.13, 0.16, 2200);
          glide(280, 620, t, 0.15, 'sawtooth', 0.06);
          break;
        case 'hide':
          glide(420, 180, t, 0.2, 'sine', 0.16);
          break;
        case 'alert':
          osc(620, t, 0.09, 'square', 0.12);
          osc(880, t + 0.08, 0.12, 'square', 0.1);
          break;
        case 'catch':
          glide(640, 130, t, 0.55, 'sawtooth', 0.18);
          noise(t + 0.15, 0.2, 0.18, 900);
          break;
        case 'win':
          [523, 659, 784, 1046, 1318].forEach((f, i) => osc(f, t + i * 0.11, 0.34, 'triangle', 0.2));
          break;
        case 'lose':
          [392, 330, 262].forEach((f, i) => osc(f, t + i * 0.12, 0.22, 'triangle', 0.13));
          break;
        default: break;
      }
    }

    return { unlock, setActive, setMood, setEnabled, play, isReady: () => !!ac };
  })();

  // ============================================================
  // Game state
  // ============================================================
  const G = {
    mode: 'menu',
    level: null,
    levelIndex: 0,
    staticCanvas: null,
    solids: [],
    player: null,
    enemies: [],
    tasks: [],
    seeds: [],
    words: [],
    hides: [],
    particles: [],
    floats: [],
    currentWord: null,
    wordReturnMode: 'play',
    wordSpeakTimer: 0,
    camera: { x: 0, y: 0, zoom: 0.9 },
    view: { w: 390, h: 844, dpr: 1 },
    nav: null,
    time: 0,
    last: 0,
    levelTime: 0,
    shake: 0,
    caught: 0,
    doneCount: 0,
    exitActive: false,
    nearHide: null,
    catchTimer: 0,
    catchEnemy: null,
    finishTimer: 0,
    result: null,
    bannerQueue: [],
    bannerTimer: 0,
    bannerUntil: 0,
    bannerActive: false,
    toastUntil: 0,
    coachUntil: 0,
    coachPending: null,
    hudTick: 0,
    compassTarget: null,
    tutorial: { moved: false, hide: false, task: false, chase: false, vacuum: false },
    lastProgress: 0,
    seenLevelTip: {},
    keys: new Set(),
    joystick: { active: false, pointerId: null, cx: 0, cy: 0, x: 0, y: 0 },
    moveInput: { x: 0, y: 0, mag: 0 },
    lastSafe: null,
    muted: save.muted
  };

  // ============================================================
  // Helpers
  // ============================================================
  function safePoint(x, y) {
    const lvl = G.level;
    if (!lvl) return { x, y };
    const minX = 36 + START_RADIUS + 2;
    const maxX = lvl.world.w - 36 - START_RADIUS - 2;
    const minY = 36 + START_RADIUS + 2;
    const maxY = lvl.world.h - 36 - START_RADIUS - 2;
    for (let r = 0; r <= 280; r += 32) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const px = clamp(x + Math.cos(a) * r, minX, maxX);
        const py = clamp(y + Math.sin(a) * r, minY, maxY);
        if (!circleHitsSolid(px, py, START_RADIUS - 1)) return { x: px, y: py };
      }
    }
    return { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
  }

  function circleHitsSolid(x, y, r, solids) {
    const list = solids || G.solids;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const cx = clamp(x, s.x, s.x + s.w);
      const cy = clamp(y, s.y, s.y + s.h);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  function pointInSolid(x, y) {
    for (let i = 0; i < G.solids.length; i++) {
      const s = G.solids[i];
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
    }
    return false;
  }

  function lineClear(x1, y1, x2, y2, r) {
    const d = dist(x1, y1, x2, y2);
    const steps = Math.max(1, Math.ceil(d / 16));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (circleHitsSolid(lerp(x1, x2, t), lerp(y1, y2, t), r || 2)) return false;
    }
    return true;
  }

  function moveActor(a, dx, dy, r) {
    const lvl = G.level;
    if (!lvl) return;
    const prevX = a.x;
    const prevY = a.y;
    a.x += dx;
    for (let i = 0; i < G.solids.length; i++) {
      const s = G.solids[i];
      if (a.x + r > s.x && a.x - r < s.x + s.w && a.y + r > s.y && a.y - r < s.y + s.h) {
        const wasOverlapping = prevX + r > s.x && prevX - r < s.x + s.w;
        if (dx > 0) a.x = (!wasOverlapping || prevX <= s.x) ? Math.min(a.x, s.x - r) : Math.max(a.x, s.x + s.w + r);
        else if (dx < 0) a.x = (!wasOverlapping || prevX >= s.x + s.w) ? Math.max(a.x, s.x + s.w + r) : Math.min(a.x, s.x - r);
        else {
          const left = s.x - r;
          const right = s.x + s.w + r;
          a.x = Math.abs(a.x - left) < Math.abs(a.x - right) ? left : right;
        }
      }
    }
    a.y += dy;
    for (let i = 0; i < G.solids.length; i++) {
      const s = G.solids[i];
      if (a.x + r > s.x && a.x - r < s.x + s.w && a.y + r > s.y && a.y - r < s.y + s.h) {
        const wasOverlapping = prevY + r > s.y && prevY - r < s.y + s.h;
        if (dy > 0) a.y = (!wasOverlapping || prevY <= s.y) ? Math.min(a.y, s.y - r) : Math.max(a.y, s.y + s.h + r);
        else if (dy < 0) a.y = (!wasOverlapping || prevY >= s.y + s.h) ? Math.max(a.y, s.y + s.h + r) : Math.min(a.y, s.y - r);
        else {
          const top = s.y - r;
          const bottom = s.y + s.h + r;
          a.y = Math.abs(a.y - top) < Math.abs(a.y - bottom) ? top : bottom;
        }
      }
    }
    a.x = clamp(a.x, 36 + r, lvl.world.w - 36 - r);
    a.y = clamp(a.y, 36 + r, lvl.world.h - 36 - r);
  }

  function computeZoom() {
    const base = Math.min(G.view.w / 760, G.view.h / 760);
    if (!G.level) return clamp(base, 0.7, 1.15);
    const cover = Math.max(G.view.w / G.level.world.w, G.view.h / G.level.world.h) * 1.015;
    return clamp(Math.max(base, cover), 0.7, 1.35);
  }

  function viewWorldSize() {
    return { w: G.view.w / G.camera.zoom, h: G.view.h / G.camera.zoom };
  }

  function clampCamera(immediate) {
    if (!G.level) return;
    const v = viewWorldSize();
    const maxX = Math.max(0, G.level.world.w - v.w);
    const maxY = Math.max(0, G.level.world.h - v.h);
    const tx = clamp(G.player.x - v.w / 2, 0, maxX);
    const ty = clamp(G.player.y - v.h / 2, 0, maxY);
    if (immediate) {
      G.camera.x = tx;
      G.camera.y = ty;
    } else {
      G.camera.x = lerp(G.camera.x, tx, 0.16);
      G.camera.y = lerp(G.camera.y, ty, 0.16);
    }
  }

  function resize() {
    const vw = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 390);
    const vh = Math.max(320, window.innerHeight || document.documentElement.clientHeight || 844);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    G.view = { w: vw, h: vh, dpr };
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    G.camera.zoom = computeZoom();
    if (G.level && G.player) clampCamera(true);
    G.joystick.active = false;
    G.joystick.pointerId = null;
    resetStickVisual();
    updateJoystickDefault();
  }

  // ============================================================
  // Level loading
  // ============================================================
  function buildSolids(level) {
    const solids = [];
    level.walls.forEach((w) => solids.push({ x: w.x, y: w.y, w: w.w, h: w.h }));
    level.furniture.forEach((f) => {
      if (f.flat) return;
      if (f.kind === 'nest') return;
      solids.push({ x: f.x, y: f.y, w: f.w, h: f.h });
    });
    return solids;
  }

  function levelNav(level) {
    const cell = 40;
    const cols = Math.ceil(level.world.w / cell);
    const rows = Math.ceil(level.world.h / cell);
    const blocked = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * cell + cell / 2;
        const py = y * cell + cell / 2;
        if (circleHitsSolid(px, py, 18, G.solids)) blocked[y * cols + x] = 1;
      }
    }
    return { cell, cols, rows, blocked };
  }

  function cellIndex(x, y) {
    const n = G.nav;
    if (!n) return -1;
    const cx = clamp(Math.floor(x / n.cell), 0, n.cols - 1);
    const cy = clamp(Math.floor(y / n.cell), 0, n.rows - 1);
    return cy * n.cols + cx;
  }

  function nearestFreeCell(x, y) {
    const n = G.nav;
    if (!n) return -1;
    const start = cellIndex(x, y);
    if (start < 0) return -1;
    if (!n.blocked[start]) return start;
    const sx = start % n.cols;
    const sy = Math.floor(start / n.cols);
    for (let r = 1; r <= 7; r++) {
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
          const nx = sx + ox;
          const ny = sy + oy;
          if (nx < 0 || ny < 0 || nx >= n.cols || ny >= n.rows) continue;
          const idx = ny * n.cols + nx;
          if (!n.blocked[idx]) return idx;
        }
      }
    }
    return -1;
  }

  function findPath(sx, sy, tx, ty) {
    const n = G.nav;
    if (!n) return null;
    const start = nearestFreeCell(sx, sy);
    const goal = nearestFreeCell(tx, ty);
    if (start < 0 || goal < 0) return null;
    if (start === goal) return [{ x: tx, y: ty }];
    const total = n.cols * n.rows;
    const gScore = new Float32Array(total);
    gScore.fill(Infinity);
    const fScore = new Float32Array(total);
    fScore.fill(Infinity);
    const came = new Int32Array(total);
    came.fill(-1);
    const closed = new Uint8Array(total);
    const heap = [];
    const gx = goal % n.cols;
    const gy = Math.floor(goal / n.cols);
    const h = (idx) => {
      const x = idx % n.cols;
      const y = Math.floor(idx / n.cols);
      const dx = Math.abs(x - gx);
      const dy = Math.abs(y - gy);
      return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
    };
    function push(idx, f) {
      heap.push({ idx, f });
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p].f <= heap[i].f) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
    }
    function pop() {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length && last) {
        heap[0] = last;
        let i = 0;
        const len = heap.length;
        while (true) {
          let l = i * 2 + 1;
          let r = l + 1;
          let smallest = i;
          if (l < len && heap[l].f < heap[smallest].f) smallest = l;
          if (r < len && heap[r].f < heap[smallest].f) smallest = r;
          if (smallest === i) break;
          [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
          i = smallest;
        }
      }
      return top;
    }
    gScore[start] = 0;
    fScore[start] = h(start);
    push(start, fScore[start]);
    const dirs = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
    ];
    let guard = 0;
    while (heap.length && guard++ < 9000) {
      const cur = pop().idx;
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === goal) break;
      const cx = cur % n.cols;
      const cy = Math.floor(cur / n.cols);
      for (let d = 0; d < dirs.length; d++) {
        const nx = cx + dirs[d][0];
        const ny = cy + dirs[d][1];
        if (nx < 0 || ny < 0 || nx >= n.cols || ny >= n.rows) continue;
        const ni = ny * n.cols + nx;
        if (n.blocked[ni] || closed[ni]) continue;
        if (dirs[d][0] !== 0 && dirs[d][1] !== 0) {
          if (n.blocked[cy * n.cols + nx] || n.blocked[ny * n.cols + cx]) continue;
        }
        const tentative = gScore[cur] + dirs[d][2];
        if (tentative < gScore[ni]) {
          came[ni] = cur;
          gScore[ni] = tentative;
          fScore[ni] = tentative + h(ni);
          push(ni, fScore[ni]);
        }
      }
    }
    if (came[goal] === -1 && goal !== start) return null;
    const path = [];
    let cur = goal;
    let guard2 = 0;
    while (cur !== -1 && guard2++ < 300) {
      const x = (cur % n.cols) * n.cell + n.cell / 2;
      const y = Math.floor(cur / n.cols) * n.cell + n.cell / 2;
      path.push({ x, y });
      if (cur === start) break;
      cur = came[cur];
    }
    path.reverse();
    if (path.length) path[path.length - 1] = { x: tx, y: ty };
    return path;
  }

  function startLevelByIndex(index, opts) {
    if (index < 0 || index >= LEVELS.length) return;
    const options = opts || {};
    G.levelIndex = index;
    G.level = LEVELS[index];
    G.player = {
      x: G.level.spawn.x,
      y: G.level.spawn.y,
      vx: 0,
      vy: 0,
      facing: 1,
      speed: 188,
      r: START_RADIUS,
      dash: 0,
      dashCd: 0,
      dashDir: { x: 1, y: 0 },
      invuln: 1.4,
      hidden: false,
      hideSpot: null,
      saved: null,
      hideTimer: 0,
      hideCooldown: 0,
      moving: false
    };
    G.solids = buildSolids(G.level);
    G.staticCanvas = Art.buildStatic(G.level);
    G.tasks = G.level.tasks.map((t) => ({ ...t, done: false, pop: 0 }));
    G.seeds = G.level.seeds.map((s) => ({ ...s, collected: false }));
    G.words = G.level.words.map((w) => ({ ...w, collected: false }));
    G.hides = G.level.hides.map((h) => ({ ...h }));
    G.enemies = G.level.enemies.map((cfg, i) => ({
      ...cfg,
      id: i,
      x: cfg.x,
      y: cfg.y,
      vx: 0,
      vy: 0,
      facing: 1,
      angle: 0,
      radius: 18,
      state: cfg.sleep ? 'sleep' : (cfg.activateAfter ? 'off' : (cfg.startDelay ? 'inactive' : 'patrol')),
      wpIndex: 0,
      wait: 0.3 + Math.random() * 0.6,
      path: null,
      pathTime: 0,
      chaseTime: 0,
      lostTime: 0,
      lastSeen: null,
      bubble: '',
      bubbleUntil: 0,
      alertCooldown: 0,
      respawnGrace: 1.2,
      delayLeft: cfg.startDelay || 0,
      moving: false,
      sleeping: !!cfg.sleep
    }));
    G.particles = [];
    G.floats = [];
    G.currentWord = null;
    G.wordReturnMode = 'play';
    clearTimeout(G.wordSpeakTimer);
    G.doneCount = 0;
    G.caught = 0;
    G.exitActive = false;
    G.nearHide = null;
    G.lastSafe = { x: G.player.x, y: G.player.y };
    G.catchEnemy = null;
    G.catchTimer = 0;
    G.finishTimer = 0;
    G.result = null;
    G.shake = 0;
    G.levelTime = 0;
    G.lastProgress = 0;
    G.tutorial = { moved: false, hide: false, task: false, chase: false, vacuum: false };
    G.bannerQueue = [];
    G.bannerTimer = 0;
    G.bannerActive = false;
    G.coachUntil = 0;
    G.coachPending = null;
    G.mode = 'intro';
    G.camera.zoom = computeZoom();
    clampCamera(true);
    G.nav = levelNav(G.level);
    hud.classList.add('hidden');
    $('catchFlash').classList.remove('show');
    $('toast').classList.remove('show');
    $('eventBanner').classList.remove('show');
    $('coach').classList.remove('show');
    $('wordCardModal').classList.remove('show');
    $('wordBookModal').classList.remove('show');
    $('btnHide').classList.remove('show', 'hidden-mode');
    $('btnDash').classList.remove('cooling');
    G.joystick.active = false;
    G.joystick.pointerId = null;
    resetStickVisual();
    save.lastLevel = index + 1;
    save.played = true;
    persist();
    updateLevelChrome();
    if (options.skipIntro) {
      beginPlay();
    } else {
      showIntro();
    }
  }

  function showIntro() {
    const lvl = G.level;
    if (!lvl) return;
    G.mode = 'intro';
    Sound.setActive(false);
    hud.classList.add('hidden');
    $('introBadge').textContent = 'УРОВЕНЬ ' + lvl.id;
    $('introEmoji').textContent = lvl.art;
    $('introTitle').textContent = lvl.name;
    $('introPlace').textContent = lvl.place + ' · ' + lvl.short;
    $('introDesc').textContent = lvl.intro.desc;
    $('introGoals').innerHTML = lvl.intro.goals.map((g) => '<div class="intro-goal"><span class="g-dot"></span><span>' + escapeHtml(g) + '</span></div>').join('');
    const icons = { mom: '👩', cat: '🐱', vacuum: '🤖' };
    $('introEnemies').innerHTML = lvl.enemies.map((e) => {
      const extra = (e.sleep || e.activateAfter) ? ' <small>спит</small>' : '';
      return '<span class="enemy-tag">' + (icons[e.type] || '⚠') + ' ' + escapeHtml(e.name) + extra + '</span>';
    }).join('');
    $('introStartSub').textContent = 'вперёд, за шалостями';
    showScreen('screenIntro');
  }

  function beginPlay() {
    if (!G.level) return;
    hideScreens();
    hud.classList.remove('hidden');
    G.mode = 'play';
    G.levelTime = 0;
    G.lastProgress = 0;
    Sound.setActive(true);
    Sound.setMood('calm');
    G.player.invuln = 1.4;
    G.camera.zoom = computeZoom();
    clampCamera(true);
    enqueueBanner(G.level.place + ' · ' + G.level.name, 'gold', 2200);
    if (G.level.id === 1) {
      G.coachPending = { text: 'Веди пальцем по левой стороне — Хома побежит', at: G.time + 0.9, duration: 4.8 };
    }
    G.last = performance.now();
  }

  // ============================================================
  // Screens / menu UI
  // ============================================================
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    if (id === 'screenResult') {
      const card = document.querySelector('#screenResult .result-card');
      if (card) card.scrollTop = 0;
    }
  }
  function hideScreens() {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function updateSoundUI() {
    const glyph = save.muted ? '✕' : '♪';
    ['muteIcon', 'soundGlyph', 'pauseSoundGlyph'].forEach((id) => {
      const el = $(id);
      if (el) el.textContent = glyph;
    });
    $('btnMute').classList.toggle('muted', save.muted);
    $('btnTitleSound').classList.toggle('muted', save.muted);
    $('btnSoundTitle').classList.toggle('muted', save.muted);
    $('btnPauseMute').classList.toggle('muted', save.muted);
    Sound.setEnabled(!save.muted);
  }

  function updateTitleUI() {
    const total = totalStars();
    const wordCount = wordsLearnedCount();
    $('titleStars').textContent = total + ' из 12 звёзд · 📖 ' + wordCount + ' ' + plural(wordCount, 'слово', 'слова', 'слов');
    const next = firstUnfinished();
    const levelsDone = LEVELS.every((lvl) => starsFor(lvl.id) > 0);
    if (levelsDone) {
      $('playLabel').textContent = 'ИГРАТЬ СНОВА';
      $('playSub').textContent = total >= 12 ? 'все 12 звёзд — вау!' : 'все 4 уровня пройдены';
    } else {
      const lvl = LEVELS[next - 1];
      $('playLabel').textContent = save.played ? 'ПРОДОЛЖИТЬ' : 'ИГРАТЬ';
      $('playSub').textContent = save.played ? 'уровень ' + next + ' · ' + lvl.name : 'с самого начала';
    }
    $('levelsSub').textContent = total + ' из 12 звёзд';
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    $('iosTip').classList.toggle('hidden', !isIos || !!window.navigator.standalone);
    $('levelsStars').textContent = total + '/12';
    updateSoundUI();
  }

  function levelCardMarkup(level, idx) {
    const unlocked = level.id <= save.unlocked;
    const s = starsFor(level.id);
    const starHtml = [1, 2, 3].map((i) => '<span class="' + (i <= s ? 'on' : '') + '">★</span>').join('');
    const lock = unlocked ? '' : '<div class="card-lock"><span>🔒</span><span>Пройди уровень ' + (level.id - 1) + '</span></div>';
    return '<button class="level-card' + (unlocked ? '' : ' locked') + '" data-level="' + idx + '" ' + (unlocked ? '' : 'tabindex="-1"') + '>' +
      '<div class="card-art" style="background:' + level.cardColor + '"><span class="card-num">' + level.id + '</span><span>' + level.art + '</span></div>' +
      '<div class="card-body"><div class="card-place">' + escapeHtml(level.place) + '</div>' +
      '<div class="card-name">' + escapeHtml(level.name) + '</div>' +
      '<div class="card-desc">' + escapeHtml(level.short) + ' · ' + level.tasks.length + ' шалостей · ' + level.words.length + ' слова</div>' +
      '<div class="card-stars">' + starHtml + '</div></div>' + lock + '</button>';
  }

  function renderLevels() {
    $('levelsGrid').innerHTML = LEVELS.map((lvl, i) => levelCardMarkup(lvl, i)).join('');
    $('levelsStars').textContent = totalStars() + '/12';
  }

  function showLevels() {
    G.mode = 'menu';
    Sound.setActive(false);
    hud.classList.add('hidden');
    $('catchFlash').classList.remove('show');
    renderLevels();
    updateTitleUI();
    showScreen('screenLevels');
  }

  function goHome() {
    G.mode = 'menu';
    Sound.setActive(false);
    hud.classList.add('hidden');
    $('catchFlash').classList.remove('show');
    $('toast').classList.remove('show');
    hideScreens();
    showScreen('screenTitle');
    updateTitleUI();
    G.level = null;
    G.staticCanvas = null;
    G.player = null;
    G.enemies = [];
    G.tasks = [];
    G.seeds = [];
    G.words = [];
    G.hides = [];
    G.solids = [];
    G.nav = null;
    G.particles = [];
    G.floats = [];
    G.currentWord = null;
    clearTimeout(G.wordSpeakTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    $('wordCardModal').classList.remove('show');
    $('wordBookModal').classList.remove('show');
    G.camera.x = 0;
    G.camera.y = 0;
  }

  function pauseGame() {
    if (G.mode !== 'play') return;
    G.mode = 'paused';
    Sound.setActive(false);
    G.joystick.active = false;
    G.joystick.pointerId = null;
    resetStickVisual();
    hud.classList.add('hidden');
    hideCoach();
    $('btnPauseWords').textContent = '📖 Слова (' + wordsLearnedCount() + ')';
    showScreen('screenPause');
  }

  function resumeGame() {
    if (G.mode !== 'paused') return;
    G.mode = 'play';
    hideScreens();
    hud.classList.remove('hidden');
    Sound.setActive(true);
    G.last = performance.now();
    G.player.invuln = Math.max(G.player.invuln, 0.8);
  }

  function openHelp() {
    $('helpModal').classList.add('show');
    Sound.play('click');
  }
  function closeHelp() {
    $('helpModal').classList.remove('show');
  }

  function resetProgress() {
    if (!window.confirm('Точно сбросить все звёзды и открытые уровни?')) return;
    const fresh = defaultSave();
    Object.keys(save).forEach((k) => delete save[k]);
    Object.assign(save, fresh);
    persist();
    closeHelp();
    goHome();
    updateTitleUI();
    renderLevels();
    showToast('Прогресс сброшен. Начинаем заново!', 2600);
  }

  // ============================================================
  // Intro / result / finale
  // ============================================================
  function calculateStars() {
    let stars = 1;
    if (G.seeds.every((s) => s.collected)) stars += 1;
    if (G.caught <= 1) stars += 1;
    return clamp(stars, 1, 3);
  }

  function finishLevel() {
    if (G.mode !== 'play') return;
    G.mode = 'finishing';
    G.finishTimer = 0.95;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.moving = false;
    Sound.setActive(false);
    Sound.play('win');
    G.shake = 8;
    spawnBurst(G.player.x, G.player.y - 35, ['#ffd15c', '#ff9f7a', '#7cc7e8', '#9bce9c', '#fff4d9'], 30, 300);
    enqueueBanner('УРА! НОРКА БЛИЗКО!', 'gold', 1800);
  }

  function showResults() {
    const lvl = G.level;
    if (!lvl) return;
    const stars = calculateStars();
    G.mode = 'result';
    const oldBest = starsFor(lvl.id);
    save.stars[lvl.id] = Math.max(oldBest, stars);
    save.unlocked = Math.max(save.unlocked, Math.min(MAX_LEVELS, lvl.id + 1));
    save.lastLevel = Math.min(MAX_LEVELS, lvl.id + 1);
    persist();
    const seconds = Math.max(1, Math.round(G.levelTime));
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    const seedCount = G.seeds.filter((s) => s.collected).length;
    const foundWords = G.words.filter((w) => w.collected);
    const caught = G.caught;
    G.result = { stars, seconds, seeds: seedCount, words: foundWords.length, caught };

    $('resultKicker').textContent = stars === 3 ? 'ИДЕАЛЬНЫЙ БАРДАК!' : 'УРОВЕНЬ ' + lvl.id + ' ПРОЙДЕН!';
    $('resultTitle').textContent = stars === 3 ? 'Вот это талант!' : (stars === 2 ? 'Отличный бардак!' : 'Бардак получился!');
    const starEls = $('resultStars').children;
    for (let i = 0; i < starEls.length; i++) starEls[i].classList.toggle('on', i < stars);
    $('resultNote').textContent = caught === 0
      ? 'Никто тебя так и не поймал. Хома-невидимка!'
      : (caught <= 1
        ? 'Почти никто не заметил. Мама только вздохнула.'
        : 'Зато было очень весело! Мама ещё отдышится.');
    $('resultStats').innerHTML =
      '<span class="stat-chip">✦ Шалости ' + G.doneCount + '/' + G.tasks.length + '</span>' +
      '<span class="stat-chip">🌻 Семечки ' + seedCount + '/3</span>' +
      '<span class="stat-chip">📖 Слова ' + foundWords.length + '/' + G.words.length + '</span>' +
      '<span class="stat-chip">🙈 Поймали ' + caught + '</span>' +
      '<span class="stat-chip">⏱ ' + mm + ':' + String(ss).padStart(2, '0') + '</span>';
    $('resultWords').innerHTML = foundWords.length
      ? '<div class="result-words-title">НОВЫЕ СЛОВА · нажми, чтобы услышать</div>' +
        '<div class="result-words-list">' + foundWords.map((w) =>
          '<button class="result-word" data-speak="' + escapeHtml(w.en) + '">' +
          '<span class="result-word-emoji">' + escapeHtml(w.emoji) + '</span>' +
          '<span class="result-word-text"><b>' + escapeHtml(w.en) + '</b><small>' + escapeHtml(w.ru) + '</small></span>' +
          '<span class="result-word-sound">🔊</span></button>'
        ).join('') + '</div>'
      : '<div class="result-words-empty">📖 Карточки слов ещё не собраны — поищи голубые карточки с «A»!</div>';
    $('resultArt').textContent = stars === 3 ? '🏆' : (lvl.id === 4 ? '🏡' : '🐹');
    $('btnResultNextLabel').textContent = lvl.id === 4 ? 'СМОТРЕТЬ ФИНАЛ' : 'ДАЛЬШЕ';
    const card = document.querySelector('#screenResult .result-card');
    card.classList.remove('reveal');
    void card.offsetWidth;
    card.classList.add('reveal');
    hud.classList.add('hidden');
    $('catchFlash').classList.remove('show');
    showScreen('screenResult');
    updateTitleUI();
  }

  function showFinale() {
    G.mode = 'finale';
    Sound.setActive(false);
    Sound.play('win');
    const total = totalStars();
    $('finaleText').textContent = total >= 12
      ? 'Мама выглянула из спальни, увидела гору подушек, улыбнулась и сказала: «Ну и бардак! Но какой же ты у меня любимый хулиган». Хома свернулся в самое уютное гнездо и заснул. А робот-пылесос до утра объезжал носки.'
      : 'Мама выглянула из спальни, увидела гору подушек, улыбнулась и сказала: «Ну и бардак! Но какой же ты у меня любимый хулиган». Хома свернулся в самое уютное гнездо и заснул. Завтра можно будет навести бардак ещё раз!';
    $('finaleStars').textContent = total + ' / 12';
    hud.classList.add('hidden');
    hideScreens();
    showScreen('screenFinale');
    updateTitleUI();
  }

  // ============================================================
  // Toast / banner / coach
  // ============================================================
  function showToast(text, ms) {
    $('toastText').textContent = text;
    $('toast').classList.add('show');
    G.toastUntil = G.time + (ms || 2300) / 1000;
  }
  function hideToast() {
    $('toast').classList.remove('show');
    G.toastUntil = 0;
  }
  function enqueueBanner(text, style, ms) {
    if (!text) return;
    G.bannerQueue.push({ text, style: style || 'coral', ms: ms || 2100 });
    if (G.bannerQueue.length > 4) G.bannerQueue.shift();
    if (!G.bannerActive) nextBanner();
  }
  function nextBanner() {
    if (G.bannerActive || !G.bannerQueue.length) return;
    const b = G.bannerQueue.shift();
    const el = $('eventBanner');
    $('eventText').textContent = b.text;
    el.className = 'event-banner show ' + (b.style || '');
    G.bannerUntil = G.time + b.ms / 1000;
    G.bannerActive = true;
  }
  function updateBanner() {
    if (!G.bannerActive) {
      if (G.bannerQueue.length) nextBanner();
      return;
    }
    if (G.time >= G.bannerUntil) {
      $('eventBanner').classList.remove('show');
      G.bannerActive = false;
      if (G.bannerQueue.length) setTimeout(nextBanner, 160);
    }
  }
  function showCoach(text, duration) {
    $('coachText').textContent = text;
    $('coach').classList.add('show');
    G.coachUntil = G.time + (duration || 4);
  }
  function hideCoach() {
    $('coach').classList.remove('show');
    G.coachUntil = 0;
  }

  // ============================================================
  // HUD
  // ============================================================
  function updateLevelChrome() {
    if (!G.level) return;
    $('levelChip').querySelector('.chip-num').textContent = G.level.id;
    $('levelChipText').textContent = G.level.place;
    $('taskCounter').textContent = 'Шалости ' + G.doneCount + '/' + G.tasks.length;
    $('seedCounter').textContent = G.seeds.filter((s) => s.collected).length + '/3';
    $('objective-wrap');
    document.querySelector('.objective-pill').classList.toggle('complete', G.exitActive);
    updateCompass();
  }

  function updateHUDProgress() {
    $('taskCounter').textContent = 'Шалости ' + G.doneCount + '/' + G.tasks.length;
    $('seedCounter').textContent = G.seeds.filter((s) => s.collected).length + '/3';
    document.querySelector('.objective-pill').classList.toggle('complete', G.exitActive);
    updateCompass();
  }

  function updateCompass() {
    if (!G.level || !G.player) return;
    let target = null;
    let label = 'шалость';
    if (!G.exitActive) {
      let best = Infinity;
      G.tasks.forEach((t) => {
        if (t.done) return;
        const d = dist(G.player.x, G.player.y, t.x, t.y);
        if (d < best) { best = d; target = t; }
      });
    } else {
      const e = G.level.exit;
      target = { x: e.x + e.w / 2, y: e.y + e.h / 2 };
      label = G.level.id === 1 ? 'норка' : (G.level.id === 4 ? 'гнездо' : 'выход');
    }
    G.compassTarget = target;
    $('compassLabel').textContent = label;
    if (target) {
      const angle = Math.atan2(target.y - G.player.y, target.x - G.player.x) * 180 / Math.PI + 90;
      $('compassArrow').style.transform = 'rotate(' + angle.toFixed(1) + 'deg)';
      $('compass').style.opacity = '0.95';
    } else {
      $('compass').style.opacity = '0';
    }
  }

  function updateHideButton() {
    const player = G.player;
    if (!player) return;
    const hidden = player.hidden;
    const btn = $('btnHide');
    const show = hidden || !!G.nearHide;
    btn.classList.toggle('show', show);
    btn.classList.toggle('hidden-mode', hidden);
    btn.querySelector('.action-text').textContent = hidden ? 'ВЫЙТИ' : 'ПРЯТКИ';
    btn.querySelector('.action-icon').textContent = hidden ? '🌙' : '👀';
  }

  // ============================================================
  // Task / seed interactions
  // ============================================================
  function triggerTask(t) {
    if (!t || t.done) return;
    t.done = true;
    t.doneAt = G.time;
    G.doneCount++;
    G.lastProgress = G.levelTime;
    const colors = ['#ffd15c', '#ff9f7a', '#7cc7e8', '#9bce9c', '#fff4d9', '#b7a1e8'];
    spawnBurst(t.gx, t.gy - 20, colors, 18, 220);
    G.shake = Math.max(G.shake, 5);
    Sound.play('crash');
    G.floats.push({ text: 'БУМ!', x: t.gx, y: t.gy - 66, life: 0.9, max: 0.9, color: '#ff9f43', size: 20 });
    updateHUDProgress();
    if (!G.tutorial.task) {
      G.tutorial.task = true;
      showToast('Вот это шалость! Ищи предметы с искорками', 2400);
    }
    if (G.doneCount === G.tasks.length) activateExit();
    if (G.doneCount === 1) {
      G.enemies.forEach((e) => {
        if (e.type === 'cat' && e.sleep && e.wakeAfter && e.wakeAfter <= 1) wakeEnemy(e, true);
      });
    }
  }

  function activateExit() {
    if (G.exitActive) return;
    G.exitActive = true;
    updateHUDProgress();
    const label = G.level.id === 1 ? 'норке' : (G.level.id === 4 ? 'гнезду' : 'выходу');
    enqueueBanner('ВСЁ ГОТОВО! БЕГИ К ' + label.toUpperCase() + '!', 'gold', 2600);
    showToast('Все шалости сделаны! Теперь — к ' + label + '!', 2800);
    Sound.play('win');
    spawnBurst(G.player.x, G.player.y - 35, ['#ffd15c', '#fff4d9', '#ff9f43'], 22, 240);
  }

  function collectSeed(s) {
    if (!s || s.collected) return;
    s.collected = true;
    Sound.play('seed');
    spawnBurst(s.x, s.y, ['#ffd15c', '#fff4d9', '#ff9f43'], 12, 160);
    G.floats.push({ text: '+1 🌻', x: s.x, y: s.y - 28, life: 1, max: 1, color: '#9b6b32', size: 15 });
    updateHUDProgress();
    if (G.seeds.every((x) => x.collected)) {
      showToast('Все три семечка! Это ещё одна звезда!', 2600);
      Sound.play('win');
    }
  }

  function speakEnglish(text) {
    if (!text || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.78;
      utterance.pitch = 1.08;
      const voices = window.speechSynthesis.getVoices();
      const english = voices.find((v) => /^en([-_]|$)/i.test(v.lang));
      if (english) utterance.voice = english;
      window.speechSynthesis.speak(utterance);
    } catch (e) { /* speech is a nice bonus, never block the game */ }
  }

  function collectWord(w) {
    if (!w || w.collected) return;
    w.collected = true;
    save.words[w.en] = { ru: w.ru, emoji: w.emoji };
    persist();
    Sound.play('seed');
    spawnBurst(w.x, w.y - 8, ['#7cc7e8', '#b9e7f7', '#fff4d9', '#ffd15c'], 18, 180);
    G.floats.push({ text: 'ABC!', x: w.x, y: w.y - 42, life: 1.1, max: 1.1, color: '#3d8fbf', size: 17 });
    showWordCard(w);
  }

  function showWordCard(w) {
    G.currentWord = w;
    G.wordReturnMode = 'play';
    G.mode = 'word';
    Sound.setActive(false);
    hideCoach();
    hideToast();
    $('wordEmoji').textContent = w.emoji;
    $('wordEn').textContent = w.en;
    $('wordRu').textContent = w.ru;
    $('wordSentence').textContent = w.sentence || '';
    $('wordSentenceRu').textContent = w.sentenceRu || '';
    $('wordCardModal').classList.add('show');
    clearTimeout(G.wordSpeakTimer);
    if (!save.muted) {
      G.wordSpeakTimer = setTimeout(() => speakEnglish(w.en), 350);
    }
  }

  function closeWordCard() {
    if (G.mode !== 'word') return;
    clearTimeout(G.wordSpeakTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    $('wordCardModal').classList.remove('show');
    G.currentWord = null;
    G.mode = 'play';
    G.last = performance.now();
    if (G.player) G.player.invuln = Math.max(G.player.invuln, 1.2);
    Sound.setActive(true);
    Sound.setMood('calm');
  }

  function renderWordBook() {
    const entries = Object.entries(save.words || {});
    const list = $('wordBookList');
    if (!entries.length) {
      list.innerHTML = '<p class="wordbook-empty">Пока пусто. Ищи голубые карточки со словом «A» на уровнях!</p>';
      return;
    }
    list.innerHTML = entries.map(([en, data]) =>
      '<button class="wordbook-item" data-speak="' + escapeHtml(en) + '">' +
      '<span class="wordbook-emoji">' + escapeHtml(data.emoji || '📖') + '</span>' +
      '<span class="wordbook-text"><b>' + escapeHtml(en) + '</b><small>' + escapeHtml(data.ru || '') + '</small></span>' +
      '<span class="wordbook-sound">🔊</span></button>'
    ).join('');
  }

  function openWordBook() {
    renderWordBook();
    $('wordBookModal').classList.add('show');
    Sound.play('click');
  }

  function closeWordBook() {
    $('wordBookModal').classList.remove('show');
  }

  function nearestHide() {
    if (!G.player || G.player.hidden) return null;
    let best = null;
    let bestD = 94;
    G.hides.forEach((h) => {
      const d = dist(G.player.x, G.player.y, h.ax, h.ay);
      if (d < bestD) { bestD = d; best = h; }
    });
    return best;
  }

  function hidePlayer() {
    const p = G.player;
    if (!p || p.hidden || G.mode !== 'play') return;
    const h = G.nearHide;
    if (!h || p.hideCooldown > 0) return;
    p.saved = { x: p.x, y: p.y };
    p.hidden = true;
    p.hideSpot = h;
    p.hideTimer = 4.4;
    p.x = h.px;
    p.y = h.py;
    p.vx = 0;
    p.vy = 0;
    p.moving = false;
    p.hideCooldown = 0.9;
    G.lastSafe = { x: p.saved.x, y: p.saved.y };
    Sound.play('hide');
    showToast('Тс-с... Хома спрятался. Посиди тихонько!', 1900);
    G.enemies.forEach((e) => {
      if (e.state === 'chase') {
        e.state = e.lastSeen ? 'search' : 'patrol';
        e.chaseTime = 0;
        e.path = null;
        e.bubble = e.phrases.lost || '...';
        e.bubbleUntil = G.time + 1.4;
      }
    });
    if (!G.tutorial.hide) {
      G.tutorial.hide = true;
      hideCoach();
    }
    updateHideButton();
  }

  function unhidePlayer() {
    const p = G.player;
    if (!p || !p.hidden) return;
    p.hidden = false;
    if (p.saved) { p.x = p.saved.x; p.y = p.saved.y; }
    p.hideSpot = null;
    p.hideTimer = 0;
    p.hideCooldown = 0.75;
    p.invuln = Math.max(p.invuln, 1.2);
    p.vx = 0;
    p.vy = 0;
    updateHideButton();
  }

  function toggleHide() {
    if (!G.player) return;
    if (G.player.hidden) unhidePlayer();
    else hidePlayer();
  }

  function startDash() {
    const p = G.player;
    if (!p || G.mode !== 'play' || p.hidden || p.dashCd > 0) return;
    const input = G.moveInput;
    let dx = input.x;
    let dy = input.y;
    if (Math.hypot(dx, dy) < 0.18) { dx = p.facing; dy = 0; }
    const d = Math.hypot(dx, dy) || 1;
    p.dashDir = { x: dx / d, y: dy / d };
    p.dash = 0.22;
    p.dashCd = 1.55;
    p.facing = p.dashDir.x < -0.1 ? -1 : 1;
    Sound.play('dash');
    spawnBurst(p.x, p.y - 8, ['#fff4d9', '#ffd15c', '#e8dcc7'], 8, 70);
  }

  // ============================================================
  // Catch / respawn
  // ============================================================
  function catchPlayer(enemy) {
    if (G.mode !== 'play' || !G.player || G.player.hidden || G.player.invuln > 0) return;
    G.mode = 'caught';
    G.caught++;
    G.catchTimer = 1.35;
    G.catchEnemy = enemy;
    G.shake = 16;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.moving = false;
    if (G.player.hidden) unhidePlayer();
    const emoji = enemy.type === 'cat' ? '😾' : (enemy.type === 'vacuum' ? '🤖' : '😱');
    $('catchEmoji').textContent = emoji;
    $('catchTitle').textContent = enemy.type === 'mom' ? 'ОЙ-ОЙ!' : (enemy.type === 'cat' ? 'МЯУ!' : 'ВЖЖЖ!');
    $('catchSub').textContent = enemy.phrases.catch || 'Тебя поймали!';
    $('catchFlash').classList.add('show');
    Sound.play('catch');
    G.enemies.forEach((e) => {
      if (e !== enemy) {
        e.state = e.state === 'sleep' || e.state === 'off' || e.state === 'inactive' ? e.state : 'patrol';
        e.chaseTime = 0;
        e.path = null;
      }
    });
    enemy.state = 'patrol';
    enemy.wait = 1.5;
    enemy.chaseTime = 0;
    enemy.path = null;
    spawnBurst(G.player.x, G.player.y - 35, ['#ff7a72', '#ffd15c', '#fff4d9'], 14, 180);
    hideCoach();
  }

  function respawnPlayer() {
    const p = G.player;
    if (!p) return;
    let target;
    if (G.exitActive) {
      const e = G.level.exit;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      const candidates = [
        { x: cx, y: e.y - 110 },
        { x: cx, y: e.y + e.h + 110 },
        { x: e.x - 130, y: cy },
        { x: e.x + e.w + 130, y: cy }
      ];
      target = null;
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        if (c.x < 70 || c.y < 70 || c.x > G.level.world.w - 70 || c.y > G.level.world.h - 70) continue;
        if (circleHitsSolid(c.x, c.y, 24)) continue;
        if (c.x > e.x - 30 && c.x < e.x + e.w + 30 && c.y > e.y - 30 && c.y < e.y + e.h + 30) continue;
        target = safePoint(c.x, c.y);
        break;
      }
      if (!target) target = safePoint(G.level.spawn.x, G.level.spawn.y);
    } else {
      target = safePoint(G.level.spawn.x, G.level.spawn.y);
    }
    p.x = target.x;
    p.y = target.y;
    p.vx = 0;
    p.vy = 0;
    p.hidden = false;
    p.hideSpot = null;
    p.hideTimer = 0;
    p.invuln = 2.6;
    p.dash = 0;
    p.dashCd = 0;
    p.saved = null;
    G.lastSafe = { x: p.x, y: p.y };
    G.enemies.forEach((e) => {
      e.state = (e.state === 'sleep' || e.state === 'off' || e.state === 'inactive') ? e.state : 'patrol';
      e.respawnGrace = 3;
      e.path = null;
      e.wait = 0.8;
      e.chaseTime = 0;
      e.lostTime = 0;
      e.lastSeen = null;
      e.bubble = '';
    });
    G.camera.zoom = computeZoom();
    clampCamera(true);
    $('catchFlash').classList.remove('show');
    G.mode = 'play';
    G.last = performance.now();
    showToast('Хома вывернулся и убежал! Попробуй ещё раз', 2400);
    updateHideButton();
  }

  // ============================================================
  // Enemies
  // ============================================================
  function wakeEnemy(e, silent) {
    if (!e || e.state !== 'sleep') return;
    e.state = 'patrol';
    e.sleeping = false;
    e.wpIndex = 0;
    e.path = null;
    e.bubble = e.phrases.alert || '!';
    e.bubbleUntil = G.time + 1.6;
    if (!silent) {
      enqueueBanner(e.name + ' проснулась!', 'coral', 1900);
      showToast('Мурка проснулась! Прячься или убегай!', 2600);
      Sound.play('alert');
    }
  }

  function activateEnemy(e) {
    if (!e) return;
    if (e.type === 'vacuum') {
      e.state = 'patrol';
      e.sleeping = false;
      e.bubble = 'Вжжж!';
      e.bubbleUntil = G.time + 1.8;
      if (!G.tutorial.vacuum) {
        G.tutorial.vacuum = true;
        enqueueBanner('РОБОТ-ПЫЛЕСОС ВЫЕХАЛ!', 'coral', 2100);
        showToast('Робот не любит бардак. Прячься!', 2800);
      }
      Sound.play('alert');
    } else if (e.type === 'mom') {
      e.state = 'patrol';
      e.bubble = 'Хома!';
      e.bubbleUntil = G.time + 1.8;
      enqueueBanner('МАМА ИДЁТ!', 'coral', 1800);
      Sound.play('alert');
    } else {
      e.state = 'patrol';
    }
  }

  function canSee(e) {
    const p = G.player;
    if (!p || p.hidden || p.invuln > 0 || e.respawnGrace > 0) return false;
    const d = dist(e.x, e.y, p.x, p.y);
    if (d > e.sight) return false;
    if (e.type === 'vacuum') {
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      const diff = Math.abs(normAngle(ang - e.angle));
      const noisy = p.dash > 0 && d < e.sight * 1.45;
      if (diff > (e.fov || 1) / 2 && !noisy) return false;
    }
    return lineClear(e.x, e.y - (e.type === 'cat' ? 20 : 30), p.x, p.y - 20, 2);
  }

  function startChase(e) {
    if (e.state === 'chase') return;
    e.state = 'chase';
    e.chaseTime = 0;
    e.lostTime = 0;
    e.lastSeen = { x: G.player.x, y: G.player.y };
    e.path = null;
    e.pathTime = 0;
    e.bubble = e.phrases.alert || '!';
    e.bubbleUntil = G.time + 1.7;
    Sound.play('alert');
    if (!G.tutorial.chase) {
      G.tutorial.chase = true;
      showToast('Тебя заметили! Жми ⚡ рывок или прячься!', 2800);
    }
  }

  function loseChase(e, search) {
    e.chaseTime = 0;
    e.lostTime = 0;
    e.path = null;
    if (search && e.lastSeen) {
      e.state = 'search';
      e.searchTime = 0;
      e.bubble = e.phrases.lost || '?';
      e.bubbleUntil = G.time + 1.3;
    } else {
      e.state = 'patrol';
      e.wait = 0.7;
    }
  }

  function enemyTarget(e) {
    if (e.state === 'chase') return { x: G.player.x, y: G.player.y };
    if (e.state === 'search' && e.lastSeen) return e.lastSeen;
    if (!e.patrol || !e.patrol.length) return { x: e.x, y: e.y };
    const wp = e.patrol[e.wpIndex % e.patrol.length];
    return { x: wp[0], y: wp[1] };
  }

  function updateEnemyPath(e, target, interval) {
    if (!G.nav) return;
    if (!e.path || G.time >= e.pathTime) {
      e.path = findPath(e.x, e.y, target.x, target.y);
      e.pathTime = G.time + (interval || 0.4);
      // smooth first nodes
      if (e.path) {
        let guard = 0;
        while (e.path.length > 1 && guard++ < 4 && lineClear(e.x, e.y, e.path[1].x, e.path[1].y, 16)) {
          e.path.shift();
        }
      }
    }
  }

  function followPath(e, target, speed, dt) {
    updateEnemyPath(e, target, e.state === 'chase' ? 0.34 : 0.7);
    let tx = target.x;
    let ty = target.y;
    if (e.path && e.path.length) {
      let node = e.path[0];
      while (node && dist(e.x, e.y, node.x, node.y) < 22) {
        e.path.shift();
        node = e.path[0];
      }
      if (node) { tx = node.x; ty = node.y; }
      else { tx = target.x; ty = target.y; }
    }
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    e.moving = d > 4;
    if (d > 4) {
      e.vx = dx / d * speed;
      e.vy = dy / d * speed;
      if (Math.abs(e.vx) > 8) e.facing = e.vx < 0 ? -1 : 1;
      if (Math.hypot(e.vx, e.vy) > 20) e.angle = Math.atan2(e.vy, e.vx);
      const oldX = e.x, oldY = e.y;
      moveActor(e, e.vx * dt, e.vy * dt, e.radius);
      if (Math.abs(e.x - oldX) < 0.2 && Math.abs(e.y - oldY) < 0.2) {
        e.path = null;
      }
    } else {
      e.vx = 0;
      e.vy = 0;
      e.moving = false;
    }
  }

  function updateEnemies(dt) {
    const p = G.player;
    G.enemies.forEach((e) => {
      e.respawnGrace = Math.max(0, e.respawnGrace - dt);
      if (e.bubbleUntil < G.time) e.bubble = '';
      if (e.state === 'sleep') {
        if (e.wakeAfter && G.doneCount >= e.wakeAfter) wakeEnemy(e);
        return;
      }
      if (e.state === 'off') {
        if (e.activateAfter && G.doneCount >= e.activateAfter) activateEnemy(e);
        return;
      }
      if (e.state === 'inactive') {
        e.delayLeft -= dt;
        if (e.delayLeft <= 0) activateEnemy(e);
        return;
      }
      const seen = canSee(e);
      if (e.state === 'chase') {
        e.chaseTime += dt;
        e.respawnGrace = Math.max(0, e.respawnGrace - dt);
        if (seen && e.lastSeen) { e.lastSeen.x = p.x; e.lastSeen.y = p.y; e.lostTime = 0; }
        else e.lostTime += dt;
        if (p.hidden || p.invuln > 0 || e.chaseTime > 5.2 || e.lostTime > 1.4 || dist(e.x, e.y, p.x, p.y) > e.sight * 2.3) {
          loseChase(e, !!e.lastSeen && !p.hidden);
          return;
        }
      } else if (e.state === 'search') {
        e.searchTime = (e.searchTime || 0) + dt;
        if (seen) { startChase(e); }
        const d = e.lastSeen ? dist(e.x, e.y, e.lastSeen.x, e.lastSeen.y) : 0;
        if (e.searchTime > 4 || d < 26) {
          e.state = 'patrol';
          e.wait = 0.8;
          e.lastSeen = null;
          e.path = null;
        }
      } else {
        if (seen) {
          startChase(e);
        }
      }

      if (e.state === 'chase') {
        const d = dist(e.x, e.y, p.x, p.y);
        if (d < (e.type === 'mom' ? 39 : (e.type === 'cat' ? 37 : 35)) && !p.hidden && p.invuln <= 0 && lineClear(e.x, e.y - 20, p.x, p.y - 20, 4)) {
          catchPlayer(e);
          return;
        }
        followPath(e, e.lastSeen || { x: p.x, y: p.y }, e.speed * 1.06, dt);
        return;
      }
      if (e.state === 'search' && e.lastSeen) {
        followPath(e, e.lastSeen, e.speed * 0.92, dt);
        return;
      }
      // Patrolling
      if (e.wait > 0) {
        e.wait -= dt;
        e.moving = false;
        return;
      }
      if (!e.patrol || !e.patrol.length) return;
      const wp = e.patrol[e.wpIndex % e.patrol.length];
      if (e.path && e.path.length === 0) {
        e.wpIndex = (e.wpIndex + 1) % e.patrol.length;
        e.wait = 0.45 + Math.random() * 0.7;
        e.path = null;
        return;
      }
      if (dist(e.x, e.y, wp[0], wp[1]) < 28) {
        e.wpIndex = (e.wpIndex + 1) % e.patrol.length;
        e.wait = 0.5 + Math.random() * 0.9;
        e.path = null;
        e.moving = false;
        return;
      }
      followPath(e, { x: wp[0], y: wp[1] }, e.speed * 0.66, dt);
    });
  }

  // ============================================================
  // Player / world update
  // ============================================================
  function inputVector() {
    let x = 0;
    let y = 0;
    if (G.keys.has('ArrowLeft') || G.keys.has('KeyA')) x -= 1;
    if (G.keys.has('ArrowRight') || G.keys.has('KeyD')) x += 1;
    if (G.keys.has('ArrowUp') || G.keys.has('KeyW')) y -= 1;
    if (G.keys.has('ArrowDown') || G.keys.has('KeyS')) y += 1;
    if (G.joystick.active) {
      x += G.joystick.x;
      y += G.joystick.y;
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, mag: Math.min(1, len) };
  }

  function updatePlayer(dt) {
    const p = G.player;
    p.invuln = Math.max(0, p.invuln - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.hideCooldown = Math.max(0, p.hideCooldown - dt);
    p.dash = Math.max(0, p.dash - dt);
    if (p.hidden) {
      p.hideTimer -= dt;
      p.moving = false;
      if (p.hideTimer <= 0) unhidePlayer();
      G.moveInput = { x: 0, y: 0, mag: 0 };
      return;
    }
    const input = inputVector();
    G.moveInput = input;
    if (input.mag > 0.08) {
      if (!G.tutorial.moved) {
        G.tutorial.moved = true;
        if (G.coachUntil && $('coach').classList.contains('show')) hideCoach();
      }
      if (Math.abs(input.x) > 0.12) p.facing = input.x < 0 ? -1 : 1;
    }
    let desiredX;
    let desiredY;
    if (p.dash > 0) {
      desiredX = p.dashDir.x * 430;
      desiredY = p.dashDir.y * 430;
      const k = 1 - Math.exp(-dt * 30);
      p.vx = lerp(p.vx, desiredX, k);
      p.vy = lerp(p.vy, desiredY, k);
    } else {
      const speed = p.speed * (0.55 + 0.45 * input.mag);
      desiredX = input.x * speed;
      desiredY = input.y * speed;
      const k = 1 - Math.exp(-dt * 13);
      p.vx = lerp(p.vx, desiredX, k);
      p.vy = lerp(p.vy, desiredY, k);
    }
    if (Math.hypot(p.vx, p.vy) < 4) { p.vx = 0; p.vy = 0; }
    p.moving = Math.hypot(p.vx, p.vy) > 25;
    moveActor(p, p.vx * dt, p.vy * dt, p.r);
    G.nearHide = nearestHide();
    // tasks
    if (p.moving) {
      G.tasks.forEach((t) => {
        if (!t.done && dist(p.x, p.y, t.x, t.y) < 64) triggerTask(t);
      });
    }
    G.seeds.forEach((s) => {
      if (!s.collected && dist(p.x, p.y, s.x, s.y) < 34) collectSeed(s);
    });
    for (let i = 0; i < G.words.length; i++) {
      const w = G.words[i];
      if (!w.collected && dist(p.x, p.y, w.x, w.y) < 38) {
        collectWord(w);
        return;
      }
    }
    // coach near hide
    if (G.nearHide && !G.tutorial.hide && !p.hidden && G.mode === 'play') {
      showCoach('Рядом укрытие! Жми «ПРЯТКИ» и пережди', 3600);
      G.tutorial.hide = true;
    }
    // exit
    if (G.exitActive) {
      const e = G.level.exit;
      if (p.x > e.x - 20 && p.x < e.x + e.w + 20 && p.y > e.y - 20 && p.y < e.y + e.h + 20) {
        finishLevel();
      }
    }
    updateHideButton();
    // idle hint
    if (G.levelTime - G.lastProgress > 16 && !p.hidden && G.mode === 'play') {
      G.lastProgress = G.levelTime;
      const target = G.compassTarget;
      if (target) showToast('Подсказка: стрелка сверху показывает, куда бежать', 2300);
    }
  }

  function updateHUDLive(dt) {
    G.hudTick += dt;
    if (G.hudTick > 0.09) {
      G.hudTick = 0;
      updateCompass();
      if (G.player) {
        const p = G.player;
        const on = p.dashCd > 0;
        $('btnDash').classList.toggle('cooling', on);
        const frac = on ? 1 - p.dashCd / 1.55 : 1;
        $('dashCooldown').style.transform = 'rotate(' + (frac * 360) + 'deg)';
      }
      if (G.player && G.player.hidden) {
        $('btnHide').querySelector('.action-text').textContent = 'ВЫЙТИ';
      }
    }
    if (G.coachPending && G.time >= G.coachPending.at) {
      showCoach(G.coachPending.text, G.coachPending.duration);
      G.coachPending = null;
    }
    if (G.coachUntil && G.time > G.coachUntil) hideCoach();
    if (G.toastUntil && G.time > G.toastUntil) hideToast();
    updateBanner();
  }

  function update(dt) {
    if (!G.level) return;
    G.levelTime += dt;
    updatePlayer(dt);
    if (G.mode !== 'play') return;
    updateEnemies(dt);
    if (G.mode !== 'play') return;
    G.shake = Math.max(0, G.shake - dt * 26);
    clampCamera(false);
    updateParticles(dt);
    G.floats = G.floats.filter((f) => {
      f.life -= dt;
      f.y -= dt * 34;
      return f.life > 0;
    });
    const chasing = G.enemies.some((e) => e.state === 'chase');
    Sound.setMood(chasing ? 'chase' : 'calm');
    updateHUDLive(dt);
  }

  function updateCaught(dt) {
    G.catchTimer -= dt;
    updateParticles(dt);
    G.floats = G.floats.filter((f) => {
      f.life -= dt;
      f.y -= dt * 34;
      return f.life > 0;
    });
    G.shake = Math.max(0, G.shake - dt * 10);
    updateBanner();
    if (G.catchTimer <= 0) respawnPlayer();
  }

  // ============================================================
  // Particles
  // ============================================================
  function spawnBurst(x, y, colors, count, spread) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.35 + Math.random() * 0.8) * (spread || 180);
      G.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 50,
        life: 0.5 + Math.random() * 0.55,
        max: 1,
        color: colors[(Math.random() * colors.length) | 0],
        size: 3 + Math.random() * 5,
        shape: Math.random() > 0.55 ? 'star' : 'dot'
      });
    }
    G.particles.push({ x, y, vx: 0, vy: 0, life: 0.42, max: 0.42, color: 'rgba(255,230,150,.7)', size: 8, shape: 'ring' });
    if (G.particles.length > 140) G.particles.splice(0, G.particles.length - 140);
  }

  function updateParticles(dt) {
    G.particles = G.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 280 * dt;
      p.vx *= 0.985;
      return p.life > 0;
    });
  }

  // ============================================================
  // Input
  // ============================================================
  function resetStickVisual() {
    const joy = $('joystick');
    joy.classList.remove('active');
    joy.style.left = '';
    joy.style.top = '';
    joy.style.bottom = '';
    $('joyKnob').style.transform = 'translate(0px, 0px)';
    G.joystick.x = 0;
    G.joystick.y = 0;
  }

  function updateJoystickDefault() {
    if (!G.joystick.active) {
      const joy = $('joystick');
      joy.style.left = '';
      joy.style.top = '';
      joy.style.bottom = '';
    }
  }

  function setupInput() {
    const zone = $('touchZone');
    const joy = $('joystick');
    const knob = $('joyKnob');
    const maxR = 48;

    function startStick(e) {
      if (G.mode !== 'play' || !G.player) return;
      if (G.joystick.active) return;
      e.preventDefault();
      G.joystick.active = true;
      G.joystick.pointerId = e.pointerId;
      const jw = joy.getBoundingClientRect().width || 132;
      let cx = e.clientX;
      let cy = e.clientY;
      cx = clamp(cx, jw / 2 + 12, G.view.w - jw / 2 - 12);
      cy = clamp(cy, 90 + jw / 2, G.view.h - jw / 2 - 12);
      G.joystick.cx = cx;
      G.joystick.cy = cy;
      G.joystick.x = 0;
      G.joystick.y = 0;
      joy.style.left = (cx - jw / 2) + 'px';
      joy.style.top = (cy - jw / 2) + 'px';
      joy.style.bottom = 'auto';
      joy.classList.add('active');
      knob.style.transform = 'translate(0px, 0px)';
      try { zone.setPointerCapture(e.pointerId); } catch (err) {}
      G.joystick.startX = e.clientX;
      G.joystick.startY = e.clientY;
      Sound.unlock();
    }
    function moveStick(e) {
      if (!G.joystick.active || e.pointerId !== G.joystick.pointerId) return;
      e.preventDefault();
      let dx = e.clientX - G.joystick.startX;
      let dy = e.clientY - G.joystick.startY;
      const d = Math.hypot(dx, dy);
      if (d > maxR) { dx = dx / d * maxR; dy = dy / d * maxR; }
      knob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      const nx = dx / maxR;
      const ny = dy / maxR;
      const mag = Math.hypot(nx, ny);
      if (mag < 0.14) { G.joystick.x = 0; G.joystick.y = 0; }
      else {
        const scaled = Math.min(1, (mag - 0.1) / 0.9) / mag;
        G.joystick.x = nx * scaled;
        G.joystick.y = ny * scaled;
      }
    }
    function endStick(e) {
      if (!G.joystick.active || (e && e.pointerId !== G.joystick.pointerId)) return;
      G.joystick.active = false;
      G.joystick.pointerId = null;
      resetStickVisual();
    }
    zone.addEventListener('pointerdown', startStick, { passive: false });
    zone.addEventListener('pointermove', moveStick, { passive: false });
    zone.addEventListener('pointerup', endStick, { passive: false });
    zone.addEventListener('pointercancel', endStick, { passive: false });
    zone.addEventListener('lostpointercapture', endStick, { passive: false });

    $('btnDash').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.unlock();
      startDash();
    }, { passive: false });
    $('btnHide').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.unlock();
      toggleHide();
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
      if ((e.code === 'Enter' || e.code === 'Escape') && G.mode === 'word') {
        closeWordCard();
        return;
      }
      if (e.code === 'Escape' && $('wordBookModal').classList.contains('show')) {
        closeWordBook();
        return;
      }
      G.keys.add(e.code);
      if (e.code === 'Space') startDash();
      if (e.code === 'KeyE') toggleHide();
      if (e.code === 'Escape' && G.mode === 'play') pauseGame();
      if (e.code === 'Enter' && G.mode === 'intro') beginPlay();
    });
    document.addEventListener('keyup', (e) => G.keys.delete(e.code));
    window.addEventListener('blur', () => {
      G.keys.clear();
      G.joystick.active = false;
      G.joystick.pointerId = null;
      resetStickVisual();
      if (G.mode === 'play') pauseGame();
    });
  }

  // ============================================================
  // Drawing
  // ============================================================
  function drawWorld() {
    if (!G.level || !G.staticCanvas) {
      ctx.setTransform(G.view.dpr, 0, 0, G.view.dpr, 0, 0);
      ctx.fillStyle = '#2b1e2a';
      ctx.fillRect(0, 0, G.view.w, G.view.h);
      return;
    }
    const dpr = G.view.dpr;
    const zoom = G.camera.zoom;
    const view = viewWorldSize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, G.view.w, G.view.h);
    ctx.fillStyle = '#241821';
    ctx.fillRect(0, 0, G.view.w, G.view.h);
    const shakeX = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
    const shakeY = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-G.camera.x, -G.camera.y);
    // static floor + furniture only in view
    const sx = Math.max(0, Math.floor(G.camera.x) - 40);
    const sy = Math.max(0, Math.floor(G.camera.y) - 40);
    const sw = Math.min(G.level.world.w - sx, Math.ceil(view.w) + 80);
    const sh = Math.min(G.level.world.h - sy, Math.ceil(view.h) + 80);
    ctx.drawImage(G.staticCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
    // tasks
    G.tasks.forEach((t) => Art.drawTask(ctx, t, G.time));
    // seeds
    G.seeds.forEach((s) => Art.drawSeed(ctx, s, G.time));
    G.words.forEach((w) => Art.drawWord(ctx, w, G.time));
    // hide hints
    G.hides.forEach((h) => Art.drawHide(ctx, h, G.nearHide === h, G.time, G.player && G.player.hideSpot === h));
    // exit
    Art.drawExit(ctx, G.level, G.exitActive, G.time);
    // actors, y-sorted
    const actors = [];
    G.enemies.forEach((e) => {
      actors.push({ y: e.y, draw: () => drawEnemy(e) });
    });
    const p = G.player;
    if (p) {
      if (p.hidden && p.hideSpot) {
        actors.push({ y: p.hideSpot.py, draw: () => Art.drawHidingEyes(ctx, p.hideSpot, G.time) });
      } else {
        actors.push({
          y: p.y,
          draw: () => {
            const alpha = p.invuln > 0 ? (Math.sin(G.time * 25) > 0 ? 0.55 : 1) : 1;
            ctx.save();
            ctx.globalAlpha = alpha;
            Art.drawHoma(ctx, p.x, p.y, G.time, {
              facing: p.facing,
              moving: p.moving,
              speed: Math.hypot(p.vx, p.vy),
              dash: p.dash
            });
            ctx.restore();
          }
        });
      }
    }
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    // particles
    Art.drawParticles(ctx, G.particles);
    // floating text
    G.floats.forEach((f) => {
      const a = Math.max(0, f.life / f.max);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = '900 ' + (f.size || 18) + 'px ' + Art.FONT;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#fff4d9';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color || '#ff9f43';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });
    // speech bubbles over everyone
    G.enemies.forEach((e) => {
      if (e.bubble && e.bubbleUntil > G.time) {
        Art.drawSpeech(ctx, e.x, e.y - 10, e.bubble, e.type === 'vacuum' ? '#d9f2ff' : (e.type === 'cat' ? '#ffe7d9' : '#fff0d2'), G.time);
      } else if (e.state === 'chase') {
        ctx.save();
        ctx.fillStyle = '#ffd15c';
        ctx.strokeStyle = Art.INK;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y - 112, 15, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = Art.INK;
        ctx.font = '900 20px ' + Art.FONT;
        ctx.textAlign = 'center';
        ctx.fillText('!', e.x, e.y - 105);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    });
    ctx.restore();
    // screen vignette
    const grd = ctx.createRadialGradient(G.view.w / 2, G.view.h / 2, Math.min(G.view.w, G.view.h) * 0.3, G.view.w / 2, G.view.h / 2, Math.max(G.view.w, G.view.h) * 0.78);
    grd.addColorStop(0, 'rgba(26,15,24,0)');
    grd.addColorStop(1, 'rgba(26,15,24,.3)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, G.view.w, G.view.h);
    const chasing = G.enemies.some((e) => e.state === 'chase');
    if (chasing && G.mode === 'play') {
      const r = ctx.createRadialGradient(G.view.w / 2, G.view.h / 2, Math.min(G.view.w, G.view.h) * 0.28, G.view.w / 2, G.view.h / 2, Math.max(G.view.w, G.view.h) * 0.72);
      r.addColorStop(0, 'rgba(255,80,70,0)');
      r.addColorStop(1, 'rgba(255,70,60,' + (0.1 + Math.sin(G.time * 4) * 0.03) + ')');
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, G.view.w, G.view.h);
    }
  }

  function drawEnemy(e) {
    const sleeping = e.state === 'sleep' || e.state === 'off';
    const state = {
      facing: e.facing,
      moving: e.moving,
      chasing: e.state === 'chase',
      angle: e.angle,
      sleeping
    };
    if (e.type === 'mom') Art.drawMom(ctx, e.x, e.y, G.time, state);
    else if (e.type === 'cat') Art.drawCat(ctx, e.x, e.y, G.time, state);
    else Art.drawRobot(ctx, e.x, e.y, G.time, state);
  }

  // ============================================================
  // Main loop
  // ============================================================
  function loop(now) {
    requestAnimationFrame(loop);
    if (!G.last) G.last = now;
    const dt = Math.min(0.033, Math.max(0.001, (now - G.last) / 1000));
    G.last = now;
    G.time += dt;
    if (G.mode === 'play') {
      update(dt);
    } else if (G.mode === 'caught') {
      updateCaught(dt);
    } else if (G.mode === 'finishing') {
      G.finishTimer -= dt;
      updateParticles(dt);
      G.shake = Math.max(0, G.shake - dt * 20);
      if (G.finishTimer <= 0) showResults();
    } else if (G.mode === 'intro') {
      updateBanner();
    } else if (G.mode === 'result' || G.mode === 'finale') {
      updateParticles(dt);
    }
    drawWorld();
  }

  // ============================================================
  // Wiring
  // ============================================================
  function wireUI() {
    $('btnPlay').addEventListener('click', () => {
      Sound.unlock(); Sound.play('click');
      startLevelByIndex(firstUnfinished() - 1);
    });
    $('btnLevels').addEventListener('click', () => { Sound.unlock(); Sound.play('click'); showLevels(); });
    $('btnLevelsBack').addEventListener('click', () => { Sound.play('click'); goHome(); });
    $('btnHowTitle').addEventListener('click', () => { Sound.unlock(); openHelp(); });
    $('btnTitleSound').addEventListener('click', toggleMute);
    $('btnSoundTitle').addEventListener('click', toggleMute);
    $('btnMute').addEventListener('click', toggleMute);
    $('btnPauseMute').addEventListener('click', toggleMute);
    $('btnPause').addEventListener('click', pauseGame);
    $('btnResume').addEventListener('click', () => { Sound.play('click'); resumeGame(); });
    $('btnRestart').addEventListener('click', () => {
      Sound.play('click');
      hideScreens();
      startLevelByIndex(G.levelIndex, { skipIntro: true });
    });
    $('btnHelp').addEventListener('click', () => { Sound.unlock(); openHelp(); });
    $('btnPauseLevels').addEventListener('click', () => { Sound.play('click'); showLevels(); });
    $('btnPauseHome').addEventListener('click', () => { Sound.play('click'); goHome(); });
    $('btnPauseWords').addEventListener('click', openWordBook);
    $('btnWordNext').addEventListener('click', () => { Sound.play('click'); closeWordCard(); });
    $('btnWordSpeak').addEventListener('click', () => {
      if (G.currentWord) speakEnglish(G.currentWord.en);
    });
    $('btnWordBookClose').addEventListener('click', closeWordBook);
    document.querySelectorAll('[data-close-wordbook]').forEach((el) => el.addEventListener('click', closeWordBook));
    $('wordBookList').addEventListener('click', (e) => {
      const item = e.target.closest('[data-speak]');
      if (item) speakEnglish(item.dataset.speak);
    });
    $('resultWords').addEventListener('click', (e) => {
      const item = e.target.closest('[data-speak]');
      if (item) speakEnglish(item.dataset.speak);
    });
    $('btnStartLevel').addEventListener('click', () => { Sound.unlock(); Sound.play('click'); beginPlay(); });
    $('btnIntroBack').addEventListener('click', () => { Sound.play('click'); goHome(); });
    $('btnResultNext').addEventListener('click', () => {
      Sound.play('click');
      if (!G.level) return;
      if (G.level.id >= MAX_LEVELS) showFinale();
      else startLevelByIndex(G.level.id);
    });
    $('btnResultReplay').addEventListener('click', () => {
      Sound.play('click');
      startLevelByIndex(G.level.id - 1, { skipIntro: true });
    });
    $('btnResultWords').addEventListener('click', openWordBook);
    $('btnResultLevels').addEventListener('click', () => { Sound.play('click'); showLevels(); });
    $('btnFinaleAgain').addEventListener('click', () => { Sound.play('click'); showLevels(); });
    $('btnFinaleHome').addEventListener('click', () => { Sound.play('click'); goHome(); });
    $('btnHelpClose').addEventListener('click', closeHelp);
    document.querySelectorAll('[data-close-help]').forEach((el) => el.addEventListener('click', closeHelp));
    $('btnResetProgress').addEventListener('click', resetProgress);
    $('levelsGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card) return;
      const idx = Number(card.dataset.level);
      if (Number.isNaN(idx)) return;
      if (LEVELS[idx].id > save.unlocked) return;
      Sound.unlock(); Sound.play('click');
      startLevelByIndex(idx);
    });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && G.mode === 'play') pauseGame();
    });
    window.addEventListener('resize', () => {
      clearTimeout(wireUI._resize);
      wireUI._resize = setTimeout(resize, 80);
    });
    window.addEventListener('orientationchange', () => setTimeout(resize, 250));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => {
      clearTimeout(wireUI._vv);
      wireUI._vv = setTimeout(resize, 100);
    });
    document.querySelectorAll('.btn, .mini-btn, .icon-btn, .level-card').forEach((el) => {
      el.addEventListener('click', () => Sound.play('click'));
    });
  }

  function toggleMute() {
    save.muted = !save.muted;
    persist();
    updateSoundUI();
    if (!save.muted) { Sound.unlock(); Sound.play('click'); }
  }

  function boot() {
    resize();
    wireUI();
    setupInput();
    if (!('speechSynthesis' in window)) {
      $('btnWordSpeak').style.display = 'none';
    } else {
      window.speechSynthesis.getVoices();
    }
    updateTitleUI();
    renderLevels();
    showScreen('screenTitle');
    G.last = performance.now();
    requestAnimationFrame(loop);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  // expose for debugging and automated checks
  window.HOMA = {
    G, LEVELS, save,
    startLevel: (i) => startLevelByIndex(i, { skipIntro: false }),
    beginPlay,
    startLevelNow: (i) => startLevelByIndex(i, { skipIntro: true }),
    showLevels, goHome, pauseGame, resumeGame,
    win: () => {
      if (!G.level) return;
      G.tasks.forEach((t) => { t.done = true; });
      G.doneCount = G.tasks.length;
      G.exitActive = true;
      updateHUDProgress();
      const e = G.level.exit;
      G.player.x = e.x + e.w / 2;
      G.player.y = e.y + e.h / 2;
      finishLevel();
    },
    addCaught: () => { G.caught++; },
    collectAllSeeds: () => { G.seeds.forEach((s) => { s.collected = true; }); updateHUDProgress(); },
    path: (x1, y1, x2, y2) => findPath(x1, y1, x2, y2),
    teleport: (x, y) => { if (G.player) { G.player.x = x; G.player.y = y; clampCamera(true); } }
  };

  boot();
})();
