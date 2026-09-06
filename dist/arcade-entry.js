(() => {
  const opening = document.querySelector('[data-arcade-opening]');
  const startButton = opening?.querySelector('[data-arcade-start]');
  const openingSoundButton = opening?.querySelector('[data-sound-toggle]');
  const skipLink = document.querySelector('[data-arcade-skip]');
  const selector = document.querySelector('.ux-arcade');
  const selectorTitle = document.querySelector('#arcade-title');
  const framework = window.UXArcade;

  if (!opening || !startButton || !selector || !framework) return;

  const reducedMotion = framework.isReducedMotion;
  const animatedItems = [...opening.querySelectorAll(
    '.arcade-versus, .arcade-opening-kicker, .arcade-opening h1, .arcade-opening-title-wrap > p:last-child, .arcade-pixel-burst i, .arcade-opening-start'
  )];

  selector.inert = true;
  selector.setAttribute('aria-hidden', 'true');
  startButton.disabled = !reducedMotion;

  const revealStart = () => {
    startButton.disabled = false;
  };

  window.setTimeout(revealStart, reducedMotion ? 0 : 1650);

  const replayOpening = () => {
    if (reducedMotion) return;
    animatedItems.forEach((item) => { item.style.animation = 'none'; });
    void opening.offsetWidth;
    animatedItems.forEach((item) => { item.style.animation = ''; });
    startButton.disabled = true;
    window.setTimeout(revealStart, 1650);
  };

  openingSoundButton?.addEventListener('click', () => {
    if (!framework.isSoundEnabled()) return;
    replayOpening();
    framework.playIntroTheme();
    opening.dataset.introHeard = 'true';
  });

  const leaveOpening = () => {
    opening.classList.add('is-leaving');
    const complete = () => {
      opening.hidden = true;
      document.body.classList.remove('arcade-intro-active');
      selector.inert = false;
      selector.removeAttribute('aria-hidden');
      if (skipLink) {
        skipLink.href = '#arcade-title';
        skipLink.textContent = 'Skip to game selection';
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
      selectorTitle?.setAttribute('tabindex', '-1');
      selectorTitle?.focus({ preventScroll: true });
      selectorTitle?.addEventListener('blur', () => selectorTitle.removeAttribute('tabindex'), { once: true });
    };
    window.setTimeout(complete, reducedMotion ? 0 : 280);
  };

  startButton.addEventListener('click', () => {
    if (framework.isSoundEnabled() && !opening.dataset.introHeard) {
      replayOpening();
      framework.playIntroTheme();
      opening.dataset.introHeard = 'true';
      window.setTimeout(leaveOpening, reducedMotion ? 0 : 1250);
      return;
    }
    framework.playSound('success');
    leaveOpening();
  });
})();
