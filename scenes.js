/* SCANORY MOONLIT — V5.1 SCENES 4 TO 10.
   Registers itself on window.SCANORY_V5_SCENES before experience.js runs; experience.js
   creates it with its shared helpers and calls render / unlock / fit / scroll.
   All listeners are attached once, at creation, and use delegation, so re-rendering a story
   never adds listeners. Every timer, frame loop, audio element and motion listener is
   stopped on re-render. All customer text is set with textContent. */
(function () {
  'use strict';
  var registry = window.SCANORY_V5_SCENES = window.SCANORY_V5_SCENES || [];
  var doc = document;

  function s(v) { return typeof v === 'string' ? v.trim() : ''; }
  function list(v) { return Array.isArray(v) ? v : []; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function el(tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }

  /* ---------- V3/V4 story → V5.1 scenes ---------- */
  function fromV4(st) {
    var en = st.enabled || {}, o = st.origin || {}, song = st.song || {}, sp = st.secretPhoto || {}, lt = st.letter || {}, fin = st.finale || {};
    return {
      universe: {
        enabled: en.timer !== false || en.timeline !== false,
        since: o.dateTime,
        stars: list(st.timeline).map(function (t) { return { date: t.date, title: t.title, text: t.description, note: t.reveal }; })
      },
      archive: { enabled: en.gallery !== false, photos: list(st.gallery).map(function (g) { return { src: g.src, caption: g.caption, alt: g.caption, note: g.bonus }; }) },
      about: { enabled: en.reasons !== false, prompt: (st.heart || {}).prompt, reasons: list(st.reasons).map(function (r) { return { title: r.title, text: r.text }; }) },
      song: { enabled: en.song !== false, title: song.title, dedication: song.note, audio: song.url },
      secret: { enabled: en.scratch !== false, image: sp.image, message: sp.note },
      letter: { enabled: en.letter !== false, body: lt.state === 'locked' ? '' : lt.message, locked: lt.state === 'locked' ? { label: lt.unlockLabel } : null },
      finale: { enabled: en.finale !== false, message: fin.note, goodnight: st.nightNote }
    };
  }

  /* ---------- calendar-aware elapsed time ---------- */
  function addMonths(d, n) {
    var y = d.getFullYear(), m = d.getMonth() + n, last = new Date(y, m + 1, 0).getDate(), r = new Date(d.getTime());
    r.setFullYear(y, m, Math.min(d.getDate(), last));
    return r;
  }
  function elapsed(from, now) {
    var months = (now.getFullYear() - from.getFullYear()) * 12 + now.getMonth() - from.getMonth();
    if (addMonths(from, months) > now) months--;
    var anchor = addMonths(from, months), days = 0;
    for (;;) {
      var nx = new Date(anchor.getTime()); nx.setDate(anchor.getDate() + days + 1);
      if (nx > now || days > 31) break;
      days++;
    }
    var base = new Date(anchor.getTime()); base.setDate(anchor.getDate() + days);
    var rem = Math.max(0, now - base);
    return { y: Math.floor(months / 12), m: months % 12, d: days, h: Math.floor(rem / 36e5), mi: Math.floor(rem / 6e4) % 60, s: Math.floor(rem / 1e3) % 60 };
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function joinAnd(parts) { return parts.length < 2 ? parts.join('') : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]; }
  function parseSince(v) {
    v = s(v);
    if (!v) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    var d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
    return isNaN(d) ? null : d;
  }

  registry.push({
    fromV4: fromV4,
    create: function (core) {
      var $ = core.$, R = core.reduced, timers = [], frames = {}, S, D = {};
      function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
      function show(id, v) { var e = $(id); e.textContent = v || ''; e.hidden = !v; return e; }
      var sections = ['scene-universe', 'scene-archive', 'scene-about', 'scene-sound', 'scene-secret', 'scene-letter', 'scene-finale'].map($);
      var visible = {};

      /* ================= SCENE 4 — OUR LITTLE UNIVERSE ================= */
      var uni = $('scene-universe'), starsBox = $('stars'), constel = $('constellation'), tickTimer = null, selected = -1;
      var PAT_Y = [62, 32, 56, 24, 46, 70, 30], PAT_X = [30, 70, 40, 76, 24, 62, 38];
      (function starfield() {
        // About 90 fixed points of light, scattered once; no animation loop, no particles.
        var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        var ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 1600 1000'); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        for (var i = 0; i < 90; i++) {
          var c = doc.createElementNS(ns, 'circle');
          c.setAttribute('cx', (rnd() * 1600).toFixed(0)); c.setAttribute('cy', (rnd() * 1000).toFixed(0));
          c.setAttribute('r', (.6 + rnd() * rnd() * 1.6).toFixed(2));
          c.setAttribute('fill', rnd() < .3 ? '#ffe6bd' : '#fff8ec');
          c.setAttribute('opacity', (.15 + rnd() * .6).toFixed(2));
          svg.appendChild(c);
        }
        doc.querySelector('.sky-far').appendChild(svg);
      })();
      function layoutStars() {
        var n = D.u.stars.length, portrait = constel.clientWidth < constel.clientHeight * 1.05, pts = [];
        for (var i = 0; i < n; i++) {
          var t = n === 1 ? .5 : i / (n - 1);
          pts.push(portrait ? { x: PAT_X[i % 7], y: 10 + t * 80 } : { x: 10 + t * 80, y: PAT_Y[i % 7] });
        }
        Array.prototype.forEach.call(starsBox.children, function (b, i) {
          b.style.setProperty('--x', pts[i].x + '%');
          b.style.setProperty('--y', pts[i].y + '%');
        });
        // The lines are drawn in pixels so the stroke never stretches with the box.
        var W = constel.clientWidth || 100, H = constel.clientHeight || 100;
        constel.querySelector('svg').setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + (p.x * W / 100).toFixed(1) + ' ' + (p.y * H / 100).toFixed(1); }).join(' ');
        $('const-path').setAttribute('d', n > 1 ? d : '');
        $('const-ghost').setAttribute('d', n > 1 ? d : '');
      }
      function drawProgress() {
        if (!D.u || uni.hidden || !D.u.stars.length) return;
        var p = 1;
        if (!R()) {
          var r = constel.getBoundingClientRect();
          p = clamp((innerHeight * .82 - r.top) / (r.height * .85), 0, 1);
        }
        constel.style.setProperty('--draw', p.toFixed(3));
        var n = D.u.stars.length;
        Array.prototype.forEach.call(starsBox.children, function (b, i) {
          var at = n === 1 ? 0 : i / (n - 1);
          b.style.setProperty('--lit', p >= at * .98 || i === selected ? 1 : .3);
        });
      }
      function selectStar(i, focus) {
        var n = D.u.stars.length;
        if (!n) return;
        selected = (i + n) % n;
        var st = D.u.stars[selected];
        Array.prototype.forEach.call(starsBox.children, function (b, k) {
          b.setAttribute('aria-pressed', String(k === selected));
          b.tabIndex = k === selected ? 0 : -1;
        });
        if (focus) starsBox.children[selected].focus();
        $('universe-hint').hidden = true;
        var box = $('star-memory');
        box.hidden = false;
        box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
        show('star-date', st.date); show('star-title', st.title); show('star-text', st.text); show('star-note', st.note);
        drawProgress();
      }
      starsBox.addEventListener('click', function (e) {
        var b = e.target.closest('.star');
        if (b) selectStar(+b.dataset.i, false);
      });
      starsBox.addEventListener('keydown', function (e) {
        var k = e.key, cur = selected < 0 ? 0 : selected;
        if (k === 'ArrowRight' || k === 'ArrowDown') selectStar(cur + 1, true);
        else if (k === 'ArrowLeft' || k === 'ArrowUp') selectStar(cur - 1, true);
        else if (k === 'Home') selectStar(0, true);
        else if (k === 'End') selectStar(D.u.stars.length - 1, true);
        else return;
        e.preventDefault();
      });
      function tick() {
        if (!D.u.since) return;
        var e = elapsed(D.u.since, new Date());
        var big = joinAnd([e.y && plural(e.y, 'year'), e.m && plural(e.m, 'month'), e.d && plural(e.d, 'day')].filter(Boolean));
        var b = $('counter-big');
        if (b.textContent !== (big || 'Today')) b.textContent = big || 'Today';
        $('counter-small').textContent = plural(e.h, 'hour') + ' · ' + plural(e.mi, 'minute') + ' · ' + plural(e.s, 'second');
      }
      function ticking(on) {
        clearInterval(tickTimer); tickTimer = null;
        if (on && D.u && D.u.since) { tick(); tickTimer = setInterval(tick, 1000); }
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { ticking(es[0].isIntersecting && !uni.hidden); }).observe(uni);
      }

      /* ================= SCENE 5 — OUR LITTLE ARCHIVE ================= */
      var pile = $('pile'), prints = [], order = [], pos = 0, drag = null;
      var ROT = [-5, 4, -2.5, 6, -4, 3, -6, 5];
      function layoutPile() {
        var n = prints.length;
        order.forEach(function (idx, k) {
          var p = prints[idx], top = k === 0;
          p.classList.toggle('is-top', top);
          p.style.zIndex = String(n - k);
          p.style.setProperty('--tx', (top ? 0 : (k % 2 ? 1 : -1) * (6 + k * 7)) + 'px');
          p.style.setProperty('--ty', (top ? 0 : k * 7) + 'px');
          p.style.setProperty('--rot', (top ? ROT[idx % 8] * .3 : ROT[idx % 8]) + 'deg');
          p.style.setProperty('--sc', String(top ? 1 : 1 - k * .03));
          p.style.setProperty('--sheen', '0');
          p.style.opacity = k < 4 ? '1' : '0';
          p.toggleAttribute('inert', !top);
          p.setAttribute('aria-hidden', String(!top));
        });
        $('pile-count').textContent = n ? (pos + 1) + ' / ' + n : '';
      }
      function closeNotes() {
        prints.forEach(function (p) {
          var n = p.querySelector('.aprint-note'), t = p.querySelector('.aprint-tab');
          if (n) { n.hidden = true; t.setAttribute('aria-expanded', 'false'); }
        });
      }
      function nextPrint(dir) {
        if (prints.length < 2) return;
        closeNotes();
        var idx = order.shift(), p = prints[idx];
        p.style.setProperty('--tx', (dir || -1) * Math.min(innerWidth * .55, 520) + 'px');
        p.style.setProperty('--ty', '-20px');
        p.style.setProperty('--rot', (dir || -1) * 14 + 'deg');
        p.style.zIndex = String(prints.length + 1);
        pos = (pos + 1) % prints.length;
        order.push(idx);
        later(layoutPile, R() ? 0 : 280);
      }
      function prevPrint() {
        if (prints.length < 2) return;
        closeNotes();
        var idx = order.pop(), p = prints[idx];
        p.classList.add('dragging');
        p.style.setProperty('--tx', -Math.min(innerWidth * .55, 520) + 'px');
        p.style.setProperty('--rot', '-14deg');
        p.style.zIndex = String(prints.length + 1);
        void p.offsetWidth;
        p.classList.remove('dragging');
        order.unshift(idx);
        pos = (pos - 1 + prints.length) % prints.length;
        layoutPile();
      }
      $('pile-next').addEventListener('click', function () { nextPrint(-1); });
      $('pile-prev').addEventListener('click', prevPrint);
      pile.addEventListener('keydown', function (e) {
        if (e.target !== pile) return;
        if (e.key === 'ArrowRight') { nextPrint(-1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { prevPrint(); e.preventDefault(); }
      });
      pile.addEventListener('click', function (e) {
        var t = e.target.closest('.aprint-tab');
        if (!t) return;
        var note = $(t.getAttribute('aria-controls')), open = note.hidden;
        note.hidden = !open;
        t.setAttribute('aria-expanded', String(open));
      });
      pile.addEventListener('pointerdown', function (e) {
        var p = e.target.closest('.aprint.is-top');
        if (!p || e.target.closest('.aprint-tab,.aprint-note') || prints.length < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
        drag = { p: p, id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0, on: false, rot: parseFloat(p.style.getPropertyValue('--rot')) || 0 };
      });
      pile.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.on) {
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // a scroll, not a drag
          if (Math.abs(dx) < 6) return;
          drag.on = true;
          drag.p.classList.add('dragging');
          try { pile.setPointerCapture(e.pointerId); } catch (err) { /* ignored */ }
        }
        drag.dx = dx;
        drag.p.style.setProperty('--tx', dx + 'px');
        drag.p.style.setProperty('--ty', dy * .2 + 'px');
        drag.p.style.setProperty('--rot', drag.rot + dx * .035 + 'deg');
        drag.p.style.setProperty('--sheen', (dx * .06).toFixed(1));
      });
      function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        if (!d.on) return;
        d.p.classList.remove('dragging');
        var v = d.dx / Math.max(1, e.timeStamp - d.t);
        if (Math.abs(d.dx) > 90 || Math.abs(v) > .55) nextPrint(d.dx < 0 ? -1 : 1);
        else layoutPile();
      }
      pile.addEventListener('pointerup', endDrag);
      pile.addEventListener('pointercancel', endDrag);
      pile.addEventListener('dragstart', function (e) { e.preventDefault(); });

      /* ================= SCENE 6 — SOMETHING ABOUT YOU ================= */
      var about = $('scene-about'), pad = $('heart-wrap'), cv = $('heart-canvas'), ctx = cv.getContext('2d');
      var strokes = [], trail = [], drawing = false, misses = 0, heartOpen = false, judgeTimer = null, dpr = 1, keepTrail = false;
      function sizePad() {
        var r = pad.getBoundingClientRect();
        dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      }
      function paint() {
        frames.heart = null;
        var now = performance.now();
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        trail = trail.filter(function (g) { return keepTrail || drawing || R() || now - g.t < 1800; });
        trail.forEach(function (g) {
          var a = keepTrail || R() ? .95 : Math.max(0, 1 - (now - g.t) / 1800);
          ctx.strokeStyle = 'rgba(255,220,160,' + a + ')';
          ctx.shadowColor = 'rgba(255,160,90,' + a * .9 + ')';
          ctx.shadowBlur = 14 * dpr;
          ctx.lineWidth = 3 * dpr;
          ctx.beginPath(); ctx.moveTo(g.a * dpr, g.b * dpr); ctx.lineTo(g.c * dpr, g.d * dpr); ctx.stroke();
        });
        if (!keepTrail && !R() && trail.length) frames.heart = requestAnimationFrame(paint);
      }
      function wake() { if (!frames.heart) frames.heart = requestAnimationFrame(paint); }
      function local(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      cv.addEventListener('pointerdown', function (e) {
        if (heartOpen || (e.pointerType === 'mouse' && e.button !== 0)) return;
        if (!cv.width || cv.width !== Math.round(cv.getBoundingClientRect().width * dpr)) sizePad();
        clearTimeout(judgeTimer);
        drawing = true;
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignored */ }
        strokes.push([local(e)]);
        e.preventDefault();
      });
      cv.addEventListener('pointermove', function (e) {
        if (!drawing) return;
        var st = strokes[strokes.length - 1], p = local(e), q = st[st.length - 1];
        if (Math.hypot(p.x - q.x, p.y - q.y) < 2) return;
        st.push(p);
        trail.push({ a: q.x, b: q.y, c: p.x, d: p.y, t: performance.now() });
        wake();
      });
      function strokeEnd() {
        if (!drawing) return;
        drawing = false;
        judgeTimer = setTimeout(judge, 650);
      }
      cv.addEventListener('pointerup', strokeEnd);
      cv.addEventListener('pointercancel', strokeEnd);
      function judge() {
        var pts = [].concat.apply([], strokes), size = cv.getBoundingClientRect().width;
        var ok = false;
        if (pts.length >= 12) {
          var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
          var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
          var w = x1 - x0, h = y1 - y0, big = Math.max(w, h), len = 0;
          strokes.forEach(function (st) { for (var i = 1; i < st.length; i++) len += Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y); });
          var first = strokes[0][0], lastS = strokes[strokes.length - 1], last = lastS[lastS.length - 1];
          var closed = Math.hypot(first.x - last.x, first.y - last.y) < big * .45 || strokes.length > 1;
          var low = pts.reduce(function (a, p) { return p.y > a.y ? p : a; });
          var tipCentred = low.x > x0 + w * .18 && low.x < x1 - w * .18;
          ok = big > size * .25 && w / Math.max(1, h) > .5 && w / Math.max(1, h) < 2 && closed && len > big * 2 && tipCentred;
        }
        strokes = [];
        if (ok) { openHeart('There it is.'); return; }
        misses++;
        if (misses >= 2) openHeart('Close enough. I’d know that heart anywhere.');
        else $('heart-status').textContent = 'Almost. One more try?';
      }
      function openHeart(msg, viaButton) {
        if (heartOpen) return;
        heartOpen = true;
        keepTrail = true; wake();
        about.classList.add('is-open');
        $('heart-status').textContent = msg;
        $('heart-skip').hidden = true;
        var ol = $('reasons');
        ol.hidden = false;
        later(function () {
          var r = ol.getBoundingClientRect();
          if (viaButton) ol.focus({ preventScroll: true });
          if (r.top > innerHeight * .75) scrollBy({ top: r.top - innerHeight * .3, behavior: R() ? 'auto' : 'smooth' });
        }, R() ? 0 : 900);
      }
      $('heart-skip').addEventListener('click', function () { openHeart('', true); });

      /* ================= SCENE 7 — THE SOUND OF US ================= */
      var sound = $('scene-sound'), record = $('record'), rhit = $('record-hit'), audio = $('song-audio'), playBtn = $('song-play');
      var angle = 0, vel = 0, target = 0, lastT = 0, spinDrag = null, suppressClick = false, playing = false, pendingPlay = null, revealedSong = false, coastTimer = null;
      function spinLoop(t) {
        frames.spin = null;
        var dt = lastT ? Math.min(.05, (t - lastT) / 1000) : 0; lastT = t;
        if (!spinDrag) vel += (target - vel) * Math.min(1, (target > vel ? 1.6 : .7) * dt * 1.6);
        angle = (angle + vel * dt) % 360;
        record.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
        if (spinDrag || target || Math.abs(vel) > 1.5) frames.spin = requestAnimationFrame(spinLoop);
        else { vel = 0; lastT = 0; }
      }
      function spinTo(v) {
        target = R() ? 0 : v;
        if (R()) return;
        if (!frames.spin) { lastT = 0; frames.spin = requestAnimationFrame(spinLoop); }
      }
      function revealSong() {
        if (revealedSong) return;
        revealedSong = true;
        $('song-reveal').hidden = false;
        $('sound-hint').hidden = true;
        if (!D.song.audio) $('song-status').textContent = 'No recording is included here.';
      }
      function setArm(on) { sound.classList.toggle('arm-on', on); }
      function syncPlay() {
        playBtn.setAttribute('aria-pressed', String(playing));
        $('song-play-label').textContent = playing ? 'Pause' : 'Play our song';
      }
      function playSong() {
        revealSong();
        if (!audio.getAttribute('src')) audio.src = D.song.audio;
        setArm(true); spinTo(200);
        $('song-status').textContent = '';
        clearTimeout(pendingPlay);
        pendingPlay = later(function () {
          pendingPlay = null;
          var pr;
          try { pr = audio.play(); } catch (err) { failSong(); return; }
          if (pr && pr.catch) pr.catch(function (err) { if (err && err.name === 'AbortError') return; failSong(); });
        }, R() ? 0 : 900);
      }
      function stopSong() {
        clearTimeout(pendingPlay); pendingPlay = null;
        if (!audio.paused) audio.pause();
        playing = false; syncPlay(); setArm(false); spinTo(0);
      }
      function failSong() {
        stopSong();
        $('song-status').textContent = 'This recording couldn’t be played.';
      }
      audio.addEventListener('playing', function () { playing = true; syncPlay(); setArm(true); spinTo(200); });
      audio.addEventListener('pause', function () { if (playing) { playing = false; syncPlay(); setArm(false); spinTo(0); } });
      audio.addEventListener('ended', stopSong);
      audio.addEventListener('error', function () { if (audio.getAttribute('src')) failSong(); });
      function togglePlay() { if (playing || pendingPlay) stopSong(); else playSong(); }
      playBtn.addEventListener('click', togglePlay);
      rhit.addEventListener('click', function () {
        if (suppressClick) { suppressClick = false; return; }
        if (D.song.audio) { togglePlay(); return; }
        // No recording: the record turns by hand for a moment and the dedication appears.
        revealSong();
        spinTo(200);
        clearTimeout(coastTimer);
        coastTimer = later(function () { spinTo(0); }, 2600);
      });
      function centre() { var r = record.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      function ang(e, c) { return Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI; }
      rhit.addEventListener('pointerdown', function (e) {
        if (R() || (e.pointerType === 'mouse' && e.button !== 0)) return;
        var c = centre();
        spinDrag = { id: e.pointerId, c: c, a: ang(e, c), t: e.timeStamp, moved: 0, on: false };
      });
      rhit.addEventListener('pointermove', function (e) {
        if (!spinDrag || e.pointerId !== spinDrag.id) return;
        var a = ang(e, spinDrag.c), d = a - spinDrag.a;
        if (d > 180) d -= 360; else if (d < -180) d += 360;
        spinDrag.moved += Math.abs(d);
        if (!spinDrag.on && spinDrag.moved > 8) {
          spinDrag.on = true;
          try { rhit.setPointerCapture(e.pointerId); } catch (err) { /* ignored */ }
          if (!frames.spin) { lastT = 0; frames.spin = requestAnimationFrame(spinLoop); }
        }
        var dt = Math.max(8, e.timeStamp - spinDrag.t);
        angle += d; vel = vel * .6 + (d / dt * 1000) * .4;
        spinDrag.a = a; spinDrag.t = e.timeStamp;
      });
      function endSpin(e) {
        if (!spinDrag || e.pointerId !== spinDrag.id) return;
        var wasSpin = spinDrag.on;
        spinDrag = null;
        if (wasSpin) { suppressClick = true; revealSong(); if (!playing) target = 0; }
      }
      rhit.addEventListener('pointerup', endSpin);
      rhit.addEventListener('pointercancel', function (e) { if (spinDrag && e.pointerId === spinDrag.id) spinDrag = null; });

      /* ================= SCENE 8 — THE SECRET I KEPT ================= */
      var secret = $('scene-secret'), dust = $('dust'), dctx = dust.getContext('2d'), grid = null, gx = 24, gy = 30, cleared = 0, wiping = null, dustW = 0, dustH = 0, ddpr = 1, isClear = false;
      function initDust() {
        if (isClear || secret.hidden) return;
        var r = dust.getBoundingClientRect();
        if (!r.width || (Math.round(r.width) === dustW && Math.round(r.height) === dustH)) return;
        dustW = Math.round(r.width); dustH = Math.round(r.height);
        ddpr = Math.min(1.5, window.devicePixelRatio || 1);
        dust.width = Math.round(dustW * ddpr); dust.height = Math.round(dustH * ddpr);
        var w = dust.width, h = dust.height, i;
        dctx.globalCompositeOperation = 'source-over';
        var g = dctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#bcaa8f'); g.addColorStop(.5, '#a9977c'); g.addColorStop(1, '#978469');
        dctx.fillStyle = g; dctx.fillRect(0, 0, w, h);
        for (i = 0; i < 7; i++) {
          var cx = Math.random() * w, cy = Math.random() * h, rr = (.15 + Math.random() * .3) * Math.max(w, h);
          var sm = dctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
          sm.addColorStop(0, 'rgba(235,222,200,.22)'); sm.addColorStop(1, 'rgba(235,222,200,0)');
          dctx.fillStyle = sm; dctx.fillRect(0, 0, w, h);
        }
        var specks = Math.min(2600, Math.round(w * h / 160));
        for (i = 0; i < specks; i++) {
          var light = Math.random() < .55;
          dctx.fillStyle = light ? 'rgba(250,242,226,' + (.08 + Math.random() * .3) + ')' : 'rgba(70,52,34,' + (.06 + Math.random() * .22) + ')';
          dctx.beginPath(); dctx.arc(Math.random() * w, Math.random() * h, (.3 + Math.random() * 1.3) * ddpr, 0, 6.283); dctx.fill();
        }
        grid = new Uint8Array(gx * gy); cleared = 0;
      }
      function stamp(x, y) {
        var rad = Math.max(22, Math.min(dustW, dustH) * .09), X = x * ddpr, Y = y * ddpr, Rd = rad * ddpr;
        dctx.globalCompositeOperation = 'destination-out';
        var g = dctx.createRadialGradient(X, Y, 0, X, Y, Rd);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        dctx.fillStyle = g; dctx.fillRect(X - Rd, Y - Rd, Rd * 2, Rd * 2);
        var cw = dustW / gx, ch = dustH / gy, reach = rad * .75;
        for (var j = Math.max(0, Math.floor((y - reach) / ch)); j <= Math.min(gy - 1, Math.floor((y + reach) / ch)); j++) {
          for (var i = Math.max(0, Math.floor((x - reach) / cw)); i <= Math.min(gx - 1, Math.floor((x + reach) / cw)); i++) {
            var k = j * gx + i;
            if (!grid[k] && Math.hypot((i + .5) * cw - x, (j + .5) * ch - y) < reach) { grid[k] = 1; cleared++; }
          }
        }
        return rad;
      }
      function dpos(e) { var r = dust.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      dust.addEventListener('pointerdown', function (e) {
        if (isClear || (e.pointerType === 'mouse' && e.button !== 0)) return;
        initDust();
        if (!grid) return;
        wiping = { id: e.pointerId, p: dpos(e) };
        stamp(wiping.p.x, wiping.p.y);
      });
      dust.addEventListener('pointermove', function (e) {
        if (!wiping || e.pointerId !== wiping.id) return;
        var p = dpos(e), q = wiping.p, dist = Math.hypot(p.x - q.x, p.y - q.y), rad = Math.max(22, Math.min(dustW, dustH) * .09), step = rad * .35;
        for (var t = step; t <= dist; t += step) stamp(q.x + (p.x - q.x) * t / dist, q.y + (p.y - q.y) * t / dist);
        if (dist >= step) wiping.p = p;
        if (cleared / (gx * gy) >= .5) clearDust();
      });
      function endWipe(e) { if (wiping && e.pointerId === wiping.id) wiping = null; }
      dust.addEventListener('pointerup', endWipe);
      dust.addEventListener('pointercancel', endWipe);
      function clearDust() {
        if (isClear) return;
        isClear = true; wiping = null;
        secret.classList.add('is-clear');
        $('secret-content').removeAttribute('aria-hidden');
        $('secret-hint').hidden = true;
        $('secret-reveal').hidden = true;
        later(function () { dust.hidden = true; }, R() ? 0 : 1150);
      }
      $('secret-reveal').addEventListener('click', function () { clearDust(); $('secret-content').setAttribute('tabindex', '-1'); $('secret-content').focus({ preventScroll: true }); });

      /* ================= SCENE 9 — THE LETTER ================= */
      var lscene = $('scene-letter'), lpaper = $('lpaper'), lOpened = false;
      function openLetter() {
        if (lOpened || D.letter.locked) return;
        lOpened = true;
        $('l-open').hidden = true; $('l-hint').hidden = true;
        lscene.classList.add('is-opening');
        later(function () {
          lscene.classList.add('is-open');
          lpaper.hidden = false;
          lpaper.classList.add('unfolding');
          var r = lpaper.getBoundingClientRect();
          scrollBy({ top: r.top - Math.min(140, innerHeight * .18), behavior: R() ? 'auto' : 'smooth' });
          lpaper.focus({ preventScroll: true });
        }, R() ? 0 : 1200);
      }
      $('l-open').addEventListener('click', openLetter);
      // The sample badge steps aside while the letter is being read.
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { doc.body.classList.toggle('is-reading', es[0].isIntersecting && !lpaper.hidden); }).observe(lpaper);

      /* ================= SCENE 10 — ONE LAST THING ================= */
      var fin = $('scene-finale'), finRevealed = false, shakeOn = false, lastAcc = null, hits = 0, lastHit = 0;
      var DM = window.DeviceMotionEvent;
      function onMotion(e) {
        var a = e.accelerationIncludingGravity;
        if (!a || a.x == null) return;
        if (lastAcc) {
          var d = Math.abs(a.x - lastAcc.x) + Math.abs(a.y - lastAcc.y) + Math.abs(a.z - lastAcc.z);
          if (d > 26) {
            if (e.timeStamp - lastHit > 900) hits = 0;
            hits++; lastHit = e.timeStamp;
            if (hits >= 2) revealFinale();
          }
        }
        lastAcc = { x: a.x, y: a.y, z: a.z };
      }
      function listenShake(on) {
        if (on === shakeOn) return;
        shakeOn = on;
        if (on) addEventListener('devicemotion', onMotion); else removeEventListener('devicemotion', onMotion);
      }
      function previewHour() {
        var h = parseInt(core.params.get('preview-hour'), 10);
        return isNaN(h) ? new Date().getHours() : h;
      }
      function revealFinale(e) {
        if (finRevealed) return;
        finRevealed = true;
        listenShake(false);
        fin.classList.add('is-revealed');
        var box = $('finale-reveal');
        box.hidden = false;
        box.focus({ preventScroll: true });
        var h = previewHour();
        if (D.fin.goodnight && (h >= 23 || h < 4)) later(function () { $('goodnight').hidden = false; }, R() ? 600 : 3400);
      }
      $('finale-open').addEventListener('click', revealFinale);
      $('shake-permit').addEventListener('click', function () {
        var b = this;
        DM.requestPermission().then(function (state) {
          b.hidden = true;
          if (state === 'granted') { listenShake(true); $('shake-hint').textContent = 'Now shake your phone gently.'; }
          else $('shake-hint').textContent = 'That’s fine. Tap below instead.';
        }).catch(function () { b.hidden = true; $('shake-hint').textContent = 'Tap below instead.'; });
      });
      $('finale-again').addEventListener('click', function (e) {
        var first = sections.concat([$('scene-gift'), $('scene-memory'), $('scene-back')]).filter(function (x) { return !x.hidden; })
          .sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; })[0];
        if (first) core.go(e, first);
      });
      function arriveFinale() {
        fin.classList.add('is-arrived');
        later(function () {
          fin.classList.add('is-waiting');
          if (!core.coarse || !DM) return;
          if (typeof DM.requestPermission === 'function') { $('shake-permit').hidden = false; $('shake-hint').textContent = 'You can shake your phone for it.'; }
          else { listenShake(true); $('shake-hint').textContent = 'Shake your phone gently, or tap below.'; }
        }, R() ? 300 : 1600);
      }

      /* ================= render / unlock ================= */
      function render(raw, base) {
        S = base;
        var sc = raw.scenes || {};
        // stop everything from the previous story
        timers.forEach(clearTimeout); timers = [];
        Object.keys(frames).forEach(function (k) { if (frames[k]) cancelAnimationFrame(frames[k]); frames[k] = null; });
        ticking(false); listenShake(false); clearTimeout(judgeTimer);
        if (!audio.paused) audio.pause();
        audio.removeAttribute('src'); try { audio.load(); } catch (err) { /* ignored */ }
        doc.body.classList.toggle('is-sample', !!base.sample);

        // 4
        var u = sc.universe || {};
        D.u = {
          since: parseSince(u.since),
          stars: list(u.stars).slice(0, 7).map(function (t) { t = t || {}; return { date: s(t.date), title: s(t.title), text: s(t.text), note: s(t.note) }; })
            .filter(function (t) { return t.title || t.text || t.date; })
        };
        if (D.u.since && D.u.since > new Date()) D.u.since = null;
        D.u.on = u.enabled !== false && (!!D.u.since || D.u.stars.length > 0);
        show('universe-line', s(u.line) || 'Our little universe.');
        starsBox.textContent = ''; selected = -1;
        D.u.stars.forEach(function (st, i) {
          var b = el('button', 'star'); b.type = 'button'; b.dataset.i = i;
          b.setAttribute('aria-pressed', 'false');
          b.setAttribute('aria-label', [st.date, st.title || st.text].filter(Boolean).join(': '));
          b.tabIndex = i === 0 ? 0 : -1;
          b.appendChild(el('span', 'star-dot'));
          if (st.date) { var l = el('span', 'star-label', st.date); l.setAttribute('aria-hidden', 'true'); b.appendChild(l); }
          starsBox.appendChild(b);
        });
        constel.hidden = !D.u.stars.length;
        $('star-card').hidden = !D.u.stars.length;
        $('star-memory').hidden = true;
        show('universe-hint', D.u.stars.length ? core.tap + ' a star' + (D.u.stars.length > 1 ? ', or use the arrow keys' : '') : '');
        $('counter').hidden = !D.u.since;
        $('counter-big').textContent = ''; $('counter-small').textContent = '';
        show('counter-since', D.u.since ? 'since ' + D.u.since.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
        if (D.u.since) tick();

        // 5
        var a = sc.archive || {};
        var photos = list(a.photos).map(function (p) { p = p || {}; return { src: core.safeURL(p.src), alt: s(p.alt), caption: s(p.caption), note: s(p.note) }; })
          .filter(function (p) { return p.src; });
        D.archiveOn = a.enabled !== false && photos.length > 0;
        show('archive-line', s(a.line) || 'Our little archive.');
        pile.textContent = ''; prints = []; order = []; pos = 0; drag = null;
        photos.forEach(function (ph, i) {
          var f = el('figure', 'aprint'), box = el('div', 'aprint-img'), img = el('img');
          img.alt = ph.alt || ph.caption; img.decoding = 'async'; img.draggable = false;
          img.loading = i < 3 ? 'eager' : 'lazy';
          img.addEventListener('load', function () { f.style.setProperty('--ar', clamp(img.naturalWidth / img.naturalHeight, .66, 1.6).toFixed(3)); }, { once: true });
          img.addEventListener('error', function () { f.classList.add('failed'); }, { once: true });
          img.src = ph.src;
          box.appendChild(img); f.appendChild(box);
          if (ph.caption) f.appendChild(el('figcaption', 'aprint-cap', ph.caption));
          if (ph.note) {
            var t = el('button', 'aprint-tab', 'a note'); t.type = 'button';
            t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-controls', 'aprint-note-' + i);
            t.setAttribute('aria-label', 'Read the note on this photograph');
            var n = el('p', 'aprint-note', ph.note); n.id = 'aprint-note-' + i; n.hidden = true;
            f.appendChild(t); f.appendChild(n);
          }
          pile.appendChild(f); prints.push(f); order.push(i);
        });
        $('pile-nav').hidden = photos.length < 2;
        show('archive-hint', photos.length > 1 ? (core.coarse ? 'Swipe the top photo aside' : 'Drag the top photo aside') : '');
        layoutPile();

        // 6
        var ab = sc.about || {};
        var reasons = list(ab.reasons).slice(0, 3).map(function (r) { r = r || {}; return { title: s(r.title), text: s(r.text) }; })
          .filter(function (r) { return r.title || r.text; });
        D.aboutOn = ab.enabled !== false && reasons.length > 0;
        show('about-line', s(ab.line) || 'Draw me a heart.');
        show('about-prompt', s(ab.prompt));
        var ol = $('reasons'); ol.textContent = ''; ol.hidden = true; ol.style.setProperty('--n', reasons.length);
        var RR = [-1.2, .8, -.6];
        reasons.forEach(function (r, i) {
          var li = el('li', 'reason');
          li.style.setProperty('--i', i); li.style.setProperty('--r', RR[i] + 'deg');
          var num = el('span', 'reason-num', '0' + (i + 1)); num.setAttribute('aria-hidden', 'true');
          li.appendChild(num);
          if (r.title) li.appendChild(el('h3', 'reason-title', r.title));
          if (r.text) li.appendChild(el('p', 'reason-text', r.text));
          ol.appendChild(li);
        });
        strokes = []; trail = []; drawing = false; misses = 0; heartOpen = false; keepTrail = false;
        about.classList.remove('is-open');
        $('heart-status').textContent = ''; $('heart-skip').hidden = false;
        if (cv.width) ctx.clearRect(0, 0, cv.width, cv.height);

        // 7
        var sg = sc.song || {};
        D.song = { title: s(sg.title), artist: s(sg.artist), dedication: s(sg.dedication), audio: core.safeURL(sg.audio) };
        D.songOn = sg.enabled !== false && !!(D.song.title || D.song.dedication);
        show('sound-line', s(sg.line) || 'The sound of us.');
        $('record-title').textContent = D.song.title;
        show('song-title', D.song.title); show('song-artist', D.song.artist); show('song-dedication', D.song.dedication);
        $('song-reveal').hidden = true; $('song-status').textContent = '';
        show('sound-hint', core.tap + ' the record' + (R() ? '' : ', or give it a spin'));
        playBtn.hidden = !D.song.audio; playing = false; pendingPlay = null; revealedSong = false; spinDrag = null; suppressClick = false;
        syncPlay(); setArm(false); angle = 0; vel = 0; target = 0; lastT = 0; record.style.transform = '';
        rhit.setAttribute('aria-label', D.song.audio ? 'Play our song on the record player' : 'Spin the record');

        // 8
        var se = sc.secret || {};
        D.secret = { image: core.safeURL(se.image), alt: s(se.imageAlt), message: s(se.message) };
        D.secretOn = se.enabled !== false && !!(D.secret.image || D.secret.message);
        show('secret-line', s(se.line) || 'The secret I kept.');
        var simg = $('secret-img');
        simg.classList.remove('failed');
        simg.hidden = !D.secret.image; simg.alt = D.secret.alt; simg.onerror = function () { simg.classList.add('failed'); initDustLater(); };
        if (D.secret.image) simg.src = D.secret.image; else simg.removeAttribute('src');
        show('secret-msg', D.secret.message);
        $('secret-content').setAttribute('aria-hidden', 'true');
        secret.classList.remove('is-clear'); isClear = false; dust.hidden = false; grid = null; dustW = dustH = 0; wiping = null;
        show('secret-hint', core.coarse ? 'Rub the dust away, side to side' : 'Hold and rub the dust away');
        $('secret-reveal').hidden = false;

        // 9
        var lt = sc.letter || {};
        var locked = lt.locked && typeof lt.locked === 'object' ? (s(lt.locked.label) || 'Not yet.') : '';
        D.letter = { body: locked ? '' : s(lt.body), locked: locked };
        D.letterOn = lt.enabled !== false && !!(D.letter.body || locked);
        $('l-to').textContent = base.recipient || '';
        lscene.classList.remove('is-opening', 'is-open');
        lpaper.hidden = true; lpaper.classList.remove('unfolding'); lOpened = false;
        $('l-open').hidden = !!locked;
        show('l-hint', locked ? '' : core.tap + ' to open');
        show('l-locked', locked);
        var body = $('lpaper-body'); body.textContent = '';
        D.letter.body.split(/\n\s*\n/).forEach(function (para) { if (para.trim()) body.appendChild(el('p', '', para.trim())); });
        var ld = core.parseDay(lt.date);
        show('lpaper-date', locked ? '' : core.fmt(ld, { day: 'numeric', month: 'long', year: 'numeric' }));
        show('lpaper-sign', locked ? '' : s(lt.signature));
        show('lpaper-ps', locked ? '' : s(lt.postscript));

        // 10
        var f = sc.finale || {};
        D.fin = { message: s(f.message), goodnight: s(f.goodnight) };
        D.finOn = f.enabled !== false && !!(D.fin.message || base.recipient || base.sender);
        show('finale-msg', D.fin.message);
        show('finale-to', base.recipient); show('finale-from', base.sender);
        $('finale-amp').hidden = !(base.recipient && base.sender);
        show('goodnight', D.fin.goodnight); $('goodnight').hidden = true;
        fin.classList.remove('is-arrived', 'is-waiting', 'is-revealed');
        $('finale-reveal').hidden = true; $('shake-permit').hidden = true; $('shake-hint').textContent = '';
        finRevealed = false; hits = 0; lastAcc = null;

        sections.forEach(function (x) { x.hidden = true; });
        visible = {};
      }
      function initDustLater() { requestAnimationFrame(function () { dustW = dustH = 0; initDust(); }); }
      function unlock() {
        var on = [D.u.on, D.archiveOn, D.aboutOn, D.songOn, D.secretOn, D.letterOn, D.finOn];
        sections.forEach(function (x, i) { x.hidden = !on[i]; });
        if (visible.done) return;
        visible.done = true;
        if (D.u.on) { layoutStars(); drawProgress(); }
        if (D.secretOn) { initDustLater(); core.whenSeen(secret, initDust); }
        if (D.finOn) core.whenSeen(fin, arriveFinale);
      }
      function fit() {
        if (D.u && D.u.on && !uni.hidden) { layoutStars(); drawProgress(); }
        if (cv.width && !heartOpen) sizePad();
        if (!isClear && D.secretOn && !secret.hidden) { var r = dust.getBoundingClientRect(); if (Math.round(r.width) !== dustW) { dustW = 0; initDust(); } }
      }
      function onScroll() {
        drawProgress();
        if (!lpaper.hidden) {
          var r = lpaper.getBoundingClientRect();
          doc.body.classList.toggle('is-reading', r.top < innerHeight && r.bottom > 0);
        }
      }
      return { render: render, unlock: unlock, fit: fit, scroll: onScroll };
    }
  });
})();
