const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); toggle.focus(); } });
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();


const vanScene = document.querySelector('.hero-art');
const vanReplay = document.querySelector('.van-replay');
const vanPause = document.querySelector('.van-pause');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function replayVan() {
  if (reducedMotion.matches) return;
  vanScene.classList.remove('is-driving', 'is-paused');
  void vanScene.offsetWidth;
  vanScene.classList.add('is-driving');
  vanPause.setAttribute('aria-pressed', 'false');
  vanPause.textContent = 'Pause motion';
}
vanReplay.addEventListener('click', replayVan);
document.querySelector('.van').addEventListener('click', replayVan);
vanPause.addEventListener('click', () => {
  const paused = vanScene.classList.toggle('is-paused');
  vanPause.setAttribute('aria-pressed', String(paused));
  vanPause.textContent = paused ? 'Resume motion' : 'Pause motion';
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) vanScene.classList.remove('is-driving', 'is-paused');
  else replayVan();
});
replayVan();
