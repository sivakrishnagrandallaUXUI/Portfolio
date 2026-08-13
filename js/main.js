/**
 * Portfolio — minimal interactions
 * Smooth scroll offset, mobile nav, scroll reveal, image placeholder swap
 */

(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.site-nav__toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const yearEl = document.getElementById('year');

  /* Current year in footer */
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* Account for fixed nav when jumping to anchors */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      closeMobileMenu();

      const headerOffset = (header ? header.offsetHeight : 0) + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({ top: top, behavior: 'smooth' });
      history.pushState(null, '', targetId);
    });
  });

  /* Mobile menu toggle */
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
      mobileMenu.hidden = isOpen;
    });
  }

  function closeMobileMenu() {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    mobileMenu.hidden = true;
  }

  /* Swap placeholder for real image when assets load successfully */
  document.querySelectorAll('.case-study__figure img').forEach(function (img) {
    const figure = img.closest('.case-study__figure');
    if (!figure) return;

    function markLoaded() {
      if (img.naturalWidth > 0) {
        figure.classList.add('is-loaded');
      }
    }

    img.addEventListener('load', markLoaded);

    if (img.complete) {
      markLoaded();
    }
  });

  /* Scale full-size dashboard embeds to fit their responsive container */
  function setEmbedScales() {
    document.querySelectorAll('.dashboard-embed').forEach(function (el) {
      const scale = el.clientWidth / 1280;
      el.style.setProperty('--embed-scale', scale);
    });
  }
  setEmbedScales();
  window.addEventListener('resize', setEmbedScales);

  /* Cursor accent dot — fine pointers only, respects reduced motion */
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const prefersReducedMotionForCursor = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hasFinePointer && !prefersReducedMotionForCursor) {
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    document.body.appendChild(cursorDot);
    let cursorActive = false;

    window.addEventListener('mousemove', function (event) {
      cursorDot.style.left = event.clientX + 'px';
      cursorDot.style.top = event.clientY + 'px';

      if (!cursorActive) {
        cursorDot.classList.add('is-active');
        cursorActive = true;
      }

      const isPointerTarget = event.target.closest(
        'a, button, .app-mockup, .screens-gallery__item, .skills-list li'
      );
      cursorDot.classList.toggle('is-pointer', Boolean(isPointerTarget));
    });

    document.addEventListener('mouseleave', function () {
      cursorDot.classList.remove('is-active');
    });
  }

  /* Smooth scroll reveal — respects reduced motion */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll(
      '.hero__content, .hero__portrait, .section__grid, .case-study, .work__intro'
    );

    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
