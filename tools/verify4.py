import sys, asyncio, pathlib, threading, functools, http.server
from playwright.async_api import async_playwright
S, D = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(D)); H.log_message=lambda *a: None
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 5294), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
OV="""()=>{const s=document.querySelector('.slide.on'),st=document.getElementById('stage').getBoundingClientRect(),out=[];
 s.querySelectorAll('*').forEach(e=>{const b=e.getBoundingClientRect();if(b.width&&b.height&&getComputedStyle(e).opacity!=='0'&&(b.right>st.right+1||b.bottom>st.bottom+1))out.push((e.className||e.tagName)+':'+Math.round(b.bottom-st.bottom))});return out.slice(0,5)}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome"); errs=[]
        for vw,vh,tag in [(1920,1080,"fhd"),(1366,768,"hd")]:
            pg = await b.new_page(viewport={"width":vw,"height":vh})
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type=="error" and errs.append(m.text))
            await pg.goto("http://127.0.0.1:5294/index.html#1", wait_until="networkidle"); await pg.wait_for_timeout(7500)
            if tag=="fhd": await pg.screenshot(path=str(S/"deck4"/"00-s1-slop.png"))
            presses=0
            while presses<120:
                sid = await pg.evaluate("document.querySelector('.slide.on').id")
                if tag=="fhd": await pg.screenshot(path=str(S/"deck4"/f"last-{int(sid[1:]):02d}.png"))
                ov = await pg.evaluate(OV)
                if ov: print(tag, sid, "overflow", ov)
                if sid=="s13" and await pg.evaluate("!document.getElementById('final').classList.contains('hid')"): break
                await pg.keyboard.press("ArrowRight"); presses+=1; await pg.wait_for_timeout(2200)
            print(tag,"presses",presses)
        print("errors", errs); await b.close()
asyncio.run(main())
