const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const themeHint = document.querySelector('#theme-preference-hint');
const reducedMotion = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

// The platform preference is re-read on every load. A manual switch is honored
// for the current visit, while the dot continues to show the detected platform mode.
let userOverride = false;

const getSystemTheme = () => {
  if (typeof window.matchMedia !== 'function') return null;

  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  const light = window.matchMedia('(prefers-color-scheme: light)');

  if (dark.media !== '(prefers-color-scheme: dark)' ||
      light.media !== '(prefers-color-scheme: light)') return null;
  if (dark.matches) return 'dark';
  if (light.matches) return 'light';
  return null;
};

const updateSystemPreference = (theme) => {
  root.dataset.systemTheme = theme || '';
  root.dataset.themeSource = theme ? 'system' : 'default';

  if (themeToggle) {
    if (theme) {
      themeToggle.dataset.systemTheme = theme;
    } else {
      delete themeToggle.dataset.systemTheme;
    }
  }

  if (themeHint) {
    themeHint.textContent = theme
      ? `System preference: ${theme} mode.`
      : 'System display preference could not be detected.';
  }
};

const setTheme = (theme, { animate = true } = {}) => {
  const applyTheme = () => {
    root.dataset.theme = theme;

    const scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.content = theme === 'dark' ? 'dark light' : 'light dark';

    if (themeToggle) {
      themeToggle.setAttribute('aria-checked', String(theme === 'dark'));
      themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  const canAnimate =
    animate &&
    !reducedMotion.matches &&
    document.visibilityState === 'visible' &&
    window.self === window.top &&
    typeof document.startViewTransition === 'function';

  if (!canAnimate) {
    applyTheme();
    return;
  }

  let applied = false;
  const applyOnce = () => {
    if (applied) return;
    applied = true;
    applyTheme();
  };

  root.classList.add('is-theme-changing');
  const transition = document.startViewTransition(applyOnce);
  const cleanup = () => root.classList.remove('is-theme-changing');
  transition.ready.catch(() => {
    applyOnce();
    cleanup();
  });
  transition.finished.then(cleanup, cleanup);
};

const initialSystemTheme = getSystemTheme();
updateSystemPreference(initialSystemTheme);
setTheme(initialSystemTheme || root.dataset.theme || 'light', { animate: false });

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    userOverride = true;
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

const handleSystemChange = () => {
  const systemTheme = getSystemTheme();
  updateSystemPreference(systemTheme);

  if (systemTheme && !userOverride && root.dataset.theme !== systemTheme) {
    setTheme(systemTheme);
  }
};

if (typeof window.matchMedia === 'function') {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const lightQuery = window.matchMedia('(prefers-color-scheme: light)');

  [darkQuery, lightQuery].forEach((query) => {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handleSystemChange);
    } else if (typeof query.addListener === 'function') {
      query.addListener(handleSystemChange);
    }
  });
}

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
