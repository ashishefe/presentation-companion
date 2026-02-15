#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# Presentation Companion — Setup Script
# Converts a .pptx to slide PNGs and generates a starter config
# ──────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/site/images"
CONFIG_FILE="$SCRIPT_DIR/site/js/config.json"

# ── Check arguments ──
if [ $# -lt 1 ]; then
  echo "Usage: ./setup.sh <path-to-presentation.pptx>"
  echo ""
  echo "This script converts your .pptx to slide images and generates"
  echo "a starter config.json for your companion site."
  exit 1
fi

PPTX_FILE="$1"

if [ ! -f "$PPTX_FILE" ]; then
  echo "Error: File not found: $PPTX_FILE"
  exit 1
fi

# ── Check LibreOffice ──
if ! command -v libreoffice &> /dev/null; then
  echo "Error: LibreOffice is required but not installed."
  echo ""
  echo "Install it:"
  echo "  macOS:   brew install --cask libreoffice"
  echo "  Ubuntu:  sudo apt install libreoffice"
  echo "  Fedora:  sudo dnf install libreoffice"
  exit 1
fi

# ── Convert PPTX → PNGs ──
echo "Converting slides to PNG images..."

TEMP_DIR=$(mktemp -d)
libreoffice --headless --convert-to png --outdir "$TEMP_DIR" "$PPTX_FILE" > /dev/null 2>&1

# LibreOffice exports one PNG per slide, but naming varies.
# We need to rename them to slide-01.png, slide-02.png, etc.
mkdir -p "$IMAGES_DIR"

# Remove any existing slide images
rm -f "$IMAGES_DIR"/slide-*.png

# Sort and rename the exported PNGs
SLIDE_COUNT=0
for png in $(ls "$TEMP_DIR"/*.png 2>/dev/null | sort); do
  SLIDE_COUNT=$((SLIDE_COUNT + 1))
  PADDED=$(printf "%02d" $SLIDE_COUNT)
  cp "$png" "$IMAGES_DIR/slide-${PADDED}.png"
done

rm -rf "$TEMP_DIR"

if [ "$SLIDE_COUNT" -eq 0 ]; then
  echo "Error: No slides were generated. Check that the file is a valid .pptx."
  exit 1
fi

echo "Exported $SLIDE_COUNT slides to site/images/"

# ── Generate starter config.json ──
echo "Generating starter config.json..."

# Build slide titles placeholder array
SLIDE_TITLES="["
for i in $(seq 1 $SLIDE_COUNT); do
  if [ $i -gt 1 ]; then SLIDE_TITLES+=", "; fi
  SLIDE_TITLES+="\"Slide $i\""
done
SLIDE_TITLES+="]"

cat > "$CONFIG_FILE" << CONFIGEOF
{
  "title": "Your Presentation Title",
  "subtitle": "Interactive Learning Resource",
  "author": {
    "name": "Your Name",
    "institution": "Your Institution",
    "program": "Your Program"
  },
  "totalSlides": $SLIDE_COUNT,
  "storagePrefix": "companion",
  "downloadPrefix": "learning-prompts",
  "slideTitles": $SLIDE_TITLES,
  "sections": [],
  "intro": {
    "paragraphs": [
      "This site turns a lecture into something you can actually use afterward. You'll walk through the slides at your own pace, and on each one you'll see small numbered circles marking the ideas worth digging into. Hover over a circle to preview the prompt; click it to copy a question tailored to your background. The star in the top-right corner of each slide is a master prompt that covers the whole slide. Every prompt you click gets collected into a single <code>.md</code> file you can download at the end.",
      "That file is your conversation starter. Upload it along with the original <code>.pptx</code> presentation into any LLM &mdash; Claude, ChatGPT, Gemini, whichever you prefer &mdash; and it becomes a tutor that already knows who you are and what caught your attention."
    ]
  },
  "mdExport": {
    "header": "Personal Learning Prompts",
    "lectureDescription": "a presentation covering [describe your topics here]",
    "footer": [
      "Generated from the Your Title Interactive Learning Resource",
      "Presentation by Your Name — Your Institution"
    ]
  },
  "links": {
    "github": "",
    "readingList": ""
  }
}
CONFIGEOF

echo ""
echo "Done! Next steps:"
echo ""
echo "  1. Edit site/js/config.json"
echo "     - Set your presentation title, author info, and slide titles"
echo "     - Add section dividers if your presentation has logical sections"
echo "     - Optionally add contact info and FAQ"
echo ""
echo "  2. Generate prompts"
echo "     - Follow the instructions in PROMPT_GUIDE.md"
echo "     - Save the result as site/js/prompts.json"
echo ""
echo "  3. Test locally"
echo "     - npx serve site"
echo "     - Open http://localhost:3000"
echo ""
echo "  4. Deploy"
echo "     - Push to GitHub, deploy the site/ directory to Vercel, Netlify, or GitHub Pages"
echo ""
