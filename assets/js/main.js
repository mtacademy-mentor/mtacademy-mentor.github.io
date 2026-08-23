// Shared site behavior
(() => {
  const html = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMenuQuery = window.matchMedia('(max-width: 1100px)');

  const getLanguage = () => (html.lang === 'en' ? 'en' : 'ar');
  const getMotionBehavior = () => (reducedMotionQuery.matches ? 'auto' : 'smooth');

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
    const reveals = [...document.querySelectorAll('.reveal')];

    if (!reveals.length || reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
      reveals.forEach((element) => element.classList.add('visible'));
      return;
    }

    try {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

      html.classList.add('reveal-enabled');
      reveals.forEach((element) => observer.observe(element));
    } catch (_) {
      html.classList.remove('reveal-enabled');
      reveals.forEach((element) => element.classList.add('visible'));
    }
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
        const marker = window.scrollY + Math.max(navbar.offsetHeight + 40, window.innerHeight * 0.28);
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
      faqItems.forEach((item) => { item.open = open; });
      updateControls();
    };

    faqItems.forEach((item) => item.addEventListener('toggle', updateControls));
    expandAllButton?.addEventListener('click', () => setAllItemsOpen(true));
    collapseAllButton?.addEventListener('click', () => setAllItemsOpen(false));
    updateControls();
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateLocalizedAttributes();
    initializeNavigation();
    initializeScrollControls();
    initializeRevealAnimations();
    initializeCarousels();
    initializeFaqControls();

    reducedMotionQuery.addEventListener('change', (event) => {
      if (event.matches) {
        html.classList.remove('reveal-enabled');
        document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
      }
    });
  });
})();
