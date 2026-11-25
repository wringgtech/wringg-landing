(() => {
  'use strict';
  const studio = document.querySelector('.match-studio');
  const matchButtons = [...document.querySelectorAll('[data-match]')];
  const matchCaption = document.querySelector('#match-caption');
  const matchCopy = ['Your clothes. We take it from here.', 'Separated for the care they need.', 'The right machine capacity. Chosen by WRINGG.'];
  const careButtons = [...document.querySelectorAll('[data-care]')];
  const careTitle = document.querySelector('#care-item-title');
  const careCaption = document.querySelector('#care-item-caption');
  const careBooking = document.querySelector('#care-booking-link');
  const careFrames = [...document.querySelectorAll('[data-care-visual]')];
  careFrames.forEach(frame => {
    const image = frame.querySelector('img');
    if (image && image.decode) image.decode().catch(() => {});
  });
  const careCopy = {
    shoes: ['Your favourite pair. Refreshed.', 'Shoe cleaning at ₹149. Check material suitability in the app.', 'Book shoe cleaning'],
    curtains: ['Let the room breathe.', 'Curtain cleaning at ₹219 per panel. Check fabric suitability in the app.', 'Book curtain cleaning'],
    bags: ['Ready for your next outing.', 'Bag cleaning at ₹209. Check material suitability in the app.', 'Book bag cleaning'],
    carpets: ['A fresh feeling underfoot.', 'Carpet cleaning at ₹148 per piece. Check size and material suitability in the app.', 'Book carpet cleaning']
  };
  function wireButtons(buttons, select) {
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        const next = {ArrowRight:(index+1)%buttons.length, ArrowLeft:(index+buttons.length-1)%buttons.length, Home:0, End:buttons.length-1}[event.key];
        if (next === undefined) return;
        event.preventDefault();select(next);buttons[next].focus();
      });
    });
  }
  if (studio && matchCaption) wireButtons(matchButtons, index => {
    studio.dataset.step = String(index);
    matchCaption.textContent = matchCopy[index];
    matchButtons.forEach((button,i) => button.setAttribute('aria-pressed',String(index===i)));
  });
  if (careTitle && careCaption) wireButtons(careButtons, index => {
    const key = careButtons[index].dataset.care;
    const selected = careCopy[key];
    careTitle.textContent = selected[0];careCaption.textContent = selected[1];
    if (careBooking) careBooking.textContent = selected[2];
    careFrames.forEach(frame => { frame.hidden = frame.dataset.careVisual !== key; });
    careButtons.forEach((button,i) => button.setAttribute('aria-pressed',String(index===i)));
  });
})();
