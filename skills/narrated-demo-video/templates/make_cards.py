"""Branded title cards (1920x1080) for the demo video: intro, section, list, outro.

TEMPLATE: the render toolkit (centered text, letter-tracked labels, measured
word-wrap, numbered/bulleted list blocks) transfers unchanged. You adapt the
BRAND TOKENS block, the fonts, and the card copy in __main__.

Set titles in a display face that MATCHES the product (grab its own web font);
labels/body use DejaVu Sans bundled with matplotlib (no font install needed).
Writes cards/*.png. Run from <video>/.  Needs: Pillow, matplotlib.
"""
import os

from PIL import Image, ImageDraw, ImageFont
import matplotlib

HERE = os.path.dirname(os.path.abspath(__file__))
CARDS = os.path.join(HERE, "cards")
FONTS = os.path.join(HERE, "assets", "fonts")
BRAND = os.path.join(HERE, "assets", "brand")
os.makedirs(CARDS, exist_ok=True)

# ---- BRAND TOKENS --------------------------------------------------------
# NOTE: the values below ARE the Miami University brand (field = Miami Red
# #C41230, warm white #FAF9F7, Source Serif 4 titles, Miami logo). For a Miami
# project keep them and edit only the copy in __main__. For any OTHER product,
# run branding discovery (references/branding-discovery.md) and replace them.
W, H = 1920, 1080
RED = (196, 18, 48)          # field / primary   Miami Red #C41230 (--miami-red)
WARM = (250, 249, 247)       # titles            warm white #FAF9F7
BODY = (247, 224, 228)       # body text         warm tint
FAINT = (236, 200, 207)      # labels, credits

SERIF_SB = os.path.join(FONTS, "SourceSerif4-Semibold.ttf")   # product display face
SERIF_BD = os.path.join(FONTS, "SourceSerif4-Bold.ttf")
SANS_BD = os.path.join(matplotlib.get_data_path(), "fonts", "ttf", "DejaVuSans-Bold.ttf")
SANS_RG = os.path.join(matplotlib.get_data_path(), "fonts", "ttf", "DejaVuSans.ttf")

# ---- LOGOS ---------------------------------------------------------------
# LOGO is placed on the intro card by default. BWC_LOGO is available (pass it
# to place_logo where you want it) but is NOT shown by default. Set LOGO=None
# for a text-only intro. Dark-ink logos need tile=True (a warm-white backing)
# to read on the red field; a pre-reversed white logo can use tile=False.
LOGO = os.path.join(BRAND, "miami_university_logo.webp")
BWC_LOGO = os.path.join(BRAND, "ohio_bwc_logo.webp")


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


def place_logo(img, path, y, max_w=560, max_h=300, tile=True, pad=44, radius=26):
    """Composite a logo horizontally centered at vertical position y.

    A dark-ink logo (most wordmarks) is unreadable on the red field, so by
    default it sits on a warm-white rounded tile. Pass tile=False for a logo
    already reversed to white. Returns the y just below the placed block, so a
    caller can flow the title beneath it.
    """
    logo = Image.open(path).convert("RGBA")
    inner_w, inner_h = max_w - 2 * pad, max_h - 2 * pad
    logo.thumbnail((inner_w, inner_h), Image.LANCZOS)
    if tile:
        tile_w, tile_h = logo.width + 2 * pad, logo.height + 2 * pad
        tx = (W - tile_w) // 2
        ImageDraw.Draw(img).rounded_rectangle(
            [tx, y, tx + tile_w, y + tile_h], radius=radius, fill=WARM)
        lx, ly = tx + pad, y + pad
        img.paste(logo, (lx, ly), logo)
        return y + tile_h
    lx = (W - logo.width) // 2
    img.paste(logo, (lx, y), logo)
    return y + logo.height


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
        if line and line[-1][1] is f:
            line[-1] = (line[-1][0] + " " + word, f, fill)
        else:
            line.append((word, f, fill))
        used += w_len
    if line:
        lines.append(line)
    return lines


def intro(title, sub, org, logo=LOGO):
    img, d = new_card()
    ty = 420
    if logo:
        bottom = place_logo(img, logo, y=150, max_w=560, max_h=300)
        ty = bottom + 60
    ctext(d, ty, title, serif(76, bold=True), WARM)
    ctext(d, ty + 140, sub, sans(37), BODY)
    ctext(d, ty + 230, org, sans(31), FAINT)
    img.save(os.path.join(CARDS, "intro.png"))


def section(name, label, title, sub):
    img, d = new_card()
    tracked(d, 372, label, sans(30, bold=True), FAINT)
    d.rectangle([W / 2 - 60, 340, W / 2 + 60, 345], fill=WARM)   # accent rule
    ctext(d, 448, title, serif(72, bold=True), WARM)
    ctext(d, 596, sub, sans(35), BODY)
    img.save(os.path.join(CARDS, name + ".png"))


def list_card(name, label, title, items, marker="num", top=190):
    """Left-aligned list block: numbered chips (marker='num') or square bullets
    (marker='dot'), a bold lead-in per item, measured word-wrap, hanging indent.
    items = [(lead, rest), ...]."""
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


def outro(title, org, cta_label, cta, funder, credits, logo=None):
    """logo defaults to None (text-only outro). Pass LOGO or BWC_LOGO to show a
    small mark at the top; only the title/org/CTA block nudges down for it, the
    funder line and credits stay pinned to the lower third."""
    img, d = new_card()
    top = 200
    if logo:
        place_logo(img, logo, y=60, max_w=420, max_h=150, pad=30)
        top = 250
    ctext(d, top, title, serif(70, bold=True), WARM)
    ctext(d, top + 130, org, sans(44), BODY)
    ctext(d, top + 270, cta_label, sans(30, bold=True), FAINT)
    ctext(d, top + 322, cta, serif(56, bold=True), WARM)
    ctext(d, 700, funder, sans(35, bold=True), WARM)
    y = 940
    for line in credits:   # music / photo / narration attributions, one per line
        ctext(d, y, line, sans(21), FAINT)
        y += 38
    img.save(os.path.join(CARDS, "outro.png"))


if __name__ == "__main__":
    # ---- CARD COPY --------------------------------------------------------
    # Colors/fonts/logo above are the Miami University defaults. For a Miami
    # project, edit ONLY the strings below (and optionally the font or bullet
    # marker). For a non-Miami product, first run branding discovery
    # (references/branding-discovery.md) to replace the tokens, fonts, and LOGO.
    intro("Product Name",
          "One line that says what it does.",
          "Your Org  ·  Project")   # intro shows LOGO by default; pass logo=None to drop it
    list_card("what", "BEFORE THE TOUR", "What is it?", [
        ("A one-line claim", "with the supporting detail that follows it"),
        ("Second point:", "the detail for the second point"),
        ("Third point:", "the detail for the third point"),
    ], marker="dot")
    section("part1", "PART 1", "First Capability",
            "sub-line  ·  broken by middots  ·  into phrases")
    section("part2", "PART 2", "Second Capability",
            "what this part shows")
    list_card("recap", "WHAT IT DELIVERS", "In your browser today", [
        ("Deliverable one,", "with the qualifier that makes it concrete"),
        ("Deliverable two,", "with its qualifier"),
        ("Deliverable three,", "with its qualifier"),
    ], marker="num")
    outro("Created by Your Team",
          "Your Org",
          "Try it now", "your-url.example",
          "Funded by / built with",
          ['Music: "Track" by Artist (source), licensed CC BY 4.0',
           "Photo: Author, source, license  ·  Narration: neural text-to-speech"],
          logo=None)   # e.g. logo=LOGO for a Miami mark, or logo=BWC_LOGO for the funder
    print("cards written to", CARDS)
