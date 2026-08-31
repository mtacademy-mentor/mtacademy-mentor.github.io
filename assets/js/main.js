// Shared site behavior
(() => {
  const html = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMenuQuery = window.matchMedia('(max-width: 1100px)');

  const PROMOTION_CAMPAIGN_CONFIG = Object.freeze({
    startTimestamp: '2026-08-25T20:40:00+03:00',
    endTimestamp: '2026-08-30T20:40:00+03:00',
    whatsappUrl: 'https://wa.me/201032105166',
    whatsappMessages: Object.freeze({
      ar: 'أهلاً م/ محمد، عايز أستفيد من عرض الخصم 35% على برنامج الـ Online Mentorship.',
      en: 'Hi Mohamed, I’d like to claim the 35% discount on the Online Mentorship Program.'
    })
  });

  const promotionState = {
    banner: null,
    compact: false,
    endTime: null,
    endTimeoutId: null,
    evaluate: null,
    intervalId: null,
    listenersAttached: false,
    resizeObserver: null,
    scrollFrameId: null,
    startTime: null,
    startTimeoutId: null,
    transitionMeasureTimeoutId: null
  };

  const getLanguage = () => (html.lang === 'en' ? 'en' : 'ar');
  const getMotionBehavior = () => (reducedMotionQuery.matches ? 'auto' : 'smooth');

  const measurePromotionHeight = () => {
    const { banner } = promotionState;
    if (!banner || banner.hidden || !document.body.classList.contains('promo-active')) return;

    const height = Math.ceil(banner.getBoundingClientRect().height);
    html.style.setProperty('--promo-banner-height', height > 0 ? `${height}px` : '0px');
  };

  const updatePromotionJourneyState = () => {
    const { banner } = promotionState;
    if (!banner || banner.hidden || !document.body.classList.contains('promo-active')) return;

    // Hysteresis prevents the banner from rapidly switching states near one threshold.
    const shouldCompact = promotionState.compact ? window.scrollY > 45 : window.scrollY > 220;
    if (shouldCompact === promotionState.compact) return;

    promotionState.compact = shouldCompact;
    banner.classList.toggle('is-compact', shouldCompact);
    measurePromotionHeight();
    window.requestAnimationFrame(measurePromotionHeight);
    window.clearTimeout(promotionState.transitionMeasureTimeoutId);
    promotionState.transitionMeasureTimeoutId = window.setTimeout(measurePromotionHeight, 380);
  };

  const updatePromotionLocalization = () => {
    const cta = promotionState.banner?.querySelector('[data-promo-cta]');
    if (!cta) return;

    const message = PROMOTION_CAMPAIGN_CONFIG.whatsappMessages[getLanguage()];
    cta.href = `${PROMOTION_CAMPAIGN_CONFIG.whatsappUrl}?text=${encodeURIComponent(message).replace(/'/g, '%27')}`;

    measurePromotionHeight();
    window.requestAnimationFrame(measurePromotionHeight);
  };

  const initializePromotionCountdown = () => {
    const banner = document.getElementById('promotion-banner');
    if (!banner) return;

    promotionState.banner = banner;
    window.clearInterval(promotionState.intervalId);
    window.clearTimeout(promotionState.startTimeoutId);
    window.clearTimeout(promotionState.endTimeoutId);
    promotionState.intervalId = null;
    promotionState.startTimeoutId = null;
    promotionState.endTimeoutId = null;
    window.cancelAnimationFrame(promotionState.scrollFrameId);
    window.clearTimeout(promotionState.transitionMeasureTimeoutId);
    promotionState.scrollFrameId = null;
    promotionState.transitionMeasureTimeoutId = null;
    promotionState.resizeObserver?.disconnect();
    promotionState.resizeObserver = null;

    const startTime = Date.parse(PROMOTION_CAMPAIGN_CONFIG.startTimestamp);
    const endTime = Date.parse(PROMOTION_CAMPAIGN_CONFIG.endTimestamp);
    promotionState.startTime = startTime;
    promotionState.endTime = endTime;

    const timerElements = {
      days: banner.querySelector('[data-promo-days]'),
      hours: banner.querySelector('[data-promo-hours]'),
      minutes: banner.querySelector('[data-promo-minutes]'),
      seconds: banner.querySelector('[data-promo-seconds]')
    };

    const clearActiveTimers = () => {
      window.clearInterval(promotionState.intervalId);
      window.clearTimeout(promotionState.endTimeoutId);
      promotionState.intervalId = null;
      promotionState.endTimeoutId = null;
    };

    const renderCountdown = (remainingMilliseconds) => {
      const remainingSeconds = Math.floor(Math.max(0, remainingMilliseconds) / 1000);
      const days = Math.floor(remainingSeconds / 86400);
      const hours = Math.floor((remainingSeconds % 86400) / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;

      Object.entries({ days, hours, minutes, seconds }).forEach(([unit, value]) => {
        if (timerElements[unit]) timerElements[unit].textContent = String(value).padStart(2, '0');
      });
    };

    const hidePromotion = ({ renderZero = false } = {}) => {
      if (renderZero) renderCountdown(0);
      clearActiveTimers();
      window.cancelAnimationFrame(promotionState.scrollFrameId);
      window.clearTimeout(promotionState.transitionMeasureTimeoutId);
      promotionState.scrollFrameId = null;
      promotionState.transitionMeasureTimeoutId = null;
      promotionState.resizeObserver?.disconnect();
      promotionState.resizeObserver = null;
      promotionState.compact = false;
      banner.classList.remove('is-compact');
      banner.hidden = true;
      document.body.classList.remove('promo-active');
      html.style.setProperty('--promo-banner-height', '0px');
    };

    const revealPromotion = (remainingMilliseconds) => {
      updatePromotionLocalization();
      banner.hidden = false;
      document.body.classList.add('promo-active');
      renderCountdown(remainingMilliseconds);
      measurePromotionHeight();
      window.requestAnimationFrame(measurePromotionHeight);
      updatePromotionJourneyState();

      if ('ResizeObserver' in window && !promotionState.resizeObserver) {
        try {
          promotionState.resizeObserver = new ResizeObserver(measurePromotionHeight);
          promotionState.resizeObserver.observe(banner);
        } catch (_) { /* Direct measurements remain available as a fallback. */ }
      }

      if (!promotionState.intervalId) {
        promotionState.intervalId = window.setInterval(() => promotionState.evaluate?.(), 1000);
      }

      if (!promotionState.endTimeoutId) {
        promotionState.endTimeoutId = window.setTimeout(
          () => promotionState.evaluate?.(),
          Math.min(Math.max(remainingMilliseconds, 0), 2147483647)
        );
      }
    };

    promotionState.evaluate = () => {
      const now = Date.now();

      if (now < startTime) {
        hidePromotion();
        window.clearTimeout(promotionState.startTimeoutId);
        promotionState.startTimeoutId = window.setTimeout(
          () => promotionState.evaluate?.(),
          Math.min(startTime - now, 2147483647)
        );
        return;
      }

      window.clearTimeout(promotionState.startTimeoutId);
      promotionState.startTimeoutId = null;

      if (now >= endTime) {
        hidePromotion({ renderZero: true });
        return;
      }

      const remainingMilliseconds = Math.max(0, endTime - Date.now());
      if (remainingMilliseconds <= 0) {
        hidePromotion({ renderZero: true });
        return;
      }

      revealPromotion(remainingMilliseconds);
    };

    updatePromotionLocalization();

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      promotionState.evaluate = null;
      hidePromotion();
      return;
    }

    if (!promotionState.listenersAttached) {
      window.addEventListener('resize', measurePromotionHeight, { passive: true });
      window.addEventListener('scroll', () => {
        if (promotionState.scrollFrameId) return;
        promotionState.scrollFrameId = window.requestAnimationFrame(() => {
          updatePromotionJourneyState();
          promotionState.scrollFrameId = null;
        });
      }, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        promotionState.evaluate?.();
        updatePromotionJourneyState();
        measurePromotionHeight();
      });
      promotionState.listenersAttached = true;
    }

    promotionState.evaluate();
  };

  const updateLocalizedAttributes = () => {
    const language = getLanguage();

    document.querySelectorAll('[data-label-ar][data-label-en]').forEach((element) => {
      element.setAttribute('aria-label', element.dataset[`label${language === 'ar' ? 'Ar' : 'En'}`]);
    });

    document.querySelectorAll('[data-alt-ar][data-alt-en]').forEach((image) => {
      image.alt = image.dataset[`alt${language === 'ar' ? 'Ar' : 'En'}`];
    });

    document.querySelectorAll('[data-ar][data-en]').forEach((element) => {
      const localizedValue = element.dataset[language];

      if (element.tagName === 'TITLE') element.textContent = localizedValue;
      else if (localizedValue) element.setAttribute('content', localizedValue);
    });

    document.querySelectorAll('.reviews-slider-container').forEach((container) => {
      const slides = [...container.querySelectorAll('.review-slide')];
      slides.forEach((slide, index) => {
        slide.setAttribute('aria-label', language === 'ar'
          ? `${index + 1} من ${slides.length}`
          : `${index + 1} of ${slides.length}`);

        const image = slide.querySelector('img');
        if (!image) return;
        if (container.classList.contains('elsewedy-slider-container')) {
          image.alt = language === 'ar'
            ? `برنامج التدريب في السويدي إليكتريك - صورة ${index + 1}`
            : `Elsewedy Electric internship program - photo ${index + 1}`;
        } else if (container.querySelector('.center-slider')) {
          image.alt = language === 'ar'
            ? `إنجاز متدرب ${index + 1}`
            : `Mentee achievement ${index + 1}`;
        } else {
          image.alt = language === 'ar'
            ? `تقييم متدرب ${index + 1}`
            : `Mentee review ${index + 1}`;
        }
      });
    });
  };

  const setLanguage = (language) => {
    const scrollPosition = window.scrollY;
    html.lang = language;
    html.dir = language === 'ar' ? 'rtl' : 'ltr';

    try {
      localStorage.setItem('preferredLanguage', language);
    } catch (_) { /* Language still changes when storage is unavailable. */ }

    updateLocalizedAttributes();
    updatePromotionLocalization();
    document.querySelectorAll('.slider-status').forEach((status) => {
      const slideCount = status.closest('.reviews-slider-container')?.querySelectorAll('.review-slide').length || 0;
      const itemNumber = Number(status.dataset.index || 0) + 1;
      status.textContent = language === 'ar'
        ? `العنصر ${itemNumber} من ${slideCount}`
        : `Item ${itemNumber} of ${slideCount}`;
    });
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollPosition, behavior: 'auto' }));
  };

  const initializeRevealAnimations = () => {
    const revealElements = new Set();
    const mobileMotion = window.matchMedia('(max-width: 700px)').matches;
    const stagger = mobileMotion ? 35 : 55;

    const register = (element, variant = 'fade-up', delay = 0) => {
      if (!element || element.closest('.hero')) return;
      element.dataset.reveal = variant;
      element.style.setProperty('--reveal-delay', `${Math.min(delay, mobileMotion ? 160 : 330)}ms`);
      revealElements.add(element);
    };

    const registerGroup = (selector, variant, columns = 4) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        register(element, variant, (index % columns) * stagger);
      });
    };

    document.querySelectorAll('main section:not(.hero), .social-hub').forEach((section) => {
      register(section.querySelector(':scope > .s-tag'), 'fade-up');
      register(section.querySelector(':scope > .s-title'), 'fade-up', stagger);
      register(section.querySelector(':scope > .s-sub'), 'fade-in', stagger * 2);
    });

    register(document.querySelector('#about .about-inner > :first-child'), 'inline-start');
    register(document.querySelector('#about .about-numbers'), 'inline-end', stagger);
    registerGroup('#services .srv', 'fade-up', 3);
    registerGroup('.countries-section .country-pill', 'scale-up', 4);
    registerGroup('#plans .plan', 'fade-up', 4);
    register(document.querySelector('#booking .booking-inner > :first-child'), 'inline-start');
    register(document.querySelector('#booking .booking-info'), 'inline-end', stagger);
    registerGroup('.social-grid .social-card', 'fade-up', 5);
    registerGroup('.reviews-slider-container', 'scale-up', 2);

    register(document.querySelector('.faq-eyebrow'), 'fade-up');
    register(document.querySelector('.faq-hero h1'), 'fade-up', stagger);
    register(document.querySelector('.faq-intro-copy'), 'inline-start', stagger * 2);
    register(document.querySelector('.faq-quick-facts'), 'inline-end', stagger * 2);
    register(document.querySelector('.faq-section-heading'), 'fade-up');
    registerGroup('.faq-list .faq-item', 'fade-up', 4);
    register(document.querySelector('.faq-closing'), 'scale-up');

    register(document.querySelector('.terms-hero h1'), 'fade-up');
    register(document.querySelector('.terms-intro'), 'fade-up', stagger);
    registerGroup('.terms-section', 'fade-up', 3);

    registerGroup('.footer-inner > *', 'fade-up', 4);
    register(document.querySelector('.footer-bottom'), 'fade-in', stagger * 2);

    const reveals = [...revealElements];
    const showImmediately = () => reveals.forEach((element) => element.classList.add('is-revealed'));

    if (!reveals.length || reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
      showImmediately();
      return;
    }

    try {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const clearRevealState = () => {
            entry.target.removeEventListener('transitionend', finishReveal);
            entry.target.removeAttribute('data-reveal');
            entry.target.style.removeProperty('--reveal-delay');
          };
          const finishReveal = (event) => {
            if (event.target !== entry.target || !['opacity', 'transform'].includes(event.propertyName)) return;
            clearRevealState();
          };
          entry.target.addEventListener('transitionend', finishReveal);
          entry.target.classList.add('is-revealed');
          window.setTimeout(clearRevealState, 1200);
          if (entry.target.matches('.plan.popular')) {
            window.setTimeout(() => {
              if (!reducedMotionQuery.matches) entry.target.classList.add('featured-highlight');
            }, 180);
          }
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

      html.classList.add('reveal-enabled');
      reveals.forEach((element) => observer.observe(element));
    } catch (_) {
      html.classList.remove('reveal-enabled');
      showImmediately();
    }
  };

  const initializeCounters = () => {
    const candidates = [...document.querySelectorAll('.stat .num, .abox-num')]
      .filter((element) => !element.querySelector('.rating-star'));
    const counters = [];

    candidates.forEach((element) => {
      const finalText = element.textContent.trim().replace(/\s+/g, '');
      const match = finalText.match(/^([\d,]+)(.*)$/);
      if (!match) return;

      const finalValue = Number(match[1].replace(/,/g, ''));
      if (!Number.isFinite(finalValue)) return;

      const suffix = match[2];
      const accessibleText = document.createElement('span');
      const visual = document.createElement('b');
      const numberText = document.createTextNode(reducedMotionQuery.matches ? String(finalValue) : '0');
      accessibleText.className = 'sr-only';
      accessibleText.textContent = finalText;
      visual.className = 'count-visual';
      visual.setAttribute('aria-hidden', 'true');
      visual.append(numberText);

      if (suffix) {
        const suffixElement = document.createElement('span');
        suffixElement.className = 'count-suffix';
        suffixElement.textContent = suffix;
        visual.append(suffixElement);
      }

      element.replaceChildren(accessibleText, visual);
      counters.push({ element, finalValue, numberText, started: false });
    });

    const finish = (counter) => {
      counter.started = true;
      counter.numberText.nodeValue = String(counter.finalValue);
    };

    const animate = (counter, duration = 900) => {
      if (counter.started || reducedMotionQuery.matches) {
        finish(counter);
        return;
      }

      counter.started = true;
      const startedAt = performance.now();
      const tick = (now) => {
        if (reducedMotionQuery.matches) {
          finish(counter);
          return;
        }

        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.numberText.nodeValue = String(Math.round(counter.finalValue * eased));
        if (progress < 1) window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    };

    if (!counters.length) return;

    if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
      counters.forEach(finish);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const counter = counters.find(({ element }) => element === entry.target);
        if (counter?.element.closest('.hero')) {
          window.setTimeout(() => animate(counter, 800), 500);
        } else if (counter) {
          animate(counter);
        }
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    counters.forEach(({ element }) => observer.observe(element));
    reducedMotionQuery.addEventListener('change', (event) => {
      if (event.matches) counters.forEach(finish);
    });
  };

  const initializeAttentionEffects = () => {
    const bookingLink = document.querySelector('.payment-contact-link');
    if (!bookingLink || reducedMotionQuery.matches || !('IntersectionObserver' in window)) return;

    let interacted = false;
    const stopAttention = () => {
      interacted = true;
      bookingLink.classList.remove('attention-once');
    };
    ['pointerdown', 'focusin', 'click'].forEach((eventName) => {
      bookingLink.addEventListener(eventName, stopAttention, { once: true });
    });
    bookingLink.addEventListener('animationend', stopAttention, { once: true });

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (!interacted) bookingLink.classList.add('attention-once');
      observer.disconnect();
    }, { threshold: 0.65 });
    observer.observe(bookingLink);
  };

  const initializeNavigation = () => {
    const navbar = document.getElementById('navbar');
    const menuButton = document.getElementById('menu-btn');
    const menu = document.getElementById('nav-links');
    const languageButton = document.getElementById('lang-switch');
    const menuIcon = menuButton?.querySelector('i');

    if (!navbar) return;

    const isMenuOpen = () => Boolean(menu?.classList.contains('active'));

    const updateMenuButton = () => {
      if (!menuButton) return;

      const language = getLanguage();
      const open = isMenuOpen();
      const labelKey = `label${open ? 'Close' : 'Open'}${language === 'ar' ? 'Ar' : 'En'}`;
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', menuButton.dataset[labelKey]);
      menuIcon?.classList.toggle('fa-bars', !open);
      menuIcon?.classList.toggle('fa-times', open);
    };

    const closeMenu = ({ restoreFocus = false } = {}) => {
      if (!menu || !isMenuOpen()) return;

      menu.classList.remove('active');
      document.body.classList.remove('menu-open');
      updateMenuButton();

      if (restoreFocus) menuButton?.focus({ preventScroll: true });
    };

    const openMenu = () => {
      if (!menu || !mobileMenuQuery.matches) return;

      menu.classList.add('active');
      document.body.classList.add('menu-open');
      updateMenuButton();
      menu.querySelector('a')?.focus({ preventScroll: true });
    };

    menuButton?.addEventListener('click', () => {
      if (isMenuOpen()) closeMenu();
      else openMenu();
    });

    languageButton?.addEventListener('click', () => {
      setLanguage(getLanguage() === 'ar' ? 'en' : 'ar');
      updateMenuButton();
    });

    menu?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    menu?.addEventListener('pointerdown', (event) => {
      if (event.target === menu) closeMenu({ restoreFocus: true });
    });

    document.addEventListener('pointerdown', (event) => {
      if (isMenuOpen() && !navbar.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (!isMenuOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = [...navbar.querySelectorAll('a[href], button:not([disabled])')]
        .filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });

    mobileMenuQuery.addEventListener('change', (event) => {
      if (!event.matches) closeMenu();
    });

    const sectionLinks = [...(menu?.querySelectorAll('a[href^="#"]') || [])]
      .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
      .filter(({ section }) => section);

    let scrollFrame = null;
    const updateNavigation = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);

      if (sectionLinks.length) {
        const promotionHeight = parseFloat(getComputedStyle(html).getPropertyValue('--promo-banner-height')) || 0;
        const marker = window.scrollY + Math.max(
          promotionHeight + navbar.offsetHeight + 40,
          window.innerHeight * 0.28
        );
        let current = sectionLinks[0];

        sectionLinks.forEach((candidate) => {
          if (candidate.section.offsetTop <= marker) current = candidate;
        });

        sectionLinks.forEach(({ link }) => {
          const active = link === current.link;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }

      scrollFrame = null;
    };

    window.addEventListener('scroll', () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateNavigation);
    }, { passive: true });
    updateNavigation();
    updateMenuButton();
  };

  const initializeScrollControls = () => {
    document.querySelectorAll('[data-scroll-target]').forEach((control) => {
      control.addEventListener('click', () => {
        document.getElementById(control.dataset.scrollTarget)?.scrollIntoView({
          behavior: getMotionBehavior(),
          block: 'start'
        });
      });
    });
  };

  const initializeCarousels = () => {
    document.querySelectorAll('.reviews-slider-container').forEach((container, carouselIndex) => {
      const slider = container.querySelector('.reviews-slider');
      const slides = [...container.querySelectorAll('.review-slide')];
      const previousButton = container.querySelector('.slider-prev');
      const nextButton = container.querySelector('.slider-next');
      const loops = container.classList.contains('elsewedy-slider-container');
      const dots = loops ? [...document.querySelectorAll('.elsewedy-dot')] : [];

      if (!slider || !slides.length || !previousButton || !nextButton) return;

      slides.forEach((slide) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
      });

      const status = document.createElement('p');
      status.className = 'sr-only slider-status';
      status.id = `carousel-status-${carouselIndex + 1}`;
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      container.append(status);
      slider.setAttribute('aria-describedby', status.id);

      let currentIndex = 0;
      let scrollTimer = null;
      let shouldAnnounceScroll = true;
      let autoplayTimer = null;
      let inViewport = !loops;
      let pointerInside = false;
      let focusInside = false;
      let userPaused = false;

      const positionFor = (slide) => Math.max(0, slide.offsetLeft - slider.offsetLeft);
      const maximumScroll = () => Math.max(0, slider.scrollWidth - slider.clientWidth);
      const nearestIndex = () => {
        const scrollPosition = slider.scrollLeft;
        let nearest = 0;
        let distance = Number.POSITIVE_INFINITY;

        slides.forEach((slide, index) => {
          const candidateDistance = Math.abs(positionFor(slide) - scrollPosition);
          if (candidateDistance < distance) {
            nearest = index;
            distance = candidateDistance;
          }
        });

        return nearest;
      };

      const statusText = () => getLanguage() === 'ar'
        ? `العنصر ${currentIndex + 1} من ${slides.length}`
        : `Item ${currentIndex + 1} of ${slides.length}`;

      const updateState = ({ announce = false } = {}) => {
        currentIndex = nearestIndex();
        status.dataset.index = String(currentIndex);

        if (!loops) {
          previousButton.disabled = slider.scrollLeft <= 2;
          nextButton.disabled = slider.scrollLeft >= maximumScroll() - 2;
        }

        dots.forEach((dot, index) => {
          const active = index === currentIndex;
          dot.classList.toggle('active', active);
          if (active) dot.setAttribute('aria-current', 'true');
          else dot.removeAttribute('aria-current');
        });

        if (announce || !status.textContent) status.textContent = statusText();
      };

      const goTo = (requestedIndex, { announce = true } = {}) => {
        let targetIndex = requestedIndex;
        if (loops) targetIndex = (targetIndex + slides.length) % slides.length;
        else targetIndex = Math.min(Math.max(targetIndex, 0), slides.length - 1);

        currentIndex = targetIndex;
        shouldAnnounceScroll = announce;
        slider.scrollTo({ left: positionFor(slides[targetIndex]), behavior: getMotionBehavior() });
        window.setTimeout(() => updateState(), reducedMotionQuery.matches ? 0 : 220);
      };

      const pauseForUser = () => {
        if (!loops) return;
        userPaused = true;
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      };

      previousButton.addEventListener('click', () => {
        pauseForUser();
        goTo(currentIndex - 1);
      });
      nextButton.addEventListener('click', () => {
        pauseForUser();
        goTo(currentIndex + 1);
      });

      slider.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        pauseForUser();
        if (event.key === 'ArrowLeft') goTo(currentIndex - 1);
        if (event.key === 'ArrowRight') goTo(currentIndex + 1);
        if (event.key === 'Home') goTo(0);
        if (event.key === 'End') goTo(slides.length - 1);
      });

      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          pauseForUser();
          goTo(index);
        });
        dot.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          const nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + dots.length) % dots.length;
          pauseForUser();
          dots[nextIndex].focus();
          goTo(nextIndex);
        });
      });

      slider.addEventListener('scroll', () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
          updateState({ announce: shouldAnnounceScroll });
          shouldAnnounceScroll = true;
        }, 140);
      }, { passive: true });

      const shouldAutoplay = () => loops && inViewport && !pointerInside && !focusInside
        && !userPaused && !document.hidden && !reducedMotionQuery.matches;
      const syncAutoplay = () => {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
        if (shouldAutoplay()) {
          autoplayTimer = window.setInterval(() => goTo(currentIndex + 1, { announce: false }), 4000);
        }
      };

      if (loops) {
        const autoplayRegion = container.closest('#elsewedy-mentorship') || container;
        autoplayRegion.addEventListener('pointerenter', () => {
          pointerInside = true;
          syncAutoplay();
        });
        autoplayRegion.addEventListener('pointerleave', () => {
          pointerInside = false;
          syncAutoplay();
        });
        autoplayRegion.addEventListener('focusin', () => {
          focusInside = true;
          syncAutoplay();
        });
        autoplayRegion.addEventListener('focusout', () => {
          window.requestAnimationFrame(() => {
            focusInside = autoplayRegion.contains(document.activeElement);
            syncAutoplay();
          });
        });
        ['pointerdown', 'touchstart', 'wheel'].forEach((eventName) => {
          slider.addEventListener(eventName, pauseForUser, { passive: true });
        });

        if ('IntersectionObserver' in window) {
          const autoplayObserver = new IntersectionObserver((entries) => {
            inViewport = entries.some((entry) => entry.isIntersecting);
            syncAutoplay();
          }, { threshold: 0.3 });
          autoplayObserver.observe(container);
        } else {
          inViewport = true;
        }

        document.addEventListener('visibilitychange', syncAutoplay);
        reducedMotionQuery.addEventListener('change', syncAutoplay);
        syncAutoplay();
      }

      window.addEventListener('resize', () => updateState(), { passive: true });
      updateState();
    });
  };

  const initializeFaqControls = () => {
    const faqList = document.getElementById('faq-list');
    if (!faqList) return;

    const faqItems = [...faqList.querySelectorAll('.faq-item')];
    const expandAllButton = document.getElementById('expand-all');
    const collapseAllButton = document.getElementById('collapse-all');

    const updateControls = () => {
      const openCount = faqItems.filter((item) => item.open).length;
      if (expandAllButton) expandAllButton.disabled = openCount === faqItems.length;
      if (collapseAllButton) collapseAllButton.disabled = openCount === 0;
    };

    const setAllItemsOpen = (open) => {
      document.body.classList.add('bulk-faq-update');
      faqItems.forEach((item) => { item.open = open; });
      updateControls();
      window.requestAnimationFrame(() => document.body.classList.remove('bulk-faq-update'));
    };

    faqItems.forEach((item) => item.addEventListener('toggle', updateControls));
    expandAllButton?.addEventListener('click', () => setAllItemsOpen(true));
    collapseAllButton?.addEventListener('click', () => setAllItemsOpen(false));
    updateControls();
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (reducedMotionQuery.matches) html.classList.remove('motion-enabled');
    updateLocalizedAttributes();
    initializePromotionCountdown();
    initializeNavigation();
    initializeScrollControls();
    initializeRevealAnimations();
    initializeCounters();
    initializeAttentionEffects();
    initializeCarousels();
    initializeFaqControls();

    reducedMotionQuery.addEventListener('change', (event) => {
      if (event.matches) {
        html.classList.remove('motion-enabled');
        html.classList.remove('reveal-enabled');
        document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-revealed'));
        document.querySelectorAll('.featured-highlight, .attention-once').forEach((element) => {
          element.classList.remove('featured-highlight', 'attention-once');
        });
      }
    });
  });
})();
