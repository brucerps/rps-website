/* Rock Papers Scissors — space scene, intro, launch sequence.
   Tweak: star count (STARS), asteroid count (FIELD), scissors fly-by interval (15s),
   intro speed (the 1.4 multiplier on iT). Respects prefers-reduced-motion. */
(() => {
  const VIDEO = !!window.RPS_VIDEO;
  if (VIDEO) document.documentElement.classList.add('video');
  // The page name and its two scene labels live on <main> (and on <body> for older copies).
  const pageAttr = (k) => { const m = document.querySelector('main'); return (m && m.dataset[k]) || document.body.dataset[k] || ''; };
  let PAGE = pageAttr('page') || 'home';
  let SHORT = !VIDEO && PAGE !== 'home'; // inner pages: smaller stone, higher up
  const reduce = !VIDEO && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Home page opening title: asteroid shower -> ROCK / PAPERS / SCISSORS + "raw to reality." -> words fly into the logo.
  // Skipped when arriving from another page of the site (the visitor has already seen it) or with reduced motion.
  let fromSite = false;
  try { fromSite = !!document.referrer && new URL(document.referrer).origin === location.origin && location.origin !== 'null'; } catch (e) {}
  if (window.RPS_FROM) fromSite = true; // set by the small script in each page's <head>
  const INTRO = !VIDEO && !reduce && PAGE === 'home' && !fromSite;
  let introMode = INTRO;            // true once the opening title has been played on this page (also after "Replay intro")
  // Moving between pages: the scene (stars, rocks, header) never reloads. The old page's words slide up and fade out,
  // the stone glides to its place for the next page, and the new page's words rise in one after another.
  // ui.js swaps the page content between the two halves and calls RPS.exit() / RPS.enter().
  let quick = !VIDEO && !INTRO;     // false only while the opening title is playing or building the home page
  const EXIT = 0.26;                // seconds for the old page to leave
  const ENTER = 0.75;               // seconds for the new page to build and the stone to settle
  const page = { enter: 0, exit: -1 };                                  // when the current page started coming in / going out
  const kShort = { from: SHORT ? 1 : 0, to: SHORT ? 1 : 0, t: -9 };     // 0 = home layout, 1 = inner-page layout (eased)
  const glide = { d: 0, t: -9 };    // scroll distance the scene still has to ease through after a page swap
  const pop = { t: -9 };            // the stone fades in instead of gliding when it was far off screen
  let sceneOff = 0;                 // permanent scroll offset for stars and far rocks, so they never jump on a swap
  let flyOff = 7;                   // keeps the scissors fly-by on one steady clock across pages
  let BUILD = INTRO ? 9.4 : 0;   // seconds into the intro when the page itself starts building
  const HANDOFF = 10.05;           // seconds into the intro when the flying words become the header logo
  const cv = document.getElementById('space');
  const ctx = cv.getContext('2d');
  // Phones (Android and iPhone): fewer stars and rocks, capped pixel ratio, and ignore the small height changes
  // the browser toolbar makes while scrolling so the scene never jumps.
  const PHONE = !VIDEO && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760);
  let W = 0, H = 0, DPR = 1, lastW = 0, lastH = 0;
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (PHONE && w === lastW && Math.abs(h - lastH) < 160) return;
    resize();
  }
  function resize() {
    lastW = window.innerWidth; lastH = window.innerHeight;
    W = window.innerWidth; H = window.innerHeight;
    DPR = VIDEO ? 1 : Math.min(window.devicePixelRatio || 1, PHONE ? 1.5 : 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize(); window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));

  // ---------- helpers
  const cl = (x) => Math.max(0, Math.min(1, x));
  const pr = (t, a, b) => cl((t - a) / (b - a));
  const lerp = (a, b, p) => a + (b - a) * p;
  const eOC = (p) => 1 - Math.pow(1 - p, 3);
  const eIOC = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const eOX = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- stars
  const R0 = rng(11);
  const STARS = Array.from({ length: PHONE ? 480 : 950 }, () => ({ x: (R0() * 2 - 1) * 1.3, y: (R0() * 2 - 1) * 1.3, z: R0(), b: 0.35 + R0() * 0.65, red: R0() < 0.06 }));
  const warpDist = (t) => 0.018 * t + 2.4 * eOC(pr(t, 0, 2.6)) + (VIDEO ? 2.2 * Math.pow(pr(t, 17.2, 19.2), 2.2) : 0);
  const warpSpeed = (t) => (warpDist(t + 0.02) - warpDist(t)) / 0.02;
  // live mode: integrate star travel frame by frame so the intro warp and the launch warp can start any time
  let liveDist = 0, lastT = null, introStart = 0;
  const launch = { state: 'idle', t: -99 };
  function liveSpeedAt(t) {
    if (reduce) return 0.004;
    const it = t - introStart;
    let s = 0.018;
    if (introMode) {
      if (it >= 0 && it < 12) {
        s += 3.6 * Math.pow(1 - cl(it / 3.4), 1.7);                           // the asteroid shower
        s += 0.9 * Math.sin(Math.PI * cl((it - 8.1) / 2.1));                  // a gust as the words fly home
      }
    } else if (it >= 0 && !quick) s += 3.0 * Math.pow(1 - cl(it / 1.9), 2);
    if (launch.state === 'open') s += 2.4 * eOC(pr(t, launch.t, launch.t + 1.1));
    else if (launch.state === 'closing') s += 2.4 * (1 - eOC(pr(t, launch.t, launch.t + 0.9)));
    return s;
  }

  // ---------- low-poly asteroid meshes
  function icosphere(sub) {
    const p = (1 + Math.sqrt(5)) / 2;
    let v = [[-1,p,0],[1,p,0],[-1,-p,0],[1,-p,0],[0,-1,p],[0,1,p],[0,-1,-p],[0,1,-p],[p,0,-1],[p,0,1],[-p,0,-1],[-p,0,1]].map(n);
    let f = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    function n(a) { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; }
    for (let s = 0; s < sub; s++) {
      const cache = {}; const nf = [];
      const mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] !== undefined) return cache[k]; const A = v[a], B = v[b]; v.push(n([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2])); return (cache[k] = v.length - 1); };
      for (const [a, b, c] of f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      f = nf;
    }
    return { v, f };
  }
  function makeRock(seed, sub, rough) {
    const r = rng(seed); const m = icosphere(sub);
    const bumps = Array.from({ length: 7 }, () => { const d = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]; const l = Math.hypot(...d); return [d[0] / l, d[1] / l, d[2] / l, (r() * 2 - 1) * rough]; });
    const sx = 0.85 + r() * 0.3, sy = 0.75 + r() * 0.25, sz = 0.85 + r() * 0.3;
    m.v = m.v.map((p) => { let k = 1; for (const b of bumps) { const d = p[0] * b[0] + p[1] * b[1] + p[2] * b[2]; k += b[3] * Math.pow(Math.max(0, d), 3); } k += (r() - 0.5) * rough * 0.35; return [p[0] * k * sx, p[1] * k * sy, p[2] * k * sz]; });
    return m;
  }
  function rotM(ax, ay, az) {
    const [ca, sa, cb, sb, cc, sc] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay), Math.cos(az), Math.sin(az)];
    return [cb * cc, -cb * sc, sb, sa * sb * cc + ca * sc, -sa * sb * sc + ca * cc, -sa * cb, -ca * sb * cc + sa * sc, ca * sb * sc + sa * cc, ca * cb];
  }
  const L1 = (() => { const a = [-0.55, -0.65, -0.52]; const l = Math.hypot(...a); return a.map((x) => x / l); })();
  const L2 = (() => { const a = [0.9, 0.15, 0.42]; const l = Math.hypot(...a); return a.map((x) => x / l); })();
  const L3 = (() => { const a = [-0.75, 0.62, 0.3]; const l = Math.hypot(...a); return a.map((x) => x / l); })();
  function drawRock(m, cx, cy, R, rot, alpha, redRim) {
    if (R < 2 || alpha <= 0.01) return;
    if (cx < -R * 2 || cx > W + R * 2 || cy < -R * 2 || cy > H + R * 2) return;
    const M = rot; const tv = m.v.map((p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]]);
    const faces = [];
    for (const [a, b, c] of m.f) {
      const A = tv[a], B = tv[b], C = tv[c];
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const cxm = (A[0] + B[0] + C[0]) / 3, cym = (A[1] + B[1] + C[1]) / 3, czm = (A[2] + B[2] + C[2]) / 3;
      if (nx * cxm + ny * cym + nz * czm < 0) { nx = -nx; ny = -ny; nz = -nz; }
      if (nz > 0.02) continue;
      faces.push([A, B, C, nx, ny, nz, czm]);
    }
    faces.sort((p, q) => q[6] - p[6]);
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
    for (const [A, B, C, nx, ny, nz] of faces) {
      const lam = Math.max(0, nx * L1[0] + ny * L1[1] + nz * L1[2]);
      const rim = Math.pow(Math.max(0, nx * L2[0] + ny * L2[1] + nz * L2[2]), 1.6) * redRim;
      const rrim = Math.pow(Math.max(0, nx * L3[0] + ny * L3[1] + nz * L3[2]), 1.5) * redRim;
      const k = 0.1 + 0.9 * lam;
      const r = Math.round(Math.min(255, 10 + 168 * k + 80 * rim + 225 * rrim)), g = Math.round(Math.min(255, 11 + 170 * k + 104 * rim + 4 * rrim)), bb = Math.round(Math.min(255, 14 + 176 * k + 150 * rim + 2 * rrim));
      const col = `rgb(${r},${g},${bb})`;
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx + A[0] * R, cy + A[1] * R); ctx.lineTo(cx + B[0] * R, cy + B[1] * R); ctx.lineTo(cx + C[0] * R, cy + C[1] * R); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  const HERO = makeRock(3, 1, 0.55);
  const CTAR = makeRock(19, 1, 0.6);
  const R1 = rng(42);
  // intro: light ribbons (the curtain that opens on the name)
  const RM = rng(77);
  const RIBBONS = Array.from({ length: 34 }, () => ({ x: (RM() - 0.5) * 2, w: 2 + Math.pow(RM(), 2) * 38, c: RM() < 0.5 ? [225, 6, 0] : (RM() < 0.6 ? [242, 241, 236] : [175, 192, 222]), a: 0.25 + RM() * 0.6, d: RM() * 0.35 }));
  const FIELD = Array.from({ length: PHONE ? 9 : 16 }, (_, i) => ({ m: makeRock(100 + i, 1, 0.5 + R1() * 0.3), x: R1(), y: R1() * 1.8 - 0.2, d: 0.25 + R1() * 0.75, s: 10 + R1() * 34, vx: (R1() - 0.5) * 0.012, w: [(R1() - 0.5) * 0.9, (R1() - 0.5) * 0.9, (R1() - 0.5) * 0.6], o: [R1() * 6, R1() * 6, R1() * 6] }));

  // ---------- scissors & paper (brand elements)
  const SC = { pv: [50, 47], tipL: [31, 3], tipR: [69, 3], ringL: [31, 79], ringR: [69, 79], bw: 15, sw: 10, ro: 14, ri: 7.2 };
  function arm(tip, ring) {
    const pv = SC.pv; const u = norm([tip[0] - pv[0], tip[1] - pv[1]]); const nrm = [-u[1], u[0]]; const v = norm([ring[0] - pv[0], ring[1] - pv[1]]); const mm = [-v[1], v[0]];
    const back = [pv[0] + v[0] * 5, pv[1] + v[1] * 5];
    const blade = [tip, [pv[0] + nrm[0] * SC.bw / 2, pv[1] + nrm[1] * SC.bw / 2], [back[0] + nrm[0] * SC.bw * 0.45, back[1] + nrm[1] * SC.bw * 0.45], [back[0] - nrm[0] * SC.bw * 0.45, back[1] - nrm[1] * SC.bw * 0.45], [pv[0] - nrm[0] * SC.bw / 2, pv[1] - nrm[1] * SC.bw / 2]];
    const e = [ring[0] - v[0] * (SC.ro - 3), ring[1] - v[1] * (SC.ro - 3)];
    const shank = [[pv[0] + mm[0] * SC.sw / 2, pv[1] + mm[1] * SC.sw / 2], [e[0] + mm[0] * SC.sw / 2, e[1] + mm[1] * SC.sw / 2], [e[0] - mm[0] * SC.sw / 2, e[1] - mm[1] * SC.sw / 2], [pv[0] - mm[0] * SC.sw / 2, pv[1] - mm[1] * SC.sw / 2]];
    return { blade, shank, ring };
    function norm(a) { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; }
  }
  const ARM_A = arm(SC.tipR, SC.ringL), ARM_B = arm(SC.tipL, SC.ringR);
  function drawArm(a, th, col, halo) {
    ctx.save(); ctx.translate(50, 47); ctx.rotate(th); ctx.translate(-50, -47);
    if (halo) {
      ctx.strokeStyle = '#050505'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      for (const poly of [a.blade, a.shank]) { ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(a.ring[0], a.ring[1], SC.ro, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = col;
    for (const poly of [a.blade, a.shank]) { ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.arc(a.ring[0], a.ring[1], SC.ro, 0, Math.PI * 2); ctx.arc(a.ring[0], a.ring[1], SC.ri, 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.restore();
  }
  function drawScissors(x, y, size, ang, open) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(size / 100, size / 100); ctx.translate(-50, -47);
    const th = open * Math.PI / 180;
    drawArm(ARM_A, -th, '#E10600', false);
    drawArm(ARM_B, th, '#E10600', true);
    ctx.fillStyle = '#F2F1EC'; ctx.beginPath(); ctx.arc(50, 47, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawPaper(x, y, size, rot, squash, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(squash * size / 100, size / 100);
    const f = 18, x0 = -35, y0 = -46, x1 = 35, y1 = 46;
    const sheet = () => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - f, y0); ctx.lineTo(x1, y0 + f); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath(); };
    const gr = ctx.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(242,241,236,0.22)'); gr.addColorStop(1, 'rgba(175,192,222,0.08)');
    ctx.save(); ctx.translate(5, 6); ctx.fillStyle = 'rgba(225,6,0,0.85)'; sheet(); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(10,12,18,0.85)'; sheet(); ctx.fill();
    ctx.fillStyle = gr; sheet(); ctx.fill();
    ctx.strokeStyle = 'rgba(242,241,236,0.85)'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; sheet(); ctx.stroke();
    ctx.fillStyle = 'rgba(242,241,236,0.35)'; ctx.beginPath(); ctx.moveTo(x1 - f, y0); ctx.lineTo(x1 - f, y0 + f); ctx.lineTo(x1, y0 + f); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(175,192,222,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-2, -8, 18, 0, Math.PI * 2); ctx.stroke();
    for (const a of [270, 30, 150]) { const r = a * Math.PI / 180; ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-2 + 18 * Math.cos(r), -8 + 18 * Math.sin(r)); ctx.stroke(); }
    ctx.fillStyle = '#E10600'; ctx.beginPath(); ctx.arc(-2, -8, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(242,241,236,0.6)'; ctx.beginPath(); ctx.moveTo(-22, 24); ctx.lineTo(20, 24); ctx.moveTo(-22, 32); ctx.lineTo(4, 32); ctx.stroke();
    ctx.restore();
  }

  // ---------- hero orbit (drawn on the canvas so the stone can hide its far side)
  function drawOrbit(o, front) {
    const s0 = front ? 0 : Math.PI, s1 = front ? Math.PI : Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = o.a * (front ? 0.8 : 0.32);
    ctx.strokeStyle = '#E10600'; ctx.lineWidth = front ? 1.4 : 1; ctx.setLineDash([2, 7]); ctx.lineDashOffset = -performance.now() / 1000 * 26;
    ctx.beginPath(); ctx.ellipse(o.x, o.y, o.rx, o.ry, o.ang, s0, s1); ctx.stroke();
    ctx.setLineDash([]);
    // the little planet: full brightness on the near side, fades out as it slips behind the stone
    const sn = Math.sin(o.th), inFront = sn >= 0;
    if (inFront === front) {
      const ex = o.rx * Math.cos(o.th), ey = o.ry * sn, ca = Math.cos(o.ang), sa = Math.sin(o.ang);
      const px = o.x + ex * ca - ey * sa, py = o.y + ex * sa + ey * ca;
      const vis = front ? 1 : cl(1 + sn * 3.2);
      if (vis > 0.01) {
        ctx.globalAlpha = o.a * vis;
        const r = 3.2 + 1.6 * (sn + 1) / 2;
        const gl = ctx.createRadialGradient(px, py, 0, px, py, r * 4); gl.addColorStop(0, 'rgba(242,241,236,0.55)'); gl.addColorStop(1, 'rgba(242,241,236,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, r * 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F2F1EC'; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- opening title: light ribbons part like a curtain
  function drawShower(it) {
    const D = Math.hypot(W, H);
    // curtain: ribbons of light gather at the centre, flare, then part outwards
    const q = pr(it, 2.3, 4.4);
    if (q > 0 && q < 1) {
      const gather = eIOC(cl(q / 0.42)), open = eOC(cl((q - 0.42) / 0.58));
      const fade = Math.sin(Math.PI * q);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const r of RIBBONS) {
        const spread = lerp(1, 0.05, gather) + open * 1.6;
        const x = W / 2 + r.x * W * 0.5 * spread;
        const w = r.w * (0.6 + open * 2.2) * (W / 1440 + 0.4);
        const gr = ctx.createLinearGradient(0, 0, 0, H);
        const [cr, cg, cb] = r.c; const a = r.a * fade * 0.55;
        gr.addColorStop(0, `rgba(${cr},${cg},${cb},0)`); gr.addColorStop(0.5, `rgba(${cr},${cg},${cb},${a})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = gr; ctx.fillRect(x - w / 2, 0, w, H);
      }
      // the flash where the ribbons meet
      const fl = Math.exp(-Math.pow((q - 0.42) / 0.09, 2));
      const fg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
      fg.addColorStop(0, `rgba(255,120,90,${0.45 * fl})`); fg.addColorStop(0.35, `rgba(225,6,0,${0.18 * fl})`); fg.addColorStop(1, 'rgba(225,6,0,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ---------- HUD
  const hud = { g: document.getElementById('hudg'), orbit: document.getElementById('orbit'), sat: document.getElementById('sat'), ticks: document.getElementById('ticks'), leader: document.getElementById('leader'), l1: document.getElementById('lab1'), l2: document.getElementById('lab2') };
  hud.ticks.innerHTML = [0, 1, 2, 3].map(() => '<line x1="0" y1="0" x2="0" y2="0"></line>').join('');
  const tickEls = hud.ticks.querySelectorAll('line');
  hud.orbit.style.display = 'none'; hud.sat.style.display = 'none'; // now drawn on the canvas

  // ---------- DOM refs
  const headerBar = document.querySelector('header.bar');
  const outro = document.getElementById('outro');
  // everything that belongs to the page content is looked up again each time the content is swapped
  let clock, reveals, mainEl, footEl, introEls, ctaSec;
  const revTop = [];
  function bindPage() {
    PAGE = pageAttr('page') || 'home'; SHORT = !VIDEO && PAGE !== 'home';
    clock = document.getElementById('clock');
    reveals = Array.from(document.querySelectorAll('.reveal'));
    mainEl = document.querySelector('main'); footEl = document.querySelector('footer');
    introEls = ['eyebrow', 'hl1', 'hl2', 'lede', 'ctas', 'heroFoot'].map((id) => document.getElementById(id));
    ctaSec = document.querySelector('[data-cta-rock]');
    if (pageAttr('hud1')) hud.l1.textContent = pageAttr('hud1');
    if (pageAttr('hud2')) hud.l2.textContent = pageAttr('hud2');
  }
  bindPage();

  const logoEl = headerBar.querySelector('.logo');
  const navEl = headerBar.querySelector('nav');
  const barR = headerBar.querySelector('.bar-r');
  const logoWords = logoEl ? Array.from(logoEl.querySelectorAll('.lw')) : [];
  const logoDots = logoEl ? Array.from(logoEl.querySelectorAll('.ldot')) : [];

  // ---------- opening title overlay (home page)
  const intro = { el: null, words: [], tag: null, skip: null, live: false, L: null };
  function buildIntro() {
    if (intro.el || !logoWords.length) return;
    const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('aria-hidden', 'true');
    intro.words = logoWords.map((w) => {
      const svg = w.querySelector('svg'); const vb = svg.viewBox.baseVal;
      const d = document.createElement('div'); d.className = 'iw'; d.style.width = vb.width + 'px'; d.style.height = vb.height + 'px';
      d.appendChild(svg.cloneNode(true)); el.appendChild(d); return { el: d, w: vb.width, h: vb.height };
    });
    const tag = document.createElement('div'); tag.className = 'itag';
    tag.innerHTML = '<span class="w-raw">raw</span> <span class="w-to">to</span> <span class="w-real">reality<span class="dot">.</span></span>';
    el.appendChild(tag); intro.tag = tag;
    const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'iskip'; skip.innerHTML = 'Skip intro <b aria-hidden="true">→</b>';
    skip.setAttribute('aria-label', 'Skip intro'); el.appendChild(skip); intro.skip = skip;
    document.body.appendChild(el); intro.el = el;
    layoutIntro(); window.addEventListener('resize', layoutIntro);
  }
  function layoutIntro() {
    if (!intro.el) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    // big stacked name: sized so SCISSORS (the widest word) fits comfortably
    const hb = Math.min(vh * 0.19, (vw * 0.84) * 111.68 / 463.7, 200);
    const lineH = hb * 0.86, tagH = hb * 0.36, gap = hb * 0.34;
    const total = lineH * 2 + hb + gap + tagH;
    const top = (vh - total) / 2 - hb * 0.05;
    const start = intro.words.map((w, i) => { const s = hb / w.h; return { x: (vw - w.w * s) / 2, y: top + i * lineH, s }; });
    const end = logoWords.map((lw, i) => { const r = lw.getBoundingClientRect(); return { x: r.left, y: r.top, s: r.height / intro.words[i].h }; });
    intro.tag.style.fontSize = tagH + 'px';
    intro.tag.style.top = (top + lineH * 2 + hb + gap) + 'px';
    intro.L = { start, end, vh };
  }
  function setLogo(visible, dotP) {
    logoWords.forEach((w) => { w.style.opacity = visible ? '' : '0'; });
    logoDots.forEach((d, i) => { const q = eOX(cl(dotP * 2 - i * 0.5)); d.style.transform = `scale(${q.toFixed(3)})`; d.style.opacity = q.toFixed(3); });
  }
  function updateIntro(it) {
    if (!introMode || !intro.el) return;
    const on = it >= 0 && it < HANDOFF;
    if (on !== intro.live) {
      intro.live = on; intro.el.style.display = on ? 'block' : 'none';
      document.documentElement.classList.toggle('intro-lock', on);
      if (on) layoutIntro();
    }
    if (!on) { setLogo(true, 1); return; }
    const L = intro.L; if (!L) return;
    setLogo(false, pr(it, 9.55, 10.25));
    intro.words.forEach((w, i) => {
      const a0 = 3.05 + i * 0.72;
      const q = eOC(pr(it, a0, a0 + 1.05));
      const m = eIOC(pr(it, 8.2 + i * 0.14, 9.75 + i * 0.14));
      const S = L.start[i], E = L.end[i];
      const x = lerp(S.x, E.x, m), y = lerp(S.y, E.y, m) - Math.sin(Math.PI * m) * L.vh * 0.035;
      const s = S.s * Math.pow(E.s / S.s, m) * (1 + (1 - q) * 0.28);
      // a little extra size while it arrives, grown from the word's centre
      const cxo = w.w * S.s * (1 - q) * 0.14 * (1 - m);
      const glow = Math.exp(-Math.pow((it - a0 - 0.45) / 0.45, 2)) * (1 - m);
      w.el.style.transform = `translate3d(${(x - cxo).toFixed(2)}px,${(y - (1 - q) * w.h * S.s * 0.14).toFixed(2)}px,0) scale(${s.toFixed(5)})`;
      w.el.style.opacity = q.toFixed(3);
      w.el.style.filter = `blur(${((1 - q) * 14).toFixed(2)}px) drop-shadow(0 0 ${(18 * glow + 0.01).toFixed(1)}px rgba(225,6,0,${(0.9 * glow).toFixed(3)}))`;
    });
    const ti = eOC(pr(it, 5.4, 6.6)), to = eIOC(pr(it, 7.8, 8.5));
    intro.tag.style.opacity = (ti * (1 - to)).toFixed(3);
    intro.tag.style.letterSpacing = `${lerp(0.35, -0.03, ti).toFixed(3)}em`;
    intro.tag.style.transform = `translate(-50%, ${((1 - ti) * 18 + to * 26).toFixed(1)}px)`;
    intro.skip.style.opacity = (eOC(pr(it, 0.8, 1.6)) * (1 - pr(it, 8.6, 9.2))).toFixed(3);
  }

  // where the hero stone sits: k = 0 on the home page, 1 on inner pages, anything between while it glides
  function heroLayout(k) {
    const a = W >= 900 ? { x: W * 0.74, y: H * 0.52, R: Math.min(W * 0.2, H * 0.33) } : { x: W * 0.66, y: H * 0.3, R: Math.min(W * 0.36, H * 0.22) };
    const b = W >= 900 ? { x: W * 0.8, y: H * 0.4, R: Math.min(W * 0.13, H * 0.22) } : { x: W * 0.8, y: H * 0.19, R: Math.min(W * 0.2, H * 0.11) };
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), R: lerp(a.R, b.R, k) };
  }
  const shortK = (t) => lerp(kShort.from, kShort.to, eIOC(pr(t, kShort.t, kShort.t + ENTER)));

  function draw(t, scroll) {
    // intro clock: the film runs at its own pace; the website plays the same choreography 1.4x faster on load
    // outside the opening title the scene is fully built (99) and the page words run on their own short clock, eT
    const iT = VIDEO ? t : (reduce || quick ? 99 : (t - introStart - BUILD) * 1.4);
    const eT = quick && !reduce ? 2.4 + (t - page.enter) * (1.6 / (ENTER * 0.9)) : iT;    // drives the six hero pieces and the labels
    const xP = page.exit >= 0 && !reduce ? eIOC(pr(t, page.exit, page.exit + EXIT)) : 0;      // 0 -> 1 while the old page leaves
    const kS = shortK(t);
    const gl = glide.d * (1 - eIOC(pr(t, glide.t, glide.t + ENTER)));                        // leftover scroll the scene is easing through
    const sS = scroll + sceneOff + gl;                                                       // scroll as the stars and far rocks see it
    const popA = reduce ? 1 : eOC(pr(t, pop.t, pop.t + ENTER));                              // stone / paper fading in after a far jump
    const pulse = reduce ? 0 : Math.sin(Math.PI * pr(t, page.enter, page.enter + ENTER)) * (quick && page.enter > 0 ? 1 : 0);
    const it = t - introStart; // seconds into the opening title
    // launch / outro progress
    let uiHide = 0, outroA = 0, away = 0, outroOn = false;
    if (VIDEO) { uiHide = pr(t, 17.4, 18.3); outroA = eOC(pr(t, 18.6, 19.6)); away = eIOC(pr(t, 17.2, 19.0)); outroOn = t > 18.4; }
    else if (launch.state === 'open') { uiHide = eOC(pr(t, launch.t, launch.t + 0.7)); outroA = eOC(pr(t, launch.t + 0.6, launch.t + 1.4)); away = eIOC(pr(t, launch.t, launch.t + 1.6)); outroOn = true; }
    else if (launch.state === 'closing') { const q = pr(t, launch.t, launch.t + 0.7); uiHide = 1 - eOC(q); outroA = 1 - eOC(pr(t, launch.t, launch.t + 0.35)); away = 1 - eIOC(q); outroOn = q < 1; if (q >= 1) launch.state = 'idle'; }
    // page-to-page: the header stays put; the page body fades with the words that slide out and in
    const pageA = (1 - eIOC(cl((xP - 0.2) / 0.8))) * (quick && !reduce ? eOC(pr(t, page.enter, page.enter + ENTER * 0.5)) : 1);
    const nS = scroll + gl; // scroll as the glows, the stone and the paper see it
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
    // faint fire nebula
    const g = ctx.createRadialGradient(W * 0.85, H * 0.9 - nS * 0.1, 0, W * 0.85, H * 0.9 - nS * 0.1, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(78,102,170,0.14)'); g.addColorStop(0.45, 'rgba(60,80,140,0.06)'); g.addColorStop(1, 'rgba(60,80,140,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W * 0.08, H * 0.05 - nS * 0.05, 0, W * 0.08, H * 0.05 - nS * 0.05, Math.max(W, H) * 0.55);
    g2.addColorStop(0, 'rgba(150,120,200,0.07)'); g2.addColorStop(1, 'rgba(150,120,200,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    const g3 = ctx.createRadialGradient(W * 0.95, H * 0.98 - nS * 0.1, 0, W * 0.95, H * 0.98 - nS * 0.1, Math.max(W, H) * 0.7);
    g3.addColorStop(0, 'rgba(225,6,0,0.18)'); g3.addColorStop(0.45, 'rgba(225,6,0,0.05)'); g3.addColorStop(1, 'rgba(225,6,0,0)');
    ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);

    // stars
    let dist, spd;
    if (VIDEO) { dist = warpDist(t); spd = warpSpeed(t); }
    else { const dt = lastT === null ? 0 : Math.min(0.05, Math.max(0, t - lastT)); lastT = t; spd = liveSpeedAt(t); liveDist += spd * dt; dist = liveDist; if (reduce) spd = 0; }
    const cx = W / 2, cy = H / 2;
    for (const s of STARS) {
      let z = ((s.z - dist) % 1 + 1) % 1; const zz = 0.03 + z * 0.97;
      const px = cx + (s.x / zz) * W * 0.5; let py = cy + (s.y / zz) * H * 0.5 - sS * 0.06 / zz;
      py = ((py % (H + 60)) + (H + 60)) % (H + 60) - 30;
      if (px < -20 || px > W + 20) continue;
      const a = s.b * Math.pow(1 - zz, 0.7) * (quick ? 1 : cl(t / 0.6 + 0.2));
      const col = s.red ? `rgba(255,110,90,${a * 0.8})` : (s.b > 0.85 ? `rgba(205,220,255,${a})` : `rgba(242,241,236,${a})`);
      if (spd > 0.08) {
        const z2 = Math.min(1, zz + spd * 0.045); const qx = cx + (s.x / z2) * W * 0.5, qy = cy + (s.y / z2) * H * 0.5 - sS * 0.06 / z2;
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.6, (1 - zz) * 2); ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
      } else {
        const r = (1 - zz) * 1.8 + 0.35; ctx.fillStyle = col; ctx.fillRect(px - r / 2, py - r / 2, r, r);
      }
    }

    if (introMode && it < 4.6) drawShower(it);

    // far asteroid field (behind)
    const fieldIn = eOC(pr(iT, 1.2, 3.0));
    for (const a of FIELD) {
      const x = (((a.x + a.vx * t) % 1.2) + 1.2) % 1.2 - 0.1;
      const yy = a.y * H - sS * (0.25 + (1 - a.d) * 0.55);
      const y = (((yy + H * 0.3) % (H * 1.9)) + H * 1.9) % (H * 1.9) - H * 0.3;
      const R = a.s * (1.25 - a.d) * (W / 1440 + 0.3) * fieldIn;
      drawRock(a.m, x * W, y, R, rotM(a.o[0] + a.w[0] * t, a.o[1] + a.w[1] * t, a.o[2] + a.w[2] * t), 0.55 + (1 - a.d) * 0.45, 0.8);
    }

    // paper satellite
    const pin = eOC(pr(iT, 2.2, 3.6)) * (1 - uiHide * 0.6);
    drawPaper(W * (W >= 900 ? lerp(0.47, 0.6, kS) : lerp(0.18, 0.55, kS)) + Math.sin(t * 0.3) * 22, H * 0.2 + Math.cos(t * 0.25) * 12 - nS * 0.35, W >= 900 ? 78 : 56, t * 0.12 - 0.3, Math.cos(t * 0.55) * 0.85 + (Math.cos(t * 0.55) >= 0 ? 0.15 : -0.15), 0.92 * pin * popA);

    // hero asteroid
    const L = heroLayout(kS);
    const fly = eOC(pr(iT, 0.4, 2.8));
    // on a page swap the stone breathes a little (pulse) as it settles; after a far jump it fades in (popA) instead of flying
    const hx = L.x + (1 - fly) * W * 0.12 + away * W * 0.4, hy = L.y - nS * 0.85 - away * H * 0.15, HR = L.R * lerp(0.06, 1, fly) * (1 + away * 1.2) * (1 + 0.05 * pulse) * lerp(0.78, 1, popA);
    const hrot = rotM(0.4 + t * 0.07 + nS * 0.0012, t * 0.11 + nS * 0.0016, 0.2 + t * 0.03);
    const hudIn = eOC(pr(eT, 3.2, 4.3));
    const hudA = hudIn * cl(1 - nS / (H * 0.45)) * (1 - uiHide) * (1 - xP) * popA;
    // the orbit wraps the stone: its far half and the planet pass BEHIND the rock, the near half in front
    const orb = { x: hx, y: hy, rx: HR * 1.55, ry: HR * 0.42, ang: -16 * Math.PI / 180, th: t * 0.9, a: hudA };
    if (fly > 0.001) {
      if (hudA > 0.01) drawOrbit(orb, false);
      drawRock(HERO, hx, hy, HR, hrot, popA, 1);
      if (hudA > 0.01) drawOrbit(orb, true);
    }

    // HUD
    hud.g.setAttribute('opacity', hudA.toFixed(3));
    const small = W < 900; hud.l1.style.display = hud.l2.style.display = hud.leader.style.display = small ? 'none' : '';
    if (hudA > 0.01) {
      const rr = HR * 1.12, tl = 12;
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach((d, i) => { const e = tickEls[i]; e.setAttribute('x1', (hx + d[0] * rr).toFixed(1)); e.setAttribute('y1', (hy + d[1] * rr).toFixed(1)); e.setAttribute('x2', (hx + d[0] * (rr + tl)).toFixed(1)); e.setAttribute('y2', (hy + d[1] * (rr + tl)).toFixed(1)); });
      const ax = hx + HR * 0.62, ay = hy - HR * 0.7, bx = hx + HR * 0.95, by = hy - HR * 1.05, lx = bx + 90;
      hud.leader.setAttribute('points', `${ax.toFixed(1)},${ay.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)} ${lx.toFixed(1)},${by.toFixed(1)}`);
      const labRight = lx + 180 > W; const tx = labRight ? bx - 8 : bx + 8;
      hud.l1.setAttribute('text-anchor', labRight ? 'end' : 'start'); hud.l2.setAttribute('text-anchor', labRight ? 'end' : 'start');
      hud.l1.setAttribute('x', tx.toFixed(1)); hud.l1.setAttribute('y', (by - 10).toFixed(1));
      hud.l2.setAttribute('x', tx.toFixed(1)); hud.l2.setAttribute('y', (by + 20).toFixed(1));
    }

    // CTA asteroid
    const cr = ctaSec ? ctaSec.getBoundingClientRect() : null;
    if (cr && cr.top < H * 1.2) {
      const p = cl(1 - cr.top / H);
      drawRock(CTAR, W * (W >= 900 ? 0.85 : 0.76) + away * W * 0.45, cr.top + H * 0.56 - away * H * 0.2, Math.min(W, H) * lerp(0.1, 0.24, p) * (1 + away * 1.4), rotM(t * 0.08, t * 0.12 + scroll * 0.001, 0.4), 1, 1);
    }

    // scissors fly-by with a fire-red cut
    let phase = -1;
    if (VIDEO) { if (t >= 4.9 && t < 7.4) phase = t - 4.9; }
    else if (!reduce) { const fC = quick ? t + flyOff : iT / 1.4; if (fC > 3.5) { phase = (fC - 3.5) % 15; if (phase > 2.5 || launch.state !== 'idle') phase = -1; } }
    if (phase >= 0) {
      const p = eIOC(cl(phase / 1.35));
      const sx = -0.1 * W, sy = H * 0.8 - scroll * 0.3, ex = 1.1 * W, ey = H * 0.12 - scroll * 0.3;
      const x = lerp(sx, ex, p), y = lerp(sy, ey, p); const ang = Math.atan2(ey - sy, ex - sx);
      const fade = phase < 1.35 ? 1 : cl(1 - (phase - 1.35) / 1.1);
      ctx.save(); ctx.globalAlpha = fade; const lg = ctx.createLinearGradient(sx, sy, x, y); lg.addColorStop(0, 'rgba(225,6,0,0)'); lg.addColorStop(0.5, 'rgba(225,6,0,0.75)'); lg.addColorStop(1, 'rgba(225,6,0,1)'); ctx.strokeStyle = lg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      if (phase < 1.35) drawScissors(x, y, W >= 900 ? 110 : 70, ang + Math.PI / 2, 20 * Math.abs(Math.sin(phase * Math.PI * 4)));
    }

    // text reveals (scroll-linked, never below 25% opacity)
    // all positions are read first, then only the elements whose value changed are written: nothing is redrawn while the page stands still
    for (let i = 0; i < reveals.length; i++) revTop[i] = reveals[i].getBoundingClientRect().top;
    for (let i = 0; i < reveals.length; i++) {
      const el = reveals[i], q = eOC(cl((H - revTop[i]) / (H * 0.3))), k = q.toFixed(3);
      if (el.__q === k) continue; el.__q = k;
      el.style.transform = `translateY(${((1 - q) * 36).toFixed(1)}px)`; el.style.opacity = (0.25 + 0.75 * q).toFixed(3);
    }
    const s = Math.floor(t); if (clock) clock.textContent = 'T+' + String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

    // page-build choreography (film and website) + launch fade
    const hb = eOC(pr(iT, 2.0, 2.8));
    const hbT = `translateY(${((1 - hb) * -70).toFixed(1)}px)`;
    [navEl, barR].concat(introMode ? [] : [logoEl]).forEach((el) => { if (el) { el.style.transform = hbT; el.style.opacity = hb.toFixed(3); } });
    headerBar.style.opacity = (1 - uiHide).toFixed(3);
    if (!VIDEO) updateIntro(it);
    const seq = [[2.3, 3.0], [2.45, 3.4], [2.6, 3.55], [3.0, 3.6], [3.15, 3.75], [3.4, 4.0]];
    introEls.forEach((el, i) => {
      if (!el) return;
      const big = i === 1 || i === 2;
      const q = big ? eOX(pr(eT, seq[i][0], seq[i][1])) : eOC(pr(eT, seq[i][0], seq[i][1]));
      // coming in: rise from below. going out: the headline lines slide up out of their masks, the rest drifts up and fades
      const ty = xP > 0 ? -xP * (big ? 110 : 18) : (1 - q) * (big ? 110 : 20);
      el.style.transform = `translateY(${ty.toFixed(1)}%)`;
      if (!big) el.style.opacity = (q * (1 - xP)).toFixed(3);
    });
    mainEl.style.opacity = ((1 - uiHide) * pageA).toFixed(3);
    footEl.style.opacity = ((1 - uiHide) * pageA).toFixed(3);
    if (outro) {
      outro.style.display = outroOn ? 'flex' : 'none';
      outro.style.opacity = outroA.toFixed(3);
      outro.style.transform = `scale(${lerp(1.06, 1, outroA).toFixed(4)})`;
      outro.style.pointerEvents = (!VIDEO && launch.state === 'open' && outroA > 0.5) ? 'auto' : 'none';
    }
  }

  if (VIDEO) {
    document.documentElement.classList.add('ready');
    window.renderAt = (t, scroll) => { window.scrollTo(0, scroll); draw(t, scroll); };
    window.sectionTops = () => ['moves', 'process', 'contact'].map((id) => document.getElementById(id).getBoundingClientRect().top + window.scrollY);
    window.docH = () => document.documentElement.scrollHeight;
  } else {
    const t0 = performance.now();
    const nowS = () => (performance.now() - t0) / 1000;
    const backBtn = document.getElementById('backBtn');
    let lastTrigger = null;
    const setInert = (on) => { [mainEl, headerBar, footEl].forEach((el) => { el.inert = on; }); if (outro) outro.setAttribute('aria-hidden', on ? 'false' : 'true'); };
    function openLaunch(e) {
      if (e) e.preventDefault();
      if (launch.state === 'open' || !outro) return;
      lastTrigger = e ? e.currentTarget : null;
      launch.state = 'open'; launch.t = nowS(); setInert(true);
      setTimeout(() => backBtn && backBtn.focus({ preventScroll: true }), reduce ? 0 : 900);
    }
    function closeLaunch() {
      if (launch.state !== 'open') return;
      launch.state = 'closing'; launch.t = nowS(); setInert(false);
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    }
    document.querySelectorAll('.js-launch').forEach((a) => a.addEventListener('click', openLaunch));
    if (backBtn) backBtn.addEventListener('click', closeLaunch);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLaunch(); });
    function playIntro() {
      if (launch.state !== 'idle') return;
      document.documentElement.style.scrollBehavior = 'auto';
      try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (err) { window.scrollTo(0, 0); }
      document.documentElement.style.scrollBehavior = '';
      if (!reduce && PAGE === 'home') { introMode = true; quick = false; BUILD = 9.4; buildIntro(); if (logoEl) { logoEl.style.transform = ''; logoEl.style.opacity = ''; } }
      introStart = nowS();
      updateIntro(0); // hide the page on this very frame
    }
    // "Replay intro" lives in the home footer, which is swapped with the page, so it is found again after every swap
    const bindReplay = () => { const replay = document.getElementById('replay'); if (replay) replay.addEventListener('click', playIntro); };
    bindReplay();
    // on the home page the logo plays the opening title again instead of reloading
    if (logoEl) logoEl.addEventListener('click', (e) => {
      if (PAGE !== 'home' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); const it = nowS() - introStart; if (introMode && it >= 0 && it < HANDOFF) return; playIntro();
    });
    const skipIntro = () => { const it = nowS() - introStart; if (introMode && it >= 0 && it < HANDOFF) introStart = nowS() - HANDOFF; };
    if (INTRO) {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      buildIntro();
    }
    document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.iskip')) skipIntro(); });
    document.addEventListener('keydown', (e) => { if (['Escape', 'Enter', ' '].includes(e.key) && intro.live) { e.preventDefault(); skipIntro(); } });
    // ---------- moving between pages (ui.js swaps the content; see the notes at the top of this file)
    window.RPS = {
      // the old page starts leaving; returns how long to wait (in milliseconds) before swapping the content
      exit() { if (reduce) return 0; page.exit = nowS(); return EXIT * 1000; },
      // the new content is in the page and the scroll position is set: look everything up again and start the build.
      // from / to are the scroll positions before and after the swap.
      enter(from, to) {
        const t = nowS(), d = (from || 0) - (to || 0);
        const k = shortK(t);
        if (!quick) { flyOff = -(introStart + BUILD); quick = true; }
        bindPage(); bindReplay();
        kShort.from = k; kShort.to = SHORT ? 1 : 0; kShort.t = t;
        if (Math.abs(d) > H * 0.6) { sceneOff += d; glide.d = 0; pop.t = t; }   // far jump: stars stay where they are, the stone fades in
        else { glide.d = d; glide.t = t; }                                    // near: the whole scene eases the short distance
        page.exit = -1; page.enter = t;
        draw(t, window.scrollY); // set the new page's starting state before the browser paints it
      },
      // fallback when the content cannot be swapped (for example the site opened straight from a folder): fade, then load
      leave(go) { if (reduce) { go(); return; } page.exit = nowS(); setTimeout(go, EXIT * 1000); }
    };
    window.addEventListener('pageshow', (e) => { if (e.persisted) { page.exit = -1; } });
    // the page stays hidden (see the small script in <head>) until the first frame is drawn, so nothing flashes on load
    let shown = false;
    const loop = () => { draw(nowS(), window.scrollY); if (!shown) { shown = true; document.documentElement.classList.add('ready'); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
})();
