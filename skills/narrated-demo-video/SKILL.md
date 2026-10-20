---
name: narrated-demo-video
description: Use when asked to make a narrated demo, walkthrough, promo, or explainer video of a web app or website (e.g. "make a demo video of this app", "record a walkthrough", "create a promo video from my repo"). Produces a scripted, voiced, captioned MP4 driven entirely from code — no screen recording, editing timeline, or voice talent.
---

# Narrated Demo Video

## Overview

Produce a scripted, narrated, captioned demo video of a web app entirely from
code. Playwright drives the live app and records the footage, edge-tts renders
the narration, PIL renders branded title cards, and two ffmpeg passes assemble
the final MP4 (1920x1080, 30 fps, H.264 + AAC).

**Core principle: narration drives everything.** You write the script as short
numbered "beats" (one per shot), render each to mp3, measure its duration, then
fit every video segment and card to its beat. The picture is fitted to the
sound, not the other way around — which is why the voiceover never cuts off and
never drifts.

## When to use

- Demo / walkthrough / promo / explainer video of a **web app or website**.
- You have (or can reach) a live URL Playwright can drive.
- You want it reproducible: re-render after any script edit, no manual editing.

**Not for:** desktop/native apps, videos of a person, or anything without a
browser-reachable UI. For a quick silent screen-grab GIF, use the browser
automation `gif_creator` instead — this skill is the full narrated production.

## Setup

Scaffold a `video/` dir in the target repo and copy in the six templates:

```
video/
  capture_demo.py      templates/capture_demo.py   -> adapt SCENARIOS + BASE
  make_cards.py        templates/make_cards.py      -> adapt BRAND TOKENS + copy
  gen_timeline.py      templates/gen_timeline.py    -> adapt SEGS + AUX
  assemble.py          templates/assemble.py        -> copy as-is (name OUT)
  voiceover/
    make_vo.py         templates/make_vo.py         -> copy as-is (pick VOICE)
    vo_script.md       templates/vo_script.md       -> write the narration
  assets/{fonts,brand,music,photos,sfx}/             -> fetch, keep licenses
  captures/  cards/  captions/                        -> generated
```

The `templates/` also ship `assets/fonts/` (Source Serif 4) and `assets/brand/`
(Miami + Ohio BWC logos) — copy those alongside for a Miami project.

Prereqs: Python with `playwright` (`playwright install chromium`), `edge-tts`,
`Pillow`, `matplotlib`; `ffmpeg`/`ffprobe` on PATH. Assets need credit-able
licenses (see the outro card): CC-BY music (incompetech.com), demo photos with
metadata (Wikimedia Commons API), and a display font matching the product.

## Workflow

0. **Establish branding** (see `references/branding-discovery.md`). If it is a
   **Miami University** project (or the user says so), keep the built-in Miami
   defaults — Miami Red field, Source Serif 4 titles, Miami logo on the intro —
   and edit only the copy; the BWC funder logo is available (`logo=BWC_LOGO`)
   but off by default. For any **other** product, discover its colors, fonts,
   and logo from the repo/live site and write them into `make_cards.py`.
1. **Recon** the app: `python capture_demo.py --recon` for full-page
   screenshots; read the DOM to find real selectors.
2. **Write `vo_script.md`** — one beat per shot, `**vNN_name** — text`. Write
   for the ear (see the script template's TTS conventions). This is the spine;
   do it before choreographing footage.
3. **Adapt `capture_demo.py`** — one `sc_<name>` per shot. **Overshoot dwell
   times**: too-long trims freely, too-short forces slow motion.
4. **Capture + transcode**: run it, then transcode each `.webm` to a 30 fps
   mezzanine `.mp4` (command in the capture template's docstring).
5. **Render VO**: `python voiceover/make_vo.py` → mp3s + `vo_durations.json`.
6. **Make cards**: apply the branding from step 0 (tokens, fonts, `LOGO`) and
   the copy, then `python make_cards.py`. Eyeball `cards/intro.png` +
   `cards/outro.png` for logo contrast and title fit.
7. **Find cut points**: render a tile sheet per capture (8 cols ⇒ tile N =
   second N), read timestamps straight off it, fill the `SEGS` table.
8. **Generate timeline**: `python gen_timeline.py` — prints the QC table and
   emits `filter.txt`, `captions/`, `vo_delays.json`, `inputs.json`.
9. **Assemble**: `python assemble.py` → the MP4.

**Iteration loop:** any narration edit ⇒ rerun `make_vo.py` → `gen_timeline.py`
→ `assemble.py`. The VO renderer caches by text hash, so only changed beats
re-render.

## Gotchas that will bite (hard-won, all handled in the templates)

| Symptom | Fix |
|---|---|
| Cursor overlay / init scripts silently do nothing | Strict CSP (`script-src 'self'`) blocks eval. Use `bypass_csp=True`; poll locators from Python, never `wait_for_function`. |
| Wait misses a fast/cached response | Detect completion by a **durable** state change (a result element that stays), never a transient spinner/stop button. |
| `context.request.get()` fails on a cert the browser accepts | Node vs Chromium trust stores differ. Fetch bytes **in-page** (`page.evaluate` + JS `fetch` + base64). |
| Dictation/voice can't be shown on camera | Launch Chromium with `--use-file-for-fake-audio-capture=<wav>%noloop` + fake-ui flags; grant `microphone`; click the app's real Dictate button. |
| Music cuts off early / whole mix truncates | `amix=duration=first` truncates at the music length. Loop music with `aloop` for the full runtime first. |
| Narration inaudible under music | Duck music under speech with `sidechaincompress`; premix all VO to one `vo_track.wav` so the final pass has two audio inputs. |
| A segment auto-slowed to ugly slow-motion | The window was shorter than its beat. Widen the capture window or shorten the beat; keep auto-rate ≥ ~0.7x. |
| Video shows something it must not say / submits real data | Skip UI naming off-limits things; never submit feedback/forms against production. |

## QC before shipping

- Read `gen_timeline.py`'s table: check total runtime, no segment slowed below
  ~0.7x, every `dur` covers its beat (`vod` + 0.8).
- `ffprobe` the mp4: 1920x1080, 30 fps, expected duration, `+faststart`.
- Extract a frame at each segment midpoint; confirm the caption matches screen.
- `volumedetect` slices where narration, aux voices, and the music tail play.
- Watch it end to end once — only human eyes catch narration-to-action feel.

## Reference

- `references/branding-discovery.md` — how to source colors, fonts, logo, copy,
  and credits from a repo/live site, plus the reusable **Miami University**
  profile (bundled defaults + logos). Read before making cards.
- `references/pipeline-guide.md` — the full worked write-up from the original
  SIGHT Bot production (4:13 video): exact scripts, audio-mix rationale, every
  scenario. Read when a template comment isn't enough.
