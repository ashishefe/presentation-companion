// Presentation Companion — Slide viewer logic
// Requires shared.js to be loaded first (provides CompanionConfig)

(function () {
  'use strict';

  // ── State ──
  var config = null;
  var currentSlide = 1;
  var totalSlides = 20;
  var prompts = [];
  var collectedPrompts = [];
  var intake = { name: '', profession: '', curiosity: '' };

  // ── DOM refs ──
  var slideImage = document.getElementById('slide-image');
  var slideWrapper = document.getElementById('slide-image-wrapper');
  var prevBtn = document.getElementById('prev-btn');
  var nextBtn = document.getElementById('next-btn');
  var headerProgress = document.getElementById('header-progress');
  var promptCountEl = document.getElementById('prompt-count');
  var downloadBtn = document.getElementById('download-btn');
  var toastEl = document.getElementById('toast');
  var navOverlay = document.getElementById('nav-overlay');
  var navDrawer = document.getElementById('nav-drawer');
  var navList = document.getElementById('nav-list');
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var mobilePrompts = document.getElementById('mobile-prompts');
  var customNotesTextarea = document.getElementById('custom-notes-textarea');

  // ── Init ──
  CompanionConfig.load().then(function (cfg) {
    config = cfg;
    totalSlides = config.totalSlides || 20;

    // Populate config-driven header elements
    var headerTitleEl = document.querySelector('.header-title');
    if (headerTitleEl) headerTitleEl.textContent = config.title;
    var navHeaderEl = document.querySelector('.nav-header a') || document.querySelector('.nav-header');
    if (navHeaderEl) navHeaderEl.textContent = config.title;

    init();
  });

  function init() {
    // Load intake data
    var saved = localStorage.getItem(CompanionConfig.storageKey('intake'));
    if (saved) {
      intake = JSON.parse(saved);
    } else {
      window.location.href = 'index.html';
      return;
    }

    // Load collected prompts from session
    var savedPrompts = sessionStorage.getItem(CompanionConfig.storageKey('collected'));
    if (savedPrompts) {
      collectedPrompts = JSON.parse(savedPrompts);
    }

    // Load saved slide position
    var savedSlide = sessionStorage.getItem(CompanionConfig.storageKey('current-slide'));
    if (savedSlide) {
      currentSlide = parseInt(savedSlide, 10);
    }

    // Load prompts.json
    fetch('js/prompts.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        prompts = data;
        buildNavMenu();
        renderSlide();
        updatePromptCount();
      })
      .catch(function (err) {
        console.error('Failed to load prompts:', err);
        buildNavMenu();
        renderSlide();
      });

    // Event listeners
    prevBtn.addEventListener('click', function () {
      if (currentSlide <= 1) window.location.href = 'index.html';
      else goToSlide(currentSlide - 1);
    });
    nextBtn.addEventListener('click', function () {
      if (currentSlide >= totalSlides) window.location.href = 'help.html';
      else goToSlide(currentSlide + 1);
    });
    downloadBtn.addEventListener('click', function () {
      var customNotes = getCustomNotes();
      CompanionConfig.triggerDownload(config, intake, collectedPrompts, customNotes, showToast);
    });
    hamburgerBtn.addEventListener('click', toggleNav);
    navOverlay.addEventListener('click', toggleNav);

    // Custom notes textarea — auto-save on input
    customNotesTextarea.addEventListener('input', function () {
      saveCustomNote(currentSlide, customNotesTextarea.value);
    });

    // Keyboard navigation (disabled when typing in textarea)
    document.addEventListener('keydown', function (e) {
      if (e.target === customNotesTextarea) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentSlide <= 1) window.location.href = 'index.html';
        else goToSlide(currentSlide - 1);
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentSlide >= totalSlides) window.location.href = 'help.html';
        else goToSlide(currentSlide + 1);
      }
      if (e.key === 'Escape') closeNav();
    });
  }

  // ── Navigation ──
  function goToSlide(n) {
    if (n < 1 || n > totalSlides) return;
    currentSlide = n;
    sessionStorage.setItem(CompanionConfig.storageKey('current-slide'), currentSlide);
    renderSlide();
    closeNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderSlide() {
    var slideTitles = config.slideTitles;

    // Update image
    var padded = String(currentSlide).padStart(2, '0');
    slideImage.src = 'images/slide-' + padded + '.png';
    slideImage.alt = 'Slide ' + currentSlide + ': ' + slideTitles[currentSlide - 1];

    // Update header
    headerProgress.textContent = 'Slide ' + currentSlide + '/' + totalSlides;

    // Update nav button labels for boundary slides
    prevBtn.textContent = currentSlide <= 1 ? '\u2190 Intro' : '\u2190 Prev';
    nextBtn.textContent = currentSlide >= totalSlides ? 'Help \u2192' : 'Next \u2192';

    // Update nav menu active state
    document.querySelectorAll('.nav-list a').forEach(function (a) { a.classList.remove('active'); });
    var activeLink = document.querySelector('.nav-list a[data-slide="' + currentSlide + '"]');
    if (activeLink) activeLink.classList.add('active');

    // Render hotspots and master prompt
    renderHotspots();
    renderMobilePrompts();

    // Load custom note for this slide
    loadCustomNoteForSlide();
  }

  function renderHotspots() {
    var slideTitles = config.slideTitles;

    // Remove existing hotspot circles
    slideWrapper.querySelectorAll('.hotspot-circle').forEach(function (el) { el.remove(); });

    var slidePrompts = prompts.filter(function (p) { return p.slide === currentSlide; });
    var master = slidePrompts.find(function (p) { return p.type === 'master'; });
    var specialized = slidePrompts.filter(function (p) { return p.type !== 'master'; });

    // Master prompt — star circle on the slide (top-right area)
    if (master) {
      var masterFilledPrompt = fillTemplate(master.prompt);
      var masterCircle = document.createElement('div');
      masterCircle.className = 'hotspot-circle hotspot-master';
      masterCircle.style.left = '93%';
      masterCircle.style.top = '8%';
      masterCircle.innerHTML = '&#9733;'; // star

      var masterTooltip = createTooltip(masterFilledPrompt, 93, 8);
      masterCircle.appendChild(masterTooltip);

      masterCircle.addEventListener('click', function () {
        copyPrompt(masterFilledPrompt, slideTitles[currentSlide - 1], master.label);
      });

      slideWrapper.appendChild(masterCircle);
    }

    // Specialized hotspot circles (numbered)
    specialized.forEach(function (p, idx) {
      if (!p.hotspot) return;

      var cx = p.hotspot.x + p.hotspot.w;
      var cy = p.hotspot.y;

      var circle = document.createElement('div');
      circle.className = 'hotspot-circle';
      circle.style.left = cx + '%';
      circle.style.top = cy + '%';
      circle.textContent = idx + 1;

      var filledPrompt = fillTemplate(p.prompt);
      var tooltip = createTooltip(filledPrompt, cx, cy);
      circle.appendChild(tooltip);

      circle.addEventListener('click', function () {
        copyPrompt(filledPrompt, slideTitles[currentSlide - 1], p.label);
      });

      slideWrapper.appendChild(circle);
    });
  }

  function createTooltip(text, xPercent, yPercent) {
    var tooltip = document.createElement('div');
    tooltip.className = 'hotspot-tooltip';
    tooltip.textContent = text;

    if (yPercent > 55) {
      tooltip.classList.add('tooltip-above');
    } else {
      tooltip.classList.add('tooltip-below');
    }

    if (xPercent > 70) {
      tooltip.classList.add('tooltip-shift-left');
    } else if (xPercent < 30) {
      tooltip.classList.add('tooltip-shift-right');
    }

    return tooltip;
  }

  function renderMobilePrompts() {
    var slideTitles = config.slideTitles;

    var existing = mobilePrompts.querySelectorAll('.mobile-prompt-item');
    existing.forEach(function (el) { el.remove(); });

    var slidePrompts = prompts.filter(function (p) { return p.slide === currentSlide; });
    if (slidePrompts.length === 0) {
      mobilePrompts.style.display = 'none';
      return;
    }

    var master = slidePrompts.find(function (p) { return p.type === 'master'; });
    var specialized = slidePrompts.filter(function (p) { return p.type !== 'master'; });

    if (master) {
      var item = document.createElement('div');
      item.className = 'mobile-prompt-item';

      var pill = document.createElement('span');
      pill.className = 'mobile-prompt-number';
      pill.textContent = '\u2605';
      item.appendChild(pill);

      var text = document.createElement('span');
      text.textContent = master.label;
      item.appendChild(text);

      item.addEventListener('click', function () {
        copyPrompt(fillTemplate(master.prompt), slideTitles[currentSlide - 1], master.label);
      });
      mobilePrompts.appendChild(item);
    }

    specialized.forEach(function (p, idx) {
      var item = document.createElement('div');
      item.className = 'mobile-prompt-item';

      var pill = document.createElement('span');
      pill.className = 'mobile-prompt-number';
      pill.textContent = idx + 1;
      item.appendChild(pill);

      var text = document.createElement('span');
      text.textContent = p.label;
      item.appendChild(text);

      item.addEventListener('click', function () {
        copyPrompt(fillTemplate(p.prompt), slideTitles[currentSlide - 1], p.label);
      });
      mobilePrompts.appendChild(item);
    });
  }

  // ── Template filling ──
  function fillTemplate(template) {
    var text = template;
    text = text.replace(/As a \{\{profession\}\}\s+who is curious about \{\{curiosity\}\}/gi,
      'Given what you know about me');
    text = text.replace(/As a \{\{profession\}\}\s+curious about \{\{curiosity\}\}/gi,
      'Given what you know about me');
    text = text.replace(/As a \{\{profession\}\}/gi, 'Given what you know about me');
    text = text.replace(/\{\{name\}\}/g, intake.name || 'the learner');
    text = text.replace(/\{\{profession\}\}/g, 'someone in my position');
    text = text.replace(/\{\{curiosity\}\}/g, 'the topics I care about');
    return text;
  }

  // ── Clipboard & Collection ──
  function copyPrompt(promptText, slideTitle, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promptText).then(function () {
        showToast('Copied! Paste into your favorite LLM.');
      }).catch(function () {
        showToast('Copied! Paste into your favorite LLM.');
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = promptText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied! Paste into your favorite LLM.');
    }

    var alreadyCollected = collectedPrompts.some(function (p) {
      return p.slide === currentSlide && p.label === label;
    });
    if (!alreadyCollected) {
      collectedPrompts.push({
        slide: currentSlide,
        title: slideTitle,
        label: label,
        prompt: promptText
      });
      sessionStorage.setItem(CompanionConfig.storageKey('collected'), JSON.stringify(collectedPrompts));
      updatePromptCount();
    }
  }

  function updatePromptCount() {
    promptCountEl.textContent = collectedPrompts.length;
  }

  // ── Toast ──
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('visible');
    setTimeout(function () { toastEl.classList.remove('visible'); }, 2500);
  }

  // ── Nav Menu ──
  function buildNavMenu() {
    var slideTitles = config.slideTitles;
    navList.innerHTML = '';

    // Build sections lookup from config
    var sectionMap = {};
    if (config.sections) {
      config.sections.forEach(function (s) {
        sectionMap[s.beforeSlide] = s.label;
      });
    }

    for (var i = 1; i <= totalSlides; i++) {
      if (sectionMap[i]) {
        var divLi = document.createElement('li');
        var divA = document.createElement('a');
        divA.className = 'section-divider';
        divA.textContent = sectionMap[i];
        divA.href = '#';
        divLi.appendChild(divA);
        navList.appendChild(divLi);
      }

      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#';
      a.textContent = i + '. ' + slideTitles[i - 1];
      a.dataset.slide = i;
      if (i === currentSlide) a.classList.add('active');
      (function (slideNum) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          goToSlide(slideNum);
        });
      })(i);
      li.appendChild(a);
      navList.appendChild(li);
    }

    // Help link
    var helpLi = document.createElement('li');
    var helpA = document.createElement('a');
    helpA.href = 'help.html';
    helpA.textContent = '? How to Use Your Prompts';
    helpA.style.marginTop = '0.5rem';
    helpA.style.fontWeight = '600';
    helpLi.appendChild(helpA);
    navList.appendChild(helpLi);
  }

  function toggleNav() {
    navOverlay.classList.toggle('open');
    navDrawer.classList.toggle('open');
  }

  function closeNav() {
    navOverlay.classList.remove('open');
    navDrawer.classList.remove('open');
  }

  // ── Custom Notes ──
  function getCustomNotes() {
    var raw = sessionStorage.getItem(CompanionConfig.storageKey('custom-notes'));
    return raw ? JSON.parse(raw) : {};
  }

  function saveCustomNote(slideNum, text) {
    var notes = getCustomNotes();
    if (text.trim()) {
      notes[slideNum] = text;
    } else {
      delete notes[slideNum];
    }
    sessionStorage.setItem(CompanionConfig.storageKey('custom-notes'), JSON.stringify(notes));
  }

  function loadCustomNoteForSlide() {
    var notes = getCustomNotes();
    customNotesTextarea.value = notes[currentSlide] || '';
  }
})();
