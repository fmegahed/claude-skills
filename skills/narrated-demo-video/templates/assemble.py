"""Two-pass assembly for the narrated demo video.

PRODUCT-AGNOSTIC: copy this file into <video>/ unchanged (only OUT below names
the output). It consumes what gen_timeline.py emitted.

Pass 1 (premix): place every VO beat mp3 plus any aux clips (an on-camera
dictated question, a snippet of the app's own read-aloud voice, ...) on the
timeline with adelay, mix, and write voiceover/vo_track.wav. Premixing to ONE
track means the final pass has exactly two audio inputs (music + narration),
which keeps the sidechain duck simple.

Pass 2 (final): feed cards + capture mezzanines + music + vo_track through the
filtergraph emitted by gen_timeline.py (filter.txt) and encode the mp4.

Run after gen_timeline.py:  python assemble.py
Needs: ffmpeg on PATH.
"""
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
VOD = os.path.join(HERE, "voiceover")
OUT = os.path.join(HERE, "demo.mp4")   # TODO: name your output


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
