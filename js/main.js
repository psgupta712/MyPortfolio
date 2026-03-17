'use strict';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : 'https://priyanshuportfolio-g8ib.onrender.com'; // <-- update after deploying backend

/* ─── PAGE LOADER ────────────────────────────────────────── */
function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 1200);
  });
}

/* ─── NAVBAR: SCROLL + ACTIVE SECTION ───────────────────── */
function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const links    = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    toggleBackTop();
  }, { passive: true });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => {
            l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );

  sections.forEach((s) => sectionObserver.observe(s));
}

/* ─── HAMBURGER MOBILE MENU ──────────────────────────────── */
function initMobileNav() {
  const btn       = document.getElementById('hamburger');
  const mobileNav = document.getElementById('nav-mobile');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMobileNav();
  });
}

window.closeMobileNav = function () {
  const btn       = document.getElementById('hamburger');
  const mobileNav = document.getElementById('nav-mobile');
  if (!mobileNav) return;
  mobileNav.classList.remove('open');
  btn?.classList.remove('open');
  btn?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

/* ─── THEME TOGGLE ───────────────────────────────────────── */
function initTheme() {
  const btn  = document.getElementById('theme-toggle');
  const body = document.body;
  const KEY  = 'psg-theme';

  const saved = localStorage.getItem(KEY);
  if (saved === 'light') {
    body.classList.add('light-mode');
    if (btn) btn.textContent = '☀️';
  }

  if (!btn) return;
  btn.addEventListener('click', () => {
    const isLight = body.classList.toggle('light-mode');
    btn.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem(KEY, isLight ? 'light' : 'dark');
  });
}

/* ─── SKILL TABS ─────────────────────────────────────────── */
function initSkillTabs() {
  const tabs   = document.querySelectorAll('.skill-tab');
  const panels = document.querySelectorAll('.skills-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t)   => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');

      const panel = document.getElementById(`panel-${target}`);
      if (!panel) return;
      panel.classList.add('active');

      // Re-trigger skill bar fills
      panel.querySelectorAll('.skill-bar-fill').forEach((bar) => {
        const t2 = bar.style.getPropertyValue('--target') || '70%';
        bar.style.width = '0%';
        requestAnimationFrame(() => setTimeout(() => { bar.style.width = t2; }, 50));
      });
    });
  });
}

/* ─── PROJECT FILTER ─────────────────────────────────────── */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards      = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach((card) => {
        const cats = card.dataset.category || '';
        const show = filter === 'all' || cats.includes(filter);
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity    = show ? '1' : '0.15';
        card.style.transform  = show ? '' : 'scale(0.97)';
        card.style.pointerEvents = show ? '' : 'none';
      });
    });
  });
}

/* ─── CONTACT FORM (wired to backend API) ────────────────── */
function initContactForm() {
  const form       = document.getElementById('contact-form');
  const successBox = document.getElementById('form-success');
  const apiErrBox  = document.getElementById('api-error');
  if (!form) return;

  // Field helpers using the prefixed IDs (cf-name etc.)
  function getField(id)   { return document.getElementById(`cf-${id}`) || document.getElementById(id); }
  function getError(id)   { return document.getElementById(`${id}-error`); }

  function validateField(id, testFn, msg) {
    const field = getField(id);
    const errEl = getError(id);
    if (!field || !errEl) return true;
    const ok = testFn(field.value);
    field.classList.toggle('error', !ok);
    errEl.classList.toggle('show', !ok);
    if (!ok) errEl.textContent = msg;
    return ok;
  }

  function validateAll() {
    const v1 = validateField('name',    (v) => v.trim().length >= 2, 'Please enter your name (min. 2 chars).');
    const v2 = validateField('email',   (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), 'Please enter a valid email address.');
    const v3 = validateField('subject', (v) => v.trim().length >= 2, 'Please enter a subject.');
    const v4 = validateField('message', (v) => v.trim().length >= 10, 'Message must be at least 10 characters.');
    return v1 && v2 && v3 && v4;
  }

  // Live validation on blur
  ['name','email','subject','message'].forEach((id) => {
    const el = getField(id);
    el?.addEventListener('blur', () => validateAll());
    el?.addEventListener('input', () => {
      // Clear error on type
      el.classList.remove('error');
      const errEl = getError(id);
      errEl?.classList.remove('show');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    const btn  = document.getElementById('form-submit');
    const text = document.getElementById('submit-text');

    // Show loading state
    if (btn)  btn.disabled = true;
    if (text) text.textContent = 'Sending... ⏳';
    if (apiErrBox) { apiErrBox.style.display = 'none'; apiErrBox.textContent = ''; }

    const payload = {
      name:    getField('name')?.value.trim(),
      email:   getField('email')?.value.trim(),
      subject: getField('subject')?.value.trim(),
      message: getField('message')?.value.trim(),
    };

    try {
      const res  = await fetch(`${API_BASE}/api/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ✅ Success: hide form fields, show success box
        form.querySelectorAll('input, textarea, button, .form-row, .form-group').forEach((el) => {
          el.style.display = 'none';
        });
        if (apiErrBox) apiErrBox.style.display = 'none';
        if (successBox) successBox.classList.add('show');
      } else {
        // ❌ Server returned an error
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

    } catch (err) {
      // ❌ Network error or server down
      if (apiErrBox) {
        apiErrBox.textContent = err.message.includes('Failed to fetch')
          ? '⚠️ Could not reach the server. Please email me directly at priyanshugupta14441@gmail.com'
          : `⚠️ ${err.message}`;
        apiErrBox.style.display = 'block';
      }

      if (btn)  btn.disabled = false;
      if (text) text.textContent = 'Send Message ✉';
    }
  });
}

/* ─── BACK TO TOP ────────────────────────────────────────── */
function initBackTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function toggleBackTop() {
  document.getElementById('back-top')?.classList.toggle('show', window.scrollY > 400);
}

/* ─── SMOOTH SCROLL ──────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ─── BOOT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initMobileNav();
  initTheme();
  initSkillTabs();
  initProjectFilter();
  initContactForm();
  initBackTop();
  initSmoothScroll();

  console.log('%c PSG Portfolio ⚡ ', 'background:#6366f1;color:#fff;font-size:16px;padding:4px 12px;border-radius:4px;');
  console.log('%c Built by Priyanshu Gupta · github.com/psgupta712 ', 'color:#818cf8;');
});
