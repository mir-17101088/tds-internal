"""Play the finale live and measure, twice a second, whether any speech bubble overlaps a WhatsApp card
or leaves the stage. usage: python -I tools/finale_check.py [out dir for 3 screenshots]"""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
JS = """()=>{const st=document.getElementById('stage').getBoundingClientRect(),R=e=>e.getBoundingClientRect(),out=[];
 const ns=[...document.querySelectorAll('.notif.show')].map(R),bs=[...document.querySelectorAll('.bubble.on')];
 bs.forEach(b=>{const r=R(b),t=b.textContent.slice(0,24);
  if(r.left<st.left-1||r.right>st.right+1||r.top<st.top-1||r.bottom>st.bottom+1)out.push('OFFSTAGE '+t);
  ns.forEach(n=>{const w=Math.min(r.right,n.right)-Math.max(r.left,n.left),h=Math.min(r.bottom,n.bottom)-Math.max(r.top,n.top);if(w>0&&h>0)out.push('OVERLAP '+t+' '+Math.round(w)+'x'+Math.round(h))})});
 return {out,notifs:ns.length,bubbles:bs.map(b=>b.textContent.slice(0,20)),nb:ns.length?Math.round(Math.max(...ns.map(n=>n.bottom))-st.top):0,nl:ns.length?Math.round(Math.min(...ns.map(n=>n.left))-st.left):0}}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome"); errs = []
        pg = await b.new_page(viewport={"width": 1920, "height": 1080}); pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("http://127.0.0.1:8000/#22", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        bad = set(); seen = set()
        for _ in range(4):
            await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(1300)
            r = await pg.evaluate(JS); bad.update(r['out']); seen.update(r['bubbles'])
        for k in range(74):
            await pg.wait_for_timeout(500); r = await pg.evaluate(JS); bad.update(r['out']); seen.update(r['bubbles'])
            if OUT and k in (22, 44, 73): OUT.mkdir(parents=True, exist_ok=True); await pg.screenshot(path=str(OUT / f"finale-{k}.jpg"), type="jpeg", quality=80)
        print("cards on screen at the end:", r['notifs'], "| cards reach y =", r['nb'], "and start at x =", r['nl'])
        print("lines seen:", len(seen)); print("problems:", sorted(bad) or "none"); print("errors", errs); await b.close()
asyncio.run(main())
