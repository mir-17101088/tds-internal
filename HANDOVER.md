# >>> RESUME HERE (17 November 2026, morning QA pass by the scheduled task `tds-deck-qa`, pushed)

## QA pass, 17 Nov morning (read this first)
**Checked (real Chrome, Playwright):**
- `tools/smoke.py`: 22 scenes, every line "OK", errors 0 (before and after the fixes).
- `tools/ends.py` contact sheets at 35%, 70% and the end of every scene; the end states again at 3840x2160 (the stage scales cleanly, same layout).
- **Every press of every scene** (298 presses) with the new `python -I tools/overlaps.py [scene ...]`: it steps back through each press and lists bubbles or sprites that cover slide text, another sprite, a WhatsApp card, or leave the stage. Before: 144 findings. After: 24, all listed under "left as is".
- Finale played live twice: `tools/finale_check.py` says "problems: none"; nine frames over 36 s looked at. The three cards stay, "Thank you." appears.
- The three worlds in `imagine` (space, forest, river) looked at.

**Fixed (positions and bubble widths only; no wording, order, names or figures changed):**
- `under`: mascot smaller and further right, so its bubble no longer covers "Plus 1,593 lines of build and QA scripts."
- `harness`: narrower bubbles, mascot a little left in the right lane; no bubble over Mir's head.
- `tools`: mascot 22 px lower; the bubble no longer covers the "Files" label.
- `loop`: the "Agentic loop" definition line moved to the right of the title (the mascot's bubble at the Plan station used to cover it for ten presses). The mascot now stands beside each station label, not on it (`LSTN`, `LBW` in `deck.js`), with narrow bubbles that stay off the failing-sizes count. The last beat's bubble sits above the mascot, not over "Plan" and the count.
- `md`: the two helpers' bubbles are right-anchored and narrow; they no longer cover the lead mascot or Mir.
- `team`: narrower bubble, clear of the plan list and the Haiku cards.
- `review`: the builder stands 12 px lower; the reviewer's bubble is narrower (clear of "6 failed or partly").
- `argue`: the mascot stops further left when it inspects the phone; no bubble over Mir's head.
- `fired`: the helper's bubble opens to the left, clear of the memory log.
- `cheap`: Opus, Sonnet and Haiku stand to the right of the text (Opus used to stand on "Haiku does the literal work."); the last bubble no longer hides "Keep the cache warm".
- `cache`: mascot at the far left, a little smaller, narrower bubble; the status line under the clock ("Warm." / "Six minutes left…" / "Cold…") is never covered. Mir's bubble narrower.
- `learn`: narrower mascot bubble (clear of the closing line); Mir further right (his bubble only touches the phone's bezel).
- `you`: mascot a little smaller with a one-line bubble; the pipeline labels are no longer covered.
- `imagine` (space): the idea headline moved below the floating mascot (the mascot used to sit on "The night sky over Dhaka").
- `making`: mascot and helpers moved right; the bubble no longer covers "Version one: text on slides."; the closing line moved 60 px right.
- `deck.js`: an image that fails to load gets one retry on page load (one of about 15 local loads showed five broken images once; 12 fresh loads afterwards were clean).

**Left as is (known, minor):**
- `loop`: Mir's bubbles ("Looks good. Push it…", "I SAID do it yourself!") cover two lines of the terminal log.
- `review`: the lead's bubble comes within 12 px of the builder's head (no visible overlap).
- `under`: bubbles pass over the scrolling code wall (decoration).
- `skill`: the mascot's bubble sits on the before/after picture. `making`: one bubble clips a corner of the version-one screenshot.
- `cache`, `harness`: while the type-it prompt is open, the command line covers the mascot's legs (it was like this before).
- `finale`: two helpers' bubbles cross each other for a moment during the panic run (cards never touched).

**NOT checked:** the real TV and clicker, a timed rehearsal, sound/asides, Vercel's live copy, clicking and dragging with a mouse (the before/after handle in `skill`, clicking sprites).

`TALKING-POINTS.md` is written (project folder only; `sync_repo.py` does not copy it to the repo).

---

# Earlier state (17 November 2026, about 4:30 AM, v3 built and pushed)

Internal Daily Star session "Vibe Coding", **today 17 Nov 2026, 2:30 PM**, 7th floor, on a big TV. Mir asked for the v3 rebuild in one long message, then slept. He authorised: work without asking, push to GitHub (`mir-17101088/tds-internal`), he deploys to Vercel himself.

## State
- **v3 is in `deck/`**: `index.html` (22 scenes + speaker notes), `deck.css` + `deck2.css`, `mascot.js` (mascot, helpers and Mir's low-poly avatar), `deck.js` (engine + the 13 older scenes), `scenes2.js` (the scenes with Mir in them + the ending). v1 kept as `deck/index-v1.html`.
- **Repo**: the clone is the folder `tds internal/` (remote `origin`, branch `main`). The site sits at the repo ROOT so Vercel needs no settings. Copy with `python tools/sync_repo.py`, then commit and push inside `tds internal/`.
- **Checked (17 Nov, real Chrome, 1920x1080)**: `python -I tools/smoke.py` plays all 22 scenes to the end and steps back through every press: 0 JS errors, back-step OK everywhere (314 presses). `python -I tools/ends.py <dir>` end-state screenshots of all 22 scenes: looked at, layout fixed.
- Mid-scene, press-by-press, finale and 4K checks: done in the morning QA pass (top of this file). Still not checked: a timed rehearsal, the real TV and clicker.
- Talking points: each slide's `data-notes` (press N) and `TALKING-POINTS.md`.

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

- Finale (Mir, 17 Nov): bigger mascot (u 22) and bigger WhatsApp cards; **a speech bubble must never overlap a card**. Cards own the top-right; the mascot and helpers use right-anchored ('br') bubbles that end left of x = 1100; Mir's bubble stays below the cards. `python -I tools/finale_check.py` measures it.

## Sources added in v3
- Mir's own `~/.claude/CLAUDE.md` (the hard rules quoted in loop, md, argue).
- `Desktop/journalists/story/data/cases.csv` and `source/story.md` (61, 14, status counts).
- https://campaign.thedailystar.net/energy-crisis/ (screenshots in `deck/img/energy-*.webp`, figures in the report sheets and the chain).

## Open
0. Overlap pass done on 17 Nov morning (see the top; `python -I tools/overlaps.py` repeats it). Already removed at his request: the 'He asked me to draw it this way' line (open) and the Martin da WhatsApp nudge (making). Do not bring them back.
1. Done: mid-scene visual QA, 4K check, `TALKING-POINTS.md`.
2. The talk is now about 30 minutes if every line is played. Shortest cuts: `fired`, `labs`, `cheap`, `tools` (press `]` to skip a scene).
3. Rehearse once with the clicker on the TV.
