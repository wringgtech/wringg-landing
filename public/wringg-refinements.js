(() => {
  const booking = document.querySelector('#booking-dialog');
  const bookingToggle = document.querySelector('.booking-toggle');
  const openers = new Map([[booking, bookingToggle]]);
  for (const [dialog, opener] of openers) {
    if (!dialog || !opener) continue;
    opener.addEventListener('click', () => {
      dialog.showModal();
      document.body.classList.add('dialog-open');
      opener.setAttribute('aria-expanded', 'true');
    });
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      opener.setAttribute('aria-expanded', 'false');
      opener.focus({preventScroll:true});
    });
  }
})();
