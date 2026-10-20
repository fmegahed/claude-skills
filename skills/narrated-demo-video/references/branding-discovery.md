# Branding discovery

Before rendering cards, establish the video's branding — colors, fonts, logo,
title copy, and credits. Do this **once, up front**, and write the results into
`make_cards.py`. There are two paths: a known-org **profile** (skip discovery,
use bundled defaults) or **discovery** from the target repo/site.

## Decision: profile or discovery

```
Is this a Miami University project (or did the user say "Miami University")?
  YES -> use the Miami profile below. Keep the default tokens, fonts, and logo.
         Discover ONLY the copy (product name, tagline, parts, credits).
  NO  -> run Discovery. Replace tokens, fonts, and LOGO from the app itself.
```

Add a new profile whenever an org recurs: bundle its logo under `assets/brand/`,
record its tokens/fonts here, and make them the `make_cards.py` defaults for
that org. The Miami profile is the worked example.

## Miami University profile (the built-in default)

`make_cards.py` ships with these already set — for a Miami project you edit only
the copy strings in `__main__`.

| Element | Value |
|---|---|
| Field / primary | Miami Red `#C41230` → `RED = (196, 18, 48)` (webapp `--miami-red`) |
| Titles | warm white `#FAF9F7` → `WARM = (250, 249, 247)` |
| Body / labels | warm-red tints `BODY`/`FAINT` (as shipped) |
| Title font | Source Serif 4 (`assets/fonts/SourceSerif4-*.ttf`), the webapp's own display face |
| Body font | DejaVu Sans (matplotlib-bundled; no install) |
| Logo | `assets/brand/miami_university_logo.webp`, on a warm-white tile (dark-ink mark) — shown on the intro by default |
| Funder logo | `assets/brand/ohio_bwc_logo.webp` — **callable, not default**. Pass `logo=BWC_LOGO` to an `outro(...)` only when you want it. |
| Accent (optional) | `#AD102A` (webapp `--accent-red`) if you want a darker accent |

Tweakable per video without leaving the profile: the title font, the list
bullet marker (`marker="num"` vs `"dot"`), and whether the outro carries a logo.

## Discovery for any other product

Produce a short `BRANDING.md` in the `video/` dir by inspecting the app, then
transcribe it into `make_cards.py`. Sources, in order of reliability:

**Colors** — read the app's own tokens, do not eyeball:
- CSS custom properties: grep for `--*color*`, `--*red*`, `--brand*`, `--bg`,
  `--surface`, `--accent` in the stylesheets (`grep -rihoE "\-\-[a-z-]+:\s*#[0-9a-fA-F]{3,6}"`).
- Tailwind: `theme.extend.colors` in `tailwind.config.*`.
- Sass/LESS variables, or a `tokens.json`/design-tokens file.
- Last resort: screenshot the live site and sample the dominant field + text
  colors. Pick a saturated brand color for the field, a near-white for titles.

**Fonts** — match the product's own face:
- `@font-face` `src:` paths, `font-family` on `body`/headings, or a Google Fonts
  `<link>`/`@import`. Note which face is display vs body.
- Fetch the matching **TTF** into `assets/fonts/` (Google Fonts, the adobe-fonts
  GitHub releases, or the repo's own font files). Point `SERIF_*` at it. Keep
  DejaVu for body unless the product's body face matters on cards.

**Logo** — find and reuse the app's mark:
- Look in `static/`, `public/`, `assets/` for `*logo*`, `*mark*`, `*wordmark*`,
  favicon/app-icon PNGs, or an SVG in the header.
- Copy it to `assets/brand/`. Rasterize SVG to a high-res PNG first (PIL cannot
  place SVG): `rsvg-convert -h 600 logo.svg -o logo.png` or headless Chrome.
- Sample its ink color (see below). Dark ink → `place_logo(..., tile=True)`
  (warm backing). Already white/reversed → `tile=False` directly on the field.
- Set `LOGO` to it; shown on the intro by default. `logo=None` for text-only.

**Copy** — pull, then have the user confirm (do not invent):
- Product name + tagline: the homepage `<title>`, `<meta name="description">`,
  the hero `<h1>`/`<p>`, or the README's first heading and blurb.
- Org / funder / grant lines: the site footer, README badges/acknowledgements,
  or a `LICENSE`/`FUNDING` file.
- Credits: the licenses of the music/photo/narration assets you actually used.

## Check logo ink before placing

A dark-ink logo is invisible on a saturated field; that is why the default puts
it on a warm-white tile. Confirm which case you have:

```python
from PIL import Image
im = Image.open("assets/brand/logo.png").convert("RGBA"); px = im.load(); W, H = im.size
r=g=b=n=0
for y in range(0, H, max(1, H//60)):
    for x in range(0, W, max(1, W//60)):
        R, G, B, A = px[x, y]
        if A > 40: r+=R; g+=G; b+=B; n+=1
print("avg opaque rgb =", (r//n, g//n, b//n))   # dark/brand-colored -> tile=True
```

## Wiring results into make_cards.py

1. Replace the four `RED/WARM/BODY/FAINT` tuples in the BRAND TOKENS block.
2. Point `SERIF_SB/SERIF_BD` at the fetched TTF (leave the sans defaults).
3. Set `LOGO` (and `BWC_LOGO`/other funder marks if any) to files in `assets/brand/`.
4. Fill the `intro/section/list_card/outro` copy in `__main__`; keep credit lines
   accurate to the assets you licensed.
5. Render and eyeball: `python make_cards.py`, then open `cards/intro.png` and
   `cards/outro.png` — check logo contrast, title fit, and no text overlap.
