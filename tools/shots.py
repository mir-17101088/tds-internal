import sys, asyncio
from playwright.async_api import async_playwright
OUT = sys.argv[1]
SITES = {"journalists": "https://campaign.thedailystar.net/journalist-killed-1972-2026/",
         "river": "https://campaign.thedailystar.net/river-erosion/"}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        for name, url in SITES.items():
            for tag, vw, vh, mob in [("d", 1600, 1000, False), ("m", 390, 844, True)]:
                ctx = await b.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=2 if mob else 1, is_mobile=mob, has_touch=mob)
                pg = await ctx.new_page()
                await pg.goto(url, wait_until="networkidle", timeout=60000)
                await pg.wait_for_timeout(2500)
                await pg.screenshot(path=f"{OUT}/{name}-{tag}.png")
                if tag == "d":
                    h = await pg.evaluate("document.documentElement.scrollHeight")
                    for i, frac in enumerate([0.12, 0.3, 0.55]):
                        await pg.evaluate(f"window.scrollTo(0, {int(h*frac)})")
                        await pg.wait_for_timeout(1800)
                        await pg.screenshot(path=f"{OUT}/{name}-d{i+1}.png")
                    print(name, await pg.title())
                await ctx.close()
        await b.close()
asyncio.run(main())
