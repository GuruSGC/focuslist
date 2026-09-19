# Product


## Platform

web

## Stack

React + TypeScript + Vite + Tailwind CSS v4 (the user's choice). Vitest for logic tests. Deployed to Vercel from a GitHub repository (user handles logins). No backend of any kind.

## Users

Individuals planning and tracking their own daily tasks on desktop or phone. Assumption (inferred from the brief, not interviewed): this build is also evaluated by an automated frontend scoring engine (FAIE) that inspects UI/UX, required features, code quality, responsiveness, accessibility, performance and documentation.

## Product Purpose

FocusList lets a person capture tasks, give each a priority, find them again, and see how much of the day is done. Success is a short path from "I need to remember this" to a visibly tidy, prioritised list that is still there after a refresh.

## Positioning

A to-do list set against a Japanese ukiyo-e painting, with one thick black sumi brush stroke as its signature: the stroke starts downward, keeps going as you move through the app, and turns to a new direction as you go to the next page. A neighbouring to-do app could not truthfully copy that identity.

## Operating Context

Single-page frontend app made of a few short pages (Tasks, Overview, Guide) reached by clicking, not by long scrolling. All state lives in the browser (`localStorage`). Used in short, frequent sessions (add, tick off, reprioritise, search). Must work across phone and desktop widths and with keyboard alone. Pages fit the viewport in normal use; scrolling is allowed but never required to reach a feature.

## Capabilities and Constraints

Required features:
- Create a task from a title.
- Mark complete, edit, delete.
- Priority per task: High, Medium, Low, clearly visible.
- Search by title; filter by All / Active / Completed; filter by priority. Search and filters read from the underlying task data.
- Statistics: Total Tasks, Completed Tasks, Pending Tasks, updating live.
- Persistence across page refresh via `localStorage`.

Constraints:
- Frontend only. No backend, no external database. `localStorage` allowed.
- Completed vs pending must be visually distinguishable; controls need clear visual feedback; consistent spacing, type and hierarchy.
- Working live deployment is required.
- The build window for this run is about one hour.

Polish agreed with the user: dark theme, undo after delete, keyboard-friendly inline edit, empty and no-results states, progress bar.

Undecided: none blocking.

## Brand Commitments

- Name: FocusList.
- Binding theme (user, explicit, revision 3): Japanese, drawn from famous Japanese paintings of the ukiyo-e and samurai era; a suitable Japanese typeface. The backgrounds are REAL public-domain prints from the Met Open Access collection, one per page, not hand-drawn vector imitations (the user judged the vector painting sloppy). Pages stay practical and mostly non-scrolling, navigated by clicking.
- Removed (user, explicit, revision 3): the thick black brush stroke idea, entirely.
- Motion (user, explicit, revision 3): every user action gets a visible, smooth, tasteful animation with one consistent personality. The user said "slow" only to stress that most clicks had no animation at all. Chosen speed tier: snappy, under 300 ms, with state changes staying instant and input never blocked. Motion must be checkable in a real browser.
- Priority: maximise the automated evaluation score first (features, accessibility, responsiveness, performance, code quality, documentation); the theme and motion serve that, never obstruct it.
- Artwork: real Met public-domain prints (Hokusai, Kuniyoshi, Hiroshige), optimised locally, credited in the Guide. Downloads were approved by the user for these three prints only.
- Copy voice: plain, literal English labels and buttons (Total Tasks, High, Completed, and so on). Japanese characters appear only as decorative accents.

## Evidence on Hand

No real users, testimonials, metrics or customer content exist. Nothing of that kind may be invented. Sample tasks, if shown, are labelled as examples.

## Product Principles

1. Function first: every required feature is reachable with visible, literal labels and works by keyboard and touch.
2. The painting never gets in the way: the backdrop and brush stroke are decorative, sit in reserved margins, never overlap or dim content, and collapse to a static state under reduced motion.
3. Progress is legible: state (completed, pending, priority) is shown by text and form, never by colour alone.
4. Small and fast: no images to fetch, no backend, minimal dependencies.
5. Honest craft: original artwork, real data only, no fabricated claims.

## Accessibility & Inclusion

Target WCAG 2.2 AA. Respect `prefers-reduced-motion` (static, fully painted state) and `prefers-color-scheme`. Kanji accents are decorative and hidden from assistive tech, with `lang="ja"` where they are exposed. Touch targets at least 44 px.
