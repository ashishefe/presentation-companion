# Presentation Companion

Turn any presentation into a personalized, interactive learning experience. Learners browse your slides, collect prompts tailored to their background, and download a `.md` file that turns any LLM into a personal tutor.

**No build tools. No dependencies. No server. Just static files.**

## How It Works

1. **You provide a `.pptx`** — export your slides as images
2. **You generate prompts** — use any LLM with the included prompt template to create interactive hotspots for your slides
3. **You fill in a config file** — title, author, sections, intro text
4. **You deploy** — drop the `site/` folder on any static host
5. **Learners explore** — they browse slides, click prompts, add notes, and download a personalized `.md` file to use with their preferred LLM

All data stays in the learner's browser. Nothing is sent to any server.

---

## Setup Guide (No Terminal Required)

This guide is for educators who use ChatGPT, Claude, or Gemini through the browser and aren't comfortable with the command line. **You don't need to install anything on your computer.**

### Step 1: Download this project

1. Go to [github.com/ashishefe/presentation-companion](https://github.com/ashishefe/presentation-companion)
2. Click the green **"Code"** button, then click **"Download ZIP"**
3. Unzip the downloaded file — you'll get a folder called `presentation-companion-main`

### Step 2: Export your slides as images

You need one PNG image per slide, named `slide-01.png`, `slide-02.png`, etc.

**From PowerPoint (Windows/Mac):**
1. Open your `.pptx` file in PowerPoint
2. Go to **File → Export** (Mac) or **File → Save As** (Windows)
3. Choose **PNG** as the format
4. Select **"Every Slide"** (not just the current one)
5. PowerPoint creates a folder of images — rename them to `slide-01.png`, `slide-02.png`, etc.
6. Copy all renamed images into the `site/images/` folder

**From Google Slides:**
1. Open your presentation in Google Slides
2. Go to **File → Download → PDF**
3. Open the PDF in any free online tool like [pdf2png.com](https://pdf2png.com) to split it into individual page images
4. Rename the images to `slide-01.png`, `slide-02.png`, etc.
5. Copy them into the `site/images/` folder

**From Keynote (Mac):**
1. Open your presentation in Keynote
2. Go to **File → Export To → Images...**
3. Choose PNG format, click Next, and save
4. Rename the images to `slide-01.png`, `slide-02.png`, etc.
5. Copy them into the `site/images/` folder

### Step 3: Edit the config file

Open `site/js/config.json` in any text editor (TextEdit on Mac, Notepad on Windows — or any code editor). This file controls everything about your companion site.

Here's what to change:

```json
{
  "title": "Your Presentation Title",        ← change this
  "author": {
    "name": "Your Name",                     ← change this
    "institution": "Your University",         ← change this
    "program": "Your Program"                 ← change this (or delete the line)
  },
  "totalSlides": 20,                          ← set to your actual slide count
  "storagePrefix": "my-talk",                 ← a short unique ID (no spaces)
  "downloadPrefix": "my-talk-prompts",        ← prefix for the downloaded file name
  "slideTitles": [                            ← one title per slide
    "Title Slide",
    "Introduction",
    "Main Argument",
    "..."
  ],
  ...
}
```

The file includes comments in the [Config Reference](#config-reference) below explaining every field. The most important ones are `title`, `totalSlides`, and `slideTitles`. Everything else has sensible defaults.

**Tip:** If you've never edited JSON before, paste your edited file into [jsonlint.com](https://jsonlint.com) to check for typos (missing commas, extra quotes, etc.) before saving.

### Step 4: Generate prompts

This is where AI does the heavy lifting. You'll upload your slide images into an LLM and ask it to create the prompts file.

1. Open [PROMPT_GUIDE.md](PROMPT_GUIDE.md) in this project — it contains a ready-to-use prompt template
2. Go to your preferred LLM:
   - [claude.ai](https://claude.ai) (Claude)
   - [chatgpt.com](https://chatgpt.com) (ChatGPT)
   - [gemini.google.com](https://gemini.google.com) (Gemini)
3. Start a new conversation
4. Upload all your slide images (or in batches of ~20 if you have many slides)
5. Copy and paste the prompt template from PROMPT_GUIDE.md into the chat
6. The LLM will generate a JSON array of prompts
7. Copy the output, save it as `site/js/prompts.json` (replacing the existing empty file)

**Tip:** If the LLM's output includes extra text around the JSON (like "Here's your prompts file:"), just copy the part between the `[` and `]` brackets.

### Step 5: Test locally

Before deploying, check that your site works:

1. Open the `site/index.html` file in your web browser
   - **Important:** Some browsers block local file loading. If the site looks broken or prompts don't appear:
   - **Option A (easiest):** Skip to Step 6 and test on Netlify directly — it's free and instant
   - **Option B:** If you have Python installed, open Terminal/Command Prompt, navigate to the `site/` folder, and run: `python3 -m http.server 8000` — then open `http://localhost:8000`
   - **Option C:** If you have Node.js, run `npx serve site` from the project folder

2. You should see your presentation title, your intro text, and the intake form
3. Fill in the form, browse the slides, and verify the hotspot circles appear on slides that have prompts

### Step 6: Deploy (put it on the internet)

Your site is just a folder of static files. The easiest way to put it online — **no account setup, no credit card, completely free:**

**Netlify (recommended — drag and drop):**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag your entire `site/` folder onto the page
3. Done — you'll get a URL like `https://random-name-12345.netlify.app`
4. Share that URL with your students

**GitHub Pages (if you have a GitHub account):**
1. Create a new repository on GitHub
2. Upload the contents of the `site/` folder to the repository
3. Go to Settings → Pages → set source to the main branch
4. Your site will be live at `https://yourusername.github.io/repo-name`

**Vercel:**
1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Import your project and set the root directory to `site/`
3. Deploy

That's it! Your students can now visit the URL, fill in their background, browse slides, collect prompts, and download their personalized `.md` file.

---

## Quick Start (Terminal)

If you're comfortable with the command line, this is faster:

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

---

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
├── setup.sh                 # PPTX → PNGs + starter config (terminal users)
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
│   └── images/              # Slide PNGs (you add these)
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
