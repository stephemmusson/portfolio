(() => {
  const dialog = document.querySelector('#arcade-dialog');
  const playfield = document.querySelector('#panic-playfield');

  if (!dialog || !playfield) return;

  const gameIds = ['popup-panic', 'contrast-crash', 'mega-menu-mayhem', 'scope-invaders', 'captcha-boss'];
  const progressKey = 'stephen-musson-ux-arcade-v1';
  const soundKey = 'stephen-musson-ux-arcade-sound';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const screens = [...dialog.querySelectorAll('[data-arcade-screen]')];
  const pausePanel = dialog.querySelector('[data-pause-panel]');
  const liveStatus = dialog.querySelector('#panic-live-status');
  const scoreOutput = dialog.querySelector('#panic-score');
  const openOutput = dialog.querySelector('#panic-cleared');
  const timeOutput = dialog.querySelector('#panic-time');
  const paceOutput = dialog.querySelector('#panic-pace');
  const paceText = dialog.querySelector('#panic-pace-text');
  const resultKicker = dialog.querySelector('#panic-result-kicker');
  const resultTitle = dialog.querySelector('#panic-result-title');
  const resultCopy = dialog.querySelector('#panic-result-copy');
  const finalScoreOutput = dialog.querySelector('#panic-final-score');
  const bestScoreOutput = dialog.querySelector('#panic-best-score');
  const finalClearedOutput = dialog.querySelector('#panic-final-cleared');
  const startButton = dialog.querySelector('[data-start-game]');
  const pauseButton = dialog.querySelector('[data-pause-game]');
  const resumeButton = dialog.querySelector('[data-resume-game]');
  const arcadeTitle = document.querySelector('#arcade-title');
  const featuredCard = document.querySelector('[data-game-card="popup-panic"]');
  const roundDuration = 20000;

  let memoryProgress = {};
  let progress = readProgress();
  let soundEnabled = readSoundPreference();
  let audioContext;
  let returnFocusTarget;
  let popupSequence = 0;

  const game = {
    status: 'idle',
    closed: 0,
    elapsed: 0,
    startedAt: 0,
    frame: null,
    spawnTimer: null
  };

  const popupTemplates = [
    ['Cookie preferences', 'Before you read anything'],
    ['Live chat', 'Hello. Immediately.'],
    ['Newsletter', 'Stay in a loop you did not request'],
    ['Feedback', 'You have been here for four seconds'],
    ['App promotion', 'This would be better somewhere else'],
    ['Notifications', 'Never miss another interruption'],
    ['Special offer', 'Wait. One more thing.'],
    ['Quick survey', 'Only seventeen questions']
  ];

  function readProgress() {
    let stored;
    try {
      stored = window.localStorage.getItem(progressKey);
    } catch (error) {
      stored = null;
    }
    if (!stored) {
      try {
        stored = window.sessionStorage.getItem(progressKey);
      } catch (error) {
        stored = null;
      }
    }
    try {
      const parsed = stored ? JSON.parse(stored) : memoryProgress;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return memoryProgress;
    }
  }

  function writeProgress() {
    memoryProgress = { ...progress };
    const serialised = JSON.stringify(progress);
    let savedLocally = false;
    try {
      window.localStorage.setItem(progressKey, serialised);
      savedLocally = true;
    } catch (error) {
      savedLocally = false;
    }
    if (!savedLocally) {
      try {
        window.sessionStorage.setItem(progressKey, serialised);
      } catch (error) {
        // In-memory progress remains available for this page session.
      }
    }
  }

  function readSoundPreference() {
    try {
      return window.sessionStorage.getItem(soundKey) === 'on';
    } catch (error) {
      return false;
    }
  }

  function writeSoundPreference() {
    try {
      window.sessionStorage.setItem(soundKey, soundEnabled ? 'on' : 'off');
    } catch (error) {
      // The current in-memory preference still applies.
    }
  }

  function updateProgressDisplay() {
    const playedCount = gameIds.filter((id) => progress[id]?.played).length;
    const progressText = document.querySelector('#arcade-progress-text');
    if (progressText) progressText.textContent = `${playedCount} of 5 games played`;

    document.querySelectorAll('[data-progress-game]').forEach((pip) => {
      pip.classList.toggle('is-played', Boolean(progress[pip.dataset.progressGame]?.played));
    });

    document.querySelectorAll('[data-game-card]').forEach((card) => {
      const gameProgress = progress[card.dataset.gameCard];
      const bestRow = card.querySelector('[data-game-best]');
      const bestScore = card.querySelector('[data-game-best-score]');
      const completedBadge = card.querySelector('[data-completed-badge]');
      if (bestRow && bestScore) {
        bestRow.hidden = !gameProgress?.played;
        if (gameProgress?.played) bestScore.textContent = formatScore(gameProgress.best || 0);
      }
      if (completedBadge) completedBadge.hidden = !gameProgress?.completed;
    });
  }

  function saveGameProgress(gameId, score, completed) {
    const existing = progress[gameId] || {};
    progress[gameId] = {
      played: true,
      completed: Boolean(existing.completed || completed),
      best: Math.max(existing.best || 0, score)
    };
    writeProgress();
    updateProgressDisplay();
    return { ...progress[gameId] };
  }

  function updateSoundButtons() {
    document.querySelectorAll('[data-sound-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(soundEnabled));
      button.setAttribute('aria-label', soundEnabled ? 'Sound is on. Turn sound off.' : 'Sound is off. Turn sound on.');
      const label = button.querySelector('[data-sound-label]');
      if (label) label.textContent = `Sound: ${soundEnabled ? 'on' : 'off'}`;
    });
  }

  function setSound(nextValue) {
    soundEnabled = nextValue;
    writeSoundPreference();
    updateSoundButtons();
    if (soundEnabled) playSound('select');
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContext ||= new AudioContext();
      if (audioContext.state === 'suspended') audioContext.resume();
      const settings = {
        select: { frequency: 420, duration: 0.06, volume: 0.035 },
        open: { frequency: 260, duration: 0.05, volume: 0.025 },
        good: { frequency: 690, duration: 0.09, volume: 0.04 },
        bad: { frequency: 145, duration: 0.13, volume: 0.045 },
        success: { frequency: 840, duration: 0.22, volume: 0.045 },
        fail: { frequency: 110, duration: 0.28, volume: 0.04 }
      };
      const selected = settings[type] || settings.select;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(selected.frequency, now);
      if (type === 'success') oscillator.frequency.exponentialRampToValueAtTime(1180, now + selected.duration);
      if (type === 'fail') oscillator.frequency.exponentialRampToValueAtTime(70, now + selected.duration);
      gain.gain.setValueAtTime(selected.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + selected.duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + selected.duration);
    } catch (error) {
      // Sound is optional. Gameplay remains unaffected.
    }
  }

  function playIntroTheme() {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContext ||= new AudioContext();
      if (audioContext.state === 'suspended') audioContext.resume();
      const startAt = audioContext.currentTime + 0.02;
      const notes = [196, 262, 330, 392, 330, 523, 659, 784];

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const noteStart = startAt + (index * 0.105);
        oscillator.type = index < 5 ? 'square' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.038, noteStart + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.09);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.095);
      });

      const impactAt = startAt + 0.86;
      const impact = audioContext.createOscillator();
      const impactGain = audioContext.createGain();
      impact.type = 'square';
      impact.frequency.setValueAtTime(180, impactAt);
      impact.frequency.exponentialRampToValueAtTime(42, impactAt + 0.28);
      impactGain.gain.setValueAtTime(0.055, impactAt);
      impactGain.gain.exponentialRampToValueAtTime(0.0001, impactAt + 0.3);
      impact.connect(impactGain);
      impactGain.connect(audioContext.destination);
      impact.start(impactAt);
      impact.stop(impactAt + 0.31);
    } catch (error) {
      // The intro remains fully usable without sound.
    }
  }

  function exitArcade() {
    window.location.assign('/');
  }

  function formatScore(value) {
    return String(Math.max(0, Math.round(value))).padStart(4, '0');
  }

  window.UXArcade = {
    formatScore,
    getGameProgress(gameId) {
      return progress[gameId] ? { ...progress[gameId] } : {};
    },
    isReducedMotion: reducedMotion,
    isSoundEnabled() {
      return soundEnabled;
    },
    exitArcade,
    playIntroTheme,
    playSound,
    saveGameProgress,
    updateProgressDisplay
  };

  function switchScreen(name) {
    const labels = { instructions: 'arcade-screen-title', playing: 'playing-title', result: 'panic-result-title' };
    screens.forEach((screen) => {
      screen.hidden = screen.dataset.arcadeScreen !== name;
    });
    dialog.setAttribute('aria-labelledby', labels[name]);
  }

  function openArcade(trigger) {
    returnFocusTarget = trigger;
    resetGame();
    switchScreen('instructions');
    document.body.classList.add('arcade-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.requestAnimationFrame(() => startButton?.focus());
    playSound('open');
  }

  function closeArcade(focusCards = false) {
    resetGame();
    document.body.classList.remove('arcade-open');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    window.requestAnimationFrame(() => {
      if (focusCards && arcadeTitle) {
        arcadeTitle.setAttribute('tabindex', '-1');
        arcadeTitle.focus({ preventScroll: true });
        featuredCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) {
        returnFocusTarget.focus({ preventScroll: true });
      }
    });
  }

  function clearTimers() {
    window.cancelAnimationFrame(game.frame);
    window.clearTimeout(game.spawnTimer);
    game.frame = null;
    game.spawnTimer = null;
  }

  function resetGame() {
    clearTimers();
    game.status = 'idle';
    game.closed = 0;
    game.elapsed = 0;
    game.startedAt = 0;
    popupSequence = 0;
    playfield.querySelectorAll('.panic-popup').forEach((popup) => popup.remove());
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    updateHud(0);
  }

  function startGame() {
    resetGame();
    switchScreen('playing');
    game.status = 'running';
    game.startedAt = performance.now();
    spawnPopup();
    scheduleSpawn();
    game.frame = window.requestAnimationFrame(runFrame);
    announce('Twenty seconds. Close as many pop-ups as you can.');
    playSound('select');
    window.requestAnimationFrame(() => playfield.querySelector('.panic-popup-close')?.focus());
  }

  function runFrame(now) {
    if (game.status !== 'running') return;
    const elapsed = game.elapsed + (now - game.startedAt);
    updateHud(elapsed);
    if (elapsed >= roundDuration) {
      finishGame();
      return;
    }
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function scheduleSpawn() {
    window.clearTimeout(game.spawnTimer);
    if (game.status !== 'running') return;
    const progressRatio = Math.min(1, getElapsed() / roundDuration);
    const delay = Math.max(260, 940 - (progressRatio * 520) - Math.min(140, game.closed * 7));
    game.spawnTimer = window.setTimeout(() => {
      if (game.status !== 'running') return;
      spawnPopup();
      if (progressRatio > 0.72 && Math.random() > 0.72) {
        window.setTimeout(() => {
          if (game.status === 'running') spawnPopup();
        }, 90);
      }
      scheduleSpawn();
    }, delay);
  }

  function spawnPopup() {
    if (game.status !== 'running') return;
    const [kickerText, titleText] = popupTemplates[popupSequence % popupTemplates.length];
    const progressRatio = Math.min(1, getElapsed() / roundDuration);
    popupSequence += 1;
    const popup = document.createElement('article');
    const heading = document.createElement('h3');
    const kicker = document.createElement('span');
    const body = document.createElement('p');
    const close = document.createElement('button');
    const popupId = `panic-popup-${popupSequence}`;
    popup.className = 'panic-popup panic-popup-v2';
    if (progressRatio > 0.42 && popupSequence % 4 === 0) popup.classList.add('close-left');
    if (progressRatio > 0.68 && popupSequence % 5 === 0) popup.classList.add('close-low');
    if (popupSequence % 3 === 0) popup.classList.add('is-compact');
    popup.id = popupId;
    popup.setAttribute('aria-labelledby', `${popupId}-title`);
    popup.style.zIndex = String(3 + popupSequence);
    kicker.className = 'panic-popup-kicker';
    kicker.textContent = kickerText;
    heading.id = `${popupId}-title`;
    heading.textContent = titleText;
    body.textContent = 'This message is more urgent than whatever you were doing.';
    close.type = 'button';
    close.className = 'panic-popup-close';
    close.setAttribute('aria-label', `Close ${kickerText.toLowerCase()} pop-up`);
    close.textContent = '×';
    close.addEventListener('click', () => closePopup(popup, close));
    popup.append(kicker, heading, body, close);
    playfield.append(popup);
    positionPopup(popup);
    updateHud(getElapsed());
    playSound('open');
  }

  function positionPopup(popup) {
    const edge = playfield.clientWidth < 520 ? 6 : 14;
    const maxLeft = Math.max(edge, playfield.clientWidth - popup.offsetWidth - edge);
    const maxTop = Math.max(edge, playfield.clientHeight - popup.offsetHeight - edge);
    popup.style.left = `${Math.round(edge + (Math.random() * Math.max(0, maxLeft - edge)))}px`;
    popup.style.top = `${Math.round(edge + (Math.random() * Math.max(0, maxTop - edge)))}px`;
  }

  function closePopup(popup, closeButton) {
    if (game.status !== 'running' || !popup.isConnected) return;
    const moveFocus = document.activeElement === closeButton && closeButton.matches(':focus-visible');
    popup.remove();
    game.closed += 1;
    updateHud(getElapsed());
    playSound('good');
    announce(`${game.closed} pop-up${game.closed === 1 ? '' : 's'} closed.`);
    if (!playfield.querySelector('.panic-popup')) spawnPopup();
    if (moveFocus) {
      window.requestAnimationFrame(() => {
        const buttons = [...playfield.querySelectorAll('.panic-popup-close')];
        buttons.at(-1)?.focus({ preventScroll: true });
      });
    }
  }

  function getElapsed() {
    return game.status === 'running' ? game.elapsed + (performance.now() - game.startedAt) : game.elapsed;
  }

  function updateHud(elapsed = getElapsed()) {
    const remaining = Math.max(0, roundDuration - elapsed);
    const progressRatio = Math.min(1, elapsed / roundDuration);
    scoreOutput.textContent = formatScore(game.closed);
    openOutput.textContent = String(playfield.querySelectorAll('.panic-popup').length);
    timeOutput.textContent = String(Math.ceil(remaining / 1000));
    paceOutput.value = progressRatio * 100;
    paceOutput.textContent = `${Math.round(progressRatio * 100)}% complete`;
    paceText.textContent = progressRatio < 0.34 ? 'Steady' : progressRatio < 0.68 ? 'Busy' : 'Relentless';
  }

  function pauseGame() {
    if (game.status !== 'running') return;
    game.elapsed = getElapsed();
    clearTimers();
    game.status = 'paused';
    pausePanel.hidden = false;
    playfield.querySelectorAll('.panic-popup-close').forEach((button) => { button.inert = true; });
    announce('Game paused.');
    window.requestAnimationFrame(() => resumeButton?.focus());
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = 'running';
    game.startedAt = performance.now();
    pausePanel.hidden = true;
    playfield.querySelectorAll('.panic-popup-close').forEach((button) => { button.inert = false; });
    scheduleSpawn();
    game.frame = window.requestAnimationFrame(runFrame);
    announce('Game resumed.');
    window.requestAnimationFrame(() => playfield.querySelector('.panic-popup-close')?.focus());
  }

  function finishGame() {
    if (game.status !== 'running') return;
    game.elapsed = roundDuration;
    clearTimers();
    game.status = 'ended';
    const savedProgress = saveGameProgress('popup-panic', game.closed, true);
    resultKicker.textContent = '20 seconds complete';
    if (game.closed >= 24) {
      resultTitle.textContent = 'Nothing stayed open for long.';
      resultCopy.textContent = 'You cleared the interruptions at an alarming pace. The page still should not have asked.';
    } else if (game.closed >= 14) {
      resultTitle.textContent = 'A brief moment of calm.';
      resultCopy.textContent = 'You removed the interruptions. The page should never have made that a competitive skill.';
    } else {
      resultTitle.textContent = 'The pop-ups kept coming.';
      resultCopy.textContent = 'That was the point. Every interruption competed with the task the visitor actually came to complete.';
    }
    finalScoreOutput.textContent = formatScore(game.closed);
    bestScoreOutput.textContent = formatScore(savedProgress.best);
    finalClearedOutput.textContent = String(game.closed);
    switchScreen('result');
    playSound('success');
    window.requestAnimationFrame(() => {
      resultTitle.setAttribute('tabindex', '-1');
      resultTitle.focus();
      resultTitle.addEventListener('blur', () => resultTitle.removeAttribute('tabindex'), { once: true });
    });
  }

  function announce(message) {
    liveStatus.textContent = '';
    window.requestAnimationFrame(() => { liveStatus.textContent = message; });
  }

  document.querySelectorAll('[data-open-game="popup-panic"]').forEach((button) => {
    button.addEventListener('click', () => openArcade(button));
  });
  document.querySelectorAll('[data-sound-toggle]').forEach((button) => {
    button.addEventListener('click', () => setSound(!soundEnabled));
  });
  dialog.querySelectorAll('[data-exit-game]').forEach((button) => {
    button.addEventListener('click', exitArcade);
  });
  startButton?.addEventListener('click', startGame);
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-choose-game]')?.addEventListener('click', () => closeArcade(true));

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (game.status === 'running') pauseGame();
    else closeArcade(false);
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('arcade-open');
    resetGame();
  });
  document.addEventListener('keydown', (event) => {
    if (!dialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() !== 'p') return;
    if (game.status === 'running') {
      event.preventDefault();
      pauseGame();
    } else if (game.status === 'paused') {
      event.preventDefault();
      resumeGame();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && game.status === 'running') pauseGame();
  });
  window.addEventListener('resize', () => {
    if (game.status !== 'running' && game.status !== 'paused') return;
    playfield.querySelectorAll('.panic-popup').forEach((popup) => positionPopup(popup));
  });

  updateSoundButtons();
  updateProgressDisplay();
})();
