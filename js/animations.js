/* ============================================================
   ANIMATIONS.JS — Scroll Reveals, Tilt, Skill Bars
   ============================================================ */

'use strict';

/* ─── INTERSECTION OBSERVER: REVEAL ELEMENTS ────────────── */
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale'
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ─── SKILL BAR ANIMATIONS ──────────────────────────────── */
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = el.style.getPropertyValue('--target') || '70%';
          // Delay to let panel become visible first
          setTimeout(() => {
            el.style.width = target;
          }, 200);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  bars.forEach((bar) => {
    bar.style.width = '0%';
    observer.observe(bar);
  });
}

/* ─── 3D TILT EFFECT ON PROJECT CARDS ───────────────────── */
function initTilt() {
  const cards = document.querySelectorAll('.tilt');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -8;
      const rotateY = ((x - cx) / cx) * 8;

      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(6px)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s linear';
    });
  });
}

/* ─── TYPING ANIMATION ───────────────────────────────────── */
function initTyping() {
  const el = document.getElementById('typing-text');
  if (!el) return;

  const phrases = [
    'Full Stack Developer',
    'Node.js Engineer',
    'Real-Time Systems Builder',
    'Problem Solver',
    'Open to Opportunities 🚀',
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let paused = false;

  function tick() {
    const current = phrases[phraseIdx];

    if (!deleting) {
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        paused = true;
        setTimeout(() => {
          paused = false;
          deleting = true;
          tick();
        }, 1800);
        return;
      }
    } else {
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    }

    const speed = deleting ? 40 : 70;
    setTimeout(tick, speed);
  }

  setTimeout(tick, 1200);
}

/* ─── PARALLAX BACKGROUND ORBS ──────────────────────────── */
function initParallax() {
  const orb1 = document.querySelector('.orb-1');
  const orb2 = document.querySelector('.orb-2');
  if (!orb1 || !orb2) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        orb1.style.transform = `translateY(${sy * 0.15}px)`;
        orb2.style.transform = `translateY(${-sy * 0.1}px)`;
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ─── INIT ALL ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initSkillBars();
  initTilt();
  initTyping();
  initParallax();
});
