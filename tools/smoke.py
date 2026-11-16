"""Fast check: load the deck, play every scene to its end through the replay engine, then step back
through each one. Reports JS errors and the final state of every scene.
usage: python -I tools/smoke.py [url]"""
import sys, asyncio
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome"); errs = []
        pg = await b.new_page(viewport={"width": 1920, "height": 1080})
        pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e))); pg.on("console", lambda m: m.type == "error" and errs.append("CONSOLE " + m.text))
        await pg.goto(URL, wait_until="networkidle"); await pg.wait_for_timeout(1500)
        n = await pg.evaluate("document.querySelectorAll('.slide').length"); print("scenes", n)
        for i in range(n):
            st = await pg.evaluate("(i)=>{DECK.replay(i,null);return DECK.state()}", i)
            await pg.wait_for_timeout(120)
            backs = 0
            for _ in range(st['hist']):
                await pg.keyboard.press("ArrowLeft"); backs += 1
            s2 = await pg.evaluate("DECK.state()")
            ok = s2['scene'] == st['scene'] and s2['hist'] == 0
            print(f"{i+1:2d} {st['scene']:8s} presses={st['hist']:2d} step={st['step']}/{st['beats']} ask={st['ask']} prompt={st['prompt']} | back x{backs} -> hist={s2['hist']} {'OK' if ok else 'BACK-FAIL ' + str(s2)}")
        print("errors", len(errs)); [print(" ", e) for e in errs[:20]]
        await b.close()
asyncio.run(main())
