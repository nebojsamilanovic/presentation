/* SCANORY MOONLIT — V5 CREATIVE PROTOTYPE: three scenes.
   Reads window.SCANORY_V5 (see story.js and README.md). All customer text is set with
   textContent; image addresses must be http(s), relative or data:image. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  function $(id) { return doc.getElementById(id); }
  var params = new URLSearchParams(location.search);
  var motionQuery = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduced() { return params.get('motion') === 'reduce' || motionQuery.matches; }
  var coarse = window.matchMedia ? matchMedia('(pointer: coarse)').matches : false;
  var tap = coarse ? 'Tap' : 'Click';

  // A tiny vibration for a real finger tap where the browser supports it (Android Chrome). Never required.
  function buzz(e, ms) {
    if (!e || e.pointerType !== 'touch' || reduced() || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (e) { /* ignored */ }
  }

  /* ---------- data ---------- */
  function str(v) { return typeof v === 'string' ? v.trim() : ''; }
  function safeURL(v) {
    v = str(v);
    if (!v) return '';
    if (/^data:image\/(png|jpe?g|webp|gif|avif);/i.test(v)) return v;
    try {
      var u = new URL(v, location.href);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
    } catch (e) { return ''; }
  }
  function parseDay(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(v));
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d) ? null : d;
  }
  function fmt(d, opts) {
    if (!d) return '';
    opts.timeZone = 'UTC';
    try { return d.toLocaleDateString('en-GB', opts); } catch (e) { return d.toISOString().slice(0, 10); }
  }
  function stamp(d) {
    return d ? '’' + String(d.getUTCFullYear()).slice(2) + ' ' + (d.getUTCMonth() + 1) + ' ' + d.getUTCDate() : '';
  }

  // Maps a V3/V4 story (window.SCANORY_STORY) onto the V5 fields, so saved stories can be previewed.
  function fromV4(s) {
    s = s || {};
    var o = s.origin || {};
    return {
      sample: s.sample === true, recipient: s.recipient, sender: s.sender,
      scenes: {
        gift: { message: s.openingNote || (s.invitation || {}).message },
        firstMemory: { image: s.originImage, date: o.date, caption: o.caption, line: o.title, thought: o.detail },
        photoBack: { image: s.memoryImage, dedication: s.memoryNote }
      }
    };
  }
  // V5.1: scenes 4 to 10 live in scenes.js, which registers itself before this file runs.
  var MODULES = window.SCANORY_V5_SCENES || [];
  function fromV4All(s) {
    var out = fromV4(s);
    MODULES.forEach(function (m) { if (m.fromV4) { var extra = m.fromV4(s || {}); for (var k in extra) out.scenes[k] = extra[k]; } });
    return out;
  }

  function normalize(d) {
    d = d || {};
    var sc = d.scenes || {}, g = sc.gift || {}, m = sc.firstMemory || {}, b = sc.photoBack || {};
    var r = str(d.recipient), s = str(d.sender);
    var mi = safeURL(m.image), bi = safeURL(b.image);
    return {
      sample: d.sample === true, recipient: r, sender: s,
      gift: {
        enabled: g.enabled !== false,
        address: str(g.address) || (r ? 'For ' + r : 'For you'),
        monogram: (str(g.monogram) || r).charAt(0),
        greeting: str(g.greeting) || (r ? r + ',' : ''),
        message: str(g.message),
        signature: str(g.signature) || s
      },
      memory: {
        enabled: m.enabled !== false && !!mi, image: mi, alt: str(m.imageAlt),
        date: parseDay(m.date), dateStamp: m.dateStamp !== false,
        caption: str(m.caption), line: str(m.line), thought: str(m.thought),
        initial: (str(m.signature) || s).charAt(0)
      },
      back: {
        enabled: b.enabled !== false && !!bi, image: bi, alt: str(b.imageAlt),
        line: str(b.line), greeting: str(b.greeting) || (r ? r + ',' : ''),
        dedication: str(b.dedication), date: parseDay(b.date), signature: str(b.signature) || s
      }
    };
  }

  /* ---------- elements ---------- */
  var main = $('experience');
  var gift = $('scene-gift'), stage = $('gift-stage'), giftHit = $('gift-hit'), letter = $('letter'), giftCue = $('gift-cue');
  var memory = $('scene-memory'), mprint = $('mprint'), mhit = $('memory-hit'), slip = $('memory-slip'),
      mhint = $('memory-hint'), malt = $('memory-alt'), mcue = $('memory-cue');
  var back = $('scene-back'), pstage = $('pstage'), phit = $('p-hit'), tilt = $('ptilt'), lift = $('plift'),
      pshadow = $('pshadow'), pfront = $('pfront'), pback = $('pback'), bhint = $('back-hint'), blive = $('back-live');

  var S, timers = [], giftOpened = false, giftDone = false, thoughtOpen = false, flipped = false;
  var GIFT_STAGES = ['s-press', 's-crack', 's-open', 's-rise', 's-present', 's-written', 's-done'];
  var ext = [];
  function eachExt(name, a, b) { ext.forEach(function (m) { if (m[name]) m[name](a, b); }); }

  function text(id, v) { var el = $(id); el.textContent = v; el.hidden = !v; return el; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function settle(fn) {
    main.classList.add('instant');
    fn();
    void main.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { main.classList.remove('instant'); }); });
  }

  // Shrinks handwriting inside fixed-size paper until it fits.
  function fit(box, target, min) {
    if (!box || !target || !box.clientHeight) return;
    target.style.fontSize = '';
    var size = parseFloat(getComputedStyle(target).fontSize), n = 0;
    while (n++ < 60 && size > min && (box.scrollHeight > box.clientHeight + 1 || box.scrollWidth > box.clientWidth + 1)) {
      size -= 1;
      target.style.fontSize = size + 'px';
    }
  }
  function fitAll() {
    fit($('letter-paper'), $('letter-paper'), 12);
    fit($('back-text'), $('back-text'), 12);
    fit($('memory-caption'), $('memory-caption'), 11);
    eachExt('fit');
  }

  /* ---------- render ---------- */
  function render(raw) {
    S = normalize(raw);
    clearTimers();
    giftOpened = giftDone = thoughtOpen = flipped = false;

    // Scene 1
    $('gift-name').textContent = S.recipient || 'you';
    text('sample-note', S.sample ? 'Sample story · prototype' : '');
    $('end-sample').hidden = !S.sample;
    $('env-address').textContent = S.gift.address;
    $('env-from').textContent = S.gift.signature ? 'from ' + S.gift.signature : '';
    Array.prototype.forEach.call(doc.querySelectorAll('.seal-mark'), function (el) { el.textContent = S.gift.monogram; });
    text('letter-greeting', S.gift.greeting);
    text('letter-message', S.gift.message);
    text('letter-sign', S.gift.signature);
    $('gift-hint').textContent = tap + ' to open';
    gift.hidden = !S.gift.enabled;
    GIFT_STAGES.forEach(function (c) { gift.classList.remove(c); });
    gift.style.removeProperty('--leave');
    giftHit.hidden = false;
    letter.setAttribute('aria-hidden', 'true');

    // Scene 2
    var img = $('memory-img');
    img.src = S.memory.image;
    img.alt = S.memory.alt;
    $('memory-stamp').textContent = S.memory.dateStamp ? stamp(S.memory.date) : '';
    text('memory-caption', S.memory.caption);
    text('memory-date', fmt(S.memory.date, { day: 'numeric', month: 'long', year: 'numeric' }));
    text('memory-line', S.memory.line);
    $('memory-thought').textContent = S.memory.thought;
    text('memory-sign', S.memory.initial ? S.memory.initial + '.' : '');
    var hasThought = !!S.memory.thought;
    mhint.hidden = malt.hidden = !hasThought;
    mhint.textContent = (coarse ? 'Double-tap' : 'Double-click') + ' the photo';
    memory.classList.remove('is-placed', 'is-developed', 'is-revealed', 'is-folding', 'cue-on');
    slip.classList.add('tucked');
    syncThought();

    // Scene 3
    var bimg = $('back-img');
    bimg.src = S.back.image;
    bimg.alt = S.back.alt;
    text('back-line', S.back.line);
    text('back-date', fmt(S.back.date, { month: 'long', year: 'numeric' }));
    text('back-greeting', S.back.greeting);
    text('back-dedication', S.back.dedication);
    text('back-sign', S.back.signature);
    var flippable = !!(S.back.dedication || S.back.greeting);
    phit.hidden = bhint.hidden = !flippable;
    back.classList.remove('is-placed', 'is-flipped');
    syncFlip();
    mcue.hidden = !S.back.enabled;
    eachExt('render', raw || {}, S);

    // Locked until the envelope is open; if there is no envelope, everything is open.
    memory.hidden = back.hidden = true;
    if (!S.gift.enabled) unlock();
    fitAll();
  }

  /* ---------- scene 1: open the gift ---------- */
  function add(c) { gift.classList.add(c); }
  function openGift(e) {
    if (giftDone) return;
    if (giftOpened) { finishGift(); return; } // a second tap skips to the end
    giftOpened = true;
    buzz(e, 10);
    if (reduced()) {
      finishGift();
      stage.animate && stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
      return;
    }
    add('s-press');                                   // the envelope gives under the finger
    later(function () { add('s-crack'); }, 150);      // the wax cracks, the stage springs back
    later(function () { add('s-open'); }, 520);       // the flap lifts, light spills out
    later(function () { add('s-rise'); }, 1180);      // the card slides up
    later(function () { add('s-present'); unlock(); }, 2100); // envelope falls away, card comes forward
    later(function () { add('s-written'); }, 2900);   // the words appear
    later(doneGift, 3800);                            // "Come in"
  }
  function finishGift() {
    clearTimers();
    giftOpened = true;
    settle(function () { GIFT_STAGES.forEach(add); });
    unlock();
    doneGift();
  }
  function doneGift() {
    add('s-done');
    giftDone = true;
    letter.removeAttribute('aria-hidden');
    var hadFocus = doc.activeElement === giftHit;
    giftHit.hidden = true;
    if (hadFocus) letter.focus({ preventScroll: true });
  }

  /* ---------- unlocking and arriving ---------- */
  var unlocked = false;
  function unlock() {
    if (unlocked) { memory.hidden = !S.memory.enabled; back.hidden = !S.back.enabled; eachExt('unlock'); return; }
    unlocked = true;
    memory.hidden = !S.memory.enabled;
    back.hidden = !S.back.enabled;
    eachExt('unlock');
    fitAll();
    whenSeen(memory, function () {
      memory.classList.add('is-placed');
      setTimeout(function () {
        memory.classList.add('is-developed');
        if (!S.memory.thought) setTimeout(function () { memory.classList.add('cue-on'); }, reduced() ? 600 : 3200);
      }, reduced() ? 0 : 450);
    });
    whenSeen(back, function () { back.classList.add('is-placed'); });
  }
  // Runs fn once when the scene's top passes 68% of the viewport. The observer is the main
  // signal; the scroll check is a backup so a scene can never stay faded or unplaced.
  var waiting = [];
  function whenSeen(el, fn) {
    var job = { el: el, fn: fn, done: false };
    function run() { if (job.done) return; job.done = true; if (io) io.disconnect(); fn(); }
    job.run = run;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) run(); });
    }, { rootMargin: '0px 0px -32% 0px', threshold: 0 }) : null;
    if (io) io.observe(el);
    waiting.push(job);
    checkWaiting();
  }
  function checkWaiting() {
    waiting = waiting.filter(function (job) {
      if (job.done) return false;
      if (!job.el.hidden && job.el.getBoundingClientRect().top < innerHeight * .68) { job.run(); return false; }
      return true;
    });
  }

  // The cues scroll to the next scene and give it focus; they are plain links without JS.
  function go(e, target) {
    if (!target || target.hidden) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  }
  giftCue.addEventListener('click', function (e) { go(e, memory); });
  mcue.addEventListener('click', function (e) { go(e, back); });

  // As the first scene scrolls away, its light dims and the card drifts up: one continuous space.
  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      checkWaiting();
      eachExt('scroll');
      if (!giftDone || reduced()) return;
      var r = gift.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / r.height));
      gift.style.setProperty('--leave', p.toFixed(3));
    });
  }, { passive: true });

  /* ---------- scene 2: first memory ---------- */
  var lastTap = 0, lastX = 0, lastY = 0, hintTimer;
  function ripple(x, y) {
    if (reduced() || !mprint.animate) return;
    var r = mprint.getBoundingClientRect(), dot = doc.createElement('span');
    dot.className = 'ripple';
    dot.style.left = (x - r.left) + 'px';
    dot.style.top = (y - r.top) + 'px';
    mprint.appendChild(dot);
    dot.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.7)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' })
      .onfinish = function () { dot.remove(); };
  }
  function nudge() {
    if (reduced() || !mprint.animate) return;
    var base = getComputedStyle(mprint).transform;
    mprint.animate([{ transform: base }, { transform: base + ' scale(.988)' }, { transform: base }], { duration: 260, easing: 'cubic-bezier(.3,0,.3,1)' });
  }
  function syncThought() {
    malt.setAttribute('aria-expanded', String(thoughtOpen));
    malt.textContent = thoughtOpen ? 'Fold it away' : 'Read what I never said';
    if (S && S.memory.thought) {
      mhint.textContent = thoughtOpen
        ? (coarse ? 'Double-tap' : 'Double-click') + ' to put it back'
        : (coarse ? 'Double-tap' : 'Double-click') + ' the photo';
    }
  }
  function toggleThought(e) {
    if (!S.memory.thought) return;
    thoughtOpen = !thoughtOpen;
    buzz(e, 8);
    if (thoughtOpen) {
      memory.classList.remove('is-folding');
      slip.classList.remove('tucked');
      memory.classList.add('is-revealed', 'cue-on');
    } else {
      memory.classList.add('is-folding');
      setTimeout(function () {
        if (thoughtOpen) return;
        memory.classList.remove('is-revealed', 'is-folding');
        slip.classList.add('tucked');
      }, reduced() ? 260 : 430);
    }
    syncThought();
  }
  mhit.addEventListener('click', function (e) {
    var now = e.timeStamp, x = e.clientX, y = e.clientY;
    ripple(x, y);
    nudge();
    if (!S.memory.thought) return;
    if (now - lastTap < 480 && Math.abs(x - lastX) < 50 && Math.abs(y - lastY) < 50) {
      lastTap = 0;
      clearTimeout(hintTimer);
      toggleThought(e);
      return;
    }
    lastTap = now; lastX = x; lastY = y;
    mhint.textContent = 'Once more';
    clearTimeout(hintTimer);
    hintTimer = setTimeout(syncThought, 1400);
  });
  malt.addEventListener('click', toggleThought);

  /* ---------- scene 3: turn the photo over ---------- */
  var BASE = 'rotateX(10deg) rotateZ(-3deg)';
  function syncFlip() {
    back.classList.toggle('is-flipped', flipped);
    phit.setAttribute('aria-label', flipped ? 'Turn the photo back' : 'Turn the photo over');
    pfront.setAttribute('aria-hidden', String(flipped));
    pback.setAttribute('aria-hidden', String(!flipped));
    bhint.textContent = flipped ? tap + ' to turn it back' : tap + ' the photo';
  }
  function flip(e) {
    flipped = !flipped;
    syncFlip();
    buzz(e, 8);
    blive.textContent = flipped ? [S.back.greeting, S.back.dedication, S.back.signature].filter(Boolean).join(' ') : '';
    if (reduced() || !lift.animate) return;
    var o = { duration: 1150, easing: 'cubic-bezier(.45,0,.2,1)' };
    lift.animate([
      { transform: BASE },
      { transform: 'rotateX(0deg) rotateZ(-1deg) translateZ(110px)', offset: .46 },
      { transform: BASE }
    ], o);
    pshadow.animate([
      { transform: 'translateY(18px) rotate(-3deg) scale(1)', opacity: 1 },
      { transform: 'translateY(60px) rotate(-1deg) scale(.86)', opacity: .45, offset: .46 },
      { transform: 'translateY(18px) rotate(-3deg) scale(1)', opacity: 1 }
    ], o);
    Array.prototype.forEach.call(doc.querySelectorAll('.sheen'), function (s) {
      s.animate([
        { backgroundPosition: '120% 0', opacity: 0 },
        { opacity: 1, offset: .5 },
        { backgroundPosition: '-20% 0', opacity: 0 }
      ], { duration: 1150, easing: 'cubic-bezier(.4,0,.2,1)' });
    });
  }
  phit.addEventListener('click', flip);
  function press(on) { pstage.classList.toggle('pressed', on); }
  phit.addEventListener('pointerdown', function () { press(true); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { phit.addEventListener(t, function () { press(false); }); });

  // With a mouse, the print leans gently toward the pointer.
  pstage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || reduced()) return;
    var r = pstage.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tilt.style.setProperty('--py', (x * 9).toFixed(2) + 'deg');
    tilt.style.setProperty('--px', (-y * 7).toFixed(2) + 'deg');
  });
  pstage.addEventListener('pointerleave', function () {
    tilt.style.removeProperty('--px');
    tilt.style.removeProperty('--py');
  });

  giftHit.addEventListener('click', openGift);

  var resizeTimer;
  addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitAll, 150); });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', function () { root.classList.toggle('reduced', reduced()); });

  /* ---------- start ---------- */
  ext = MODULES.map(function (m) {
    return m.create({
      $: $, str: str, safeURL: safeURL, parseDay: parseDay, fmt: fmt, reduced: reduced, coarse: coarse, tap: tap,
      buzz: buzz, whenSeen: whenSeen, settle: settle, text: text, fit: fit, go: go, params: params
    });
  });
  function start(data) {
    settle(function () { render(data); });
    root.classList.toggle('reduced', reduced());
    root.classList.add('ready');
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fitAll);
  }
  try {
    start(window.SCANORY_V5 || (window.SCANORY_STORY ? fromV4All(window.SCANORY_STORY) : {}));
    window.ScanoryV5 = {
      render: function (d) { unlocked = false; waiting = []; start(d); },
      fromV4: fromV4All
    };
  } catch (err) {
    // Leave the finished, readable state in place.
    root.classList.remove('ready');
    if (window.console) console.error(err);
  } finally {
    root.classList.remove('js-pending');
  }
})();
