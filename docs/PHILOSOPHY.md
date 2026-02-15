# Why Presentation Companion Exists

## The Problem

Lectures are one-directional. A speaker presents, an audience listens, and everyone goes home with roughly the same experience — regardless of their background, interests, or expertise. The best a curious attendee can do is take notes and hope to remember what caught their attention.

AI tutors try to fix this by embedding intelligence into the learning experience itself. But most approaches put the AI in the driver's seat: the system decides what to teach, how to assess understanding, and when to move on. The learner becomes a passenger.

## A Different Approach

Presentation Companion flips this. Instead of building an AI tutor, it builds a **bridge** between a human presentation and the learner's own AI conversation.

The workflow:

1. **A human creates the presentation.** The content, arguments, and structure reflect a human perspective — not a generated curriculum.
2. **Prompts are curated, not generated on-the-fly.** Each prompt is crafted (with LLM assistance) to connect a specific slide concept to the learner's background. They're reviewed and edited before deployment.
3. **The learner chooses what matters.** By clicking on hotspots, the learner self-selects the concepts worth exploring. No algorithm decides for them.
4. **The .md file is theirs to own.** They can edit it, add their own questions, remove what doesn't interest them, and upload it to whichever LLM they prefer.
5. **The conversation happens elsewhere.** The companion site doesn't try to be the tutor — it produces the starting point for a tutoring conversation in any LLM.

## Why Privacy-First

No data leaves the browser. No analytics, no tracking, no server calls. This isn't just a nice-to-have — it's fundamental to the design:

- **Trust**: Learners share their profession, curiosity, and notes. That's personal information about their knowledge gaps and interests. It stays on their device.
- **Simplicity**: No backend means no accounts, no authentication, no GDPR compliance headaches, no server costs. The site is a set of static files.
- **Resilience**: No server to go down, no API keys to expire, no rate limits. The site works forever as long as a browser can open HTML files.

## Why LLM-Agnostic

The .md file works with Claude, ChatGPT, Gemini, or any other LLM. This matters because:

- **No vendor lock-in**: Educators don't bet on one company's future.
- **Learner choice**: Different LLMs have different strengths. A learner might prefer one for technical depth and another for accessibility.
- **Future-proof**: When better models arrive, the .md file still works.

## Why Static and Zero-Dependency

No build tools, no Node.js, no React, no dependencies:

- **Any educator can use it**: You don't need to be a developer. You need a text editor and a static file host.
- **Nothing breaks over time**: No dependencies means no security vulnerabilities to patch, no breaking changes to accommodate, no `npm audit` warnings.
- **Instant deployment**: Drop the `site/` folder on Vercel, Netlify, GitHub Pages, or any web host. Done.

## The Pedagogy

The companion site implements a specific learning theory: **personalized retrieval practice with metacognitive scaffolding**.

- **Personalized**: Prompts are tailored to the learner's profession and curiosity using template variables.
- **Retrieval practice**: Instead of re-reading slides, learners actively engage with concepts by formulating questions and discussing them with an AI tutor.
- **Metacognitive scaffolding**: The prompt types (master, verify, apply, steelman) model different ways of thinking about content — not just "what is this?" but "is this true?", "how does this affect my work?", and "what's the strongest counterargument?"

The .md file's structure reinforces this: it starts with learner context, presents prompts one at a time, includes custom notes, and ends with a meta-prompt that synthesizes the entire learning journey.

## Why This Is Better Than Embedded AI Tutors

Embedded AI tutors (chatbots on educational sites) have a fundamental problem: they need to be everything to everyone, in real-time, with no curation. This leads to:

- **Generic responses**: Without context about the specific presentation, the tutor gives textbook answers.
- **No human curation**: Every response is generated on the fly. There's no opportunity for an educator to shape the learning path.
- **Platform dependency**: The tutor only works on that specific site, with that specific model, while the API key is active.
- **Cost**: Running an AI API for every learner interaction adds up fast, especially for free educational resources.

Presentation Companion avoids all of these by moving the AI conversation to the learner's own LLM session, armed with a curated, personalized prompt file that an educator has shaped.
