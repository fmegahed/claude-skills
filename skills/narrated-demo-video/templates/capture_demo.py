"""Capture demo footage from a live web app with Playwright.

TEMPLATE: the helpers, launch args, and cursor overlay transfer unchanged. You
adapt only the SCENARIOS section (selectors + choreography for YOUR app) and the
BASE url. Each scenario runs in its own browser context (fresh session, clean
state) and records a .webm into captures/<name>/, moved to captures/<name>.webm.

Guiding rule: OVERSHOOT dwell times. Footage that is too long trims freely in
gen_timeline.py; footage that is too short forces ugly slow-motion. Every state
change gets a generous settle() after it.

Usage (from <video>/):
    python capture_demo.py                 # all scenarios
    python capture_demo.py --only text     # one scenario
    python capture_demo.py --recon         # screenshot-only sanity check

Needs: playwright (playwright install chromium), ffmpeg for the transcode below.
After capture, transcode each .webm to a constant-30fps mezzanine before cutting:
    ffmpeg -i captures/x.webm -vf "fps=30,scale=1920:1080:flags=lanczos" \
           -c:v libx264 -crf 18 -preset fast -an captures/x.mp4
"""

import argparse
import shutil
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://example.com"          # TODO: your live app
HERE = Path(__file__).resolve().parent
CAPTURES = HERE / "captures"
SFX = HERE / "assets" / "sfx"
USER_WAV = SFX / "user_question.wav"  # pre-rendered "user" voice for a dictation shot

VIEW = {"width": 1920, "height": 1080}

# A visible cursor so viewers can follow interactions (Playwright renders none).
# Recolor the border/background to your brand accent.
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

# --------------------------------------------------------------------------
# Reusable interaction helpers (human-paced, so the footage narrates well)
# --------------------------------------------------------------------------

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
    page.keyboard.type(text, delay=42)   # ~42 ms/key reads as real typing
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


def wait_done(page, prev_count, marker=".done-marker", spinner="#busy", timeout=150):
    """Wait for a DURABLE state change, never a transient spinner.

    Detect completion by something that appears and STAYS (here: the count of a
    persistent result element going up while a busy indicator is hidden). A
    stop button or spinner can appear and vanish between polls on a fast/cached
    response and will be missed. Adapt `marker`/`spinner` to your app.
    """
    deadline = time.time() + timeout
    while time.time() < deadline:
        if (page.locator(marker).count() > prev_count
                and page.locator(spinner).is_hidden()):
            settle(1.0)
            return
        time.sleep(0.5)
    raise RuntimeError("action never completed")


def goto_home(page):
    page.goto(BASE, wait_until="networkidle")
    settle(2.0)
    page.mouse.move(960, 300, steps=15)


# --------------------------------------------------------------------------
# SCENARIOS  — adapt these to your app; each returns after its footage is shot
# --------------------------------------------------------------------------

def sc_text(page, ctx):
    """EXAMPLE: type a question, watch the answer render, show export tools.

    Replace #question / #send-button / .done-marker with your selectors.
    """
    goto_home(page)
    type_slow(page, page.locator("#question"), "A representative question a user would ask.")
    prev = page.locator(".done-marker").count()
    click_slow(page, page.locator("#send-button"), pause_after=0.5)
    wait_done(page, prev)
    settle(1.0)
    smooth_scroll(page, -600)          # scroll up to the start of the answer
    settle(1.5)
    smooth_scroll(page, 1400)          # then back down through it
    settle(1.0)


def sc_voice(page, ctx):
    """EXAMPLE: real dictation on camera through Chromium's fake microphone.

    launch_args() feeds USER_WAV to the mic, so clicking the app's Dictate
    button records that WAV through the app's REAL speech-to-text path and the
    transcript lands in the UI on camera. Grant the microphone permission on the
    context (see run()).
    """
    goto_home(page)
    dictate = page.locator("#dictate-button")
    dictate.wait_for(state="visible", timeout=15000)
    click_slow(page, dictate, pause_after=0.3)   # start recording; WAV plays
    settle(6.5)                                   # WAV length + margin
    click_slow(page, dictate, pause_after=0.3)   # stop -> transcribe
    deadline = time.time() + 30
    while time.time() < deadline:
        if len(page.locator("#question").input_value().strip()) > 10:
            break
        time.sleep(0.5)
    else:
        raise RuntimeError("dictation transcript never arrived")
    print("    transcript:", page.locator("#question").input_value())
    settle(2.5)                                   # let viewers read the transcript

    # OPTIONAL: save an audio clip the SESSION can see but Node cannot fetch
    # (Chromium trusts the site cert; context.request may not). Fetch in-page:
    #   src = page.locator("audio").get_attribute("src")
    #   b64 = page.evaluate("""async (src) => {
    #       const r = await fetch(src);
    #       const bytes = new Uint8Array(await r.arrayBuffer());
    #       let bin = ''; for (const b of bytes) bin += String.fromCharCode(b);
    #       return btoa(bin);
    #   }""", src)
    #   import base64; (SFX / "app_audio.mp3").write_bytes(base64.b64decode(b64))


# TODO: add sc_<name>(page, ctx) per shot you want, then register below.
SCENARIOS = {
    "text": sc_text,
    "voice": sc_voice,
}


# --------------------------------------------------------------------------
# Runner (transfers unchanged)
# --------------------------------------------------------------------------

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
            ctx = browser.new_context(viewport=VIEW, bypass_csp=True)
            page = ctx.new_page()
            page.goto(BASE, wait_until="networkidle")
            time.sleep(2)
            page.screenshot(path=str(CAPTURES / "recon_home.png"), full_page=False)
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
                bypass_csp=True,   # a site with script-src 'self' blocks our cursor overlay
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
