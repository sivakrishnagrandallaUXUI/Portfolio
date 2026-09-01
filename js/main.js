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

  /* Hero craft rotator — steps the word carousel and sizes the slot to the
     active word, so a short word never leaves a gap before "systems.".
     The last word is a duplicate of the first: we animate onto it, then
     snap back to index 0 with the transition off for a seamless loop. */
  (function initRotator() {
    const slot = document.querySelector('.hero__rotator');
    const track = document.querySelector('.hero__rotator-track');
    if (!slot || !track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const words = Array.from(track.querySelectorAll('.hero__rotator-word'));
    if (words.length < 2) return;

    const HOLD = 2600;
    const SLIDE = 600;
    let index = 0;

    /* Widen before the word slides in, but only narrow once it has left —
       otherwise a wider incoming word is clipped while the slot is still
       growing (and a narrower one clips the outgoing word on the way out). */
    function sizeToWord(i, immediate) {
      const next = words[i].getBoundingClientRect().width;
      const current = parseFloat(slot.style.getPropertyValue('--rotator-w')) || next;
      slot.style.transitionDelay = immediate || next >= current ? '0ms' : SLIDE + 'ms';
      slot.style.setProperty('--rotator-w', next + 'px');
    }

    function offsetFor(i) {
      return words[0].getBoundingClientRect().height * i;
    }

    sizeToWord(0, true);

    function advance() {
      index += 1;
      track.style.transition = '';
      track.style.transform = 'translateY(-' + offsetFor(index) + 'px)';
      sizeToWord(index);

      if (index === words.length - 1) {
        // Landed on the duplicate — reset to the real first word invisibly
        window.setTimeout(function () {
          track.style.transition = 'none';
          track.style.transform = 'translateY(0)';
          index = 0;
          void track.offsetHeight; // flush before transitions resume
          track.style.transition = '';
        }, SLIDE + 40);
      }
    }

    window.setInterval(advance, HOLD);

    // Font sizes are clamp()-based, so remeasure when the viewport changes
    window.addEventListener('resize', function () {
      track.style.transition = 'none';
      track.style.transform = 'translateY(-' + offsetFor(index) + 'px)';
      sizeToWord(index, true);
      void track.offsetHeight;
      track.style.transition = '';
    });

    // Fonts load after first paint and change the measurements
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { sizeToWord(index, true); });
    }
  })();

  /* Scroll progress hairline + header frost state */
  const progressBar = document.querySelector('.scroll-progress__bar');
  let scrollTicking = false;

  function onScrollFrame() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;

    if (progressBar) {
      progressBar.style.setProperty('--progress', pct.toFixed(2) + '%');
    }
    if (header) {
      header.classList.toggle('is-stuck', window.scrollY > 24);
    }
    scrollTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }, { passive: true });
  onScrollFrame();

  /* Sliding nav indicator — follows hover, snaps back to the active section */
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const navIndicator = document.querySelector('.site-nav__indicator');
  let activeNavLink = null;
  let spyTicking = false;

  function moveIndicatorTo(link) {
    if (!navIndicator || !link) return;
    navIndicator.style.width = link.offsetWidth + 'px';
    navIndicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    navIndicator.classList.add('is-active');
  }

  function resetIndicator() {
    if (!navIndicator) return;
    if (activeNavLink) {
      moveIndicatorTo(activeNavLink);
    } else {
      navIndicator.classList.remove('is-active');
    }
  }

  navLinks.forEach(function (link) {
    link.addEventListener('mouseenter', function () { moveIndicatorTo(link); });
    link.addEventListener('focus', function () { moveIndicatorTo(link); });
  });

  const navList = document.getElementById('nav-list');
  if (navList) {
    navList.addEventListener('mouseleave', resetIndicator);
  }

  /* Scrollspy — marks the section currently in view */
  const spySections = navLinks
    .map(function (link) {
      const el = document.querySelector(link.getAttribute('href'));
      return el ? { link: link, el: el } : null;
    })
    .filter(Boolean);

  /* Deterministic: pick the last section whose top has passed the read line.
     An IntersectionObserver fired per-entry and left tall neighbouring
     sections fighting over which one was "current". */
  function updateSpy() {
    const readLine = window.scrollY + window.innerHeight * 0.35;
    let current = null;

    spySections.forEach(function (s) {
      if (s.el.offsetTop <= readLine) current = s;
    });

    // Pin to the final section once the page is scrolled to the bottom
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = spySections[spySections.length - 1];
    }

    navLinks.forEach(function (l) { l.classList.remove('is-current'); });

    if (current) {
      current.link.classList.add('is-current');
      activeNavLink = current.link;
    } else {
      activeNavLink = null;
    }
    resetIndicator();
  }

  if (spySections.length) {
    window.addEventListener('scroll', function () {
      if (!spyTicking) {
        spyTicking = true;
        requestAnimationFrame(function () {
          updateSpy();
          spyTicking = false;
        });
      }
    }, { passive: true });
    window.addEventListener('load', updateSpy);
    updateSpy();
  }

  window.addEventListener('resize', resetIndicator);

  /* Stat counters — count up once the tile scrolls into view */
  const statValues = document.querySelectorAll('.stat__value[data-count]');

  if (statValues.length && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          countObserver.unobserve(el);

          const target = parseFloat(el.getAttribute('data-count'));
          const suffix = el.getAttribute('data-suffix') || '';
          const duration = 1100;
          const start = performance.now();

          function step(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 }
    );

    statValues.forEach(function (el) { countObserver.observe(el); });
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
    document.querySelectorAll('.btn--solid').forEach(function (btn) {
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
        'a, button, .app-mockup, .screens-gallery__item, .skills-list li, ' +
        '.cert-card, .gallery__item, .status-chip'
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
      '.hero__lede, .hero__aside, .section__head, .bento__tile, .case-study, ' +
      '.cert-card, .gallery__item, .contact__panel'
    );

    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      // Stagger siblings inside the same grid/row so they cascade in
      const stagger = (i % 4) * 70;
      el.style.transitionDelay = stagger + 'ms';
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
