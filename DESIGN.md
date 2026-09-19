---
name: FocusList
description: A to-do list painted in ink, one papyrus column beside a ukiyo-e painting with a single brush stroke walking through it.
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
  night-shu: "#f0644b"
  night-shu-hover: "#f47e69"
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
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.15
  numeral:
    fontFamily: "'Shippori Mincho B1', 'Yu Mincho', serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
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
  touch: "44px"
  lane-mobile: "34px"
  lane-desktop: "80px"
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
  task-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.base}"
    height: "64px"
  toast:
    backgroundColor: "{colors.sumi}"
    textColor: "{colors.paper}"
    rounded: "{rounded.base}"
---

# Design System: FocusList

## Overview

**Creative North Star: "The Inked Print"**

FocusList is a working to-do list set inside an ukiyo-e print. The app is one papyrus column; the painting (sun, Fuji, wave, pine) fills the margin beside it and fades into the paper under a mask, so the working area is always clean ground. One thick sumi brush stroke is the signature: it is a single continuous path that runs down the left lane on Tasks, right along the bottom on Overview, and up the right lane with a hook on Guide. The stroke and the painting read the same tokens as the UI, so day and night stay one system.

The system is a printed sheet, not an app dashboard. Content sits on a single papyrus sheet divided by hairlines rather than a grid of cards. Density is compact and practical: 44px touch rows, plain literal labels, and Japanese characters only as small decorative accents (seal glyphs, wordmark kanji). Depth is carried by tone and rules, never by shadow.

Night is not an inversion but a second print: deep indigo ground, ivory ink, a brighter vermilion, and the painting repainted in darker wave and dusk values.

**Key Characteristics:**
- Papyrus ground, sumi ink, one vermilion accent, indigo as a secondary voice.
- Single 2px corner everywhere; hairline borders; no shadows.
- Mincho display over a Gothic UI face, with kanji seals as state markers.
- One ease-out curve; short control feedback; one long stroke tween.
- The brush lanes are reserved margin, set by tokens, and content never enters them.

## Colors

A restrained print palette: warm paper and near-black ink carry the whole interface, with vermilion (shu) spent only where the eye must land and indigo (ai) as the cool counterweight.

### Primary
- **Vermilion Shu** (`colors.shu`): the single accent. Primary action button fill, High priority seal, focus outline, selection, caret, current-page nav underline, invalid-field border, field error text, kanji accent. Night value is `colors.night-shu`, hover `colors.shu-hover` / `colors.night-shu-hover`.

### Secondary
- **Prussian Indigo Ai** (`colors.ai`): the Medium priority seal and the Total stat seal, plus the deep wave in the painting. Night value is `colors.night-ai`.

### Neutral
- **Papyrus Paper** (`colors.paper`): page ground. Night: `colors.night-paper`.
- **Deep Papyrus** (`colors.paper-deep`): hover fill on controls and completed task rows (mixed 55/45 with surface). Night: `colors.night-paper-deep`.
- **Sheet Surface** (`colors.surface`): buttons, fields, task rows, the sheet and plate containers. Night: `colors.night-surface`.
- **Sumi Ink** (`colors.sumi`): body text, selected segment fill, checked stamp, progress meter fill, toast ground. Night: `colors.night-ivory`.
- **Soft Sumi** (`colors.sumi-soft`): secondary text, labels, placeholders, inactive nav. Night: `colors.night-ivory-soft`.
- **Ash** (`colors.ash`): Low priority and quiet seals.
- **Edge Grey** (`colors.edge`): control borders, scrollbar thumb. A softer hairline (ink at 18% alpha, ivory at 20% at night) divides sheet rows and rings task rows.

### Named Rules
**The One Vermilion Rule.** Vermilion marks primary action, High priority, focus and the current page, and nothing else. Completed rows recede to deeper paper and an ink stamp precisely so vermilion stays reserved.
**The Text Not Colour Rule.** Priority and completion are always carried by a seal glyph plus a written label or strikethrough; the tone only reinforces.
**The Shared Token Rule.** The painting and brush read the same variables (`--p-*`, `--brush`) as the UI; a theme change repaints both.

## Typography

**Display Font:** Shippori Mincho B1 (Yu Mincho, Hiragino Mincho ProN, Noto Serif JP, serif), bold 700 only
**Body Font:** Zen Kaku Gothic New (Yu Gothic, Hiragino Sans, Noto Sans JP, system-ui, sans-serif), 400 / 500 / 700
**Accent Font:** Yuji Syuku (Shippori Mincho B1, Yu Mincho, serif), subset to the few kanji used (集 高 中 全 低 済 残)

**Character:** A printed mincho voice for headings and numerals over a clear Gothic for everything you tap and read. The brush-hand kanji appear only as seal marks, never as copy.

### Hierarchy
- **Display** (700, 1.875rem, 2.25rem from `sm`, 1.15): page h1, one per page.
- **Headline** (700, 1.125rem, 1.15): section h2 on Overview and Guide; empty-state titles at 1.25rem.
- **Numeral** (700, 1.5rem, or 2.25rem when large, line-height 1, tabular figures): statistic values.
- **Title** (500, 1.0625rem, 1.375): task titles.
- **Body** (400, 1rem, 1.55): default text; wraps anywhere for long titles.
- **Label** (500, 0.8125rem to 0.9375rem): field labels, stat labels, segmented options, chips (chips at 700). Sentence case, no tracking, no uppercase.
- **Wordmark** (700, 1.625rem, -0.01em, line-height 1).

### Named Rules
**The Mincho Speaks, Gothic Works Rule.** Mincho is for headings, numerals and the wordmark; every interactive label is Gothic.
**The Kanji Is a Mark Rule.** Yuji Syuku appears only inside seals, the check stamp, and the header accent, sized 0.9375rem to 1.25rem, always `aria-hidden` and decorative.

## Layout

One column on a papyrus shell whose side padding equals the brush lanes: `--lane-l` and `--lane-r` (34px base, 72px at 640, 80px at 1024, 96px at 1280) and `--lane-b` (44px, 64px, 72px at 1280), with `--stroke` (20px, 40px, 44px, 52px) as the brush width. Content never enters a lane, so the stroke never overlaps it. The painting is fixed behind the shell (`layer-fixed`), masked to fade out toward the app: a band along the bottom below 1024px, the right side from 1024px up.

Pages fit the viewport in normal use and load in; scrolling is allowed but never required. The Tasks page stacks stats beside the title, the add form, filters, then the list. Rhythm is compact: 4px and 8px gaps inside controls, 12px to 16px between groups, 44px minimum hit size, 64px minimum task row.

## Elevation & Depth

Flat by tonal layering. There are no box shadows anywhere. Depth comes from three tones (paper ground, lighter surface sheet, deeper paper for hover and completed) and 1px hairline borders. The only overlap is the fixed toast, which is set apart by an inverted ink fill rather than a shadow.

### Named Rules
**The Flat Print Rule.** No shadows. Separate with a hairline or a tone step.
**The Sheet Not Cards Rule.** Related rows share one sheet divided by hairlines; do not tile separate cards.

## Shapes

Square-cut like a woodblock print: one 2px radius on every control, sheet, seal, task row, meter, toast and key cap, mapped to all Tailwind radius steps. Borders are 1px (edge grey on controls, soft hairline on containers); invalid fields go to 2px vermilion. Seals are 22px squares. The check is a 26px square stamp inside a 44px hit area. The keycap alone gets a 2px bottom border for weight.

## Components

### Buttons
- **Shape:** 2px corners, 44px min height, 16px side padding, 1px border.
- **Default:** surface fill, sumi text, edge border; hover deepens to deep papyrus (pointer-fine devices only).
- **Primary:** vermilion fill and border, on-shu text; hover to shu-hover.
- **Quiet / Icon:** quiet is transparent with a hairline on hover; icon is 44px square.
- **Press / Disabled:** 1px downward nudge over 100ms; disabled at 55% opacity, not-allowed cursor.
- **Focus:** 3px vermilion outline, 2px offset.

### Inputs / Fields
- **Style:** surface fill, 1px edge border, 2px corners, 48px min height, 12px padding, sumi-soft placeholder. Native select with a themed CSS chevron.
- **Focus:** border turns vermilion, outline flush (offset 0), caret vermilion.
- **Error:** 2px vermilion border with vermilion 0.875rem message below.

### Segmented control
Joined 44px options in one 1px bordered bar with hairline dividers. Selected option is filled sumi with paper text; hover on unselected uses deep papyrus. Used for status and priority filters.

### Seal (signature)
A 22px square stamp with a brush kanji: vermilion for High, indigo for Medium, ash for Low, ink for neutral counts and completion. Always paired with a visible text label.

### Task row
Grid of 44px check, title, actions. Surface fill, hairline border, 64px min height. The check is a square stamp that fills sumi with a kanji when done. Completion sets a slightly deeper paper, soft-sumi title and a strikethrough line that draws across the title in 280ms.

### Navigation
Text links, 44px tall, Gothic 500, sumi-soft. The current page gets sumi text and a 3px vermilion underline; colour and border change in 140ms.

### Progress meter and Stats
The meter is a 12px bar with edge border and a sumi fill scaled from the left over 320ms. Stats pair a Gothic label with a seal and a tabular mincho numeral.

### Toast
Fixed, centred above the bottom lane. Sumi fill, paper text, 2px corners, with an inverted paper action button (undo after delete). Enters with an 8px rise in 180ms.

### Brush journey
One continuous path revealed by stroke-dash offset, coloured `--brush` (sumi by day, ivory at night), width `--stroke`. Route sets the path: down the left lane on Tasks, along the bottom on Overview, up the right lane with a hook on Guide. Route change tweens the leading edge over 650ms.

### Motion
One curve, `cubic-bezier(0.23, 1, 0.32, 1)`. Page load-in 200ms (opacity plus 8px rise), control feedback 100 to 160ms, row entry 200ms, strike 280ms, meter 320ms, brush 650ms. Everything is opt-in under `prefers-reduced-motion: no-preference`; reduce collapses transitions to near zero and the stroke to its static painted state.

## Do's and Don'ts

### Do:
- **Do** keep vermilion to primary action, High priority, focus and the current page.
- **Do** use the 2px corner on every new surface and mark state with a seal plus a written label.
- **Do** separate rows with 1px hairlines on a shared surface sheet.
- **Do** keep 44px minimum touch targets and 3px vermilion focus outlines.
- **Do** keep content out of the brush lanes and route new colors through the CSS variables so night works.
- **Do** ease everything with the one ease-out curve and gate motion on `prefers-reduced-motion`.

### Don't:
- **Don't** add box shadows, gradients on text, or card grids.
- **Don't** use vermilion for decoration or completed state.
- **Don't** put kanji in body copy; labels stay plain English.
- **Don't** introduce a second radius or a second accent hue.
- **Don't** use hardcoded hex in components; read the tokens.
- **Don't** let the painting or stroke overlap or dim content.

<!-- Not canonized: none of the build's defects were promoted; the sidecar lists no craft-floor violations to inherit. -->
