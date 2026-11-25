(() => {
  const section = document.querySelector('#how-it-works.wringg-care');
  if (!section) return;
  const questions = [...section.querySelectorAll('.care-question')];
  const panels = [...section.querySelectorAll('.care-panel')];
  const stageLabel = section.querySelector('.care-live-label');
  const announcement = section.querySelector('.care-announcement');
  const labels = ['PEOPLE', 'STANDARDS', 'HANDOFFS'];
  function selectQuestion(index, focus = false) {
    questions.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    panels.forEach((panel, i) => panel.hidden = i !== index);
    stageLabel.textContent = labels[index];
    const copy = panels[index].querySelector('.care-panel-copy');
    announcement.textContent = copy.innerText;
    if (focus) questions[index].focus({preventScroll:true});
  }
  questions.forEach((button, index) => {
    button.addEventListener('click', () => selectQuestion(index));
    button.addEventListener('keydown', event => {
      const next = {ArrowDown:(index+1)%3,ArrowRight:(index+1)%3,ArrowUp:(index+2)%3,ArrowLeft:(index+2)%3,Home:0,End:2}[event.key];
      if (next !== undefined) {event.preventDefault();selectQuestion(next,true);}
    });
  });
  const tripButtons = [...section.querySelectorAll('.care-trip')];
  const track = section.querySelector('.care-trip-track');
  const caption = section.querySelector('.care-trip-caption');
  tripButtons.forEach(button => button.addEventListener('click', () => {
    const direction = button.dataset.trip;
    tripButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    track.dataset.direction = direction;
    caption.textContent = direction === 'return'
      ? 'Fresh laundry leaves the home partner. A WRINGG rider brings your bag back to your door.'
      : 'You book in the app. A WRINGG rider picks up and takes your bag to the home partner.';
    announcement.textContent = caption.textContent;
  }));
})();
