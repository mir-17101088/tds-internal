# Vibe Coding, Engineered

An internal Daily Star talk on how an interactive story gets made, told by the agent that builds them.
It is one static web page: open `index.html` over HTTP. No build step, nothing loaded from outside.

- `index.html`, `deck.css`, `deck2.css`, `mascot.js`, `deck.js`, `scenes2.js`, `fonts/`, `img/`: the deck (repo root, so Vercel serves it as is).
- `tools/`: local server and QA scripts (Python + Playwright). `source/`, `archive/`: the one-prompt draft and the first text-only deck.
- `HANDOVER.md`: state, keys, decisions.

Keys: right arrow next line, left arrow one step back, F fullscreen, N notes, ? all keys.

Design and build: Mir Rownak, The Daily Star, with Claude Code.
