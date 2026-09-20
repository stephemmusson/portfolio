(() => {
  const gameOrder = [
    'captcha-boss',
    'white-space-race',
    'pac-facts',
    'popup-panic',
    'design-debt',
    'scope-invaders',
    'contrast-crash',
    'mega-menu-mayhem'
  ];

  const reorderGames = () => {
    const openingTrack = document.querySelector('[data-opening-selector-track]');
    const gameGrid = document.querySelector('.arcade-grid');
    const progressPips = document.querySelector('.arcade-progress-pips');

    gameOrder.forEach((gameId, index) => {
      const number = String(index + 1).padStart(2, '0');
      const openingButton = openingTrack?.querySelector(`[data-opening-game="${gameId}"]`);
      const card = gameGrid?.querySelector(`[data-game-card="${gameId}"]`);
      const pip = progressPips?.querySelector(`[data-progress-game="${gameId}"]`);
      openingButton?.querySelector(':scope > span')?.replaceChildren(number);
      card?.querySelector('.game-number')?.replaceChildren(number);
      if (openingButton) openingTrack.append(openingButton);
      if (card) gameGrid.append(card);
      if (pip) progressPips.append(pip);
    });

    const highScores = openingTrack?.querySelector('[data-opening-high-scores]');
    if (highScores) openingTrack.append(highScores);
  };

  reorderGames();

  const opening = document.querySelector('[data-arcade-opening]');
  const openingSoundButton = opening?.querySelector('[data-sound-toggle]');
  const openingItems = [...(opening?.querySelectorAll('[data-opening-game], [data-opening-high-scores]') || [])];
  const openingGameButtons = openingItems.filter((item) => item.matches('[data-opening-game]'));
  const highScoresButton = opening?.querySelector('[data-opening-high-scores]');
  const highScoresDialog = document.querySelector('#high-scores-dialog');
  const highScoresCloseButtons = [...(highScoresDialog?.querySelectorAll('[data-high-scores-close]') || [])];
  const openingSelectorTrack = opening?.querySelector('[data-opening-selector-track]');
  const openingSelectorPrev = opening?.querySelector('[data-opening-selector-prev]');
  const openingSelectorNext = opening?.querySelector('[data-opening-selector-next]');
  const skipLink = document.querySelector('[data-arcade-skip]');
  const selector = document.querySelector('.ux-arcade');
  const selectorTitle = document.querySelector('#arcade-title');
  const selectionMusic = document.querySelector('[data-arcade-selection-music]');
  const framework = window.UXArcade;

  if (!opening || !openingItems.length || !selector || !framework) return;

  const reducedMotion = framework.isReducedMotion;
  const animatedItems = [...opening.querySelectorAll(
    '.arcade-opening-summary, .arcade-opening-prompt, .arcade-opening h1, .arcade-pixel-burst i, .arcade-opening-selector'
  )];
  let introStarted = opening.dataset.introHeard === 'true';
  let introFinished = introStarted;
  let musicFadeFrame = null;

  if (selectionMusic) {
    selectionMusic.volume = 0.25;
    selectionMusic.loop = true;
  }

  const isOpeningVisible = () => !opening.hidden && document.body.classList.contains('arcade-intro-active');

  const stopMusic = (reset = false) => {
    if (!selectionMusic) return;
    window.cancelAnimationFrame(musicFadeFrame);
    selectionMusic.pause();
    selectionMusic.volume = 0.25;
    if (reset) selectionMusic.currentTime = 0;
  };

  const playMusic = () => {
    if (!selectionMusic || !introFinished || !framework.isSoundEnabled() || !isOpeningVisible() || document.hidden) return;
    selectionMusic.volume = 0.25;
    const playRequest = selectionMusic.play();
    playRequest?.catch(() => {
      // Safari and other browsers may wait for the visitor's first interaction.
    });
  };

  const fadeMusic = () => {
    if (!selectionMusic || selectionMusic.paused) return;
    window.cancelAnimationFrame(musicFadeFrame);
    const startedAt = performance.now();
    const startingVolume = selectionMusic.volume;
    const fade = (now) => {
      const progress = Math.min(1, (now - startedAt) / 180);
      selectionMusic.volume = startingVolume * (1 - progress);
      if (progress < 1) musicFadeFrame = window.requestAnimationFrame(fade);
      else stopMusic(false);
    };
    musicFadeFrame = window.requestAnimationFrame(fade);
  };

  const beginIntroSequence = () => {
    if (introStarted || !framework.isSoundEnabled() || document.hidden || !isOpeningVisible()) return;
    const explosion = framework.playIntroTheme();
    if (!explosion) return;
    introStarted = true;
    opening.dataset.introHeard = 'true';
    explosion.addEventListener('ended', () => {
      introFinished = true;
      playMusic();
    }, { once: true });
  };

  const unlockIntendedAudio = () => {
    framework.unlockAudio?.();
    if (!introStarted) beginIntroSequence();
    else if (introFinished) playMusic();
  };

  selector.inert = true;
  selector.setAttribute('aria-hidden', 'true');
  openingItems.forEach((button) => { button.disabled = !reducedMotion; });

  const revealStart = () => {
    openingItems.forEach((button) => { button.disabled = false; });
  };

  window.setTimeout(revealStart, reducedMotion ? 0 : 1650);

  const replayOpening = () => {
    if (reducedMotion) return;
    animatedItems.forEach((item) => { item.style.animation = 'none'; });
    void opening.offsetWidth;
    animatedItems.forEach((item) => { item.style.animation = ''; });
    openingItems.forEach((button) => { button.disabled = true; });
    window.setTimeout(revealStart, 1650);
  };

  openingSoundButton?.addEventListener('click', () => {
    if (!framework.isSoundEnabled()) return;
    replayOpening();
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
    fadeMusic();
    framework.playSound('success');
    leaveOpening(() => {
      document.querySelector(`[data-open-game="${gameId}"]`)?.click();
    });
  };

  const returnToOpening = () => {
    opening.hidden = false;
    opening.classList.remove('is-leaving');
    document.body.classList.add('arcade-intro-active');
    selector.inert = true;
    selector.setAttribute('aria-hidden', 'true');
    if (skipLink) {
      skipLink.href = '#arcade-opening-selector';
      skipLink.textContent = 'Skip to game selector';
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    window.requestAnimationFrame(() => openingGameButtons[0]?.focus({ preventScroll: true }));
    window.requestAnimationFrame(playMusic);
  };

  document.addEventListener('uxarcade:return-home', returnToOpening);
  document.addEventListener('uxarcade:soundchange', (event) => {
    if (!event.detail?.enabled) {
      stopMusic(false);
      return;
    }
    if (introFinished) playMusic();
    else beginIntroSequence();
  });
  document.addEventListener('pointerdown', unlockIntendedAudio, { passive: true });
  document.addEventListener('keydown', unlockIntendedAudio);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-game]')) fadeMusic();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic(false);
    else if (isOpeningVisible()) {
      if (introFinished) playMusic();
      else beginIntroSequence();
    }
  });
  window.addEventListener('pagehide', () => stopMusic(true));

  openingGameButtons.forEach((button) => {
    button.addEventListener('click', () => openSelectedGame(button.dataset.openingGame));
  });

  const closeHighScores = () => {
    if (!highScoresDialog?.open) return;
    highScoresDialog.close();
  };

  highScoresButton?.addEventListener('click', () => {
    framework.playSound('select');
    if (!highScoresDialog) return;
    if (typeof highScoresDialog.showModal === 'function') highScoresDialog.showModal();
    else highScoresDialog.setAttribute('open', '');
    document.body.classList.add('high-scores-open');
    window.requestAnimationFrame(() => highScoresCloseButtons[0]?.focus({ preventScroll: true }));
  });

  highScoresCloseButtons.forEach((button) => button.addEventListener('click', closeHighScores));
  highScoresDialog?.addEventListener('close', () => {
    document.body.classList.remove('high-scores-open');
    if (isOpeningVisible()) highScoresButton?.focus({ preventScroll: true });
  });

  const moveSelector = (direction) => {
    const firstCard = openingItems[0];
    if (!openingSelectorTrack || !firstCard) return;
    framework.playSound('select');
    openingSelectorTrack.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + 12),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  openingSelectorPrev?.addEventListener('click', () => moveSelector(-1));
  openingSelectorNext?.addEventListener('click', () => moveSelector(1));
  openingSelectorTrack?.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveSelector(event.key === 'ArrowLeft' ? -1 : 1);
  });

  beginIntroSequence();
})();
