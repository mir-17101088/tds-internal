/* Vibe Coding, Engineered: the deck engine.
   One live "agent session": the lead mascot drives 13 scenes. Each scene is a
   list of beats, and each beat is a short script of spoken lines. One press
   (clicker, arrow, space, Enter) plays ONE line; a line stays on screen until
   the next press. When a beat's lines are done, the next press starts the next
   beat. Mouse clicks talk to the mascot. "/" opens a command line. */
(function () {
'use strict';
var $ = function (id) { return document.getElementById(id); };
var Q = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var stage = $('stage'), cast = $('cast'), slides = Q('.slide'), ids = slides.map(function (s) { return s.id; });
var cur = -1, step = 0, t0 = null, gen = 0, ak = {}, SC = {}, W = [];
var lastAct = Date.now(), asides = 0, chatty = true, QD = [], QA = null;

/* The stage is 1920 x 1080 and scales to any window: a laptop, a projector, a 4K TV. */
function fit() { var s = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')'; }
addEventListener('resize', fit); fit();

/* ---------- the deck's own clock ----------
   Every timer in a scene (and in the sprites) runs on this clock. Live, it
   follows real time. For the back arrow it is wound forward by hand: the scene
   restarts and every earlier press is replayed in one frame (INST), so one
   press back is exactly one step back, never the top of the slide. */
var now = 0, TQ = [], tid = 0, INST = false, REPLAY = false, HIST = {}, lastT = performance.now();
function sched(fn, ms, rep, sys) { TQ.push({ id: ++tid, at: now + Math.max(0, ms), fn: fn, rep: rep ? Math.max(16, ms) : 0, sys: !!sys }); return tid; }
function unsched(id) { for (var i = 0; i < TQ.length; i++) if (TQ[i].id === id) { TQ.splice(i, 1); return; } }
function pump(to) {
  for (var n = 0; n < 20000; n++) {
    var b = null; for (var i = 0; i < TQ.length; i++) { var t = TQ[i]; if (t.at <= to && (!b || t.at < b.at || (t.at === b.at && t.id < b.id))) b = t; }
    if (!b) break; if (b.at > now) now = b.at;
    if (b.rep) b.at += b.rep; else TQ.splice(TQ.indexOf(b), 1);
    try { b.fn(); } catch (e) { if (window.console) console.error(e); }
  }
  if (to > now) now = to;
}
/* run the clock until nothing one-off is left waiting (loops do not count) */
function settle(cap) {
  var end = now + (cap || 14000);
  for (var n = 0; n < 4000; n++) { var nx = null; TQ.forEach(function (t) { if (!t.rep && (nx === null || t.at < nx)) nx = t.at; }); if (nx === null || nx > end) break; pump(nx); }
}
setInterval(function () { var t = performance.now(), dt = Math.min(250, t - lastT); lastT = t; if (!INST) pump(now + dt); }, 16);
Clawd.T = { set: function (fn, ms) { return sched(fn, ms, false, true); }, clear: unsched };

/* ---------- small helpers ---------- */
function later(fn, ms) { return sched(fn, ms); }
function every(fn, ms) { return sched(fn, ms, true); }
function clear() { TQ = TQ.filter(function (t) { return t.sys; }); gen++; }
function anim(from, to, ms, fn, key) {
  var my = gen, tok = (ak[key] = (ak[key] || 0) + 1), a = performance.now();
  if (INST) { fn(to); return; }
  (function f() {
    if (my !== gen || ak[key] !== tok) return;
    var t = Math.min(1, (performance.now() - a) / ms), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    fn(from + (to - from) * e); if (t < 1) requestAnimationFrame(f);
  })();
}
function show(el) { el.classList.remove('hid'); }
function hide(el) { el.classList.add('hid'); }
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/* ---------- words the mascot can push aside ---------- */
function splitWords(h, plain) {
  var tmp = document.createElement('div'), i = 0; tmp.innerHTML = h.innerHTML; h.innerHTML = '';
  [].slice.call(tmp.childNodes).forEach(function (n) {
    var tag = n.nodeType === 1 ? n.tagName.toLowerCase() : null;
    n.textContent.split(/(\s+)/).forEach(function (w) {
      if (!w) return; if (/^\s+$/.test(w)) { h.appendChild(document.createTextNode(' ')); return; }
      var sp = document.createElement('span'); sp.className = 'w' + (plain ? ' pl' : ''); if (!plain) sp.style.transitionDelay = (i++ * 70) + 'ms';
      var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = w; sp.appendChild(wi);
      if (tag) { var e = document.createElement(tag); e.appendChild(sp); h.appendChild(e); } else h.appendChild(sp);
    });
  });
}
Q('.split').forEach(function (h) { splitWords(h, false); });
Q('.pw').forEach(function (h) { splitWords(h, true); });
function measure() {
  if (cur < 0) return;
  W = []; Q('.wi', slides[cur]).forEach(function (el) {
    var n = el.parentNode; if (!n.offsetParent) return;
    var x = 0, y = 0, w = n.offsetWidth, h = n.offsetHeight;
    while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    W.push({ el: el, cx: x + w / 2, cy: y + h / 2, s: '' });
  });
}
function pushWords() {
  if (!W.length) return;
  var on = L.visible, p = on ? L.pos() : null, mx = on ? p.x : 0, my = on ? p.y - L.u * 5.5 : 0, R = 120 + L.u * 9;
  for (var i = 0; i < W.length; i++) {
    var w = W[i], dx = w.cx - mx, dy = w.cy - my, d = Math.sqrt(dx * dx + dy * dy) || 1, s = '';
    if (on && d < R) { var k = 1 - d / R; k = k * k * 130; s = 'translate(' + (dx / d * k).toFixed(1) + 'px,' + (dy / d * k).toFixed(1) + 'px) rotate(' + (dx / d * k * .1).toFixed(1) + 'deg)'; }
    if (w.s !== s) { w.el.style.transform = s; w.s = s; }
  }
}

/* ---------- the cast ---------- */
var L = new Clawd(cast, { u: 20 }), S = [], pk = 0;
for (var si = 0; si < 6; si++) S.push(new Clawd(cast, { u: 8 }));
var M = new Clawd(cast, { u: 12, kind: 'mir' }); M.lines = ['Mir. I read the .md files, not the code.'];
function subsOff() { S.concat([M]).forEach(function (s) { s.reset(); s.hide(); s.tag(''); if (s !== M) s.lines = null; s.el.style.removeProperty('--bw'); }); }
function cond(k) { return k >= 900 ? 'dizzy' : k >= 650 ? 'tired' : 'idle'; }
function setPaper(b) { cast.classList.toggle('paper', b); $('hud').classList.toggle('paper', b); }
function al() { return (SC[ids[cur]] || {}).al; }

/* ---------- dialogue: one line per press ----------
   A step is 'text', ['text', mood, fn, align] for the lead, or
   {s: sprite, t: 'text', m: mood, f: fn, al: align} for a helper.
   fn runs as the line starts, so the action and the words land together. */
function sayStep(st) {
  var who = L, t, m, f, a;
  if (typeof st === 'string') t = st;
  else if (st.pop) { t = st[0]; m = st[1]; f = st[2]; a = st[3]; }
  else { who = st.s || L; t = st.t; m = st.m; f = st.f; a = st.al; }
  S.concat([M]).forEach(function (s) { if (s !== who) s.hush(); }); if (who !== L) L.hush();
  if (f) f(); if (m) who.mood(m);
  if (t) who.say(t, 1, a || (who === L ? (QA || al()) : undefined));
}
function P(steps, align) { steps = steps.pop ? steps : [steps]; QA = align || null; QD = steps.slice(1); sayStep(steps[0]); }
function hushAll() { L.hush(); M.hush(); S.forEach(function (s) { s.hush(); }); }
/* a sheet of paper thrown from one sprite to another */
function flyer(a, b) {
  if (INST) return;
  var f = document.createElement('i'); f.className = 'flyer';
  var pa = a.pos(), pb = b.pos();
  f.style.transform = 'translate(' + (pa.x - 23) + 'px,' + (pa.y - a.u * 9) + 'px)'; cast.appendChild(f); void f.offsetWidth;
  f.style.transform = 'translate(' + (pb.x - 23) + 'px,' + (pb.y - b.u * 9) + 'px) rotate(200deg)';
  setTimeout(function () { f.remove(); }, 720);
}

/* ---------- status line ---------- */
var ctxNow = 0, msgT = null, mode = 0;
var MODES = [['▸▸ accept edits on', 'Auto-accept: I edit without asking. I still never publish alone.'],
  ['⏸ plan mode on', 'Plan mode: I read and plan. I touch nothing until you approve.'],
  ['ask before edits', 'Default: I ask before I change a file.']];
function drawMode() { $('hmode').textContent = MODES[mode][0] + '  (shift+tab to cycle)'; }
drawMode();
function hmsg(t, warn, sticky) {
  var m = $('hmsg'); clearTimeout(msgT); m.textContent = t || ''; m.classList.toggle('warn', !!warn);
  if (t && !sticky) msgT = setTimeout(function () { m.textContent = ''; }, 4200);
}
function setCtx(k) {
  var was = L.base; ctxNow = k;
  $('hfill').style.width = Math.min(100, k / 10) + '%'; $('hnum').textContent = k >= 1000 ? '1M' : Math.round(k) + 'K';
  $('hud').classList.toggle('hot', k > 400);
  L.base = cond(k); if (L.el.dataset.mood === was) L.mood();
  if (k >= 900) hmsg('Context left until auto-compact: ' + Math.max(0, Math.round(100 - k / 10)) + '%', true, true);
  else if ($('hmsg').classList.contains('warn')) hmsg('');
}

/* ---------- dialogs, the way Claude Code asks ---------- */
var askS = null;
function ask(o) {
  var el = $('ask'); askS = o; el.style.left = o.x + 'px'; el.style.top = o.y + 'px'; el.style.width = o.w + 'px';
  el.innerHTML = '<div class="ah"></div><div class="ab"></div><div class="aq"></div><div class="ao"></div><div class="af">Press a number, or Enter for the highlighted answer</div>';
  el.children[0].textContent = o.head; el.children[2].textContent = o.q;
  if (o.body) el.children[1].textContent = o.body; else el.children[1].style.display = 'none';
  o.opts.forEach(function (op, i) {
    var b = document.createElement('button'); b.textContent = (i + 1) + '. ' + op[0];
    b.onclick = function (e) { e.stopPropagation(); pick(i); }; el.children[3].appendChild(b);
  });
  askSel(o.def || 0); el.classList.add('on');
}
function askSel(i) { askS.sel = i; Q('#ask button').forEach(function (b, k) { b.classList.toggle('sel', k === i); }); }
function askPick(i) { var o = askS; if (!o || !o.opts[i]) return; closeAsk(); if (o.opts[i][1]) o.opts[i][1](i); }
function pick(i) { if (askS && askS.opts[i]) act({ k: 'p', i: i }); }
function closeAsk() { askS = null; $('ask').classList.remove('on'); }

/* ---------- command line ---------- */
var cmdOn = false, cmdBuf = '', escT = 0;
var CMDS = [
  ['/clear', 'Start a fresh session', cmdClear],
  ['/compact', 'Summarise the conversation so far', function () {
    var k = Math.max(30, Math.round(ctxNow * .45)); setCtx(k); if (ids[cur] === 'rot') { rotV = k; cells(k); }
    L.squeeze(); P([['Squeezed! The gist survives.', 'happy'], 'Things only said in chat may not.', 'Rules in files always do.']);
  }],
  ['/context', 'What is filling the window', function () { P([Math.round(ctxNow) + 'K of 1M used.', ctxNow <= 400 ? 'Every rule still in view.' : 'Past the 400K line. Careful.']); }],
  ['/agents', 'Who is working', function () {
    var n = S.filter(function (s) { return s.visible; }).length;
    P(n ? [n + ' helper' + (n > 1 ? 's' : '') + ' working.', 'Each has its own memory.'] : ['No helpers right now. Just me.']);
  }],
  ['/rewind', 'Back to the last checkpoint', function () { restart(); hmsg('Rewound to the last checkpoint.'); }],
  ['/model', 'Who is thinking', function () { P(['Opus leads. Sonnet builds.', 'Haiku does the boring bits.']); }],
  ['/help', 'Keys for this deck', function () { $('help').classList.toggle('on'); }]
];
function openCmd(t, ghost) { cmdOn = true; cmdBuf = t || ''; $('cmd').classList.add('on'); drawCmd(ghost); }
function drawCmd(ghost) {
  $('cmdt').textContent = cmdBuf; $('cmdg').textContent = cmdBuf ? '' : (ghost || '');
  var sug = $('sug'); sug.innerHTML = '';
  if (cmdBuf && !promptS) CMDS.filter(function (c) { return c[0].indexOf(cmdBuf) === 0; }).forEach(function (c, i) {
    var d = document.createElement('div'); if (!i) d.className = 'sel'; d.innerHTML = '<b>' + c[0] + '</b><span>' + c[1] + '</span>'; sug.appendChild(d);
  });
}
function closeCmd() { cmdOn = false; $('cmd').classList.remove('on', 'pm'); }
function execCmd() {
  var t = cmdBuf.trim(), m = CMDS.filter(function (c) { return c[0] === t; });
  if (!m.length) { var p = CMDS.filter(function (c) { return t.length > 1 && c[0].indexOf(t) === 0; }); if (p.length === 1) m = p; }
  closeCmd(); if (!t) return;
  if (!m.length) { hmsg('Unknown command: ' + t); if (L.visible) P([['Unknown command: ' + t, 'confused']]); return; }
  if (m[0][0] === '/help' || m[0][0] === '/rewind') runCmd(m[0][0]); else act({ k: 'c', t: m[0][0] });
}
function runCmd(t) { var m = CMDS.filter(function (c) { return c[0] === t; })[0]; closeCmd(); if (m) { hmsg('> ' + t); m[2](); } }

/* ---------- a prompt Mir types himself ----------
   o.ghost is the suggested text. He can really type it and press Enter, or
   press the right arrow (the clicker) and it types itself. o.done(text) runs. */
var promptS = null;
function openPrompt(o) {
  promptS = o; cmdOn = true; cmdBuf = ''; $('cmd').classList.add('on', 'pm'); drawCmd(o.ghost);
  hmsg(o.hint || 'Mir: type it and press Enter (or press → and it types itself)', false, true);
}
function promptAuto() {
  var o = promptS, t = o.ghost, i = cmdBuf.length; if (o.auto) return; o.auto = 1; if (t.indexOf(cmdBuf) !== 0) { cmdBuf = ''; i = 0; }
  (function ty() { if (promptS !== o) return; cmdBuf = t.slice(0, ++i); drawCmd(); if (i < t.length) later(ty, 48); else later(submitPrompt, 380); })();
}
function submitPrompt() { if (promptS) act({ k: 't', t: cmdBuf.trim() || promptS.ghost }); }
function promptDone(t) { var o = promptS; promptS = null; closeCmd(); hmsg(''); if (o && o.done) o.done(t); }
function cmdClear() {
  var id = ids[cur];
  if (id === 'clear') { if (!cleared) { step = 4; rebirth(); } else P('Already fresh!'); return; }
  if (id === 'rot') { go(ids.indexOf('clear')); step = 4; later(rebirth, 900); return; }
  if (!L.visible) return;
  L.poof(function () { setCtx(30); L.reset(); L.spawn(L.x, L.y, function () { L.hold('handover'); P([['Fresh session!', 'fresh'], ['Handover read.', 'happy']]); }); });
}

/* ---------- scene engine ---------- */
function go(n) {
  n = Math.max(0, Math.min(slides.length - 1, n)); if (n === cur) return;
  var back = n < cur; clear(); closeAsk(); closeCmd(); promptS = null; step = 0; asides = 0; QD = []; QA = null; lastAct = Date.now();
  if (!REPLAY) HIST[ids[n]] = [];
  if (cur >= 0) {
    var old = slides[cur], osc = SC[old.id]; if (osc && osc.leave) osc.leave();
    old.classList.remove('on'); old.classList.add('out'); setTimeout(function () { old.classList.remove('out'); }, 820);
  }
  var s = slides[n], sc = SC[s.id] || {};
  if (back) { s.style.transition = 'none'; s.classList.add('back'); void s.offsetWidth; s.style.transition = ''; }
  s.classList.add('on'); s.classList.remove('back'); cur = n;
  history.replaceState(null, '', '#' + (n + 1));
  $('ntext').textContent = s.dataset.notes || ''; $('ntime').textContent = (n + 1) + '/' + slides.length + ' · target ' + (s.dataset.t || '');
  subsOff(); L.reset(); L.tag(''); L.el.style.zIndex = ''; hmsg('');
  if (sc.bw) L.el.style.setProperty('--bw', sc.bw + 'px'); else L.el.style.removeProperty('--bw');
  setPaper(s.classList.contains('paper')); $('hud').classList.toggle('on', sc.hud !== false);
  setCtx(sc.ctx || 0); L.mood();
  if (sc.lead === false) L.hide();
  else {
    var m = sc.lead; L.size(m[2] || 16);
    if (!L.visible) { L.at(m[0], m[1]); L.face(m[3] || 1); L.show(); } else L.go(m[0], m[1], { speed: 1800, face: m[3] || 1 });
  }
  if (sc.enter) sc.enter();
  if (sc.hello) later(function () { if (step === 0 && !QD.length) P(sc.hello); }, 1100);
  later(measure, 80); later(measure, 1000);
}
function beats() { return (SC[ids[cur]] || {}).beats || []; }
/* every input that moves a scene forward is an action: recorded live, replayed for the back arrow */
function doAct(a) {
  if (a.k === 'p') askPick(a.i);
  else if (a.k === 'c') runCmd(a.t);
  else if (a.k === 't') promptDone(a.t);
  else if (QD.length) sayStep(QD.shift());
  else { var b = beats(); if (step < b.length) { QA = null; b[step++](); } }
}
function act(a) { if (!REPLAY) (HIST[ids[cur]] = HIST[ids[cur]] || []).push(a); doAct(a); }
function next() {
  lastAct = Date.now();
  if (promptS) { promptAuto(); return; }
  if (askS) { pick(askS.sel); return; }
  if (!QD.length && step >= beats().length) { go(cur + 1); return; }
  act({ k: 'n' });
}
/* rebuild scene n by replaying a list of actions in one frame (null = play it to its end) */
function replay(n, acts) {
  INST = REPLAY = true; Clawd.instant = true; stage.classList.add('instant');
  if (cur >= 0) { var osc = SC[ids[cur]]; if (osc && osc.leave) osc.leave(); slides[cur].classList.remove('on', 'out'); }
  cur = -1; go(n); var cap = (SC[ids[n]] || {}).cap || 14000, list = [], g = 0; settle(cap);
  if (acts) acts.forEach(function (a) { doAct(a); settle(cap); list.push(a); });
  else while (g++ < 300) {
    var a = askS ? { k: 'p', i: askS.sel } : promptS ? { k: 't', t: promptS.ghost } : (QD.length || step < beats().length) ? { k: 'n' } : null;
    if (!a) break; doAct(a); settle(cap); list.push(a);
  }
  HIST[ids[n]] = list; INST = REPLAY = false; Clawd.instant = false; lastT = performance.now(); void stage.offsetWidth;
  requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.remove('instant'); measure(); }); });
}
/* one press back = one step back; at the top of a scene, the end of the one before */
function back() {
  lastAct = Date.now(); if (cur < 0) return;
  var h = HIST[ids[cur]] || [];
  if (h.length) replay(cur, h.slice(0, -1));
  else if (cur > 0) { var ph = HIST[ids[cur - 1]]; replay(cur - 1, ph && ph.length ? ph : null); }
}
function restart() { var c = cur; slides[c].classList.remove('on'); cur = -1; go(c); }

/* ================= 1 OPEN ================= */
var PROMPT = 'Make an interactive story about the journalists Bangladesh lost.', op = 'idle';
function opReady(instant) {
  if (op !== 'typing') return; op = 'ready';
  $('ptype').textContent = PROMPT; $('pcur').style.display = 'none'; $('hud').classList.add('on'); setCtx(12); L.size(20);
  if (instant) { L.at(960, 905); L.show(); } else L.spawn(960, 905, function () { P([['Hi! On it.', 'joy']]); });
}
SC.open = {
  ctx: 0, lead: false, hud: false,
  enter: function () {
    op = 'typing'; $('ptype').textContent = ''; $('pcur').style.display = '';
    ['comp', 'gen', 'slop', 'real', 'oshout', 'otitle'].forEach(function (id) { $(id).classList.remove('show', 'gone'); }); stage.classList.remove('quake');
    M.size(12).at(1740, 1008).face(-1).show().hold('none'); M.el.classList.add('typing');
    var i = 0; later(function tick() { if (op !== 'typing') return; $('ptype').textContent = PROMPT.slice(0, ++i); if (i < PROMPT.length) later(tick, 42); else later(function () { opReady(false); }, 500); }, 900);
  },
  beats: [
    function () {
      opReady(true); unsched(L._sp); L.show(); L.hush(); L.mood('happy'); op = 'slop'; M.el.classList.remove('typing');
      $('comp').classList.add('gone'); later(function () { $('gen').classList.add('show'); }, 350);
      L.go(2260, 990, { dur: .9 });
      later(function () {
        $('gen').classList.remove('show'); $('slop').classList.add('show'); setCtx(40);
        L.at(2260, 990); L.go(430, 990, { dur: 1.3, face: 1, then: function () { P([['Done!', 'joy'], ['One prompt. One page. Pretty good, right?', 'proud']], 'bl'); } });
      }, 2000);
    },
    function () {
      /* Mir screams. (He never does. He asked for it to be drawn this way.) */
      P([{ s: M, t: 'WHAT is this AI slop?!', m: 'angry', al: 'br shout', f: function () { M.hop(); L.mood('panic'); L.emote('!', 'red'); L.go(250, 990, { speed: 1500, keep: 1 }); } },
        { s: M, t: 'WHERE IS THE HOUSE STYLE?!', m: 'angry', al: 'br shout', f: function () { $('oshout').classList.add('show'); stage.classList.add('quake'); M.arms('up'); L.size(13); L.mood('panic'); L.shake(); } },
        ['Eep.', 'panic', function () { stage.classList.remove('quake'); }],
        ['For the record: he never shouts at me. He asked me to draw it this way.', 'wide', function () { $('oshout').classList.remove('show'); M.arms(); M.mood('smug'); L.size(20); }],
        ['He has a point, though. I had no rules. So you got the average of the internet.', 'sad', function () { M.mood(); }]], 'bl');
    },
    function () { P([['Ooh. House rules!', 'joy', function () { L.wear('fedora'); L.chip('Skill(daily-star-story)'); setCtx(60); M.mood('happy'); }], ['Logo top-left. One accent. Real phones.', 'happy'], ['Let me try that again. Watch!', 'joy']], 'bl'); },
    function () {
      hushAll(); L.mood('happy'); $('oshout').classList.remove('show'); stage.classList.remove('quake');
      L.go(-280, 990, { dur: .45, then: function () {
        L.at(-280, 990); $('real').classList.add('show');
        L.go(2200, 990, { dur: 1.45, then: function () { L.go(1420, 1000, { dur: .5, face: -1, then: function () { P([['THAT is us.', 'joy'], { s: M, t: 'That is us.', m: 'happy', al: 'br' }, ['Same me. New rules.', 'proud']], 'bl'); } }); } });
      } });
      later(function () { $('otitle').classList.add('show'); }, 2000);
    }
  ]
};

/* ================= 2 UNDER ================= */
(function () { var src = $('codesrc').textContent.replace(/^\n/, ''); $('codepre').textContent = src + '\n' + src; })();
SC.under = {
  ctx: 80, lead: [1530, 1012, 18], al: 'br', hello: ['Want to see a secret?'],
  enter: function () {
    $('upage').classList.remove('open', 'away'); $('codewall').classList.remove('run'); $('fan').classList.remove('show');
    hide($('ucount')); Q('#urows li').forEach(hide); hide($('usmall')); $('un').textContent = '0';
  },
  beats: [
    function () {
      P([['Underneath: code.', 'happy', function () {
        L.hop(); L.arms('up'); later(function () { L.arms(); }, 800); $('upage').classList.add('open'); $('codewall').classList.add('run'); show($('ucount'));
        anim(0, 3465, 1700, function (v) { $('un').textContent = Math.round(v).toLocaleString('en-US'); }, 'un');
      }], ['3,465 lines of it.', 'proud'], ['I wrote them. And I checked them.', 'proud']]);
    },
    function () {
      P([['Nobody here has to read it.', 'happy', function () { Q('#urows li').forEach(function (li, i) { later(function () { show(li); }, i * 160); }); later(function () { show($('usmall')); }, 520); }], ['Not one line!', 'joy']]);
    },
    function () {
      P([['A map. A wall of faces.', 'happy', function () { $('upage').classList.remove('open'); $('upage').classList.add('away'); later(function () { $('fan').classList.add('show'); }, 300); }],
        ['A river that moves.', 'happy'], ['Describe it. I build it.', 'joy']]);
    }
  ]
};

/* ================= 3 HARNESS ================= */
var tools = [
  ['Files', 'Reads and edits the whole project: story text, data, styles, scripts. No copy-paste.', 'Read(source/story.md)', 'folder', [['Files!', 'joy'], ['I read the story myself.', 'happy']]],
  ['Terminal', 'Runs the build, the checks, the image conversion. It sees the real errors, not your description of them.', 'Bash(python tools/build.py)', 'none', [['A terminal!', 'joy'], ['I run it. I see the errors.', 'happy']]],
  ['Browser', 'Opens the page in real Chrome at phone and desktop sizes. Takes screenshots. Measures speed.', 'Browser(390 x 844)', 'lens', [['A browser!', 'joy'], ['I look. Like a reader.', 'happy']]],
  ['CLAUDE.md', 'Rules it reads before every session: house style, hard rules, past decisions.', 'Read(CLAUDE.md)', 'paper', [['The rules.', 'think'], ['Read before every session.', 'happy']]],
  ['Skills', 'Packaged expertise it loads only when needed, like our Daily Star Visual Story Skill.', 'Skill(daily-star-story)', 'paper', [['My Daily Star hat!', 'joy'], ['House style: on.', 'proud']]],
  ['Sub-agents', 'Fresh helpers with their own memory. They do the noisy work and report back.', 'Agent(qa-sweep)', 'paper', [['Helpers!', 'joy'], ['They take the noisy work.', 'happy']]]];
(function () {
  var h = $('harness-ring'), svg = $('hsvg'), NS = 'http://www.w3.org/2000/svg', cx = 450, cy = 360;
  tools.forEach(function (t, i) {
    var a = -Math.PI / 2 + i * Math.PI * 2 / 6, x = cx + Math.cos(a) * 330, y = cy + Math.sin(a) * 285, d = 'M' + x + ',' + y + ' L' + cx + ',' + cy;
    var l = document.createElementNS(NS, 'path'); l.setAttribute('d', d); l.id = 'hp' + i; svg.appendChild(l);
    var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '7'); c.setAttribute('fill', '#D97757'); c.id = 'hc' + i;
    var m = document.createElementNS(NS, 'animateMotion'); m.setAttribute('dur', '1.4s'); m.setAttribute('repeatCount', 'indefinite'); m.setAttribute('path', d); c.appendChild(m); svg.appendChild(c);
    var b = document.createElement('button'); b.className = 'tool'; b.id = 'ht' + i; b.style.left = x + 'px'; b.style.top = y + 'px'; b.textContent = t[0];
    b.onclick = function () { QD = []; lightTool(i); }; h.appendChild(b);
  });
})();
function lightTool(i) {
  tools.forEach(function (_, k) { var on = k <= i; $('ht' + k).classList.toggle('lit', on); $('ht' + k).classList.toggle('cur', k === i); $('hp' + k).classList.toggle('lit', on); $('hc' + k).classList.toggle('lit', on); });
  $('th').textContent = tools[i][0]; $('tp').textContent = tools[i][1]; $('tcode').textContent = '● ' + tools[i][2];
  L.hold(tools[i][3]); L.wear(i >= 4 ? 'fedora' : ''); L.chip(tools[i][2]); P(tools[i][4]);
  if (i >= 5) { if (!S[0].visible) { S[0].size(6).spawn(385, 742, function () { S[0].mood('joy'); }); S[1].size(6).spawn(815, 742, function () { S[1].mood('joy'); }); } } else { S[0].hide(); S[1].hide(); }
}
SC.tools = {
  ctx: 150, lead: [600, 742, 16], bw: 372, hello: [['So what is IN a harness?', 'think'], ['Six things. Watch.', 'happy']],
  enter: function () {
    tools.forEach(function (_, k) { ['ht', 'hp', 'hc'].forEach(function (p) { $(p + k).classList.remove('lit', 'cur'); }); });
    $('th').textContent = 'Six tools'; $('tp').textContent = 'Each one is something the AI can now do itself, instead of asking you to do it for it.'; $('tcode').textContent = '';
    hide($('makers')); hide($('mnote'));
  },
  beats: tools.map(function (_, i) { return function () { lightTool(i); }; }).concat([function () {
    $('ht5').classList.remove('cur'); P([['Three makers.', 'happy', function () { show($('makers')); later(function () { show($('mnote')); }, 400); }], ['Same idea.', 'proud']]);
  }])
};

/* ================= 4 LOOP ================= */
var SIZES = ['320x480', '390x844', '768x1024', '1366x625', '1920x1080'];
function sweep(bad) { SIZES.forEach(function (z, i) { later(function () { L.chip((bad && i % 2 === 0 ? 'FAIL ' : 'ok ') + z); }, 300 + i * 330); }); }
function failN(n) { return function () { $('lfail').textContent = n; $('lfail').style.color = n === '0' ? 'var(--ok)' : 'var(--acc)'; if (n === '15') L.shake(); }; }
var lsteps = [
  [0, 'o', 'Plan', 'Make the hero fit the first screen on every device.', [['First, a plan.', 'think'], ['Goal: the hero fits every screen.', 'happy']], 'notebook'],
  [1, '', 'Edit(css/story.css)', 'Hero sized by screen height.', [['I open the real file.', 'happy'], ['Hero height: tied to the screen.', 'happy']], 'none'],
  [2, 'r', 'Bash(sweep 39 screen sizes)', '<span class="bad">15 FAIL</span>', [['Now I test it myself. 39 screens…', 'think', function () { sweep(true); }], ['15 FAIL?!', 'panic', failN('15')]], 'none'],
  [3, '', 'Read(screenshots)', 'Laptops: title under the logo. Phones: dek cut off.', [['I open the screenshots.', 'think'], ['Title under the logo. Dek cut off.', 'wide'], ['Found it.', 'happy']], 'lens'],
  [4, '', 'Edit(css/story.css)', 'Fallback for older phones. Padding scales with height.', [['Fixing. Not guessing.', 'boss'], ['A fallback for old phones.', 'happy']], 'none'],
  [2, 'g', 'Bash(sweep 53 sizes, 320x480 to 3840x2160)', '<span class="ok">0 FAIL</span>', [['Test again. 53 sizes now.', 'think', function () { sweep(false); }], ['ZERO fail!', 'joy', failN('0')]], 'none'],
  [3, 'g', 'Read(screenshots)', 'No overflow. Title clear of the logo.', [['I look again. To be sure.', 'think'], ['Clean.', 'proud']], 'lens'],
  [0, 'o', 'Report', 'Done, and what was not re-run. <span class="ok">Not published.</span>', [['I write what I did.', 'happy'], ['And what I did NOT re-run.', 'happy'], ['Not published.', 'proud']], 'report']];
var lnames = ['Plan', 'Act', 'Run checks', 'Inspect', 'Fix'], lal = ['bl', 'br', 'br', 'bl', 'bl'], LC = 1603;
var lsay = ['I plan before I touch a file.', 'I edit the real files.', 'I run the checks myself.', 'I look at screenshots. Not at my own claim.', 'I fix what failed. Then I check again.'];
function stn(i) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5; return [490 + Math.cos(a) * 255, 675 + Math.sin(a) * 255 + 77]; }
(function () {
  var B = $('loopbox'); lnames.forEach(function (n, i) {
    var a = -Math.PI / 2 + i * Math.PI * 2 / 5, d = document.createElement('div'); d.className = 'ln'; d.id = 'ln' + i; d.dataset.say = lsay[i];
    d.style.left = (350 + Math.cos(a) * 146) + 'px'; d.style.top = (350 + Math.sin(a) * 146) + 'px'; d.innerHTML = '<i></i><span>' + n + '</span>'; B.appendChild(d);
  });
})();
function logLine(cls, tool, res) {
  var d = document.createElement('div'); d.className = cls; d.innerHTML = '<span class="t">' + esc(tool) + '</span><small>└ ' + res + '</small>';
  $('log').appendChild(d); if (INST) d.classList.add('show'); else requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('show'); }); });
}
SC.loop = {
  ctx: 180, lead: [490, 497, 14], al: 'bl', hello: ['Ready. Watch me work.'],
  enter: function () {
    $('log').innerHTML = ''; $('loopArc').setAttribute('stroke-dasharray', '0 ' + LC); $('lfail').textContent = '?'; $('lfail').style.color = '';
    lnames.forEach(function (_, i) { $('ln' + i).classList.remove('on'); }); hide($('hardrule'));
  },
  beats: lsteps.map(function (s, k) {
    return function () {
      lnames.forEach(function (_, i) { $('ln' + i).classList.toggle('on', i === s[0]); });
      $('loopArc').setAttribute('stroke-dasharray', (LC * (k + 1) / lsteps.length) + ' ' + LC);
      logLine(s[1], s[2], s[3]); setCtx(180 + k * 8);
      var p = stn(s[0]); L.hush(); L.hold(); L.mood('happy');
      L.go(p[0], p[1], { speed: 1100, then: function () { L.hold(s[5]); L.chip(s[2]); P(s[4], lal[s[0]]); } });
    };
  }).concat([function () {
    L.hold('report');
    P([{ s: M, t: 'Looks good. Push it. Do it yourself.', m: 'happy', al: 'br', f: function () { M.size(12).at(2100, 1012).face(-1).show(); M.go(1650, 1012, { dur: .7, face: -1 }); } },
      ['On it! One small thing first…', 'happy', function () {
      ask({
        x: 930, y: 470, w: 810, head: 'Bash command', body: '  git push origin main\n  Publish the story to the live site', q: 'Do you want to proceed?', def: 2,
        opts: [
          ['Yes', function () { logLine('g', 'Bash(git push origin main)', 'Published, because you said yes.'); P([['Published!', 'joy'], ['Only because you said yes.', 'happy']]); }],
          ["Yes, and don't ask again for git push", function () { logLine('o', 'Rule', 'One yes covers one push.'); P([['Nope.', 'boss'], ["Mir's rule: I ask every time.", 'boss']]); }],
          ['No, and tell Claude what to do differently', function () { logLine('', 'Bash(git push origin main)', 'Not run.'); P([['Not published.', 'happy'], ['Your call. Every time.', 'proud']]); }]]
      });
    }]]);
  }, function () {
    /* told to do it itself, it still asks: the rule is Mir's own */
    P([{ s: M, t: 'I SAID do it yourself!', m: 'angry', al: 'br shout', f: function () { M.hop(); L.mood('wide'); } },
      ['“Never deploy or push without asking.”', 'proud', function () { show($('hardrule')); L.hold('paper'); }],
      ['Your hard rule, boss.', 'proud'],
      { s: M, t: '…I did write that.', m: 'tired', al: 'br' },
      ['One yes covers one push. Every single time.', 'happy', function () { M.mood(); }]], 'bl below');
  }])
};

/* ================= 5 TEAM ================= */
var tasks = [
  ['lh', 'Convert 40 photos to WebP, 3 sizes', 'Haiku'], ['ls', 'Build the step-synced erosion chart', 'Sonnet'],
  ['lo', 'Design the signature satellite map', 'Opus'], ['lh', "Apply the desk's copy edits", 'Haiku'],
  ['ls', 'Run QA at 320 / 390 / 1440 + speed', 'Sonnet'], ['ls', 'Grade the page as a fresh evaluator', 'Sonnet'],
  ['ls', 'Fix scroll jank on old Android', 'Sonnet']];
tasks.forEach(function (t) { var li = document.createElement('li'); li.dataset.m = t[2]; li.innerHTML = '<span>' + t[1] + '</span><b>' + t[2] + '</b>'; $('planl').appendChild(li); });
function fly(card, from) {
  var fb = from.getBoundingClientRect(), cb = card.getBoundingClientRect(), sc = stage.getBoundingClientRect().width / 1920;
  var dx = (fb.left + fb.width / 2 - (cb.left + cb.width / 2)) / sc, dy = (fb.top + fb.height / 2 - (cb.top + cb.height / 2)) / sc;
  card.style.transition = 'none'; card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.5)'; card.style.opacity = '0'; void card.offsetWidth;
  card.style.transition = ''; card.style.transform = ''; card.style.opacity = '1';
}
function deal(i) {
  var t = tasks[i], c = document.createElement('div'); c.className = 'card'; if (i === 6) c.id = 'jank';
  c.innerHTML = '<b>' + t[1] + '</b>'; $(t[0]).appendChild(c); fly(c, Q('#planl li')[i]); Q('#planl li')[i].classList.add('sent');
}
function crew() {
  if (S[0].visible || $('plan').classList.contains('okd')) return;
  $('plan').classList.add('okd'); S[0].size(6).spawn(1116, 446); S[1].size(8).spawn(1327, 446); S[2].size(8).spawn(1467, 446);
  S[0].lines = ['Haiku. Boring bits, done fast.']; S[1].lines = S[2].lines = ['Sonnet. I build and I check.'];
}
function approve() { P([['Helpers! Line up!', 'boss', crew], { s: S[1], t: 'Ready!', m: 'joy' }]); }
SC.team = {
  ctx: 250, lead: [850, 1005, 15], bw: 420, hello: ['Big job. I need help.'],
  enter: function () {
    Q('.card').forEach(function (c) { c.remove(); }); Q('#planl li').forEach(function (l) { l.classList.remove('show', 'sent'); }); $('plan').classList.remove('okd'); hide($('tcap'));
  },
  beats: [
    function () {
      P([['Plan first.', 'think', function () { Q('#planl li').forEach(function (l, i) { later(function () { l.classList.add('show'); }, i * 110); }); }],
        ['Nothing is touched yet.', 'happy', function () {
          ask({ x: 170, y: 660, w: 450, head: 'Ready to build?', q: 'Seven tasks, a model for each.', def: 0, opts: [['Yes, go', approve],
            ['No, keep planning', function () { step = 0; P([['Still planning. Nothing touched.', 'think']]); }]] });
        }]]);
    },
    function () { crew(); P([['You: the boring bits. Go!', 'boss', function () { deal(0); later(function () { deal(3); }, 250); }], { s: S[0], t: 'On it!', m: 'joy' }]); },
    function () { S[0].mood(); P([['You two: build it. Then test it!', 'boss', function () { [1, 4, 5, 6].forEach(function (i, k) { later(function () { deal(i); }, k * 220); }); }], { s: S[2], t: 'Yes boss!', m: 'joy', al: 'br' }]); },
    function () { hushAll(); S[2].mood(); deal(2); L.mood('happy'); L.go(1680, 446, { speed: 1400, then: function () { L.hold('card'); P([['The design call?', 'think'], ['Mine.', 'proud']], 'br'); } }); },
    function () {
      P([['Now they work.', 'think', function () {
        S[0].bar(0); S[1].bar(0); S[2].bar(0);
        later(function () { S[0].bar(58); S[1].bar(81); S[2].bar(73); S[0].chip('Bash(img.py)'); S[1].chip('Edit(js/main.js)'); S[2].chip('Bash(scenes.py)'); }, 60);
        later(function () { S[1].chip('Bash(lint.py)'); S[2].chip('Bash(perf.py)'); }, 800);
      }], ['My memory stays clean.', 'happy'],
      ['Three reports!', 'joy', function () { [S[0], S[1], S[2]].forEach(function (s, i) { later(function () { flyer(s, L); s.hop(); }, i * 180); }); later(function () { L.hold('notebook'); }, 800); show($('tcap')); setCtx(262); }],
      ['25 lines each. Lovely.', 'happy']], 'br');
    },
    function () {
      var j = $('jank'); if (!j) return;
      P([{ s: S[2], t: 'Two tries. Still janky…', m: 'sad', al: 'br', f: function () { j.classList.add('gone'); S[2].shake(); } },
        ['Hand it up.', 'boss', function () { var c = document.createElement('div'); c.className = 'card esc'; c.innerHTML = '<b>Fix scroll jank on old Android</b>'; $('lo').appendChild(c); fly(c, j); L.hold(); }],
        ['Escalation is earned.', 'proud']], 'br');
    }
  ]
};

/* ================= 6 REVIEW ================= */
(function () { var d = $('dots'); for (var i = 0; i < 26; i++) d.appendChild(document.createElement('i')); })();
var failIdx = [3, 8, 12, 17, 21, 24], panic = false;
function runDots() {
  var held = 0, bad = 0;
  Q('#dots i').forEach(function (el, i) { later(function () { var f = failIdx.indexOf(i) > -1; el.className = f ? 'fail' : 'held'; if (f) bad++; else held++; $('rvc').innerHTML = held + ' held · <span class="bad">' + bad + ' failed or partly</span>'; }, 500 + i * 80); });
}
SC.review = {
  ctx: 300, lead: [585, 850, 16, -1], al: 'br', bw: 540, hello: ['Homework time.'],
  enter: function () {
    panic = false; Q('#dots i').forEach(function (i) { i.className = ''; }); $('rvc').textContent = '26 claims to check'; $('stamp').classList.remove('show'); hide($('claim')); hide($('rvline')); Q('#finds li').forEach(hide);
    S[1].size(9).at(290, 745).face(1).show().tag('The builder'); S[0].size(6).at(190, 996).show(); S[3].size(6).at(420, 1000).show();
    S[1].lines = ['I built it. I am sure it works.']; S[0].lines = S[3].lines = ['I only did what the card said.'];
  },
  beats: [
    function () {
      P([{ s: S[1], t: 'All done, boss!', m: 'joy', al: 'bl', f: function () { show($('claim')); } }, ['Show me the screenshot.', 'think'],
        { s: S[1], t: 'The tests pass!', m: 'joy', al: 'bl' }, ['The screenshot.', 'stern'], { s: S[1], t: '…it works on MY screen.', m: 'wide', al: 'bl' }]);
    },
    function () {
      S[1].mood('wide');
      P([['Hmm.', 'think'], ["This ain't right.", 'stern'], ['Boss is NOT happy!', 'boss', function () {
        $('stamp').classList.add('show'); L.shake(); panic = true; S[1].mood('panic'); S[0].mood('panic'); S[3].mood('panic'); S[1].emote('!', 'red');
        var home = [[S[0], 190, 996], [S[3], 420, 1000]];
        every(function () { if (!panic) return; home.forEach(function (h) { h[0].go(h[1] + (Math.random() * 150 - 75), h[2], { speed: 560 }); }); }, 560);
      }], { s: S[0], t: 'Re-checking! Re-checking!', m: 'panic', al: 'bl' }]);
    },
    function () {
      P([['Get me fresh eyes.', 'boss', function () { panic = false; [S[0], S[1], S[3]].forEach(function (s) { s.mood('wide'); }); S[0].go(190, 996); S[3].go(420, 1000); }],
        ['Someone who was not here.', 'stern', function () { S[2].size(9).wear('glasses').tag('Fresh reviewer').spawn(1690, 452, function () { S[2].face(-1); }); S[2].lines = ['I check claims against files. Nothing else.']; }],
        { s: S[2], t: 'Fresh eyes. Files, please.', al: 'br below', f: runDots }]);
    },
    function () { P([['A rule that fights the code!', 'wide', function () { show(Q('#finds li')[0]); L.emote('!', 'red'); }]]); },
    function () { P([['Budgets our best stories fail.', 'sad', function () { show(Q('#finds li')[1]); L.emote('!', 'red'); }]]); },
    function () { P([['And nobody saw the memory cost.', 'sad', function () { show(Q('#finds li')[2]); L.emote('!', 'red'); }]]); },
    function () { P([['A report is a claim.', 'proud', function () { show($('rvline')); [S[0], S[3]].forEach(function (s) { s.mood(); }); }], ['Fix the six.', 'boss'], { s: S[1], t: 'On it…', m: 'sad', al: 'bl' }]); }
  ]
};

/* ================= 7 FIRED ================= */
var noise = ['$ build.py . --keep img/share-*', '  copied 214 files', '$ lint.py dist', '  WARN --hh inside @supports', '$ scenes.py 320 390 1440', '  shot 01-hero-320.png', '  shot 02-summary-320.png', '  shot 03-number-320.png', '  … 41 more screenshots', '$ perf.py --runs 5', '  run 1 LCP 0.86s CLS 0', '  run 2 LCP 0.85s CLS 0', '  trace 4.1 MB …', '  long task 63ms main.js:211', '  … stack trace (180 lines)', '  retry 2 of 3 …', '  DOM dump (1,200 nodes)', '  … 900 more lines', '$ scenes.py 568 264', '  shot 44-landscape.png', '  diff 3 px at 1366', '  … 600 more lines'];
function stream() {
  noise.forEach(function (n, i) { later(function () {
    var d = document.createElement('div'); d.textContent = n; $('wb').appendChild(d); var p = Math.min(97, 6 + i * 4.4); $('wg').style.width = p + '%'; $('wst').textContent = Math.round(p) + '% full';
    if (i === 12) $('win').classList.add('full');
    if (i === noise.length - 1) S[1].lines = ['My context is full. Replace me.'];
  }, i * 150); });
  S[1].bar(97);
}
SC.fired = {
  ctx: 330, lead: [230, 835, 16], al: 'bl', bw: 440, hello: ['This helper has one job.'],
  enter: function () {
    $('wb').innerHTML = ''; $('wg').style.width = '4%'; $('wst').textContent = 'fresh'; $('win').classList.remove('full'); hide($('note25')); hide($('saq'));
    S[1].size(10).at(650, 835).face(1).show().tag('Sonnet helper').bar(4); S[1].lines = ['One job. My own memory.'];
  },
  beats: [
    function () {
      P([{ s: S[1], t: 'Checking everything!', m: 'joy', al: 'bl', f: stream }, ['Watch its memory fill.', 'think'],
        { s: S[1], t: 'So… many… logs…', m: 'yawn', al: 'bl' }, { s: S[1], t: 'Screenshot 41… or 14?', m: 'dizzy', al: 'bl' }, { s: S[1], t: 'Who am I checking for?', m: 'confused', al: 'bl' }]);
    },
    function () {
      hushAll();
      L.go(410, 835, { then: function () {
        P([["Hey. You're full.", 'sad'], ['Leave your notes.', 'boss'], ['Contract over.', 'boss'], { s: S[1], t: 'But I…', m: 'panic', al: 'bl' },
          ['Nothing personal.', 'sad', function () {
            flyer(S[1], L); S[1].poof(); S[1].tag(''); S[1].bar(null); L.hold('report'); show($('note25'));
            $('wb').innerHTML = ''; $('wg').style.width = '0'; $('wst').textContent = 'closed'; $('win').classList.remove('full');
          }]]);
      } });
    },
    function () {
      L.mood('happy');
      P([{ s: S[1], t: "Hi! I'm new!", al: 'bl', f: function () {
        S[1].reset(); S[1].lines = ['Fresh. I only know what the notes say.']; S[1].tag('New helper').bar(4); S[1].spawn(650, 835, function () { S[1].mood('fresh'); });
        $('wst').textContent = 'fresh · 4%'; $('wg').style.width = '4%'; $('wb').innerHTML = ''; L.go(230, 835, { face: 1 });
      } },
      { s: S[1], t: 'Notes read. Carrying on!', m: 'joy', al: 'bl', f: function () {
        flyer(L, S[1]); L.hold(); later(function () { S[1].hold('report'); }, 700);
        $('wb').innerHTML = '<div class="hi">● Read(report.md)</div><div>  └ 25 lines</div><div class="hi">● Bash(scenes.py --resume)</div><div>  └ carrying on from the notes</div>';
      } },
      ['Fresh memory. Same notes.', 'proud', function () { show($('saq')); }]]);
    }
  ]
};

/* ================= 8 ROT ================= */
(function () { var c = $('cells'); for (var i = 0; i < 100; i++) { var e = document.createElement('i'); if (i === 39) e.className = 'line'; c.appendChild(e); } })();
var rotV = 0;
function cells(v) {
  var n = Math.round(v / 10); Q('#cells i').forEach(function (e, i) { e.classList.toggle('f', i < n); e.classList.toggle('h', i < n && i >= 40); });
  $('ctxn').textContent = v >= 999 ? '1M' : Math.round(v) + 'K';
}
function ctxTo(v, label, red) { anim(rotV, v, 1300, function (x) { rotV = x; cells(x); }, 'rot'); setCtx(v); $('ctxs').textContent = label; $('ctxs').style.color = red ? 'var(--acc)' : ''; }
function drop(list) { var li = Q('#rules li'); list.forEach(function (i, k) { later(function () { li[i].classList.add('fall'); }, k * 260); }); }
function glitch() {
  var gl = Q('#rot h2 .wi, #rot .human .wi');
  every(function () {
    var el = gl[Math.floor(Math.random() * gl.length)]; if (!el || el.dataset.o) return; el.dataset.o = el.textContent;
    var a = el.textContent.split(''); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } el.textContent = a.join('');
    later(function () { if (el.dataset.o) { el.textContent = el.dataset.o; delete el.dataset.o; } }, 700);
  }, 420);
}
function unglitch() { Q('.wi[data-o]').forEach(function (el) { el.textContent = el.dataset.o; delete el.dataset.o; }); }
SC.rot = {
  ctx: 350, lead: [1450, 1005, 18, -1],
  enter: function () {
    rotV = 0; cells(0); $('ctxs').textContent = ''; Q('#rules li').forEach(function (l) { l.classList.remove('fall', 'hang'); }); unglitch();
    later(function () {
      if (step === 0 && !QD.length) P([['First: what is “context”?', 'think'], ['Everything I have read today. Your messages. The files. My own work.', 'happy'],
        ['It is counted in tokens. A token is about three-quarters of a word.', 'happy'], ['350K already?', 'wide', function () { ctxTo(350, 'This session so far: busy, still holding'); }], ['Busy day.', 'happy']]);
    }, 500);
  },
  leave: unglitch,
  beats: [
    function () { P([['400K.', 'think', function () { ctxTo(400, 'My line: a fresh session starts here', true); }], ['This is where Mir stops me.', 'happy']]); },
    function () { P([['*yawn*', 'yawn', function () { ctxTo(700, 'Slipping: early rules get missed', true); drop([0, 2, 5, 3]); }], ['What was rule one again?', 'tired'], ['The logo goes… bottom-right?', 'confused']]); },
    function () {
      P([['Who am I?', 'confused', function () { ctxTo(1000, 'Fatal: a missed rule is a broken page', true); drop([1, 4, 6]); later(function () { Q('#rules li')[7].classList.add('hang'); }, 900); glitch(); }],
        ['Who are YOU?', 'dizzy'], ['Is today the 31st of November?', 'confused'], ['We publish without asking… right?', 'dizzy']]);
    }
  ]
};

/* ================= 9 CLEAR ================= */
var mem = [
  ['<span class="h"># Global: how I work everywhere</span>\n- Audience: phones, often old, on\n  Bangladeshi networks. Test to 320 px.\n- Nothing loaded from outside servers.\n- Data only from the reporting.\n  Never invent figures or quotes.\n- Agree the plan before code.\n- <span class="r">Never publish without asking.</span>', [['Read first. Every session.', 'happy']]],
  ['<span class="h"># Journalists killed, 1972-2026\n## Rules for this story</span>\n- <span class="r">Never say all 61 were "killed for\n  their journalism"</span>; only where\n  CPJ/RSF/police say so.\n- Suspects named only when charged,\n  arrested or tried. Always attributed.\n- Red = no one convicted.\n  Ink = a court convicted someone.', [["This story's rules.", 'happy'], ['I follow them. Every time.', 'proud']]],
  ['<span class="h">## Approved departures\n   (Mir; do not undo)</span>\n- No hero byline.\n- Share images without headline or logo.\n- Silhouettes for missing portraits.\n- Map cards may cover the map.', [['Settled.', 'happy'], ['I will not reopen them.', 'proud']]],
  ['<span class="r"># >>> RESUME HERE (2 November 2026,\n#     round 7c built and pushed)</span>\nState: round 7c built.\n<span class="h">## Approved departures (do not undo)\n## QA: what ran, what did not\n## Open\n## Next</span>', [['My map.', 'happy'], ['First read after the rules.', 'happy']]]];
var GARBLE = '# RESUME HERE (31 November 2026)\n\nState: round 7… or 9? built.\nOpen:  the thing with the logo.\n       it was important.\nNext:  ask Mir.\n       who is Mir?';
var cleared = false, tyI = null;
function pickMem(i, quiet) {
  Q('.layer').forEach(function (l, k) { l.classList.toggle('on', k === i); }); $('excerpt').innerHTML = mem[i][0];
  if (!quiet && L.visible) { L.hop(); P(mem[i][1], 'bl'); }
}
Q('.layer').forEach(function (l, i) { l.onclick = function () { if (cleared) pickMem(i); }; });
function rebirth() {
  if (cleared) return; cleared = true; QD = []; closeCmd(); hmsg(''); unsched(tyI); $('memnote').textContent = '';
  L.mood('tired'); L.say('See you on the other si', 1);
  later(function () {
    var w = $('wipe'); w.className = ''; void w.offsetWidth; w.className = 'go'; L.hush(); L.poof();
    later(function () {
      $('clear').classList.add('fresh'); setPaper(true); setCtx(30); L.reset(); L.size(18); w.className = 'go fade'; pickMem(3, true); measure();
      L.spawn(1010, 1012, function () {
        P([['Hello! I am new here.', 'fresh', function () { L.chip('Read(CLAUDE.md)'); later(function () { L.chip('Read(HANDOVER.md)'); L.hold('handover'); }, 600); }],
          ['RESUME HERE. Got it.', 'happy'], ['Round 7c built and pushed.', 'happy'], ['I know exactly where we are!', 'joy']], 'bl');
      });
    }, 740);
    later(function () { w.className = ''; }, 1700);
  }, 900);
}
SC.clear = {
  ctx: 1000, lead: [520, 925, 16], hello: [['I should… write this down.', 'confused']],
  enter: function () { cleared = false; $('clear').classList.remove('fresh'); $('wipe').className = ''; $('excerpt').innerHTML = ''; $('memnote').textContent = ''; Q('.layer').forEach(function (l) { l.classList.remove('on'); }); },
  leave: function () { unsched(tyI); },
  beats: [
    function () {
      P([['Must… write it down…', 'dizzy', function () {
        var i = 0; unsched(tyI); tyI = every(function () { i += 2; $('excerpt').textContent = GARBLE.slice(0, i); if (i >= GARBLE.length) unsched(tyI); }, 30);
        L.hold('paper'); $('memnote').textContent = 'A tired agent writes a bad handover.';
      }], ['Is this right?', 'confused']]);
    },
    function () { P([["That's the real one.", 'tired', function () { unsched(tyI); $('excerpt').innerHTML = mem[3][0]; $('memnote').textContent = 'The real one: written before 400K, while it still remembers.'; }], ['Written at 400K. Not now.', 'tired']]); },
    function () { P([['Type /clear.', 'tired', function () { openCmd('', '/clear'); hmsg('Type /clear and press Enter', false, true); }], ["Go on. I'll be fine.", 'happy']]); },
    function () {
      if (cleared) { pickMem(0); step = 5; return; }
      var t = '/clear', i = 0; openCmd(''); (function ty() { cmdBuf = t.slice(0, ++i); drawCmd(); if (i < t.length) later(ty, 110); else later(rebirth, 450); })();
    },
    function () { if (!cleared) rebirth(); else pickMem(0); },
    function () { pickMem(1); },
    function () { pickMem(2); }
  ]
};

/* ================= 10 LABS ================= */
var labsay = [["Tools, in a loop. That's me!", 'joy'], ['A lead and helpers. Familiar?', 'happy'], ['Context is finite. Told you.', 'proud'], ['No memory? Leave notes.', 'happy']];
SC.labs = {
  ctx: 45, lead: [1560, 1012, 15, -1], al: 'br', hello: ['I have receipts.'],
  enter: function () { Q('#labs .pin').forEach(hide); hide($('labline')); },
  beats: [0, 1, 2, 3].map(function (i) {
    return function () { L.hush(); L.mood('happy'); L.go(i % 2 ? 1375 : 545, 1012, { speed: 1600, then: function () { L.arms('up'); L.hop(); show(Q('#labs .pin')[i]); later(function () { L.arms(); }, 600); P([labsay[i]], ' '); } }); };
  }).concat([function () { L.hush(); show($('labline')); L.go(1560, 1012, { face: -1, then: function () { P([['Not a trick.', 'proud'], ["It's the craft.", 'joy']], 'br'); } }); }])
};

/* ================= CHEAP: three habits ================= */
SC.cheap = {
  ctx: 60, lead: [920, 1005, 16], al: 'br', hello: [["I'm clever. Using me well is the hard part.", 'happy'], ['Three habits. You have seen two already.', 'think']],
  enter: function () { Q('#levers li').forEach(hide); },
  beats: [
    function () {
      show(Q('#levers li')[0]); L.hush(); L.size(15);
      L.go(865, 500, { speed: 1600, face: 1, then: function () {
        L.tag('Opus'); S[0].size(9).tag('Sonnet').spawn(1080, 500); S[1].size(6).tag('Haiku').spawn(1210, 500);
        S[0].lines = ['Sonnet. Most of the building is mine.']; S[1].lines = ['Haiku. Small, fast, literal.'];
        P([['Big calls: me.', 'proud'], { s: S[0], t: 'I build.', m: 'happy' }, { s: S[1], t: 'Boring bits! Fast!', m: 'joy', al: 'br' }], ' ');
      } });
    },
    function () { P([['Small memory.', 'happy', function () { show(Q('#levers li')[1]); }], ['Sharp me.', 'joy']], ' '); },
    function () {
      show(Q('#levers li')[2]); S[0].hide(); S[1].hide(); L.tag(''); L.hush(); L.size(16); L.mood('happy');
      L.go(920, 1005, { speed: 1600, face: 1, then: function () { L.hold('mug'); P([['And keep me warm.', 'proud'], ['That one saves the most. It gets its own slide.', 'happy']]); } });
    }
  ]
};

/* ================= 12 SKILL ================= */
var dragOn = false;
function baSet(p) { p = Math.max(0, Math.min(100, p)); $('baafter').style.clipPath = 'inset(0 0 0 ' + p + '%)'; $('bah').style.left = p + '%'; }
(function () {
  var ba = $('ba'), drag = false;
  function set(x) { var r = ba.getBoundingClientRect(), p = Math.max(0, Math.min(1, (x - r.left) / r.width)); baSet(p * 100); if (L.visible) { L.at(150 + p * 1200, 1012); L.hush(); } }
  ba.addEventListener('pointerdown', function (e) { drag = true; dragOn = false; ba.setPointerCapture(e.pointerId); $('tagr').style.opacity = 1; set(e.clientX); });
  ba.addEventListener('pointermove', function (e) { if (drag) set(e.clientX); }); ba.addEventListener('pointerup', function () { drag = false; });
})();
SC.skill = {
  ctx: 75, lead: [1350, 1012, 14, -1], hello: ['Remember this page?'],
  enter: function () { dragOn = false; baSet(100); $('tagr').style.opacity = 0; hide($('sklists')); hide($('skin')); $('refs').classList.remove('show'); L.wear('fedora'); },
  tick: function () { if (dragOn) baSet((L.pos().x - 150) / 12); },
  beats: [
    function () {
      $('tagr').style.opacity = 1; L.hush(); L.mood('happy'); L.at(1350, 1012); dragOn = true;
      L.go(246, 1012, { dur: 1.5, then: function () { L.go(750, 1012, { dur: .9, then: function () { dragOn = false; baSet(50); P([['Same prompt. Same me.', 'happy'], ['Different rules!', 'joy']]); } }); } });
    },
    function () { P([['No rules?', 'sad', function () { show($('sklists')); }], ['Template soup.', 'sad']]); },
    function () { P([['My hat is one small file.', 'proud', function () { hide($('sklists')); show($('skin')); later(function () { $('refs').classList.add('show'); }, 300); L.chip('Read(references/brief.md)'); }], ['I open the rest only when I need it.', 'happy']]); }
  ]
};

/* ================= YOU ================= */
var rolesay = [['You bring the story.', 'happy'], ['You catch my mistakes.', 'happy'], ['You write my rules.', 'happy'], ['You drive.', 'joy']];
var DECK_LINES = 3000;
function countLines(done) {
  Promise.all(['index.html', 'deck.css', 'deck2.css', 'mascot.js', 'deck.js', 'scenes2.js'].map(function (f) { return fetch(f).then(function (r) { return r.text(); }); }))
    .then(function (a) { done(a.reduce(function (n, t) { return n + t.split(String.fromCharCode(10)).length; }, 0)); }).catch(function () { done(DECK_LINES); });
}
SC.you = {
  ctx: 90, lead: [1650, 1012, 18, -1], al: 'br', hello: ['This part is about YOU.'],
  enter: function () { Q('#you .rev').forEach(hide); Q('#pipe div').forEach(function (p) { p.classList.remove('on'); }); },
  beats: [0, 1, 2, 3].map(function (i) {
    return function () { show(Q('#you .role')[i]); L.hush(); L.go(352 + i * 410, 1012, { speed: 1800, then: function () { L.hop(); P([rolesay[i]], i === 0 ? 'bl' : i === 3 ? 'br' : ' '); } }); };
  }).concat([
    function () { Q('#pipe div').forEach(function (p, i) { later(function () { p.classList.add('on'); }, i * 300); }); L.hush(); L.go(1650, 1012, { face: -1, then: function () { P([['The whole pipeline.', 'proud'], ['Count the steps where somebody writes code by hand.', 'think'], ['Zero.', 'joy', function () { show($('final')); }]]); } }); }
  ])
};

/* ---------- clicks: the mascot goes where you point ---------- */
var GOING = ['Coming!', 'Over here?', 'On my way!', 'What is it?', 'Running!'];
function leadPoke() {
  var k = Math.round(ctxNow), pool;
  if (L.base === 'dizzy') pool = ['…who clicked me?', 'Are you the reporter? Am I?', 'I had a rule about this.'];
  else if (L.base === 'tired') pool = ['Getting heavy in here.', 'Could you repeat rule one?'];
  else if (k <= 100) pool = ['Hey! ' + k + 'K of 1M used.', 'Every rule still in view.', 'Give me a job!', 'That tickles.'];
  else pool = [k + 'K of 1M. Still sharp.', 'I re-read everything, every message.', 'Past the red line, I start forgetting.'];
  L.hop(); L.say(pool[pk++ % pool.length], 1, al());
}
stage.addEventListener('click', function (e) {
  lastAct = Date.now();
  if (e.target.closest('button,input,.ba,#ask,#cmd')) return;
  var hit = e.target.closest('.hit');
  if (hit) { var c = hit._clawd; if (c === L) leadPoke(); else { c.hop(); c.say((c.lines && c.lines[0]) || 'Helper. Fresh memory, one job.', 1); } return; }
  if (!L.visible || /^(open|finale|imagine)$/.test(ids[cur])) return;
  var r = stage.getBoundingClientRect(), sc = r.width / 1920, x = (e.clientX - r.left) / sc, y = (e.clientY - r.top) / sc;
  var t = e.target.closest('[data-say]'), line = t && t.dataset.say;
  if (line && L.base === 'dizzy') line = "I don't remember that one."; else if (line && L.base === 'tired') line = line.split(' ').slice(0, 3).join(' ') + '… something like that.';
  dragOn = false; L.say(line ? 'Let me see…' : GOING[Math.floor(Math.random() * GOING.length)], 1, al());
  L.go(Math.max(160, Math.min(1760, x)), Math.max(300, Math.min(1012, y + L.u * 5)), { then: function () { if (line) L.say(line, 1); } });
});

/* ---------- keys ---------- */
$('help').textContent = ['KEYS', '→  Space  PageDown  Enter   next line (a line stays until you press)', '←  PageUp  Backspace  ONE step back (at the top of a scene: the end of the one before)', ']  [                 skip to the next scene / the start of the previous one', 'R                    restart this scene', '1-4                  answer a dialog (Enter = highlighted)',
  '/                    command line: /clear /compact /context /agents /model /rewind', 'Esc                  interrupt the mascot (twice: rewind this scene)', 'Shift+Tab            cycle the permission mode',
  'M                    mascot idle asides on / off', 'N  notes + timer     T  reset timer     F  fullscreen', '?                    this panel', 'Mouse                click anywhere: the mascot goes there'].join(String.fromCharCode(10));
addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  var k = e.key; lastAct = Date.now();
  if (cmdOn && promptS) {
    if (k === 'Enter') { e.preventDefault(); if (!t0) t0 = Date.now(); submitPrompt(); return; }
    if (k === 'Escape') { e.preventDefault(); cmdBuf = ''; drawCmd(promptS.ghost); return; }
    if (k === 'Backspace') { e.preventDefault(); cmdBuf = cmdBuf.slice(0, -1); drawCmd(promptS.ghost); return; }
    if (k.length === 1 && !promptS.auto) { e.preventDefault(); cmdBuf += k; drawCmd(); return; }
  } else if (cmdOn) {
    if (k === 'Escape') { e.preventDefault(); closeCmd(); return; }
    if (k === 'Enter') { e.preventDefault(); if (!t0) t0 = Date.now(); if (cmdBuf.trim()) { execCmd(); return; } }
    if (k === 'Backspace') { e.preventDefault(); cmdBuf = cmdBuf.slice(0, -1); drawCmd(); return; }
    if (k === 'Tab') { e.preventDefault(); var m = CMDS.filter(function (c) { return cmdBuf && c[0].indexOf(cmdBuf) === 0; }); if (m.length) { cmdBuf = m[0][0]; drawCmd(); } return; }
    if (k.length === 1 && k !== ' ') { e.preventDefault(); cmdBuf += k; drawCmd(); return; }
  }
  if (askS) {
    if (/^[1-9]$/.test(k)) { e.preventDefault(); pick(+k - 1); return; }
    if (k === 'ArrowDown') { e.preventDefault(); askSel((askS.sel + 1) % askS.opts.length); return; }
    if (k === 'ArrowUp') { e.preventDefault(); askSel((askS.sel + askS.opts.length - 1) % askS.opts.length); return; }
    if (k === 'Escape') { e.preventDefault(); pick(askS.opts.length - 1); return; }
  }
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].indexOf(k) > -1) { e.preventDefault(); if (!t0) t0 = Date.now(); next(); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].indexOf(k) > -1) { e.preventDefault(); back(); }
  else if (k === ']') go(cur + 1);
  else if (k === '[') { if (cur > 0) replay(cur - 1, []); }
  else if (k === '/') { e.preventDefault(); openCmd('/'); }
  else if (k === 'Tab' && e.shiftKey) { e.preventDefault(); mode = (mode + 1) % MODES.length; drawMode(); if (L.visible) L.say(MODES[mode][1], 1, al()); }
  else if (k === 'Escape' && Date.now() - escT < 650) { escT = 0; restart(); hmsg('Rewound to the last checkpoint.'); }
  else if (k === 'Escape') { escT = Date.now(); if (L.visible) { L.stop(); L.arms('up'); L.emote('!', 'red'); setTimeout(function () { L.arms(); }, 900); hmsg('Interrupted · What should Claude do instead?'); } }
  else if (k === 'r' || k === 'R') restart();
  else if (k === 'm' || k === 'M') { chatty = !chatty; hmsg('Idle asides ' + (chatty ? 'on' : 'off')); }
  else if (k === 'Home') go(0); else if (k === 'End') go(slides.length - 1);
  else if (k === 'n' || k === 'N') $('notes').classList.toggle('on');
  else if (k === '?') $('help').classList.toggle('on');
  else if (k === 't' || k === 'T') t0 = Date.now();
  else if (k === 'f' || k === 'F') { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
});
setInterval(function () { if (!t0) return; var s = Math.floor((Date.now() - t0) / 1000), c = $('nclock'); c.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2) + ' / 20:00'; c.classList.toggle('over', s > 1200); }, 1000);

/* ---------- idle life: a glance now and then (never over a line that is still up) ---------- */
setInterval(function () {
  if (!L.visible || L.el.classList.contains('walk') || L.el.dataset.mood !== 'idle') return;
  var r = Math.random(); if (r < .4) { L.look(r < .2 ? 'l' : 'r'); setTimeout(function () { L.look(); }, 900); }
}, 5200);

(function tick() { pushWords(); var sc = SC[ids[cur]]; if (sc && sc.tick) sc.tick(); requestAnimationFrame(tick); })();
window.DECK = { go: go, next: next, back: back, replay: replay, L: L, S: S, M: M, state: function () { return { scene: ids[cur], step: step, beats: beats().length, ask: !!askS, prompt: !!promptS, ctx: ctxNow, q: QD.length, hist: (HIST[ids[cur]] || []).length }; } };
/* what the second scene file builds on */
window.D = { $: $, Q: Q, L: L, S: S, M: M, P: P, SC: SC, stage: stage, cast: cast, later: later, every: every, unsched: unsched, anim: anim, show: show, hide: hide, esc: esc, ask: ask,
  hmsg: hmsg, setCtx: setCtx, hushAll: hushAll, flyer: flyer, openPrompt: openPrompt, countLines: countLines, setPaper: setPaper, inst: function () { return INST; },
  boot: function () { var h = parseInt(location.hash.slice(1), 10); go(isNaN(h) ? 0 : h - 1); } };
})();
