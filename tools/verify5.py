"""Step through every line of the deck in real Chrome.
usage: python -I tools/verify5.py <out dir> <deck dir> [scene,scene...|-] [width height]
Presses the right arrow through each scene (one press = one spoken line), screenshots after
every press, reports JS errors and anything that leaves the stage, then writes 3x3 contact sheets."""
import sys, asyncio, pathlib, threading, http.server
from playwright.async_api import async_playwright
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
OUT, D = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
ONLY = [s for s in sys.argv[3].split(',') if s] if len(sys.argv) > 3 and sys.argv[3] != '-' else None
VW, VH = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (1920, 1080)
OUT.mkdir(parents=True, exist_ok=True)
for f in OUT.glob('*.jpg'): f.unlink()

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(D), **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 5295), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
ORDER = ['open', 'under', 'harness', 'loop', 'team', 'review', 'fired', 'rot', 'clear', 'labs', 'cheap', 'skill', 'you']
# beats whose action takes a while before the mascot speaks: (scene, beat index about to start) -> ms
SLOW = {('open', 0): 4400, ('open', 3): 3600, ('clear', 3): 5200, ('clear', 4): 2600, ('skill', 0): 3400, ('fired', 1): 2600, ('team', 3): 2400, ('cheap', 0): 2600, ('cheap', 2): 2600}
OV = """()=>{const st=document.getElementById('stage').getBoundingClientRect(),out=[];
 const chk=(e)=>{const b=e.getBoundingClientRect();if(!b.width||!b.height)return;const cs=getComputedStyle(e);if(cs.opacity==='0'||cs.visibility==='hidden')return;
   if(b.right>st.right+2||b.bottom>st.bottom+2||b.left<st.left-2||b.top<st.top-2)out.push((e.id||e.className||e.tagName)+' '+Math.round(b.left-st.left)+','+Math.round(b.top-st.top)+' '+Math.round(b.width)+'x'+Math.round(b.height)+' :: '+e.textContent.slice(0,30))};
 document.querySelectorAll('.slide.on h2,.slide.on p,.slide.on li,.slide.on .panel,.slide.on .card,.bubble.on,#ask.on,#cmd.on,#hud,.clawd:not(.gone) .hit,.clawd:not(.gone) .ctag').forEach(chk);return out.slice(0,6)}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome"); errs = []
        pg = await b.new_page(viewport={"width": VW, "height": VH})
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        n = 0; presses = 0
        for sc in (ONLY or ['open']):
            await pg.goto(f"http://127.0.0.1:5295/index.html#{ORDER.index(sc)+1}", wait_until="networkidle")
            await pg.evaluate("location.reload()"); await pg.wait_for_load_state("networkidle")
            await pg.wait_for_timeout(5600 if sc == 'open' else 2600)
            while presses < 320:
                st = await pg.evaluate("DECK.state()")
                await pg.screenshot(path=str(OUT / f"{n:03d}-{st['scene']}-{st['step']}-{st['q']}{'-ask' if st['ask'] else ''}.jpg"), type="jpeg", quality=72); n += 1
                ov = await pg.evaluate(OV)
                if ov and not (st['scene'] == 'open' and st['step'] in (1, 4) and all('hit' in o for o in ov)): print(st['scene'], st['step'], st['q'], 'OUTSIDE', ov)
                done = st['step'] >= st['beats'] and not st['ask'] and st['q'] == 0
                if done and (ONLY or st['scene'] == 'you'): break
                await pg.keyboard.press("ArrowRight"); presses += 1
                newbeat = st['q'] == 0 and not st['ask']
                await pg.wait_for_timeout(2400 if done else (SLOW.get((st['scene'], st['step']), 2300) if newbeat else 1500))
        print("presses", presses, "shots", n); print("errors", errs); await b.close()
    files = sorted(OUT.glob('[0-9]*.jpg')); tw, th = 640, 360
    for i in range(0, len(files), 9):
        sheet = Image.new('RGB', (tw * 3, th * 3), (0, 0, 0))
        for k, f in enumerate(files[i:i + 9]):
            sheet.paste(Image.open(f).resize((tw, th), Image.LANCZOS), ((k % 3) * tw, (k // 3) * th))
        sheet.save(OUT / f"sheet-{i // 9:02d}.jpg", quality=80)
    print("sheets", (len(files) + 8) // 9)
asyncio.run(main())
