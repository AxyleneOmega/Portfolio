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

let themeTransitionTimer;

const setTheme = (theme, { animate = true } = {}) => {
  const applyTheme = () => {
    root.dataset.theme = theme;

    const scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.content = theme === 'dark' ? 'dark light' : 'light dark';

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'dark' ? '#12152f' : '#f3f6f2';

    if (themeToggle) {
      themeToggle.setAttribute('aria-checked', String(theme === 'dark'));
      themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  if (!animate || reducedMotion.matches) {
    applyTheme();
    return;
  }

  root.classList.add('is-theme-changing');
  applyTheme();
  window.clearTimeout(themeTransitionTimer);
  themeTransitionTimer = window.setTimeout(() => {
    root.classList.remove('is-theme-changing');
    document.getAnimations().forEach((animation) => {
      if ('transitionProperty' in animation) animation.finish();
    });
  }, 460);
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

const prefersNoMotion = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  : false;

const revealItems = [...document.querySelectorAll('.reveal')];

if (prefersNoMotion && 'IntersectionObserver' in window) {
  revealItems.forEach((item) => {
    const siblings = [...(item.parentElement?.children || [])]
      .filter((sibling) => sibling.classList.contains('reveal'));
    const index = siblings.indexOf(item);
    item.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 45}ms`);
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  root.classList.remove('js-motion');
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Media viewer: one dialog, with a real playlist for Stormy Seas and an enlarged
// still for every other project. Video iframes are removed on close so audio stops.
const mediaDialog = document.querySelector('#media-dialog');
const mediaDialogTitle = document.querySelector('#media-dialog-title');
const mediaDialogBody = document.querySelector('#media-dialog-body');
const mediaClose = mediaDialog?.querySelector('.media-dialog__close');
const mediaButtons = [...document.querySelectorAll('[data-media-button]')];

const playlistId = 'PLvy4ATPi7f8wkWU_RB-bnbOqoYmz1EzpQ';
const stormyVideos = [
  { id: 'S_3k7gmKHK0', title: 'GP Basics - Ocean Simulation & Buoyancy Interactions', duration: '11:39' },
  { id: 'Fc7W6fVK0JM', title: 'GP Advt - Game Physics in Advertisement Explainer Video', duration: '4:40' },
  { id: '2aBFpR4XE4k', title: 'GP Game - Physics in Video Games', duration: '4:33' },
  { id: 'r2S1TtE28l0', title: 'GP Implementation - Stormy Seas', duration: '21:17' }
];

let activeMediaTrigger = null;

const videoSrc = (index) => {
  const video = stormyVideos[index];
  const params = new URLSearchParams({
    list: playlistId,
    listType: 'playlist',
    index: String(index + 1),
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    autoplay: '1'
  });
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`;
};

const clearMedia = () => {
  if (mediaDialogBody) mediaDialogBody.replaceChildren();
};

const closeMedia = () => {
  if (!mediaDialog) return;
  clearMedia();
  if (typeof mediaDialog.close === 'function' && mediaDialog.open) {
    mediaDialog.close();
    return;
  }
  mediaDialog.removeAttribute('open');
  activeMediaTrigger?.focus();
  activeMediaTrigger = null;
};

const buildVideoStage = () => {
  const stage = document.createElement('div');
  stage.className = 'video-stage';

  const frame = document.createElement('div');
  frame.className = 'video-frame';

  const iframe = document.createElement('iframe');
  iframe.title = `YouTube playlist: ${stormyVideos[0].title}`;
  iframe.src = videoSrc(0);
  iframe.loading = 'eager';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  frame.append(iframe);

  const list = document.createElement('ol');
  list.className = 'playlist';
  list.setAttribute('aria-label', 'Stormy Seas playlist');

  const buttons = stormyVideos.map((video, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.className = `playlist__item${index === 0 ? ' is-active' : ''}`;
    button.type = 'button';
    button.setAttribute('aria-label', `Play video ${index + 1}: ${video.title}`);
    if (index === 0) button.setAttribute('aria-current', 'true');

    const thumb = document.createElement('span');
    thumb.className = 'playlist__thumb';
    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
    image.alt = '';
    image.loading = 'lazy';
    image.width = 82;
    image.height = 50;
    const number = document.createElement('span');
    number.className = 'playlist__number';
    number.textContent = String(index + 1);
    thumb.append(image, number);

    const info = document.createElement('span');
    info.className = 'playlist__info';
    const title = document.createElement('span');
    title.className = 'playlist__title';
    title.textContent = video.title;
    const duration = document.createElement('span');
    duration.className = 'playlist__duration';
    duration.textContent = video.duration;
    info.append(title, duration);

    button.append(thumb, info);
    item.append(button);
    list.append(item);

    button.addEventListener('click', () => {
      iframe.src = videoSrc(index);
      iframe.title = `YouTube playlist: ${video.title}`;
      buttons.forEach((other, otherIndex) => {
        other.classList.toggle('is-active', otherIndex === index);
        if (otherIndex === index) {
          other.setAttribute('aria-current', 'true');
        } else {
          other.removeAttribute('aria-current');
        }
      });
    });

    return button;
  });

  stage.append(frame, list);
  return stage;
};

const openMedia = (button) => {
  if (!mediaDialog || !mediaDialogBody) return;

  activeMediaTrigger = button;
  if (mediaDialogTitle) {
    mediaDialogTitle.textContent = button.dataset.mediaTitle || 'Media';
  }

  const rect = button.getBoundingClientRect();
  const originX = Math.round(((rect.left + rect.width / 2) / window.innerWidth) * 100);
  const originY = Math.round(((rect.top + rect.height / 2) / window.innerHeight) * 100);
  mediaDialog.style.setProperty('--dialog-origin-x', `${Math.min(100, Math.max(0, originX))}%`);
  mediaDialog.style.setProperty('--dialog-origin-y', `${Math.min(100, Math.max(0, originY))}%`);

  clearMedia();

  if (button.dataset.mediaVideo === 'stormy') {
    mediaDialogBody.append(buildVideoStage());
  } else {
    const source = button.closest('.project')?.querySelector('.project__media');
    const stage = document.createElement('div');
    stage.className = 'media-stage';
    if (source) stage.append(source.cloneNode(true));
    mediaDialogBody.append(stage);
  }

  if (typeof mediaDialog.showModal === 'function') {
    mediaDialog.showModal();
  } else {
    mediaDialog.setAttribute('open', '');
  }
  mediaClose?.focus();
};

mediaButtons.forEach((button) => {
  button.addEventListener('click', () => openMedia(button));
});

mediaClose?.addEventListener('click', closeMedia);

mediaDialog?.addEventListener('click', (event) => {
  if (event.target === mediaDialog) closeMedia();
});

mediaDialog?.addEventListener('close', () => {
  clearMedia();
  activeMediaTrigger?.focus();
  activeMediaTrigger = null;
});

// itch.io does not send CORS headers, so the public profile is read through a
// text proxy. The saved cards stay visible when that request is unavailable.
const playGrid = document.querySelector('#play-grid');
const playStatus = document.querySelector('#play-status');
const itchFeedUrl = 'https://r.jina.ai/http://axyleneomega.itch.io';

const normalizeGameUrl = (value) => {
  try {
    const url = new URL(value, window.location.href);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname}`.replace(/\/+$/, '').toLowerCase();
  } catch {
    return '';
  }
};

const parseItchProfile = (text) => {
  const profileOnly = text.split(/^##\s+\[?My Favourite Games\b/im)[0];
  const lines = profileOnly.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const games = [];

  for (let index = 0; index < lines.length; index += 1) {
    const imageMatch = lines[index].match(/^\[!\[[^\]]*\]\((https:\/\/img\.itch\.zone\/[^)]+)\)\]\((https:\/\/[^)]+)\)$/);
    if (!imageMatch) continue;

    const [, image, gameUrl] = imageMatch;
    const titleMatch = lines[index + 1]?.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
    if (!titleMatch) continue;

    const [, title, titleUrl] = titleMatch;
    if (normalizeGameUrl(titleUrl) !== normalizeGameUrl(gameUrl)) continue;

    const description = lines[index + 2] || '';
    const authorMatch = lines[index + 3]?.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
    const author = authorMatch ? authorMatch[1] : 'Advaith Karnad';
    const genre = lines[index + 4] && !lines[index + 4].startsWith('[') ? lines[index + 4] : '';

    games.push({ image, url: gameUrl, title, description, author, genre });
  }

  return games;
};

const isSafeItchImage = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'img.itch.zone';
  } catch {
    return false;
  }
};

const createPlayCard = (game) => {
  const card = document.createElement('article');
  card.className = 'play-card reveal is-visible';
  card.dataset.gameUrl = game.url;

  const link = document.createElement('a');
  link.className = 'play-card__link';
  link.href = game.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const media = document.createElement('span');
  media.className = 'play-card__media';
  if (isSafeItchImage(game.image)) {
    const image = document.createElement('img');
    image.src = game.image;
    image.alt = '';
    image.loading = 'lazy';
    image.width = 315;
    image.height = 250;
    media.append(image);
  }

  const body = document.createElement('span');
  body.className = 'play-card__body';

  const title = document.createElement('span');
  title.className = 'play-card__title';
  title.textContent = game.title;
  title.setAttribute('translate', 'no');

  const description = document.createElement('span');
  description.className = 'play-card__description';
  description.textContent = game.description;

  const meta = document.createElement('span');
  meta.className = 'play-card__meta';
  meta.textContent = [game.author, game.genre].filter(Boolean).join(' · ');

  const cta = document.createElement('span');
  cta.className = 'play-card__cta';
  cta.textContent = 'Play on itch.io';

  body.append(title, description, meta, cta);
  link.append(media, body);
  card.append(link);
  return card;
};

const syncItchGames = async () => {
  if (!playGrid) return;

  const known = new Set(
    [...playGrid.querySelectorAll('[data-game-url]')]
      .map((card) => normalizeGameUrl(card.dataset.gameUrl))
      .filter(Boolean)
  );

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(itchFeedUrl, {
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(` itch feed ${response.status}`);

    const games = parseItchProfile(await response.text()).filter((game) => {
      try {
        const url = new URL(game.url);
        return url.protocol === 'https:' && /(^|\.)itch\.io$/i.test(url.hostname);
      } catch {
        return false;
      }
    });

    let added = 0;
    games.forEach((game) => {
      const key = normalizeGameUrl(game.url);
      if (!key || known.has(key)) return;
      known.add(key);
      playGrid.append(createPlayCard(game));
      added += 1;
    });

    if (playStatus) {
      playStatus.textContent = added === 1
        ? 'Synced with your itch.io profile — 1 new game added.'
        : added > 1
          ? `Synced with your itch.io profile — ${added} new games added.`
          : 'Synced with your itch.io profile.';
    }
  } catch {
    if (playStatus) {
      playStatus.textContent = 'Showing saved credits; live profile unavailable.';
    }
  } finally {
    window.clearTimeout(timeout);
  }
};

syncItchGames();
