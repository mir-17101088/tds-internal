# >>> RESUME HERE (17 November 2026, about 4:30 AM, v3 built and pushed)

Internal Daily Star session "Vibe Coding", **today 17 Nov 2026, 2:30 PM**, 7th floor, on a big TV. Mir asked for the v3 rebuild in one long message, then slept. He authorised: work without asking, push to GitHub (`mir-17101088/tds-internal`), he deploys to Vercel himself.

## State
- **v3 is in `deck/`**: `index.html` (22 scenes + speaker notes), `deck.css` + `deck2.css`, `mascot.js` (mascot, helpers and Mir's low-poly avatar), `deck.js` (engine + the 13 older scenes), `scenes2.js` (the scenes with Mir in them + the ending). v1 kept as `deck/index-v1.html`.
- **Repo**: the clone is the folder `tds internal/` (remote `origin`, branch `main`). The site sits at the repo ROOT so Vercel needs no settings. Copy with `python tools/sync_repo.py`, then commit and push inside `tds internal/`.
- **Checked (17 Nov, real Chrome, 1920x1080)**: `python -I tools/smoke.py` plays all 22 scenes to the end and steps back through every press: 0 JS errors, back-step OK everywhere (314 presses). `python -I tools/ends.py <dir>` end-state screenshots of all 22 scenes: looked at, layout fixed.
- **NOT checked**: the screens in the middle of each scene press by press (bubble overlaps), the three worlds in `imagine`, the finale mid-run, 3840x2160, a timed rehearsal, the real TV and clicker. The 5-hour usage limit ran out; a scheduled task continues this after the reset.
- Talking points: each slide's `data-notes` (press N). `TALKING-POINTS.md` not written yet.

## Run it
```bash
python "C:/Users/Asus/Desktop/tds internal presentation/tools/serve.py" 8000
```
http://localhost:8000 · F fullscreen · the 1920x1080 stage scales to any screen (TV, 4K).

## Keys
- → / Space / Enter / clicker: next line. **← / PageUp / Backspace: ONE step back** (at the top of a scene: the end of the one before). `]` / `[` skip a scene forward / back. R restart scene.
- When the mascot asks Mir to type (harness: "Fix the hero on small phones.", cache: "continue"): really type + Enter, or press → and it types itself.
- 1-4 answer a dialog. `/` command line (`/clear` `/compact` …). N notes, ? keys, F fullscreen, M mute asides.

## How the engine works (do not undo)
- Every timer runs on the deck's own clock (`sched/pump/settle` in `deck.js`; the sprites use it through `Clawd.T`). The back arrow restarts the scene and replays the recorded actions (`HIST`) in one frame with `#stage.instant` killing transitions. New scene code must use `later()/every()` (never raw setTimeout for anything that changes state) and reset everything in `enter()`.
- One press = one spoken line (`P([...])`); `{ s: M, t, m, al, f }` is a line for Mir or a helper.

## Scenes (ids, in order; targets add to about 31 min)
open (Mir "screams": WHERE IS THE HOUSE STYLE) · under · harness (what a harness is; chat vs harness, Mir types) · tools (six tools, three makers) · loop (+ "Your hard rule, boss") · md (the .md files, the nudging, the review flood) · team · review (+ builder argues) · argue (Mir wrong, then Mir right) · fired · rot · clear · cheap · cache (54-minute rule, Mir types "continue", 400K illustration) · labs · skill · learn (Skill updated after every story; 61 / 14 / 47 step-synced demo) · you · imagine (space, forest, river) · making (how this deck was made) · energy (50+ reports to "Running on Empty") · finale (auto: Martin da, Zyma apu, Arshif bhai).

## Decisions (Mir; do not undo)
- Strictly internal Daily Star. Never mention any external client.
- **The mascot is the star and the narrator; Mir is the side character** (reads the .md files, nudges, argues, loses patience). Slide text is secondary.
- Opening: no byline, no "Vibe coding, engineered · Mir Rownak". Ending: no "Now: the two stories"; the finale plays by itself and the three WhatsApp cards stay on screen.
- Every new topic gets one line of context first (the `.def` line + the mascot's first lines).
- House look: Newsreader + IBM Plex, logo top-left, night slides, paper slides for skill/learn. No numbering, no uppercase eyebrow labels, no glow or grain. The mascot is the only orange; red = failure or shouting; Mir's bubbles are purple.
- Figures are real: 3,465 lines, 53 sizes / 0 fail, 61 cases / 14 convictions / 11-25-9-2 (Journalists `data/cases.csv`), energy numbers from the published page. Cache: 1-hour TTL, 54 = six minutes of margin, "about a tenth" for cached tokens is an illustration on a 400K session (labelled on the slide).
- The names in the finale (Martin da, Zyma apu, Arshif bhai) and their three messages are Mir's words; keep them exactly.

## Sources added in v3
- Mir's own `~/.claude/CLAUDE.md` (the hard rules quoted in loop, md, argue).
- `Desktop/journalists/story/data/cases.csv` and `source/story.md` (61, 14, status counts).
- https://campaign.thedailystar.net/energy-crisis/ (screenshots in `deck/img/energy-*.webp`, figures in the report sheets and the chain).

## Open
0. **Mir looked at the deck early on 17 Nov and saw overlaps. Top priority for the next session: go through EVERY scene press by press and fix every overlap properly (a bubble over text or a panel, a sprite over text, a panel over a panel), then check again.** Already removed at his request: the 'He asked me to draw it this way' line (open) and the Martin da WhatsApp nudge (making). Do not bring them back.
1. Mid-scene visual QA + 4K check (scheduled task `tds-deck-qa`), then `TALKING-POINTS.md`.
2. The talk is now about 30 minutes if every line is played. Shortest cuts: `fired`, `labs`, `cheap`, `tools` (press `]` to skip a scene).
3. Rehearse once with the clicker on the TV.
