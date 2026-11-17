/* The cast: sprites drawn as SVG on an 18 x 11 unit grid, positioned by their
   feet (x, y) in stage pixels. One class serves the lead mascot, every
   sub-agent and Mir (kind: 'mir', a low-poly figure). Only the unit size, tag
   and accessories differ. They talk (typed speech bubbles), move, have moods.
   Timers go through Clawd.T so the deck can run them on its own clock (that is
   what lets the back arrow replay a scene instantly). */
(function (g) {
  'use strict';
  var SPRITE =
    '<svg viewBox="-6 -7 30 22" shape-rendering="crispEdges" aria-hidden="true">' +
    '<rect class="sh" x="2.5" y="11.15" width="13" height=".7"/>' +
    '<rect class="lg a" x="3" y="8" width="1" height="3"/><rect class="lg b" x="5" y="8" width="1" height="3"/>' +
    '<rect class="lg a" x="12" y="8" width="1" height="3"/><rect class="lg b" x="14" y="8" width="1" height="3"/>' +
    '<g class="wr w-bag"><rect x="-.6" y="1" width="3" height="5.4" fill="#3E7C6A"/><rect x="-.6" y="1" width="3" height="1.2" fill="#2F6152"/><rect x=".2" y="3.4" width="1.4" height="1.6" fill="#F0C75E"/></g>' +
    '<rect class="arm al" x="0" y="4" width="2" height="2"/><rect class="arm ar" x="16" y="4" width="2" height="2"/>' +
    '<rect class="bd" x="2" y="0" width="14" height="8"/>' +
    '<g class="eyes"><rect class="eye e1" x="5" y="2" width="1" height="2"/><rect class="eye e2" x="12" y="2" width="1" height="2"/></g>' +
    '<g class="eyex" shape-rendering="auto"><path d="M4.5 2l2 2m0-2l-2 2M11.5 2l2 2m0-2l-2 2"/></g>' +
    '<g class="brow"><rect x="3.8" y="1" width="1.4" height=".6"/><rect x="5.2" y="1.5" width="1.5" height=".6"/><rect x="12.8" y="1" width="1.4" height=".6"/><rect x="11.3" y="1.5" width="1.5" height=".6"/></g>' +
    '<g class="sweat"><rect x="16.7" y="-.6" width=".8" height="1.5"/><rect x="18" y="1.2" width=".7" height="1.1"/></g>' +
    /* worn */
    '<g class="wr w-fedora"><rect x="5" y="-3" width="8" height="2.4" fill="#C8AE82"/><rect x="5" y="-1.3" width="8" height=".7" fill="#221C18"/><rect x="2.4" y="-.6" width="13.2" height=".8" fill="#B4996A"/><rect x="10.8" y="-3.3" width="2.8" height="1.9" fill="#F6F3EC"/><rect x="11.3" y="-2.8" width="1.8" height=".35" fill="#E8312A"/><rect x="11.3" y="-2.2" width="1.3" height=".3" fill="#8a8f9c"/></g>' +
    '<g class="wr w-glasses"><rect x="3.7" y="1.2" width="3.6" height="3.4" fill="none" stroke="#F4F5F7" stroke-width=".5"/><rect x="10.7" y="1.2" width="3.6" height="3.4" fill="none" stroke="#F4F5F7" stroke-width=".5"/><rect x="7.3" y="2.5" width="3.4" height=".5" fill="#F4F5F7"/></g>' +
    '<g class="wr w-shades"><rect x="2" y="2" width="14" height=".8" fill="#0d0d0f"/><rect x="3" y="2" width="5" height="2.4" fill="#0d0d0f"/><rect x="10" y="2" width="5" height="2.4" fill="#0d0d0f"/><rect x="4" y="2.6" width=".8" height=".6" fill="#fff"/><rect x="4.8" y="3.2" width=".8" height=".6" fill="#fff"/><rect x="11" y="2.6" width=".8" height=".6" fill="#fff"/><rect x="11.8" y="3.2" width=".8" height=".6" fill="#fff"/></g>' +
    '<g class="wr w-helmet"><rect x=".6" y="-2.2" width="16.8" height="11" fill="rgba(159,196,238,.16)" stroke="#E9EEF6" stroke-width=".6"/><rect x="2" y="-1.2" width="3.4" height=".7" fill="#fff" opacity=".8"/><rect x="2" y="-.2" width=".7" height="2" fill="#fff" opacity=".8"/><rect x="7.6" y="-4" width=".8" height="1.8" fill="#E9EEF6"/><rect x="7" y="-4.9" width="2" height="1" fill="#E8312A"/></g>' +
    '<g class="wr w-leaf"><rect x="6" y="-1.6" width="6" height="1.6" fill="#3F8F4F"/><rect x="7" y="-3" width="4" height="1.4" fill="#57B368"/><rect x="8.4" y="-4.2" width="1.2" height="1.2" fill="#7BD389"/><rect x="11.6" y="-2.6" width="2.2" height="1" fill="#57B368"/></g>' +
    /* held, in the right hand */
    '<g class="hd h-paper"><rect x="18.3" y=".2" width="4.8" height="6.2" fill="#F6F3EC" stroke="#8a8f9c" stroke-width=".15"/><rect x="19" y="2.4" width="3.4" height=".4" fill="#9aa0ad"/><rect x="19" y="3.5" width="3" height=".4" fill="#9aa0ad"/><rect x="19" y="4.6" width="3.3" height=".4" fill="#9aa0ad"/></g>' +
    '<g class="hd h-red"><rect x="19" y="1.1" width="3.4" height=".65" fill="#E8312A"/></g>' +
    '<g class="hd h-tick" shape-rendering="auto"><path d="M19.2 1.3l.8.8 1.6-1.7" stroke="#1f9d55" stroke-width=".55" fill="none"/></g>' +
    '<g class="hd h-card"><rect x="18.3" y="1.6" width="5.2" height="3.6" fill="#F6F3EC" stroke="#8a8f9c" stroke-width=".15"/><rect x="18.3" y="1.6" width="5.2" height=".8" fill="#D97757"/><rect x="19" y="3.1" width="3.6" height=".4" fill="#9aa0ad"/><rect x="19" y="4" width="2.6" height=".4" fill="#9aa0ad"/></g>' +
    '<g class="hd h-notebook"><rect x="18.4" y=".8" width="4.4" height="5.8" fill="#1A2139" stroke="#F4F5F7" stroke-width=".2"/><rect x="18.1" y="1.5" width=".7" height=".5" fill="#F4F5F7"/><rect x="18.1" y="2.8" width=".7" height=".5" fill="#F4F5F7"/><rect x="18.1" y="4.1" width=".7" height=".5" fill="#F4F5F7"/><rect x="18.1" y="5.4" width=".7" height=".5" fill="#F4F5F7"/><rect x="19.4" y="2" width="2.6" height=".35" fill="#7d93b8"/><rect x="19.4" y="3" width="2.2" height=".35" fill="#7d93b8"/><rect x="19.4" y="4" width="2.5" height=".35" fill="#7d93b8"/></g>' +
    '<g class="hd h-folder"><rect x="18.3" y="1.3" width="2.4" height="1" fill="#E9B949"/><rect x="18.3" y="2" width="5.6" height="4" fill="#F0C75E"/></g>' +
    '<g class="hd h-lens" shape-rendering="auto"><circle cx="21.2" cy="2.4" r="1.9" fill="rgba(125,147,184,.3)" stroke="#F4F5F7" stroke-width=".5"/><path d="M19.8 3.8L18.2 5.6" stroke="#F4F5F7" stroke-width=".8"/></g>' +
    '<g class="hd h-mug"><rect class="st" x="19.2" y=".7" width=".45" height="1.2" fill="#F4F5F7"/><rect class="st" x="20.5" y=".3" width=".45" height="1.5" fill="#F4F5F7"/><rect x="18.5" y="2.4" width="3.2" height="3.4" fill="#F4F5F7"/><rect x="21.7" y="3.2" width="1" height="1.7" fill="none" stroke="#F4F5F7" stroke-width=".4"/></g>' +
    '<g class="hd h-box"><rect x="18.2" y="-.6" width="6.4" height="6.6" fill="#101828" stroke="#E8312A" stroke-width=".35"/><rect x="19.4" y=".8" width="1.2" height="3.6" fill="#E8312A"/><rect x="21.4" y=".8" width="2" height=".8" fill="#E8312A"/><rect x="22.6" y=".8" width=".8" height="3.6" fill="#E8312A"/></g>' +
    '</svg>';
  /* Mir: a low-poly figure. Same grid, feet at y = 11. */
  var MIR =
    '<svg viewBox="-6 -7 30 22" aria-hidden="true">' +
    '<rect class="sh" x="3.5" y="11.15" width="11" height=".7"/>' +
    '<polygon points="5,8.4 13,8.4 13.4,11 4.6,11" fill="#2E2A4A"/>' +
    '<polygon points="5.4,3.4 12.6,3.4 13.2,8.8 4.8,8.8" fill="#6C63D9"/><polygon points="10.6,3.4 12.6,3.4 13.2,8.8 11.2,8.8" fill="#554CC0"/>' +
    '<polygon class="marm mal" points="5.6,3.8 2.4,8.6 3.7,9.6 6.6,6" fill="#7B73E6"/><polygon class="marm mar" points="12.4,3.8 15.6,8.6 14.3,9.6 11.4,6" fill="#5A51C9"/>' +
    '<g class="mhead">' +
    '<polygon class="mskin" points="3.2,-3.6 6.5,-5.4 12.6,-5.2 15.2,-2.6 15.4,1.6 12.4,4.4 6.2,4.4 2.8,1.8" fill="#F2A39B"/>' +
    '<polygon points="3.2,-3.6 6.5,-5.4 9,-1.5 4.5,.5" fill="#F7B6AE"/>' +
    '<polygon points="12.6,-5.2 15.2,-2.6 15.4,1.6 12.4,4.4 10.5,.5" fill="#E0847A"/>' +
    '<polygon points="6.2,4.4 12.4,4.4 10.5,.5 4.5,.5 2.8,1.8" fill="#EE978E"/>' +
    '<polygon points="14.7,-1.6 16.5,-1 16.3,.9 14.9,1.2" fill="#D8756C"/><polygon points="14.7,-1.6 16.5,-1 15.5,-.2" fill="#E99A8F"/>' +
    '<polygon points="2.6,-3.3 3.6,-6 6.2,-6.9 9,-6.3 11.4,-7 13.6,-6 15.7,-3.5 15.3,-2.1 12.6,-3.6 8.6,-3.9 5.4,-3.2 3.1,-1.7" fill="#2B2742"/>' +
    '<polygon points="5,-6.5 5.8,-7.7 6.7,-6.7" fill="#2B2742"/><polygon points="10.9,-6.8 11.9,-8 12.7,-6.6" fill="#2B2742"/><polygon points="3.6,-6 6.2,-6.9 7,-5.2 4.4,-4.4" fill="#3A3558"/>' +
    '<g class="meyes"><ellipse class="meye" cx="6.4" cy="-.7" rx=".62" ry=".8" fill="#17131f"/><ellipse class="meye" cx="10.2" cy="-.9" rx=".62" ry=".8" fill="#17131f"/></g>' +
    '<g class="mbrow"><polygon points="5,-2.7 7.6,-1.8 7.5,-1.3 4.9,-2.1" fill="#17131f"/><polygon points="11.7,-2.9 9.1,-2 9.2,-1.5 11.8,-2.3" fill="#17131f"/></g>' +
    '<polygon points="8.2,-.3 7.1,2 9.2,1.8" fill="#F9C2B4"/><polygon points="8.2,-.3 9.2,1.8 9,.1" fill="#E88F80"/>' +
    '<rect class="mmouth" x="7.2" y="2.7" width="2.2" height=".65" fill="#7A2B3A"/>' +
    '</g>' +
    '<g class="sweat"><rect x="16.9" y="-4.6" width=".8" height="1.5"/><rect x="18.2" y="-2.8" width=".7" height="1.1"/></g>' +
    '<g class="hd h-paper"><rect x="14.6" y="4.4" width="4.6" height="5.8" fill="#F6F3EC" stroke="#8a8f9c" stroke-width=".15"/><rect x="15.3" y="5.6" width="3.2" height=".4" fill="#9aa0ad"/><rect x="15.3" y="6.7" width="2.8" height=".4" fill="#9aa0ad"/><rect x="15.3" y="7.8" width="3.1" height=".4" fill="#9aa0ad"/></g>' +
    '<g class="hd h-mug"><rect class="st" x="15.6" y="4.6" width=".45" height="1.2" fill="#F4F5F7"/><rect class="st" x="16.9" y="4.2" width=".45" height="1.5" fill="#F4F5F7"/><rect x="14.9" y="6.3" width="3.2" height="3.2" fill="#F4F5F7"/><rect x="18.1" y="7" width="1" height="1.6" fill="none" stroke="#F4F5F7" stroke-width=".4"/></g>' +
    '<g class="hd h-phone"><rect x="15" y="4.8" width="3" height="5" fill="#11172B" stroke="#F4F5F7" stroke-width=".25"/><rect x="15.5" y="5.5" width="2" height="2.6" fill="#25D366"/></g>' +
    '</svg>';
  /* moods that keep throwing a little symbol above the head */
  var EMO = { confused: ['?', '', 950], dizzy: ['?', '', 1200], sleep: ['z', 'blue', 1100], joy: ['+', 'star', 420], fresh: ['+', 'star', 650], boss: ['!', 'red', 1000], panic: ['!', 'red', 520], angry: ['!', 'red', 480], shock: ['!', 'red', 900] };

  function Clawd(cast, o) {
    o = o || {};
    this.cast = cast; this.u = o.u || 11; this.x = 0; this.y = 0; this.f = 1; this.base = 'idle'; this.lines = null; this.kind = o.kind || '';
    this.vid = Clawd.made = (Clawd.made || 0) + 1; /* 1 = the lead; the voices tell the cast apart by this */
    var el = this.el = document.createElement('div');
    el.className = 'clawd gone' + (o.kind ? ' ' + o.kind : '');
    el.innerHTML = '<div class="cl-in"><div class="cl-b">' + (o.kind === 'mir' ? MIR : SPRITE) + '</div></div><div class="hit"></div><div class="emos"></div>' +
      '<div class="bubble"></div><div class="chips"></div><div class="ctag"><span></span><div class="cbar"><i></i></div></div>';
    el.style.setProperty('--u', this.u + 'px');
    el.style.setProperty('--bd', (-Math.random() * 4).toFixed(2) + 's');
    this.bub = el.querySelector('.bubble'); this.chipBox = el.querySelector('.chips'); this.emoBox = el.querySelector('.emos');
    this.tagEl = el.querySelector('.ctag span'); this.barEl = el.querySelector('.cbar');
    el.querySelector('.hit')._clawd = this;
    el.dataset.mood = 'idle'; el.dataset.hold = 'none'; el.dataset.arms = 'down'; el.dataset.wear = '';
    cast.appendChild(el);
    this.visible = false;
  }
  /* the deck swaps these for its own clock */
  Clawd.T = { set: function (fn, ms) { return setTimeout(fn, ms); }, clear: function (id) { clearTimeout(id); } };
  Clawd.instant = false;
  Clawd.prototype = {
    _apply: function () { this.el.style.transform = 'translate3d(' + this.x + 'px,' + this.y + 'px,0)'; },
    size: function (u) { this.u = u; this.el.style.setProperty('--u', u + 'px'); return this; },
    /* place instantly */
    at: function (x, y) {
      Clawd.T.clear(this._gt); this.el.classList.remove('walk');
      this.el.style.transitionDuration = '0s,.2s'; this.x = x; this.y = y; this._apply(); void this.el.offsetWidth; return this;
    },
    /* where the sprite is on screen right now, mid-run included */
    pos: function () {
      var t = getComputedStyle(this.el).transform;
      if (!t || t === 'none') return { x: this.x, y: this.y };
      var m = new DOMMatrixReadOnly(t); return { x: m.m41, y: m.m42 };
    },
    face: function (d) { this.f = d < 0 ? -1 : 1; this.el.style.setProperty('--f', this.f); return this; },
    /* run to a point; o.dur seconds or o.speed px/s; o.then on arrival; o.face afterwards. Tired sprites drag their feet. */
    go: function (x, y, o) {
      o = o || {}; var self = this, p = this.pos(), d = Math.hypot(x - p.x, y - p.y), m = this.el.dataset.mood;
      var slow = (m === 'tired' || m === 'dizzy' || m === 'confused') ? .5 : 1;
      var dur = o.dur != null ? o.dur : Math.max(.15, d / ((o.speed || (this.u * 70)) * slow));
      if (Math.abs(x - p.x) > 4 && !o.keep) this.face(x > p.x ? 1 : -1);
      Clawd.T.clear(this._gt); this.el.classList.add('walk');
      this.el.style.transitionDuration = dur + 's,.2s'; this.el.style.transitionTimingFunction = o.ease || 'linear,linear'; this.x = x; this.y = y; this._apply();
      this._gt = Clawd.T.set(function () { self.el.classList.remove('walk'); if (o.face) self.face(o.face); if (o.then) o.then(); }, dur * 1000 + 40);
      return this;
    },
    stop: function () { var p = this.pos(); this.at(p.x, p.y); return this; },
    mood: function (m) {
      var self = this; m = m || this.base; this.el.dataset.mood = m; clearInterval(this._em); Clawd.T.clear(this._md);
      var e = EMO[m]; if (e) { this.emote(e[0], e[1]); this._em = setInterval(function () { if (self.visible) self.emote(e[0], e[1]); }, e[2]); }
      /* a jump for joy settles into a smile, so it never bounces through a whole explanation */
      if (m === 'joy' || m === 'fresh') this._md = Clawd.T.set(function () { if (self.el.dataset.mood === m) self.mood('happy'); }, m === 'joy' ? 3400 : 4800);
      return this;
    },
    /* a symbol that pops out of the head and floats away */
    emote: function (s, cls) {
      if (Clawd.instant) return this;
      var e = document.createElement('i'); e.className = 'emo ' + (cls || ''); e.textContent = s;
      e.style.setProperty('--ex', ((Math.random() * 14 - 7) * this.u).toFixed(0) + 'px'); this.emoBox.appendChild(e);
      setTimeout(function () { e.remove(); }, 1350); return this;
    },
    arms: function (a) { this.el.dataset.arms = a || 'down'; return this; },
    hold: function (h) { this.el.dataset.hold = h || 'none'; return this; },
    wear: function (w) { this.el.dataset.wear = w || ''; return this; },
    look: function (d) { if (d) this.el.dataset.look = d; else delete this.el.dataset.look; return this; },
    tag: function (t) { this.tagEl.textContent = t || ''; return this; },
    /* tip over (and get back up) */
    fall: function (b) { this.el.classList.toggle('down', b !== false); return this; },
    /* a sub-agent's own context bar: pct 0-100, or null to hide */
    bar: function (pct) {
      if (pct == null) { this.barEl.classList.remove('on', 'full'); return this; }
      this.barEl.classList.add('on'); this.barEl.classList.toggle('full', pct >= 85);
      this.barEl.firstChild.style.width = pct + '%'; return this;
    },
    _fx: function (c, ms) {
      if (Clawd.instant) return this;
      var el = this.el; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); clearTimeout(this['_' + c]); this['_' + c] = setTimeout(function () { el.classList.remove(c); }, ms); return this;
    },
    hop: function () { return this._fx('hop', 480); },
    shake: function () { return this._fx('shake', 640); },
    squeeze: function () { return this._fx('squeeze', 720); },
    _say: function (t, hold, align) {
      var b = this.bub, self = this, i = 0, u = this.u, el = this.el;
      clearInterval(this._ty); Clawd.T.clear(this._sh);
      var cls = 'bubble on';
      if (align) cls += ' ' + align;
      if (!/\b(bl|br)\b/.test(cls) && !/\bmid\b/.test(cls)) { if (this.x < 470) cls += ' bl'; else if (this.x > 1450) cls += ' br'; }
      var top = this.kind === 'mir' ? 23 : 12.4;
      if (this.y - u * top < 170 && cls.indexOf('below') < 0) cls += ' below'; /* never off the top of the stage */
      b.className = cls; b.innerHTML = '<span></span><span class="gh"></span>';
      var a = b.firstChild, gh = b.lastChild;
      if (Clawd.instant) { a.textContent = t; return; }
      gh.textContent = t; el.classList.add('talk');
      Clawd.voice.say(this, t);
      this._ty = setInterval(function () { i += 2; a.textContent = t.slice(0, i); gh.textContent = t.slice(i); if (i >= t.length) { clearInterval(self._ty); if (!Clawd.voice.on(self)) el.classList.remove('talk'); } }, 26);
      if (!hold) this._sh = Clawd.T.set(function () { self.hush(1); }, Math.max(2600, t.length * 70 + 1400));
    },
    /* one line; hold=true keeps it up until the next line */
    say: function (t, hold, align) { this._say(t, hold, align); return this; },
    /* keep=true (a bubble timing out by itself) lets the voice finish the sentence */
    hush: function (keep) { clearInterval(this._ty); Clawd.T.clear(this._sh); this.bub.classList.remove('on'); if (!keep) Clawd.voice.hush(this); if (!Clawd.voice.on(this)) this.el.classList.remove('talk'); return this; },
    /* a tool call floating up beside the sprite, the way the terminal prints one */
    chip: function (t) {
      if (Clawd.instant) return this;
      var c = document.createElement('div'); c.className = 'chip'; c.textContent = t;
      this.chipBox.classList.toggle('l', this.x > 1300); this.chipBox.appendChild(c);
      setTimeout(function () { c.remove(); }, 2900); return this;
    },
    show: function () { this.visible = true; this.el.classList.remove('gone'); return this; },
    hide: function () { this.visible = false; this.el.classList.add('gone'); this.hush(); clearInterval(this._em); Clawd.T.clear(this._md); return this; },
    /* back to a neutral sprite, wherever it stands */
    reset: function () {
      Clawd.T.clear(this._gt); Clawd.T.clear(this._sp); this.el.classList.remove('walk', 'hop', 'shake', 'squeeze', 'talk', 'down', 'float');
      this.el.style.opacity = '';
      this.hush(); this.chipBox.innerHTML = ''; this.emoBox.innerHTML = ''; this.mood(); this.arms(); this.hold(); this.wear(); this.look(); this.bar(null); return this;
    },
    _bits: function (out) {
      if (Clawd.instant) return;
      var u = this.u, cx = this.x, cy = this.y - u * 5.5, cast = this.cast, n = 30, list = [], col = this.kind === 'mir' ? '#6C63D9' : '';
      for (var i = 0; i < n; i++) {
        var p = document.createElement('i'); p.className = 'px'; p.style.width = p.style.height = u + 'px'; if (col) p.style.background = i % 3 ? col : '#F2A39B';
        var hx = cx + (Math.random() * 14 - 7) * u, hy = cy + (Math.random() * 8 - 4) * u;
        var a = Math.random() * 6.283, r = (9 + Math.random() * 16) * u, fx = cx + Math.cos(a) * r, fy = cy + Math.sin(a) * r;
        var from = out ? [hx, hy] : [fx, fy], to = out ? [fx, fy] : [hx, hy];
        p.style.transform = 'translate(' + from[0] + 'px,' + from[1] + 'px)'; p.style.opacity = out ? 1 : 0;
        cast.appendChild(p); list.push([p, to]);
      }
      void cast.offsetWidth;
      list.forEach(function (q) { q[0].style.transform = 'translate(' + q[1][0] + 'px,' + q[1][1] + 'px)'; q[0].style.opacity = out ? 0 : 1; });
      setTimeout(function () { list.forEach(function (q) { q[0].remove(); }); }, 520);
    },
    /* assemble out of loose pixels */
    spawn: function (x, y, then) {
      var self = this; this.hide(); this.at(x, y); this._bits(false);
      Clawd.T.clear(this._sp);
      this._sp = Clawd.T.set(function () { self.show(); self.hop(); if (then) then(); }, 430); return this;
    },
    /* fall apart into pixels */
    poof: function (then) { this.hide(); this._bits(true); if (then) { Clawd.T.clear(this._sp); this._sp = Clawd.T.set(then, 480); } return this; }
  };
  /* ---------- voices ----------
     Every bubble is also spoken. The lines are recorded ahead of time with
     neural voices (python tools/voices.py) as voice/<hash>.mp3, and
     voice/lines.js lists them. They load in the background and play at once,
     offline, the same on every computer. A line with no recording stays
     silent. With no recordings at all, the computer's own speech engine reads
     the line (robotic). One line is spoken at a time: a sprite's new line (or
     its hush) cuts its old one; a line from somebody else waits for the
     current one, and only the newest waiting line is kept.
     mode: 2 everyone, 1 mascots only (Mir's avatar silent), 0 off. */
  var SY = g.speechSynthesis, FILES = g.VOICE || null, BL = {}, VO = { mode: 2, vol: 1, cur: null, pend: null, tok: 0, cut: 0, v: {}, log: null, loaded: 0 };
  try { var sm = localStorage.getItem('deckVoice'); if (sm !== null) VO.mode = +sm; else if (navigator.webdriver) VO.mode = 0; } catch (e) {}
  var KEEP = /^(AI|QA|TTL|OK|CSS|JS|HTML|SEO|PDF|TV|TDS|URL|API|UI|JSON|SVG|CDN|PR|FAQ|MD)$/;
  function vkind(c) { return c.kind === 'mir' ? 'mir' : c.vid > 1 ? 'help' : 'lead'; }
  /* the name of a line's recording: who says it + the exact bubble text */
  function vhash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  /* bubble text to something a speech engine reads well; shouted capitals become a louder, faster line */
  function speakable(t) {
    var loud = /\?!|!!/.test(t);
    t = t.replace(/\b([A-Za-z]+)\.md\b/g, function (m, n) { return n.charAt(0) + n.slice(1).toLowerCase() + ' dot M D'; }).replace(/\.md\b/g, ' dot M D')
      .replace(/\b[A-Z]{2,}\b/g, function (w) { if (KEEP.test(w)) return w; loud = true; return w.toLowerCase(); })
      .replace(/(^|\s)\/([a-z]+)/g, '$1slash $2').replace(/(\d)\s?K\b/g, '$1 thousand').replace(/(\d)\s?M\b/g, '$1 million').replace(/(\d)\s?px\b/g, '$1 pixels')
      .replace(/\bTk\b/g, 'taka').replace(/…/g, '...').replace(/[·→]/g, ', ').replace(/[*_]/g, '').replace(/\?!+/g, '?!').replace(/!{2,}/g, '!').replace(/\s+/g, ' ').trim();
    return { text: t.charAt(0).toUpperCase() + t.slice(1), loud: loud };
  }
  /* fetch the recordings in scene order, a few at a time, and keep them in memory */
  function vload() {
    if (!FILES || VO.loading || !g.fetch) return; VO.loading = true;
    var list = Object.keys(FILES), i = 0;
    function nx() {
      if (i >= list.length) return; var h = list[i++];
      fetch('voice/' + h + '.mp3').then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { if (b) { BL[h] = URL.createObjectURL(b); VO.loaded++; } nx(); }, nx);
    }
    for (var k = 0; k < 6; k++) nx();
  }
  function pickVoices() {
    if (!SY) return;
    var all = SY.getVoices().filter(function (v) { return /^en/i.test(v.lang); });
    all.sort(function (a, b) { return (b.localService ? 1 : 0) - (a.localService ? 1 : 0); });
    function find(res) { for (var i = 0; i < res.length; i++) for (var j = 0; j < all.length; j++) if (res[i].test(all[j].name)) return all[j]; return all[0] || null; }
    VO.v.lead = VO.v.help = find([/Zira/, /Aria/, /Jenny/, /Samantha/, /Google US English/, /female/i]);
    VO.v.mir = find([/David/, /Mark/, /Guy/, /Daniel/, /Google UK English Male/, /\bmale/i]);
  }
  if (FILES) { if (VO.mode) vload(); }
  else if (SY) { pickVoices(); if (SY.addEventListener) SY.addEventListener('voiceschanged', pickVoices); }
  function vdone(u) { if (VO.cur && VO.cur.u === u) { var c = VO.cur.c; VO.cur = null; clearTimeout(VO.wd); if (!c.el.querySelector('.gh').textContent) c.el.classList.remove('talk'); vdrain(); } }
  function vstop() {
    if (!VO.cur) return; var c = VO.cur.c, u = VO.cur.u; VO.cur = null; VO.tok++; clearTimeout(VO.wd);
    try { if (u.pause) u.pause(); else { VO.cut = Date.now(); SY.cancel(); } } catch (e) {}
    c.el.classList.remove('talk');
  }
  function vdrain() { if (VO.pend) { var p = VO.pend; VO.pend = null; vstart(p); } }
  /* a recording */
  function vplay(it) {
    var c = it.c, a = new Audio(BL[it.h] || 'voice/' + it.h + '.mp3'); VO.tok++;
    a.volume = VO.vol;
    /* the six helpers share one set of recordings; a touch of speed keeps them apart */
    if (vkind(c) === 'help') { a.preservesPitch = a.webkitPreservesPitch = false; a.playbackRate = 1 + (c.vid % 3) * .05; }
    a.onplaying = function () { if (VO.cur && VO.cur.u === a) c.el.classList.add('talk'); };
    a.onended = a.onerror = function () { vdone(a); };
    VO.cur = { c: c, u: a };
    var p = a.play(); if (p && p.catch) p.catch(function () { vdone(a); });
    VO.wd = setTimeout(function () { if (VO.cur && VO.cur.u === a) { try { a.pause(); } catch (e) {} vdone(a); } }, 30000);
  }
  /* the computer's speech engine (only when there are no recordings) */
  function vspeak(it) {
    var tok = ++VO.tok, c = it.c, k = vkind(c);
    var u = new SpeechSynthesisUtterance(it.s.text);
    if (VO.v[k]) { u.voice = VO.v[k]; u.lang = VO.v[k].lang; } else u.lang = 'en-US';
    u.pitch = (k === 'mir' ? .85 : k === 'help' ? 1.65 + (c.vid % 3) * .12 : 1.35) + (it.s.loud ? .15 : 0);
    u.rate = (k === 'help' ? 1.2 : k === 'mir' ? 1 : 1.05) * (it.s.loud ? 1.1 : 1);
    u.volume = VO.vol * (it.s.loud ? 1 : .88);
    u.onstart = function () { if (VO.cur && VO.cur.u === u) c.el.classList.add('talk'); };
    u.onend = u.onerror = function () { vdone(u); };
    VO.cur = { c: c, u: u };
    /* Chrome can drop a speak() that follows a cancel() in the same breath */
    setTimeout(function () { if (tok === VO.tok) try { SY.speak(u); } catch (e) { vdone(u); } }, Date.now() - VO.cut < 120 ? 70 : 0);
    /* an engine that never reports the end must not block the next line */
    VO.wd = setTimeout(function () { if (VO.cur && VO.cur.u === u) { try { SY.cancel(); } catch (e) {} vdone(u); } }, it.s.text.length * 110 + 4000);
  }
  function vstart(it) { if (it.h) vplay(it); else vspeak(it); }
  Clawd.voice = {
    say: function (c, t) {
      var it = { c: c }, ok = true;
      if (FILES) { it.h = vhash(vkind(c) + '|' + t); ok = !!FILES[it.h]; }
      else { it.s = speakable(t); ok = !!(SY && g.SpeechSynthesisUtterance && it.s.text); }
      if (VO.log) VO.log(c, t, it.h, ok);
      if (!VO.mode || (VO.mode === 1 && c.kind === 'mir')) return;
      if (!ok) { if (VO.cur && VO.cur.c === c) { vstop(); vdrain(); } return; }
      if (VO.cur && VO.cur.c !== c) { VO.pend = it; return; }
      vstop(); VO.pend = null; vstart(it);
    },
    hush: function (c) { if (VO.pend && VO.pend.c === c) VO.pend = null; if (VO.cur && VO.cur.c === c) { vstop(); vdrain(); } },
    on: function (c) { return !!(VO.cur && VO.cur.c === c); },
    /* next mode; returns the label for the status line */
    cycle: function () { this.set(VO.mode === 2 ? 1 : VO.mode === 1 ? 0 : 2); return ['Voices off', 'Voices: mascots only', 'Voices: everyone'][VO.mode]; },
    set: function (m) { VO.mode = m; VO.pend = null; vstop(); if (m) vload(); try { localStorage.setItem('deckVoice', m); } catch (e) {} },
    kind: vkind, hash: vhash, speakable: speakable, state: VO
  };
  g.Clawd = Clawd;
})(window);
