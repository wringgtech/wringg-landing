(() => {
  'use strict';
  const body = document.body;
  const layout = document.querySelector('.story-layout');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const sheets = [...document.querySelectorAll('[data-art]')];
  const chapterLinks = [...document.querySelectorAll('.chapter-links a')];
  const toggle = document.querySelector('.motion-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileStory = window.matchMedia('(max-width: 800px)');
  const stage = document.querySelector('.story-stage');
  if (!layout || !chapters.length || !toggle) return;
  let paused = reducedMotion.matches;
  let active = -1;
  let frame = 0;
  const clamp = value => Math.min(1, Math.max(0, value));
  const applyMotion = () => {
    body.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
  };
  const update = () => {
    frame = 0;
    // On phones, the illustration stays above a separate reading area.
    // Follow the text visible below it instead of the hidden screen midpoint.
    const stageBottom = mobileStory.matches && stage
      ? Math.min(window.innerHeight - 100, stage.getBoundingClientRect().bottom)
      : 0;
    const center = mobileStory.matches
      ? stageBottom + (window.innerHeight - stageBottom) * .46
      : window.innerHeight * .5;
    let current = 0;
    let closest = Infinity;
    let currentRect;
    chapters.forEach((chapter, index) => {
      const rect = chapter.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - center);
      if (distance < closest) { closest = distance; current = index; currentRect = rect; }
    });
    if (current !== active) {
      active = current;
      layout.dataset.scene = String(active);
      sheets.forEach((sheet, index) => sheet.classList.toggle('is-active', index === active));
      chapterLinks.forEach((link, index) => {
        if (index === active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    const progress = clamp((center - currentRect.top) / currentRect.height);
    const total = clamp((active + progress) / chapters.length);
    document.documentElement.style.setProperty('--story-progress', total.toFixed(4));
    document.documentElement.style.setProperty('--scene-progress', paused ? '.5' : progress.toFixed(4));
  };
  const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', requestUpdate, {passive:true});
  window.addEventListener('resize', requestUpdate, {passive:true});
  mobileStory.addEventListener('change', requestUpdate);
  toggle.addEventListener('click', () => { paused = !paused; applyMotion(); requestUpdate(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; applyMotion(); requestUpdate(); });
  document.querySelectorAll('[data-reveal]').forEach(button => {
    const panel = document.getElementById(button.dataset.reveal);
    if (!panel) return;
    const closedLabel = button.textContent;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? (button.dataset.reveal === 'gift-note' ? 'Close the little note' : 'Close his reply') : closedLabel;
      if (button.dataset.reveal === 'gift-note') body.classList.toggle('gift-open', open);
      requestUpdate();
    });
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const index = Number(entry.target.dataset.chapter);
      const image = sheets[index]?.querySelector('img');
      if (image?.decode) image.decode().catch(() => {});
    });
  }, {rootMargin:'300px 0px',threshold:0});
  chapters.forEach(chapter => observer.observe(chapter));
  // Static mobile chapter imagery remains the no-JavaScript fallback.
  body.classList.add('story-enhanced');
  applyMotion();
  requestUpdate();
})();
