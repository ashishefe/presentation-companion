#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# Presentation Companion — Setup Script
# Converts a .pptx to slide PNGs and generates a starter config
#
# Prerequisites:
#   1. LibreOffice  — converts .pptx → PDF
#   2. poppler OR ImageMagick — splits PDF → individual PNGs
#
# Install (macOS):
#   brew install --cask libreoffice
#   brew install poppler
#
# Install (Ubuntu/Debian):
#   sudo apt install libreoffice poppler-utils
#
# Install (Fedora):
#   sudo dnf install libreoffice poppler-utils
# ──────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/site/images"
CONFIG_FILE="$SCRIPT_DIR/site/js/config.json"

# ── Usage ──
if [ $# -lt 1 ]; then
  echo "Usage: ./setup.sh <path-to-presentation.pptx>"
  echo ""
  echo "Converts your .pptx to slide images and generates a starter config.json."
  echo ""
  echo "Prerequisites:"
  echo "  1. LibreOffice  — converts .pptx to PDF"
  echo "  2. poppler      — splits PDF into per-slide PNGs (recommended)"
  echo "     OR ImageMagick (alternative)"
  echo ""
  echo "Quick install (macOS):"
  echo "  brew install --cask libreoffice && brew install poppler"
  echo ""
  echo "Quick install (Ubuntu):"
  echo "  sudo apt install libreoffice poppler-utils"
  exit 1
fi

PPTX_FILE="$1"

if [ ! -f "$PPTX_FILE" ]; then
  echo "Error: File not found: $PPTX_FILE"
  exit 1
fi

# ── Check ALL prerequisites before doing any work ──
echo "Checking prerequisites..."
MISSING=""

# Find LibreOffice
LIBREOFFICE=""
if command -v libreoffice &> /dev/null; then
  LIBREOFFICE="libreoffice"
elif [ -x "/Applications/LibreOffice.app/Contents/MacOS/soffice" ]; then
  LIBREOFFICE="/Applications/LibreOffice.app/Contents/MacOS/soffice"
elif command -v soffice &> /dev/null; then
  LIBREOFFICE="soffice"
fi

if [ -z "$LIBREOFFICE" ]; then
  MISSING="$MISSING  - LibreOffice (converts .pptx to PDF)\n"
  MISSING="$MISSING      macOS:  brew install --cask libreoffice\n"
  MISSING="$MISSING      Linux:  sudo apt install libreoffice\n\n"
else
  echo "  ✓ LibreOffice found: $LIBREOFFICE"
fi

# Find PDF-to-PNG converter (poppler preferred, ImageMagick as fallback)
PDF_CONVERTER=""
if command -v pdftoppm &> /dev/null; then
  PDF_CONVERTER="pdftoppm"
elif command -v magick &> /dev/null; then
  PDF_CONVERTER="magick"
elif command -v convert &> /dev/null; then
  PDF_CONVERTER="convert"
fi

if [ -z "$PDF_CONVERTER" ]; then
  MISSING="$MISSING  - poppler or ImageMagick (splits PDF into per-slide images)\n"
  MISSING="$MISSING      macOS:  brew install poppler        (recommended)\n"
  MISSING="$MISSING      Linux:  sudo apt install poppler-utils\n"
  MISSING="$MISSING      Alt:    brew install imagemagick\n\n"
else
  echo "  ✓ PDF converter found: $PDF_CONVERTER"
fi

# Bail if anything is missing
if [ -n "$MISSING" ]; then
  echo ""
  echo "Error: Missing required tools:"
  echo ""
  echo -e "$MISSING"
  echo "Install the missing tools and run this script again."
  exit 1
fi

echo ""

# ── Step 1: PPTX → PDF ──
echo "Step 1/3: Converting .pptx to PDF..."

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

"$LIBREOFFICE" --headless --convert-to pdf --outdir "$TEMP_DIR" "$PPTX_FILE" > /dev/null 2>&1

PDF_FILE=$(ls "$TEMP_DIR"/*.pdf 2>/dev/null | head -1)
if [ -z "$PDF_FILE" ]; then
  echo ""
  echo "Error: LibreOffice failed to convert the presentation to PDF."
  echo ""
  echo "Troubleshooting:"
  echo "  - Make sure the file is a valid .pptx (not .ppt or .key)"
  echo "  - Close LibreOffice if it's running (headless mode conflicts with open instances)"
  echo "  - Try opening the file in LibreOffice manually to check for issues"
  exit 1
fi

echo "  ✓ PDF created"

# ── Step 2: PDF → individual PNGs ──
echo "Step 2/3: Splitting PDF into slide images..."

mkdir -p "$IMAGES_DIR"
rm -f "$IMAGES_DIR"/slide-*.png

if [ "$PDF_CONVERTER" = "pdftoppm" ]; then
  pdftoppm -png -r 200 "$PDF_FILE" "$TEMP_DIR/page"
else
  # ImageMagick
  "$PDF_CONVERTER" -density 200 "$PDF_FILE" "$TEMP_DIR/page-%02d.png" 2>/dev/null
fi

# Rename to slide-01.png, slide-02.png, etc.
SLIDE_COUNT=0
for png in $(ls "$TEMP_DIR"/page-*.png 2>/dev/null | sort); do
  SLIDE_COUNT=$((SLIDE_COUNT + 1))
  PADDED=$(printf "%02d" $SLIDE_COUNT)
  cp "$png" "$IMAGES_DIR/slide-${PADDED}.png"
done

if [ "$SLIDE_COUNT" -eq 0 ]; then
  echo ""
  echo "Error: No slide images were generated from the PDF."
  echo ""
  echo "Troubleshooting:"
  echo "  - The PDF was created but may be empty or corrupted"
  echo "  - Try: pdftoppm -png -r 200 '$PDF_FILE' /tmp/test-page"
  echo "    to debug the PDF-to-image conversion directly"
  exit 1
fi

echo "  ✓ $SLIDE_COUNT slides exported to site/images/"

# ── Step 3: Generate starter config.json ──
echo "Step 3/3: Generating config.json..."

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

echo "  ✓ config.json created with $SLIDE_COUNT slide placeholders"

# ── Summary ──
echo ""
echo "════════════════════════════════════════════"
echo "  Setup complete! $SLIDE_COUNT slides processed."
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit site/js/config.json"
echo "     - Set your presentation title, author info, and slide titles"
echo "     - Add section dividers if your presentation has logical sections"
echo "     - Optionally add contact info and FAQ"
echo ""
echo "  2. Generate prompts using any LLM"
echo "     - Follow the instructions in PROMPT_GUIDE.md"
echo "     - Save the result as site/js/prompts.json"
echo ""
echo "  3. Test locally"
echo "     - npx serve site"
echo "     - Open http://localhost:3000"
echo ""
echo "  4. Deploy"
echo "     - Push to GitHub and deploy the site/ directory"
echo "     - Works with Vercel, Netlify, GitHub Pages, or any static host"
echo ""
