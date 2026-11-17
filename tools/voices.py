"""Record every spoken line of the deck with neural voices (Microsoft, through the edge-tts package).

The deck is opened in real Chrome and every scene is played through the replay engine, so the list of
lines (who says it, the exact bubble text, the mood at that moment) comes from the deck itself. Each
line becomes deck/voice/<hash>.mp3, and deck/voice/lines.js lists them. Lines only reached by clicking
(data-say, the "Coming!" pool, helper introductions) are added from the source.

The text of the lines is sent to Microsoft's online speech service. Needs: pip install edge-tts.

usage: python tools/voices.py [url]              record everything (only what is missing; --all re-records)
       python tools/voices.py --audition [url]   a few lines in several voices -> deck/audition/
"""
import sys, re, json, asyncio, pathlib, shutil, subprocess
import edge_tts
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
DECK = ROOT / 'deck'; OUT = DECK / 'voice'
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
URL = ARGS[0] if ARGS else 'http://127.0.0.1:8000/'

# who speaks with which voice: (voice, rate %, pitch Hz)
CAST = {
    'lead': ('en-US-AvaMultilingualNeural', 0, 0),   # Mir's pick, 17 Nov (as heard on the audition page)
    'help': ('en-US-AvaMultilingualNeural', 12, 28),  # small copies of the mascot: the same voice, higher and faster
    'mir': ('en-US-AndrewMultilingualNeural', 2, 0),
}
# what a mood does to the delivery: (rate %, pitch Hz), added to the cast's own
MOOD = {
    'joy': (8, 14), 'fresh': (8, 14), 'happy': (3, 6), 'proud': (1, 4), 'smug': (-3, 2), 'cool': (-4, -4),
    'think': (-7, -3), 'read': (-4, -2), 'lens': (-4, 0), 'stern': (-7, -8), 'sad': (-12, -10), 'tired': (-18, -9),
    'yawn': (-22, -10), 'sleep': (-26, -12), 'dizzy': (-12, 5), 'confused': (-6, 7), 'wide': (6, 14),
    'panic': (20, 22), 'shock': (10, 16), 'boss': (10, 10), 'angry': (10, 5), 'cold': (-10, -6),
}
LOUD = (7, 10, 30)  # capitals or "?!": rate %, pitch Hz, volume %

HARVEST = """()=>{
  var out=[], seen={}, V=Clawd.voice, o=Clawd.prototype._say;
  function add(k,t,m){ if(!t) return; var h=V.hash(k+'|'+t); if(seen[h]) return; seen[h]=1; var s=V.speakable(t); out.push({h:h,k:k,t:t,s:s.text,loud:s.loud,m:m||''}); }
  Clawd.prototype._say=function(t,h,a){ add(V.kind(this),t,this.el.dataset.mood); return o.call(this,t,h,a); };
  var n=document.querySelectorAll('.slide').length;
  for(var i=0;i<n;i++) DECK.replay(i,null);
  Clawd.prototype._say=o;
  [].forEach.call(document.querySelectorAll('[data-say]'),function(e){ add('lead',e.dataset.say,'happy'); });
  window.__add=add; window.__out=out; window.__has=function(t){ return ['lead','help','mir'].some(function(k){ return seen[V.hash(k+'|'+t)]; }); };
  return out.length }"""

MOODS = set(MOOD) | {'idle', 'none'}


def static_lines():
    """Lines the replay never reaches: clicks, the command line. Read from the source."""
    src = (DECK / 'deck.js').read_text(encoding='utf-8') + '\n' + (DECK / 'scenes2.js').read_text(encoding='utf-8')
    q = r"""(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")"""
    un = lambda a, b: (a if a is not None and a != '' else b or '').replace("\\'", "'").replace('\\"', '"')
    got = []
    # ['text', 'mood' ...]  -> the lead
    for m in re.finditer(r"\[\s*" + q + r"\s*,\s*'([a-z]+)'", src):
        if m.group(3) in MOODS: got.append(('lead', un(m.group(1), m.group(2)), m.group(3)))
    # { s: M, t: 'text', m: 'mood' }
    for m in re.finditer(r"\{\s*s:\s*([A-Za-z0-9_\[\]]+)\s*,\s*t:\s*" + q + r"(?:\s*,\s*m:\s*'([a-z]+)')?", src):
        got.append(('mir' if m.group(1) == 'M' else 'help', un(m.group(2), m.group(3)), m.group(4) or ''))
    # X.lines = ['text']   (what a sprite says when it is clicked)
    for m in re.finditer(r"([A-Za-z0-9_\[\]]+)\.lines\s*=\s*(?:[A-Za-z0-9_\[\]]+\.lines\s*=\s*)?\[\s*" + q, src):
        got.append(('mir' if m.group(1) == 'M' else 'help', un(m.group(2), m.group(3)), 'happy'))
    # P('text') and .say('text'
    for m in re.finditer(r"\bP\(\s*" + q, src): got.append(('lead', un(m.group(1), m.group(2)), 'happy'))
    for m in re.finditer(r"\bL\.say\(\s*" + q, src): got.append(('lead', un(m.group(1), m.group(2)), ''))
    # the pools in the click handler
    for m in re.finditer(r"(?:GOING|pool)\s*=\s*\[([^\]]*)\]", src):
        for s in re.finditer(q, m.group(1)): got.append(('lead', un(s.group(1), s.group(2)), 'happy'))
    for m in re.finditer(r"line\s*=\s*" + q, src): got.append(('lead', un(m.group(1), m.group(2)), 'confused'))
    got.append(('help', 'Helper. Fresh memory, one job.', 'happy'))
    for m in re.finditer(r"\['[^']*',\s*'((?:Auto-accept|Plan mode|Default):[^']*)'\]", src): got.append(('lead', m.group(1), ''))
    # not a whole line: a placeholder, or half of a sentence that is glued to a number at run time
    return [(k, t, m) for k, t, m in got if t and len(t) > 1 and re.search(r'[A-Za-z]{2}', t) and not re.search(r'[<>{}=]|\\n', t)
            and t != 'text' and not t.endswith(' ') and not t.startswith('K of')]


async def harvest():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome')
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        await pg.goto(URL, wait_until='networkidle'); await pg.wait_for_timeout(1200)
        n = await pg.evaluate(HARVEST)
        extra = 0
        for k, t, m in static_lines():
            if not await pg.evaluate('(t)=>__has(t)', t):
                await pg.evaluate('(a)=>__add(a[0],a[1],a[2])', [k, t, m]); extra += 1
        lines = await pg.evaluate('__out'); await b.close()
        print(f'lines: {n} from the scenes + {extra} click and command lines = {len(lines)}')
        return lines


def delivery(L):
    v, r, p = CAST[L['k']]; mr, mp = MOOD.get(L['m'], (0, 0)); vol = 0
    r += mr; p += mp
    if L['loud']: r += LOUD[0]; p += LOUD[1]; vol = LOUD[2]
    return v, f'{r:+d}%', f'{p:+d}Hz', f'{vol:+d}%'


# The engine leaves about 0.15 s of silence before a line, 0.8 s after it and 0.7 s between sentences.
# Cut the ends and cap the pauses, so a line starts at once and the next one is not kept waiting.
TIGHT = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,'
         'silenceremove=stop_periods=-1:stop_duration=0.34:stop_silence=0.34:stop_threshold=-45dB,'
         'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse')


def tighten(path):
    tmp = path.with_suffix('.tmp.mp3')
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(path), '-af', TIGHT, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '56k', str(tmp)], capture_output=True)
    if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 800: tmp.replace(path)
    else: tmp.unlink(missing_ok=True)


async def record(text, voice, rate, pitch, vol, path, sem):
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=vol).save(str(path))
                if path.stat().st_size > 800:
                    if shutil.which('ffmpeg'): await asyncio.to_thread(tighten, path)
                    return True
            except Exception as e:
                err = e
            await asyncio.sleep(1 + attempt * 2)
        print('  FAILED', voice, repr(text), err if 'err' in dir() else ''); path.unlink(missing_ok=True); return False


async def main():
    lines = await harvest()
    OUT.mkdir(exist_ok=True)
    if '--all' in sys.argv:
        for f in OUT.glob('*.mp3'): f.unlink()
    want = {L['h'] for L in lines}
    for f in OUT.glob('*.mp3'):
        if f.stem not in want: f.unlink()  # a line that was re-worded or cut
    sem = asyncio.Semaphore(8); todo = [L for L in lines if not (OUT / (L['h'] + '.mp3')).exists()]
    print('recording', len(todo), 'of', len(lines))
    ok = await asyncio.gather(*[record(L['s'], *delivery(L), OUT / (L['h'] + '.mp3'), sem) for L in todo])
    have = [L for L in lines if (OUT / (L['h'] + '.mp3')).exists()]
    (OUT / 'lines.js').write_text('/* made by tools/voices.py: the lines that have a recording */\nwindow.VOICE=' +
                                  json.dumps({L['h']: 1 for L in have}, separators=(',', ':')) + ';\n', encoding='utf-8')
    (OUT / 'lines.json').write_text(json.dumps([dict(L, voice=delivery(L)) for L in have], ensure_ascii=False, indent=0), encoding='utf-8')
    size = sum(f.stat().st_size for f in OUT.glob('*.mp3'))
    print(f'recorded {sum(ok)} new, {len(have)} of {len(lines)} lines have a voice, {size / 1e6:.1f} MB in {OUT}')


AUD_LEAD = ['en-US-AnaNeural', 'en-US-AvaMultilingualNeural', 'en-US-EmmaMultilingualNeural', 'en-US-AriaNeural', 'en-GB-MaisieNeural', 'en-US-BrianMultilingualNeural']
AUD_MIR = ['en-US-AndrewMultilingualNeural', 'en-US-BrianMultilingualNeural', 'en-IN-PrabhatNeural', 'en-GB-RyanNeural', 'en-US-GuyNeural']
AUD_LINES = {
    'lead': [('Hi! On it.', 'joy', False), ('Want to see a secret?', 'happy', False), ('15 fail?!', 'panic', True), ('Getting heavy in here.', 'tired', False), ('Zero fail!', 'joy', True)],
    'mir': [('Where is the house style?!', 'angry', True), ('Logo a bit to the left.', '', False), ('I said do it yourself!', 'angry', True)],
}


async def audition():
    out = DECK / 'audition'; shutil.rmtree(out, ignore_errors=True); out.mkdir()
    sem = asyncio.Semaphore(8); jobs = []; rows = []
    for k, voices in (('lead', AUD_LEAD), ('mir', AUD_MIR)):
        for v in voices:
            cells = []
            for i, (t, m, loud) in enumerate(AUD_LINES[k]):
                L = {'k': k, 'm': m, 'loud': loud}; _, r, p, vol = delivery(L)
                if v != CAST[k][0]:  # the cast's own offsets only suit its own voice
                    mr, mp = MOOD.get(m, (0, 0)); r = f'{mr + (LOUD[0] if loud else 0):+d}%'; p = f'{mp + (LOUD[1] if loud else 0):+d}Hz'
                f = f'{k}-{v}-{i}.mp3'; jobs.append(record(t, v, r, p, vol, out / f, sem))
                cells.append(f'<button data-f="{f}">{t}</button>')
            rows.append(f'<h2>{"Mascot" if k == "lead" else "Mir"}: {v.split("-")[2].replace("Neural", "").replace("Multilingual", "")} <small>{v}{" (in the deck now)" if v == CAST[k][0] else ""}</small></h2><p>{"".join(cells)}</p>')
    await asyncio.gather(*jobs)
    (out / 'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Voice audition</title><style>body{font:18px system-ui;max-width:1000px;margin:40px auto;padding:0 20px;background:#101522;color:#eef}h2{font-size:20px;margin:28px 0 8px}small{font-weight:400;opacity:.6;font-size:14px}button{font:inherit;margin:0 8px 8px 0;padding:10px 16px;border-radius:8px;border:1px solid #556;background:#1c2438;color:#eef;cursor:pointer}button:hover{background:#2a3555}</style><h1>Voice audition</h1><p>Click a line to hear it. Tell Claude the name you want for the mascot and for Mir.</p>' +
                                  ''.join(rows) + '<script>var a=new Audio();document.addEventListener("click",function(e){var f=e.target.dataset&&e.target.dataset.f;if(f){a.src=f;a.play()}})</script>', encoding='utf-8')
    print('audition page:', URL + 'audition/')


asyncio.run(audition() if '--audition' in sys.argv else main())
