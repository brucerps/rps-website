/* Rock Papers Scissors — the interface.
   1. Things that stay for the whole visit: header, mobile menu, the scissors cursor, the "install the app" button,
      and the page swapper (moving between pages without reloading, so the space scene never stops).
   2. Things that belong to one page and are set up again each time the content is swapped: copy buttons, work filters,
      the brief form, the sideways strips, the brand orbit, the process line.
   No libraries. */
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('header.bar');

  // ---------- shared helpers
  // one scissors drawing, pointing right: blades meet at the pivot (30,16), finger rings on the left
  const ARM = '<path class="bl" d="M28 15.2 L61.5 13.2 Q63.4 14.4 61 16.2 L28 18.6 Z"/><path class="sh" d="M31 17.4 L14.5 22.6"/><circle class="rg" cx="9.6" cy="24" r="5.6"/>';
  const scissorsSVG = (cls) => `<svg class="${cls}" viewBox="-2 0 68 34" aria-hidden="true" focusable="false"><g class="a1">${ARM}</g><g class="a2" transform="translate(0 32) scale(1 -1)">${ARM}</g><circle class="pv" cx="30" cy="16" r="2.1"/></svg>`;
  const setOpen = (svg, deg) => {
    svg.querySelector('.a1').setAttribute('transform', `rotate(${(-deg).toFixed(2)} 30 16)`);
    svg.querySelector('.a2').setAttribute('transform', `rotate(${deg.toFixed(2)} 30 16) translate(0 32) scale(1 -1)`);
  };
  // measures the real screen height on phones (the browser toolbar changes window.innerHeight while scrolling)
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  // jump without the smooth-scroll animation the stylesheet turns on for ordinary scrolling
  const jumpTo = (y) => {
    const sb = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (err) { window.scrollTo(0, y); }
    if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
    root.style.scrollBehavior = sb;
  };

  // ---------- header glass on scroll
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- mobile menu
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    if (!menuBtn || !menu) return;
    menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(menu.hidden));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener('resize', () => { if (window.innerWidth > 1080 && !menu.hidden) setMenu(false); });
  }

  /* =====================================================================================================
     Everything inside a page. Called on first load and again after every content swap.
     Returns a controller; calling .abort() on it removes this page's listeners and stops its animations.
     ===================================================================================================== */
  function initPage() {
    const ac = new AbortController();
    const on = { signal: ac.signal }, onP = { passive: true, signal: ac.signal };
    const live = { on: true }; ac.signal.addEventListener('abort', () => { live.on = false; });

    // --- process timeline: the line fills as you scroll past it
    const steps = document.getElementById('steps');
    if (steps) {
      const stepEls = Array.from(steps.querySelectorAll('.step'));
      const stepTick = () => {
        const r = steps.getBoundingClientRect(), vh = window.innerHeight;
        const p = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.35)));
        steps.style.setProperty('--p', p.toFixed(3));
        stepEls.forEach((el, i) => el.classList.toggle('on', p >= (i / stepEls.length) + 0.02));
      };
      window.addEventListener('scroll', stepTick, onP); window.addEventListener('resize', stepTick, on); stepTick();
    }

    // --- cursor light on panels
    document.querySelectorAll('.move').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '50%'); el.style.setProperty('--my', '0%'); });
    });

    // --- copy buttons (only the real buttons: the hero text block also carries the class "copy")
    document.querySelectorAll('button.copy[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        const done = () => { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy'; }, 1600); };
        const fallback = () => {
          const v = btn.parentElement.querySelector('.v');
          const range = document.createRange(); range.selectNodeContents(v);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
          btn.textContent = 'Selected';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
        };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
          else fallback();
        } catch (e) { fallback(); }
      });
    });

    // --- work: filters + case study dialogs
    const filterBtns = document.querySelectorAll('[data-filter]');
    const missions = Array.from(document.querySelectorAll('.mission'));
    filterBtns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      filterBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      let shown = 0;
      // a card's data-tags is the category exactly as the button names it; several categories are separated by "|"
      missions.forEach((m) => { const show = f === 'All' || m.dataset.tags.split('|').map((s) => s.trim()).includes(f); m.hidden = !show; if (show) shown++; });
      const note = document.getElementById('emptyNote'); if (note) note.hidden = shown > 0;
    }));
    document.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => {
      const d = document.getElementById(btn.dataset.open);
      if (d && d.showModal) { d.showModal(); d.scrollTop = 0; }
    }));
    document.querySelectorAll('dialog.case').forEach((d) => {
      d.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', () => d.close()));
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    });
    if (location.hash && /^#case-/.test(location.hash)) { const d = document.querySelector(location.hash); if (d && d.showModal) d.showModal(); }

    // --- brand page: fills itself from the brand's folder, assets/work/<brand>/ (work.txt, post-1..3.jpg, film.mp4, reel.mp4, reel-2..4.mp4, a still for each video such as reel.jpg, site.jpg)
    const caseEl = document.querySelector('[data-brand]');
    if (caseEl) {
      const dir = 'assets/work/' + caseEl.dataset.brand + '/';
      const q = (s) => caseEl.querySelector(s);
      const picture = (name) => new Promise((res) => {           // first of name.jpg / name.png that exists
        const tryExt = (exts) => { if (!exts.length) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => tryExt(exts.slice(1)); im.alt = ''; im.src = dir + name + '.' + exts[0]; };
        tryExt(['jpg', 'png']);
      });
      // the text is written into the page itself (so search engines and readers without JavaScript see it); only fetch it when it is not
      const text = q('.case-body').children.length ? Promise.resolve(true) : fetch(dir + 'work.txt', { signal: ac.signal, cache: 'no-cache' }).then((r) => (r.ok ? r.text() : '')).catch(() => '').then((raw) => {
        raw = raw.replace(/\r/g, '').trim();
        if (!raw || /^\s*</.test(raw)) return false;               // nothing there (or the host answered with a web page)
        const lines = raw.split('\n'); let site = '', services = [];
        while (lines.length) {
          const m = /^(services|website|period|by|result|quote|quote_by)\s*:\s*(.*)$/i.exec(lines[0]); if (!m) break;
          const key = m[1].toLowerCase(); if (key === 'services') services = m[2].split(',').map((s) => s.trim()).filter(Boolean); else if (key === 'website') site = m[2].trim();
          lines.shift();
        }
        const body = q('.case-body');
        lines.join('\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).forEach((block) => {
          const rows = block.split('\n').map((s) => s.trim());
          if (rows.every((r) => /^[-•]\s+/.test(r))) { const ul = document.createElement('ul'); rows.forEach((r) => { const li = document.createElement('li'); li.textContent = r.replace(/^[-•]\s+/, ''); ul.appendChild(li); }); body.appendChild(ul); }
          else { const p = document.createElement('p'); p.textContent = rows.join(' '); body.appendChild(p); }
        });
        if (services.length) { const box = q('.case-services'); services.forEach((s) => { const el = document.createElement('span'); el.textContent = s; box.appendChild(el); }); box.hidden = false; }
        if (/^https?:\/\//i.test(site)) { const a = q('.case-site-link'); a.href = site; a.hidden = false; }
        if (!body.children.length && !services.length) return false;
        q('.case-text').hidden = false; return true;
      });
      // posts and films share one wall of equal tiles: on a wide screen they sit side by side in one row, on a phone two to a row.
      // The page lists its own media in data-media ("post-1 post-2 reel reel-2"), so nothing is searched for and the wall is drawn at once.
      // A page without that list looks for the files instead (a picture, or a video's still, that exists).
      const ALL = ['post-1', 'post-2', 'post-3', 'film', 'reel', 'reel-2', 'reel-3', 'reel-4'];
      const listed = (caseEl.dataset.media || '').split(/\s+/).filter((n) => ALL.indexOf(n) >= 0);
      const found = listed.length ? Promise.resolve(listed.map((n) => ({ n: n, src: dir + n + '.jpg', small: dir + n + '-s.jpg' })))
        : Promise.all(ALL.map((n) => picture(n).then((im) => im && { n: n, src: im.src, small: im.src }))).then((a) => a.filter(Boolean));
      const media = Promise.all([found, text]).then(([items]) => {      // waits for the text so the wall does not jump when the text arrives
        if (!live.on || !items.length) return false;
        const pics = items.filter((m) => /^post/.test(m.n)), vids = items.filter((m) => !/^post/.test(m.n)), wide = vids.some((m) => m.n === 'film');
        const pGroup = q('.case-posts'), fGroup = q('.case-films'), tiles = [], players = [];
        const wall = document.createElement('div'); wall.className = 'case-media'; pGroup.before(wall);
        const label = document.createElement('div'); label.className = 'eyebrow'; label.textContent = pics.length && vids.length ? 'Posts and films' : (pics.length ? 'Posts' : 'Films');
        wall.append(label, pGroup, fGroup);
        pics.forEach((m, i) => {      // the tile shows a small copy (post-1-s.jpg) when there is one; a click opens the full picture
          const a = document.createElement('a'); a.className = 'tile'; a.href = m.src; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'Post ' + (i + 1) + ', full size');
          const im = new Image(); im.alt = ''; im.decoding = 'async'; im.onerror = () => { im.onerror = null; im.src = m.src; }; im.src = m.small;
          a.appendChild(im); q('.case-grid').appendChild(a); tiles.push(a);
        });
        vids.forEach((m) => {         // only the still is loaded; the video itself is fetched when the visitor presses play
          const v = document.createElement('video'); v.controls = true; v.playsInline = true; v.preload = 'none'; v.poster = dir + m.n + '.jpg'; v.src = dir + m.n + '.mp4'; players.push(v);
          v.addEventListener('play', () => players.forEach((o) => { if (o !== v) o.pause(); }));
          const t = document.createElement('div'); t.className = m.n === 'film' ? 'tile wide' : 'tile'; t.appendChild(v); q('.case-film-row').appendChild(t); tiles.push(t);
        });
        // columns: one per post or upright film, two for the wide film; never fewer than four, so a tile is never oversized
        let pu = pics.length, fu = vids.length + (wide ? 1 : 0);
        if (pu + fu > 5) { pu = pu && 4; fu = fu && 4; wall.style.setProperty('--units', 4); } else wall.style.setProperty('--units', Math.max(4, pu + fu));
        pGroup.style.setProperty('--span', pu || 1); fGroup.style.setProperty('--span', fu || 1);
        if (wide && tiles.length === 1) wall.classList.add('lone'); if (wide && tiles.length === 4) wall.classList.add('trio');
        // phone: a tile left alone on its row takes the full width
        let run = 0; tiles.forEach((t, i) => { if (t.classList.contains('wide')) { if (run % 2) tiles[i - 1].classList.add('solo'); run = 0; } else run += 1; });
        if (run % 2) tiles[tiles.length - 1].classList.add('solo');
        pGroup.hidden = !pics.length; fGroup.hidden = !vids.length; return true;
      });
      const shot = (listed.length && !/\bsite\b/.test(caseEl.dataset.media) ? Promise.resolve(null) : picture('site')).then((im) => {
        if (!live.on || !im) return false;
        im.alt = 'The website'; q('.case-shot').appendChild(im); q('.case-site').hidden = false; return true;
      });
      Promise.all([text, media, shot]).then((got) => { if (live.on && !got.some(Boolean)) q('.case-empty').hidden = false; });
    }

    // --- contact: brief form
    const form = document.getElementById('briefForm');
    if (form) {
      const cfg = window.RPS_CONFIG || { formEndpoint: '', email: 'info@rockpapersscissors.in' };
      const status = document.getElementById('formStatus');
      const sent = document.getElementById('sent');
      const submitBtn = form.querySelector('button[type="submit"]');
      const val = (n) => (form.elements[n] && form.elements[n].value || '').trim();
      const checked = (n) => Array.from(form.querySelectorAll(`input[name="${n}"]:checked`)).map((i) => i.value);
      form.addEventListener('input', (e) => { if (e.target.classList) e.target.classList.remove('bad'); });
      function showSent(msg) {
        form.hidden = true; sent.hidden = false;
        document.getElementById('sentMsg').textContent = msg;
        document.getElementById('sentH').focus();
      }
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = val('name'), email = val('email'), phone = val('phone'), msg = val('message');
        const missing = [];
        if (!name) missing.push(form.elements.name);
        if (!email && !phone) missing.push(form.elements.email, form.elements.phone);
        if (!msg) missing.push(form.elements.message);
        if (missing.length) {
          missing.forEach((el) => el.classList.add('bad'));
          status.className = 'form-status err';
          status.textContent = 'Please add your name, an email or phone number, and what you’re launching.';
          missing[0].focus(); return;
        }
        if (val('website')) { showSent('Your brief is with mission control. We’ll get back to you within one working day.'); return; }   // a hidden field people never see: only automated spam fills it in
        const data = { name, company: val('company'), email, phone, message: msg, needs: checked('need').join(', '), budget: checked('budget').join(''), timeline: val('timeline') };
        // the bridge: with an address in formEndpoint the brief is sent straight to it (a Google Sheet web app, or a form service).
        // It goes as ordinary form fields, which every such service accepts and which a browser sends without extra checks.
        let bridgeDown = false;
        if (cfg.formEndpoint) {
          status.className = 'form-status'; status.textContent = 'Launching…'; submitBtn.disabled = true;
          try {
            const sheet = /script\.google\.com/.test(cfg.formEndpoint);
            const r = await fetch(cfg.formEndpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(Object.assign({}, data, { page: location.href })) });
            const j = await r.json().catch(() => null);
            if (!r.ok || (j && j.ok === false) || (sheet && !(j && j.ok))) throw new Error('not saved');   // the sheet must confirm that it saved the row
            if (window.gtag) gtag('event', 'generate_lead', { form: 'contact' });
            showSent('Your brief is with mission control. We’ll get back to you within one working day.');
            return;
          } catch (err) {
            bridgeDown = true;       // the bridge did not answer: fall back to the visitor's own email app, so the brief is not lost
            status.className = 'form-status'; status.textContent = '';
          } finally { submitBtn.disabled = false; }
        }
        const body = [
          'Name: ' + data.name, data.company && 'Company: ' + data.company, data.email && 'Email: ' + data.email, data.phone && 'Phone: ' + data.phone,
          data.needs && 'Needs: ' + data.needs, data.budget && 'Budget: ' + data.budget, data.timeline && 'Timeline: ' + data.timeline, ' ', 'What we are launching:', data.message
        ].filter((x) => x !== false && x !== undefined && x !== '').join('\n');
        const subject = 'New mission brief' + (data.company ? ' from ' + data.company : ' from ' + data.name);
        window.location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        showSent((bridgeDown ? 'We couldn’t send it directly, so your email app should now be open with your brief filled in. ' : 'Your email app should now be open with your brief filled in. ') + 'Hit send and we’ll get back to you within one working day. If nothing opened, email us at ' + cfg.email + ' or call +91 63620 12456.');
      });
      document.getElementById('againBtn').addEventListener('click', () => {
        form.reset(); form.hidden = false; sent.hidden = true; status.textContent = ''; form.elements.name.focus();
      });
    }

    // --- sideways strips (Services and Our work on the home page), three modes:
    //   pin    (laptop / desktop): the section is made tall; while it is pinned, vertical scroll moves the track sideways.
    //   phone  (up to 760px wide): a strip you swipe left and right. It shows the first three cards and a "See more" card
    //          that opens the full page. The title sits above the strip instead of inside it.
    //   native (reduced motion on a large screen): a plain strip you scroll sideways.
    const phoneMQ = window.matchMedia('(max-width: 760px)');
    const sections = Array.from(document.querySelectorAll('[data-hs]')).map((sec) => ({
      sec, track: sec.querySelector('.hs-track'), sticky: sec.querySelector('.hs-sticky'), title: sec.querySelector('.hs-title'),
      count: sec.querySelector('.hs-count b'), bar: sec.querySelector('.hs-bar'),
      items: Array.from(sec.querySelectorAll('.hs-track > article')), dist: 0, mode: ''
    }));
    function setMode(h) {
      const mode = phoneMQ.matches ? 'phone' : (reduce ? 'native' : 'pin');
      if (mode === h.mode) return;
      h.mode = mode;
      h.sec.classList.toggle('phone', mode === 'phone'); h.sec.classList.toggle('native', mode === 'native');
      if (mode === 'phone') { if (h.title) h.sticky.insertBefore(h.title, h.track); }
      else { if (h.title) h.track.insertBefore(h.title, h.track.firstChild); h.track.scrollLeft = 0; }
      if (mode !== 'pin') { h.sec.style.height = ''; h.track.style.transform = ''; }
    }
    // the counter and the progress line, shared by every mode
    function meter(h, p) {
      if (h.bar) h.bar.style.setProperty('--hp', p.toFixed(3));
      if (h.count && h.items.length) {
        // the visible card nearest the middle of the screen
        let best = 0, bd = Infinity; const mid = window.innerWidth * 0.5;
        h.items.forEach((el, i) => { if (!el.offsetParent) return; const b = el.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
        const first = h.items[0].getBoundingClientRect().left > window.innerWidth * 0.6;
        h.count.textContent = String(first ? 1 : best + 1).padStart(2, '0');
      }
    }
    function swipeTick(h) {
      const max = h.track.scrollWidth - h.track.clientWidth;
      meter(h, max > 0 ? Math.max(0, Math.min(1, h.track.scrollLeft / max)) : 0);
    }
    let sizedW = 0, sizedH = 0;
    function size(force) {
      const vw = root.clientWidth, vh = probe.offsetHeight || window.innerHeight;
      sections.forEach(setMode);
      if (force !== true && vw === sizedW && Math.abs(vh - sizedH) < 160) return; // toolbar show/hide on phones
      sizedW = vw; sizedH = vh;
      sections.forEach((h) => {
        if (h.mode !== 'pin') return;
        h.dist = Math.max(0, h.track.scrollWidth - vw);
        h.sec.style.height = (h.dist + vh) + 'px';
      });
      tick();
    }
    function tick() {
      sections.forEach((h) => {
        if (h.mode !== 'pin') { swipeTick(h); return; }
        const r = h.sec.getBoundingClientRect();
        const p = h.dist ? Math.max(0, Math.min(1, -r.top / h.dist)) : 0;
        h.track.style.transform = `translate3d(${(-p * h.dist).toFixed(1)}px,0,0)`;
        meter(h, p);
      });
    }

    // --- the progress line of each strip: a pair of scissors rides it and cuts as you move (forward and back, always in step)
    const cutters = sections.map((h) => {
      if (!h.bar) return null;
      const wrap = document.createElement('span'); wrap.className = 'hs-cut'; wrap.innerHTML = scissorsSVG('sc');
      h.bar.appendChild(wrap);
      return { bar: h.bar, wrap, svg: wrap.querySelector('svg') };
    }).filter(Boolean);
    function cutTick() {
      if (!live.on) return;
      cutters.forEach((c) => {
        const p = parseFloat(getComputedStyle(c.bar).getPropertyValue('--hp')) || 0;
        c.wrap.style.left = (p * 100).toFixed(3) + '%';
        const travel = p * c.bar.clientWidth;               // pixels of line already cut
        setOpen(c.svg, reduce ? 12 : 3 + 19 * Math.abs(Math.sin(travel / 22)));
      });
    }

    if (sections.length) {
      sections.forEach((h) => h.track.addEventListener('scroll', () => { if (h.mode !== 'pin') swipeTick(h); requestAnimationFrame(cutTick); }, { passive: true }));
      window.addEventListener('scroll', () => { tick(); requestAnimationFrame(cutTick); }, onP);
      window.addEventListener('resize', () => { size(); cutTick(); }, on);
      if (phoneMQ.addEventListener) phoneMQ.addEventListener('change', () => size(true), on);
      window.addEventListener('load', () => { size(true); cutTick(); }, on);
      window.addEventListener('orientationchange', () => setTimeout(() => { if (live.on) size(true); }, 300), on);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live.on) { size(true); cutTick(); } });
      size(true); cutTick();
    }

    // --- brand orbit: names travel along two tilted ellipses, passing behind the planet
    const stage = document.getElementById('orbitStage');
    if (stage && reduce) stage.classList.add('static');
    else if (stage) {
      const items = Array.from(stage.querySelectorAll('.ob'));
      const rings = [{ rx: 0.44, ry: 0.36, tilt: -8, speed: 0.03 }, { rx: 0.27, ry: 0.2, tilt: 10, speed: -0.05 }];
      // small satellites fill the gaps between the brand rings: RPS is the planet, the brands and these are its moons
      const SAT = '<svg viewBox="0 0 44 22" aria-hidden="true"><rect x="0" y="6" width="14" height="10" rx="1" fill="#2a3246" stroke="#AFC0DE" stroke-width="1"/><path d="M4.7 6v10M9.3 6v10M0 11h14" stroke="#AFC0DE" stroke-width=".6" opacity=".7"/><rect x="30" y="6" width="14" height="10" rx="1" fill="#2a3246" stroke="#AFC0DE" stroke-width="1"/><path d="M34.7 6v10M39.3 6v10M30 11h14" stroke="#AFC0DE" stroke-width=".6" opacity=".7"/><path d="M14 11h2M28 11h2" stroke="#C9CCD4" stroke-width="1.4"/><rect x="16" y="4" width="12" height="14" rx="2.5" fill="#F2F1EC"/><path d="M22 4V0" stroke="#C9CCD4" stroke-width="1.2"/><circle cx="22" cy="0" r="1.8" fill="#E10600"/><circle cx="22" cy="11" r="2.2" fill="#E10600"/></svg>';
      const satRings = [{ rx: 0.355, ry: 0.28, tilt: 1, speed: 0.042, n: 3 }, { rx: 0.17, ry: 0.13, tilt: 14, speed: 0.075, n: 2 }, { rx: 0.5, ry: 0.45, tilt: -4, speed: -0.02, n: 3 }];
      const sats = [];
      satRings.forEach((R, ri) => { for (let i = 0; i < R.n; i++) { const el = document.createElement('div'); el.className = 'sat'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = SAT; stage.appendChild(el); sats.push({ el, R, ph: i / R.n + ri * 0.21, spin: (i % 2 ? -1 : 1) * (8 + ri * 5) }); } });
      const groups = [items.filter((el) => el.dataset.ring === '0'), items.filter((el) => el.dataset.ring === '1')];
      let W = 0, H = 0, sizes = [];
      const measure = () => { W = stage.clientWidth; H = stage.clientHeight; sizes = items.map((el) => [el.offsetWidth, el.offsetHeight]); };
      measure(); window.addEventListener('resize', measure, on);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live.on) measure(); });
      let visible = true;
      if ('IntersectionObserver' in window) { const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; }); io.observe(stage); ac.signal.addEventListener('abort', () => io.disconnect()); }
      const t0 = performance.now();
      let hover = null;
      items.forEach((el) => { el.addEventListener('pointerenter', () => { hover = el; }); el.addEventListener('pointerleave', () => { hover = null; }); });
      let paused = 0, last = t0;
      const frame = (now) => {
        if (!live.on) return;
        const dt = (now - last) / 1000; last = now;
        if (hover) paused += dt;
        if (visible) {
          const t = (now - t0) / 1000 - paused;
          groups.forEach((g, gi) => {
            const R = rings[gi]; const a = R.tilt * Math.PI / 180; const ca = Math.cos(a), sa = Math.sin(a);
            g.forEach((el, i) => {
              const th = t * R.speed * Math.PI * 2 + (i / g.length) * Math.PI * 2 + gi * 0.4;
              const ex = Math.cos(th) * R.rx * W, ey = Math.sin(th) * R.ry * H;
              const x = W / 2 + ex * ca - ey * sa, y = H / 2 + ex * sa + ey * ca;
              const depth = Math.sin(th); // >0 front, <0 behind the planet
              const s = 0.78 + 0.3 * (depth + 1) / 2;
              const k = items.indexOf(el); const [w, h] = sizes[k] || [0, 0];
              el.style.transform = `translate3d(${(x - w / 2).toFixed(1)}px,${(y - h / 2).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
              el.style.zIndex = depth > 0 ? 3 : 1;
              el.style.opacity = (0.4 + 0.6 * (depth + 1) / 2).toFixed(2);
            });
          });
          const tt = (now - t0) / 1000;
          sats.forEach((s) => {
            const R = s.R; const a = R.tilt * Math.PI / 180; const ca = Math.cos(a), sa = Math.sin(a);
            const th = tt * R.speed * Math.PI * 2 + s.ph * Math.PI * 2;
            const ex = Math.cos(th) * R.rx * W, ey = Math.sin(th) * R.ry * H;
            const x = W / 2 + ex * ca - ey * sa, y = H / 2 + ex * sa + ey * ca;
            const depth = Math.sin(th); const sc = 0.62 + 0.38 * (depth + 1) / 2;
            const w = s.el.offsetWidth || 32;
            s.el.style.transform = `translate3d(${(x - w / 2).toFixed(1)}px,${(y - w / 4).toFixed(1)}px,0) rotate(${(tt * s.spin).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
            s.el.style.zIndex = depth > 0 ? 3 : 1;
            s.el.style.opacity = (0.35 + 0.65 * (depth + 1) / 2).toFixed(2);
          });
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }

    return ac;
  }

  /* =====================================================================================================
     Moving between pages without reloading.
     A click on a link to another page of this site: the old content leaves (the scene script animates it), the next
     page's <main> and <footer> are put in its place, and the new content builds in. The canvas, the header and the
     menu are never touched, so the stars and the stone keep moving the whole time.
     If the next page cannot be fetched (for example when the site is opened straight from a folder), the link works
     the ordinary way instead.
     ===================================================================================================== */
  const FILES = { home: 'index.html', services: 'services.html', work: 'work.html', about: 'about.html', contact: 'contact.html' };
  const attrOf = (doc, k) => { const m = doc.querySelector('main'); return (m && m.dataset[k]) || (doc.body && doc.body.dataset[k]) || ''; };
  // a brand page (work-<name>.html) is not in the list above, so it is known by its own file name
  const fileNow = () => { const f = location.pathname.split('/').pop(); return /^[\w-]+\.html$/.test(f) ? f : 'index.html'; };
  let current = FILES[attrOf(document, 'page')] || fileNow();
  let pageCtl = initPage();

  const cache = new Map(); // file -> Promise of the parsed page
  function load(file) {
    if (!cache.has(file)) {
      cache.set(file, fetch(file, { credentials: 'same-origin' })
        .then((r) => { if (!r.ok) throw new Error('status ' + r.status); return r.text(); })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          if (!doc.querySelector('main') || !doc.querySelector('footer')) throw new Error('not a page of this site');
          return doc;
        })
        .catch((err) => { cache.delete(file); throw err; }));
    }
    return cache.get(file);
  }
  // the ordinary way: fade out, then let the browser load the page
  function hardGo(url) {
    try { sessionStorage.setItem('rps-nav', '1'); } catch (err) {}
    const go = () => { window.location.href = url; };
    if (window.RPS && window.RPS.leave) window.RPS.leave(go); else go();
  }
  function markCurrent(file) {
    document.querySelectorAll('header.bar nav a[href], .menu-links a[href]').forEach((a) => {
      const here = /^work-/.test(file) ? 'work.html' : (/^service-/.test(file) ? 'services.html' : file);   // a brand page counts as part of Work
      if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  try { history.replaceState(Object.assign({}, history.state, { rps: current }), ''); } catch (err) {}

  let busy = false;
  async function goTo(file, opts) {
    if (busy) return;
    busy = true;
    const hash = opts.hash || '';
    try {
      setMenu(false);
      const wait = (window.RPS && window.RPS.exit) ? window.RPS.exit() : 0;
      const [doc] = await Promise.all([load(file), new Promise((r) => setTimeout(r, wait))]);
      const from = window.scrollY;
      // remember where the visitor was on the page they are leaving, for the Back button
      if (opts.push) { try { history.scrollRestoration = 'manual'; history.replaceState(Object.assign({}, history.state, { rps: current, y: from }), ''); } catch (err) {} }

      pageCtl.abort();
      const next = document.importNode(doc.querySelector('main'), true);
      document.querySelector('main').replaceWith(next);
      document.querySelector('footer').replaceWith(document.importNode(doc.querySelector('footer'), true));
      document.title = doc.title;
      ['page', 'hud1', 'hud2'].forEach((k) => { const v = attrOf(doc, k); if (v) { document.body.dataset[k] = v; next.dataset[k] = v; } });
      // a page can carry settings in a small script in its <head> (the contact form endpoint): apply them
      doc.querySelectorAll('head script:not([src])').forEach((s) => {
        if (s.textContent.indexOf('RPS_CONFIG') < 0) return;
        const el = document.createElement('script'); el.textContent = s.textContent; document.head.appendChild(el); el.remove();
      });
      markCurrent(file);
      if (opts.push) { try { history.pushState({ rps: file, y: 0 }, '', file + hash); } catch (err) {} }
      current = file;

      jumpTo(0);
      pageCtl = initPage(); // sets the height of the sideways strips, so the page has its full length before scrolling
      let y = opts.y || 0;
      if (hash.length > 1) { const el = document.getElementById(hash.slice(1)); if (el) y = el.getBoundingClientRect().top + window.scrollY; }
      if (y) jumpTo(y);
      onScroll();
      if (window.RPS && window.RPS.enter) window.RPS.enter(from, window.scrollY);
      next.setAttribute('tabindex', '-1'); next.focus({ preventScroll: true });
    } catch (err) {
      hardGo(file + hash);
    } finally { busy = false; }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const m = /^([\w-]+\.html)(#[\w-]*)?$/.exec(a.getAttribute('href') || '');
    if (!m) return;
    e.preventDefault();
    if (m[1] === current) { // already on this page: go to its top, or to the part the link names
      setMenu(false);
      const el = m[2] && m[2].length > 1 ? document.getElementById(m[2].slice(1)) : null;
      window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY : 0, behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    goTo(m[1], { push: true, hash: m[2] || '' });
  });
  // Back and Forward
  window.addEventListener('popstate', (e) => {
    const st = e.state;
    if (!st || !st.rps || st.rps === current) return; // a jump within the same page
    goTo(st.rps, { push: false, y: st.y || 0 });
  });

  // fetch the other pages quietly once this one has settled, so every switch is instant
  const warm = () => Object.keys(FILES).forEach((k) => { if (FILES[k] !== current) load(FILES[k]).catch(() => {}); });
  if (document.readyState === 'complete') setTimeout(warm, 1200); else window.addEventListener('load', () => setTimeout(warm, 1200));
  const warmed = {};
  const eager = (e) => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    const m = /^([\w-]+\.html)(#[\w-]*)?$/.exec(a.getAttribute('href') || '');
    if (m && m[1] !== current) {
      load(m[1]).catch(() => {});
      const w = /^work-([\w-]+)\.html$/.exec(m[1]); if (w && !warmed[w[1]]) { warmed[w[1]] = 1; new Image().src = 'assets/brands/large/' + w[1] + '.jpg'; }
      const sv = /^service-([\w-]+)\.html$/.exec(m[1]); if (sv && !warmed['s:' + sv[1]]) { warmed['s:' + sv[1]] = 1; new Image().src = 'assets/services/' + sv[1] + '.jpg'; }   // a service page: the still of its film   // a brand page: its large logo too
    }
  };
  document.addEventListener('pointerover', eager, { passive: true });
  document.addEventListener('touchstart', eager, { passive: true });

  // a page reached the ordinary way through a link on this site always opens at its top
  if (window.RPS_NAV && !location.hash) {
    let touched = false, n = 0;
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, () => { touched = true; }, { once: true, passive: true }));
    const toTop = () => { if (!touched && window.scrollY > 0) jumpTo(0); };
    toTop(); window.addEventListener('load', toTop);
    const iv = setInterval(() => { if (touched || ++n > 10) clearInterval(iv); else toTop(); }, 80);
  }

  // ---------- installable app (Android + iPhone)
  (() => {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
    }
    const slot = document.getElementById('installSlot');
    if (!slot) return;
    const btn = document.getElementById('installBtn');
    const hint = document.getElementById('iosHint');
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) return;
    // Android (Chrome, Samsung Internet, Edge): the browser offers a real install prompt
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let deferred = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); if (ios) return; deferred = e; slot.hidden = false; btn.hidden = false;
    });
    btn.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      try { await deferred.userChoice; } catch (err) {}
      deferred = null; slot.hidden = true;
    });
    window.addEventListener('appinstalled', () => { slot.hidden = true; });
    // iPhone / iPad Safari: no prompt exists, so show the two taps instead
    if (ios) { slot.hidden = false; hint.hidden = false; }
  })();

  // ---------- cursor: a small pair of scissors that snips as it moves and cuts where you click (mouse / trackpad only)
  (() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const cur = document.createElement('div'); cur.id = 'cur'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = scissorsSVG('cs');
    document.body.appendChild(cur); root.classList.add('has-cur');
    const svg = cur.querySelector('svg');
    let x = -100, y = -100, px = -100, py = -100, travel = 0, snip = 0, hot = false, shown = false, textField = false;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; px = x; py = y; cur.classList.add('on'); }
      const t = e.target;
      hot = !!(t.closest && t.closest('a, button, summary, label, [role="button"], .svc, .wk, .ob, .mission-hit'));
      textField = !!(t.closest && t.closest('input:not([type=checkbox]):not([type=radio]), textarea, select'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => { cur.classList.remove('on'); shown = false; });
    window.addEventListener('blur', () => { cur.classList.remove('on'); shown = false; });
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      snip = 1;
      // leave a short cut in the page that heals a moment later
      const m = document.createElement('i'); m.className = 'cut-mark';
      m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px'; m.style.setProperty('--r', (-35 + Math.random() * 16).toFixed(1) + 'deg');
      document.body.appendChild(m); setTimeout(() => m.remove(), 900);
    });
    let open = 18;
    function frame() {
      const dx = x - px, dy = y - py; travel += Math.hypot(dx, dy); px = x; py = y;
      snip = Math.max(0, snip - 0.09);
      const base = hot ? 26 : 16;
      const target = reduce ? base : base * (0.45 + 0.55 * Math.abs(Math.cos(travel / 26))) * (1 - Math.sin(Math.min(1, snip) * Math.PI) * 0.95);
      open += (target - open) * 0.35;
      setOpen(svg, open);
      cur.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      cur.classList.toggle('hot', hot); cur.classList.toggle('txt', textField);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();
})();
