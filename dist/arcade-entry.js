(() => {
  const opening = document.querySelector('[data-arcade-opening]');
  const openingSoundButton = opening?.querySelector('[data-sound-toggle]');
  const openingGameButtons = [...(opening?.querySelectorAll('[data-opening-game]') || [])];
  const openingSelectorTrack = opening?.querySelector('[data-opening-selector-track]');
  const openingSelectorPrev = opening?.querySelector('[data-opening-selector-prev]');
  const openingSelectorNext = opening?.querySelector('[data-opening-selector-next]');
  const skipLink = document.querySelector('[data-arcade-skip]');
  const selector = document.querySelector('.ux-arcade');
  const selectorTitle = document.querySelector('#arcade-title');
  const framework = window.UXArcade;

  if (!opening || !openingGameButtons.length || !selector || !framework) return;

  const reducedMotion = framework.isReducedMotion;
  const animatedItems = [...opening.querySelectorAll(
    '.arcade-versus, .arcade-opening-kicker, .arcade-opening h1, .arcade-opening-title-wrap > p:last-child, .arcade-pixel-burst i, .arcade-opening-selector'
  )];

  selector.inert = true;
  selector.setAttribute('aria-hidden', 'true');
  openingGameButtons.forEach((button) => { button.disabled = !reducedMotion; });

  const revealStart = () => {
    openingGameButtons.forEach((button) => { button.disabled = false; });
  };

  window.setTimeout(revealStart, reducedMotion ? 0 : 1650);

  const replayOpening = () => {
    if (reducedMotion) return;
    animatedItems.forEach((item) => { item.style.animation = 'none'; });
    void opening.offsetWidth;
    animatedItems.forEach((item) => { item.style.animation = ''; });
    openingGameButtons.forEach((button) => { button.disabled = true; });
    window.setTimeout(revealStart, 1650);
  };

  openingSoundButton?.addEventListener('click', () => {
    if (!framework.isSoundEnabled()) return;
    replayOpening();
    framework.playIntroTheme();
    opening.dataset.introHeard = 'true';
  });

  const leaveOpening = (onComplete) => {
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
      onComplete?.();
    };
    window.setTimeout(complete, reducedMotion ? 0 : 280);
  };

  const openSelectedGame = (gameId) => {
    framework.playSound('success');
    leaveOpening(() => {
      document.querySelector(`[data-open-game="${gameId}"]`)?.click();
    });
  };

  openingGameButtons.forEach((button) => {
    button.addEventListener('click', () => openSelectedGame(button.dataset.openingGame));
  });

  const moveSelector = (direction) => {
    const firstCard = openingGameButtons[0];
    if (!openingSelectorTrack || !firstCard) return;
    openingSelectorTrack.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + 12),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  openingSelectorPrev?.addEventListener('click', () => moveSelector(-1));
  openingSelectorNext?.addEventListener('click', () => moveSelector(1));
})();
