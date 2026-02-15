# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A config-driven static site template that turns any presentation into an interactive learning companion. Educators provide slide images and use an LLM to generate discussion prompts. Learners browse slides, collect prompts tailored to their background, and download a `.md` file for use with any LLM.

Zero dependencies. No build step. No server. Vanilla HTML/CSS/JS only.

## Local Development

```bash
# Serve the site locally (requires Node.js)
npx serve site

# Or with Python
cd site && python3 -m http.server 8000
```

The site is three static HTML pages — no compilation or bundling needed.

## Architecture

### Config-driven design

Everything presentation-specific lives in `site/js/config.json`. All three pages fetch this file at runtime via `CompanionConfig.load()` from `shared.js`. There are no hardcoded presentation values in HTML or JS.

### Page flow

1. **`index.html`** — Intake form. Collects learner's name, profession, curiosity. Stores in `sessionStorage`.
2. **`slides.html`** — Slide viewer with clickable hotspot circles. Prompts come from `prompts.json`. Collected prompts stored in `localStorage`.
3. **`help.html`** — Download page. Generates a `.md` file client-side via Blob URL. Optional FAQ and contact sections (hidden if not in config).

### Key module: `site/js/shared.js`

IIFE that exports `window.CompanionConfig` with:
- `load()` — fetches and caches `config.json`
- `get()` — returns cached config (must call `load()` first)
- `storageKey(suffix)` — returns `${config.storagePrefix}-${suffix}` for localStorage/sessionStorage isolation
- `generateMd(config, intake, collected, notes)` — builds the `.md` export string
- `triggerDownload(config, intake, collected, notes)` — generates and downloads the `.md` file

This module is the single source of truth for config access and .md generation. Both `app.js` and `help.html` depend on it.

### Hotspot coordinate system

Prompts in `prompts.json` use percentage-based `x`/`y` coordinates (0-100) relative to the slide image. The "master" prompt type always renders as a star in the top-right corner regardless of coordinates.

### Template variables

Prompts use `{{profession}}`, `{{curiosity}}`, and `{{name}}` placeholders filled from intake data. Multi-placeholder patterns are collapsed to "Given what you know about me" in the slide viewer since the `.md` preamble provides full context.

### Conditional UI

`help.html` hides the contact card and FAQ section entirely if `config.contact` or `config.faq` are absent from `config.json`. No errors — just hidden.

## Setup Script (`setup.sh`)

Converts `.pptx` → PDF (LibreOffice) → per-slide PNGs (pdftoppm/ImageMagick). Checks all prerequisites upfront before doing any work. Generates a starter `config.json` with the correct slide count.

macOS: LibreOffice may be at `/Applications/LibreOffice.app/Contents/MacOS/soffice` rather than on PATH.

## Privacy Model

All data stays in the browser. No server communication (except Google Fonts CDN). No analytics, cookies, or tracking. The `.md` file is generated entirely client-side.
