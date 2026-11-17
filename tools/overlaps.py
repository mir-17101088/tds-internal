"""Press-by-press overlap check: steps back through every press of every scene and reports where a
speech bubble or a sprite covers slide text, another sprite, or leaves the stage.
usage: python -I tools/overlaps.py [scene id ...]"""
import sys, asyncio
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ONLY = sys.argv[1:]
JS = """()=>{const R=e=>e.getBoundingClientRect(),st=R(document.getElementById('stage')),out=[];
 const vis=e=>e.checkVisibility({opacityProperty:true,visibilityProperty:true});
 const ov=(a,b)=>{const w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);return w>6&&h>6?Math.round(w)+'x'+Math.round(h):''};
 const sl=document.querySelector('.slide.on'),texts=[];
 const tw=document.createTreeWalker(sl,NodeFilter.SHOW_TEXT);let n;
 while(n=tw.nextNode()){const s=n.textContent.trim();if(!s)continue;const p=n.parentElement;if(!vis(p)||p.closest('.rep,.ucode,.world,.road,.filler'))continue;
  const cs=getComputedStyle(p);if(+cs.opacity<.5)continue;let a=p,dim=1;while(a&&a!==sl){dim*=+getComputedStyle(a).opacity;a=a.parentElement}if(dim<.5)continue;
  const r=document.createRange();r.selectNodeContents(n);for(const q of r.getClientRects())if(q.width>2)texts.push([q,s.slice(0,26),p.className||p.tagName]);}
 const sprites=[...document.querySelectorAll('.clawd:not(.gone)')];
 const bubs=[...document.querySelectorAll('.clawd:not(.gone) .bubble.on')];
 bubs.forEach(b=>{const r=R(b),t=b.textContent.slice(0,22);
  if(r.left<st.left-1||r.right>st.right+1||r.top<st.top-1||r.bottom>st.bottom+1)out.push('OFFSTAGE bubble "'+t+'" '+Math.round(r.left)+','+Math.round(r.top)+'-'+Math.round(r.right)+','+Math.round(r.bottom));
  const seen={};texts.forEach(x=>{const o=ov(r,x[0]);if(o&&!seen[x[1]]){seen[x[1]]=1;out.push('BUBBLE "'+t+'" over text "'+x[1]+'" ['+x[2]+'] '+o)}});
  sprites.forEach(s=>{if(s.contains(b))return;const h=s.querySelector('.hit');const o=ov(r,R(h));if(o)out.push('BUBBLE "'+t+'" over sprite '+(s.className.includes('mir')?'Mir':'mascot')+' '+o)});
  bubs.forEach(c=>{if(c!==b&&ov(r,R(c)))out.push('BUBBLE "'+t+'" over bubble')});
  document.querySelectorAll('.notif.show').forEach(c=>{if(ov(r,R(c)))out.push('BUBBLE "'+t+'" over card')});});
 sprites.forEach(s=>{const h=R(s.querySelector('.hit'));const who=s.className.includes('mir')?'Mir':'mascot';const seen={};
  texts.forEach(x=>{const o=ov(h,x[0]);if(o&&!seen[x[1]]){seen[x[1]]=1;out.push('SPRITE '+who+' over text "'+x[1]+'" ['+x[2]+'] '+o)}})});
 return out}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width": 1920, "height": 1080})
        await pg.goto("http://127.0.0.1:8000/", wait_until="networkidle"); await pg.wait_for_timeout(1200)
        n = await pg.evaluate("document.querySelectorAll('.slide').length"); total = 0
        for i in range(n):
            st = await pg.evaluate("(i)=>{DECK.replay(i,null);return DECK.state()}", i)
            if ONLY and st['scene'] not in ONLY: continue
            found = {}
            for k in range(st['hist'], -1, -1):
                await pg.wait_for_timeout(260)
                for line in await pg.evaluate(JS): found.setdefault(line, []).append(k)
                if k: await pg.keyboard.press("ArrowLeft")
            print(f"== {st['scene']} ({st['hist']} presses): {len(found)}")
            for line, ks in found.items(): print("  press", ",".join(map(str, sorted(ks))), line)
            total += len(found)
        print("total", total); await b.close()
asyncio.run(main())
