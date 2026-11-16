"""Exercise the non-clicker interactions against the running deck (tools/serve.py on :8000).
usage: python -I tools/interact.py <out dir>
Checks: click-to-run, poking the mascot, slash commands, /clear from the rot scene,
dialog number keys, Esc interrupt, Shift+Tab modes, an unknown command."""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8000/index.html"
BUB = "(()=>{const b=document.querySelector('#cast .clawd .bubble');return b.classList.contains('on')?b.textContent:''})()"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome"); errs = []; res = []
        pg = await b.new_page(viewport={"width": 1920, "height": 1080})
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        def ok(name, cond, extra=''): res.append(('PASS ' if cond else 'FAIL ') + name + (' | ' + str(extra) if extra != '' else ''))

        # click-to-run and poke, in the loop scene
        await pg.goto(URL + "#4", wait_until="networkidle"); await pg.wait_for_timeout(2600)
        x0 = await pg.evaluate("DECK.L.x")
        await pg.mouse.click(1300, 990); await pg.wait_for_timeout(300)
        said = await pg.evaluate(BUB); await pg.wait_for_timeout(1800)
        x1 = await pg.evaluate("DECK.L.pos().x")
        ok('click: mascot runs to the point', abs(x1 - 1300) < 12 and x0 != x1, (round(x0), round(x1))); ok('click: mascot says something', len(said) > 2, said)
        box = await pg.evaluate("(()=>{const r=document.querySelector('#cast .clawd .hit').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()")
        await pg.mouse.click(box[0], box[1]); await pg.wait_for_timeout(900)
        ok('poke: mascot answers', len(await pg.evaluate(BUB)) > 4, await pg.evaluate(BUB))
        await pg.mouse.click(300, 190); await pg.wait_for_timeout(2600)
        ok('click headline: its own line', 'check my own work' in await pg.evaluate(BUB), await pg.evaluate(BUB))
        await pg.screenshot(path=str(OUT / "i1-click.jpg"), type="jpeg", quality=75)

        # Esc, Shift+Tab, slash commands
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(900)
        ok('Esc: interrupted', 'Interrupted' in await pg.evaluate("document.getElementById('hmsg').textContent"))
        m0 = await pg.evaluate("document.getElementById('hmode').textContent")
        await pg.keyboard.press("Shift+Tab"); await pg.wait_for_timeout(500)
        m1 = await pg.evaluate("document.getElementById('hmode').textContent")
        ok('Shift+Tab: mode cycles', m0 != m1, m1)
        c0 = await pg.evaluate("DECK.state().ctx")
        await pg.keyboard.type("/comp"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=str(OUT / "i2-cmd.jpg"), type="jpeg", quality=75)
        await pg.keyboard.press("Tab"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(900)
        c1 = await pg.evaluate("DECK.state().ctx")
        ok('/compact: context shrinks', c1 < c0, (c0, c1))
        await pg.keyboard.type("/foo"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(700)
        ok('unknown command reported', 'Unknown command' in await pg.evaluate("document.getElementById('hmsg').textContent"))

        # dialog number key
        await pg.goto(URL + "#4", wait_until="networkidle"); await pg.evaluate("location.reload()"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(2200)
        for _ in range(60):
            if await pg.evaluate("DECK.state().ask"): break
            await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(900)
        ok('permission box is up', (await pg.evaluate("DECK.state().ask")))
        await pg.keyboard.press("1"); await pg.wait_for_timeout(1200)
        ok('key 1 answers Yes', 'Published' in await pg.evaluate("document.getElementById('log').textContent"))
        await pg.screenshot(path=str(OUT / "i3-ask.jpg"), type="jpeg", quality=75)

        # /clear typed in the rot scene jumps to the rebirth
        await pg.goto(URL + "#8", wait_until="networkidle"); await pg.evaluate("location.reload()"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(2400)
        for _ in range(4): await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(900)
        b1 = await pg.evaluate(BUB); await pg.wait_for_timeout(6000); b2 = await pg.evaluate(BUB)
        ok('a line stays up until the next press', len(b1) > 2 and b1 == b2, b1)
        await pg.keyboard.type("/clear"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(9000)
        st = await pg.evaluate("DECK.state()")
        ok('/clear from rot: fresh session', st['scene'] == 'clear' and st['ctx'] == 30 and await pg.evaluate("document.getElementById('clear').classList.contains('fresh')"), st)
        await pg.screenshot(path=str(OUT / "i4-clear.jpg"), type="jpeg", quality=75)
        # going back and forward mid-scene must not break anything
        await pg.keyboard.press("ArrowLeft"); await pg.wait_for_timeout(1500); await pg.keyboard.press("r"); await pg.wait_for_timeout(1500)
        for _ in range(6): await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500)
        ok('rapid presses survive', (await pg.evaluate("DECK.state().scene")) in ('rot', 'clear'), await pg.evaluate("DECK.state()"))
        print('\n'.join(res)); print('errors', errs); await b.close()
asyncio.run(main())
