"""Render the voiceover beats in vo_script.md to mp3 via edge-tts.

PRODUCT-AGNOSTIC: copy this file into <video>/voiceover/ unchanged. It parses
lines of the form  **vNN_name** — text  from vo_script.md and writes
vNN_name.mp3 next to this script, plus vo_durations.json (the durations every
later stage is fitted to). Beats whose text is unchanged since the last render
are skipped (cached by text hash in .vo_cache.json), so editing one beat
re-renders only that beat.

Tune VOICE and RATE for your narrator. A second voice (for an on-camera "user",
e.g. a dictation shot) is rendered separately in capture_demo.py, not here.

Run:  python make_vo.py
Needs: edge-tts, ffprobe on PATH.
"""
import asyncio
import hashlib
import json
import os
import subprocess

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = "en-US-AndrewMultilingualNeural"   # TODO: pick your narrator voice
RATE = "-5%"                                # slight slow-down reads more clearly
CACHE = os.path.join(HERE, ".vo_cache.json")

import re
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
