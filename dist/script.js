const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const siteHeader = document.querySelector('.site-header');

if (siteHeader) {
  let lastHeaderScrollY = window.scrollY;
  let headerFrameRequested = false;

  const updateHeaderVisibility = () => {
    const currentScrollY = Math.max(window.scrollY, 0);
    const scrollDifference = currentScrollY - lastHeaderScrollY;
    const isNearTop = currentScrollY <= siteHeader.offsetHeight;

    siteHeader.classList.toggle('is-scrolled', !isNearTop);

    if (isNearTop || scrollDifference < -10) {
      siteHeader.classList.remove('is-hidden');
      lastHeaderScrollY = currentScrollY;
    } else if (scrollDifference > 10) {
      siteHeader.classList.add('is-hidden');
      lastHeaderScrollY = currentScrollY;
    }

    headerFrameRequested = false;
  };

  window.addEventListener('scroll', () => {
    if (headerFrameRequested) return;
    headerFrameRequested = true;
    window.requestAnimationFrame(updateHeaderVisibility);
  }, { passive: true });

  siteHeader.addEventListener('focusin', () => siteHeader.classList.remove('is-hidden'));
  updateHeaderVisibility();
}

const scrollFillItems = [...document.querySelectorAll('.scroll-fill')];

if (scrollFillItems.length) {
  let fillFrameRequested = false;

  const updateScrollFills = () => {
    const viewportHeight = window.innerHeight;
    const fillStart = viewportHeight * 0.9;
    const fillEnd = viewportHeight * 0.48;
    const fillDistance = fillStart - fillEnd;
    const pageEnd = document.documentElement.scrollHeight - viewportHeight;
    const isAtPageEnd = window.scrollY >= pageEnd - 12;

    scrollFillItems.forEach((item) => {
      const itemBounds = item.getBoundingClientRect();
      const isVisibleAtPageEnd = isAtPageEnd && itemBounds.top < viewportHeight && itemBounds.bottom > 0;
      const calculatedProgress = Math.min(1, Math.max(0, (fillStart - itemBounds.top) / fillDistance));
      const progress = reducedMotion || isVisibleAtPageEnd ? 1 : calculatedProgress;
      item.style.setProperty('--fill-progress', `${Math.round(progress * 1000) / 10}%`);
    });

    fillFrameRequested = false;
  };

  const requestFillUpdate = () => {
    if (fillFrameRequested) return;
    fillFrameRequested = true;
    window.requestAnimationFrame(updateScrollFills);
  };

  window.addEventListener('scroll', requestFillUpdate, { passive: true });
  window.addEventListener('resize', requestFillUpdate);
  window.addEventListener('load', requestFillUpdate);
  updateScrollFills();
}

const heroCharacter = document.querySelector('.hero-character');

function animateHeroStars() {
  if (!heroCharacter || reducedMotion || heroCharacter.dataset.starsAnimated) return;

  const svgDocument = heroCharacter.contentDocument;
  const stars = svgDocument ? [...svgDocument.querySelectorAll('.cls-3')] : [];

  if (!stars.length) return;

  heroCharacter.dataset.starsAnimated = 'true';

  stars.forEach((star, index) => {
    if (typeof star.animate !== 'function') return;

    star.style.transformBox = 'fill-box';
    star.style.transformOrigin = 'center';
    star.animate([
      { opacity: 0, transform: 'scale(0.25) rotate(-18deg)' },
      { opacity: 1, transform: 'scale(1.18) rotate(6deg)', offset: 0.72 },
      { opacity: 1, transform: 'scale(1) rotate(0deg)' }
    ], {
      duration: 720,
      delay: 260 + (index * 120),
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
  });
}

if (heroCharacter) {
  heroCharacter.addEventListener('load', animateHeroStars, { once: true });

  if (heroCharacter.contentDocument?.documentElement) {
    animateHeroStars();
  }
}

const projectSlider = document.querySelector('#project-slider');
const previousProjectButton = document.querySelector('[data-slider-direction="previous"]');
const nextProjectButton = document.querySelector('[data-slider-direction="next"]');

if (projectSlider && previousProjectButton && nextProjectButton) {
  const getScrollStep = () => {
    const firstCard = projectSlider.querySelector('.project-card');
    const columnGap = Number.parseFloat(getComputedStyle(projectSlider).columnGap) || 0;
    return firstCard ? firstCard.getBoundingClientRect().width + columnGap : projectSlider.clientWidth;
  };

  const updateSliderButtons = () => {
    const scrollEnd = projectSlider.scrollWidth - projectSlider.clientWidth;
    previousProjectButton.disabled = projectSlider.scrollLeft <= 2;
    nextProjectButton.disabled = projectSlider.scrollLeft >= scrollEnd - 2;
  };

  const scrollProjects = (direction) => {
    projectSlider.scrollBy({
      left: getScrollStep() * direction,
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  previousProjectButton.addEventListener('click', () => scrollProjects(-1));
  nextProjectButton.addEventListener('click', () => scrollProjects(1));

  projectSlider.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    scrollProjects(event.key === 'ArrowLeft' ? -1 : 1);
  });

  projectSlider.addEventListener('scroll', updateSliderButtons, { passive: true });
  window.addEventListener('resize', updateSliderButtons);

  updateSliderButtons();
}

const projectToggles = [...document.querySelectorAll('.project-toggle')];

projectToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const card = toggle.closest('.project-card');
    const willExpand = !card?.classList.contains('is-expanded');

    projectToggles.forEach((otherToggle) => {
      const otherCard = otherToggle.closest('.project-card');
      otherCard?.classList.remove('is-expanded');
      otherToggle.setAttribute('aria-expanded', 'false');
      const otherLabel = otherToggle.querySelector('span');
      const otherIcon = otherToggle.querySelector('i');
      if (otherLabel) otherLabel.textContent = 'View project summary';
      if (otherIcon) otherIcon.textContent = '+';
    });

    if (!willExpand || !card) return;
    card.classList.add('is-expanded');
    toggle.setAttribute('aria-expanded', 'true');
    const label = toggle.querySelector('span');
    const icon = toggle.querySelector('i');
    if (label) label.textContent = 'Hide project summary';
    if (icon) icon.textContent = '−';
  });
});
