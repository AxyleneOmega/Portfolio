const toggle = document.querySelector('.nav__toggle');
const menu = document.querySelector('.nav__menu');

if (toggle && menu) {
  const setMenu = (open) => {
    toggle.classList.toggle('is-active', open);
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
}

const navLinks = [...document.querySelectorAll('.nav__menu a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id], footer[id]')];
let scrollPending = false;

const updateActiveSection = () => {
  if (!sections.length) return;

  const marker = window.scrollY + 140;
  let activeId = sections[0].id;

  sections.forEach((section) => {
    const top = section.getBoundingClientRect().top + window.scrollY;
    if (top <= marker) activeId = section.id;
  });

  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    activeId = sections[sections.length - 1].id;
  }

  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${activeId}`;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const queueActiveUpdate = () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    updateActiveSection();
    scrollPending = false;
  });
};

window.addEventListener('scroll', queueActiveUpdate, { passive: true });
window.addEventListener('resize', queueActiveUpdate);
window.addEventListener('hashchange', updateActiveSection);
updateActiveSection();
