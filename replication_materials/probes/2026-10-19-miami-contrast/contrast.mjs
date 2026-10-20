// WCAG 2.x contrast ratios for the Miami palette (brand guide, read 2026-10-19).
const P = { MiamiRed:"C41230", AccentRed:"AD102A", White:"FFFFFF", WarmWhite:"FAF9F7", LightTan:"EDECE2",
  MediumTan:"CCC9B8", DarkTan:"70685C", Black:"000000", MediumGray:"666666", CornYellow:"FDE778", SlateBlue:"3E5468" };
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (h) => { const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const [x, y] = [L(P[a]), L(P[b])].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const show = (bg, fgs) => console.log(bg.padEnd(10), fgs.map((f) => `${f} ${cr(f, bg).toFixed(2)}`).join(" | "));
console.log("Light theme (body text, links, UI on page backgrounds):");
show("WarmWhite", ["Black", "MiamiRed", "AccentRed", "DarkTan", "SlateBlue", "MediumGray"]);
show("LightTan", ["Black", "MiamiRed", "AccentRed", "DarkTan", "MediumGray"]);
show("White", ["MiamiRed", "MediumGray"]);
console.log("\nDark-theme candidates (no black background is in the brand chart):");
show("SlateBlue", ["White", "WarmWhite", "LightTan", "MediumTan", "CornYellow", "MiamiRed"]);
show("Black", ["WarmWhite", "LightTan", "MediumTan", "CornYellow", "MiamiRed", "AccentRed"]);
show("DarkTan", ["White", "WarmWhite", "LightTan"]);
console.log("\nRed fills with text on them (buttons, ribbons):");
show("MiamiRed", ["White", "WarmWhite", "LightTan"]);
console.log("\nNon-text UI (3:1 needed): Miami Red border/bar on Black", cr("MiamiRed", "Black").toFixed(2), "| on SlateBlue", cr("MiamiRed", "SlateBlue").toFixed(2));
