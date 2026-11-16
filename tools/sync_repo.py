"""Copy the deck into the GitHub clone ('tds internal/'), site files at the repo root so Vercel needs no settings.
usage: python tools/sync_repo.py   (then commit and push inside 'tds internal/')"""
import shutil, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = ROOT / 'tds internal'
DECK = ROOT / 'deck'
for f in ['index.html', 'deck.css', 'deck2.css', 'mascot.js', 'deck.js', 'scenes2.js']:
    shutil.copy2(DECK / f, REPO / f)
for d in ['fonts', 'img']:
    shutil.copytree(DECK / d, REPO / d, dirs_exist_ok=True)
(REPO / 'archive').mkdir(exist_ok=True)
shutil.copy2(DECK / 'index-v1.html', REPO / 'archive' / 'index-v1.html')
for d in ['tools', 'source']:
    shutil.copytree(ROOT / d, REPO / d, dirs_exist_ok=True)
shutil.copy2(ROOT / 'HANDOVER.md', REPO / 'HANDOVER.md')
(REPO / '.vercelignore').write_text('tools\nsource\narchive\nHANDOVER.md\nREADME.md\n', encoding='utf-8')
(REPO / 'README.md').write_text('''# Vibe Coding, Engineered

An internal Daily Star talk on how an interactive story gets made, told by the agent that builds them.
It is one static web page: open `index.html` over HTTP. No build step, nothing loaded from outside.

- `index.html`, `deck.css`, `deck2.css`, `mascot.js`, `deck.js`, `scenes2.js`, `fonts/`, `img/`: the deck (repo root, so Vercel serves it as is).
- `tools/`: local server and QA scripts (Python + Playwright). `source/`, `archive/`: the one-prompt draft and the first text-only deck.
- `HANDOVER.md`: state, keys, decisions.

Keys: right arrow next line, left arrow one step back, F fullscreen, N notes, ? all keys.

Design and build: Mir Rownak, The Daily Star, with Claude Code.
''', encoding='utf-8')
print('synced to', REPO)
