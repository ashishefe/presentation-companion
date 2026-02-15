# Prompt Generation Guide

This guide helps you use any LLM to generate the `prompts.json` file that powers your companion site's interactive hotspots.

---

## Overview

The companion site displays interactive circles ("hotspots") on each slide image. When a learner hovers over a hotspot, they see a prompt preview. When they click it, the prompt is copied to their clipboard and added to their collection for later download.

You generate these prompts by uploading your slide images to an LLM and asking it to create prompts following the schema below.

---

## prompts.json Schema

The file is a JSON array of prompt objects:

```json
[
  {
    "slide": 2,
    "type": "master",
    "label": "Explore this slide",
    "prompt": "I just learned that [key concept from slide]. As a {{profession}} who is curious about {{curiosity}}, help me understand: (1) [question 1] (2) [question 2] (3) [question 3]"
  },
  {
    "slide": 2,
    "type": "verify",
    "label": "Short claim description",
    "prompt": "The claim is that [specific claim]. As a {{profession}}, help me verify this: [verification questions]",
    "hotspot": { "x": 5, "y": 11, "w": 42, "h": 44 }
  }
]
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `slide` | Yes | Slide number (1-indexed) |
| `type` | Yes | One of: `master`, `verify`, `apply`, `steelman` |
| `label` | Yes | Short description shown in mobile list and collection (5-10 words) |
| `prompt` | Yes | Full prompt text with `{{placeholder}}` variables |
| `hotspot` | Only for non-master types | Position rectangle as percentages `{ x, y, w, h }` |

### Prompt Types

| Type | Purpose | Icon | Typical Count |
|------|---------|------|---------------|
| `master` | Covers the entire slide's theme | Star | 1 per slide (if slide has prompts) |
| `verify` | Fact-check a specific claim on the slide | Number | 0-2 per slide |
| `apply` | Connect the concept to the learner's profession | Number | 0-2 per slide |
| `steelman` | Argue for or against a position shown on the slide | Number | 0-1 per slide |

### Placeholder Variables

Use these in prompt text — they get replaced with the learner's actual information:

| Placeholder | Replaced With |
|------------|---------------|
| `{{profession}}` | Learner's role/profession |
| `{{curiosity}}` | What the learner is curious about |
| `{{name}}` | Learner's name (optional) |

**Pattern collapsing**: The site automatically replaces "As a {{profession}} who is curious about {{curiosity}}" with "Given what you know about me" in the slide viewer (since the .md file's preamble already contains the full learner context).

### Hotspot Coordinates

Hotspots are positioned as percentage-based rectangles relative to the slide image:

```json
{ "x": 5, "y": 11, "w": 42, "h": 44 }
```

- `x` — left edge, as % from left
- `y` — top edge, as % from top
- `w` — width as %
- `h` — height as %

The circle appears at the **top-right corner** of the rectangle: position `(x + w, y)`. This marks the relevant area without obscuring the center content.

**Master prompts don't need hotspot coordinates** — they're automatically placed at the top-right of the slide (93%, 8%).

---

## LLM Prompt Template

Copy and paste the following into your LLM along with your slide images:

---

> I'm building an interactive companion site for this presentation. I need you to generate a `prompts.json` file — a JSON array of prompt objects that will appear as interactive hotspots on the slide images.
>
> **For each slide that has meaningful content** (skip title slides, section dividers, or "thank you" slides unless they contain substantive content):
>
> 1. **Create one master prompt** (type: "master") that covers the slide's overall theme. This should be a rich, multi-part question that helps a learner deeply understand the slide's core concepts. Start with "I just learned that [key insight from this slide]..." and include 2-3 specific sub-questions.
>
> 2. **Create 1-3 specialized prompts** where the slide content supports it:
>    - **verify**: For specific claims, statistics, or assertions — ask the learner to fact-check them
>    - **apply**: For concepts that connect to the learner's work — ask how this affects their field
>    - **steelman**: For arguments or positions — ask the learner to argue for/against
>
> 3. **For each specialized prompt**, include a `hotspot` field with `{ x, y, w, h }` coordinates (as percentages) that identify the relevant region on the slide. Look at the slide image and estimate where the relevant text, chart, or diagram is positioned.
>
> **Use these placeholder variables** in all prompts:
> - `{{profession}}` — the learner's role
> - `{{curiosity}}` — what they're curious about
> - `{{name}}` — their name (use sparingly)
>
> **Start most prompts with a pattern like**: "As a {{profession}} who is curious about {{curiosity}}, ..."
>
> **Output format**: A valid JSON array. Each object has: `slide` (number), `type` (string), `label` (short string, 5-10 words), `prompt` (full text), and optionally `hotspot` (object with x, y, w, h as numbers).
>
> **Quality guidelines**:
> - Prompts should reference specific content visible on the slide (numbers, names, concepts)
> - Master prompts should be 3-5 sentences with clear sub-questions
> - Specialized prompts should be focused and actionable
> - Labels should be concise enough for a mobile list view
> - Aim for 2-4 total prompts per content slide
>
> Here are the slides:

---

## Chunking Advice

How you feed slides to the LLM depends on your presentation length:

| Slide Count | Approach |
|------------|----------|
| **≤40 slides** | Upload all slide images in a single session. Generate all prompts at once. |
| **40-100 slides** | Chunk into groups of ~20 slides. Generate prompts for each chunk separately, then merge the JSON arrays. |
| **100+ slides** | Consider splitting your presentation into separate modules, each with its own companion site. If you prefer one site, chunk by 20 and merge. |
| **200+ slides** | Strongly recommend splitting into modules. The companion site handles any number of slides, but prompt generation quality degrades with very long LLM sessions. |

### Merging Chunks

If you generate prompts in chunks, merge them by concatenating the JSON arrays:

```javascript
// chunk1.json: [{ slide: 1, ... }, { slide: 2, ... }]
// chunk2.json: [{ slide: 21, ... }, { slide: 22, ... }]
// → prompts.json: combine both arrays
```

Make sure slide numbers are correct across chunks (they should match the actual slide numbers in your presentation).

---

## Quality Checklist

Before saving your `prompts.json`:

- [ ] Every content slide has at least a master prompt
- [ ] Slide numbers match actual presentation slides
- [ ] All prompts use `{{profession}}` and/or `{{curiosity}}` placeholders
- [ ] Labels are concise (5-10 words)
- [ ] Hotspot coordinates roughly match visible content regions
- [ ] Specialized prompts reference specific claims, data, or arguments from the slides
- [ ] The JSON is valid (paste into a JSON validator if unsure)
- [ ] No prompts for empty/transition slides unless they have real content

---

## Example

Here's a minimal example showing one slide with a master and two specialized prompts:

```json
[
  {
    "slide": 3,
    "type": "master",
    "label": "Explore this slide",
    "prompt": "I just learned about the three main challenges facing renewable energy adoption: intermittency, storage costs, and grid infrastructure. As a {{profession}} who is curious about {{curiosity}}, help me understand: (1) Which of these challenges is most relevant to my field? (2) What progress has been made on each in the last 2 years? (3) How might solving these challenges change the economics of energy in my industry?"
  },
  {
    "slide": 3,
    "type": "verify",
    "label": "Battery costs dropped 90%",
    "prompt": "The claim is that lithium-ion battery costs have dropped 90% since 2010. As a {{profession}}, help me verify this: What are the original sources? Has this trend continued or plateaued? What does this mean for energy storage adoption in my sector?",
    "hotspot": { "x": 10, "y": 20, "w": 35, "h": 30 }
  },
  {
    "slide": 3,
    "type": "apply",
    "label": "Grid infrastructure challenges",
    "prompt": "The slide shows that existing grid infrastructure was designed for centralized power generation, not distributed renewables. As a {{profession}} curious about {{curiosity}}, how does this infrastructure mismatch affect my industry? What would a modernized grid mean for my work?",
    "hotspot": { "x": 55, "y": 20, "w": 35, "h": 30 }
  }
]
```
