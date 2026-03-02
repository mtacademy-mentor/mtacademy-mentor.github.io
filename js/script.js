// Navigation and Scroll Effects
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
});

// Reveal components on scroll
const observerOptions = {
  threshold: 0.1
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => revealObserver.observe(el));
});

// Language Toggle Functionality
function toggleLanguage() {
  const html = document.documentElement;
  const currentLang = html.getAttribute('lang');

  if (currentLang === 'ar') {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
    // Save preference
    localStorage.setItem('preferredLanguage', 'en');
  } else {
    html.setAttribute('lang', 'ar');
    html.setAttribute('dir', 'rtl');
    // Save preference
    localStorage.setItem('preferredLanguage', 'ar');
  }
}

// Mobile Menu Functionality
function toggleMenu() {
  const navLinks = document.getElementById('nav-links');
  const menuBtnIcon = document.querySelector('.menu-btn i');

  if (navLinks) {
    navLinks.classList.toggle('active');

    // Toggle icon between bars and times (X)
    if (menuBtnIcon) {
      if (navLinks.classList.contains('active')) {
        menuBtnIcon.classList.remove('fa-bars');
        menuBtnIcon.classList.add('fa-times');
      } else {
        menuBtnIcon.classList.remove('fa-times');
        menuBtnIcon.classList.add('fa-bars');
      }
    }
  }
}

// Close mobile menu when a link is clicked
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Button Event Listener
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMenu);
  }

  // Language Switch Button Event Listener
  const langSwitch = document.getElementById('lang-switch');
  if (langSwitch) {
    langSwitch.addEventListener('click', toggleLanguage);
  }

  const navLinks = document.getElementById('nav-links');
  if (navLinks) {
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const menuBtnIcon = document.querySelector('.menu-btn i');
        if (menuBtnIcon) {
          menuBtnIcon.classList.remove('fa-times');
          menuBtnIcon.classList.add('fa-bars');
        }
      });
    });
  }

  // Load preferred language
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang) {
    const html = document.documentElement;
    html.setAttribute('lang', savedLang);
    html.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
  }

  // Initial reveal check
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => revealObserver.observe(el));

  // Slider Navigation
  const slider = document.getElementById('reviews-slider');
  const btnPrev = document.getElementById('slider-prev');
  const btnNext = document.getElementById('slider-next');

  if (slider && btnPrev && btnNext) {
    btnNext.addEventListener('click', () => {
      // scroll amount roughly equal to card width
      slider.scrollBy({ left: 320, behavior: 'smooth' });
    });
    btnPrev.addEventListener('click', () => {
      slider.scrollBy({ left: -320, behavior: 'smooth' });
    });
  }
});
