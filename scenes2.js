/* Vibe Coding, Engineered: the second scene file.
   The scenes with Mir in them: what a harness is (he types, the mascot plays it
   out twice), the .md files he reads, the arguments, the 54-minute cache, how
   the Skill learns after every story, imagination, how this deck was made, the
   energy story, and the ending that plays by itself. Built on window.D. */
(function (D) {
'use strict';
var $ = D.$, Q = D.Q, L = D.L, S = D.S, M = D.M, P = D.P, SC = D.SC, stage = D.stage, cast = D.cast;
var later = D.later, every = D.every, unsched = D.unsched, anim = D.anim, show = D.show, hide = D.hide, ask = D.ask, hmsg = D.hmsg, setCtx = D.setCtx, hushAll = D.hushAll, flyer = D.flyer, openPrompt = D.openPrompt;
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function rnd(i, k) { var x = Math.sin(i * 127.1 + (k || 0) * 311.7) * 43758.5453; return x - Math.floor(x); } /* the same "random" every time, so a replay looks the same */
function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
function mirIn(x, y, f, u) { M.size(u || 12).at(x, y).face(f || 1).show(); return M; }

/* ================= HARNESS: the same request, twice ================= */
var task = 'Fix the hero on small phones.', cpN = 0;
function cp(n) { cpN = n; $('cpn').textContent = n; $('cpn').classList.toggle('hot', n > 0); }
function hx(box, who, text, cls) { var d = el('div', (cls || '') + ' ' + (who === 'Mir' ? 'm' : who === 'AI' ? 'a' : 't')); d.innerHTML = (who === '●' ? '<i>●</i> ' : '<b>' + who + '</b> ') + D.esc(text); $(box).appendChild(d); }
function carry(n, back) { M.hold('paper'); M.go(585, 1008, { speed: 900, then: function () { if (back) flyer(L, M); else flyer(M, L); cp(n); M.go(790, 1008, { speed: 900, face: -1, then: function () { M.hold(); } }); } }); }
function chatRun(text) {
  task = text || task; hx('hxl1', 'Mir', task);
  P([['I cannot see your files. Can you paste the CSS?', 'confused', function () { hx('hxl1', 'AI', 'I cannot see your files. Paste the CSS?'); }],
    { s: M, t: 'Fine. Copy. Paste.', m: 'tired', al: 'br', f: function () { carry(1); hx('hxl1', 'Mir', '(pastes 1,193 lines of CSS)', 'dimr'); } },
    ['Try this version.', 'happy', function () { hx('hxl1', 'AI', 'Try this version.'); }],
    { s: M, t: 'Copy it back. Reload. Check my phone…', m: 'tired', al: 'br', f: function () { carry(2, 1); hx('hxl1', 'Mir', '(copies it back, reloads, checks his phone)', 'dimr'); } },
    { s: M, t: 'Still broken at 320.', m: 'angry', al: 'br', f: function () { hx('hxl1', 'Mir', 'Still broken at 320.'); } },
    ['Hmm. Can you send a screenshot?', 'confused', function () { hx('hxl1', 'AI', 'Can you send a screenshot?'); }],
    { s: M, t: 'I am the hands. The eyes. AND the test suite.', m: 'tired', al: 'br', f: function () { carry(3); } }], 'bl');
}
SC.harness = {
  ctx: 110, lead: [350, 985, 13], al: 'bl', bw: 600, hello: [['Hello? In here I can only talk.', 'confused']],
  enter: function () {
    $('hxl1').innerHTML = ''; $('hxl2').innerHTML = ''; cp(0); task = 'Fix the hero on small phones.';
    $('jar2').classList.remove('off'); hide($('hxline')); $('hx-harn').classList.add('dim'); $('hx-chat').classList.remove('dim');
  },
  beats: [
    function () {
      P([['First, a word: harness.', 'think'],
        ['It is the program around me. It hands me tools, and lets me keep going until the job is done.', 'happy'],
        ['Without one? Watch. Mir, ask me to fix something.', 'happy', function () {
          mirIn(2050, 1008, -1); M.go(790, 1008, { dur: .8, face: -1 }); M.el.classList.add('typing');
          openPrompt({ ghost: task, done: function (t) { M.el.classList.remove('typing'); chatRun(t); } });
        }]]);
    },
    function () {
      hushAll(); $('jar2').classList.add('off'); $('hx-harn').classList.remove('dim'); $('hx-chat').classList.add('dim'); L.mood('joy');
      M.hold('mug'); M.mood('idle'); M.go(1640, 1008, { speed: 900, face: -1 });
      L.go(1240, 990, { speed: 1500, then: function () {
        hx('hxl2', 'Mir', task);
        P([['Same request. This time, I have hands.', 'joy'],
          ['I read the file myself.', 'happy', function () { hx('hxl2', '●', 'Read(css/story.css)'); L.chip('Read(css/story.css)'); L.hold('folder'); }],
          ['I edit it.', 'happy', function () { hx('hxl2', '●', 'Edit(css/story.css)'); L.chip('Edit(css/story.css)'); L.hold(); }],
          ['I test it. 53 screen sizes.', 'think', function () { hx('hxl2', '●', 'Bash(sweep 53 screen sizes)   0 FAIL'); L.chip('Bash(sweep 53 sizes)'); }],
          ['Zero fail. And I look at the screenshot myself.', 'joy', function () { hx('hxl2', '●', 'Browser(320 x 480)   screenshot'); L.chip('Browser(320 x 480)'); L.hold('lens'); }],
          ['Fixed. Screenshots attached.', 'proud', function () { hx('hxl2', 'AI', 'Fixed. 53 sizes, 0 fail. Screenshots attached.'); L.hold('report'); }],
          { s: M, t: 'Copy-pastes: zero. I drank my tea.', m: 'smug', al: 'br' }], 'bl');
      } });
    },
    function () { P([['Same brain.', 'proud', function () { show($('hxline')); M.mood('happy'); }], ['The harness is what lets me act, check, and try again.', 'happy']], 'bl'); }
  ]
};

/* ================= MD: what Mir actually reads ================= */
var RULES = ['## Daily Star stories: hard rules', '- Logo top-left over the hero.', '- No kickers above headlines.', '- One accent.', '- Reporter text verbatim.', '- Never invent figures, quotes or photos.'];
var FILES = ['EVAL.md', 'EVAL2.md', 'EVAL3.md', 'FACTCHECK.md', 'DESK_CHECKS.md', 'qa/scenes-320.md', 'qa/scenes-390.md', 'BUILD_BRIEF.md', 'REDESIGN.md', 'perf-run-1.md', 'perf-run-2.md', 'HANDOVER.md', 'DEPLOY.md', 'qa/scenes-1440.md', 'lint.md', 'a11y.md'];
var mdTy = null, logoX = 0;
function mdType(t) {
  var sp = $('mdnew'), i = 0; unsched(mdTy); sp.textContent = ''; $('mded').classList.add('edit');
  if (D.inst()) { sp.textContent = t; return; }
  mdTy = every(function () { sp.textContent = t.slice(0, ++i); if (i >= t.length) unsched(mdTy); }, 45);
}
function nudge(d) { logoX += d; $('mdlogo').style.transform = 'translateX(' + logoX * 26 + 'px)'; L.chip('Edit(css/story.css)'); }
function throwFile(i, from) {
  var c = el('i', 'fcard'), p = from.pos(), tx = 820 + (rnd(i) - .5) * 250, ty = 1000 - 40 - i * 15 - rnd(i, 2) * 20, r = (rnd(i, 3) - .5) * 40;
  c.textContent = FILES[i % FILES.length]; cast.appendChild(c);
  c.style.transform = 'translate(' + (p.x - 90) + 'px,' + (p.y - from.u * 9) + 'px) scale(.4)'; void c.offsetWidth;
  c.style.transform = 'translate(' + (tx - 90) + 'px,' + ty + 'px) rotate(' + r + 'deg)';
}
function flood(a, b, from) { for (var i = a; i < b; i++) (function (i) { later(function () { throwFile(i, from); }, (i - a) * 110); })(i); }
function scatter() { Q('.fcard').forEach(function (c, i) { c.style.transform = 'translate(' + (820 + (rnd(i, 5) - .5) * 2600) + 'px,' + (-200 - rnd(i, 6) * 300) + 'px) rotate(' + (rnd(i, 7) * 720 - 360) + 'deg)'; c.style.opacity = 0; }); later(function () { Q('.fcard').forEach(function (c) { c.remove(); }); }, 900); }
SC.md = {
  ctx: 200, lead: [1610, 1012, 15, -1], al: 'br', bw: 600, hello: [['He does not read my code. Nobody does.', 'happy']],
  enter: function () {
    Q('#mdcards .mdc').forEach(function (c) { c.classList.remove('show'); }); hide($('mded')); hide($('mdpage')); hide($('mdline')); unsched(mdTy);
    $('mdpre').textContent = RULES.join(String.fromCharCode(10)); $('mdnew').textContent = ''; $('mded').classList.remove('edit'); logoX = 0; $('mdlogo').style.transform = '';
    Q('.fcard').forEach(function (c) { c.remove(); }); hide($('mdsum'));
    mirIn(830, 1008, 1).hold('paper'); M.mood('read');
  },
  leave: function () { Q('.fcard').forEach(function (c) { c.remove(); }); },
  beats: [
    function () {
      P([['He reads these. Plain text notes.', 'happy', function () { Q('#mdcards .mdc').forEach(function (c, i) { later(function () { c.classList.add('show'); }, i * 140); }); }],
        ['The rules. The plan. Where we stopped. What the checkers found.', 'happy'],
        { s: M, t: 'I write the first two. I read all four. Every round.', m: 'read', al: 'bl' }]);
    },
    function () {
      P([['Look what I made! A GIANT number box!', 'joy', function () { show($('mded')); L.hold('box'); M.mood('idle'); M.hold(); }],
        { s: M, t: 'No.', m: 'angry', al: 'bl', f: function () { M.el.classList.add('typing'); mdType('- No giant number boxes.'); } },
        ['“No giant number boxes.” …It is a rule now.', 'sad', function () { L.hold(); M.el.classList.remove('typing'); M.mood('smug'); }],
        ['He writes. I obey. Every session, forever.', 'happy', function () { M.mood(); }]]);
    },
    function () {
      P([{ s: M, t: 'Logo a bit to the left.', m: 'think', al: 'bl', f: function () { show($('mdpage')); nudge(-1); } }, ['Done.', 'happy'],
        { s: M, t: 'Hmm. Back to the right.', m: 'think', al: 'bl', f: function () { nudge(1); } }, ['…Done.', 'tired'],
        { s: M, t: 'Actually, left was better.', m: 'happy', al: 'bl', f: function () { nudge(-1); } },
        ['This is round seven. I counted.', 'stern']]);
    },
    function () {
      S[0].size(7).spawn(1250, 1012); S[1].size(7).spawn(1400, 1012); M.mood('read'); M.hold('paper');
      P([['Review time! Here is my report.', 'joy', function () { flood(0, 3, L); }],
        { s: S[0], t: 'And the QA screenshots!', m: 'joy', f: function () { flood(3, 7, S[0]); } },
        { s: S[1], t: 'And the fact-check! And three evaluations!', m: 'joy', f: function () { flood(7, 12, S[1]); M.mood('tired'); } },
        ['And the speed runs. Both of them.', 'happy', function () { flood(12, 16, L); M.mood('panic'); }],
        { s: M, t: 'ENOUGH!', m: 'angry', al: 'bl shout', f: function () { scatter(); M.hop(); M.hold(); [S[0], S[1], L].forEach(function (s) { s.mood('wide'); }); stage.classList.add('quake'); later(function () { stage.classList.remove('quake'); }, 600); } },
        { s: M, t: 'Five lines. What needs ME?', m: 'angry', al: 'bl' },
        ['Five lines. Three things need you.', 'proud', function () { show($('mdsum')); L.hold('report'); S[0].mood(); S[1].mood(); M.mood('tired'); }]]);
    },
    function () { P([['Tiring? Yes.', 'happy', function () { show($('mdline')); S[0].hide(); S[1].hide(); }], ['Still cheaper than reading 3,465 lines of code.', 'proud'], { s: M, t: 'Barely.', m: 'tired', al: 'bl' }]); }
  ]
};

/* ================= ARGUE: it does not just agree ================= */
function ex(t, s, red) { $('exht').textContent = t; $('exhs').textContent = s; $('exh').classList.toggle('red', !!red); show($('exh')); }
function score(l, m) { $('scL').textContent = l; $('scM').textContent = m; }
SC.argue = {
  ctx: 310, lead: [500, 1008, 16, 1], al: 'bl', bw: 640, hello: [['Sometimes he is wrong. I tell him.', 'happy']],
  enter: function () { score(0, 0); hide($('exh')); hide($('argline')); mirIn(1440, 1008, -1, 13); },
  beats: [
    function () {
      P([{ s: M, t: 'Just load the font from Google. Faster to set up.', m: 'happy', al: 'br' }, ['No.', 'stern'],
        ['Readers on slow networks wait for that server. Sometimes it never answers.', 'think', function () { ex('“No runtime CDN: self-host subset fonts and libraries.”', 'CLAUDE.md, build conventions'); }],
        { s: M, t: '…who wrote that?', m: 'think', al: 'br' }, ['You did.', 'proud', function () { score(1, 0); L.hop(); }], { s: M, t: 'Fine.', m: 'tired', al: 'br' }]);
    },
    function () {
      P([['53 screen sizes. Zero fail. It is finished.', 'proud', function () { M.mood(); ex('Bash(sweep 53 screen sizes)   0 FAIL', 'the test log'); }],
        { s: M, t: 'It stutters on my old phone.', m: 'think', al: 'br', f: function () { M.hold('phone'); } }, ['My numbers say it is fine.', 'proud'],
        { s: M, t: 'Scroll it. On the ACTUAL phone.', m: 'angry', al: 'br' },
        ['…', 'think', function () { L.hold('lens'); L.go(1090, 1008, { speed: 900 }); }],
        ['Oh. It stutters.', 'wide', function () { ex('Old Android: the scroll stutters. No test caught it.', 'seen on a real phone', 1); }],
        ['You were right. I was only right on paper.', 'sad', function () { score(1, 1); M.hop(); M.mood('smug'); }]]);
    },
    function () { P([['A test can pass and the page can still feel wrong.', 'happy', function () { L.hold(); show($('argline')); }], ['That is why a human scrolls it. And why I do not just say yes.', 'proud']]); }
  ]
};

/* ================= CACHE: one word at minute 54 ================= */
var cmin = 0, CC = 1476.5;
function cache(m) {
  m = Math.round(m); $('mins').textContent = m; $('clk').setAttribute('stroke-dasharray', (CC * Math.min(m, 60) / 60) + ' ' + CC);
  var cold = m > 60; $('clk').setAttribute('stroke', cold ? '#E8312A' : m >= 54 ? '#f0a33a' : '#7d93b8'); $('clock').classList.toggle('cold', cold);
  var s = $('cstate'); s.textContent = cold ? 'Cold. Everything is read again.' : m >= 54 ? 'Six minutes left. Send something.' : m ? 'Warm.' : 'Just sent a message.';
  s.style.color = cold ? 'var(--acc)' : m >= 54 ? 'var(--warn)' : '';
}
function cacheTo(v, ms) { anim(cmin, v, ms, function (x) { cmin = x; cache(x); }, 'cache'); }
function bar(id, pct, label) { $(id).style.width = pct + '%'; $(id + 'n').textContent = label; }
SC.cache = {
  ctx: 400, lead: [400, 1012, 15], al: 'bl', bw: 640, hello: [['The third habit: keep me warm.', 'happy']],
  enter: function () {
    cmin = 0; cache(0); hide($('clock')); hide($('cstate')); hide($('bars')); hide($('flask')); bar('bw', 0, ''); bar('bc', 0, ''); $('barnote').textContent = ''; $('stk').classList.remove('grow');
  },
  beats: [
    function () {
      P([['Every message you send me, I get the WHOLE conversation again.', 'think', function () { $('stk').classList.add('grow'); }],
        ['Every file. Every line. 400K tokens: about 300,000 words.', 'wide'],
        ['Reading it all fresh is slow. And it eats your usage limit.', 'sad']]);
    },
    function () {
      P([['So there is a cache. Think of it as a bookmark.', 'happy', function () { show($('clock')); show($('cstate')); cacheTo(20, 1200); }],
        ['For one hour I keep what I have already read. I only read the new part.', 'proud', function () { L.hold('mug'); }],
        ['Every message resets the hour.', 'happy']]);
    },
    function () {
      P([['Minute 54!', 'panic', function () { cacheTo(54, 1600); mirIn(2050, 1008, -1); M.hold('mug'); M.go(1560, 1008, { dur: .9, face: -1 }); }],
        ['Mir! Type something. Anything. NOW!', 'panic', function () {
          M.hold(); M.el.classList.add('typing');
          openPrompt({ ghost: 'continue', done: function (t) {
            M.el.classList.remove('typing'); M.hop(); cacheTo(0, 900); L.mood('joy'); show($('bars'));
            P([{ s: M, t: '“' + t + '”', m: 'happy', al: 'br' }, ['Warm again! One more hour.', 'joy'],
              ['That message re-used all 400K tokens from the cache. They count at about a tenth.', 'proud', function () { bar('bw', 10, '~40K'); }]]);
          } });
        }]]);
    },
    function () {
      P([['And if he had gone for tea instead?', 'think', function () { M.mood(); M.hold('mug'); M.go(2100, 1008, { speed: 600 }); cacheTo(61, 1800); }],
        ['Brr. Cold.', 'cold'],
        ['Now I read all 400K again, at full price. Same message. About ten times the cost.', 'cold', function () { bar('bc', 100, '400K'); $('barnote').textContent = 'Illustration: one 400K-token session. Cached tokens count at a fraction of fresh ones: about a tenth, or less.'; }]]);
    },
    function () {
      P([['One word bought back the hour.', 'happy', function () { cacheTo(0, 700); show($('flask')); M.go(1560, 1008, { speed: 900, face: -1 }); }],
        ['The difference pays for about nine more messages like it.', 'proud'],
        { s: M, t: 'So before lunch, I type one word.', m: 'smug', al: 'br' },
        ['Or he lets me finish and write the handover. Also fine.', 'happy']]);
    }
  ]
};

/* ================= LEARN: the Skill gets better after every story ================= */
var LEARNED = ['+ Every motion must reveal a finding.', '+ No scroll without something new.', '+ A step-synced chart beats one big chart.', '+ Simplify first. Then animate.'];
var STATUS = [['No case known', 11, 0], ['Under investigation', 25, 0], ['In court', 9, 0], ['Closed, no conviction', 2, 0], ['Convicted', 14, 1]], lty = null;
(function () { var b = $('d61'); for (var i = 0; i < 61; i++) b.appendChild(el('i')); STATUS.forEach(function (s) { b.appendChild(el('span', 'gl', s[0] + ' <b>' + s[1] + '</b>')); }); })();
/* mode: 0 hidden, 1 one grid, 2 grid coloured, 3 grouped by where the case stands */
function dots(mode) {
  var d = Q('#d61 i'), gl = Q('#d61 .gl'), k = 0, y = 0;
  $('d61').dataset.m = mode;
  if (mode < 3) { d.forEach(function (e, i) { e.style.left = (i % 8) * 35 + 4 + 'px'; e.style.top = Math.floor(i / 8) * 35 + 'px'; e.className = mode === 2 ? (i < 14 ? 'ink' : 'red') : mode ? 'on' : ''; }); gl.forEach(function (g) { g.style.opacity = 0; }); return; }
  STATUS.forEach(function (s, gi) {
    gl[gi].style.top = y + 'px'; gl[gi].style.opacity = 1; y += 27;
    for (var j = 0; j < s[1]; j++) { var e = d[s[2] ? j : 14 + k++]; e.className = s[2] ? 'ink' : 'red'; e.style.left = (j % 11) * 25.5 + 4 + 'px'; e.style.top = y + Math.floor(j / 11) * 25.5 + 'px'; }
    y += Math.ceil(s[1] / 11) * 25.5 + 9;
  });
}
function phone(cap, mode, cls) { $('phcap').textContent = cap; dots(mode); $('scr').className = 'scr ' + (cls || ''); }
function lnode(n) { Q('#lloop div').forEach(function (d, i) { d.classList.toggle('on', i <= n); }); }
SC.learn = {
  ctx: 85, lead: [960, 1012, 14], bw: 440, hello: [['Publishing is not the end. It is homework.', 'happy']],
  enter: function () { lnode(-1); unsched(lty); $('skpre').textContent = ''; hide($('skdiff')); hide($('phone')); hide($('lline')); phone('', 0); mirIn(1720, 1008, -1); M.el.style.setProperty('--bw', '340px'); },
  beats: [
    function () {
      P([['The story goes live. Then people react.', 'happy', function () { lnode(1); }], ['The desk. The bosses. Readers.', 'happy'],
        { s: M, t: 'What did we do new this time? Why? Will it help next time?', m: 'think', al: 'br', f: function () { lnode(2); } },
        ['I compare the story with my Skill. Then I write down what we learned.', 'proud', function () {
          lnode(3); show($('skdiff')); var t = LEARNED.join(String.fromCharCode(10)), i = 0; unsched(lty);
          if (D.inst()) $('skpre').textContent = t; else lty = every(function () { i += 2; $('skpre').textContent = t.slice(0, i); if (i >= t.length) unsched(lty); }, 30);
        }],
        { s: M, t: 'I read it. I fix it. Then it is a rule.', m: 'read', al: 'br' }]);
    },
    function () {
      P([['What did that teach us? Before:', 'think', function () { show($('phone')); phone('61 journalists killed since 1972. 14 cases ended in a conviction. In 11, no case is known. 25 are still under investigation…', 2, 'static'); M.mood(); }],
        ['One big chart. One glance. Then scroll, scroll, scroll… nothing.', 'yawn', function () { $('scr').classList.add('scrolling'); }],
        ['Readers are busy. Thumbs get bored.', 'sad']]);
    },
    function () {
      P([['Now. Scroll one.', 'happy', function () { phone('61 journalists and media workers killed since 1972.', 1); }],
        ['Scroll two. A finding.', 'happy', function () { phone('In 14 cases, a court has convicted someone.', 2); }],
        ['Scroll three. Another one.', 'joy', function () { phone('Where the other 47 stand.', 3); }]]);
    },
    function () { P([['Every scroll, a new finding.', 'proud', function () { show($('lline')); }], ['Nobody scrolls for nothing.', 'joy'], { s: M, t: 'After this talk, we update the Skill again.', m: 'happy', al: 'br' }]); }
  ]
};

/* ================= IMAGINE: space, a forest, a river ================= */
(function () {
  var sp = $('wspace'), fo = $('wforest'), rv = $('wriver'), i, e;
  for (i = 0; i < 90; i++) { e = el('i', 'star'); var z = 3 + Math.floor(rnd(i) * 3) * 2; e.style.cssText = 'left:' + (rnd(i, 1) * 1920).toFixed(0) + 'px;top:' + (rnd(i, 2) * 900).toFixed(0) + 'px;width:' + z + 'px;height:' + z + 'px;animation-delay:' + (-rnd(i, 3) * 4).toFixed(2) + 's'; sp.appendChild(e); }
  sp.appendChild(el('div', 'planet', '<i></i>')); sp.appendChild(el('div', 'orbit', '<i></i>')); sp.appendChild(el('div', 'planet2'));
  for (var r = 0; r < 3; r++) { var row = el('div', 'trees t' + r); for (i = 0; i < 16 - r * 3; i++) { e = el('i'); e.style.setProperty('--h', (150 + rnd(i, r + 9) * 170 + r * 90).toFixed(0) + 'px'); row.appendChild(e); } fo.appendChild(row); }
  for (i = 0; i < 16; i++) { e = el('i', 'fly'); e.style.cssText = 'left:' + (100 + rnd(i, 4) * 1700).toFixed(0) + 'px;top:' + (360 + rnd(i, 5) * 520).toFixed(0) + 'px;animation-delay:' + (-rnd(i, 6) * 5).toFixed(2) + 's'; fo.appendChild(e); }
  rv.appendChild(el('div', 'bank')); for (i = 0; i < 6; i++) rv.appendChild(el('div', 'wave v' + i)); rv.appendChild(el('div', 'boat', '<i></i>'));
})();
var IDEAS = { space: 'The night sky over Dhaka, hour by hour', forest: 'Walk the Sundarbans, one tree at a time', river: 'Follow one river from the hills to the sea' };
var BUILT = ["A game? Let's go!", "A dashboard? Let's go!", "A lesson? Let's go!", 'Ooh. Tell me more!'];
function world(w) {
  ['space', 'forest', 'river'].forEach(function (k) { $('w' + k).classList.toggle('on', k === w); });
  $('imagine').dataset.w = w || ''; L.el.classList.toggle('float', w === 'space' || w === 'river');
  if (w) { $('ideat').textContent = IDEAS[w]; show($('idea')); } else hide($('idea'));
}
function chose(i) { P([[BUILT[i], 'joy'], ['Describe it. That is the whole job.', 'happy']], 'bl'); }
SC.imagine = {
  ctx: 95, lead: [520, 1000, 18], al: 'bl', bw: 620, hello: [['One question for you.', 'think']],
  enter: function () { world(null); hide($('final2')); },
  leave: function () { world(null); },
  beats: [
    function () {
      ask({ x: 760, y: 420, w: 800, head: 'One question', q: 'What do you want to build?', def: 3,
        opts: [['A game', chose], ['A dashboard', chose], ['A lesson for a classroom', chose], ['Something nobody has built yet', chose]] });
    },
    function () { L.hush(); world('space'); L.wear('helmet'); L.mood('joy'); L.go(560, 700, { dur: 1.1, then: function () { P([['Space?', 'joy'], ['Scroll through the planets.', 'happy']], 'bl'); } }); },
    function () { L.hush(); world('forest'); L.wear('leaf'); L.mood('joy'); L.go(600, 1000, { dur: .8, then: function () { P([['A forest?', 'joy'], ['Walk it, tree by tree.', 'happy']], 'bl'); } }); },
    function () { L.hush(); world('river'); L.wear(''); L.mood('joy'); L.go(700, 852, { dur: .8, then: function () { P([['A river?', 'joy'], ['Ride it all the way to the sea.', 'happy']], 'bl'); } }); },
    function () {
      L.hush(); world(null); L.go(520, 1000, { dur: .7, then: function () {
        P([['If you can describe it, it can be built.', 'cool', function () { L.wear('shades'); show($('final2')); }], ['The only limit is what you can imagine.', 'cool']], 'bl');
      } });
    }
  ]
};

/* ================= MAKING: this deck, built the same way ================= */
var NUDGES = ['Bigger mascot.', 'More chatter.', 'A line on every press.', 'The back arrow should go ONE step back.'];
function nud(i) { var c = el('div', 'nudge', D.esc(NUDGES[i])); $('nudges').appendChild(c); void c.offsetWidth; c.classList.add('show'); }
SC.making = {
  ctx: 100, lead: [470, 1012, 16], al: 'bl', bw: 620, hello: [['One more secret.', 'happy']],
  enter: function () { hide($('v1')); $('nudges').innerHTML = ''; hide($('selfc')); hide($('mkline')); $('v1').classList.remove('alive'); },
  beats: [
    function () {
      P([['This deck is a web page. I built it. Same pipeline.', 'proud', function () { show($('v1')); }],
        ['Version one: thirteen slides of text.', 'happy'], ['It was fine. Sensible. Forgettable.', 'sad']]);
    },
    function () {
      P([{ s: M, t: 'What if Claude came to life?', m: 'think', al: 'br', f: function () { mirIn(2050, 1008, -1); M.go(1600, 1008, { dur: .8, face: -1 }); } },
        ['…me?', 'wide', function () { L.hop(); $('v1').classList.add('alive'); }], ['That was his idea. Not mine.', 'joy']]);
    },
    function () {
      P(NUDGES.map(function (t, i) { return { s: M, t: t, m: i === 3 ? 'angry' : 'think', al: 'br', f: function () { nud(i); } }; }).concat([['He kept pushing. I kept building.', 'happy', function () { M.mood('smug'); }]]));
    },
    function () {
      P([['I had help. Helpers pressed every key and checked every screen.', 'happy', function () { M.mood(); [0, 1, 2].forEach(function (i) { S[i].size(7).spawn(760 + i * 130, 1012, function () { S[i].mood('joy'); }); }); }],
        ['And a handover file. Every night I started where I had stopped.', 'happy', function () { L.hold('handover'); }]]);
    },
    function () {
      P([['Then last night he sent one very long message…', 'think', function () { [0, 1, 2].forEach(function (i) { S[i].hide(); }); L.hold(); }],
        ['…and went to sleep.', 'happy', function () { M.mood('sleep'); }],
        ['I built the ending while he slept.', 'proud', function () { D.countLines(function (n) { $('selfn').textContent = n ? fmt(n) : 'thousands of'; show($('selfc')); }); }]]);
    },
    function () {
      P([['So where was the bottleneck?', 'think', function () { M.mood('wide'); M.hop(); }], ['Not the code. The idea.', 'proud', function () { show($('mkline')); }], { s: M, t: 'Imagination. Here too.', m: 'happy', al: 'br' }]);
    }
  ]
};

/* ================= ENERGY: a pile of reports becomes a story ================= */
var FRAG = ['supply: 2,170 MMcfd', 'demand: 3,800 MMcfd', '57% of demand met', '21 July: terminal fire', '17% of gas supply lost', '2 floating terminals', '30 to 37% of all gas', 'Qatar: deliveries halved', 'Strait of Hormuz closed', '29 gas fields', '20 still producing', 'Bibiyana: about half', 'load shedding, by zone', 'shortfall past 3,000 MW'];
(function () {
  var b = $('reports'); for (var i = 0; i < 52; i++) {
    var c = el('i', 'rep', '<u></u>' + FRAG[i % FRAG.length] + '<u></u><u></u>');
    c.style.setProperty('--x', (rnd(i, 1) * 600).toFixed(0) + 'px'); c.style.setProperty('--y', (rnd(i, 2) * 440).toFixed(0) + 'px'); c.style.setProperty('--r', ((rnd(i, 3) - .5) * 30).toFixed(1) + 'deg'); c.style.transitionDelay = (i * 28) + 'ms'; b.appendChild(c);
  }
})();
SC.energy = {
  ctx: 105, lead: [520, 1012, 15], al: 'bl', bw: 640, hello: [['Last one. My favourite.', 'happy']],
  enter: function () { $('reports').className = 'reports'; Q('#chain li').forEach(function (l) { l.classList.remove('show'); }); $('efan').classList.remove('show'); hide($('eline')); mirIn(1680, 1008, -1); },
  beats: [
    function () {
      P([['Not every story arrives pretty.', 'think', function () { $('reports').classList.add('rain'); }],
        ['This one arrived as more than 50 reports. Numbers. Dates.', 'wide'],
        { s: M, t: 'I read every one of them.', m: 'tired', al: 'br' }, ['Alone, each one is a yawn.', 'yawn']]);
    },
    function () {
      P([['So he looked for the thread.', 'think', function () { $('reports').classList.add('dimmed'); M.mood('think'); Q('#chain li').forEach(function (l, i) { later(function () { l.classList.add('show'); }, i * 380); }); }],
        ['Each step follows from the one before.', 'happy'], ['Now it is not a pile. It is a plot.', 'joy', function () { M.mood('happy'); }]]);
    },
    function () {
      P([['Then I built it.', 'proud', function () { $('reports').classList.add('gone'); $('efan').classList.add('show'); }],
        ['“Running on Empty.” It is live.', 'happy'], ['People scroll it because they want to know: okay, what is next?', 'joy']]);
    },
    function () { P([['The engine is new.', 'proud', function () { show($('eline')); }], ['The storytelling is still yours.', 'joy'], { s: M, t: 'Even the boring ones can come to life.', m: 'happy', al: 'br' }]); }
  ]
};

/* ================= FINALE: three messages. It plays by itself. ================= */
var NOTES = [['Martin da', 'We need to publish it today.'], ['Zyma apu', 'We need to make a few design changes'], ['Arshif bhai', 'Mir make the logo sticky']], runIv = null;
function notif(i) {
  var n = el('div', 'notif', '<i class="wa"></i><div><span>WhatsApp · now</span><b>' + NOTES[i][0] + '</b><p>' + NOTES[i][1] + '</p></div>');
  $('notifs').appendChild(n); void n.offsetWidth; n.classList.add('show');
}
function lookUp(s, m) { s.look('r'); s.mood(m); s.emote('!', 'red'); }
function runAway(s, u0, u1, x, y, dur, key) { s.hush(); s.el.style.zIndex = 1; s.mood('panic'); s.go(x, y, { dur: dur, ease: 'cubic-bezier(.5,0,.9,.6),linear' }); anim(u0, u1, dur * 1000, function (v) { s.size(v); }, key); }
function finale() {
  var H = [S[0], S[1], S[2], S[3]], T = function (ms, fn) { later(fn, ms); };
  hushAll(); L.mood('happy'); L.go(900, 992, { dur: 1.5 });
  T(1000, function () { notif(0); });
  T(1900, function () { L.stop(); L.el.classList.remove('walk'); L.face(1); lookUp(L, 'wide'); lookUp(M, 'wide'); });
  T(2700, function () { L.say('Today?', 1, 'bl'); });
  T(4300, function () { L.wear('bag shades'); L.mood('cool'); L.say('Easy. The tests are green.', 1, 'bl'); });
  T(6400, function () { M.mood('smug'); M.say('We have got this.', 1, 'br'); });
  T(9000, function () { notif(1); });
  T(9900, function () { hushAll(); L.wear('bag'); lookUp(L, 'panic'); L.say('Oh no.', 1, 'bl'); lookUp(M, 'shock'); M.arms('up'); });
  T(11000, function () { M.say('A FEW?!', 1, 'br shout'); });
  T(12300, function () { M.hush(); L.say('I need to run the tests one final time!', 1, 'bl'); });
  T(15300, function () { L.say('And change the dates! And the other files!', 1, 'bl'); H.forEach(function (s, i) { s.size(7).spawn(330 + i * 150 + (i > 1 ? 560 : 0), 1010, function () { lookUp(s, 'panic'); }); }); });
  T(17300, function () {
    L.hush(); H[0].say('Design changes?!', 1); H[3].say('WHICH files?!', 1); M.mood('panic');
    runIv = every(function () { H.forEach(function (s, i) { s.go(160 + rnd(i, tick) * 1600, 960 + rnd(i, tick + 3) * 60, { speed: 760 }); }); M.go(1250 + rnd(9, tick) * 420, 1004, { speed: 640 }); tick++; }, 620);
  });
  T(20600, function () {
    unsched(runIv); H.forEach(function (s) { s.hush(); }); L.say('RUN!', 1, 'bl shout');
  });
  T(21500, function () {
    runAway(L, 18, 3.6, 960, 664, 3.4, 'fl'); H.forEach(function (s, i) { later(function () { runAway(s, 7, 1.6, 900 + i * 40, 668, 3.2, 'fh' + i); }, 250 + i * 160); });
    M.go(1380, 1004, { speed: 700, face: -1 }); M.mood('wide'); M.arms();
  });
  T(25600, function () { notif(2); });
  T(26800, function () { L.mood('wide'); L.face(1); L.emote('!', 'red'); lookUp(M, 'shock'); });
  T(27600, function () { L.say('AGAIN?!!!!', 1, 'mid shout'); });
  T(29800, function () { L.hush(); L.mood('dizzy'); L.fall(); H.forEach(function (s) { s.poof(); }); M.say('…the logo.', 1, 'br'); });
  T(31300, function () { M.hush(); M.mood('sleep'); M.fall(); });
  T(32600, function () { show($('thanks')); L.say('/clear', 1, 'mid tiny'); hmsg('Context left until auto-compact: 0%', true, true); });
}
var tick = 0;
SC.finale = {
  ctx: 990, cap: 60000, lead: [640, 992, 18], al: 'bl', bw: 620, hello: [['Alright. The presentation is over.', 'happy']],
  enter: function () { $('notifs').innerHTML = ''; hide($('thanks')); tick = 0; unsched(runIv); mirIn(1380, 1004, -1, 12); setCtx(990); },
  beats: [
    function () {
      P([['And I have a TON of things to do for Martin da.', 'happy', function () { L.wear('bag'); }],
        { s: M, t: 'Martin da has a lot of ideas.', m: 'happy', al: 'br' },
        ['Somebody has to make them come true. Bye!', 'joy']]);
    },
    finale
  ]
};

D.boot();
})(window.D);
