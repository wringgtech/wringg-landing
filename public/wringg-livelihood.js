(() => {
  'use strict';
  const section = document.querySelector('#neighbour-story.wringg-livelihood');
  if (!section) return;
  const buttons = [...section.querySelectorAll('[data-lv]')];
  const panels = [...section.querySelectorAll('.livelihood-scene')];
  section.querySelectorAll('img').forEach(image => { if (image.decode) image.decode().catch(() => {}); });
  const select = index => {
    section.dataset.focus = buttons[index].dataset.lv;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
    panels.forEach((panel, i) => { panel.hidden = index !== i; });
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      const target = {ArrowRight:(index+1)%buttons.length, ArrowLeft:(index+buttons.length-1)%buttons.length, Home:0, End:buttons.length-1}[event.key];
      if (target !== undefined) { event.preventDefault(); select(target); buttons[target].focus(); }
    });
  });
})();
