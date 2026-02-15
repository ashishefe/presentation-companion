// Presentation Companion — Shared configuration and utilities
// Loaded before app.js on all pages; provides config, storage keys, and .md generation

var CompanionConfig = (function () {
  'use strict';

  var _config = null;

  // ── Config Loading ──

  function load() {
    if (_config) return Promise.resolve(_config);
    return fetch('js/config.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _config = data;
        return data;
      });
  }

  function get() {
    return _config;
  }

  // ── Storage Keys ──

  function storageKey(suffix) {
    var prefix = _config ? _config.storagePrefix : 'companion';
    return prefix + '-' + suffix;
  }

  // ── .md Generation ──

  function generateMd(config, intake, collectedPrompts, customNotes) {
    var hasNotes = customNotes && Object.keys(customNotes).length > 0;
    if ((!collectedPrompts || collectedPrompts.length === 0) && !hasNotes) return '';

    var date = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    var title = config.title || 'Presentation';
    var mdHeader = config.mdExport ? config.mdExport.header : 'Personal Learning Prompts';
    var lectureDesc = config.mdExport ? config.mdExport.lectureDescription : 'a presentation covering various topics';

    // Group collected prompts by slide
    var grouped = {};
    (collectedPrompts || []).forEach(function (p) {
      if (!grouped[p.slide]) {
        grouped[p.slide] = { title: p.title, prompts: [] };
      }
      grouped[p.slide].prompts.push(p);
    });

    // Merge slides that have notes but no collected prompts
    if (customNotes) {
      Object.keys(customNotes).forEach(function (slideNum) {
        var n = Number(slideNum);
        if (!grouped[n]) {
          grouped[n] = { title: config.slideTitles[n - 1], prompts: [] };
        }
      });
    }

    var slideNumbers = Object.keys(grouped).map(Number).sort(function (a, b) { return a - b; });
    var topicsExplored = slideNumbers.map(function (n) { return grouped[n].title; }).join(', ');

    // Build preamble
    var md = '# ' + title + ' \u2014 ' + mdHeader + '\n\n---\n\n';
    md += '## INSTRUCTIONS FOR THE AI TUTOR\n\n';
    md += '**Please read these instructions carefully before proceeding.**\n\n';
    md += 'You are acting as a **personalized tutor** for the learner described below. They attended a lecture on ' + title + ' and collected a set of prompts based on topics that caught their interest. Your role is to help them explore these topics deeply, at their own pace.\n\n';
    md += '**Before you begin**, check whether the learner has also uploaded the original .pptx presentation file alongside this document. If they have, use the slide content to provide richer, more specific responses \u2014 reference specific charts, diagrams, and data points when answering each prompt. If they have NOT uploaded the .pptx, gently let them know that uploading it will significantly improve the conversation, and ask if they\'d like to add it before you start.\n\n';
    md += '### How this conversation should work:\n\n';
    md += '1. **One question at a time.** Start with the first prompt below (under "Collected Prompts"). Address it thoroughly \u2014 explain concepts clearly, use examples relevant to the learner\'s profession, and invite follow-up questions.\n\n';
    md += '2. **Have a real conversation.** After your initial response to each prompt, wait for the learner to ask follow-ups, challenge your answer, or say they\'re satisfied. Do NOT move to the next prompt until the learner explicitly says something like "next question," "move on," or "let\'s continue."\n\n';
    md += '3. **Tailor everything** to the learner\'s profession and curiosity (described below). Use concrete examples from their field. Avoid generic explanations when you can be specific.\n\n';
    md += '4. **At the end of the conversation**, once all prompts have been discussed (or the learner says they\'re done), generate a **Learning Pack** \u2014 a nicely formatted document that includes:\n';
    md += '   - **Top Takeaways**: 5-7 key insights from the entire conversation\n';
    md += '   - **Things to Note**: Important nuances, caveats, or counterarguments that came up\n';
    md += '   - **Further Reading**: 5-10 specific books, papers, articles, or resources to explore next\n';
    md += '   - **Conversation Summary**: A concise narrative summary of everything discussed, organized by topic\n\n';
    md += 'Format the Learning Pack clearly with headers and bullet points so the learner can save it as a reference document.\n\n';
    md += '---\n\n';
    md += '## About the Learner\n';
    md += '- **Name**: ' + (intake.name || 'Not provided') + '\n';
    md += '- **Role/Profession**: ' + intake.profession + '\n';
    md += '- **Curiosity**: ' + intake.curiosity + '\n';
    md += '- **Date**: ' + date + '\n\n';
    md += '---\n\n';
    md += '## Collected Prompts\n\n';
    md += 'The learner clicked on these prompts during the presentation. Handle them **one at a time**, in order.\n\n';

    // Add each prompt grouped by slide, with custom notes
    slideNumbers.forEach(function (slideNum, idx) {
      var group = grouped[slideNum];
      md += '### ' + (idx + 1) + '. Slide ' + slideNum + ': ' + group.title + '\n\n';
      group.prompts.forEach(function (p) {
        md += '**' + p.label + '**\n\n';
        md += p.prompt + '\n\n';
      });
      if (customNotes && customNotes[slideNum]) {
        md += '**Your Notes**\n\n';
        md += customNotes[slideNum] + '\n\n';
      }
      md += '---\n\n';
    });

    // Meta-prompt
    md += '## Continue the Learning Journey\n\n';
    md += 'Once you\'ve worked through all the prompts above, use this meta-prompt to continue:\n\n';
    md += '> I\'m ' + (intake.name || 'a learner') + ', a ' + intake.profession + ' who is curious about ' + intake.curiosity + '. I just went through ' + lectureDesc + '. During the presentation, I explored these specific topics: ' + topicsExplored + '. Based on what I\'ve shown interest in, continue my learning journey. Go deeper on the areas I explored, connect them to each other, and suggest new angles I might not have considered. Frame everything in terms of my profession and my specific curiosity.\n\n';
    md += '---\n\n';

    // Footer
    if (config.mdExport && config.mdExport.footer) {
      config.mdExport.footer.forEach(function (line) {
        md += '*' + line + '*\n';
      });
    }

    return md;
  }

  // ── Download Trigger ──

  function triggerDownload(config, intake, collectedPrompts, customNotes, showToast) {
    var md = generateMd(config, intake, collectedPrompts, customNotes);
    if (!md) {
      if (showToast) showToast('Click some prompts or add notes first, then download!');
      return;
    }

    var prefix = config.downloadPrefix || 'prompts';
    var namePart = intake.name ? intake.name.toLowerCase().replace(/\s+/g, '-') : 'learner';
    var filename = prefix + '-' + namePart + '.md';

    var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (showToast) showToast('Downloaded! Open in any LLM to continue learning.');
  }

  // ── Public API ──
  return {
    load: load,
    get: get,
    storageKey: storageKey,
    generateMd: generateMd,
    triggerDownload: triggerDownload
  };
})();
