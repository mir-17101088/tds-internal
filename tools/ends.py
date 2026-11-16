"""Screenshot a chosen step of every scene (default: its end state) and write 2x2 contact sheets.
usage: python -I tools/ends.py <out dir> [frac 0..1 of each scene's presses, default 1] [width height]"""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
FR = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
VW, VH = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (1920, 1080)
for f in OUT.glob('*.jpg'): f.unlink()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome"); errs = []
        pg = await b.new_page(viewport={"width": VW, "height": VH})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("http://127.0.0.1:8000/", wait_until="networkidle"); await pg.wait_for_timeout(1200)
        n = await pg.evaluate("document.querySelectorAll('.slide').length")
        for i in range(n):
            st = await pg.evaluate("(i)=>{DECK.replay(i,null);return DECK.state()}", i)
            back = round(st['hist'] * (1 - FR))
            for _ in range(back): await pg.keyboard.press("ArrowLeft")
            await pg.wait_for_timeout(1100)
            await pg.screenshot(path=str(OUT / f"{i+1:02d}-{st['scene']}.jpg"), type="jpeg", quality=80)
        print("errors", errs); await b.close()
    files = sorted(OUT.glob('[0-9]*.jpg')); tw, th = 960, 540
    for i in range(0, len(files), 4):
        sheet = Image.new('RGB', (tw * 2, th * 2), (0, 0, 0))
        for k, f in enumerate(files[i:i + 4]): sheet.paste(Image.open(f).resize((tw, th), Image.LANCZOS), ((k % 2) * tw, (k // 2) * th))
        sheet.save(OUT / f"sheet-{i // 4:02d}.jpg", quality=78)
    print("sheets", len(files))
asyncio.run(main())
