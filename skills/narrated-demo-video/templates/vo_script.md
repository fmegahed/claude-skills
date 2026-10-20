# <Product> demo — voiceover script

Voice: neural TTS via edge-tts (set in make_vo.py). One beat per segment;
gen_timeline.py fits the picture to these clip durations, so write for the ear.

TTS conventions that make the narration sound right:
- Commas force letter-by-letter reading: "U, R, 5, E"  ·  "miami, O, H"  ·  "P, D, F".
- Spell out numbers you want said as words: "two hundred seventy", "three quarters".
- Respell words the voice mangles until they sound right.
- Keep beats 4 to 16 seconds. A section card only needs a short line.

Beat id format the parser expects:  **vNN_name** — text
(Number them so they sort in play order: v00, v01, v10, v11, ...)

## Part 0 — intro and context cards

**v00_intro** — One or two sentences that say what the product is and who made it. Spell out any acronym the voice would otherwise run together.

**v01_what** — The core value in plain language: what it does, what it is grounded in, how you use it.

## Part 1 — First capability

**v10_card** — Part one. Short title.

**v11_type** — Narrate the first on-screen action as if showing a coworker. Say what we are about to do, then let the footage show it.

**v12_answer** — Describe what just happened on screen and why it matters. Point at the specific thing the caption also names.

## Part 2 — Second capability

**v20_card** — Part two. Short title.

**v21_dictate** — Narrate the action that has an on-camera audio clip. Leave room (extra_tail in gen_timeline) for that clip to be heard after this beat.

## Recap and outro

**v50_recap** — So that is <Product>. List the delivered capabilities in one breath, then the one-line invitation.

**v51_outro** — Credit the team and funder, then the call to action. Spell the URL for the voice: "your dash url, dot, example".
