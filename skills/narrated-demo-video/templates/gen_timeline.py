"""Compute the segment timeline from measured VO durations and emit the ffmpeg
plan. This is the heart of the pipeline: the PICTURE IS FITTED TO THE SOUND.

TEMPLATE: the fitting math and filtergraph emission transfer unchanged. You
adapt only the SEGS table (one row per shot) and AUX (on-camera audio clips).

For each segment:  target = vo + LEAD + TAIL + extra_tail
  - Cards are held for exactly `target`.
  - Video windows are the source-seconds slice you read off a tile sheet. With
    rate=None a window trims at 1x, or auto-SLOWS if it is shorter than target
    (so narration never gets cut off). An explicit rate speeds up (>1, for snappy
    cursor work) or slows down (<1, e.g. to fit an audible question inside a shot).

Emits:  filter.txt (video+audio graph), captions/*.txt (drawtext files),
        vo_delays.json (beat start times + aux clips), inputs.json (ffmpeg input
        manifest), and a printed timeline table for QC.

Run from <video>/ after make_vo.py, before assemble.py.

Read cut points off a tile sheet (8 cols => tile N = second N):
    ffmpeg -i captures/x.mp4 -vf "fps=1,scale=320:180,tile=8x5:margin=4:padding=4" \
           -frames:v 1 tiles_x.png
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
CAPD = os.path.join(HERE, "captions")
os.makedirs(CAPD, exist_ok=True)

with open(os.path.join(HERE, "voiceover", "vo_durations.json")) as f:
    VO = json.load(f)

LEAD, TAIL = 0.4, 0.4
FONT = "C\\:/Windows/Fonts/arialbd.ttf"   # TODO: a bold TTF for burned-in captions

# Input order MUST match the manifest built at the bottom: cards first, then
# videos, then music, then the premixed vo_track. Adapt both lists together.
CARD_FILES = ["intro", "what", "part1", "part2", "recap", "outro"]
VID_FILES = ["text", "voice"]
CARD_IN = {n: i for i, n in enumerate(CARD_FILES)}
VID_IN = {n: len(CARD_FILES) + i for i, n in enumerate(VID_FILES)}
IN_MUSIC = len(CARD_FILES) + len(VID_FILES)
IN_VOTRK = IN_MUSIC + 1

# (name, kind, input, window(src s), vo_beat, caption, explicit_rate, extra_tail)
#   kind "card": window/rate ignored, held for target.
#   kind "vid" : window is (start_s, end_s) in the mezzanine; rate as above.
#   caption    : one fact, burned bottom-center; None for cards.
#   extra_tail : silent screen time after the beat (room for an aux clip, etc.).
SEGS = [
    ("intro",  "card", CARD_IN["intro"],  None,         "v00_intro", None, None, 0.9),
    ("what",   "card", CARD_IN["what"],   None,         "v01_what",  None, None, 1.0),
    ("p1card", "card", CARD_IN["part1"],  None,         "v10_card",  None, None, 0.7),
    ("type",   "vid",  VID_IN["text"],    (4.0, 10.5),  "v11_type",
     "Ask in plain language", None, 0),
    ("answer", "vid",  VID_IN["text"],    (10.5, 22.0), "v12_answer",
     "Grounded, specific answers", None, 0),
    ("p2card", "card", CARD_IN["part2"],  None,         "v20_card",  None, None, 0.7),
    ("dictate", "vid", VID_IN["voice"],   (1.0, 11.0),  "v21_dictate",
     "Voice dictation  ·  hands-free", 0.75, 7.0),
    ("recap",  "card", CARD_IN["recap"],  None,         "v50_recap", None, None, 1.0),
    ("outro",  "card", CARD_IN["outro"],  None,         "v51_outro", None, None, 1.0),
]

# On-camera audio clips premixed into vo_track (the user's dictated question, a
# snippet of the app's own read-aloud voice). Each lands like a narration beat.
AUX = {
    # "user_question": {
    #     "file": os.path.join("assets", "sfx", "user_question.wav"),
    #     "seg": "dictate",
    #     "offset": LEAD + VO["v21_dictate"] + 0.7,   # after the beat finishes
    #     "volume": 1.0,
    # },
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
    # Music: aloop keeps it going the whole runtime (without it amix truncates
    # everything at the music length); loudnorm to ~-22 LUFS; sidechaincompress
    # ducks it under speech; held at 0.15.
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
    manifest.append({"kind": "audio", "file": "assets/music/music.mp3"})   # TODO: your track
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
