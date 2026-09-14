(() => {
  const dialog = document.querySelector('#pac-dialog');
  const framework = window.UXArcade;
  if (!dialog || !framework) return;

  const screens = [...dialog.querySelectorAll('[data-pac-screen]')];
  const startButton = dialog.querySelector('[data-pac-start]');
  const pauseButton = dialog.querySelector('[data-pac-pause]');
  const resumeButton = dialog.querySelector('[data-pac-resume]');
  const pausePanel = dialog.querySelector('[data-pac-pause-panel]');
  const playfield = dialog.querySelector('#pac-playfield');
  const board = dialog.querySelector('#pac-board');
  const touchControls = dialog.querySelector('[data-pac-touch-controls]');
  const scoreOutput = dialog.querySelector('#pac-score');
  const remainingOutput = dialog.querySelector('#pac-remaining');
  const livesOutput = dialog.querySelector('#pac-lives');
  const evidenceText = dialog.querySelector('#pac-evidence-text');
  const evidenceProgress = dialog.querySelector('#pac-evidence-progress');
  const messageOutput = dialog.querySelector('#pac-message');
  const floatingLabel = dialog.querySelector('#pac-floating-label');
  const liveStatus = dialog.querySelector('#pac-live-status');
  const resultKicker = dialog.querySelector('#pac-result-kicker');
  const resultTitle = dialog.querySelector('#pac-result-title');
  const resultCopy = dialog.querySelector('#pac-result-copy');
  const finalScore = dialog.querySelector('#pac-final-score');
  const bestScore = dialog.querySelector('#pac-best-score');
  const finalData = dialog.querySelector('#pac-final-data');
  const arcadeTitle = document.querySelector('#arcade-title');
  const pacCard = document.querySelector('[data-game-card="pac-facts"]');
  const reducedMotion = framework.isReducedMotion;

  const compactMaze = window.matchMedia('(max-width: 760px)').matches;
  const COLS = compactMaze ? 15 : 19;
  const ROWS = compactMaze ? 19 : 15;
  const STEP_TIME = reducedMotion ? 180 : 150;
  const EVIDENCE_TICKS = Math.round(7000 / STEP_TIME);
  const directions = {
    left: { x: -1, y: 0, opposite: 'right' },
    right: { x: 1, y: 0, opposite: 'left' },
    up: { x: 0, y: -1, opposite: 'down' },
    down: { x: 0, y: 1, opposite: 'up' }
  };

  const walls = new Set();
  const addWall = (x1, y1, x2, y2) => {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) walls.add(`${x},${y}`);
    }
  };
  addWall(0, 0, COLS - 1, 0);
  addWall(0, ROWS - 1, COLS - 1, ROWS - 1);
  addWall(0, 0, 0, ROWS - 1);
  addWall(COLS - 1, 0, COLS - 1, ROWS - 1);
  const wallSegments = compactMaze
    ? [[2, 2, 5, 2], [7, 2, 12, 2], [2, 4, 3, 4], [5, 4, 9, 4], [11, 4, 12, 4], [2, 6, 6, 6], [8, 6, 12, 6], [2, 8, 4, 8], [6, 8, 8, 8], [10, 8, 12, 8], [2, 10, 5, 10], [7, 10, 12, 10], [2, 12, 3, 12], [5, 12, 9, 12], [11, 12, 12, 12], [2, 14, 6, 14], [8, 14, 12, 14], [2, 16, 4, 16], [6, 16, 8, 16], [10, 16, 12, 16]]
    : [[2, 2, 5, 2], [7, 2, 11, 2], [13, 2, 16, 2], [2, 4, 3, 4], [5, 4, 8, 4], [10, 4, 13, 4], [15, 4, 16, 4], [2, 6, 6, 6], [8, 6, 10, 6], [12, 6, 16, 6], [2, 8, 4, 8], [6, 8, 8, 8], [10, 8, 12, 8], [14, 8, 16, 8], [2, 10, 6, 10], [8, 10, 10, 10], [12, 10, 16, 10], [2, 12, 4, 12], [6, 12, 12, 12], [14, 12, 16, 12]];
  wallSegments.forEach((segment) => addWall(...segment));

  const playerStart = compactMaze ? { x: 1, y: 17 } : { x: 1, y: 13 };
  const powerPositions = compactMaze
    ? [{ x: 1, y: 1 }, { x: 13, y: 1 }, { x: 1, y: 15 }, { x: 13, y: 17 }]
    : [{ x: 1, y: 1 }, { x: 17, y: 1 }, { x: 1, y: 11 }, { x: 17, y: 13 }];
  const specialLabels = new Map(compactMaze
    ? [['3,1', 'User insight'], ['11,1', 'Search data'], ['1,9', 'Support query'], ['13,9', 'Analytics'], ['3,17', 'Usability finding'], ['11,17', 'Accessibility issue']]
    : [['3,1', 'User insight'], ['15,1', 'Search data'], ['1,7', 'Support query'], ['17,7', 'Analytics'], ['3,13', 'Usability finding'], ['15,13', 'Accessibility issue']]);
  const enemyHomes = compactMaze
    ? [{ x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 11 }]
    : [{ x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 9 }];
  const enemyBlueprints = [
    { id: 'assumption', name: 'Assumption', phrase: 'Users will understand it.', glyph: '?', home: enemyHomes[0], moveEvery: 3 },
    { id: 'scope', name: 'Scope Creep', phrase: 'Just one more feature.', glyph: '++', home: enemyHomes[1], moveEvery: 4 },
    { id: 'dark', name: 'Dark Pattern', phrase: 'Accept all.', glyph: '»', home: enemyHomes[2], moveEvery: 3 },
    { id: 'hippo', name: 'HiPPO', phrase: 'I know what users want.', glyph: 'H', home: enemyHomes[3], moveEvery: 4 }
  ];

  const game = {
    status: 'idle', score: 0, lives: 3, tick: 0, data: new Set(), totalData: 0,
    evidenceTicks: 0, interval: null, recoveryTimer: null, labelTimer: null,
    currentDirection: 'right', pendingDirection: 'right', player: { ...playerStart },
    playerElement: null, enemies: [], dataNodes: new Map(), powerNodes: new Map()
  };
  let returnFocusTarget;
  let swipeStart = null;

  const keyFor = (x, y) => `${x},${y}`;
  const isWall = (x, y) => walls.has(keyFor(x, y));

  function switchScreen(name) {
    const labels = { instructions: 'pac-screen-title', playing: 'pac-playing-title', result: 'pac-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.pacScreen !== name; });
    dialog.dataset.activeScreen = name;
    dialog.setAttribute('aria-labelledby', labels[name]);
    requestAnimationFrame(() => {
      dialog.scrollTop = 0;
      dialog.querySelector('.arcade-screen')?.scrollTo(0, 0);
      screens.find((screen) => !screen.hidden)?.scrollTo(0, 0);
    });
  }

  function openGame(trigger) {
    returnFocusTarget = trigger;
    resetGame();
    switchScreen('instructions');
    document.body.classList.add('arcade-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.requestAnimationFrame(() => {
      if (!window.matchMedia('(pointer: coarse)').matches) startButton?.focus({ preventScroll: true });
    });
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
        pacCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) returnFocusTarget.focus({ preventScroll: true });
    });
  }

  function resetGame() {
    window.clearInterval(game.interval);
    window.clearTimeout(game.recoveryTimer);
    window.clearTimeout(game.labelTimer);
    Object.assign(game, {
      status: 'idle', score: 0, lives: 3, tick: 0, data: new Set(), totalData: 0,
      evidenceTicks: 0, interval: null, recoveryTimer: null, labelTimer: null,
      currentDirection: 'right', pendingDirection: 'right', player: { ...playerStart },
      playerElement: null, enemies: [], dataNodes: new Map(), powerNodes: new Map()
    });
    board.replaceChildren();
    board.classList.remove('is-evidence');
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    touchControls.inert = false;
    playfield.setAttribute('tabindex', '0');
    floatingLabel.classList.remove('is-visible');
    messageOutput.textContent = 'Collect every data point';
    messageOutput.className = '';
    updateHud();
  }

  function startGame() {
    resetGame();
    switchScreen('playing');
    buildMaze();
    game.status = 'playing';
    startLoop();
    updateHud();
    announce('Collect every data point. Avoid the four UX threats until Evidence Mode is active.');
    framework.playSound('select');
    playfield.focus({ preventScroll: true });
  }

  function buildMaze() {
    board.parentElement?.style.setProperty('--pac-cols', String(COLS));
    board.parentElement?.style.setProperty('--pac-rows', String(ROWS));
    board.style.setProperty('--pac-cols', String(COLS));
    board.style.setProperty('--pac-rows', String(ROWS));
    const reserved = new Set([keyFor(playerStart.x, playerStart.y), ...powerPositions.map(({ x, y }) => keyFor(x, y)), ...enemyBlueprints.map(({ home }) => keyFor(home.x, home.y))]);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const key = keyFor(x, y);
        if (isWall(x, y)) {
          const wall = document.createElement('i');
          wall.className = 'pac-wall';
          placeCell(wall, x, y);
          board.append(wall);
        } else if (!reserved.has(key) && (x + y) % 2 === 0) {
          const dot = document.createElement('i');
          dot.className = specialLabels.has(key) ? 'pac-data is-special' : 'pac-data';
          placeCell(dot, x, y);
          board.append(dot);
          game.data.add(key);
          game.dataNodes.set(key, dot);
        }
      }
    }

    powerPositions.forEach(({ x, y }) => {
      const power = document.createElement('i');
      power.className = 'pac-power';
      power.setAttribute('aria-hidden', 'true');
      placeCell(power, x, y);
      board.append(power);
      game.powerNodes.set(keyFor(x, y), power);
    });

    game.totalData = game.data.size;
    game.playerElement = document.createElement('div');
    game.playerElement.className = 'pac-player is-right is-moving';
    game.playerElement.innerHTML = '<i aria-hidden="true"></i>';
    board.append(game.playerElement);
    game.enemies = enemyBlueprints.map(createEnemy);
    renderActors();
  }

  function createEnemy(blueprint) {
    const element = document.createElement('div');
    element.className = `pac-enemy is-${blueprint.id}`;
    element.setAttribute('aria-hidden', 'true');
    element.innerHTML = `<span>${blueprint.glyph}</span><small>${blueprint.name}: “${blueprint.phrase}”</small>`;
    board.append(element);
    return { ...blueprint, x: blueprint.home.x, y: blueprint.home.y, direction: 'left', cooldown: 0, holdUntil: 0, tauntUntil: 0, element };
  }

  function placeCell(element, x, y) {
    element.style.gridColumn = String(x + 1);
    element.style.gridRow = String(y + 1);
  }

  function startLoop() {
    window.clearInterval(game.interval);
    game.interval = window.setInterval(stepGame, STEP_TIME);
  }

  function stepGame() {
    if (game.status !== 'playing') return;
    game.tick += 1;
    movePlayer();
    collectAtPlayer();
    checkCollisions();
    if (game.status !== 'playing') return;
    moveEnemies();
    checkCollisions();
    if (game.status !== 'playing') return;
    if (game.evidenceTicks > 0) game.evidenceTicks -= 1;
    board.classList.toggle('is-evidence', game.evidenceTicks > 0);
    renderActors();
    updateHud();
  }

  function movePlayer() {
    if (canMove(game.player.x, game.player.y, game.pendingDirection)) game.currentDirection = game.pendingDirection;
    const vector = directions[game.currentDirection];
    if (!vector || !canMove(game.player.x, game.player.y, game.currentDirection)) return;
    game.player.x += vector.x;
    game.player.y += vector.y;
  }

  function moveEnemies() {
    const cleared = game.totalData ? 1 - (game.data.size / game.totalData) : 0;
    game.enemies.forEach((enemy) => {
      enemy.element.classList.toggle('is-taunting', enemy.tauntUntil > game.tick);
      enemy.element.classList.toggle('is-blocking', enemy.holdUntil > game.tick);
      if (enemy.cooldown > 0) {
        enemy.cooldown -= 1;
        enemy.element.classList.add('is-returning');
        if (enemy.cooldown === 0) {
          enemy.x = enemy.home.x;
          enemy.y = enemy.home.y;
          enemy.element.classList.remove('is-returning');
        }
        return;
      }
      if (enemy.holdUntil > game.tick) return;
      const moveEvery = enemy.id === 'scope' ? (cleared > 0.72 ? 2 : cleared > 0.34 ? 3 : 4) : enemy.moveEvery;
      if (game.tick % moveEvery !== 0) return;
      const options = Object.keys(directions).filter((direction) => canMove(enemy.x, enemy.y, direction));
      if (!options.length) return;
      const withoutReverse = options.filter((direction) => direction !== directions[enemy.direction]?.opposite);
      const candidates = withoutReverse.length ? withoutReverse : options;
      let chosen;
      if (enemy.id === 'scope') chosen = candidates[Math.floor(Math.random() * candidates.length)];
      else {
        const target = enemy.id === 'dark'
          ? { x: game.player.x + (directions[game.currentDirection]?.x || 0) * 3, y: game.player.y + (directions[game.currentDirection]?.y || 0) * 3 }
          : game.player;
        chosen = [...candidates].sort((first, second) => distanceAfter(enemy, first, target) - distanceAfter(enemy, second, target))[0];
        if (enemy.id === 'assumption' && game.tick % 8 === 0 && candidates.length > 1) chosen = candidates[1];
      }
      enemy.direction = chosen;
      enemy.x += directions[chosen].x;
      enemy.y += directions[chosen].y;
      if (enemy.id === 'hippo' && candidates.length > 2 && game.tick % 31 === 0) {
        enemy.holdUntil = game.tick + 22;
        enemy.tauntUntil = game.tick + 22;
        showMessage('The HiPPO is blocking a route.', 'bad');
      } else if (game.tick % 73 === 0) enemy.tauntUntil = game.tick + 14;
    });
  }

  function distanceAfter(enemy, direction, target) {
    const vector = directions[direction];
    return Math.abs((enemy.x + vector.x) - target.x) + Math.abs((enemy.y + vector.y) - target.y);
  }

  function canMove(x, y, direction) {
    const vector = directions[direction];
    return Boolean(vector) && !isWall(x + vector.x, y + vector.y);
  }

  function setDirection(direction) {
    if (!directions[direction] || (game.status !== 'playing' && game.status !== 'recovering')) return;
    game.pendingDirection = direction;
  }

  function collectAtPlayer() {
    const key = keyFor(game.player.x, game.player.y);
    if (game.data.has(key)) {
      game.data.delete(key);
      game.dataNodes.get(key)?.remove();
      game.dataNodes.delete(key);
      const label = specialLabels.get(key);
      game.score += label ? 40 : 10;
      framework.playSound('select');
      if (label) showFloatingLabel(label);
      if (game.data.size === 0) finishGame(true);
    }
    if (game.powerNodes.has(key)) {
      game.powerNodes.get(key)?.remove();
      game.powerNodes.delete(key);
      game.evidenceTicks = EVIDENCE_TICKS;
      game.score += 100;
      showMessage('EVIDENCE MODE · challenge the threats', 'good');
      announce('Validated Insight collected. Evidence Mode active. UX threats are vulnerable.');
      framework.playSound('success');
    }
  }

  function checkCollisions() {
    const hit = game.enemies.find((enemy) => enemy.cooldown === 0 && enemy.x === game.player.x && enemy.y === game.player.y);
    if (!hit) return;
    if (game.evidenceTicks > 0) {
      hit.cooldown = 18;
      hit.element.classList.add('is-returning');
      game.score += 300;
      showMessage(`${hit.name} challenged · +300`, 'good');
      announce(`${hit.name} challenged with evidence and returned to review.`);
      framework.playSound('good');
      return;
    }
    loseLife(hit);
  }

  function loseLife(enemy) {
    if (game.status !== 'playing') return;
    game.status = 'recovering';
    window.clearInterval(game.interval);
    game.interval = null;
    game.lives -= 1;
    game.playerElement?.classList.add('is-hit');
    showMessage(`${enemy.name} caught the journey`, 'bad');
    announce(`${enemy.name} caught Stephen. ${game.lives} lives remaining.`);
    framework.playSound('bad');
    updateHud();
    if (game.lives <= 0) {
      game.recoveryTimer = window.setTimeout(() => finishGame(false), 700);
      return;
    }
    game.recoveryTimer = window.setTimeout(() => {
      if (!dialog.open || game.status !== 'recovering') return;
      resetPositions();
      game.status = 'playing';
      startLoop();
      playfield.focus({ preventScroll: true });
    }, 900);
  }

  function resetPositions() {
    game.player = { ...playerStart };
    game.currentDirection = 'right';
    game.pendingDirection = 'right';
    game.playerElement?.classList.remove('is-hit');
    game.enemies.forEach((enemy) => {
      enemy.x = enemy.home.x;
      enemy.y = enemy.home.y;
      enemy.cooldown = 8;
      enemy.holdUntil = 0;
      enemy.tauntUntil = 0;
      enemy.element.classList.remove('is-blocking', 'is-taunting');
      enemy.element.classList.add('is-returning');
    });
    renderActors();
  }

  function renderActors() {
    renderActor(game.playerElement, game.player.x, game.player.y);
    if (game.playerElement) {
      game.playerElement.className = `pac-player is-${game.currentDirection} is-moving${game.status === 'recovering' ? ' is-hit' : ''}`;
    }
    game.enemies.forEach((enemy) => renderActor(enemy.element, enemy.x, enemy.y));
  }

  function renderActor(element, x, y) {
    if (!element) return;
    element.style.left = `${((x + 0.5) / COLS) * 100}%`;
    element.style.top = `${((y + 0.5) / ROWS) * 100}%`;
  }

  function updateHud() {
    scoreOutput.textContent = framework.formatScore(game.score);
    remainingOutput.textContent = String(game.data.size);
    livesOutput.textContent = `${game.lives}/3`;
    const evidenceMs = Math.max(0, game.evidenceTicks * STEP_TIME);
    evidenceProgress.max = EVIDENCE_TICKS * STEP_TIME;
    evidenceProgress.value = evidenceMs;
    evidenceProgress.textContent = evidenceMs > 0 ? `${Math.ceil(evidenceMs / 1000)} seconds of Evidence Mode remaining` : 'Evidence Mode inactive';
    evidenceText.textContent = evidenceMs > 0 ? `${Math.ceil(evidenceMs / 1000)}s` : 'Ready';
  }

  function showFloatingLabel(label) {
    floatingLabel.textContent = label;
    floatingLabel.style.left = `${((game.player.x + 0.5) / COLS) * 100}%`;
    floatingLabel.style.top = `${((game.player.y + 0.5) / ROWS) * 100}%`;
    floatingLabel.classList.remove('is-visible');
    void floatingLabel.offsetWidth;
    floatingLabel.classList.add('is-visible');
    window.clearTimeout(game.labelTimer);
    game.labelTimer = window.setTimeout(() => floatingLabel.classList.remove('is-visible'), 950);
  }

  function showMessage(message, tone) {
    messageOutput.textContent = message;
    messageOutput.className = tone ? `is-${tone}` : '';
  }

  function pauseGame() {
    if (game.status !== 'playing') return;
    game.status = 'paused';
    window.clearInterval(game.interval);
    game.interval = null;
    pausePanel.hidden = false;
    touchControls.inert = true;
    playfield.setAttribute('tabindex', '-1');
    announce('Game paused.');
    window.requestAnimationFrame(() => resumeButton?.focus());
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = 'playing';
    pausePanel.hidden = true;
    touchControls.inert = false;
    playfield.setAttribute('tabindex', '0');
    startLoop();
    announce('Game resumed.');
    playfield.focus({ preventScroll: true });
  }

  function finishGame(completed) {
    if (game.status === 'ended' || game.status === 'idle') return;
    window.clearInterval(game.interval);
    window.clearTimeout(game.recoveryTimer);
    game.interval = null;
    game.status = 'ended';
    const collected = game.totalData - game.data.size;
    const saved = framework.saveGameProgress('pac-facts', game.score, completed);
    resultKicker.textContent = completed ? 'Maze cleared' : 'Journey blocked';
    resultTitle.textContent = completed ? 'The journey has evidence.' : 'Opinion won this round.';
    resultCopy.textContent = completed
      ? 'You collected the facts, challenged the assumptions and reached the user goal.'
      : `You collected ${collected} data points before the UX threats took over. The evidence is still in the maze.`;
    finalScore.textContent = framework.formatScore(game.score);
    bestScore.textContent = framework.formatScore(saved.best);
    finalData.textContent = String(collected);
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

  document.querySelectorAll('[data-open-game="pac-facts"]').forEach((button) => {
    button.addEventListener('click', () => openGame(button));
  });
  dialog.querySelectorAll('[data-pac-exit]').forEach((button) => button.addEventListener('click', framework.exitArcade));
  startButton?.addEventListener('click', () => framework.startCountdown(dialog, startGame));
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-pac-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-pac-choose]')?.addEventListener('click', framework.exitArcade);
  dialog.querySelectorAll('[data-pac-direction]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      setDirection(button.dataset.pacDirection);
    });
    button.addEventListener('click', () => setDirection(button.dataset.pacDirection));
  });

  board.addEventListener('pointerdown', (event) => {
    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    board.setPointerCapture?.(event.pointerId);
  });
  board.addEventListener('pointerup', (event) => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  board.addEventListener('pointercancel', () => { swipeStart = null; });

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
      event.preventDefault();
      if (game.status === 'playing') pauseGame();
      else if (game.status === 'paused') resumeGame();
      return;
    }
    if (game.status !== 'playing' && game.status !== 'recovering') return;
    const direction = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down' }[key];
    if (!direction) return;
    event.preventDefault();
    setDirection(direction);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && game.status === 'playing') pauseGame();
  });
})();
