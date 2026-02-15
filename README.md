# Presentation Companion

Turn any presentation into a personalized, interactive learning experience. Learners browse your slides, collect prompts tailored to their background, and download a `.md` file that turns any LLM into a personal tutor.

**No build tools. No dependencies. No server. Just static files.**

## How It Works

1. **You provide a `.pptx`** — the setup script extracts slide images
2. **You generate prompts** — use any LLM with the included prompt template to create interactive hotspots for your slides
3. **You fill in a config file** — title, author, sections, intro text
4. **You deploy** — drop the `site/` folder on any static host
5. **Learners explore** — they browse slides, click prompts, add notes, and download a personalized `.md` file to use with their preferred LLM

All data stays in the learner's browser. Nothing is sent to any server.

## Quick Start

### Prerequisites

- [LibreOffice](https://www.libreoffice.org/) — converts `.pptx` to PDF
- [poppler](https://poppler.freedesktop.org/) (recommended) or [ImageMagick](https://imagemagick.org/) — splits PDF into per-slide PNGs
- A static file server for local testing (`npx serve` or `python3 -m http.server`)
- Any LLM for generating prompts (Claude, ChatGPT, Gemini, etc.)

**Quick install (macOS):**
```bash
brew install --cask libreoffice && brew install poppler
```

**Quick install (Ubuntu/Debian):**
```bash
sudo apt install libreoffice poppler-utils
```

### Setup

```bash
# Clone the template
git clone https://github.com/ashishefe/presentation-companion.git my-companion
cd my-companion

# Convert your presentation to slide images
./setup.sh path/to/your-presentation.pptx

# Edit the generated config
# (The script pre-fills totalSlides and creates placeholder slide titles)
open site/js/config.json

# Generate prompts using any LLM
# Follow PROMPT_GUIDE.md — copy the template, upload your slides, save the output
# Save as site/js/prompts.json

# Test locally
npx serve site
```

### Deploy

The `site/` directory is a complete static site. Deploy it anywhere:

**Vercel**:
```bash
cd site && npx vercel
```

**Netlify**: Drag the `site/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

**GitHub Pages**: Push to a repo, go to Settings → Pages, set source to the `site/` directory (or use a GitHub Action).

## Config Reference

Edit `site/js/config.json` to customize your companion site:

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Presentation title — shown in headers and the `.md` export |
| `subtitle` | No | Badge text on the intro page (default: "Interactive Learning Resource") |
| `author.name` | Yes | Your name — used in `.md` footer |
| `author.institution` | Yes | Your institution |
| `author.program` | No | Program or course name |
| `totalSlides` | Yes | Number of slides (auto-filled by `setup.sh`) |
| `storagePrefix` | Yes | Unique prefix for localStorage keys (prevents collisions if hosting multiple companion sites on the same domain) |
| `downloadPrefix` | Yes | Filename prefix for the downloaded `.md` file |
| `slideTitles` | Yes | Array of slide titles (one per slide) |
| `sections` | No | Array of `{ beforeSlide, label }` objects for nav drawer section dividers |
| `intro.paragraphs` | Yes | Array of HTML strings for the intro page description |
| `mdExport.header` | Yes | Header text in the `.md` file (e.g., "Personal Learning Prompts") |
| `mdExport.lectureDescription` | Yes | One-sentence description of the lecture for the meta-prompt |
| `mdExport.footer` | Yes | Array of footer lines for the `.md` file |
| `links.github` | No | URL to your GitHub repo (shown in FAQ if present) |
| `links.readingList` | No | URL to a companion reading list (shown on intro page if present) |
| `contact.bio` | No | Short bio for the help page contact card (hidden if absent) |
| `contact.email` | No | Contact email (hidden if absent) |
| `faq` | No | Array of `{ question, answer }` objects (hidden if absent) |

## Project Structure

```
presentation-companion/
├── README.md                # This file
├── LICENSE                  # MIT
├── .gitignore
├── PROMPT_GUIDE.md          # LLM prompt template for generating prompts.json
├── setup.sh                 # PPTX → PNGs + starter config
├── site/
│   ├── index.html           # Intake form (config-driven)
│   ├── slides.html          # Slide viewer with hotspots
│   ├── help.html            # Download/preview + optional FAQ/contact
│   ├── css/style.css        # Design system
│   ├── js/
│   │   ├── shared.js        # Config loader + .md generation
│   │   ├── app.js           # Slide viewer logic
│   │   ├── config.json      # Presentation metadata (you fill this in)
│   │   └── prompts.json     # Generated prompts (you generate via LLM)
│   └── images/              # Slide PNGs (setup.sh populates)
└── docs/
    └── PHILOSOPHY.md         # Design philosophy and pedagogy
```

## How Prompts Work

Each slide can have multiple prompt types:

- **Master** (star icon) — covers the entire slide theme, always top-right
- **Verify** — fact-check a specific claim
- **Apply** — connect the concept to the learner's profession
- **Steelman** — argue for or against a position

Prompts use `{{profession}}`, `{{curiosity}}`, and `{{name}}` placeholders that get filled with the learner's intake data. In the slide viewer, multi-placeholder patterns are collapsed to "Given what you know about me" since the `.md` preamble provides the full context.

See [PROMPT_GUIDE.md](PROMPT_GUIDE.md) for the complete generation workflow.

## Privacy

- Zero server communication (except Google Fonts CDN)
- All data stays in the browser (localStorage + sessionStorage)
- The `.md` file is generated client-side via Blob URL
- No analytics, no tracking, no cookies

## Built With

- Vanilla HTML, CSS, and JavaScript
- No frameworks, no build tools, no npm packages
- [Spectral](https://fonts.google.com/specimen/Spectral) + [Inter](https://fonts.google.com/specimen/Inter) fonts via Google Fonts

## License

MIT — see [LICENSE](LICENSE).

## Background

Read [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) for the design philosophy behind this project: why privacy-first, why LLM-agnostic, why zero-dependency, and the pedagogy behind personalized prompt curation.
