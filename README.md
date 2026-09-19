# FocusList

A frontend-only to-do app set against a Japanese ukiyo-e painting. Tasks, priorities, search, filters and live statistics, with one thick black sumi brush stroke that runs through the app: it starts downward, keeps going as you scroll, and turns to a new direction as you move between pages.

Live demo: https://webrushhack.vercel.app

Source: https://github.com/GuruSGC/focuslist

## Overview

FocusList is a small React app with three short pages that fit the screen, so nothing needs long scrolling:

- **Tasks**: add, complete, edit and delete tasks; search and filter; live statistics.
- **Overview**: completion progress, a priority breakdown, and the next tasks to do.
- **Guide**: how the app works, keyboard shortcuts, and where your data lives.

Everything runs in the browser. There is no backend and no database. Tasks are stored in `localStorage`.

## Features

| Requirement | How it works |
| --- | --- |
| Create tasks | Type a title and press Enter or **Add task**. Empty, whitespace-only and over-120-character titles show an inline error. |
| Complete, edit, delete | Tick the stamp checkbox to complete. **Edit** opens an inline form (Enter saves, Esc cancels). **Delete** removes the task and offers **Undo** for six seconds. |
| Priority | High, Medium or Low on every task, shown as text plus a seal (高 中 低), never by colour alone. Changeable while editing. |
| Search and filters | Search by title, filter by All / Active / Completed, and by priority. They combine, and the visible list follows the underlying data. A no-results state offers **Clear filters**. |
| Statistics | **Total Tasks**, **Completed** and **Pending**, plus a completion percentage, on the Tasks and Overview pages. They update on every change. |
| Persistence | Tasks and the theme survive a refresh. Corrupted storage falls back to an empty list. Open tabs stay in sync. |
| Completed vs pending | Completed rows get a filled 済 stamp, a muted surface, and a brush strike-through that draws left to right. |

Also included: a light and a dark ("night") theme, hash routing with back and forward support, and shortcuts (`N` new task, `/` search).

## Screenshots

![Tasks page, light theme](docs/screenshots/tasks-desktop.png)

![Tasks page, dark theme](docs/screenshots/tasks-dark-desktop.png)

![Overview page: the brush stroke has turned right along the bottom](docs/screenshots/overview-desktop.png)

![Guide page: the stroke turns up the right side and ends in a hook](docs/screenshots/guide-desktop.png)

![Tasks page on a phone](docs/screenshots/tasks-mobile.png)

## Tech stack

- React 19 and TypeScript (strict)
- Vite and Tailwind CSS v4
- Motion (only its `scroll()` helper, for scroll-linked painting)
- Phosphor icons
- Vitest for logic tests; Playwright, axe-core and Lighthouse for verification
- Fonts self-hosted: Shippori Mincho B1 (display), Zen Kaku Gothic New (interface), Yuji Syuku (kanji accents, subset to seven characters)

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run build` | Type-check and produce the production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest logic tests |
| `npm run lint` | ESLint |
| `node scripts/screenshots.mjs` | Regenerate the screenshots above |

## Architecture

```
src/
  types.ts              shared types
  lib/
    tasks.ts            pure reducer, validation, filtering, statistics
    storage.ts          versioned localStorage read/write with validation
    routes.ts           hash routes
    brush.ts            pure geometry for the brush stroke (journey, bristles, targets)
    ease.ts             cubic-bezier easing and a small tween
  hooks/                useTasks, useRoute, useTheme, useViewport, useReducedMotion
  components/           TaskForm, Toolbar, TaskList, TaskItem, Stats, Header, Backdrop, BrushJourney, ...
  pages/                TasksPage, OverviewPage, GuidePage
tests/                  Vitest tests for tasks, storage, routes, brush geometry and easing
scripts/                Playwright and Lighthouse checks used to verify the build
```

Design decisions:

- **Logic is pure and tested.** All task behaviour lives in `lib/tasks.ts` as a reducer plus pure functions. Components only render and dispatch.
- **Statistics come from the full list**, not the filtered view, so filters never change the totals.
- **Hash routing** works on any static host with no rewrite rules and gives back and forward for free.
- **The brush stroke is geometry, not an image.** `lib/brush.ts` builds one continuous path (down the left lane, right along the bottom, up the right lane with a hook) and a set of bristles. `BrushJourney` reveals it by animating stroke dash offsets. There are no SVG filters and no images.
- **Decorative layers never touch content.** The painting and the stroke are `aria-hidden`, ignore pointer events, sit behind the app, and stay inside reserved margins so no text or control overlaps them.

## Accessibility

- Semantic landmarks, a skip link, one `h1` per page, and focus moved to the page heading on navigation.
- Every control has a visible or accessible name; priority and completion are conveyed by text and shape, not colour alone.
- Full keyboard use: add, complete, edit, delete and undo all work without a mouse, with a visible focus ring everywhere.
- Touch targets are at least 44 px.
- Contrast is AA in both themes. axe reports no serious or critical violations on any page in light or dark.
- `prefers-reduced-motion` gives instant state changes and a static stroke; `prefers-color-scheme` sets the first theme.
- Kanji are decorative accents marked `aria-hidden`, with `lang="ja"`; all labels are literal English.

## Performance

Measured on the production build (Lighthouse, mobile emulation):

| Performance | Accessibility | Best practices | SEO | CLS |
| --- | --- | --- | --- | --- |
| 97 | 100 | 100 | 100 | 0.001 |

The JavaScript bundle is about 87 KB gzipped, fonts are about 67 KB, and there are no image files: the painting is inline SVG.

## Deployment

The app is a static build (`npm run build`, output in `dist/`), deployed on Vercel with the default Vite settings: build command `npm run build`, output directory `dist`. Live at https://webrushhack.vercel.app.

To deploy your own copy: `npx vercel deploy --prod`.

## Credits

Original vector artwork inspired by ukiyo-e prints. Fonts are used under the SIL Open Font License.
