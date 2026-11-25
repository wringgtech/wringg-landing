(() => {
  const network = document.querySelector('#network');
  const roleTabs = [...network.querySelectorAll('[role="tab"]')];
  const dial = network.querySelector('.role-dial');
  const indicator = dial.querySelector('.dial-pointer');
  const position = dial.querySelector('.dial-position');
  const names = ['Customers', 'Home partners', 'Delivery partners', 'Commercial laundries'];
  let index = 0;
  function syncDial() {
    index = roleTabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    indicator.style.transform = `rotate(${-45 + index * 90}deg)`;
    position.textContent = `${index + 1} / 4`;
    dial.setAttribute('aria-label', `Switch your spin: ${names[(index + 1) % 4]}`);
  }
  roleTabs.forEach(tab => {
    tab.addEventListener('click', syncDial);
    tab.addEventListener('keydown', syncDial);
  });
  dial.addEventListener('click', () => {
    roleTabs[(index + 1) % 4].click();
    network.querySelector('.role-switch-status').textContent = `${names[index]} selected.`;
  });
  syncDial();
})();
