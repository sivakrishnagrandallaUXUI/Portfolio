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

  /* Scale full-size dashboard embeds to fit their responsive container.
     Uses ResizeObserver so it self-corrects after font swaps/layout shifts,
     not just a single measurement at script-load time. */
  function applyEmbedScale(el) {
    const scale = el.clientWidth / 1280;
    if (scale > 0) {
      el.style.setProperty('--embed-scale', scale);
    }
  }

  const dashboardEmbeds = document.querySelectorAll('.dashboard-embed');

  dashboardEmbeds.forEach(applyEmbedScale);
  window.addEventListener('load', function () {
    dashboardEmbeds.forEach(applyEmbedScale);
  });

  if ('ResizeObserver' in window) {
    const embedObserver = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        applyEmbedScale(entry.target);
      });
    });
    dashboardEmbeds.forEach(function (el) {
      embedObserver.observe(el);
    });
  } else {
    window.addEventListener('resize', function () {
      dashboardEmbeds.forEach(applyEmbedScale);
    });
  }

  /* Reactive mesh background — drifts on its own via CSS, nudges gently
     toward the cursor here. Skipped for reduced motion / coarse pointers. */
  const meshBg = document.querySelector('.mesh-bg');
  const meshHasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const meshPrefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (meshBg && meshHasFinePointer && !meshPrefersReducedMotion) {
    let meshTargetX = 0;
    let meshTargetY = 0;
    let meshCurrentX = 0;
    let meshCurrentY = 0;
    const meshRange = 28; // max px the mesh nudges toward the cursor

    window.addEventListener('mousemove', function (event) {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      meshTargetX = nx * meshRange;
      meshTargetY = ny * meshRange;
    });

    (function tickMesh() {
      meshCurrentX += (meshTargetX - meshCurrentX) * 0.04;
      meshCurrentY += (meshTargetY - meshCurrentY) * 0.04;
      meshBg.style.setProperty('--mesh-x', meshCurrentX.toFixed(2) + 'px');
      meshBg.style.setProperty('--mesh-y', meshCurrentY.toFixed(2) + 'px');
      requestAnimationFrame(tickMesh);
    })();
  }

  /* Glass card tilt + cursor glare — fine pointers only */
  if (meshHasFinePointer && !meshPrefersReducedMotion) {
    document.querySelectorAll('.glass-tilt').forEach(function (card) {
      const maxTilt = 5; // degrees

      card.addEventListener('mousemove', function (event) {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;

        card.style.setProperty('--tilt-x', ((0.5 - py) * maxTilt * 2).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', ((px - 0.5) * maxTilt * 2).toFixed(2) + 'deg');
        card.style.setProperty('--glare-x', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--glare-y', (py * 100).toFixed(1) + '%');
      });

      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  /* Magnetic buttons — the CTA drifts slightly toward the cursor */
  if (meshHasFinePointer && !meshPrefersReducedMotion) {
    document.querySelectorAll('.hero__cta').forEach(function (btn) {
      btn.addEventListener('mousemove', function (event) {
        const rect = btn.getBoundingClientRect();
        const mx = event.clientX - (rect.left + rect.width / 2);
        const my = event.clientY - (rect.top + rect.height / 2);
        btn.style.transform = 'translate(' + (mx * 0.25).toFixed(1) + 'px, ' + (my * 0.35).toFixed(1) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

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
      '.hero__content, .hero__portrait, .section__intro, .section__body, .case-study, .work__intro'
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
