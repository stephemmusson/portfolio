(() => {
  const dialog = document.querySelector('#scope-dialog');
  const framework = window.UXArcade;
  if (!dialog || !framework) return;

  const screens = [...dialog.querySelectorAll('[data-scope-screen]')];
  const startButton = dialog.querySelector('[data-scope-start]');
  const pauseButton = dialog.querySelector('[data-scope-pause]');
  const resumeButton = dialog.querySelector('[data-scope-resume]');
  const pausePanel = dialog.querySelector('[data-scope-pause-panel]');
  const playfield = dialog.querySelector('#scope-playfield');
  const flightZone = dialog.querySelector('#scope-flight-zone');
  const requestLayer = dialog.querySelector('#scope-request-layer');
  const projectileLayer = dialog.querySelector('#scope-projectile-layer');
  const ship = dialog.querySelector('#scope-ship');
  const touchControls = dialog.querySelector('[data-scope-touch-controls]');
  const fieldMessage = dialog.querySelector('#scope-field-message');
  const scoreOutput = dialog.querySelector('#scope-score');
  const stoppedOutput = dialog.querySelector('#scope-stopped');
  const healthOutput = dialog.querySelector('#scope-health-text');
  const timeOutput = dialog.querySelector('#scope-time');
  const timeProgress = dialog.querySelector('#scope-time-progress');
  const timerPanel = dialog.querySelector('.scope-timer');
  const liveStatus = dialog.querySelector('#scope-live-status');
  const resultKicker = dialog.querySelector('#scope-result-kicker');
  const resultTitle = dialog.querySelector('#scope-result-title');
  const resultCopy = dialog.querySelector('#scope-result-copy');
  const finalScore = dialog.querySelector('#scope-final-score');
  const bestScore = dialog.querySelector('#scope-best-score');
  const finalCorrect = dialog.querySelector('#scope-final-correct');
  const arcadeTitle = document.querySelector('#arcade-title');
  const scopeCard = document.querySelector('[data-game-card="scope-invaders"]');
  const reducedMotion = framework.isReducedMotion;
  const sessionDuration = 45000;
  const shipSpeed = 430;
  const bulletSpeed = 610;

  const requests = [
    { title: 'Add a homepage carousel', signal: 'Three directors each want first place.', type: 'weak' },
    { title: 'Make the logo bigger', signal: 'No user evidence. The brand team just asked.', type: 'weak' },
    { title: 'Add seven form fields', signal: 'Sales wants more CRM data before helping.', type: 'weak' },
    { title: 'Launch an AI chatbot', signal: 'No owner, content plan or defined user need.', type: 'weak' },
    { title: 'Copy the competitor', signal: 'Nobody checked whether their users are different.', type: 'weak' },
    { title: 'Mandatory registration', signal: 'People must sign up before seeing basic prices.', type: 'weak' },
    { title: 'Save application progress', signal: 'Research shows the journey takes several sessions.', type: 'useful' },
    { title: 'Improve error recovery', signal: 'Support logs show repeated abandonment.', type: 'useful' },
    { title: 'Remove checkout fields', signal: 'Three requested details are never used.', type: 'useful' },
    { title: 'Add keyboard controls', signal: 'The current gallery has a known access barrier.', type: 'useful' },
    { title: 'Upgrade the old platform', signal: 'Security support ends this year.', type: 'useful' },
    { title: 'Improve search synonyms', signal: 'Search logs show common zero-result terms.', type: 'useful' }
  ];

  const game = {
    status: 'idle', score: 0, stopped: 0, allowed: 0, mistakes: 0,
    health: 4, elapsed: 0, startedAt: 0, lastFrame: 0, lastVisual: 0,
    spawnAccumulator: 0, shotAt: 0, frame: null, shipX: 0,
    requests: [], bullets: [], deck: [], deckIndex: 0, activePointer: null
  };
  const controls = { left: false, right: false };
  let returnFocusTarget;

  function switchScreen(name) {
    const labels = { instructions: 'scope-screen-title', playing: 'scope-playing-title', result: 'scope-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.scopeScreen !== name; });
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
        scopeCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) {
        returnFocusTarget.focus({ preventScroll: true });
      }
    });
  }

  function resetGame() {
    window.cancelAnimationFrame(game.frame);
    clearControls();
    requestLayer.replaceChildren();
    projectileLayer.replaceChildren();
    Object.assign(game, {
      status: 'idle', score: 0, stopped: 0, allowed: 0, mistakes: 0,
      health: 4, elapsed: 0, startedAt: 0, lastFrame: 0, lastVisual: 0,
      spawnAccumulator: 0, shotAt: 0, frame: null, shipX: 0,
      requests: [], bullets: [], deck: shuffle(requests), deckIndex: 0, activePointer: null
    });
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    touchControls.inert = false;
    playfield.setAttribute('tabindex', '0');
    fieldMessage.textContent = 'Incoming requests';
    timerPanel.classList.remove('is-low');
    updateHud(0);
  }

  function startGame() {
    resetGame();
    switchScreen('playing');
    game.status = 'playing';
    game.startedAt = performance.now();
    game.lastFrame = game.startedAt;
    setShipToCentre();
    spawnRequest();
    updateHud(0);
    framework.playSound('select');
    announce('Defend the product. Shoot weak scope and let evidence-backed ideas through.');
    playfield.focus({ preventScroll: true });
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function runFrame(now) {
    if (game.status !== 'playing') return;
    const elapsed = game.elapsed + (now - game.startedAt);
    updateHud(elapsed);
    if (elapsed >= sessionDuration) {
      finishGame(true);
      return;
    }

    const rawDelta = Math.min(0.05, Math.max(0, (now - game.lastFrame) / 1000));
    game.lastFrame = now;
    if (!reducedMotion || now - game.lastVisual >= 90) {
      const delta = reducedMotion ? Math.min(0.12, (now - game.lastVisual) / 1000 || rawDelta) : rawDelta;
      game.lastVisual = now;
      updateShip(delta);
      updateRequests(delta, elapsed / sessionDuration);
      if (game.status !== 'playing') return;
      updateBullets(delta);
      detectCollisions();
      if (game.status !== 'playing') return;
    }

    const progress = Math.min(1, elapsed / sessionDuration);
    const spawnInterval = Math.max(900, 2200 - (progress * 1150));
    game.spawnAccumulator += rawDelta * 1000;
    if (game.spawnAccumulator >= spawnInterval) {
      game.spawnAccumulator = 0;
      spawnRequest();
    }
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function spawnRequest() {
    if (game.status !== 'playing') return;
    const fieldWidth = Math.max(1, flightZone.clientWidth);
    const laneLayout = getLaneLayout(fieldWidth);
    const occupiedLanes = new Set(game.requests.map((item) => item.laneIndex));
    const availableLanes = laneLayout.lanes.filter((lane) => !occupiedLanes.has(lane.index));
    if (!availableLanes.length) return;

    if (game.deckIndex >= game.deck.length) {
      game.deck = shuffle(requests);
      game.deckIndex = 0;
    }
    const request = game.deck[game.deckIndex];
    game.deckIndex += 1;
    const element = document.createElement('article');
    const tag = document.createElement('span');
    const title = document.createElement('h3');
    const signal = document.createElement('p');
    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const { width } = laneLayout;
    const x = lane.x;
    element.className = 'scope-request scope-invader';
    tag.className = 'scope-request-tag';
    tag.textContent = 'Feature request';
    title.textContent = request.title;
    signal.textContent = request.signal;
    element.append(tag, title, signal);
    element.style.width = `${width}px`;
    requestLayer.append(element);
    const item = {
      element, request, x, laneIndex: lane.index, y: -Math.max(80, element.offsetHeight), width,
      height: Math.max(78, element.offsetHeight), speed: 48 + (Math.min(1, getElapsed() / sessionDuration) * 54)
    };
    game.requests.push(item);
    renderRequest(item);
    const laneName = lane.name;
    announce(`${request.title}. ${request.signal} Incoming in the ${laneName} lane.`);
    framework.playSound('open');
  }

  function getLaneLayout(fieldWidth) {
    const count = fieldWidth >= 920 ? 4 : fieldWidth >= 480 ? 3 : 2;
    const padding = 8;
    const gap = fieldWidth < 480 ? 12 : 16;
    const availableWidth = fieldWidth - (padding * 2) - (gap * (count - 1));
    const width = Math.max(1, Math.min(218, availableWidth / count));
    const usedWidth = (width * count) + (gap * (count - 1));
    const start = Math.max(padding, (fieldWidth - usedWidth) / 2);
    const names = count === 4 ? ['far left', 'left', 'right', 'far right'] : count === 3 ? ['left', 'centre', 'right'] : ['left', 'right'];
    return {
      width,
      lanes: Array.from({ length: count }, (_, index) => ({
        index,
        name: names[index],
        x: start + (index * (width + gap))
      }))
    };
  }

  function updateRequests(delta, progress) {
    const fieldHeight = flightZone.clientHeight;
    const productLine = fieldHeight - 68;
    for (const item of [...game.requests]) {
      if (game.status !== 'playing') break;
      item.y += item.speed * (1 + (progress * 0.2)) * delta;
      renderRequest(item);
      if (item.y + item.height >= productLine) resolveArrival(item);
    }
  }

  function updateBullets(delta) {
    [...game.bullets].forEach((bullet) => {
      bullet.y -= bulletSpeed * delta;
      bullet.element.style.transform = `translate(${bullet.x}px, ${bullet.y}px)`;
      if (bullet.y < -24) removeBullet(bullet);
    });
  }

  function detectCollisions() {
    for (const bullet of [...game.bullets]) {
      const hit = game.requests.find((item) => (
        bullet.x + 8 >= item.x
        && bullet.x <= item.x + item.width
        && bullet.y + 20 >= item.y
        && bullet.y <= item.y + item.height
      ));
      if (!hit) continue;
      removeBullet(bullet);
      resolveShot(hit);
    }
  }

  function resolveShot(item) {
    removeRequest(item);
    if (item.request.type === 'weak') {
      game.stopped += 1;
      game.score += 150;
      fieldMessage.textContent = `Stopped: ${item.request.title}`;
      framework.playSound('good');
      announce(`Weak scope stopped. ${item.request.title}.`);
    } else {
      game.mistakes += 1;
      game.score = Math.max(0, game.score - 100);
      damageProduct(`Useful idea shot: ${item.request.title}`);
    }
  }

  function resolveArrival(item) {
    removeRequest(item);
    if (item.request.type === 'useful') {
      game.allowed += 1;
      game.score += 100;
      fieldMessage.textContent = `Allowed: ${item.request.title}`;
      framework.playSound('good');
      announce(`Useful idea allowed through. ${item.request.title}.`);
    } else {
      game.score = Math.max(0, game.score - 50);
      damageProduct(`Weak scope landed: ${item.request.title}`);
    }
  }

  function damageProduct(message) {
    game.health = Math.max(0, game.health - 1);
    ship.classList.remove('is-hit');
    void ship.offsetWidth;
    ship.classList.add('is-hit');
    fieldMessage.textContent = message;
    framework.playSound('bad');
    announce(`${message}. Product shield ${game.health} of 4.`);
    updateHud(getElapsed());
    if (game.health === 0) finishGame(false);
  }

  function fire() {
    if (game.status !== 'playing') return;
    const now = performance.now();
    if (now - game.shotAt < 260) return;
    game.shotAt = now;
    const element = document.createElement('i');
    const shipWidth = ship.offsetWidth || 76;
    const x = game.shipX + (shipWidth / 2) - 4;
    const y = flightZone.clientHeight - 92;
    element.className = 'scope-projectile';
    projectileLayer.append(element);
    const bullet = { element, x, y };
    game.bullets.push(bullet);
    element.style.transform = `translate(${x}px, ${y}px)`;
    framework.playSound('select');
  }

  function updateShip(delta) {
    const direction = Number(controls.right) - Number(controls.left);
    if (direction) game.shipX += direction * shipSpeed * delta;
    clampShip();
    renderShip();
  }

  function setShipToCentre() {
    game.shipX = Math.max(0, (flightZone.clientWidth - (ship.offsetWidth || 76)) / 2);
    renderShip();
  }

  function setShipFromPointer(clientX) {
    const rect = flightZone.getBoundingClientRect();
    game.shipX = clientX - rect.left - ((ship.offsetWidth || 76) / 2);
    clampShip();
    renderShip();
  }

  function clampShip() {
    game.shipX = Math.min(Math.max(0, flightZone.clientWidth - (ship.offsetWidth || 76)), Math.max(0, game.shipX));
  }

  function renderShip() {
    ship.style.transform = `translateX(${game.shipX}px)`;
  }

  function renderRequest(item) {
    item.element.style.transform = `translate(${item.x}px, ${item.y}px)`;
  }

  function reflowRequests() {
    const layout = getLaneLayout(Math.max(1, flightZone.clientWidth));
    game.requests.slice(layout.lanes.length).forEach(removeRequest);
    game.requests.forEach((item, index) => {
      const lane = layout.lanes[index];
      item.laneIndex = lane.index;
      item.x = lane.x;
      item.width = layout.width;
      item.element.style.width = `${layout.width}px`;
      renderRequest(item);
    });
  }

  function removeRequest(item) {
    item.element.remove();
    game.requests = game.requests.filter((candidate) => candidate !== item);
  }

  function removeBullet(bullet) {
    bullet.element.remove();
    game.bullets = game.bullets.filter((candidate) => candidate !== bullet);
  }

  function getElapsed() {
    return game.status === 'playing' ? game.elapsed + (performance.now() - game.startedAt) : game.elapsed;
  }

  function updateHud(elapsed) {
    const remaining = Math.max(0, sessionDuration - elapsed);
    scoreOutput.textContent = framework.formatScore(game.score);
    stoppedOutput.textContent = String(game.stopped);
    healthOutput.textContent = `${game.health}/4`;
    timeOutput.textContent = `${Math.ceil(remaining / 1000)}s`;
    timeProgress.max = sessionDuration;
    timeProgress.value = remaining;
    timeProgress.textContent = `${Math.ceil(remaining / 1000)} seconds remaining`;
    timerPanel.classList.toggle('is-low', remaining <= 7000 || game.health <= 1);
  }

  function clearControls() {
    controls.left = false;
    controls.right = false;
    game.activePointer = null;
  }

  function pauseGame() {
    if (game.status !== 'playing') return;
    game.elapsed = getElapsed();
    window.cancelAnimationFrame(game.frame);
    game.frame = null;
    clearControls();
    game.status = 'paused';
    pausePanel.hidden = false;
    touchControls.inert = true;
    playfield.setAttribute('tabindex', '-1');
    announce('Game paused.');
    window.requestAnimationFrame(() => resumeButton?.focus());
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = 'playing';
    game.startedAt = performance.now();
    game.lastFrame = game.startedAt;
    game.lastVisual = game.startedAt;
    pausePanel.hidden = true;
    touchControls.inert = false;
    playfield.setAttribute('tabindex', '0');
    announce('Game resumed.');
    playfield.focus({ preventScroll: true });
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function finishGame(completed) {
    if (game.status !== 'playing') return;
    window.cancelAnimationFrame(game.frame);
    game.frame = null;
    clearControls();
    game.status = 'ended';
    const savedProgress = framework.saveGameProgress('scope-invaders', game.score, completed);
    resultKicker.textContent = completed ? '45 seconds complete' : 'Product shield depleted';
    if (!completed) {
      resultTitle.textContent = 'The backlog won.';
      resultCopy.textContent = `Weak scope reached the product, or useful work was shot down. You still stopped ${game.stopped} weak requests and allowed ${game.allowed} useful ideas.`;
    } else if (game.mistakes === 0 && game.stopped >= 6) {
      resultTitle.textContent = 'The product stayed focused.';
      resultCopy.textContent = `You stopped ${game.stopped} weak requests and allowed ${game.allowed} useful ideas without confusing movement with progress.`;
    } else {
      resultTitle.textContent = 'The product survived.';
      resultCopy.textContent = `You stopped ${game.stopped} weak requests and allowed ${game.allowed} useful ideas. Product judgement matters more than firing at everything.`;
    }
    finalScore.textContent = framework.formatScore(game.score);
    bestScore.textContent = framework.formatScore(savedProgress.best);
    finalCorrect.textContent = String(game.stopped);
    switchScreen('result');
    framework.playSound(completed ? 'success' : 'fail');
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

  function shuffle(items) {
    const output = [...items];
    for (let index = output.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
    }
    return output;
  }

  function bindHoldControl(button, direction) {
    if (!button) return;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      controls[direction] = true;
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
      button.addEventListener(type, () => { controls[direction] = false; });
    });
  }

  document.querySelectorAll('[data-open-game="scope-invaders"]').forEach((button) => {
    button.addEventListener('click', () => openGame(button));
  });
  dialog.querySelectorAll('[data-scope-exit]').forEach((button) => {
    button.addEventListener('click', framework.exitArcade);
  });
  startButton?.addEventListener('click', startGame);
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-scope-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-scope-choose]')?.addEventListener('click', () => closeGame(true));
  bindHoldControl(dialog.querySelector('[data-scope-control="left"]'), 'left');
  bindHoldControl(dialog.querySelector('[data-scope-control="right"]'), 'right');
  dialog.querySelector('[data-scope-control="fire"]')?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    fire();
  });

  flightZone.addEventListener('pointerdown', (event) => {
    if (game.status !== 'playing') return;
    game.activePointer = event.pointerId;
    flightZone.setPointerCapture?.(event.pointerId);
    setShipFromPointer(event.clientX);
  });
  flightZone.addEventListener('pointermove', (event) => {
    if (game.status === 'playing' && game.activePointer === event.pointerId) setShipFromPointer(event.clientX);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
    flightZone.addEventListener(type, () => { game.activePointer = null; });
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
    if (key === 'arrowleft' || key === 'a') {
      event.preventDefault();
      controls.left = true;
    } else if (key === 'arrowright' || key === 'd') {
      event.preventDefault();
      controls.right = true;
    } else if ((key === ' ' || key === 'arrowup' || key === 'w') && !event.repeat) {
      event.preventDefault();
      fire();
    }
  });
  document.addEventListener('keyup', (event) => {
    if (!dialog.open) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') controls.left = false;
    if (key === 'arrowright' || key === 'd') controls.right = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && game.status === 'playing') pauseGame();
  });
  window.addEventListener('resize', () => {
    if (game.status !== 'playing' && game.status !== 'paused') return;
    reflowRequests();
    clampShip();
    renderShip();
  });
})();
