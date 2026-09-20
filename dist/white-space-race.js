(() => {
  const dialog = document.querySelector('#space-dialog');
  const framework = window.UXArcade;
  if (!dialog || !framework) return;

  const screens = [...dialog.querySelectorAll('[data-space-screen]')];
  const startButton = dialog.querySelector('[data-space-start]');
  const pauseButton = dialog.querySelector('[data-space-pause]');
  const resumeButton = dialog.querySelector('[data-space-resume]');
  const pausePanel = dialog.querySelector('[data-space-pause-panel]');
  const touchControls = dialog.querySelector('[data-space-touch-controls]');
  const playfield = dialog.querySelector('#space-playfield');
  const viewport = dialog.querySelector('#space-viewport');
  const world = dialog.querySelector('#space-world');
  const objectLayer = dialog.querySelector('#space-object-layer');
  const terrainTop = dialog.querySelector('#space-terrain-top');
  const terrainBottom = dialog.querySelector('#space-terrain-bottom');
  const finishMarker = dialog.querySelector('#space-finish');
  const finishMessage = dialog.querySelector('#space-finish-message');
  const ship = dialog.querySelector('#space-ship');
  const scoreOutput = dialog.querySelector('#space-score');
  const tokensOutput = dialog.querySelector('#space-tokens');
  const integrityOutput = dialog.querySelector('#space-integrity');
  const progressOutput = dialog.querySelector('#space-progress');
  const progressText = dialog.querySelector('#space-progress-text');
  const sectionOutput = dialog.querySelector('#space-section');
  const messageOutput = dialog.querySelector('#space-message');
  const powerStatus = dialog.querySelector('#space-power-status');
  const powerProgress = dialog.querySelector('#space-power-progress');
  const impactMessage = dialog.querySelector('#space-impact-message');
  const liveStatus = dialog.querySelector('#space-live-status');
  const resultKicker = dialog.querySelector('#space-result-kicker');
  const resultTitle = dialog.querySelector('#space-result-title');
  const resultCopy = dialog.querySelector('#space-result-copy');
  const finalScore = dialog.querySelector('#space-final-score');
  const bestScore = dialog.querySelector('#space-best-score');
  const finalTokens = dialog.querySelector('#space-final-tokens');
  const finalAvoided = dialog.querySelector('#space-final-avoided');
  const finalIntegrity = dialog.querySelector('#space-final-integrity');
  const finalTime = dialog.querySelector('#space-final-time');
  const arcadeTitle = document.querySelector('#arcade-title');
  const gameCard = document.querySelector('[data-game-card="white-space-race"]');
  const reducedMotion = framework.isReducedMotion;

  const LEVEL_LENGTH = 8200;
  const LEVEL_SECONDS = 63;
  const POWER_DURATION = 5000;
  const terrain = [
    { x: 0, top: 9, bottom: 91, section: 'Room to move' },
    { x: 850, top: 12, bottom: 88 },
    { x: 1650, top: 17, bottom: 83, section: 'Content creep' },
    { x: 2450, top: 22, bottom: 78 },
    { x: 3300, top: 28, bottom: 72, section: 'Clutter Canyon' },
    { x: 4100, top: 32, bottom: 68 },
    { x: 4850, top: 23, bottom: 77, section: 'A little breathing room' },
    { x: 5550, top: 34, bottom: 66, section: 'The squeeze' },
    { x: 6350, top: 38, bottom: 62 },
    { x: 7050, top: 22, bottom: 78, section: 'White space ahead' },
    { x: LEVEL_LENGTH, top: 8, bottom: 92, section: 'White space' }
  ];

  const obstacleBlueprints = [
    { x: 1050, y: 33, w: 13, h: 16, type: 'banner', label: 'Cookie banner', small: true },
    { x: 1420, y: 68, w: 10, h: 18, type: 'tooltip', label: 'Tooltip', small: true },
    { x: 1900, y: 37, w: 15, h: 20, type: 'header', label: 'Sticky header' },
    { x: 2260, y: 62, w: 12, h: 18, type: 'modal', label: 'Sign-up modal' },
    { x: 2730, y: 42, w: 11, h: 15, type: 'tooltip', label: 'Helpful tip', small: true },
    { x: 3100, y: 59, w: 16, h: 17, type: 'carousel', label: 'Carousel' },
    { x: 3520, y: 45, w: 12, h: 16, type: 'banner', label: 'Promo banner', small: true },
    { x: 3950, y: 56, w: 13, h: 18, type: 'modal', label: 'Feedback survey' },
    { x: 4430, y: 36, w: 10, h: 14, type: 'tooltip', label: 'Chat window', small: true },
    { x: 4880, y: 67, w: 15, h: 17, type: 'carousel', label: 'More content' },
    { x: 5270, y: 43, w: 9, h: 11, type: 'banner', label: 'Urgent banner', small: true },
    { x: 5680, y: 54, w: 13, h: 16, type: 'modal', label: 'Exit intent' },
    { x: 6070, y: 48, w: 10, h: 13, type: 'tooltip', label: 'Nudge', small: true },
    { x: 6500, y: 53, w: 14, h: 15, type: 'header', label: 'Mega nav' },
    { x: 6900, y: 43, w: 10, h: 13, type: 'banner', label: 'One last offer', small: true }
  ];

  const tokenBlueprints = [
    [720, 48], [930, 63], [1250, 49], [1640, 64], [2140, 52], [2500, 43],
    [2880, 58], [3260, 49], [3700, 59], [4160, 43], [4580, 61], [5030, 48],
    [5450, 55], [5880, 46], [6280, 53], [6680, 47], [7160, 58], [7520, 44]
  ];
  const powerBlueprints = [[1760, 51], [4720, 47], [6210, 49]];

  const game = {
    status: 'idle', frame: 0, lastFrame: 0, score: 0, integrity: 3, tokens: 0,
    avoided: 0, elapsed: 0, distance: 0, shipX: 24, shipY: 50,
    powerRemaining: 0, recoveryRemaining: 0, visibleRange: 1450, worldWidth: 0,
    obstacles: [], tokenItems: [], powerItems: [], keys: new Set(), dragging: false,
    impactTimer: null, finishTimer: null, lastHit: ''
  };
  let returnFocusTarget;

  function switchScreen(name) {
    const labels = { instructions: 'space-screen-title', playing: 'space-playing-title', result: 'space-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.spaceScreen !== name; });
    dialog.dataset.activeScreen = name;
    dialog.setAttribute('aria-labelledby', labels[name]);
    requestAnimationFrame(() => {
      dialog.scrollTop = 0;
      dialog.querySelector('.arcade-screen')?.scrollTo(0, 0);
    });
  }

  function openGame(trigger) {
    returnFocusTarget = trigger;
    resetGame();
    switchScreen('instructions');
    document.body.classList.add('arcade-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    requestAnimationFrame(() => {
      if (!window.matchMedia('(pointer: coarse)').matches) startButton?.focus({ preventScroll: true });
    });
    framework.playSound('open');
    framework.trackGameOpen('white-space-race');
  }

  function closeGame(focusCards = false) {
    framework.trackGameExit('white-space-race', game.score);
    resetGame();
    document.body.classList.remove('arcade-open');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    requestAnimationFrame(() => {
      if (focusCards && arcadeTitle) {
        arcadeTitle.setAttribute('tabindex', '-1');
        arcadeTitle.focus({ preventScroll: true });
        gameCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) returnFocusTarget.focus({ preventScroll: true });
    });
  }

  function resetGame() {
    cancelAnimationFrame(game.frame);
    window.clearTimeout(game.impactTimer);
    window.clearTimeout(game.finishTimer);
    Object.assign(game, {
      status: 'idle', frame: 0, lastFrame: 0, score: 0, integrity: 3, tokens: 0,
      avoided: 0, elapsed: 0, distance: 0, shipX: 24, shipY: 50,
      powerRemaining: 0, recoveryRemaining: 0, visibleRange: 1450, worldWidth: 0,
      obstacles: [], tokenItems: [], powerItems: [], keys: new Set(), dragging: false,
      impactTimer: null, finishTimer: null, lastHit: ''
    });
    objectLayer.replaceChildren();
    touchControls?.querySelectorAll('.is-active').forEach((button) => button.classList.remove('is-active'));
    viewport.classList.remove('is-breathing', 'is-hit', 'is-finishing', 'is-recovering');
    ship.classList.remove('is-boosting');
    finishMessage?.setAttribute('aria-hidden', 'true');
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    powerStatus.hidden = true;
    impactMessage.hidden = true;
    messageOutput.textContent = 'Find the clearest route';
    messageOutput.className = '';
    updateHud();
  }

  function startGame() {
    resetGame();
    switchScreen('playing');
    buildLevel();
    game.status = 'playing';
    framework.trackGameStart('white-space-race');
    game.lastFrame = performance.now();
    updateFrame();
    announce('Clutter Canyon started. Guide the ship, collect spacing tokens and reach the white space.');
    framework.playSound('select');
    playfield.focus({ preventScroll: true });
  }

  function buildLevel() {
    game.visibleRange = viewport.clientWidth < 680 ? 1120 : 1450;
    game.worldWidth = viewport.clientWidth * LEVEL_LENGTH / game.visibleRange;
    world.style.width = `${game.worldWidth}px`;
    const points = terrain.map((point) => `${point.x},${point.top}`).join(' ');
    const lowerPoints = [...terrain].reverse().map((point) => `${point.x},${point.bottom}`).join(' ');
    terrainTop.setAttribute('points', `0,0 ${points} ${LEVEL_LENGTH},0`);
    terrainBottom.setAttribute('points', `0,100 ${lowerPoints} 0,100`);
    finishMarker.style.left = `${worldX(7700)}px`;

    game.obstacles = obstacleBlueprints.map((blueprint) => createItem(blueprint, 'obstacle'));
    game.tokenItems = tokenBlueprints.map(([x, y]) => createItem({ x, y, w: 3.2, h: 7, label: 'Spacing token' }, 'token'));
    game.powerItems = powerBlueprints.map(([x, y]) => createItem({ x, y, w: 5.4, h: 10, label: 'Breathing Room' }, 'power'));
    render();
  }

  function createItem(blueprint, kind) {
    const element = document.createElement('div');
    element.className = `space-object is-${kind}${blueprint.type ? ` is-${blueprint.type}` : ''}${blueprint.small ? ' is-small is-telegraph' : ''}`;
    const symbols = { banner: '!', tooltip: '?', header: '☰', modal: '×', carousel: '›' };
    element.innerHTML = kind === 'token'
      ? '<span aria-hidden="true">↔</span>'
      : kind === 'power'
        ? '<strong aria-hidden="true">↔</strong><span>Breathing Room</span>'
        : `<i class="space-object-chrome" aria-hidden="true"><b></b><b></b><b></b></i><span>${blueprint.label}</span><em class="space-object-symbol" aria-hidden="true">${symbols[blueprint.type] || '!'}</em>`;
    element.style.left = `${worldX(blueprint.x)}px`;
    element.style.top = `${blueprint.y}%`;
    element.style.width = `${Math.max(26, viewport.clientWidth * blueprint.w / 100)}px`;
    element.style.height = `${Math.max(26, viewport.clientHeight * blueprint.h / 100)}px`;
    objectLayer.append(element);
    return { ...blueprint, kind, element, collected: false, hit: false, passed: false, warned: false, live: kind !== 'obstacle' || !blueprint.small };
  }

  function worldX(levelX) {
    return levelX / LEVEL_LENGTH * game.worldWidth;
  }

  function corridorAt(x) {
    let start = terrain[0];
    let end = terrain[terrain.length - 1];
    for (let index = 0; index < terrain.length - 1; index += 1) {
      if (x >= terrain[index].x && x <= terrain[index + 1].x) {
        start = terrain[index];
        end = terrain[index + 1];
        break;
      }
    }
    const ratio = Math.max(0, Math.min(1, (x - start.x) / Math.max(1, end.x - start.x)));
    const breathing = game.powerRemaining > 0 ? 9 : 0;
    return {
      top: Math.max(1, start.top + (end.top - start.top) * ratio - breathing),
      bottom: Math.min(99, start.bottom + (end.bottom - start.bottom) * ratio + breathing)
    };
  }

  function currentSection() {
    let active = terrain[0].section;
    terrain.forEach((point) => { if (point.section && game.distance >= point.x) active = point.section; });
    return active;
  }

  function updateFrame(now = performance.now()) {
    if (game.status !== 'playing') return;
    const delta = Math.min(.04, Math.max(0, (now - game.lastFrame) / 1000));
    game.lastFrame = now;
    game.elapsed += delta;
    game.distance += ((LEVEL_LENGTH - game.visibleRange * .42) / LEVEL_SECONDS) * delta;
    updateInput(delta);
    if (game.powerRemaining > 0) game.powerRemaining = Math.max(0, game.powerRemaining - delta * 1000);
    if (game.recoveryRemaining > 0) game.recoveryRemaining = Math.max(0, game.recoveryRemaining - delta * 1000);
    render();
    checkCollisions();
    updateHud();
    if (game.distance >= LEVEL_LENGTH - game.visibleRange * .42) beginFinish();
    else game.frame = requestAnimationFrame(updateFrame);
  }

  function updateInput(delta) {
    const xRate = 44;
    const yRate = 50;
    if (game.keys.has('left') || game.keys.has('a')) game.shipX -= xRate * delta;
    if (game.keys.has('right') || game.keys.has('d')) game.shipX += xRate * delta;
    if (game.keys.has('up') || game.keys.has('w')) game.shipY -= yRate * delta;
    if (game.keys.has('down') || game.keys.has('s')) game.shipY += yRate * delta;
    const bounds = shipBounds();
    game.shipX = Math.max(bounds.left, Math.min(bounds.right, game.shipX));
    game.shipY = Math.max(bounds.top, Math.min(bounds.bottom, game.shipY));
  }

  function shipBounds() {
    const viewportWidth = Math.max(1, viewport.clientWidth);
    const viewportHeight = Math.max(1, viewport.clientHeight);
    const halfWidth = ship.offsetWidth / viewportWidth * 50;
    const halfHeight = ship.offsetHeight / viewportHeight * 50;
    return {
      left: halfWidth + 1,
      right: 99 - halfWidth,
      top: halfHeight + 1,
      bottom: 99 - halfHeight
    };
  }

  function render() {
    const scroll = worldX(game.distance);
    viewport.style.setProperty('--space-scroll', `${scroll}px`);
    viewport.style.setProperty('--space-progress', String(Math.min(1, game.distance / LEVEL_LENGTH)));
    ship.style.left = `${game.shipX}%`;
    ship.style.top = `${game.shipY}%`;
    ship.classList.toggle('is-boosting', game.status === 'playing' && (game.keys.size > 0 || game.dragging));
    viewport.classList.toggle('is-breathing', game.powerRemaining > 0);
    viewport.classList.toggle('is-recovering', game.recoveryRemaining > 0);
    sectionOutput.textContent = currentSection();
  }

  function checkCollisions() {
    if (game.status !== 'playing') return;
    const shipRect = ship.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();

    game.tokenItems.forEach((item) => {
      if (!item.collected && intersects(shipRect, item.element.getBoundingClientRect())) collectToken(item);
    });
    game.powerItems.forEach((item) => {
      if (!item.collected && intersects(shipRect, item.element.getBoundingClientRect())) collectPower(item);
    });

    if (game.recoveryRemaining > 0) return;

    const halfHeight = shipRect.height / viewportRect.height * 32;
    const shipWorldX = game.distance + game.visibleRange * game.shipX / 100;
    const corridor = corridorAt(shipWorldX);
    if (game.shipY - halfHeight < corridor.top || game.shipY + halfHeight > corridor.bottom) {
      game.shipY = (corridor.top + corridor.bottom) / 2;
      takeHit('Terrain collision');
      return;
    }

    for (const item of game.obstacles) {
      if (item.hit) continue;
      const rect = item.element.getBoundingClientRect();
      const warningPoint = item.small ? viewportRect.right - Math.min(44, rect.width * .35) : viewportRect.right + 90;
      if (!item.warned && rect.left < warningPoint && rect.right > viewportRect.left) {
        item.warned = true;
        item.element.classList.add('is-warning');
        framework.playSound('warning');
        window.setTimeout(() => {
          item.live = true;
          item.element.classList.remove('is-warning', 'is-telegraph');
          item.element.classList.add('is-live');
        }, item.small ? 720 : 900);
      }
      if (!item.passed && rect.right < shipRect.left) {
        item.passed = true;
        game.avoided += 1;
        game.score += 10;
      }
      if (!item.live) continue;
      if (game.powerRemaining > 0 && item.small) continue;
      if (intersects(shipRect, rect)) {
        item.hit = true;
        item.element.classList.add('is-cleared');
        takeHit(item.label);
        break;
      }
    }
  }

  function intersects(a, b) {
    const insetX = a.width * .28;
    const insetY = a.height * .25;
    return a.left + insetX < b.right && a.right - insetX > b.left && a.top + insetY < b.bottom && a.bottom - insetY > b.top;
  }

  function collectToken(item) {
    item.collected = true;
    item.element.classList.add('is-collected');
    game.tokens += 1;
    game.score += 25;
    messageOutput.textContent = 'Spacing token collected';
    framework.playSound('coin');
  }

  function collectPower(item) {
    item.collected = true;
    item.element.classList.add('is-collected');
    game.score += 100;
    game.powerRemaining = POWER_DURATION;
    messageOutput.textContent = 'Breathing Room activated';
    announce('Breathing Room active. The route is wider and small clutter cannot hurt you for five seconds.');
    framework.playSound('boost');
  }

  function takeHit(label) {
    game.integrity -= 1;
    game.recoveryRemaining = 1800;
    game.lastHit = label;
    viewport.classList.add('is-hit');
    window.setTimeout(() => viewport.classList.remove('is-hit'), 380);
    window.clearTimeout(game.impactTimer);
    impactMessage.textContent = `${label} · ${game.integrity}/3 Integrity`;
    impactMessage.hidden = false;
    game.impactTimer = window.setTimeout(() => { impactMessage.hidden = true; }, 1350);
    messageOutput.textContent = `${label}. Integrity lost.`;
    announce(`${label}. ${game.integrity} integrity remaining.`);
    framework.playSound('bad');
    if (game.integrity <= 0) finishGame(false);
  }

  function updateHud() {
    scoreOutput.textContent = framework.formatScore(game.score);
    tokensOutput.textContent = String(game.tokens);
    integrityOutput.textContent = `${game.integrity}/3`;
    const percent = Math.max(0, Math.min(100, Math.round(game.distance / (LEVEL_LENGTH - game.visibleRange * .42) * 100)));
    progressOutput.value = percent;
    progressOutput.textContent = `${percent}% complete`;
    progressText.textContent = `${percent}%`;
    powerStatus.hidden = game.powerRemaining <= 0;
    powerProgress.value = game.powerRemaining;
    if (game.powerRemaining > 0 && game.powerRemaining < 1200) messageOutput.textContent = 'Clutter returning';
  }

  function pauseGame(automatic = false) {
    if (game.status !== 'playing') return;
    cancelAnimationFrame(game.frame);
    game.status = 'paused';
    game.keys.clear();
    touchControls?.querySelectorAll('.is-active').forEach((button) => button.classList.remove('is-active'));
    pausePanel.hidden = false;
    pauseButton.disabled = true;
    messageOutput.textContent = automatic ? 'Paused while you were away' : 'Game paused';
    resumeButton?.focus({ preventScroll: true });
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = 'playing';
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    game.lastFrame = performance.now();
    playfield.focus({ preventScroll: true });
    game.frame = requestAnimationFrame(updateFrame);
  }

  function beginFinish() {
    if (game.status !== 'playing') return;
    cancelAnimationFrame(game.frame);
    game.status = 'finishing';
    game.keys.clear();
    ship.classList.remove('is-boosting');
    viewport.classList.add('is-finishing');
    finishMessage?.setAttribute('aria-hidden', 'false');
    messageOutput.textContent = 'Entering white space';
    framework.playSound('boost');
    game.finishTimer = window.setTimeout(() => finishGame(true), reducedMotion ? 250 : 3400);
  }

  function finishGame(completed) {
    if (!['playing', 'paused', 'finishing'].includes(game.status)) return;
    cancelAnimationFrame(game.frame);
    game.status = 'finished';
    game.keys.clear();
    if (completed) {
      game.score += 500 + game.integrity * 250 + Math.max(0, Math.round((LEVEL_SECONDS - game.elapsed) * 10));
      resultKicker.textContent = 'Level complete';
      resultTitle.textContent = 'Room to breathe';
      resultCopy.textContent = 'You made it through the clutter and found the white space.';
      framework.playSound('success');
    } else {
      resultKicker.textContent = 'Level over';
      resultTitle.textContent = 'Clutter took over';
      resultCopy.textContent = game.lastHit
        ? `Your Integrity ran out after: ${game.lastHit}. Clear a route and try again.`
        : 'The interface ran out of room. Clear a route and try again.';
      framework.playSound('fail');
    }
    const saved = framework.saveGameProgress('white-space-race', game.score, completed);
    framework.trackGameEnd('white-space-race', {
      result: completed ? 'completed' : 'failed',
      score: game.score,
      spacing_tokens: game.tokens,
      integrity_remaining: Math.max(0, game.integrity)
    });
    finalScore.textContent = framework.formatScore(game.score);
    bestScore.textContent = framework.formatScore(saved.best || game.score);
    finalTokens.textContent = String(game.tokens);
    finalAvoided.textContent = String(game.avoided);
    finalIntegrity.textContent = `${Math.max(0, game.integrity)}/3`;
    finalTime.textContent = `${Math.round(game.elapsed)}s`;
    switchScreen('result');
    requestAnimationFrame(() => dialog.querySelector('[data-space-play-again]')?.focus({ preventScroll: true }));
  }

  function announce(text) {
    liveStatus.textContent = '';
    requestAnimationFrame(() => { liveStatus.textContent = text; });
  }

  function setShipFromPointer(event) {
    if (game.status !== 'playing') return;
    const rect = viewport.getBoundingClientRect();
    const bounds = shipBounds();
    game.shipX = Math.max(bounds.left, Math.min(bounds.right, (event.clientX - rect.left) / rect.width * 100));
    game.shipY = Math.max(bounds.top, Math.min(bounds.bottom, (event.clientY - rect.top) / rect.height * 100));
  }

  function bindTouchControl(button) {
    if (!button) return;
    const direction = button.dataset.spaceControl;
    const activate = (event) => {
      if (game.status !== 'playing') return;
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      game.keys.add(direction);
      button.classList.add('is-active');
    };
    const deactivate = () => {
      game.keys.delete(direction);
      button.classList.remove('is-active');
    };
    button.addEventListener('pointerdown', activate);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => button.addEventListener(type, deactivate));
  }

  document.querySelectorAll('[data-open-game="white-space-race"]').forEach((button) => button.addEventListener('click', () => openGame(button)));
  dialog.querySelectorAll('[data-space-exit]').forEach((button) => button.addEventListener('click', () => {
    closeGame();
    framework.exitArcade({ restartTheme: true });
  }));
  startButton?.addEventListener('click', () => framework.startCountdown(dialog, startGame));
  pauseButton?.addEventListener('click', () => pauseGame());
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-space-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-space-choose]')?.addEventListener('click', () => {
    closeGame(true);
    framework.exitArcade({ restartTheme: true });
  });

  window.addEventListener('keydown', (event) => {
    if (!dialog.open || !['playing', 'paused'].includes(game.status)) return;
    const key = event.key.toLowerCase();
    const aliases = { arrowleft: 'left', arrowright: 'right', arrowup: 'up', arrowdown: 'down' };
    const direction = aliases[key] || key;
    if (['left', 'right', 'up', 'down', 'w', 'a', 's', 'd'].includes(direction)) {
      event.preventDefault();
      game.keys.add(direction);
    }
    if (key === 'p') {
      event.preventDefault();
      game.status === 'playing' ? pauseGame() : resumeGame();
    }
    if (key === 'escape' && game.status === 'playing') pauseGame();
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    const aliases = { arrowleft: 'left', arrowright: 'right', arrowup: 'up', arrowdown: 'down' };
    game.keys.delete(aliases[key] || key);
  });
  viewport.addEventListener('pointerdown', (event) => {
    if (game.status !== 'playing') return;
    game.dragging = true;
    viewport.setPointerCapture?.(event.pointerId);
    setShipFromPointer(event);
    event.preventDefault();
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!game.dragging) return;
    setShipFromPointer(event);
    event.preventDefault();
  });
  viewport.addEventListener('pointerup', () => { game.dragging = false; });
  viewport.addEventListener('pointercancel', () => { game.dragging = false; });
  touchControls?.querySelectorAll('[data-space-control]').forEach(bindTouchControl);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open) pauseGame(true);
  });
  window.addEventListener('resize', () => {
    if (game.status === 'playing') pauseGame(true);
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (game.status === 'playing') pauseGame();
    else {
      closeGame();
      framework.exitArcade({ restartTheme: true });
    }
  });
  dialog.addEventListener('close', resetGame);
})();
