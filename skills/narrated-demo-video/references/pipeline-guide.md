# Making a Narrated Demo Video of a Web App

This guide documents the pipeline that produced `sightbot/SIGHT_Bot_Demo.mp4`
(4:13, 1920x1080, 30 fps, H.264 + AAC), a fully scripted, narrated demo of the
SIGHT Machine Safety Assistant recorded live from https://sight.fsb.miamioh.edu/.
Every step is reproducible from the five Python scripts embedded at the end of
this file. No manual screen recording, editing timeline, or voice talent is
involved: Playwright drives the app and records the footage, edge-tts renders
the narration, PIL renders the title cards, and two generated ffmpeg passes
assemble the final video.

## The idea in one paragraph

Narration drives everything. You write the script as short numbered "beats"
(one beat per shot), render each beat to mp3, and measure its duration. The
timeline generator then sizes every video segment and title card to exactly
fit its beat (duration = narration + 0.4 s lead + 0.4 s tail), retiming
footage when a captured window is shorter or longer than its narration. This
is why the voiceover never cuts off and never drifts: the picture is fitted
to the sound, not the other way around.

## Pipeline and run order

```
capture_demo.py     Playwright drives the live app, records .webm per scenario
   |                (transcode to 30 fps mezzanine .mp4 with ffmpeg afterward)
voiceover/make_vo.py    edge-tts renders vo_script.md beats -> mp3 + durations
make_bot_cards.py   PIL renders branded 1920x1080 intro/part/recap/outro cards
gen_timeline.py     durations + measured cut points -> filter.txt, captions/,
   |                vo_delays.json (incl. aux audio), inputs.json
assemble.py         pass 1: premix narration + aux clips -> vo_track.wav
                    pass 2: cards + mezzanines + music + vo_track -> final mp4
```

Any narration edit means rerunning: `make_vo.py` → `gen_timeline.py` →
`assemble.py`. The VO renderer caches by text hash, so only changed beats
re-render.

## Prerequisites

- Python env with `playwright` (`playwright install chromium`), `edge-tts`,
  and for the cards `Pillow` + `matplotlib` (matplotlib only locates the
  bundled DejaVu fonts).
- `ffmpeg`/`ffprobe` on PATH.
- Assets, all with licenses you can credit on the outro card:
  - Music: a Kevin MacLeod CC BY track from incompetech.com
    (`curl -o music.mp3 "https://incompetech.com/music/royalty-free/mp3-royaltyfree/<Title>.mp3"`).
  - Demo photos: Wikimedia Commons API search returns URLs plus license and
    author metadata in one call.
  - Title fonts matching the product (here Source Serif 4 TTFs from the
    adobe-fonts GitHub release, matching the webapp's own face).

## Writing the narration (vo_script.md)

One beat per line, `**vNN_name** — text`. Conventions that make neural TTS
sound right: commas force letter-by-letter ("U, R, 5, E"; "miami, O, H"),
spell out numbers ("two hundred seventy"), and respell words the voice
mangles. Keep beats 4 to 16 seconds; a section card only needs "Part one.
Ask anything." Narrator voice: `en-US-AndrewMultilingualNeural` at rate -5%.
A second voice (`en-US-AvaNeural`) plays the "user" in the dictation shot:

```
edge-tts --voice en-US-AvaNeural --rate="-4%" --text "<question>" --write-media q.mp3
ffmpeg -i q.mp3 -af "adelay=300:all=1,apad=pad_dur=0.5" -ar 48000 -ac 1 -c:a pcm_s16le user_question.wav
```

## Capturing footage that narrates well

`capture_demo.py` records each scenario in its own browser context (fresh
session, clean conversation) at a 1920x1080 viewport, with an injected cursor
dot so viewers can follow the mouse, human-paced typing (~42 ms/key), eased
mouse glides, and generous dwell time after every state change. Overshoot the
dwell times: footage that is too long trims freely, footage that is too short
forces slow motion.

Hard-won specifics, all reflected in the embedded script:

- **Strict CSP**: a site with `script-src 'self'` blocks Playwright's
  string-eval waits and init scripts. Use `bypass_csp=True` on the context and
  poll locators from Python instead of `wait_for_function`.
- **Real dictation on camera**: launch Chromium with
  `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream
  --use-file-for-fake-audio-capture=<user_question.wav>%noloop` and grant the
  microphone permission. Clicking the app's Dictate button then records the
  WAV through the app's real speech-to-text path, and the transcript lands in
  the UI on camera.
- **Fast answers race naive waits**: detect answer completion by a durable
  state change (here: a new "Listen to this answer" button), never by a
  transient spinner or stop button that can appear and vanish between polls.
- **Node vs Chromium trust stores**: `context.request.get()` can fail on a
  cert chain the browser itself accepts. Fetch inside the page
  (`page.evaluate` + JS fetch + base64) when you need bytes the session can see.
- **Choreograph outcomes**: for the quiz shot the script reads the app's own
  question JSON and answers 4 of 5 correctly, missing one non-critical
  question on purpose so the results page demonstrates the review link.
- **Mind what is on screen**: skip UI that names things the video must not
  mention, and never submit feedback forms against production.

Transcode captures to constant-30 fps mezzanines before cutting:
`ffmpeg -i x.webm -vf "fps=30,scale=1920:1080:flags=lanczos" -c:v libx264 -crf 18 -preset fast -an x.mp4`.

## Finding cut points

Render one tile sheet per capture and read timestamps straight off it
(8 columns, so tile N = second N):

```
ffmpeg -i x.mp4 -vf "fps=1,scale=320:180,tile=8x5:margin=4:padding=4" -frames:v 1 tiles_x.png
```

Then fill in the `SEGS` table in `gen_timeline.py`. Each row is
`(name, kind, input, window, vo_beat, caption, rate, extra_tail)`:

- `window` is the source-seconds slice of the mezzanine.
- `rate=None` trims at 1x, or slows automatically if the window is shorter
  than the narration. Explicit rates are allowed both ways: we run cursor-work
  segments at 1.17x to 1.5x for snap, and the dictation segment at 0.75x so
  the audible question fits inside the on-screen recording.
- `extra_tail` buys silent screen time after a beat (used to make room for
  the dictated question and the read-aloud sample).
- Captions are burned in bottom-center from text files (avoids ffmpeg quote
  escaping) and state one fact each.

Aux audio (the user's voice, a sample of the app's own read-aloud) is defined
next to `SEGS` and lands in `vo_delays.json`; the premix places it exactly
like a narration beat, so it ducks the music the same way.

## Audio mix

The generated audio graph loops the music for the full runtime (`aloop` -
without it, `amix=duration=first` truncates everything at the music's
length), normalizes it to about -22 LUFS, ducks it under speech with
`sidechaincompress` (threshold 0.02, ratio 8), and holds it at 0.15 volume.
Narration premixes to a single `vo_track.wav` so the final pass has exactly
two audio inputs.

## QC checklist before shipping

- `gen_timeline.py` prints the table: check the total, check no segment was
  auto-slowed below ~0.7x, and check every `dur` covers its beat (`vod`+0.8).
- ffprobe the mp4: 1920x1080, 30 fps, expected duration, faststart.
- Extract frames at each segment midpoint and confirm the caption matches
  what is on screen.
- `volumedetect` short slices where narration, aux voices, and the outro
  music tail should be audible.
- Watch it end to end once; only human eyes catch narration-to-action feel.

## The scripts

Adapt names, selectors, scenario bodies, card copy, and the `SEGS` table to
the next product; the architecture transfers unchanged.

### capture_demo.py

```python
"""Capture SIGHT Bot demo footage from the live site with Playwright.

Each scenario runs in its own browser context (fresh session, clean
conversation) and records a .webm into captures/<name>/. The dictation
scenario feeds a pre-rendered WAV through Chromium's fake microphone so the
real Deepgram round-trip happens on camera.

Usage (from video/sightbot, in the `sightbot` conda env):
    python capture_demo.py                 # all scenarios
    python capture_demo.py --only voice    # one scenario
    python capture_demo.py --recon         # screenshot-only sanity check
"""

import argparse
import json
import shutil
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://sight.fsb.miamioh.edu"
HERE = Path(__file__).resolve().parent
CAPTURES = HERE / "captures"
SFX = HERE / "assets" / "sfx"
USER_WAV = SFX / "user_question.wav"
MILL_PHOTO = HERE / "assets" / "photos" / "bridgeport_mill_cc_by_sa_dan_bollinger.jpg"
QUIZ_JSON = HERE.parents[1] / "webapp" / "sight_web" / "quizzes" / "ur5e_quiz.json"

VIEW = {"width": 1920, "height": 1080}

# A visible cursor so viewers can follow interactions (Playwright renders none).
CURSOR_JS = """
(() => {
  const attach = () => {
    if (!document.body || document.getElementById('__pw_cursor')) return;
    const c = document.createElement('div');
    c.id = '__pw_cursor';
    Object.assign(c.style, {
      position: 'fixed', left: '-50px', top: '-50px', width: '22px', height: '22px',
      border: '3px solid #C41230', background: 'rgba(196,18,48,0.28)',
      borderRadius: '50%', pointerEvents: 'none', zIndex: '2147483647',
      transform: 'translate(-50%,-50%)', boxShadow: '0 1px 6px rgba(0,0,0,0.35)',
      transition: 'width 0.12s, height 0.12s, background 0.12s'
    });
    document.body.appendChild(c);
    document.addEventListener('mousemove', e => {
      c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
    }, true);
    document.addEventListener('mousedown', () => {
      c.style.background = 'rgba(196,18,48,0.65)';
      c.style.width = '30px'; c.style.height = '30px';
    }, true);
    document.addEventListener('mouseup', () => {
      c.style.background = 'rgba(196,18,48,0.28)';
      c.style.width = '22px'; c.style.height = '22px';
    }, true);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else { attach(); }
})();
"""


def settle(seconds):
    time.sleep(seconds)


def glide_to(page, locator, pause=0.35):
    """Ease the mouse to the element's center before interacting."""
    locator.scroll_into_view_if_needed()
    settle(0.2)
    box = locator.bounding_box()
    if box:
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=28)
    settle(pause)


def click_slow(page, locator, pause_after=0.8):
    glide_to(page, locator)
    locator.click(delay=90)
    settle(pause_after)


def type_slow(page, locator, text):
    click_slow(page, locator, pause_after=0.4)
    page.keyboard.type(text, delay=42)
    settle(0.6)


def smooth_scroll(page, total, step=70, tick=0.03):
    """Wheel-scroll by `total` px (negative scrolls up) in small increments."""
    remaining = abs(total)
    sign = 1 if total > 0 else -1
    while remaining > 0:
        delta = min(step, remaining)
        page.mouse.wheel(0, sign * delta)
        remaining -= delta
        time.sleep(tick)


def wait_answer(page, prev_listen, timeout=150):
    """An answer is complete when a new 'Listen to this answer' button exists
    and #stop-button is hidden. Robust to instant cached-tutorial answers that
    finish before the Stop button can be observed."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if (page.locator(".listen").count() > prev_listen
                and page.locator("#stop-button").is_hidden()):
            settle(1.0)
            return
        time.sleep(0.5)
    raise RuntimeError("answer never completed")


def goto_home(page):
    page.goto(BASE, wait_until="networkidle")
    settle(2.0)
    page.mouse.move(960, 300, steps=15)


# --------------------------------------------------------------------------
# Scenarios
# --------------------------------------------------------------------------

def sc_home_tour(page, ctx):
    """Branding, tabs, welcome, suggestions, footer credits."""
    goto_home(page)
    settle(2.5)
    glide_to(page, page.locator(".site-titles h1"), pause=1.8)
    glide_to(page, page.locator(".site-nav a", has_text="Training"), pause=1.0)
    glide_to(page, page.locator(".site-nav a", has_text="Chat"), pause=1.0)
    glide_to(page, page.locator(".welcome"), pause=1.5)
    pills = page.locator(".suggestion")
    glide_to(page, pills.nth(0), pause=1.2)
    glide_to(page, pills.nth(2), pause=1.2)
    smooth_scroll(page, 2200)
    settle(3.0)  # footer: grant credit, version, BWC logo
    smooth_scroll(page, -2200)
    settle(1.5)


def sc_text_chat(page, ctx):
    """Typed question, streamed answer, Stop button, conversation tools."""
    goto_home(page)
    type_slow(page, page.locator("#question"),
              "What are the most common hazards when operating the TL-1 lathe?")
    prev = page.locator(".listen").count()
    click_slow(page, page.locator("#send-button"), pause_after=0.5)
    wait_answer(page, prev)
    settle(1.0)
    smooth_scroll(page, -600)
    settle(1.5)
    smooth_scroll(page, 1400)
    settle(1.0)
    tools = page.locator(".conversation-tools")
    glide_to(page, tools.locator("a", has_text="Download PDF"), pause=1.6)
    glide_to(page, tools.locator("a", has_text="Download Markdown"), pause=1.2)
    settle(1.0)


def sc_voice(page, ctx):
    """Dictation through the fake mic, then read-aloud with speed control."""
    goto_home(page)
    dictate = page.locator("#dictate-button")
    dictate.wait_for(state="visible", timeout=15000)
    click_slow(page, dictate, pause_after=0.3)   # starts recording; WAV plays
    settle(6.5)                                   # WAV is ~5.1 s + margin
    click_slow(page, dictate, pause_after=0.3)   # stop -> transcribe
    deadline = time.time() + 30
    while time.time() < deadline:
        if len(page.locator("#question").input_value().strip()) > 10:
            break
        time.sleep(0.5)
    else:
        raise RuntimeError("dictation transcript never arrived")
    print("    transcript:", page.locator("#question").input_value())
    settle(2.5)                                   # let viewers read transcript
    prev = page.locator(".listen").count()
    click_slow(page, page.locator("#send-button"), pause_after=0.5)
    wait_answer(page, prev)
    settle(1.0)
    listen = page.locator(".listen").last
    click_slow(page, listen, pause_after=2.5)     # native player appears
    speed = page.locator(".listen-speed select")
    glide_to(page, speed, pause=0.5)
    speed.select_option("1.25")
    settle(3.5)                                   # audio keeps playing
    # Save the actual Aura TTS clip so it can be mixed under the final cut.
    # Fetched inside the page: Chromium trusts the site cert, Node does not.
    src = page.locator(".listen-player audio").get_attribute("src")
    if src:
        b64 = page.evaluate(
            """async (src) => {
              const r = await fetch(src);
              const bytes = new Uint8Array(await r.arrayBuffer());
              let bin = '';
              for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
              return btoa(bin);
            }""", src)
        import base64
        (SFX / "aura_answer.mp3").write_bytes(base64.b64decode(b64))
        print(f"    saved aura_answer.mp3 ({len(b64) * 3 // 4 / 1e3:.0f} kB)")
    settle(1.0)


def sc_photo(page, ctx):
    """Photo upload -> machine identification -> cached step-by-step guide."""
    goto_home(page)
    photo_input = page.locator("#photo")
    glide_to(page, page.locator(".photo-label"), pause=1.0)
    photo_input.set_input_files(str(MILL_PHOTO))
    settle(1.5)
    type_slow(page, page.locator("#question"),
              "What should I check before starting this machine?")
    click_slow(page, page.locator("#send-button"), pause_after=0.5)
    page.wait_for_selector(".tutorial-identified", timeout=150000)
    settle(1.0)
    ident = page.locator(".tutorial-identified")
    glide_to(page, ident, pause=2.5)              # "Machine identified..."
    smooth_scroll(page, 900)
    settle(2.0)
    smooth_scroll(page, 1200)
    settle(2.0)


def sc_training(page, ctx):
    """Training index, UR5e pre-op guide, one-step stepper, arrow keys."""
    page.goto(BASE + "/training", wait_until="networkidle")
    settle(2.5)
    smooth_scroll(page, 700)
    settle(1.5)
    smooth_scroll(page, 900)
    settle(1.5)
    smooth_scroll(page, -1600)
    settle(0.8)
    guide = page.locator(".guide-link",
                         has_text="What should I check before starting the UR5e robot?")
    click_slow(page, guide, pause_after=2.0)
    page.wait_for_selector(".stepper-counter", timeout=15000)
    settle(1.0)
    smooth_scroll(page, 500)                      # step 1: schematic + caution
    settle(3.0)
    page.keyboard.press("ArrowRight")
    settle(3.0)
    page.keyboard.press("ArrowRight")
    settle(3.0)
    counter = page.locator(".stepper-counter").first
    glide_to(page, counter, pause=1.5)            # "Step 3 of 7"
    toggle = page.locator(".stepper-toggle")
    click_slow(page, toggle, pause_after=1.5)     # "Show all steps"
    smooth_scroll(page, 1800, step=90, tick=0.02)
    settle(1.5)


def sc_quiz(page, ctx):
    """Readiness check: 4/5 with one instructive miss deep-linking to a step."""
    answers = {q["id"]: q for q in json.loads(QUIZ_JSON.read_text(encoding="utf-8"))["questions"]}
    page.goto(BASE + "/training/ur5e/quiz", wait_until="networkidle")
    settle(2.5)
    full = page.locator(".guide-link", has_text="Full readiness check")
    click_slow(page, full, pause_after=2.0)
    page.wait_for_selector(".quiz-question", timeout=15000)

    fieldsets = page.locator(".quiz-question")
    groups = []
    for i in range(fieldsets.count()):
        name = fieldsets.nth(i).locator("input[type=radio]").first.get_attribute("name")
        groups.append(name)
    missed = None
    for i, name in enumerate(groups):
        qid = name[2:]  # strip "q_"
        q = answers[qid]
        pick = q["answer_index"]
        # One deliberate miss on the first non-critical question after the first.
        if missed is None and i > 0 and not q.get("critical"):
            pick = (q["answer_index"] + 1) % len(q["options"])
            missed = qid
        radio = page.locator(f"input[name='{name}'][value='{pick}']")
        click_slow(page, radio, pause_after=0.6)
    settle(0.8)
    click_slow(page, page.locator(".quiz-questions button[type=submit]"), pause_after=1.5)
    page.wait_for_selector(".quiz-verdicts", timeout=15000)
    settle(2.0)
    wrong = page.locator(".quiz-verdict-incorrect").first
    glide_to(page, wrong, pause=3.0)
    review = wrong.locator("a", has_text="Review this step")
    click_slow(page, review, pause_after=1.0)
    page.wait_for_selector(".tutorial-step", timeout=15000)
    settle(3.5)                                   # landed on the teaching step


SCENARIOS = {
    "home_tour": sc_home_tour,
    "text_chat": sc_text_chat,
    "voice": sc_voice,
    "photo": sc_photo,
    "training": sc_training,
    "quiz": sc_quiz,
}


def launch_args():
    wav = str(USER_WAV).replace("\\", "/")
    return [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        f"--use-file-for-fake-audio-capture={wav}%noloop",
        "--autoplay-policy=no-user-gesture-required",
    ]


def run(names, recon=False):
    CAPTURES.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=launch_args())
        if recon:
            ctx = browser.new_context(viewport=VIEW)
            page = ctx.new_page()
            page.goto(BASE, wait_until="networkidle")
            time.sleep(2)
            page.screenshot(path=str(CAPTURES / "recon_home.png"), full_page=False)
            dictate_visible = page.locator("#dictate-button").is_visible()
            print(f"recon: dictate button visible = {dictate_visible}")
            page.screenshot(path=str(CAPTURES / "recon_full.png"), full_page=True)
            ctx.close()
            browser.close()
            return
        for name in names:
            print(f"--- capturing {name}")
            outdir = CAPTURES / name
            if outdir.exists():
                shutil.rmtree(outdir)
            ctx = browser.new_context(
                viewport=VIEW,
                record_video_dir=str(outdir),
                record_video_size=VIEW,
                bypass_csp=True,  # the app's script-src 'self' blocks our cursor overlay
            )
            ctx.grant_permissions(["microphone"], origin=BASE)
            ctx.add_init_script(CURSOR_JS)
            page = ctx.new_page()
            try:
                SCENARIOS[name](page, ctx)
                settle(1.5)  # post-roll
            finally:
                video = page.video
                ctx.close()
                if video:
                    path = Path(video.path())
                    final = CAPTURES / f"{name}.webm"
                    if final.exists():
                        final.unlink()
                    shutil.move(str(path), str(final))
                    shutil.rmtree(outdir, ignore_errors=True)
                    print(f"    saved {final.name} "
                          f"({final.stat().st_size / 1e6:.1f} MB)")
        browser.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated scenario names")
    ap.add_argument("--recon", action="store_true", help="screenshots only")
    args = ap.parse_args()
    wanted = args.only.split(",") if args.only else list(SCENARIOS)
    unknown = set(wanted) - set(SCENARIOS)
    if unknown:
        raise SystemExit(f"unknown scenario(s): {', '.join(sorted(unknown))}")
    run(wanted, recon=args.recon)

```

### make_vo.py

```python
"""Render the voiceover beats in vo_script.md to mp3 via edge-tts.

Parses lines of the form  **vNN_name** — text  and writes vNN_name.mp3 next to
this script. Skips beats whose text is unchanged since the last render (cached
in .vo_cache.json). Run with the sightbot conda python.
"""
import asyncio
import hashlib
import json
import os
import re
import subprocess

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = "en-US-AndrewMultilingualNeural"
RATE = "-5%"
CACHE = os.path.join(HERE, ".vo_cache.json")

BEAT_RE = re.compile(r"^\*\*(v\d+\w*)\*\*\s+[-—]+\s+(.*\S)\s*$")


def parse_script():
    beats = []
    with open(os.path.join(HERE, "vo_script.md"), encoding="utf-8") as f:
        for line in f:
            m = BEAT_RE.match(line.strip())
            if m:
                beats.append((m.group(1), m.group(2)))
    return beats


async def render(name, text):
    out = os.path.join(HERE, name + ".mp3")
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(out)
    return out


def duration(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True)
    return float(r.stdout.strip())


def main():
    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE) as f:
            cache = json.load(f)
    beats = parse_script()
    durs = {}
    for name, text in beats:
        h = hashlib.sha1((VOICE + RATE + text).encode()).hexdigest()
        out = os.path.join(HERE, name + ".mp3")
        if cache.get(name) != h or not os.path.exists(out):
            asyncio.run(render(name, text))
            cache[name] = h
            print(f"rendered {name}")
        durs[name] = round(duration(out), 2)
    with open(CACHE, "w") as f:
        json.dump(cache, f, indent=1)
    with open(os.path.join(HERE, "vo_durations.json"), "w") as f:
        json.dump(durs, f, indent=1)
    for n, d in durs.items():
        print(f"{n}: {d}s")


if __name__ == "__main__":
    main()

```

### make_bot_cards.py

```python
"""Miami-branded intro/part/recap/outro cards (1920x1080) for the SIGHT Bot demo.

Palette follows the webapp brand tokens: Miami Red #C41230 field, warm white
#FAF9F7 titles. Titles are set in Source Serif 4 (the app's own display face,
assets/fonts/); labels and body use DejaVu Sans from matplotlib. List cards
use a left-aligned block with numbered chips or square bullets and measured
word-wrap, replacing the DT video's centered plain lines.

Run with the sightbot conda python from video/sightbot/; writes cards/*.png.
"""
import os

from PIL import Image, ImageDraw, ImageFont
import matplotlib

HERE = os.path.dirname(os.path.abspath(__file__))
CARDS = os.path.join(HERE, "cards")
FONTS = os.path.join(HERE, "assets", "fonts")
RENDERS = os.path.join(HERE, "..", "..", "webapp", "sight_web", "static", "img", "machines")
os.makedirs(CARDS, exist_ok=True)

W, H = 1920, 1080
RED = (196, 18, 48)          # Miami Red #C41230
WARM = (250, 249, 247)       # warm white #FAF9F7
BODY = (247, 224, 228)       # warm tint for body text
FAINT = (236, 200, 207)      # labels, credits

SERIF_SB = os.path.join(FONTS, "SourceSerif4-Semibold.ttf")
SERIF_BD = os.path.join(FONTS, "SourceSerif4-Bold.ttf")
SANS_BD = os.path.join(matplotlib.get_data_path(), "fonts", "ttf", "DejaVuSans-Bold.ttf")
SANS_RG = os.path.join(matplotlib.get_data_path(), "fonts", "ttf", "DejaVuSans.ttf")


def serif(sz, bold=False):
    return ImageFont.truetype(SERIF_BD if bold else SERIF_SB, sz)


def sans(sz, bold=False):
    return ImageFont.truetype(SANS_BD if bold else SANS_RG, sz)


def ctext(d, y, text, f, fill):
    b = d.textbbox((0, 0), text, font=f)
    d.text(((W - (b[2] - b[0])) / 2 - b[0], y), text, font=f, fill=fill)


def tracked(d, y, text, f, fill, tracking=6):
    """Centered text with letter-spacing, for small-caps style labels."""
    widths = [d.textlength(ch, font=f) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (W - total) / 2
    for ch, w in zip(text, widths):
        d.text((x, y), ch, font=f, fill=fill)
        x += w + tracking


def new_card():
    img = Image.new("RGB", (W, H), RED)
    return img, ImageDraw.Draw(img)


def machine_tiles(img, y, tile_w=380, tile_h=300, gap=48):
    """Three warm-white rounded tiles holding the app's machine renders."""
    keys = ["mill", "tl1", "ur5e"]
    total = 3 * tile_w + 2 * gap
    x = (W - total) // 2
    d = ImageDraw.Draw(img)
    for key in keys:
        d.rounded_rectangle([x, y, x + tile_w, y + tile_h], radius=26, fill=WARM)
        render = Image.open(os.path.join(RENDERS, f"{key}.webp")).convert("RGBA")
        pad = 20
        render.thumbnail((tile_w - 2 * pad, tile_h - 2 * pad), Image.LANCZOS)
        rx = x + (tile_w - render.width) // 2
        ry = y + (tile_h - render.height) // 2
        img.paste(render, (rx, ry), render)
        x += tile_w + gap


def wrap(d, text, f, max_w):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if d.textlength(trial, font=f) <= max_w:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def intro():
    img, d = new_card()
    machine_tiles(img, 150)
    ctext(d, 545, "SIGHT Machine Safety Assistant", serif(76, bold=True), WARM)
    ctext(d, 700, "Ask a question. Hear the answer. Train step by step.", sans(37), BODY)
    ctext(d, 790, "Miami University  ·  SIGHT Project", sans(31), FAINT)
    img.save(os.path.join(CARDS, "intro.png"))


def section(name, label, title, sub):
    img, d = new_card()
    tracked(d, 372, label, sans(30, bold=True), FAINT)
    ctext(d, 448, title, serif(72, bold=True), WARM)
    ctext(d, 596, sub, sans(35), BODY)
    # short accent rule between label and title
    d.rectangle([W / 2 - 60, 340, W / 2 + 60, 345], fill=WARM)
    img.save(os.path.join(CARDS, name + ".png"))


def list_card(name, label, title, items, marker="num", top=190):
    """Left-aligned list block: numbered chips (or square bullets), a bold
    lead-in per item, and measured word-wrap with a hanging indent."""
    img, d = new_card()
    d.rectangle([W / 2 - 60, top - 32, W / 2 + 60, top - 27], fill=WARM)
    tracked(d, top, label, sans(30, bold=True), FAINT)
    ctext(d, top + 74, title, serif(66, bold=True), WARM)

    block_w = 1460
    x0 = (W - block_w) // 2
    chip_r = 26
    text_x = x0 + 2 * chip_r + 40
    max_w = x0 + block_w - text_x
    f_lead, f_body = sans(33, bold=True), sans(33)
    line_h = 46
    gap = 34

    # wrap every item once, then center the whole block below the title
    wrapped = [wrap_rich(d, lead, rest, f_lead, f_body, max_w) for lead, rest in items]
    heights = [max(len(lines) * line_h, 2 * chip_r) for lines in wrapped]
    total_h = sum(heights) + gap * (len(items) - 1)
    content_top = top + 190
    avail = (H - 60) - content_top
    y = content_top + max(0, (avail - total_h) // 2)

    for i, (lines, item_h) in enumerate(zip(wrapped, heights)):
        cy = y + chip_r
        if marker == "num":
            d.ellipse([x0, y, x0 + 2 * chip_r, y + 2 * chip_r], fill=WARM)
            n = str(i + 1)
            f_n = sans(29, bold=True)
            b = d.textbbox((0, 0), n, font=f_n)
            d.text((x0 + chip_r - (b[2] - b[0]) / 2 - b[0],
                    cy - (b[3] - b[1]) / 2 - b[1]), n, font=f_n, fill=RED)
        else:
            s = 16
            d.rectangle([x0 + chip_r - s / 2, cy - s / 2,
                         x0 + chip_r + s / 2, cy + s / 2], fill=WARM)
        ty = y + max(0, (2 * chip_r - len(lines) * line_h) // 2) + 2
        for segs in lines:
            tx = text_x
            for text, f, fill in segs:
                d.text((tx, ty), text, font=f, fill=fill)
                tx += d.textlength(text + " ", font=f)
            ty += line_h
        y += item_h + gap
    img.save(os.path.join(CARDS, name + ".png"))


def wrap_rich(d, lead, rest, f_lead, f_body, max_w):
    """Wrap 'lead rest' where lead is bold warm and rest is regular tint.
    Returns a list of lines; each line is a list of (text, font, fill) runs."""
    words = [(w, f_lead, WARM) for w in lead.split()] + \
            [(w, f_body, BODY) for w in rest.split()]
    lines, line, used = [], [], 0.0
    for word, f, fill in words:
        w_len = d.textlength(word + " ", font=f)
        if line and used + w_len > max_w:
            lines.append(line)
            line, used = [], 0.0
        # merge consecutive same-style words into one run for cleaner spacing
        if line and line[-1][1] is f:
            line[-1] = (line[-1][0] + " " + word, f, fill)
        else:
            line.append((word, f, fill))
        used += w_len
    if line:
        lines.append(line)
    return lines


def outro():
    img, d = new_card()
    ctext(d, 200, "Created by the SIGHT Team", serif(70, bold=True), WARM)
    ctext(d, 330, "Miami University", sans(44), BODY)
    ctext(d, 470, "Try it now", sans(30, bold=True), FAINT)
    ctext(d, 522, "sight.fsb.miamioh.edu", serif(56, bold=True), WARM)
    ctext(d, 680, "Funded by the Ohio Bureau of Workers' Compensation", sans(35, bold=True), WARM)
    ctext(d, 745, "Workforce Safety Innovation Center  ·  Grant WSIC26-250206-009", sans(29), BODY)
    ctext(d, 960, 'Music: "Deliberate Thought" by Kevin MacLeod (incompetech.com), licensed CC BY 4.0',
          sans(21), FAINT)
    ctext(d, 998, "Mill photo: Dan Bollinger, Wikimedia Commons, CC BY-SA 4.0"
          "  ·  Narration: Microsoft neural text-to-speech", sans(21), FAINT)
    img.save(os.path.join(CARDS, "outro.png"))


if __name__ == "__main__":
    intro()
    list_card("what", "BEFORE THE TOUR", "What is SIGHT Bot?", [
        ("A free web chatbot", "for machine safety, live at sight.fsb.miamioh.edu"),
        ("Grounded answers:", "OEM manuals, OSHA regulations, and NIOSH guidance"),
        ("Three machines:", "Bridgeport manual mill, Haas TL-1 CNC lathe, and the UR5e cobot"),
        ("Nothing to install:", "type, speak, or attach a photo from any browser"),
    ], marker="dot")
    list_card("why", "WHY WE BUILT IT", "Safety is part of production", [
        ("The problem:", "in Ohio manufacturing, contact with machines and equipment "
         "accounts for over half of workers' compensation claims"),
        ("Our approach:", "put each machine's safety knowledge one question away, "
         "before, during, and after a shift"),
        ("Part of SIGHT:", "the same assistant that powers our VR and AR safety training"),
    ], marker="dot")
    section("part1", "PART 1", "Ask Anything",
            "Type a question  ·  watch the answer stream in  ·  keep the conversation")
    section("part2", "PART 2", "Speak and Listen",
            "Dictate a question  ·  hear any answer read aloud")
    section("part3", "PART 3", "Show It a Machine",
            "Attach a photo  ·  SIGHT Bot identifies the machine and answers")
    section("part4", "PART 4", "Train and Check Yourself",
            "Six step-by-step guides  ·  readiness checks that teach")
    list_card("recap", "WHAT SIGHT BOT DELIVERS", "In your browser today", [
        ("Six training guides,", "written from the OEM manuals and reviewed by the SIGHT team"),
        ("Readiness checks,", "eighty questions in total, every miss linked back to its teaching step"),
        ("Grounded chat answers", "with live streaming, PDF export, and draft protection"),
        ("Voice in and out:", "server-side dictation and read-aloud at five speeds"),
        ("Photo recognition", "that matches your machine to its safety guide"),
        ("Accessible by design:", "works without JavaScript and targets WCAG 2.2 AA"),
    ], marker="num")
    outro()
    print("cards written to", CARDS)

```

### gen_timeline.py

```python
"""Compute the segment timeline from measured VO durations and emit:
  - filter.txt        (video+audio filter graph for the final ffmpeg pass)
  - captions/*.txt    (drawtext textfiles, avoids escaping issues)
  - vo_delays.json    (per-beat start times + aux clips for the VO premix)
  - inputs.json       (ordered ffmpeg input manifest for assemble.py)
  - a printed timeline table

Same architecture as the DT video's generator: target = vo + lead + tail
(+ extra). Cards hold exactly target; video windows trim at 1x or retime via
an explicit rate (rates > 1 deliberately speed up slow cursor work; the
dictation segment runs 0.75x so the audible question fits the on-screen
recording). Run from video/sightbot/ after make_vo.py.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
CAPD = os.path.join(HERE, "captions")
os.makedirs(CAPD, exist_ok=True)

with open(os.path.join(HERE, "voiceover", "vo_durations.json")) as f:
    VO = json.load(f)

LEAD, TAIL = 0.4, 0.4
FONT = "C\\:/Windows/Fonts/arialbd.ttf"

CARD_FILES = ["intro", "what", "why", "part1", "part2", "part3", "part4",
              "recap", "outro"]
VID_FILES = ["home_tour", "text_chat", "voice", "photo", "training", "quiz"]
CARD_IN = {n: i for i, n in enumerate(CARD_FILES)}
VID_IN = {n: len(CARD_FILES) + i for i, n in enumerate(VID_FILES)}
IN_MUSIC = len(CARD_FILES) + len(VID_FILES)          # 15
IN_VOTRK = IN_MUSIC + 1                               # 16

# (name, kind, input, window(src s), vo, caption, explicit_rate, extra_tail)
SEGS = [
    ("intro",      "card", CARD_IN["intro"], None,        "v00_intro", None, None, 0.9),
    ("what",       "card", CARD_IN["what"],  None,        "v01_what",  None, None, 1.0),
    ("why",        "card", CARD_IN["why"],   None,        "v02_why",   None, None, 1.0),
    ("p1card",     "card", CARD_IN["part1"], None,        "v10_card",  None, None, 0.7),
    ("home",       "vid",  VID_IN["home_tour"], (2.0, 18.5), "v11_home",
     "Live at sight.fsb.miamioh.edu  ·  Version 5.2.3", 1.3, 0),
    ("type",       "vid",  VID_IN["text_chat"], (4.0, 10.5), "v12_type",
     "Ask in plain language", None, 0),
    ("stream",     "vid",  VID_IN["text_chat"], (10.5, 17.0), "v13_stream",
     "Answers stream in live  ·  stop any time", None, 0),
    ("answer",     "vid",  VID_IN["text_chat"], (22.5, 32.0), "v14_answer",
     "Grounded in the machine's manual and OSHA guidance", None, 0),
    ("tools",      "vid",  VID_IN["text_chat"], (30.5, 38.7), "v15_tools",
     "PDF and Markdown export  ·  copy  ·  new conversation", None, 0),
    ("p2card",     "card", CARD_IN["part2"], None,        "v20_card",  None, None, 0.7),
    ("dictate",    "vid",  VID_IN["voice"], (1.0, 11.0),  "v21_dictate",
     "Voice dictation  ·  hands-free questions", 0.75, 7.0),
    ("transcribe", "vid",  VID_IN["voice"], (11.0, 17.8), "v22_transcribe",
     "Transcribed server-side into the question box", None, 0),
    ("listen",     "vid",  VID_IN["voice"], (24.0, 37.5), "v23_listen",
     "Read-aloud with speed control  ·  0.75x to 2x", None, 4.0),
    ("p3card",     "card", CARD_IN["part3"], None,        "v30_card",  None, None, 0.7),
    ("photo",      "vid",  VID_IN["photo"], (2.0, 13.5),  "v31_photo",
     "Attach a photo of the machine", 1.3, 0),
    ("identified", "vid",  VID_IN["photo"], (17.5, 30.6), "v32_identified",
     "Machine identified from the photo  ·  expert-reviewed guide", 1.27, 0),
    ("p4card",     "card", CARD_IN["part4"], None,        "v40_card",  None, None, 0.7),
    ("index",      "vid",  VID_IN["training"], (0.5, 9.5), "v41_index",
     "Six guides  ·  two per machine", None, 0),
    ("guide",      "vid",  VID_IN["training"], (10.0, 21.5), "v42_guide",
     "One step at a time  ·  arrow keys  ·  original schematics", None, 0),
    ("allsteps",   "vid",  VID_IN["training"], (21.5, 31.4), "v43_allsteps",
     "Full guide view  ·  works without JavaScript", None, 0),
    ("quiz",       "vid",  VID_IN["quiz"], (1.0, 15.0),   "v44_quiz",
     "Five questions  ·  one from each safety area", 1.5, 0),
    ("results",    "vid",  VID_IN["quiz"], (19.5, 31.5),  "v45_results",
     "Every miss links back to its teaching step", 1.17, 0),
    ("recap",      "card", CARD_IN["recap"], None,        "v50_recap", None, None, 1.0),
    ("outro",      "card", CARD_IN["outro"], None,        "v51_outro", None, None, 1.0),
]

# Aux audio clips premixed into vo_track: (seg name, offset-in-seg builder)
AUX = {
    "user_question": {
        "file": os.path.join("assets", "sfx", "user_question.wav"),
        "seg": "dictate",
        "offset": LEAD + VO["v21_dictate"] + 0.7,
        "volume": 1.0,
    },
    "aura_answer": {
        "file": os.path.join("assets", "sfx", "aura_answer.mp3"),
        "seg": "listen",
        "offset": LEAD + VO["v23_listen"] + 0.4,
        "volume": 0.9,
        "filter": "atrim=0:3.6,afade=t=in:st=0:d=0.15,afade=t=out:st=2.9:d=0.7",
    },
}


def main():
    branches, labels, delays, rows = [], [], {}, []
    seg_start = {}
    t = 0.0
    for i, (name, kind, inp, win, vo, cap, rate, extra) in enumerate(SEGS):
        vod = VO[vo]
        target = vod + LEAD + TAIL + extra
        if kind == "card":
            dur = round(target, 2)
            chain = (f"[{inp}:v]scale=1920:1080,setsar=1,fps=30,format=yuv420p,"
                     f"trim=0:{dur},setpts=PTS-STARTPTS")
        else:
            w0, w1 = win
            wlen = w1 - w0
            if rate is None:
                rate = min(1.0, wlen / target)
            full = wlen / rate
            dur = round(min(full, target), 2) if full >= target else round(full, 2)
            chain = (f"[{inp}:v]trim={w0}:{w1},setpts=(PTS-STARTPTS)/{rate},"
                     f"scale=1920:-2,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,"
                     f"fps=30,format=yuv420p,trim=0:{dur},setpts=PTS-STARTPTS")
        fin = 0.8 if i == 0 else 0.4
        fout = 1.0 if name == "outro" else 0.4
        chain += f",fade=t=in:st=0:d={fin},fade=t=out:st={round(dur-fout,2)}:d={fout}"
        if cap:
            cf = os.path.join(CAPD, f"{name}.txt")
            with open(cf, "w", encoding="utf-8") as f:
                f.write(cap)
            cfe = cf.replace("\\", "/").replace(":", "\\:")
            cs, ce = round(LEAD, 2), round(dur - 0.5, 2)
            chain += (f",drawtext=fontfile='{FONT}':textfile='{cfe}':fontsize=34:"
                      f"fontcolor=white:box=1:boxcolor=0x101418@0.72:boxborderw=14:"
                      f"x=(w-text_w)/2:y=h-96:enable='between(t,{cs},{ce})'")
        lbl = f"[s{i}]"
        branches.append(chain + lbl)
        labels.append(lbl)
        delays[vo] = round(t + LEAD, 2)
        seg_start[name] = t
        rows.append((name, round(t, 2), dur, vo, vod,
                     f"{rate:.3f}" if (kind == "vid" and rate) else "card", win))
        t += dur

    total = round(t, 2)
    lines = [";\n".join(branches)]
    lines.append(f"{''.join(labels)}concat=n={len(SEGS)}:v=1:a=0[vout]")
    music = (f"[{IN_MUSIC}:a]aloop=loop=-1:size=17000000,atrim=0:{total},"
             f"loudnorm=I=-22:LRA=6:TP=-2.0,"
             f"afade=t=in:st=0:d=1.5,"
             f"afade=t=out:st={round(total-4,2)}:d=4,volume=0.15[mus];"
             f"[{IN_VOTRK}:a]atrim=0:{total},volume=1.0,asplit=2[vo1][vo2];"
             f"[mus][vo1]sidechaincompress=threshold=0.02:ratio=8:attack=120:release=700:makeup=1[musd];"
             f"[musd][vo2]amix=inputs=2:duration=first:normalize=0[aout]")
    lines.append(music)
    with open(os.path.join(HERE, "filter.txt"), "w", encoding="utf-8") as f:
        f.write(";\n".join(lines) + "\n")

    aux_out = {}
    for name, spec in AUX.items():
        aux_out[name] = {
            "file": spec["file"],
            "delay": round(seg_start[spec["seg"]] + spec["offset"], 2),
            "volume": spec.get("volume", 1.0),
            **({"filter": spec["filter"]} if "filter" in spec else {}),
        }
    with open(os.path.join(HERE, "vo_delays.json"), "w") as f:
        json.dump({"total": total, "delays": delays, "aux": aux_out}, f, indent=1)

    manifest = []
    card_durs = {SEGS[i][2]: rows[i][2] for i in range(len(SEGS))
                 if SEGS[i][1] == "card"}
    for n in CARD_FILES:
        manifest.append({"kind": "card", "file": f"cards/{n}.png",
                         "t": card_durs[CARD_IN[n]]})
    for n in VID_FILES:
        manifest.append({"kind": "vid", "file": f"captures/{n}.mp4"})
    manifest.append({"kind": "audio", "file": "assets/music/Deliberate_Thought.mp3"})
    manifest.append({"kind": "audio", "file": "voiceover/vo_track.wav"})
    with open(os.path.join(HERE, "inputs.json"), "w") as f:
        json.dump(manifest, f, indent=1)

    print(f"{'segment':<11} {'start':>7} {'dur':>6} {'vo':<15} {'vod':>5}  rate   window")
    for name, st, dur, vo, vod, rt, win in rows:
        print(f"{name:<11} {st:>7.2f} {dur:>6.2f} {vo:<15} {vod:>5.2f}  {rt:<6} {win}")
    for name, spec in aux_out.items():
        print(f"aux {name}: t={spec['delay']}s")
    print(f"TOTAL {total}s = {int(total//60)}:{total%60:05.2f}")


if __name__ == "__main__":
    main()

```

### assemble.py

```python
"""Two-pass assembly for the SIGHT Bot demo video.

Pass 1 (premix): place every VO beat mp3 plus the aux clips (the user's
dictated question, a snippet of the app's own read-aloud voice) on the
timeline with adelay, mix, and write voiceover/vo_track.wav.

Pass 2 (final): feed cards + capture mezzanines + music + vo_track through
the filtergraph emitted by gen_timeline.py (filter.txt) and encode the mp4.

Run after gen_timeline.py:  python assemble.py
"""
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
VOD = os.path.join(HERE, "voiceover")
OUT = os.path.join(HERE, "SIGHT_Bot_Demo.mp4")


def run(cmd):
    print(" ".join(c if " " not in c else f'"{c}"' for c in cmd)[:220], "...")
    subprocess.run(cmd, check=True)


def premix(meta):
    total = meta["total"]
    delays = meta["delays"]
    aux = meta.get("aux", {})
    inputs, chains, labels = [], [], []
    idx = 0
    for name, start in delays.items():
        inputs += ["-i", os.path.join(VOD, name + ".mp3")]
        ms = int(round(start * 1000))
        chains.append(f"[{idx}:a]aresample=48000,adelay={ms}:all=1[b{idx}]")
        labels.append(f"[b{idx}]")
        idx += 1
    for name, spec in aux.items():
        inputs += ["-i", os.path.join(HERE, spec["file"])]
        ms = int(round(spec["delay"] * 1000))
        pre = spec.get("filter", "")
        pre = pre + "," if pre else ""
        vol = spec.get("volume", 1.0)
        chains.append(f"[{idx}:a]{pre}aresample=48000,volume={vol},"
                      f"adelay={ms}:all=1[b{idx}]")
        labels.append(f"[b{idx}]")
        idx += 1
    graph = (";".join(chains) + ";" + "".join(labels) +
             f"amix=inputs={idx}:duration=longest:normalize=0,"
             f"apad=whole_dur={total},atrim=0:{total}[vo]")
    run(["ffmpeg", "-y", "-v", "error", *inputs,
         "-filter_complex", graph, "-map", "[vo]",
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
         os.path.join(VOD, "vo_track.wav")])
    print("premixed vo_track.wav")


def final(meta):
    with open(os.path.join(HERE, "inputs.json")) as f:
        manifest = json.load(f)
    args = ["ffmpeg", "-y", "-v", "error"]
    for item in manifest:
        if item["kind"] == "card":
            args += ["-loop", "1", "-framerate", "30", "-t", str(item["t"]),
                     "-i", os.path.join(HERE, item["file"])]
        else:
            args += ["-i", os.path.join(HERE, item["file"])]
    args += ["-filter_complex_script", os.path.join(HERE, "filter.txt"),
             "-map", "[vout]", "-map", "[aout]",
             "-c:v", "libx264", "-crf", "20", "-preset", "medium",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
             "-movflags", "+faststart", OUT]
    run(args)
    print("wrote", OUT)


if __name__ == "__main__":
    with open(os.path.join(HERE, "vo_delays.json")) as f:
        meta = json.load(f)
    premix(meta)
    final(meta)

```
