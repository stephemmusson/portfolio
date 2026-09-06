(() => {
  const dialog = document.querySelector('#contrast-dialog');
  const framework = window.UXArcade;
  if (!dialog || !framework) return;

  const screens = [...dialog.querySelectorAll('[data-contrast-screen]')];
  const startButton = dialog.querySelector('[data-contrast-start]');
  const pauseButton = dialog.querySelector('[data-contrast-pause]');
  const resumeButton = dialog.querySelector('[data-contrast-resume]');
  const pausePanel = dialog.querySelector('[data-contrast-pause-panel]');
  const playfield = dialog.querySelector('#contrast-playfield');
  const targetZone = dialog.querySelector('#contrast-target-zone');
  const targetLayer = dialog.querySelector('#contrast-target-layer');
  const crosshair = dialog.querySelector('#contrast-crosshair');
  const shotFlash = dialog.querySelector('#contrast-shot-flash');
  const phaseOutput = dialog.querySelector('#contrast-phase');
  const scoreOutput = dialog.querySelector('#contrast-score');
  const hitsOutput = dialog.querySelector('#contrast-round');
  const streakOutput = dialog.querySelector('#contrast-streak');
  const timeOutput = dialog.querySelector('#contrast-time');
  const timerOutput = dialog.querySelector('#contrast-timer');
  const liveStatus = dialog.querySelector('#contrast-live-status');
  const ratioOutput = dialog.querySelector('#contrast-ratio');
  const contrastBadge = dialog.querySelector('#contrast-wcag-badge');
  const feedbackOutput = dialog.querySelector('#contrast-micro-feedback');
  const resultTitle = dialog.querySelector('#contrast-result-title');
  const resultCopy = dialog.querySelector('#contrast-result-copy');
  const finalScore = dialog.querySelector('#contrast-final-score');
  const bestScore = dialog.querySelector('#contrast-best-score');
  const finalHits = dialog.querySelector('#contrast-final-matched');
  const arcadeTitle = document.querySelector('#arcade-title');
  const contrastCard = document.querySelector('[data-game-card="contrast-crash"]');
  const reducedMotion = framework.isReducedMotion;

  const SESSION_DURATION = 30000;
  const AIM_SPEED = 330;

  const targetTiers = [
    { name: 'Clear', size: 76, mix: 0.88, points: 50 },
    { name: 'Compact', size: 60, mix: 0.58, points: 110 },
    { name: 'Faint', size: 46, mix: 0.3, points: 220 },
    { name: 'Tiny', size: 34, mix: 0.15, points: 360 },
    { name: 'Vanishing', size: 24, mix: 0.065, points: 550 }
  ].map((tier, index) => ({ ...tier, index }));

  const targetSurfaces = [
    { name: 'navigation', x: [0.03, 0.97], y: [0.035, 0.155], background: '#5d67f6' },
    { name: 'hero panel', x: [0.035, 0.62], y: [0.2, 0.62], background: '#f2ff3d' },
    { name: 'sale panel', x: [0.655, 0.97], y: [0.2, 0.43], background: '#ff70ad' },
    { name: 'news card', x: [0.035, 0.305], y: [0.68, 0.95], background: '#61c4ff' },
    { name: 'popular card', x: [0.335, 0.625], y: [0.68, 0.95], background: '#71d8a3' },
    { name: 'sign-up card', x: [0.655, 0.97], y: [0.49, 0.95], background: '#ff755f' }
  ];

  const game = {
    status: 'idle', score: 0, hits: 0, streak: 0, shots: 0,
    elapsed: 0, startedAt: 0, lastFrame: 0, lastShotAt: 0,
    spawnAccumulator: 0, frame: null, targets: [],
    aimX: 0, aimY: 0, sequence: 0
  };
  const controls = { left: false, right: false, up: false, down: false };
  let returnFocusTarget;

  function switchScreen(name) {
    const labels = { instructions: 'contrast-screen-title', playing: 'contrast-playing-title', result: 'contrast-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.contrastScreen !== name; });
    dialog.setAttribute('aria-labelledby', labels[name]);
  }

  function openGame(trigger) {
    returnFocusTarget = trigger;
    resetGame();
    switchScreen('instructions');
    document.body.classList.add('arcade-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.requestAnimationFrame(() => startButton?.focus());
    framework.playSound('open');
  }

  function closeGame(focusCards = false) {
    resetGame();
    document.body.classList.remove('arcade-open');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    window.requestAnimationFrame(() => {
      if (focusCards && arcadeTitle) {
        arcadeTitle.setAttribute('tabindex', '-1');
        arcadeTitle.focus({ preventScroll: true });
        contrastCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) {
        returnFocusTarget.focus({ preventScroll: true });
      }
    });
  }

  function resetGame() {
    window.cancelAnimationFrame(game.frame);
    clearControls();
    targetLayer.replaceChildren();
    Object.assign(game, {
      status: 'idle', score: 0, hits: 0, streak: 0, shots: 0,
      elapsed: 0, startedAt: 0, lastFrame: 0, lastShotAt: 0,
      spawnAccumulator: 0, frame: null, targets: [], aimX: 0, aimY: 0, sequence: 0
    });
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    targetZone.inert = false;
    targetZone.setAttribute('tabindex', '0');
    phaseOutput.textContent = 'Clear targets';
    ratioOutput.textContent = 'Not yet';
    contrastBadge.textContent = 'UI contrast: waiting';
    contrastBadge.classList.remove('is-fail');
    feedbackOutput.textContent = 'Aim for a target.';
    feedbackOutput.className = 'contrast-micro-feedback';
    updateHud(0);
  }

  function startGame() {
    resetGame();
    switchScreen('playing');
    game.status = 'playing';
    game.startedAt = performance.now();
    game.lastFrame = game.startedAt;
    setAimToCentre();
    spawnTarget(0);
    spawnTarget(0);
    targetZone.focus({ preventScroll: true });
    framework.playSound('select');
    announce('Thirty seconds. Large clear targets score less. Small low-contrast targets score more.');
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function runFrame(now) {
    if (game.status !== 'playing') return;
    const elapsed = getElapsed(now);
    const progress = Math.min(1, elapsed / SESSION_DURATION);
    updateHud(elapsed);
    if (elapsed >= SESSION_DURATION) {
      finishGame();
      return;
    }

    const delta = Math.min(0.05, Math.max(0, (now - game.lastFrame) / 1000));
    game.lastFrame = now;
    updateAim(delta);
    updateTargets(delta);

    const spawnInterval = 760 - (progress * 430);
    const targetLimit = progress < 0.28 ? 4 : progress < 0.68 ? 5 : 6;
    game.spawnAccumulator += delta * 1000;
    if (game.spawnAccumulator >= spawnInterval && game.targets.length < targetLimit) {
      game.spawnAccumulator = 0;
      spawnTarget(progress);
    }
    phaseOutput.textContent = progress < 0.34 ? 'Clear targets' : progress < 0.7 ? 'Contrast falling' : 'Small and vanishing';
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function spawnTarget(progress) {
    if (game.status !== 'playing') return;
    const tierBase = chooseTier(progress);
    const surface = targetSurfaces[Math.floor(Math.random() * targetSurfaces.length)];
    const source = chooseContrastSource(surface.background);
    const colour = mixColours(surface.background, source, tierBase.mix);
    const tier = {
      ...tierBase,
      colour,
      ratio: getContrastRatio(surface.background, colour),
      surface: surface.name
    };
    const zoneWidth = Math.max(280, targetZone.clientWidth);
    const zoneHeight = Math.max(220, targetZone.clientHeight);
    const margin = (tier.size / 2) + 10;
    const minX = Math.max(margin, (zoneWidth * surface.x[0]) + margin);
    const maxX = Math.min(zoneWidth - margin, (zoneWidth * surface.x[1]) - margin);
    const minY = Math.max(margin, (zoneHeight * surface.y[0]) + margin);
    const maxY = Math.min(zoneHeight - margin, (zoneHeight * surface.y[1]) - margin);
    let x = minX;
    let y = minY;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      x = minX + (Math.random() * Math.max(1, maxX - minX));
      y = minY + (Math.random() * Math.max(1, maxY - minY));
      const clear = game.targets.every((target) => Math.hypot(target.x - x, target.y - y) > ((target.size + tier.size) / 2) + 16);
      if (clear) break;
    }

    const element = document.createElement('i');
    const value = document.createElement('span');
    game.sequence += 1;
    element.className = `contrast-range-target is-tier-${tier.index}`;
    element.style.width = `${tier.size}px`;
    element.style.height = `${tier.size}px`;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.setProperty('--target-colour', tier.colour);
    value.textContent = `×${Math.round(tier.points / 50)}`;
    element.append(value);
    targetLayer.append(element);

    const lifetime = Math.max(560, 1750 - (progress * 930) - (tier.index * 70));
    game.targets.push({ id: game.sequence, element, tier, x, y, size: tier.size, age: 0, lifetime });
    if (tier.points >= 220 || game.targets.length === 1) {
      announce(`${tier.name} target in the ${surface.name}, ${describePosition(x, y, zoneWidth, zoneHeight)}, worth ${tier.points} points.`);
    }
    framework.playSound('open');
  }

  function chooseTier(progress) {
    let pool;
    if (progress < 0.2) pool = [0, 0, 0, 1, 1, 2];
    else if (progress < 0.48) pool = [0, 1, 1, 2, 2, 3];
    else if (progress < 0.75) pool = [1, 2, 2, 3, 3, 4];
    else pool = [1, 2, 3, 3, 4, 4];
    return targetTiers[pool[Math.floor(Math.random() * pool.length)]];
  }

  function chooseContrastSource(background) {
    return getContrastRatio(background, '#111111') >= getContrastRatio(background, '#ffffff') ? '#111111' : '#ffffff';
  }

  function updateTargets(delta) {
    let targetExpired = false;
    for (const target of [...game.targets]) {
      target.age += delta * 1000;
      target.element.style.setProperty('--target-life', String(Math.max(0, 1 - (target.age / target.lifetime))));
      if (target.age < target.lifetime) continue;
      removeTarget(target);
      targetExpired = true;
    }
    if (targetExpired) {
      game.streak = 0;
      feedbackOutput.textContent = 'A target disappeared into the interface.';
      feedbackOutput.className = 'contrast-micro-feedback is-bad';
    }
    if (!game.targets.length) spawnTarget(Math.min(1, getElapsed() / SESSION_DURATION));
  }

  function fireAt(x, y) {
    if (game.status !== 'playing') return;
    const now = performance.now();
    if (now - game.lastShotAt < 140) return;
    game.lastShotAt = now;
    game.shots += 1;
    game.aimX = Math.max(0, Math.min(targetZone.clientWidth, x));
    game.aimY = Math.max(0, Math.min(targetZone.clientHeight, y));
    renderAim();
    showShot(game.aimX, game.aimY);

    const hit = [...game.targets].reverse().find((target) => (
      Math.abs(game.aimX - target.x) <= target.size / 2
      && Math.abs(game.aimY - target.y) <= target.size / 2
    ));
    if (!hit) {
      game.streak = 0;
      feedbackOutput.textContent = 'Miss. No points lost.';
      feedbackOutput.className = 'contrast-micro-feedback is-bad';
      framework.playSound('bad');
      announce('Miss. The difficult target remains an interface problem, not a personal failure.');
      updateHud(getElapsed());
      return;
    }

    removeTarget(hit);
    game.hits += 1;
    game.streak += 1;
    const streakBonus = Math.min(150, Math.max(0, game.streak - 1) * 15);
    const points = hit.tier.points + streakBonus;
    game.score += points;
    const passes = hit.tier.ratio >= 3;
    ratioOutput.textContent = `${hit.tier.ratio.toFixed(2)}:1`;
    contrastBadge.textContent = `UI contrast: ${passes ? 'pass' : 'fail'}`;
    contrastBadge.classList.toggle('is-fail', !passes);
    feedbackOutput.textContent = `${hit.tier.name} target hit. +${points} points.`;
    feedbackOutput.className = 'contrast-micro-feedback is-good';
    framework.playSound('good');
    announce(`${hit.tier.name} target hit. ${hit.tier.ratio.toFixed(2)} to 1 contrast. ${points} points.`);
    updateHud(getElapsed());
    if (game.targets.length < 2) spawnTarget(Math.min(1, getElapsed() / SESSION_DURATION));
  }

  function removeTarget(target) {
    target.element.remove();
    game.targets = game.targets.filter((item) => item !== target);
  }

  function showShot(x, y) {
    shotFlash.style.left = `${x}px`;
    shotFlash.style.top = `${y}px`;
    shotFlash.classList.remove('is-fired');
    void shotFlash.offsetWidth;
    shotFlash.classList.add('is-fired');
  }

  function updateAim(delta) {
    const horizontal = Number(controls.right) - Number(controls.left);
    const vertical = Number(controls.down) - Number(controls.up);
    if (horizontal || vertical) {
      game.aimX += horizontal * AIM_SPEED * delta;
      game.aimY += vertical * AIM_SPEED * delta;
      clampAim();
      renderAim();
    }
  }

  function setAimToCentre() {
    game.aimX = targetZone.clientWidth / 2;
    game.aimY = targetZone.clientHeight / 2;
    renderAim();
  }

  function setAimFromPointer(event) {
    const rect = targetZone.getBoundingClientRect();
    game.aimX = event.clientX - rect.left;
    game.aimY = event.clientY - rect.top;
    clampAim();
    renderAim();
  }

  function clampAim() {
    game.aimX = Math.max(0, Math.min(targetZone.clientWidth, game.aimX));
    game.aimY = Math.max(0, Math.min(targetZone.clientHeight, game.aimY));
  }

  function renderAim() {
    crosshair.style.transform = `translate(${game.aimX}px, ${game.aimY}px) translate(-50%, -50%)`;
  }

  function getElapsed(now = performance.now()) {
    return game.status === 'playing' ? game.elapsed + (now - game.startedAt) : game.elapsed;
  }

  function updateHud(elapsed) {
    const remaining = Math.max(0, SESSION_DURATION - elapsed);
    scoreOutput.textContent = framework.formatScore(game.score);
    hitsOutput.textContent = String(game.hits);
    streakOutput.textContent = String(game.streak);
    timeOutput.textContent = `${Math.ceil(remaining / 1000)}s`;
    timerOutput.max = SESSION_DURATION;
    timerOutput.value = remaining;
    timerOutput.textContent = `${Math.ceil(remaining / 1000)} seconds remaining`;
  }

  function clearControls() {
    Object.keys(controls).forEach((key) => { controls[key] = false; });
  }

  function pauseGame() {
    if (game.status !== 'playing') return;
    game.elapsed = getElapsed();
    window.cancelAnimationFrame(game.frame);
    game.frame = null;
    clearControls();
    game.status = 'paused';
    targetZone.inert = true;
    targetZone.setAttribute('tabindex', '-1');
    pausePanel.hidden = false;
    announce('Game paused.');
    window.requestAnimationFrame(() => resumeButton?.focus());
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = 'playing';
    game.startedAt = performance.now();
    game.lastFrame = game.startedAt;
    targetZone.inert = false;
    targetZone.setAttribute('tabindex', '0');
    pausePanel.hidden = true;
    targetZone.focus({ preventScroll: true });
    announce('Game resumed.');
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function finishGame() {
    if (game.status !== 'playing') return;
    window.cancelAnimationFrame(game.frame);
    game.frame = null;
    clearControls();
    game.status = 'ended';
    const savedProgress = framework.saveGameProgress('contrast-crash', game.score, true);
    if (game.hits >= 28) {
      resultTitle.textContent = 'You found what the interface tried to hide.';
      resultCopy.textContent = 'High scores reward the hardest targets. Real products should reward clarity instead.';
    } else if (game.hits >= 16) {
      resultTitle.textContent = 'A sharp eye. A questionable interface.';
      resultCopy.textContent = 'The smaller, fainter targets paid more because the design made them harder to use.';
    } else {
      resultTitle.textContent = 'A difficult target is still a design decision.';
      resultCopy.textContent = 'The interface chose to make those targets hard to see. Missing one was not a personal failure.';
    }
    finalScore.textContent = framework.formatScore(game.score);
    bestScore.textContent = framework.formatScore(savedProgress.best);
    finalHits.textContent = String(game.hits);
    switchScreen('result');
    framework.playSound('success');
    window.requestAnimationFrame(() => {
      resultTitle.setAttribute('tabindex', '-1');
      resultTitle.focus();
      resultTitle.addEventListener('blur', () => resultTitle.removeAttribute('tabindex'), { once: true });
    });
  }

  function describePosition(x, y, width, height) {
    const horizontal = x < width / 3 ? 'left' : x > (width * 2) / 3 ? 'right' : 'centre';
    const vertical = y < height / 3 ? 'upper' : y > (height * 2) / 3 ? 'lower' : 'middle';
    return `${vertical} ${horizontal}`;
  }

  function announce(message) {
    liveStatus.textContent = '';
    window.requestAnimationFrame(() => { liveStatus.textContent = message; });
  }

  function mixColours(fromHex, toHex, amount) {
    const from = hexToRgb(fromHex);
    const to = hexToRgb(toHex);
    const mix = Math.min(1, Math.max(0, amount));
    return `rgb(${Math.round(from.red + ((to.red - from.red) * mix))}, ${Math.round(from.green + ((to.green - from.green) * mix))}, ${Math.round(from.blue + ((to.blue - from.blue) * mix))})`;
  }

  function hexToRgb(hex) {
    const value = hex.replace('#', '');
    return {
      red: Number.parseInt(value.slice(0, 2), 16),
      green: Number.parseInt(value.slice(2, 4), 16),
      blue: Number.parseInt(value.slice(4, 6), 16)
    };
  }

  function parseColour(colour) {
    if (colour.startsWith('#')) return hexToRgb(colour);
    const values = colour.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return { red: values[0], green: values[1], blue: values[2] };
  }

  function getContrastRatio(firstColour, secondColour) {
    const first = getRelativeLuminance(parseColour(firstColour));
    const second = getRelativeLuminance(parseColour(secondColour));
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }

  function getRelativeLuminance(colour) {
    const channels = [colour.red, colour.green, colour.blue].map((channel) => {
      const normalised = channel / 255;
      return normalised <= 0.04045 ? normalised / 12.92 : ((normalised + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  document.querySelectorAll('[data-open-game="contrast-crash"]').forEach((button) => {
    button.addEventListener('click', () => openGame(button));
  });
  dialog.querySelectorAll('[data-contrast-exit]').forEach((button) => {
    button.addEventListener('click', framework.exitArcade);
  });
  startButton?.addEventListener('click', startGame);
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-contrast-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-contrast-choose]')?.addEventListener('click', () => closeGame(true));

  targetZone.addEventListener('pointermove', (event) => {
    if (game.status === 'playing' && event.pointerType === 'mouse') setAimFromPointer(event);
  });
  targetZone.addEventListener('click', (event) => {
    if (game.status !== 'playing') return;
    setAimFromPointer(event);
    fireAt(game.aimX, game.aimY);
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (game.status === 'playing') pauseGame();
    else closeGame(false);
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('arcade-open');
    resetGame();
  });
  document.addEventListener('keydown', (event) => {
    if (!dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'p' && !event.repeat) {
      if (game.status === 'playing') {
        event.preventDefault();
        pauseGame();
      } else if (game.status === 'paused') {
        event.preventDefault();
        resumeGame();
      }
      return;
    }
    if (game.status !== 'playing') return;
    const controlMap = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down' };
    if (controlMap[key]) {
      event.preventDefault();
      controls[controlMap[key]] = true;
    } else if (key === ' ' && !event.repeat) {
      event.preventDefault();
      fireAt(game.aimX, game.aimY);
    }
  });
  document.addEventListener('keyup', (event) => {
    if (!dialog.open) return;
    const key = event.key.toLowerCase();
    const controlMap = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down' };
    if (controlMap[key]) controls[controlMap[key]] = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && game.status === 'playing') pauseGame();
  });
  window.addEventListener('resize', () => {
    if (game.status !== 'playing' && game.status !== 'paused') return;
    clampAim();
    renderAim();
  });
})();
