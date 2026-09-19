---
name: FocusList
description: A to-do list in front of a real ukiyo-e print, on one solid papyrus panel, where every action answers back with a quick gesture of ink.
colors:
  paper: "#eee9dc"
  paper-deep: "#e3dcc9"
  surface: "#f7f3e9"
  sumi: "#16140f"
  sumi-soft: "#4a463c"
  ash: "#57534a"
  edge: "#7a7466"
  shu: "#b72a16"
  shu-hover: "#9d2312"
  on-shu: "#fbf7ec"
  ai: "#1f3f73"
  night-paper: "#12161f"
  night-paper-deep: "#1b2130"
  night-surface: "#1e2536"
  night-ivory: "#ede7d6"
  night-ivory-soft: "#bab3a0"
  night-ash: "#b0ab9a"
  night-edge: "#737b8f"
  night-shu: "#f0644b"
  night-shu-hover: "#f47e69"
  night-on-shu: "#12161f"
  night-ai: "#9bbaf0"
typography:
  display:
    fontFamily: "'Shippori Mincho B1', 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "'Shippori Mincho B1', 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.15
  numeral:
    fontFamily: "'Shippori Mincho B1', 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum'"
  wordmark:
    fontFamily: "'Shippori Mincho B1', 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Zen Kaku Gothic New', 'Yu Gothic', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "'Zen Kaku Gothic New', 'Yu Gothic', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Zen Kaku Gothic New', 'Yu Gothic', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.55
  small:
    fontFamily: "'Zen Kaku Gothic New', 'Yu Gothic', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.55
  seal-glyph:
    fontFamily: "'Yuji Syuku', 'Shippori Mincho B1', 'Yu Mincho', serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  base: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  panel-x-mobile: "16px"
  panel-x-wide: "32px"
  touch: "44px"
  field: "48px"
  row: "64px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.sumi}"
    rounded: "{rounded.base}"
    padding: "0 16px"
    height: "44px"
  button-hover:
    backgroundColor: "{colors.paper-deep}"
  button-primary:
    backgroundColor: "{colors.shu}"
    textColor: "{colors.on-shu}"
    rounded: "{rounded.base}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.shu-hover}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.sumi}"
    rounded: "{rounded.base}"
    padding: "0 12px"
    height: "48px"
  segmented-selected:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.paper}"
    height: "44px"
  seal-high:
    backgroundColor: "{colors.shu}"
    textColor: "{colors.on-shu}"
    rounded: "{rounded.base}"
    size: "22px"
  seal-medium:
    backgroundColor: "{colors.ai}"
    textColor: "{colors.paper}"
    rounded: "{rounded.base}"
    size: "22px"
  seal-low:
    backgroundColor: "{colors.ash}"
    textColor: "{colors.paper}"
    rounded: "{rounded.base}"
    size: "22px"
  seal-ink:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.paper}"
    rounded: "{rounded.base}"
    size: "22px"
  task-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.base}"
    height: "64px"
  panel:
    backgroundColor: "{colors.paper}"
    width: "704px"
  toast:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.paper}"
    rounded: "{rounded.base}"
---

# Design System: FocusList

## Overview

**Creative North Star: "The Printmaker's Studio"**

FocusList is a working to-do list that sits in front of a real ukiyo-e print. Each page has its own public-domain Met Open Access print (Hokusai on Tasks, Kuniyoshi on Overview, Hiroshige on Guide), shown as an art-directed photographic crop and never redrawn. The work happens on one solid papyrus panel; the print is the room around it and is never dimmed, masked or overlapped by content.

The personality is a printmaker's studio: ink blooms under a press, a seal stamps down, a row takes a brief wash of colour, a deleted row lifts away. Every gesture is small, quick and under 300 ms, and none ever makes the user wait, because state changes instantly and the motion only echoes it. Depth is tone and hairline, not shadow. Night is a second print, not an inversion: deep indigo panel, ivory ink, brighter vermilion, and the print dimmed under a veil.

**Key Characteristics:**
- Real prints behind, solid papyrus panel in front; the panel is the only working ground.
- Sumi ink and papyrus carry everything; vermilion is spent only on High priority, the primary action, focus and the current page; indigo marks Medium.
- One 2px corner, hairline borders, no shadows.
- Mincho display over a Gothic UI face; brush-hand kanji only as seals.
- One motion scale, six duration tokens, two curves, movement only on transform and opacity.

## Colors

A restrained print palette: warm paper and near-black ink carry the interface, vermilion (shu) lands the eye, indigo (ai) is the cool counterweight. All values are CSS variables on `:root`, remapped under `:root[data-theme='dark']`; components read tokens, never literal hex.

### Primary
- **Vermilion Shu** (`colors.shu`): primary action fill, High priority seal, focus outline (3px), caret, current-page nav underline, invalid-field border, field error text, kanji accent, new-row wash, tap highlight tint. Hover `colors.shu-hover`; text on it `colors.on-shu`. Night values: `colors.night-shu`, `colors.night-shu-hover`, `colors.night-on-shu`.

### Secondary
- **Prussian Indigo Ai** (`colors.ai`): the Medium priority seal. Night: `colors.night-ai`.

### Neutral
- **Papyrus Paper** (`colors.paper`): the panel, page ground and the veil colour. Night: `colors.night-paper`.
- **Deep Papyrus** (`colors.paper-deep`): hover fill on controls, completed rows (mixed 55/45 with surface), the loading colour behind a print. Night: `colors.night-paper-deep`.
- **Sheet Surface** (`colors.surface`): buttons, fields, task rows, plates and sheets. Night: `colors.night-surface`.
- **Sumi Ink** (`colors.sumi`): body text, selected segment fill, checked stamp, meter fill, toast ground, text selection background, ink bloom. Night: `colors.night-ivory`.
- **Soft Sumi** (`colors.sumi-soft`): secondary text, labels, placeholders, inactive nav. Night: `colors.night-ivory-soft`.
- **Ash** (`colors.ash`): Low priority seal. Night: `colors.night-ash`.
- **Edge Grey** (`colors.edge`): control borders. Night: `colors.night-edge`. A softer hairline (ink at 18% alpha, ivory at 20% at night) divides sheets and rings rows and the panel.

### Named Rules
**The One Vermilion Rule.** Vermilion marks High priority, the primary action, focus and the current page, and nothing else. Text selection is ink, completed rows recede to deeper paper and an ink stamp, so vermilion stays reserved.
**The Text Not Colour Rule.** Priority and completion are carried by a seal glyph plus a written label or a strike-through; tone only reinforces.
**The Night Veil Rule.** Night dims the print with a panel-coloured veil whose strength is `--veil` (0 by day, 0.58 at night), faded through opacity, never by filtering the image.

## Typography

**Display Font:** Shippori Mincho B1 (Yu Mincho, Hiragino Mincho ProN, Noto Serif JP, serif), bold 700 only
**Body Font:** Zen Kaku Gothic New (Yu Gothic, Hiragino Sans, Noto Sans JP, system-ui, sans-serif), 400 / 500 / 700
**Accent Font:** Yuji Syuku (Shippori Mincho B1, Yu Mincho, serif), subset to the few kanji used in seals

**Character:** A printed mincho voice for headings and numerals over a clear Gothic for everything tapped and read. Brush-hand kanji appear only as seal marks, never as copy.

### Hierarchy
- **Display** (700, 1.875rem, 2.25rem from `sm`, 1.15): page h1, one per page.
- **Headline** (700, 1.125rem to 1.25rem, 1.15): section h2, empty-state titles.
- **Numeral** (700, 1.5rem, 2.25rem when large, line-height 1, tabular figures): statistic values.
- **Title** (500, 1.0625rem, 1.375): task titles, wrapping anywhere.
- **Body** (400, 1rem, 1.55): default text.
- **Label** (500, 0.8125rem to 0.9375rem): field labels, stat labels, segmented options; chips at 700. Sentence case, no tracking, no uppercase.
- **Small** (500 to 700, 0.875rem): error messages, captions, key caps.
- **Small** (500 to 700, 0.875rem, 1.55): inline error messages, captions, secondary rows and key caps.
- **Wordmark** (700, 1.625rem, -0.01em, line-height 1).

### Named Rules
**The Mincho Speaks, Gothic Works Rule.** Mincho is for headings, numerals and the wordmark; every interactive label is Gothic.
**The Kanji Is a Mark Rule.** Yuji Syuku appears only inside seals, the check stamp and the small kanji accent, always decorative and `aria-hidden`.

## Layout

The shell is a print plus a panel. From 900px the print fills the viewport behind, and the panel is a full-height column on the right, at most 44rem (704px) wide with a 1px hairline on its left edge, 32px side padding from 640px. Below 900px the panel drops under the print: it starts 26dvh down, so a strip of the print shows above it, with a hairline border and 2px top corners and 16px side padding (32px from 640px). The narrow layout uses the portrait crop of each print, the wide layout the landscape crop, each with its own focal position. The print is fixed behind, so the panel scrolls over it.

Panel content is one column: wordmark and nav, the page title with live stats, the add form, filters, then the list. Rhythm is compact: 4px and 8px gaps inside controls, 12px to 16px between groups, 44px minimum hit size, 48px fields, 64px minimum task row. Pages load in with a panel stagger of 20 ms per child.

## Elevation & Depth

Flat by tonal layering. There are no box shadows anywhere. Depth is three tones (paper panel, lighter surface sheet, deeper paper for hover and completed) plus 1px hairlines. The panel separates from the print by a hairline and its solid fill, with no blur or translucency. The fixed toast and the exiting ghost row sit above by stacking order alone; the toast is set apart by an inverted ink fill.

### Named Rules
**The Flat Print Rule.** No shadows. Separate with a hairline or a tone step.
**The Sheet Not Cards Rule.** Related rows share one sheet divided by hairlines; do not tile separate cards.

## Shapes

Square-cut like a woodblock: one 2px radius on every control, sheet, plate, seal, stamp, task row, meter, toast and key cap, mapped over all Tailwind radius steps. The ink bloom is the one round form and exists only for a fraction of a second. Borders are 1px (edge grey on controls, soft hairline on containers); an invalid field goes to 2px vermilion. Seals are 22px squares; the check stamp is a 26px square inside a 44px hit area. The key cap alone has a 2px bottom border.

## Components

### Buttons
- **Shape:** 2px corners, 44px min height, 16px side padding, 1px edge border.
- **Default:** surface fill, sumi text; hover deepens to deep papyrus on fine pointers only.
- **Primary:** vermilion fill and border, on-shu text; hover to shu-hover. One per view.
- **Quiet / Icon:** quiet is transparent with a hairline on hover; icon is 44px square.
- **Press / Disabled:** active scales to 0.97 over the press token; disabled at 55% opacity.
- **Focus:** 3px vermilion outline, 2px offset.

### Inputs / Fields
- **Style:** surface fill, 1px edge border, 2px corners, 48px min height, 12px padding, sumi-soft placeholder; native select with a themed CSS chevron.
- **Focus:** border turns vermilion, outline flush, caret vermilion.
- **Error:** 2px vermilion border, vermilion 0.875rem message below, input row shakes.

### Segmented control
Joined 44px options in one bordered bar with hairline dividers. Selected is filled sumi with paper text, the label colour flipping early so it is never mid-grey on mid-grey; hover on unselected uses deep papyrus. Used for status and priority; the chosen priority's seal pops to 1.14.

### Seal (signature)
A 22px square stamp with a brush kanji: vermilion for High, indigo for Medium, ash for Low, ink for neutral counts. Always paired with a visible text label.

### Task row
Grid of 44px check, title, actions; surface fill, hairline border, 64px min height. The check is a square stamp that fills sumi and lands its kanji from 1.5x and turned -12deg. Completion sets deeper paper, soft-sumi title and a strike-through line drawn across the title. Editing swaps the row for a plate with a field, priority and save/cancel.

### Navigation
Text links, 44px tall, Gothic 500, sumi-soft. The current page is sumi text with a 3px vermilion underline that scales in from the left.

### Progress meter and Stats
A 12px bar with edge border and a sumi fill scaled from the left. Stats pair a Gothic label with a seal and a tabular mincho numeral that rolls in when it changes.

### Toast
Fixed, centred near the bottom. Sumi fill, paper text, 2px corners, with an inverted paper action button (undo after delete).

### Motion
Personality: a printmaker's studio. All durations come from tokens scaled by one `--motion-scale` (0 turns motion off but keeps state); CSS and `src/lib/motion.ts` read the same values.

Tokens: press 120ms, hover 140ms, state 200ms, enter 240ms, exit 180ms, page 280ms, stagger 20ms. Curves: `--ease-out` (0.23, 1, 0.32, 1) for entering, leaving and feedback; `--ease-in-out` (0.77, 0, 0.175, 1) for things already on screen that move.

| Interaction | Behaviour | Token |
|---|---|---|
| Buttons, tabs, filters, nav (pointer click) | Ink bloom grows from the pointer and fades | enter |
| Complete a task | Seal stamps down (scale and turn), stamp fills sumi | enter, exit |
| Complete a task | Strike-through draws across the title | state |
| New or changed row | Brief vermilion wash | enter |
| List add, remove, filter, edit | Rows FLIP to new positions, in-out curve | state |
| Delete | Real row leaves at once; an inert, aria-hidden ghost lifts away | exit |
| Filtered-out rows | Exit the same way | exit |
| Toast | Rises in, drops and fades on leave | enter, exit |
| Statistic change | Number rolls in from below | state |
| Rejected input | Input row shakes sideways | enter |
| Page load | Panel children rise 8px and fade, 20ms stagger | enter, stagger |
| Page change | New print cross-fades over the old | page |
| Theme switch | Colours and night veil cross-fade | enter |

Invariants: nothing exceeds 300ms; only transform and opacity move (colour transitions are state changes, not movement); keyboard activations and typing do not animate (ink bloom skips keyboard clicks, FLIP pauses while searching); reduced motion drops movement and keeps short linear fades (100 to 120ms).

## Do's and Don'ts

### Do:
- **Do** keep vermilion to High priority, the primary action, focus and the current page; text selection is ink.
- **Do** give every new surface the 2px corner and mark state with a seal plus a written label.
- **Do** separate rows with 1px hairlines on a shared surface sheet.
- **Do** keep 44px minimum touch targets and 3px vermilion focus outlines.
- **Do** read colours from the CSS variables so night works, and show each print as a real photographic crop with its provenance.
- **Do** take every duration from a `--dur-*` token, at most 300ms, scaled by `--motion-scale`, and animate only transform and opacity.
- **Do** keep the panel solid; the print is the room, the panel is the page.

### Don't:
- **Don't** add box shadows, text gradients or card grids.
- **Don't** use vermilion for decoration or completed state.
- **Don't** put kanji in body copy; labels stay plain English.
- **Don't** introduce a second radius or a second accent hue.
- **Don't** hardcode hex or millisecond values in components.
- **Don't** animate on keyboard activation or while typing, or hold the user up for a gesture.
- **Don't** use hand-drawn imitations of art; the backgrounds are real prints.

<!-- Not canonized: none; the build carries no craft-floor violations to inherit. -->
