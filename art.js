/* ============================================================
   ХОМА-ХУЛИГАН — рисование мира и героев (Canvas 2D)
   ============================================================ */
(function () {
  'use strict';

  const INK = '#463240';
  const INK_SOFT = '#6b4d57';
  const CREAM = '#fff4d9';
  const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';
  const WALLS = {
    1: { base: '#987a68', top: '#c6a78f', dark: '#6d5144' },
    2: { base: '#93a58d', top: '#c1cfb5', dark: '#66775f' },
    3: { base: '#ac7d69', top: '#d6a98e', dark: '#7c5545' },
    4: { base: '#8c819e', top: '#b9afc8', dark: '#635a75' }
  };

  function rr(g, x, y, w, h, r, fill, stroke, lw) {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    g.beginPath();
    g.moveTo(x + radius, y);
    g.arcTo(x + w, y, x + w, y + h, radius);
    g.arcTo(x + w, y + h, x, y + h, radius);
    g.arcTo(x, y + h, x, y, radius);
    g.arcTo(x, y, x + w, y, radius);
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke !== null) {
      g.strokeStyle = stroke || INK;
      g.lineWidth = lw === undefined ? 3 : lw;
      g.stroke();
    }
  }

  function ell(g, cx, cy, rx, ry, fill, stroke, lw) {
    g.beginPath();
    g.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke !== null) {
      g.strokeStyle = stroke || INK;
      g.lineWidth = lw === undefined ? 3 : lw;
      g.stroke();
    }
  }

  function line(g, x1, y1, x2, y2, color, lw, cap) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokeStyle = color || INK;
    g.lineWidth = lw === undefined ? 3 : lw;
    g.lineCap = cap || 'round';
    g.stroke();
  }

  function shadow(g, cx, cy, rx, ry, alpha) {
    g.save();
    g.fillStyle = 'rgba(53,33,43,' + (alpha === undefined ? 0.17 : alpha) + ')';
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  function star(g, cx, cy, r, color, stroke) {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 ? r * 0.44 : r;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fillStyle = color || '#ffd15c';
    g.fill();
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
  }

  function parseHex(hex) {
    const s = hex.replace('#', '');
    const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }
  function mix(hex, other, amount) {
    const a = parseHex(hex), b = parseHex(other);
    const f = Math.max(0, Math.min(1, amount));
    return '#' + [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * f).toString(16).padStart(2, '0')).join('');
  }
  function lighten(hex, amount) { return mix(hex, '#ffffff', amount); }
  function darken(hex, amount) { return mix(hex, '#23151f', amount); }

  function floorPattern(g, zone) {
    const { x, y, w, h, style, tone } = zone;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.fillStyle = tone;
    g.fillRect(x, y, w, h);

    if (style === 'wood') {
      const plank = 34;
      for (let yy = y; yy < y + h; yy += plank) {
        g.fillStyle = ((yy / plank) | 0) % 2 ? mix(tone, '#ffffff', 0.035) : mix(tone, '#b06e42', 0.045);
        g.fillRect(x, yy, w, plank - 1);
        g.strokeStyle = 'rgba(98,64,44,.16)';
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, yy + plank); g.lineTo(x + w, yy + plank); g.stroke();
        const offset = ((yy / plank) | 0) % 3 * 170;
        for (let xx = x - 250 + offset; xx < x + w; xx += 310) {
          g.strokeStyle = 'rgba(98,64,44,.10)';
          g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + plank); g.stroke();
        }
      }
    } else if (style === 'tile') {
      const t = 76;
      for (let yy = y; yy < y + h; yy += t) {
        for (let xx = x; xx < x + w; xx += t) {
          const odd = (Math.floor((xx - x) / t) + Math.floor((yy - y) / t)) % 2;
          g.fillStyle = odd ? mix(tone, '#ffffff', 0.13) : mix(tone, '#b58963', 0.05);
          g.fillRect(xx, yy, t, t);
        }
      }
      g.strokeStyle = 'rgba(112,81,60,.13)';
      g.lineWidth = 2;
      for (let xx = x; xx <= x + w; xx += t) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
      for (let yy = y; yy <= y + h; yy += t) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
    } else if (style === 'stone') {
      const t = 96;
      for (let row = 0, yy = y; yy < y + h; row++, yy += 64) {
        const offset = row % 2 ? -t / 2 : 0;
        for (let xx = x + offset; xx < x + w; xx += t) {
          g.fillStyle = ((row + Math.floor(xx / t)) % 3 === 0) ? mix(tone, '#ffffff', 0.07) : mix(tone, '#6c5a4b', 0.025);
          g.fillRect(xx + 2, yy + 2, t - 4, 60);
        }
      }
      g.strokeStyle = 'rgba(105,83,65,.14)';
      g.lineWidth = 1.5;
      for (let yy = y; yy <= y + h; yy += 64) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
      for (let row = 0, yy = y; yy <= y + h; row++, yy += 64) {
        const offset = row % 2 ? 48 : 0;
        for (let xx = x + offset; xx <= x + w; xx += 96) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 64); g.stroke(); }
      }
    } else if (style === 'mat') {
      const t = 150;
      for (let yy = y; yy < y + h; yy += t) {
        for (let xx = x; xx < x + w; xx += t) {
          const odd = (Math.floor((xx - x) / t) + Math.floor((yy - y) / t)) % 2;
          g.fillStyle = odd ? mix(tone, '#ffffff', 0.085) : mix(tone, '#8b7563', 0.05);
          g.fillRect(xx, yy, t, t);
        }
      }
      g.strokeStyle = 'rgba(110,88,72,.09)';
      g.lineWidth = 2;
      for (let xx = x; xx <= x + w; xx += t) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
      for (let yy = y; yy <= y + h; yy += t) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 140; i++) {
        const px = x + ((i * 379) % w);
        const py = y + ((i * 613) % h);
        g.fillRect(px, py, 3, 3);
      }
    } else if (style === 'carpet') {
      g.fillStyle = 'rgba(255,255,255,.08)';
      for (let i = 0; i < 120; i++) {
        const px = x + ((i * 197) % w);
        const py = y + ((i * 431) % h);
        g.fillRect(px, py, 3, 3);
      }
      g.fillStyle = 'rgba(70,50,64,.035)';
      for (let yy = y; yy < y + h; yy += 20) g.fillRect(x, yy, w, 1);
    } else if (style === 'runner') {
      g.fillStyle = 'rgba(255,255,255,.09)';
      for (let i = 0; i < 160; i++) {
        const px = x + ((i * 211) % w);
        const py = y + ((i * 367) % h);
        g.fillRect(px, py, 2, 2);
      }
      g.fillStyle = 'rgba(70,50,64,.045)';
      g.fillRect(x + 120, y, 360, h);
      g.fillRect(x + w - 480, y, 360, h);
    }
    g.restore();
  }

  function drawFloor(g, level) {
    g.fillStyle = '#2c202a';
    g.fillRect(0, 0, level.world.w, level.world.h);
    level.floor.zones.forEach((z) => floorPattern(g, z));
    // Soft room lights.
    const lights = level.lights || [];
    lights.forEach((l) => {
      const grd = g.createRadialGradient(l.x, l.y, 6, l.x, l.y, l.r || 300);
      grd.addColorStop(0, 'rgba(255,243,197,.23)');
      grd.addColorStop(1, 'rgba(255,243,197,0)');
      g.fillStyle = grd;
      g.fillRect(l.x - (l.r || 300), l.y - (l.r || 300), (l.r || 300) * 2, (l.r || 300) * 2);
    });
  }

  function drawLabels(g, level) {
    (level.labels || []).forEach((l) => {
      g.save();
      g.globalAlpha = l.alpha === undefined ? 0.13 : l.alpha;
      g.fillStyle = '#3c2c33';
      g.font = '900 ' + (l.size || 24) + 'px ' + FONT;
      g.letterSpacing = '5px';
      g.fillText(l.text, l.x, l.y);
      g.restore();
    });
  }

  function drawRug(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 2, w / 2, 13, 0.10);
    rr(g, x, y, w, h, 18, f.color, INK, 3);
    rr(g, x + 12, y + 12, w - 24, h - 24, 10, null, f.accent, 3);
    g.save();
    g.beginPath(); g.rect(x + 14, y + 14, w - 28, h - 28); g.clip();
    g.globalAlpha = 0.5;
    if (f.pattern === 'dots') {
      const r = 7;
      for (let yy = y + 38; yy < y + h; yy += 60) {
        for (let xx = x + 38; xx < x + w; xx += 60) {
          ell(g, xx + ((Math.floor((yy - y) / 60) % 2) * 20), yy, r, r, f.accent, null);
        }
      }
    } else if (f.pattern === 'diamonds') {
      g.strokeStyle = f.accent;
      g.lineWidth = 3;
      for (let xx = x - h; xx < x + w + h; xx += 70) {
        g.beginPath(); g.moveTo(xx, y + h); g.lineTo(xx + h, y); g.stroke();
        g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + h, y + h); g.stroke();
      }
    } else if (f.pattern === 'stripes') {
      g.fillStyle = f.accent;
      for (let xx = x + 20; xx < x + w; xx += 70) g.fillRect(xx, y, 26, h);
    } else if (f.pattern === 'waves') {
      g.strokeStyle = f.accent;
      g.lineWidth = 4;
      for (let yy = y + 45; yy < y + h; yy += 55) {
        g.beginPath();
        for (let xx = x; xx <= x + w; xx += 10) {
          const py = yy + Math.sin(xx / 24) * 7;
          if (xx === x) g.moveTo(xx, py); else g.lineTo(xx, py);
        }
        g.stroke();
      }
    } else if (f.pattern === 'stars') {
      for (let yy = y + 46; yy < y + h; yy += 72) {
        for (let xx = x + 46; xx < x + w; xx += 72) {
          star(g, xx + ((Math.floor((yy - y) / 72) % 2) * 22), yy, 8, f.accent);
        }
      }
    }
    g.restore();
    // fringe
    g.strokeStyle = f.color;
    g.lineWidth = 5;
    for (let xx = x + 16; xx < x + w - 10; xx += 15) {
      line(g, xx, y - 7, xx, y + 1, f.color, 4);
      line(g, xx, y + h - 1, xx, y + h + 7, f.color, 4);
    }
  }

  function drawWalls(g, level) {
    const pal = WALLS[level.id] || WALLS[1];
    level.walls.forEach((w) => {
      g.fillStyle = 'rgba(42,25,35,.24)';
      rr(g, w.x + 5, w.y + 6, w.w, w.h, 7, '#2a1923', null);
      rr(g, w.x, w.y, w.w, w.h, 6, pal.base, INK, 3.5);
      if (w.w > w.h) {
        rr(g, w.x + 4, w.y + 4, w.w - 8, Math.min(14, w.h * 0.4), 5, pal.top, null);
      } else {
        rr(g, w.x + 4, w.y + 4, Math.min(14, w.w * 0.4), w.h - 8, 5, pal.top, null);
      }
      g.strokeStyle = 'rgba(255,248,230,.18)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(w.x + 8, w.y + w.h - 5);
      g.lineTo(w.x + w.w - 8, w.y + w.h - 5);
      g.stroke();
    });
  }

  function drawDecor(g, level) {
    (level.decor || []).forEach((d) => {
      if (d.type === 'window') {
        const grd = g.createLinearGradient(d.x, d.y, d.x, d.y + d.h);
        grd.addColorStop(0, d.night ? '#314163' : '#9edcf2');
        grd.addColorStop(1, d.night ? '#58658b' : '#e9fbff');
        rr(g, d.x, d.y + 2, d.w, d.h - 4, 4, grd, '#fff6df', 3);
        g.fillStyle = 'rgba(255,246,223,.9)';
        g.fillRect(d.x + d.w / 2 - 2, d.y + 3, 4, d.h - 6);
        g.fillRect(d.x + 3, d.y + d.h / 2 - 2, d.w - 6, 4);
        if (d.night) {
          g.fillStyle = '#ffe9a3';
          star(g, d.x + d.w * 0.3, d.y + d.h * 0.4, 4, '#ffe9a3');
        }
        // curtains
        g.fillStyle = 'rgba(255,244,215,.55)';
        g.fillRect(d.x - 8, d.y + 2, 7, d.h - 2);
      } else if (d.type === 'poster') {
        rr(g, d.x, d.y, d.w, d.h, 5, '#fff4d9', INK, 2.5);
        rr(g, d.x + 5, d.y + 5, d.w - 10, d.h - 10, 2, '#ffcf73', null);
        g.fillStyle = INK_SOFT;
        g.font = '900 ' + Math.max(10, d.h * 0.28) + 'px ' + FONT;
        g.textAlign = 'center';
        g.fillText(d.text, d.x + d.w / 2, d.y + d.h * 0.67);
        g.textAlign = 'left';
      } else if (d.type === 'door' || d.type === 'frontdoor') {
        const horizontal = d.w > d.h;
        if (d.kind === 'arch') {
          g.fillStyle = 'rgba(255,245,215,.25)';
          g.fillRect(d.x, d.y, d.w, d.h);
        } else if (d.type === 'frontdoor') {
          g.fillStyle = 'rgba(42,25,35,.2)';
          g.fillRect(d.x + 4, d.y + 4, d.w, d.h);
          rr(g, d.x, d.y, d.w, d.h, 3, '#9b6140', INK, 2.5);
          g.fillStyle = 'rgba(255,230,170,.3)';
          g.fillRect(d.x + 9, d.y + 6, d.w - 18, 8);
          ell(g, d.x + d.w - 17, d.y + d.h / 2, 4, 4, '#ffd15c');
          g.fillStyle = 'rgba(255,244,215,.35)';
          g.fillRect(d.x - 26, d.y - 18, d.w + 52, 20);
        } else {
          g.fillStyle = 'rgba(255,245,215,.22)';
          if (horizontal) g.fillRect(d.x, d.y, d.w, d.h);
          else g.fillRect(d.x, d.y, d.w, d.h);
        }
      }
    });
  }

  function drawDiningTable(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 14, 0.15);
    // chairs
    const chair = (cx, cy, rot) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot || 0);
      rr(g, -24, -13, 48, 26, 7, '#d9a06f', INK, 2.2);
      rr(g, -20, -9, 40, 8, 4, '#efbd8d', null);
      g.restore();
    };
    chair(x + w * 0.23, y - 2, 0);
    chair(x + w * 0.5, y - 2, 0);
    chair(x + w * 0.77, y - 2, 0);
    chair(x + w * 0.23, y + h + 2, Math.PI);
    chair(x + w * 0.5, y + h + 2, Math.PI);
    chair(x + w * 0.77, y + h + 2, Math.PI);
    // table
    rr(g, x, y + 8, w, h - 8, 22, darken(f.color, 0.12), INK, 3);
    rr(g, x + 8, y, w - 16, h - 16, 20, f.color, INK, 3);
    rr(g, x + 20, y + 12, w - 40, h - 40, 14, lighten(f.color, 0.14), null);
    // runner
    rr(g, x + w * 0.38, y + 16, w * 0.24, h - 42, 8, 'rgba(255,244,217,.5)', null);
    // plates and a cookie jar
    ell(g, x + w * 0.25, y + h * 0.45, 26, 16, '#fffaf0', INK, 2);
    ell(g, x + w * 0.25, y + h * 0.45, 17, 9, '#e8dcc7', null);
    ell(g, x + w * 0.75, y + h * 0.45, 26, 16, '#fffaf0', INK, 2);
    ell(g, x + w * 0.75, y + h * 0.45, 17, 9, '#e8dcc7', null);
    rr(g, x + w * 0.48, y + 22, 30, 38, 7, '#9fceb1', INK, 2.2);
    rr(g, x + w * 0.48 + 4, y + 26, 22, 9, 4, '#d8f3e5', null);
    g.fillStyle = '#6f4930';
    ell(g, x + w * 0.48 + 9, y + 48, 3, 2, '#6f4930', null);
    ell(g, x + w * 0.48 + 20, y + 44, 3, 2, '#6f4930', null);
    // little vase
    ell(g, x + w * 0.5, y + h * 0.68, 8, 12, '#7cc7e8', INK, 1.8);
    line(g, x + w * 0.5, y + h * 0.67, x + w * 0.5 - 11, y + h * 0.54, '#4e7d4e', 3);
    ell(g, x + w * 0.5 - 12, y + h * 0.53, 7, 5, '#9bce9c', INK, 1.5);
  }

  function cabinetLegs(g, x, y, w, h, color) {
    g.fillStyle = darken(color, 0.18);
    g.fillRect(x + 12, y + h - 7, 9, 12);
    g.fillRect(x + w - 21, y + h - 7, 9, 12);
  }

  function drawSofa(g, f) {
    const { x, y, w, h } = f;
    const c = f.color;
    shadow(g, x + w / 2, y + h - 2, w / 2.15, 14, 0.16);
    rr(g, x, y + 6, w, h - 6, 18, darken(c, 0.12), INK, 3);
    rr(g, x + 5, y, w - 10, h * 0.53, 16, c, INK, 3);
    rr(g, x + 12, y + 8, w - 24, h * 0.29, 10, lighten(c, 0.11), null);
    const seats = Math.max(2, Math.round(w / 150));
    const sw = (w - 34 - (seats - 1) * 6) / seats;
    for (let i = 0; i < seats; i++) {
      rr(g, x + 17 + i * (sw + 6), y + h * 0.43, sw, h * 0.43, 9, lighten(c, 0.18), INK, 2.2);
      g.strokeStyle = 'rgba(70,50,64,.2)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x + 22 + i * (sw + 6), y + h * 0.49);
      g.lineTo(x + 12 + (i + 1) * (sw + 6), y + h * 0.49);
      g.stroke();
    }
    rr(g, x - 2, y + h * 0.35, 18, h * 0.57, 8, darken(c, 0.03), INK, 2.5);
    rr(g, x + w - 16, y + h * 0.35, 18, h * 0.57, 8, darken(c, 0.03), INK, 2.5);
    // pillow
    g.save();
    g.translate(x + w * 0.73, y + h * 0.32);
    g.rotate(-0.18);
    rr(g, -30, -20, 60, 43, 12, f.pillow || '#ffd15c', INK, 2.5);
    g.strokeStyle = 'rgba(70,50,64,.25)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(-22, -10); g.lineTo(22, -10); g.stroke();
    g.restore();
    cabinetLegs(g, x, y, w, h, c);
  }

  function drawArmchair(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.2, 11, 0.15);
    rr(g, x, y + 9, w, h - 9, 18, darken(f.color, 0.1), INK, 3);
    rr(g, x + 7, y, w - 14, h * 0.58, 18, f.color, INK, 3);
    rr(g, x + 16, y + h * 0.4, w - 32, h * 0.43, 10, lighten(f.color, 0.15), INK, 2.3);
    rr(g, x - 1, y + h * 0.4, 17, h * 0.5, 8, darken(f.color, 0.04), INK, 2.4);
    rr(g, x + w - 16, y + h * 0.4, 17, h * 0.5, 8, darken(f.color, 0.04), INK, 2.4);
    cabinetLegs(g, x, y, w, h, f.color);
  }

  function drawPouf(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 3, w / 2, 8, 0.14);
    ell(g, x + w / 2, y + h / 2, w / 2, h / 2, f.color, INK, 3);
    ell(g, x + w / 2, y + h / 2 - 4, w / 2 - 12, h / 2 - 10, lighten(f.color, 0.16), null);
    g.strokeStyle = 'rgba(70,50,64,.16)';
    g.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x + w / 2 + i * 18, y + 12);
      g.lineTo(x + w / 2 + i * 18, y + h - 12);
      g.stroke();
    }
  }

  function drawCoffeeTable(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 2, w / 2.1, 12, 0.14);
    g.fillStyle = darken(f.color, 0.2);
    g.fillRect(x + 16, y + h - 16, 10, 18);
    g.fillRect(x + w - 26, y + h - 16, 10, 18);
    rr(g, x, y, w, h - 8, 16, f.color, INK, 3);
    rr(g, x + 10, y + 9, w - 20, h - 26, 10, lighten(f.color, 0.12), null);
    // cup and book
    ell(g, x + w * 0.26, y + h * 0.4, 15, 11, '#fff4d9', INK, 2);
    ell(g, x + w * 0.26, y + h * 0.4, 9, 6, '#9a5c3d', null);
    rr(g, x + w * 0.55, y + h * 0.3, 55, 34, 4, '#7cc7e8', INK, 2);
    g.fillStyle = '#fff4d9';
    g.fillRect(x + w * 0.55 + 7, y + h * 0.3 + 6, 41, 6);
  }

  function drawCabinet(g, f, details) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 2, w / 2.1, 11, 0.14);
    cabinetLegs(g, x, y, w, h, f.color);
    rr(g, x, y, w, h - 4, 8, f.color, INK, 3);
    rr(g, x + 6, y + 6, w - 12, h - 20, 5, lighten(f.color, 0.12), null);
    g.strokeStyle = 'rgba(70,50,64,.25)';
    g.lineWidth = 2;
    if (w > h) {
      const n = Math.max(2, Math.round(w / 95));
      const cw = (w - 20) / n;
      for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(x + 10 + cw * i, y + 9); g.lineTo(x + 10 + cw * i, y + h - 14); g.stroke(); }
      for (let i = 0; i < n; i++) ell(g, x + 10 + cw * (i + 0.5), y + h * 0.55, 3.5, 3.5, '#ffd15c', INK, 1.5);
    } else {
      g.beginPath(); g.moveTo(x + w / 2, y + 9); g.lineTo(x + w / 2, y + h - 14); g.stroke();
      ell(g, x + w * 0.38, y + h * 0.52, 3.5, 3.5, '#ffd15c', INK, 1.5);
      ell(g, x + w * 0.62, y + h * 0.52, 3.5, 3.5, '#ffd15c', INK, 1.5);
    }
    if (details) details(g, f);
  }

  function drawSideboard(g, f) { drawCabinet(g, f); }
  function drawConsole(g, f) {
    drawCabinet(g, f);
    g.fillStyle = '#fff4d9';
    g.fillRect(f.x + 18, f.y + 12, 34, 24);
    ell(g, f.x + f.w - 42, f.y + f.h / 2, 15, 13, '#b7a1e8', INK, 2);
    star(g, f.x + f.w - 42, f.y + f.h / 2, 7, '#fff4d9');
  }
  function drawDresser(g, f) {
    drawCabinet(g, f, (gg, ff) => {
      gg.fillStyle = 'rgba(70,50,64,.2)';
      for (let i = 1; i < 3; i++) gg.fillRect(ff.x + 12, ff.y + 10 + i * (ff.h - 22) / 3, ff.w - 24, 2);
    });
  }

  function drawShelf(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.13);
    rr(g, x, y, w, h, 5, darken(f.color, 0.1), INK, 3);
    const shelves = Math.max(3, Math.round(h / 85));
    const sh = h / shelves;
    for (let i = 0; i < shelves; i++) {
      const sy = y + i * sh;
      g.fillStyle = mix(f.color, '#000000', 0.12);
      g.fillRect(x + 6, sy + sh - 8, w - 12, 6);
      if (f.toys) {
        if (i % 2 === 0) {
          ell(g, x + w * 0.38, sy + sh * 0.48, 12, 12, '#ff9f7a', INK, 2);
          ell(g, x + w * 0.62, sy + sh * 0.44, 9, 9, '#7cc7e8', INK, 2);
        } else {
          rr(g, x + 12, sy + sh * 0.26, 16, 25, 3, '#ffd15c', INK, 2);
          rr(g, x + 33, sy + sh * 0.36, 14, 20, 3, '#b7a1e8', INK, 2);
        }
      } else if (f.scarves) {
        const sy2 = sy + sh * 0.5;
        for (let k = 0; k < 3; k++) {
          rr(g, x + 12 + k * 18, sy2 - 15, 14, 28, 5, ['#e47d6d', '#7cc7e8', '#f4bd55'][k], INK, 1.7);
        }
      } else {
        for (let k = 0; k < 6; k++) {
          const bw = 8 + (k * 7) % 9;
          const bh = 33 + (k * 11) % 25;
          rr(g, x + 9 + k * ((w - 18) / 6), sy + sh - 9 - bh, bw, bh, 2, ['#e47d6d', '#7cc7e8', '#f4bd55', '#9bce9c', '#b7a1e8'][k % 5], INK, 1.5);
        }
      }
    }
  }

  function drawBookshelf(g, f) { drawShelf(g, f); }

  function drawKitchenCounter(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 4, w / 2.05, 10, 0.14);
    rr(g, x, y, w, h - 4, 6, darken(f.color, 0.1), INK, 3);
    rr(g, x - 2, y - 2, w + 4, h * 0.34, 5, '#f8f0df', INK, 3);
    const n = Math.max(2, Math.round(w / 130));
    const cw = (w - 16) / n;
    let featureX = x + w * 0.5;
    if (f.variant === 'sink') featureX = x + w * 0.46;
    if (f.variant === 'stove') featureX = x + w * 0.46;
    for (let i = 0; i < n; i++) {
      rr(g, x + 8 + i * cw, y + h * 0.4, cw - 6, h * 0.48, 4, lighten(f.color, 0.08), INK, 1.7);
      line(g, x + 18 + i * cw, y + h * 0.78, x + cw - 12 + i * cw, y + h * 0.78, '#c99a55', 3);
    }
    if (f.variant === 'sink') {
      ell(g, featureX, y + h * 0.22, 42, 13, '#a7c3c8', INK, 2.2);
      ell(g, featureX, y + h * 0.21, 31, 8, '#6f8e98', null);
      g.beginPath(); g.arc(featureX, y + h * 0.11, 13, Math.PI, 0); g.strokeStyle = '#7b8487'; g.lineWidth = 4; g.stroke();
    } else if (f.variant === 'stove') {
      const bx = featureX - 52;
      rr(g, bx, y + 8, 104, h * 0.27, 5, '#4e4852', INK, 2);
      [0, 1].forEach((i) => [0, 1].forEach((j) => ell(g, bx + 31 + i * 42, y + 19 + j * 14, 10, 6, '#2e2a33', '#80727b', 1.5)));
    } else {
      rr(g, featureX - 32, y + 8, 64, 27, 4, '#e0b27f', INK, 2);
      g.fillStyle = '#9b6f4a';
      g.fillRect(featureX - 25, y + 14, 50, 3);
    }
    // fruit bowl
    ell(g, x + w * 0.16, y + h * 0.2, 20, 8, '#df8d55', INK, 2);
    ell(g, x + w * 0.13, y + h * 0.17, 6, 6, '#ff9f7a', null);
    ell(g, x + w * 0.19, y + h * 0.16, 6, 6, '#9bce9c', null);
  }

  function drawIsland(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.05, 12, 0.16);
    cabinetLegs(g, x, y, w, h, f.color);
    rr(g, x, y + 14, w, h - 14, 8, f.color, INK, 3);
    rr(g, x + 8, y + 22, w - 16, h - 30, 4, lighten(f.color, 0.1), null);
    rr(g, x - 4, y, w + 8, h * 0.34, 8, '#fff6e6', INK, 3);
    g.strokeStyle = 'rgba(70,50,64,.2)';
    g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + (w / 4) * i, y + 14); g.lineTo(x + (w / 4) * i, y + h * 0.26); g.stroke(); }
  }

  function drawFridge(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 2, w / 2.05, 11, 0.15);
    rr(g, x, y, w, h, 12, f.color, INK, 3);
    rr(g, x + 7, y + 7, w - 14, h * 0.42, 6, lighten(f.color, 0.07), INK, 2);
    rr(g, x + 7, y + h * 0.48, w - 14, h * 0.47, 6, lighten(f.color, 0.11), INK, 2);
    g.fillStyle = '#aab4ad';
    g.fillRect(x + w - 23, y + 24, 5, 32);
    g.fillRect(x + w - 23, y + h * 0.55, 5, 42);
    g.save();
    g.translate(x + 22, y + 46); g.rotate(-0.1);
    rr(g, -10, -12, 22, 27, 3, '#ffd15c', INK, 1.8);
    g.fillStyle = INK_SOFT; g.font = '900 8px ' + FONT; g.fillText('★', -3, 3);
    g.restore();
    ell(g, x + w * 0.55, y + 33, 10, 10, '#e47d6d', '#fff4d9', 2);
    g.fillStyle = '#e47d6d'; g.fillRect(x + w * 0.55 - 3, y + 23, 6, 4);
  }

  function drawWardrobe(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 2, w / 2.1, 12, 0.16);
    rr(g, x, y, w, h, 8, darken(f.color, 0.08), INK, 3);
    rr(g, x + 7, y + 7, w - 14, h - 14, 5, f.color, null);
    const half = w / 2;
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x + half, y + 8); g.lineTo(x + half, y + h - 8); g.stroke();
    g.strokeStyle = 'rgba(70,50,64,.25)';
    g.lineWidth = 1.5;
    g.strokeRect(x + 16, y + 14, half - 28, h - 30);
    g.strokeRect(x + half + 12, y + 14, half - 28, h - 30);
    ell(g, x + half - 12, y + h * 0.52, 3.5, 8, '#ffd15c', INK, 1.5);
    ell(g, x + half + 12, y + h * 0.52, 3.5, 8, '#ffd15c', INK, 1.5);
    g.fillStyle = darken(f.color, 0.16);
    g.fillRect(x + 2, y + 3, w - 4, 7);
  }

  function drawBed(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 2, w / 2.1, 12, 0.16);
    rr(g, x, y, w, h, 12, '#ac805c', INK, 3);
    rr(g, x + 7, y + 15, w - 14, h - 22, 10, '#fff7e6', INK, 2);
    rr(g, x + 7, y + 15, w - 14, h * 0.2, 10, '#d9b48b', null);
    rr(g, x + 16, y + 25, w - 32, h * 0.33, 13, f.pillow || '#fff3d0', INK, 2.2);
    const blanketY = y + h * 0.42;
    rr(g, x + 9, blanketY, w - 18, h - blanketY - 9, 10, f.color, INK, 2.4);
    rr(g, x + 9, blanketY + 9, w - 18, 30, 7, lighten(f.color, 0.13), null);
    g.strokeStyle = 'rgba(70,50,64,.18)';
    g.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      g.beginPath();
      g.moveTo(x + 15 + (w - 30) * i / 4, blanketY + 42);
      g.lineTo(x + 15 + (w - 30) * i / 4, y + h - 15);
      g.stroke();
    }
    // headboard
    rr(g, x + 3, y - 2, w - 6, 17, 6, '#9b6e4b', INK, 2.5);
  }

  function drawDesk(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.14);
    g.fillStyle = darken(f.color, 0.2);
    g.fillRect(x + 12, y + h - 12, 9, 20);
    g.fillRect(x + w - 21, y + h - 12, 9, 20);
    rr(g, x, y, w, h - 8, 8, f.color, INK, 3);
    rr(g, x + 7, y + 7, w - 14, h - 24, 4, lighten(f.color, 0.12), null);
    rr(g, x + 18, y + 17, 44, 31, 3, '#7cc7e8', INK, 2);
    rr(g, x + 70, y + 24, 32, 20, 3, '#fff4d9', INK, 2);
    line(g, x + 26, y + 21, x + 54, y + 21, '#fff4d9', 3);
  }

  function drawChair(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.2, 8, 0.13);
    rr(g, x + 4, y, w - 8, h * 0.38, 7, f.color, INK, 2.6);
    rr(g, x + 10, y + h * 0.3, w - 20, h * 0.5, 8, lighten(f.color, 0.14), INK, 2.4);
    g.fillStyle = darken(f.color, 0.2);
    g.fillRect(x + 9, y + h - 10, 7, 15);
    g.fillRect(x + w - 16, y + h - 10, 7, 15);
  }

  function drawToyShelf(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.13);
    rr(g, x, y, w, h, 7, f.color, INK, 3);
    const n = 3;
    const cw = (w - 12) / n;
    for (let i = 0; i < n; i++) {
      rr(g, x + 5 + i * cw, y + 7, cw - 4, h - 14, 4, lighten(f.color, 0.25), INK, 1.8);
      if (i === 0) { ell(g, x + 5 + cw / 2, y + h / 2, 12, 12, '#ff9f7a', INK, 1.8); }
      if (i === 1) { rr(g, x + 7 + cw, y + 24, 20, 26, 3, '#7cc7e8', INK, 1.6); rr(g, x + 11 + cw, y + 28, 12, 8, '#fff4d9', null); }
      if (i === 2) { star(g, x + 5 + cw * 2.5, y + h / 2, 14, '#ffd15c', INK); }
    }
  }

  function drawStairs(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 2, w / 2, 12, 0.15);
    rr(g, x, y, w, h, 7, darken(f.color, 0.16), INK, 3);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const sy = y + 7 + i * (h - 14) / steps;
      const inset = 8 + i * 5;
      rr(g, x + inset, sy, w - inset * 2, (h - 14) / steps - 3, 4, i % 2 ? lighten(f.color, 0.17) : lighten(f.color, 0.06), INK, 1.8);
    }
    g.save();
    g.globalAlpha = 0.68;
    g.fillStyle = '#fff4d9';
    g.font = '900 15px ' + FONT;
    g.textAlign = 'center';
    g.fillText('↑', x + w / 2, y + h - 14);
    g.restore();
  }

  function drawShoeRack(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.13);
    rr(g, x, y, w, h, 6, f.color, INK, 3);
    for (let i = 1; i < 5; i++) {
      const sy = y + i * h / 5;
      g.fillStyle = darken(f.color, 0.1);
      g.fillRect(x + 5, sy, w - 10, 5);
      const cols = ['#e47d6d', '#7cc7e8', '#f4bd55', '#9bce9c', '#b7a1e8'];
      for (let j = 0; j < 2; j++) {
        rr(g, x + 11 + j * 34, sy - 21, 27, 15, 5, cols[(i + j) % 5], INK, 1.7);
      }
    }
    g.fillStyle = 'rgba(255,255,255,.12)';
    g.fillRect(x + 5, y + 5, w - 10, 6);
  }

  function drawShoeBench(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 10, 0.14);
    g.fillStyle = darken(f.color, 0.22);
    g.fillRect(x + 16, y + h - 10, 10, 20);
    g.fillRect(x + w - 26, y + h - 10, 10, 20);
    rr(g, x, y + 12, w, h - 20, 8, f.color, INK, 3);
    rr(g, x + 8, y + 4, w - 16, h * 0.44, 10, '#d98b6c', INK, 2.5);
    rr(g, x + 20, y + 12, w - 40, h * 0.17, 5, '#f4a48c', null);
    rr(g, x + 9, y + h - 26, w - 18, 14, 4, darken(f.color, 0.1), INK, 1.8);
    rr(g, x + 28, y + h - 41, 40, 18, 5, '#7cc7e8', INK, 1.7);
    rr(g, x + w - 70, y + h - 41, 40, 18, 5, '#ffd15c', INK, 1.7);
  }

  function drawBench(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.13);
    g.fillStyle = darken(f.color, 0.22);
    g.fillRect(x + 14, y + h - 12, 9, 20);
    g.fillRect(x + w - 23, y + h - 12, 9, 20);
    rr(g, x, y + 8, w, h - 18, 8, f.color, INK, 3);
    rr(g, x + 7, y, w - 14, 15, 7, lighten(f.color, 0.15), INK, 2.4);
    g.strokeStyle = 'rgba(70,50,64,.15)';
    g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + (w / 4) * i, y + 20); g.lineTo(x + (w / 4) * i, y + h - 14); g.stroke(); }
  }

  function drawMirror(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 8, 0.13);
    g.save();
    g.translate(x + w / 2, y + h / 2);
    g.rotate(-0.03);
    rr(g, -w / 2, -h / 2 + 8, w, h - 12, w / 2, '#c59a63', INK, 3);
    rr(g, -w / 2 + 6, -h / 2 + 14, w - 12, h - 24, (w - 12) / 2, '#d9eef3', INK, 2);
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath();
    g.moveTo(-w * 0.16, -h * 0.3); g.lineTo(w * 0.14, -h * 0.16); g.lineTo(-w * 0.04, h * 0.1);
    g.closePath(); g.fill();
    g.fillStyle = darken(f.color, 0.2);
    g.fillRect(-4, h / 2 - 8, 8, 16);
    g.restore();
  }

  function drawCoatRack(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 3, 7, 0.13);
    ell(g, x + w / 2, y + h - 7, 24, 6, darken(f.color, 0.3), INK, 2);
    g.fillStyle = f.color;
    g.fillRect(x + w / 2 - 3, y + 12, 6, h - 20);
    g.beginPath();
    g.arc(x + w / 2, y + 17, 13, Math.PI, 0);
    g.strokeStyle = f.color; g.lineWidth = 5; g.stroke();
    const coats = ['#e47d6d', '#7cc7e8', '#9bce9c'];
    coats.forEach((c, i) => {
      const ox = x + w / 2 + (i - 1) * 20;
      g.save();
      g.translate(ox, y + 26);
      g.rotate((i - 1) * 0.15);
      rr(g, -10, 0, 20, 42 - i * 7, 7, c, INK, 2);
      g.fillStyle = lighten(c, 0.2);
      g.fillRect(-6, 6, 4, 20);
      g.restore();
    });
  }

  function drawRail(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h + 8, w / 2, 8, 0.11);
    g.fillStyle = darken(f.color, 0.18);
    g.fillRect(x, y + 18, 7, h + 36);
    g.fillRect(x + w - 7, y + 18, 7, h + 36);
    line(g, x + 8, y + 24, x + w - 8, y + 24, '#8d827d', 7);
    (f.clothes || []).forEach((c, i) => {
      const cx = x + 35 + i * ((w - 70) / Math.max(1, (f.clothes.length - 1)));
      g.fillStyle = '#9b8b7a';
      g.beginPath();
      g.arc(cx, y + 31, 5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#9b8b7a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx, y + 34); g.lineTo(cx - 14, y + 53); g.moveTo(cx, y + 34); g.lineTo(cx + 14, y + 53); g.stroke();
      rr(g, cx - 22, y + 48, 44, 68, 8, c, INK, 2.4);
      g.fillStyle = lighten(c, 0.18);
      g.fillRect(cx - 15, y + 58, 8, 48);
      g.strokeStyle = 'rgba(70,50,64,.16)';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 18, y + 84); g.lineTo(cx + 18, y + 84); g.stroke();
    });
  }

  function drawShoeBoxes(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2, 8, 0.13);
    const boxes = [
      [0, 34, w - 8, h - 34, '#e0b98a'],
      [8, 0, w * 0.52, 36, '#d3a674'],
      [w * 0.56, 8, w * 0.42, 28, '#c99a6a']
    ];
    boxes.forEach((b) => {
      rr(g, x + b[0], y + b[1], b[2], b[3], 4, b[4], INK, 2.4);
      g.fillStyle = 'rgba(255,255,255,.28)';
      g.fillRect(x + b[0] + 7, y + b[1] + b[3] * 0.3, b[2] - 14, 5);
    });
    g.fillStyle = '#fff4d9';
    g.font = '900 9px ' + FONT;
    g.fillText('ОБУВЬ', x + 18, y + h - 8);
  }

  function drawLaundryBasket(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 8, 0.13);
    ell(g, x + w / 2, y + h * 0.22, w / 2.1, 9, '#f4a48c', INK, 2);
    rr(g, x + 5, y + 20, w - 10, h - 28, 10, f.color, INK, 3);
    g.strokeStyle = 'rgba(70,50,64,.25)';
    g.lineWidth = 2;
    for (let yy = y + 30; yy < y + h - 10; yy += 12) {
      g.beginPath(); g.moveTo(x + 9, yy); g.lineTo(x + w - 9, yy); g.stroke();
    }
    for (let xx = x + 14; xx < x + w - 8; xx += 17) {
      g.beginPath(); g.moveTo(xx, y + 23); g.lineTo(xx, y + h - 8); g.stroke();
    }
    ell(g, x + w * 0.35, y + 18, 17, 11, '#7cc7e8', INK, 2);
    ell(g, x + w * 0.63, y + 17, 15, 10, '#ffd15c', INK, 2);
  }

  function drawPlant(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.2, 8, 0.14);
    const cx = x + w / 2;
    const base = y + h - 12;
    g.strokeStyle = '#4e7d4e';
    g.lineWidth = 5;
    [[-18, -44], [0, -58], [18, -44], [-24, -24], [22, -22]].forEach((p) => {
      g.beginPath(); g.moveTo(cx, base); g.quadraticCurveTo(cx + p[0] * 0.5, base + p[1] * 0.65, cx + p[0], base + p[1]); g.stroke();
      ell(g, cx + p[0], base + p[1], 14, 9, f.color, INK, 2);
      g.save();
      g.translate(cx + p[0], base + p[1]); g.rotate(p[0] > 0 ? 0.5 : -0.5);
      line(g, -7, 0, 7, 0, '#4e7d4e', 2);
      g.restore();
    });
    rr(g, cx - 20, base - 8, 40, 28, 6, '#d98b6c', INK, 3);
    rr(g, cx - 24, base - 10, 48, 10, 5, '#f0a588', INK, 2);
    g.fillStyle = '#7a4f3a';
    g.fillRect(cx - 14, base - 5, 28, 4);
  }

  function drawSlide(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 12, 0.14);
    // ladder
    g.fillStyle = '#8e6a50';
    g.fillRect(x + 14, y + 16, 8, h - 24);
    g.fillRect(x + 66, y + 16, 8, h - 24);
    for (let yy = y + 30; yy < y + h - 18; yy += 22) line(g, x + 18, yy, x + 70, yy, '#b98a62', 5);
    // platform
    rr(g, x + 6, y + 4, 92, 24, 6, '#f0c45e', INK, 2.5);
    // slide
    g.beginPath();
    g.moveTo(x + 80, y + 22);
    g.quadraticCurveTo(x + 150, y + 50, x + w - 12, y + h - 18);
    g.lineTo(x + w - 25, y + h - 4);
    g.quadraticCurveTo(x + 146, y + 74, x + 88, y + 40);
    g.closePath();
    g.fillStyle = f.color; g.fill();
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.45)';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(x + 104, y + 40); g.quadraticCurveTo(x + 162, y + 66, x + w - 35, y + h - 16); g.stroke();
  }

  function drawBallpit(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.2, 12, 0.15);
    ell(g, x + w / 2, y + h * 0.58, w / 2, h * 0.42, '#6aaecb', INK, 3);
    ell(g, x + w / 2, y + h * 0.55, w / 2 - 12, h * 0.34, '#c9ecf8', null);
    const cols = ['#ff9f7a', '#ffd15c', '#9bce9c', '#b7a1e8', '#7cc7e8', '#e47d6d'];
    const positions = [
      [-0.3, 0.05], [-0.16, 0.14], [0, 0.02], [0.16, 0.12], [0.31, 0.03],
      [-0.24, -0.08], [-0.08, -0.11], [0.08, -0.09], [0.24, -0.1], [0.36, -0.16],
      [-0.36, -0.18], [0.02, 0.22], [-0.2, 0.25]
    ];
    positions.forEach((p, i) => {
      ell(g, x + w / 2 + p[0] * w, y + h * 0.58 + p[1] * h, 18, 16, cols[i % cols.length], INK, 2);
      g.fillStyle = 'rgba(255,255,255,.45)';
      ell(g, x + w / 2 + p[0] * w - 5, y + h * 0.58 + p[1] * h - 5, 4, 3, '#fff', null);
    });
  }

  function drawCastle(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 11, 0.14);
    rr(g, x, y + 20, w, h - 20, 5, f.color, INK, 3);
    // crenellations
    for (let i = 0; i < 5; i++) {
      rr(g, x + 8 + i * (w - 16) / 5, y, 34, 28, 3, f.color, INK, 2);
    }
    g.fillStyle = 'rgba(255,255,255,.16)';
    g.fillRect(x + 10, y + 30, w - 20, 8);
    rr(g, x + w * 0.2, y + h * 0.52, w * 0.2, h * 0.32, 20, 30, '#6f4f3f', INK, 2);
    // flag
    line(g, x + w * 0.8, y + 18, x + w * 0.8, y - 30, '#8e6a50', 4);
    g.fillStyle = '#e47d6d';
    g.beginPath(); g.moveTo(x + w * 0.8, y - 30); g.lineTo(x + w * 0.8 + 34, y - 20); g.lineTo(x + w * 0.8, y - 10); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    // crayon scribbles
    g.strokeStyle = 'rgba(70,50,64,.25)';
    g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(x + w * 0.55 + i * 15, y + h * 0.7, 7, 0, Math.PI * 2);
      g.stroke();
    }
  }

  function drawToyChest(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.14);
    rr(g, x, y + h * 0.34, w, h * 0.62, 8, f.color, INK, 3);
    rr(g, x - 2, y + h * 0.16, w + 4, h * 0.31, 8, lighten(f.color, 0.14), INK, 3);
    g.fillStyle = '#ffd15c';
    g.fillRect(x + w / 2 - 8, y + h * 0.33, 16, 13);
    g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x + w / 2 - 8, y + h * 0.33, 16, 13);
    g.fillStyle = '#ff9f7a';
    ell(g, x + 25, y + h * 0.13, 12, 9, '#ffd15c', INK, 2);
    ell(g, x + w - 30, y + h * 0.2, 10, 8, '#7cc7e8', INK, 2);
  }

  function drawBox(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.14);
    rr(g, x, y, w, h, 4, f.color, INK, 3);
    g.fillStyle = 'rgba(255,255,255,.16)';
    g.fillRect(x + 8, y + 8, w - 16, 9);
    g.fillStyle = '#c5a77f';
    g.fillRect(x + w / 2 - 9, y, 18, h);
    g.strokeStyle = 'rgba(70,50,64,.25)';
    g.lineWidth = 2;
    g.strokeRect(x + 9, y + 23, w - 18, h - 32);
    g.fillStyle = 'rgba(70,50,64,.2)';
    g.font = '900 11px ' + FONT;
    g.fillText('ХОМА', x + 17, y + h * 0.55);
    // paw print: a friendly hint that this box is a hiding spot
    const px = x + w - 27;
    const py = y + h - 22;
    g.fillStyle = 'rgba(70,50,64,.24)';
    ell(g, px, py, 6, 5, 'rgba(70,50,64,.24)', null);
    [[-7, -7], [-2.5, -10], [2.5, -10], [7, -7]].forEach((p) => {
      ell(g, px + p[0], py + p[1], 2.6, 3.1, 'rgba(70,50,64,.24)', null);
    });
  }

  function drawChest(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2.1, 9, 0.15);
    rr(g, x, y + h * 0.28, w, h * 0.7, 8, f.color, INK, 3);
    rr(g, x - 2, y + h * 0.1, w + 4, h * 0.34, 8, lighten(f.color, 0.12), INK, 3);
    g.fillStyle = '#e9bd65';
    g.fillRect(x + w / 2 - 7, y + h * 0.28, 14, 14);
    g.fillStyle = '#76513a';
    g.fillRect(x + 9, y + h * 0.15, w - 18, 4);
    g.fillStyle = 'rgba(255,255,255,.2)';
    g.fillRect(x + 8, y + h * 0.38, w - 16, 5);
  }

  function drawNest(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2, 10, 0.14);
    ell(g, x + w / 2, y + h * 0.6, w / 2, h * 0.4, '#b97d4e', INK, 3);
    ell(g, x + w / 2, y + h * 0.57, w / 2 - 12, h * 0.32, '#e9b96c', INK, 2);
    ell(g, x + w / 2, y + h * 0.55, w / 2 - 27, h * 0.22, '#ffe8ae', null);
    ell(g, x + w / 2, y + h * 0.53, w / 2 - 42, h * 0.14, '#fff7d9', null);
    // woven rim
    g.strokeStyle = '#8e5f3d';
    g.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + 0.2;
      const x1 = x + w / 2 + Math.cos(a) * (w / 2 - 18);
      const y1 = y + h * 0.6 + Math.sin(a) * (h * 0.3);
      const x2 = x + w / 2 + Math.cos(a + 0.32) * (w / 2 - 2);
      const y2 = y + h * 0.6 + Math.sin(a + 0.32) * (h * 0.39);
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(x2, y2 - 8, x2, y2); g.stroke();
    }
    // little folded blanket and cushion in the nest
    g.save();
    g.translate(x + w * 0.72, y + h * 0.54);
    g.rotate(-0.12);
    rr(g, -20, -9, 34, 18, 6, '#7cc7e8', INK, 1.8);
    g.fillStyle = '#d9f5ff'; g.fillRect(-14, -5, 22, 5);
    g.restore();
    ell(g, x + w * 0.32, y + h * 0.47, 15, 9, '#ffd15c', INK, 2);
    star(g, x + w * 0.5, y + h * 0.34, 7, '#ffd15c', 'rgba(70,50,64,.35)');
  }

  function drawVacuumDock(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2, 7, 0.12);
    rr(g, x, y, w, h, 8, '#5a596b', INK, 3);
    rr(g, x + 7, y + 7, w - 14, h - 15, 5, '#898a9e', null);
    g.fillStyle = '#6fce9b';
    ell(g, x + w / 2, y + h / 2, 8, 6, '#6fce9b', null);
    g.fillStyle = 'rgba(255,255,255,.3)';
    g.fillRect(x + 12, y + 8, w - 24, 4);
  }

  function drawCatBed(g, f) {
    const { x, y, w, h } = f;
    shadow(g, x + w / 2, y + h - 1, w / 2, 8, 0.12);
    ell(g, x + w / 2, y + h / 2, w / 2, h / 2, f.color, INK, 3);
    ell(g, x + w / 2, y + h / 2, w / 2 - 13, h / 2 - 12, '#f7d8c4', null);
    g.strokeStyle = 'rgba(70,50,64,.16)';
    g.lineWidth = 2;
    g.beginPath(); g.arc(x + w / 2, y + h / 2, 24, 0, Math.PI * 2); g.stroke();
  }

  function drawFurniture(g, f) {
    switch (f.kind) {
      case 'rug': drawRug(g, f); break;
      case 'sofa': drawSofa(g, f); break;
      case 'armchair': drawArmchair(g, f); break;
      case 'pouf': drawPouf(g, f); break;
      case 'coffeeTable': drawCoffeeTable(g, f); break;
      case 'diningTable': drawDiningTable(g, f); break;
      case 'sideboard': drawSideboard(g, f); break;
      case 'console': drawConsole(g, f); break;
      case 'dresser': drawDresser(g, f); break;
      case 'shelf': drawShelf(g, f); break;
      case 'bookshelf': drawBookshelf(g, f); break;
      case 'counter': drawKitchenCounter(g, f); break;
      case 'island': drawIsland(g, f); break;
      case 'fridge': drawFridge(g, f); break;
      case 'wardrobe': drawWardrobe(g, f); break;
      case 'bed': drawBed(g, f); break;
      case 'desk': drawDesk(g, f); break;
      case 'chair': drawChair(g, f); break;
      case 'toyShelf': drawToyShelf(g, f); break;
      case 'stairs': drawStairs(g, f); break;
      case 'shoeRack': drawShoeRack(g, f); break;
      case 'shoeBench': drawShoeBench(g, f); break;
      case 'bench': drawBench(g, f); break;
      case 'mirror': drawMirror(g, f); break;
      case 'coatRack': drawCoatRack(g, f); break;
      case 'rail': drawRail(g, f); break;
      case 'shoeBoxes': drawShoeBoxes(g, f); break;
      case 'laundryBasket': drawLaundryBasket(g, f); break;
      case 'plant': drawPlant(g, f); break;
      case 'slide': drawSlide(g, f); break;
      case 'ballpit': drawBallpit(g, f); break;
      case 'castle': drawCastle(g, f); break;
      case 'toyChest': drawToyChest(g, f); break;
      case 'box': drawBox(g, f); break;
      case 'chest': drawChest(g, f); break;
      case 'nest': drawNest(g, f); break;
      case 'vacuumDock': drawVacuumDock(g, f); break;
      case 'catBed': drawCatBed(g, f); break;
      default: break;
    }
  }

  function drawTask(g, t, time) {
    if (!t) return;
    const done = t.done;
    const bob = done ? 0 : Math.sin(time * 2.5 + t.x * 0.03) * 2;
    g.save();
    g.translate(t.gx, t.gy + bob);
    if (!done) {
      const glow = g.createRadialGradient(0, -26, 4, 0, -26, 58);
      glow.addColorStop(0, 'rgba(255,214,100,.30)');
      glow.addColorStop(1, 'rgba(255,214,100,0)');
      g.fillStyle = glow;
      g.fillRect(-60, -86, 120, 108);
    }
    shadow(g, 0, 8, 30, 7, 0.15);
    drawTaskObject(g, t.type, done, time, t);
    g.restore();

    if (!done) {
      // Activity ring around the interaction point (on the floor).
      g.save();
      const pulse = 0.5 + Math.sin(time * 3 + t.x * 0.02) * 0.18;
      g.strokeStyle = 'rgba(255,183,56,' + (0.45 + pulse * 0.35) + ')';
      g.lineWidth = 2.5;
      g.setLineDash([7, 8]);
      g.lineDashOffset = -time * 16;
      g.beginPath();
      g.ellipse(t.x, t.y + 8, 40, 18, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      // sparkles
      const sx = t.gx + Math.sin(time * 1.6 + t.y) * 32;
      const sy = t.gy - 58 - Math.abs(Math.sin(time * 2.2 + t.x)) * 8;
      star(g, sx, sy, 5.5, '#ffd15c', 'rgba(70,50,64,.4)');
      star(g, t.gx - 34, t.gy - 38 + Math.cos(time * 2 + t.x) * 5, 3.5, '#fff4d9', 'rgba(70,50,64,.3)');
      g.restore();
    }
  }

  function drawTaskObject(g, type, done, time, t) {
    const c = {
      red: '#e47d6d', blue: '#7cc7e8', yellow: '#ffd15c', green: '#9bce9c',
      purple: '#b7a1e8', orange: '#ff9f7a', cream: '#fff4d9', brown: '#b98456'
    };
    if (type === 'blocks') {
      if (!done) {
        rr(g, -24, -14, 48, 34, 5, c.yellow, INK, 2.5);
        rr(g, -17, -38, 34, 25, 4, c.red, INK, 2.2);
        rr(g, -10, -57, 21, 20, 4, c.blue, INK, 2);
        g.fillStyle = INK_SOFT; g.font = '900 12px ' + FONT; g.textAlign = 'center';
        g.fillText('Х', 0, 8); g.fillText('О', 0, -21); g.fillText('М', 0, -43);
        g.textAlign = 'left';
      } else {
        [[-36, 0, c.red, -0.3], [4, -7, c.blue, 0.2], [38, 4, c.yellow, -0.1]].forEach((b) => {
          g.save(); g.translate(b[0], b[1]); g.rotate(b[3]);
          rr(g, -13, -16, 27, 24, 4, b[2], INK, 2); g.restore();
        });
      }
    } else if (type === 'ball') {
      const bx = done ? 34 : 0, by = done ? 16 : -24;
      g.save(); g.translate(bx, by);
      ell(g, 0, 0, done ? 18 : 21, done ? 13 : 21, c.red, INK, 3);
      g.strokeStyle = c.cream; g.lineWidth = 5;
      g.beginPath(); g.arc(0, 0, 11, -1.6, 1.2); g.stroke();
      g.beginPath(); g.arc(0, 0, 11, 1.55, 4.5); g.stroke();
      g.restore();
    } else if (type === 'plush' || type === 'toys') {
      if (type === 'toys') {
        if (!done) {
          ell(g, -20, 0, 19, 19, c.orange, INK, 2.5);
          ell(g, -27, -15, 8, 11, c.orange, INK, 2); ell(g, -12, -15, 8, 11, c.orange, INK, 2);
          ell(g, 15, 6, 15, 13, c.blue, INK, 2.4);
          rr(g, 30, -20, 18, 24, 4, c.yellow, INK, 2);
          ell(g, -20, 3, 3, 4, INK, null); ell(g, -12, 3, 3, 4, INK, null);
        } else {
          [[-34, 8, c.orange], [6, -2, c.blue], [32, 10, c.yellow]].forEach((b, i) => {
            g.save(); g.translate(b[0], b[1]); g.rotate(i ? 0.4 : -0.5); ell(g, 0, 0, 12, 12, b[2], INK, 2); g.restore();
          });
        }
      } else {
        g.save(); if (done) { g.rotate(1.35); g.translate(12, 4); }
        ell(g, 0, 2, 20, 23, c.cream, INK, 2.5);
        ell(g, 0, -27, 18, 17, c.cream, INK, 2.5);
        ell(g, -17, -44, 8, 22, c.cream, INK, 2.2); ell(g, 4, -47, 8, 22, c.cream, INK, 2.2);
        ell(g, -18, -41, 4, 12, '#ffb7c7', null); ell(g, 3, -44, 4, 12, '#ffb7c7', null);
        ell(g, -6, -29, 3, 4, INK, null); ell(g, 6, -29, 3, 4, INK, null);
        ell(g, 0, -23, 3, 2.5, '#e47d6d', null);
        ell(g, 0, 2, 10, 14, '#ffd9b8', null);
        g.restore();
      }
    } else if (type === 'books') {
      if (!done) {
        rr(g, -26, -12, 52, 14, 3, c.red, INK, 2.2);
        rr(g, -23, -25, 48, 14, 3, c.blue, INK, 2.2);
        rr(g, -20, -38, 42, 14, 3, c.yellow, INK, 2.2);
        g.strokeStyle = c.cream; g.lineWidth = 2;
        g.beginPath(); g.moveTo(-14, -30); g.lineTo(10, -30); g.stroke();
      } else {
        [[-30, 8, c.red, -0.2], [3, 0, c.blue, 0.25], [30, 9, c.yellow, 0.1]].forEach((b) => {
          g.save(); g.translate(b[0], b[1]); g.rotate(b[3]); rr(g, -22, -8, 44, 12, 3, b[2], INK, 2); g.restore();
        });
      }
    } else if (type === 'xylophone') {
      if (!done) {
        rr(g, -37, -10, 74, 16, 4, c.brown, INK, 2.5);
        [c.red, c.orange, c.yellow, c.green, c.blue].forEach((col, i) => {
          rr(g, -31 + i * 13, -28 + i * 2, 9, 22, 2, col, INK, 1.8);
        });
        line(g, -20, 10, 26, 10, '#8e6a50', 4);
        ell(g, -19, 11, 4, 4, '#8e6a50', INK, 1.5);
        ell(g, 25, 11, 4, 4, '#8e6a50', INK, 1.5);
      } else {
        [c.red, c.yellow, c.blue].forEach((col, i) => {
          g.save(); g.translate(-28 + i * 30, 10 + (i % 2) * 4); g.rotate(-0.5 + i * 0.45);
          rr(g, -8, -17, 12, 25, 2, col, INK, 1.8); g.restore();
        });
      }
    } else if (type === 'cereal') {
      if (!done) {
        rr(g, -20, -44, 40, 52, 4, c.yellow, INK, 2.8);
        rr(g, -14, -36, 28, 24, 3, c.orange, null);
        star(g, 0, -24, 8, c.cream);
        g.fillStyle = INK_SOFT; g.font = '900 8px ' + FONT; g.textAlign = 'center';
        g.fillText('ХРУМ', 0, 0); g.fillText('ХОМА', 0, 9); g.textAlign = 'left';
      } else {
        g.save(); g.rotate(1.25); g.translate(-4, 10);
        rr(g, -20, -27, 40, 52, 4, c.yellow, INK, 2.8);
        rr(g, -14, -20, 28, 17, 3, c.orange, null);
        g.restore();
        for (let i = 0; i < 8; i++) ell(g, 20 + (i % 4) * 9, 6 + ((i * 5) % 3) * 9, 4, 3, '#d9a35c', INK, 1.2);
      }
    } else if (type === 'paper') {
      if (!done) {
        rr(g, -10, -42, 20, 50, 6, '#fffdf5', INK, 2.4);
        ell(g, 0, -41, 10, 5, '#e8dcc7', INK, 2);
        line(g, -8, -30, 8, -30, '#e8dcc7', 2);
        line(g, -8, -20, 8, -20, '#e8dcc7', 2);
      } else {
        rr(g, -13, -30, 26, 42, 7, '#fffdf5', INK, 2.2);
        g.fillStyle = '#fffdf5';
        g.beginPath();
        g.moveTo(10, -8);
        g.bezierCurveTo(48, 0, 18, 28, 55, 34);
        g.lineTo(50, 44); g.bezierCurveTo(10, 38, 42, 12, 4, 5);
        g.closePath(); g.fill();
        g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
      }
    } else if (type === 'plantTask') {
      if (!done) {
        rr(g, -18, -8, 36, 27, 6, '#d98b6c', INK, 2.6);
        rr(g, -22, -11, 44, 9, 5, '#f0a588', INK, 2);
        g.strokeStyle = '#4e7d4e'; g.lineWidth = 4;
        [[-14, -44], [0, -55], [14, -42]].forEach((p) => {
          g.beginPath(); g.moveTo(0, -9); g.quadraticCurveTo(p[0] * 0.4, -30, p[0], p[1] + 10); g.stroke();
          ell(g, p[0], p[1] + 10, 10, 6, c.green, INK, 2);
        });
      } else {
        g.save(); g.translate(-4, 8); g.rotate(-1.2);
        rr(g, -18, -14, 36, 27, 6, '#d98b6c', INK, 2.6);
        g.restore();
        ell(g, 24, 10, 15, 7, '#7a553c', null);
        for (let i = 0; i < 6; i++) ell(g, 8 + (i % 3) * 8, 5 + ((i * 4) % 3) * 5, 3, 2, '#7a553c', null);
        ell(g, -30, 8, 11, 5, c.green, INK, 1.6);
      }
    } else if (type === 'cushion' || type === 'pillow') {
      const size = type === 'pillow' ? 48 : 38;
      if (!done) {
        g.save(); g.rotate(-0.08);
        rr(g, -size / 2, -size / 2, size, size, 12, type === 'pillow' ? '#fff3d0' : c.purple, INK, 2.6);
        g.strokeStyle = 'rgba(70,50,64,.18)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(-size / 2 + 8, -size / 2 + 8); g.lineTo(size / 2 - 8, size / 2 - 8); g.stroke();
        ell(g, 0, 0, 4, 4, INK, null);
        g.restore();
      } else {
        g.save(); g.rotate(0.4);
        rr(g, -24, -18, 48, 36, 12, type === 'pillow' ? '#fff3d0' : c.purple, INK, 2.2);
        g.strokeStyle = INK; g.lineWidth = 2;
        g.beginPath(); g.moveTo(2, -16); g.lineTo(10, -3); g.lineTo(3, 7); g.lineTo(15, 18); g.stroke();
        g.restore();
        for (let i = 0; i < 5; i++) {
          g.save(); g.translate(20 + i * 7, -16 + (i % 3) * 8); g.rotate(i * 0.7);
          ell(g, 0, 0, 7, 3, '#fffdf5', INK, 1); g.restore();
        }
      }
    } else if (type === 'cookie') {
      if (!done) {
        ell(g, 0, 10, 36, 12, '#f4e6c9', INK, 2.2);
        [[-18, -3, 12], [8, -8, 13], [-2, 9, 9]].forEach((b) => {
          ell(g, b[0], b[1], b[2], b[2] * 0.55, '#d9a35c', INK, 2);
          g.fillStyle = '#6f4930';
          ell(g, b[0] - 3, b[1] - 1, 2, 2, '#6f4930', null);
          ell(g, b[0] + 4, b[1] + 2, 2, 2, '#6f4930', null);
        });
      } else {
        g.save(); g.translate(6, 6); g.rotate(0.4);
        ell(g, 0, 0, 32, 11, '#f4e6c9', INK, 2.2);
        g.restore();
        for (let i = 0; i < 7; i++) ell(g, -20 + i * 9, 8 + (i % 3) * 5, 3, 2, '#a97750', null);
      }
    } else if (type === 'shoes') {
      if (!done) {
        const shoe = (sx, sy, rot, col) => {
          g.save(); g.translate(sx, sy); g.rotate(rot);
          rr(g, -15, -9, 31, 18, 8, col, INK, 2.4);
          rr(g, -15, 2, 31, 8, 4, '#fff4d9', INK, 1.8);
          line(g, -8, -3, 8, -3, '#fff4d9', 3);
          g.restore();
        };
        shoe(-10, -7, -0.1, c.blue); shoe(12, 10, 0.16, c.blue);
      } else {
        g.save(); g.translate(-28, 8); g.rotate(-0.8); rr(g, -15, -9, 31, 18, 8, c.blue, INK, 2.2); g.restore();
        g.save(); g.translate(26, -2); g.rotate(1.3); rr(g, -15, -9, 31, 18, 8, c.blue, INK, 2.2); g.restore();
      }
    } else if (type === 'scarf') {
      if (!done) {
        rr(g, -34, -18, 68, 33, 8, c.red, INK, 2.4);
        g.fillStyle = c.cream;
        g.fillRect(-34, -10, 68, 6);
        g.fillRect(-34, 4, 68, 6);
        for (let i = 0; i < 5; i++) line(g, -30 + i * 6, 16, -30 + i * 6, 26, c.red, 4);
      } else {
        g.strokeStyle = c.red; g.lineWidth = 13; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(-38, -10); g.bezierCurveTo(-10, -46, 26, 22, 44, -8);
        g.stroke();
        g.strokeStyle = c.cream; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-34, -8); g.bezierCurveTo(-6, -42, 28, 18, 42, -6); g.stroke();
      }
    } else if (type === 'sockBasket') {
      if (!done) {
        rr(g, -26, -4, 52, 31, 9, '#d9b07c', INK, 2.6);
        for (let i = 0; i < 4; i++) line(g, -20 + i * 12, -2, -20 + i * 12, 24, 'rgba(70,50,64,.2)', 1.5);
        ell(g, -12, -14, 11, 15, c.blue, INK, 2);
        ell(g, 4, -17, 11, 15, c.yellow, INK, 2);
        ell(g, 16, -12, 10, 13, c.red, INK, 2);
      } else {
        rr(g, -24, 2, 48, 27, 9, '#d9b07c', INK, 2.2);
        ell(g, -36, -4, 11, 14, c.blue, INK, 1.8);
        ell(g, 32, 0, 10, 13, c.yellow, INK, 1.8);
        ell(g, 0, -24, 10, 13, c.red, INK, 1.8);
      }
    } else if (type === 'sock') {
      if (!done) {
        g.save(); g.rotate(-0.4);
        rr(g, -9, -26, 18, 42, 6, c.blue, INK, 2.2);
        rr(g, -9, 8, 26, 17, 7, c.blue, INK, 2.2);
        g.fillStyle = c.cream; g.fillRect(-9, -18, 18, 5);
        g.restore();
      } else {
        g.save(); g.rotate(1.2);
        rr(g, -8, -38, 16, 55, 6, c.blue, INK, 2);
        rr(g, -8, 12, 23, 15, 6, c.blue, INK, 2);
        g.restore();
      }
    } else if (type === 'slipper') {
      if (!done) {
        rr(g, -30, -8, 60, 27, 13, c.orange, INK, 2.6);
        ell(g, 10, -11, 16, 12, c.orange, INK, 2.2);
        ell(g, 14, -12, 5, 6, '#fff4d9', INK, 1.5);
        ell(g, 20, -8, 3, 3, INK, null);
      } else {
        g.save(); g.rotate(-0.3);
        rr(g, -30, -8, 60, 27, 13, c.orange, INK, 2.2);
        g.fillStyle = '#fff4d9';
        g.beginPath();
        g.moveTo(18, -9); g.lineTo(24, -1); g.lineTo(18, 6); g.lineTo(27, 12); g.lineTo(14, 12); g.closePath();
        g.fill(); g.strokeStyle = INK; g.lineWidth = 1.4; g.stroke();
        g.restore();
      }
    } else if (type === 'blanket') {
      if (!done) {
        rr(g, -38, -20, 76, 42, 10, c.purple, INK, 2.6);
        g.fillStyle = lighten(c.purple, 0.2);
        g.fillRect(-32, -14, 64, 8);
        g.strokeStyle = 'rgba(70,50,64,.16)';
        g.lineWidth = 2;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-26 + i * 20, -30); g.lineTo(-26 + i * 20, 12); g.stroke(); }
      } else {
        g.save(); g.rotate(0.1);
        ell(g, -12, 0, 28, 19, c.purple, INK, 2.2);
        ell(g, 16, 4, 23, 15, lighten(c.purple, 0.13), INK, 2.2);
        ell(g, 2, -12, 18, 12, c.purple, INK, 2.2);
        g.restore();
      }
    }
  }

  function drawSeed(g, s, time) {
    if (!s || s.collected) return;
    const bob = Math.sin(time * 3 + s.x * 0.03) * 4;
    g.save();
    g.translate(s.x, s.y + bob);
    g.globalAlpha = 0.9;
    // halo
    const grd = g.createRadialGradient(0, -4, 2, 0, -4, 30);
    grd.addColorStop(0, 'rgba(255,220,110,.5)');
    grd.addColorStop(1, 'rgba(255,220,110,0)');
    g.fillStyle = grd;
    g.fillRect(-30, -34, 60, 60);
    g.globalAlpha = 1;
    ell(g, 0, 0, 11, 15, '#7a4a2c', INK, 2.4);
    g.fillStyle = '#d8a25b';
    g.beginPath(); g.ellipse(-2, -4, 5, 8, -0.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2;
    g.beginPath(); g.arc(-2, -3, 5, 0.2, 1.3); g.stroke();
    star(g, -17, -20, 3.5, '#fff4d9', 'rgba(70,50,64,.25)');
    star(g, 16, -14, 2.8, '#ffd15c', 'rgba(70,50,64,.2)');
    g.restore();
  }

  function drawWord(g, w, time) {
    if (!w || w.collected) return;
    const bob = Math.sin(time * 2.8 + w.x * 0.04) * 4;
    g.save();
    g.translate(w.x, w.y + bob);
    const halo = g.createRadialGradient(0, -8, 3, 0, -8, 46);
    halo.addColorStop(0, 'rgba(124,199,232,.42)');
    halo.addColorStop(1, 'rgba(124,199,232,0)');
    g.fillStyle = halo;
    g.fillRect(-48, -58, 96, 96);
    shadow(g, 0, 24, 20, 6, 0.18);
    g.rotate(-0.08);
    rr(g, -21, -29, 42, 52, 7, '#fffaf0', INK, 2.6);
    rr(g, -21, -29, 42, 15, 6, '#7cc7e8', INK, 2.2);
    g.fillStyle = '#2f7ea5';
    g.font = '900 20px ' + FONT;
    g.textAlign = 'center';
    g.fillText('A', 0, 8);
    g.fillStyle = '#6b4d57';
    g.font = '900 8px ' + FONT;
    g.fillText('abc', 0, 19);
    g.textAlign = 'left';
    star(g, -29, -19, 4.5, '#b9e7f7', 'rgba(70,50,64,.25)');
    star(g, 28, 3, 3.2, '#fff4d9', 'rgba(70,50,64,.2)');
    g.restore();
  }

  function drawHide(g, h, near, time, hidden) {
    if (!h) return;
    if (near && !hidden) {
      g.save();
      const pulse = 0.45 + Math.sin(time * 3.2) * 0.2;
      g.strokeStyle = 'rgba(80,200,140,' + (pulse + 0.2) + ')';
      g.lineWidth = 3;
      g.setLineDash([6, 7]);
      g.lineDashOffset = -time * 14;
      g.beginPath();
      g.ellipse(h.ax, h.ay + 4, 34, 14, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = 'rgba(255,250,240,.95)';
      rr(g, h.ax - 26, h.ay - 32, 52, 21, 9, 'rgba(255,250,240,.92)', 'rgba(70,50,64,.35)', 1.7);
      g.fillStyle = '#3d8f68';
      g.font = '900 9px ' + FONT;
      g.textAlign = 'center';
      g.fillText('ПРЯТКИ', h.ax, h.ay - 18);
      g.textAlign = 'left';
      g.restore();
    }
  }

  function drawExit(g, level, active, time) {
    const e = level.exit;
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    g.save();
    if (active) {
      const pulse = 0.6 + Math.sin(time * 4) * 0.2;
      const grd = g.createRadialGradient(cx, cy, 4, cx, cy, 82);
      grd.addColorStop(0, 'rgba(255,220,100,' + (pulse * 0.5) + ')');
      grd.addColorStop(1, 'rgba(255,220,100,0)');
      g.fillStyle = grd;
      g.fillRect(cx - 86, cy - 86, 172, 172);
      g.strokeStyle = 'rgba(255,209,92,' + pulse + ')';
      g.lineWidth = 4;
      g.setLineDash([8, 8]);
      g.lineDashOffset = -time * 22;
      g.beginPath();
      g.ellipse(cx, cy + 12, 48, 25, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#fff4d9';
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(cx, cy - 56 - Math.sin(time * 3) * 5, 17, 0, Math.PI * 2);
      g.fill(); g.stroke();
      g.fillStyle = '#e97535';
      g.font = '900 20px ' + FONT;
      g.textAlign = 'center';
      g.fillText('↓', cx, cy - 49 - Math.sin(time * 3) * 5);
      g.fillStyle = INK;
      g.font = '900 13px ' + FONT;
      g.fillText(e.label.toUpperCase(), cx, cy + 48);
      g.textAlign = 'left';
    } else {
      g.fillStyle = 'rgba(255,250,235,.7)';
      g.strokeStyle = 'rgba(70,50,64,.4)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, 18, 0, Math.PI * 2);
      g.fill(); g.stroke();
      g.fillStyle = 'rgba(70,50,64,.55)';
      g.font = '900 13px ' + FONT;
      g.textAlign = 'center';
      g.fillText('🔒', cx, cy + 5);
      g.textAlign = 'left';
    }
    g.restore();
  }

  function buildStatic(level) {
    const c = document.createElement('canvas');
    c.width = level.world.w;
    c.height = level.world.h;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';
    drawFloor(g, level);
    drawLabels(g, level);
    level.furniture.filter((f) => f.flat).forEach((f) => drawRug(g, f));
    drawWalls(g, level);
    drawDecor(g, level);
    level.furniture.filter((f) => !f.flat).sort((a, b) => (a.y + a.h) - (b.y + b.h)).forEach((f) => drawFurniture(g, f));
    // subtle border vignette on floor edges
    const vg = g.createLinearGradient(0, 0, 0, 90);
    vg.addColorStop(0, 'rgba(42,25,35,.24)');
    vg.addColorStop(1, 'rgba(42,25,35,0)');
    g.fillStyle = vg;
    g.fillRect(0, 36, level.world.w, 54);
    return c;
  }

  // ============================================================
  // Characters
  // ============================================================
  function blink(time, seed) {
    return (Math.sin(time * 1.1 + seed) > 0.985);
  }

  function drawHoma(g, x, y, time, state) {
    const facing = state.facing || 1;
    const moving = state.moving;
    const speed = state.speed || 0;
    const dash = state.dash > 0;
    const t = time;
    const bounce = moving ? Math.sin(t * 15) * 2.5 : Math.sin(t * 2.4) * 1.3;
    g.save();
    g.translate(x, y + bounce);
    g.scale(facing, 1);
    shadow(g, 0, 5, 28, 8, 0.22);
    // motion lines
    if (dash) {
      g.strokeStyle = 'rgba(255,244,217,.8)';
      g.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(-34 - i * 8, -20 - i * 13);
        g.lineTo(-52 - i * 12, -20 - i * 13);
        g.stroke();
      }
    }
    // legs
    const run = moving ? Math.sin(t * 17) : 0;
    ell(g, -13 + run * 5, -7, 9, 7, '#e98a48', INK, 2.2);
    ell(g, 12 - run * 5, -7, 9, 7, '#e98a48', INK, 2.2);
    // tail
    g.beginPath(); g.moveTo(-20, -28); g.quadraticCurveTo(-37, -31, -31, -16); g.strokeStyle = '#c7743d'; g.lineWidth = 5; g.stroke();
    // body
    ell(g, 0, -31, 25, 28, '#f3a85f', INK, 3);
    ell(g, 3, -28, 16, 19, '#ffe8c2', null);
    // arms
    ell(g, 17, -30, 8, 7, '#e98a48', INK, 2);
    ell(g, -16, -34, 7, 6, '#e98a48', INK, 2);
    // head
    const headY = -62;
    ell(g, -21, headY - 16, 9, 12, '#e98a48', INK, 2.4);
    ell(g, 21, headY - 16, 9, 12, '#e98a48', INK, 2.4);
    ell(g, -21, headY - 16, 4.5, 7, '#ffb7a5', null);
    ell(g, 21, headY - 16, 4.5, 7, '#ffb7a5', null);
    ell(g, 0, headY, 27, 25, '#f3a85f', INK, 3);
    ell(g, 7, headY + 7, 18, 14, '#fff0d3', null);
    // cheeks
    ell(g, -16, headY + 6, 8, 5, 'rgba(255,139,139,.45)', null);
    ell(g, 19, headY + 6, 8, 5, 'rgba(255,139,139,.45)', null);
    // eyes
    const isBlink = blink(t, 0.7);
    if (isBlink) {
      line(g, -14, headY - 2, -4, headY + 1, INK, 2.4);
      line(g, 10, headY - 2, 20, headY + 1, INK, 2.4);
    } else {
      ell(g, -9, headY - 3, 6.5, 7.5, '#3a2731', null);
      ell(g, 13, headY - 3, 6.5, 7.5, '#3a2731', null);
      ell(g, -7, headY - 6, 2.2, 2.8, '#fff', null);
      ell(g, 15, headY - 6, 2.2, 2.8, '#fff', null);
    }
    // brows when dashing
    if (dash) {
      line(g, -17, headY - 14, -4, headY - 11, INK, 2);
      line(g, 9, headY - 11, 21, headY - 14, INK, 2);
    }
    // nose/mouth
    ell(g, 4, headY + 10, 4.5, 3.5, '#e06d6d', INK, 1.7);
    g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(4, headY + 13, 7, 0.2, Math.PI - 0.2); g.stroke();
    // whiskers
    line(g, 13, headY + 8, 32, headY + 3, 'rgba(70,50,64,.5)', 1.5);
    line(g, 13, headY + 12, 33, headY + 13, 'rgba(70,50,64,.5)', 1.5);
    g.restore();
  }

  function drawMom(g, x, y, time, state) {
    const facing = state.facing || 1;
    const moving = state.moving;
    const chase = state.chasing;
    const t = time;
    const bounce = moving ? Math.sin(t * 13) * 2.5 : Math.sin(t * 2) * 1.2;
    g.save();
    g.translate(x, y + bounce);
    g.scale(facing, 1);
    shadow(g, 0, 5, 33, 9, 0.23);
    // legs
    const run = moving ? Math.sin(t * 14) : 0;
    ell(g, -14 + run * 5, -6, 10, 7, '#c98958', INK, 2.3);
    ell(g, 13 - run * 5, -6, 10, 7, '#c98958', INK, 2.3);
    // dress
    g.beginPath();
    g.moveTo(-25, -76); g.quadraticCurveTo(-38, -34, -23, -8);
    g.lineTo(23, -8); g.quadraticCurveTo(38, -34, 25, -76); g.closePath();
    g.fillStyle = '#5f9b8b'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    rr(g, -17, -60, 34, 45, 10, '#fff4d9', INK, 2.2);
    line(g, -10, -45, 10, -45, '#d9b48b', 2);
    ell(g, 0, -52, 3, 3, '#e47d6d', null);
    // arms
    g.save(); g.translate(24, -63); g.rotate(chase ? -0.9 : -0.4); rr(g, -4, 0, 8, 32, 4, '#c98958', INK, 2); g.restore();
    g.save(); g.translate(-24, -63); g.rotate(chase ? 0.9 : 0.4); rr(g, -4, 0, 8, 32, 4, '#c98958', INK, 2); g.restore();
    // spoon
    g.save(); g.translate(33, -55); g.rotate(-0.65);
    line(g, 0, 0, 0, 30, '#b98456', 5);
    ell(g, 0, 34, 7, 11, '#c9955e', INK, 2);
    g.restore();
    // head
    ell(g, -19, -99, 8, 10, '#c98958', INK, 2.2); ell(g, 19, -99, 8, 10, '#c98958', INK, 2.2);
    ell(g, -19, -99, 4, 6, '#f7b6a7', null); ell(g, 19, -99, 4, 6, '#f7b6a7', null);
    ell(g, 0, -89, 25, 23, '#d99c68', INK, 3);
    ell(g, 5, -82, 16, 12, '#ffe8c2', null);
    // bun
    ell(g, -20, -107, 8, 8, '#b5764b', INK, 2.2);
    // eyes (glasses)
    ell(g, -8, -92, 6, 6.5, '#3a2731', null);
    ell(g, 13, -92, 6, 6.5, '#3a2731', null);
    ell(g, -6, -94, 2, 2.5, '#fff', null); ell(g, 15, -94, 2, 2.5, '#fff', null);
    g.strokeStyle = '#7d5a45'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(-8, -92, 9, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(13, -92, 9, 0, Math.PI * 2); g.stroke();
    line(g, 1, -92, 4, -92, '#7d5a45', 1.6);
    ell(g, 3, -82, 3.5, 2.8, '#b85e5e', INK, 1.4);
    g.strokeStyle = INK; g.lineWidth = 1.8;
    if (chase) {
      line(g, -15, -103, -3, -100, INK, 2.2);
      line(g, 8, -100, 20, -103, INK, 2.2);
      g.beginPath(); g.arc(3, -77, 6, 0.1, Math.PI - 0.1); g.stroke();
    } else {
      g.beginPath(); g.arc(3, -80, 6, 0.15, Math.PI - 0.15); g.stroke();
    }
    g.restore();
  }

  function drawCat(g, x, y, time, state) {
    const facing = state.facing || 1;
    const moving = state.moving;
    const chasing = state.chasing;
    const sleeping = state.sleeping;
    const t = time;
    const bounce = moving ? Math.sin(t * 16) * 2 : Math.sin(t * 2) * 0.8;
    g.save();
    g.translate(x, y + bounce);
    g.scale(facing, 1);
    shadow(g, 0, 5, 28, 7, 0.2);
    if (sleeping) {
      g.fillStyle = 'rgba(255,255,255,.7)';
      g.font = '900 17px ' + FONT;
      g.fillText('z', 28, -50);
      g.font = '900 12px ' + FONT;
      g.fillText('z', 40, -64);
    }
    // tail
    g.beginPath();
    g.moveTo(-23, -17);
    g.bezierCurveTo(-58, -28, -48, -66, -26, -48);
    g.strokeStyle = '#8f8995'; g.lineWidth = 9; g.lineCap = 'round'; g.stroke();
    g.strokeStyle = '#5d5765'; g.lineWidth = 2; g.stroke();
    // legs
    const run = moving ? Math.sin(t * 18) : 0;
    ell(g, -19 + run * 4, -6, 8, 6, '#a9a3ad', INK, 2);
    ell(g, 16 - run * 4, -6, 8, 6, '#a9a3ad', INK, 2);
    // body
    ell(g, 0, -23, 31, 19, '#a9a3ad', INK, 3);
    ell(g, 0, -18, 21, 10, '#e9e3df', null);
    // stripes
    g.strokeStyle = '#6f6977'; g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.arc(-9 + i * 11, -30, 9, Math.PI + 0.35, Math.PI * 2 - 0.35); g.stroke();
    }
    // head
    ell(g, 24, -38, 18, 16, '#b3adb8', INK, 2.8);
    g.beginPath(); g.moveTo(12, -51); g.lineTo(10, -66); g.lineTo(24, -55); g.closePath();
    g.fillStyle = '#b3adb8'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke();
    g.beginPath(); g.moveTo(33, -51); g.lineTo(39, -64); g.lineTo(42, -49); g.closePath();
    g.fillStyle = '#b3adb8'; g.fill(); g.stroke();
    g.fillStyle = '#ffb7c7';
    g.beginPath(); g.moveTo(13, -54); g.lineTo(12, -62); g.lineTo(20, -55); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(34, -53); g.lineTo(38, -61); g.lineTo(39, -51); g.closePath(); g.fill();
    // eyes
    if (sleeping) {
      line(g, 18, -39, 25, -39, INK, 2);
      line(g, 30, -39, 37, -39, INK, 2);
    } else if (chasing) {
      g.fillStyle = '#ffd15c';
      ell(g, 21, -40, 5, 6, '#ffd15c', INK, 1.7);
      ell(g, 34, -40, 5, 6, '#ffd15c', INK, 1.7);
      ell(g, 21, -40, 1.8, 5, INK, null); ell(g, 34, -40, 1.8, 5, INK, null);
    } else {
      ell(g, 21, -40, 4.5, 6, '#5b8a56', INK, 1.6);
      ell(g, 34, -40, 4.5, 6, '#5b8a56', INK, 1.6);
      ell(g, 21, -40, 1.6, 4, INK, null); ell(g, 34, -40, 1.6, 4, INK, null);
    }
    ell(g, 43, -35, 3.2, 2.6, '#e08b8b', INK, 1.2);
    line(g, 42, -30, 52, -32, 'rgba(70,50,64,.55)', 1.2);
    line(g, 42, -27, 52, -24, 'rgba(70,50,64,.55)', 1.2);
    line(g, 38, -25, 41, -23, INK, 1.5);
    g.restore();
  }

  function drawRobot(g, x, y, time, state) {
    const facing = state.facing || 1;
    const moving = state.moving;
    const chasing = state.chasing;
    const t = time;
    g.save();
    g.translate(x, y);
    if (moving) g.rotate(Math.sin(t * 7) * 0.02);
    shadow(g, 0, 5, 46, 10, 0.24);
    // light cone
    if (!state.sleeping) {
      g.save();
      g.rotate(state.angle || (facing > 0 ? 0 : Math.PI));
      const grd = g.createLinearGradient(0, 0, 170, 0);
      grd.addColorStop(0, chasing ? 'rgba(255,130,95,.38)' : 'rgba(130,215,255,.26)');
      grd.addColorStop(1, 'rgba(130,215,255,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(18, -16);
      g.lineTo(185, -64);
      g.lineTo(185, 34);
      g.lineTo(18, 6);
      g.closePath();
      g.fill();
      g.restore();
    }
    // brush
    g.strokeStyle = '#4d4957'; g.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const a = t * 8 + i * 1.25;
      line(g, Math.cos(a) * 14, -3 + Math.sin(a) * 4, Math.cos(a) * 36, -3 + Math.sin(a) * 10, '#6f6a7b', 2);
    }
    // body
    rr(g, -42, -29, 84, 32, 16, '#5d596a', INK, 3);
    rr(g, -37, -34, 74, 21, 11, '#9692a3', INK, 2.2);
    rr(g, -31, -31, 62, 11, 6, '#b5b2bf', null);
    rr(g, -41, -7, 82, 7, 4, chasing ? '#ff8b7d' : '#79d2db', INK, 1.6);
    // face
    const eyeColor = chasing ? '#ff7a72' : '#7cc7e8';
    ell(g, -14, -18, 7, 6, eyeColor, INK, 1.8);
    ell(g, 14, -18, 7, 6, eyeColor, INK, 1.8);
    ell(g, -12.5, -19, 2.4, 2.4, '#fff', null); ell(g, 15.5, -19, 2.4, 2.4, '#fff', null);
    g.strokeStyle = INK; g.lineWidth = 1.8;
    g.beginPath(); g.arc(0, -10, 6, 0.2, Math.PI - 0.2); g.stroke();
    // antenna
    line(g, 0, -34, 0, -45, INK, 2.2);
    ell(g, 0, -47, 4.5, 4.5, chasing ? '#ff7a72' : '#6fce9b', INK, 1.5);
    // lights
    g.fillStyle = chasing ? '#ff7a72' : '#6fce9b';
    ell(g, 31, -9, 3, 3, g.fillStyle, null);
    ell(g, -31, -9, 3, 3, g.fillStyle, null);
    g.restore();
  }

  function drawSpeech(g, x, y, text, color, time) {
    if (!text) return;
    g.save();
    g.font = '800 15px ' + FONT;
    const w = Math.min(250, g.measureText(text).width + 26);
    const h = 34;
    const bx = x - w / 2;
    const by = y - 84;
    g.globalAlpha = 0.97;
    rr(g, bx, by, w, h, 12, color || '#fff8e9', INK, 2.4);
    g.beginPath();
    g.moveTo(x - 7, by + h - 1);
    g.lineTo(x, by + h + 10);
    g.lineTo(x + 8, by + h - 1);
    g.closePath();
    g.fillStyle = color || '#fff8e9'; g.fill();
    g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, x, by + h / 2 + 1);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.restore();
  }

  function drawHidingEyes(g, h, time) {
    if (!h) return;
    const x = h.px;
    const y = h.py;
    g.save();
    ell(g, x, y + 4, 18, 9, 'rgba(38,24,33,.22)', null);
    ell(g, x - 7, y, 4.5, 5.5, '#fffdf5', INK, 1.6);
    ell(g, x + 7, y, 4.5, 5.5, '#fffdf5', INK, 1.6);
    ell(g, x - 6.5, y + 0.5, 2.2, 3, INK, null);
    ell(g, x + 7.5, y + 0.5, 2.2, 3, INK, null);
    g.fillStyle = 'rgba(255,250,240,.94)';
    rr(g, x - 22, y - 30, 44, 19, 8, 'rgba(255,250,240,.94)', 'rgba(70,50,64,.35)', 1.6);
    g.fillStyle = '#5b4b57';
    g.font = '900 9px ' + FONT;
    g.textAlign = 'center';
    g.fillText('ТС-С...', x, y - 17);
    g.textAlign = 'left';
    g.restore();
  }

  function drawParticles(g, particles) {
    particles.forEach((p) => {
      const a = Math.max(0, p.life / p.max);
      g.save();
      g.globalAlpha = a;
      if (p.shape === 'star') {
        star(g, p.x, p.y, p.size, p.color);
      } else if (p.shape === 'ring') {
        g.strokeStyle = p.color;
        g.lineWidth = 3 * a;
        g.beginPath();
        g.arc(p.x, p.y, p.size + (1 - a) * 35, 0, Math.PI * 2);
        g.stroke();
      } else {
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.size * (0.6 + a * 0.4), 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    });
  }

  window.Art = {
    buildStatic, drawTask, drawSeed, drawWord, drawHide, drawExit, drawFurniture,
    drawHoma, drawMom, drawCat, drawRobot, drawSpeech, drawHidingEyes, drawParticles,
    star, rr, ell, line, shadow, mix, lighten, darken, INK, FONT
  };
})();
