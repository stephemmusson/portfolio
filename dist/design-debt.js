(() => {
  const dialog = document.querySelector('#debt-dialog');
  const framework = window.UXArcade;
  if (!dialog || !framework) return;

  const COLS = 8;
  const ROWS = 13;
  const START_DEBT = 8;
  const familyDefinitions = [
    { id: 'button', name: 'Button', icon: '', code: 'BT', colour: '#59cdf2' },
    { id: 'field', name: 'Form field', icon: '', code: 'IN', colour: '#60d49d' },
    { id: 'card', name: 'Card', icon: '', code: 'CR', colour: '#f5ef50' },
    { id: 'nav', name: 'Navigation', icon: '', code: 'NV', colour: '#9d72f7' },
    { id: 'modal', name: 'Modal', icon: '', code: 'MD', colour: '#ff7065' },
    { id: 'alert', name: 'Alert', icon: '', code: 'AL', colour: '#ff9fc8' },
    { id: 'accordion', name: 'Accordion', icon: '', code: 'AC', colour: '#ffad3d' },
    { id: 'search', name: 'Search', icon: '', code: 'SR', colour: '#61e6db' },
    { id: 'icon', name: 'Icon', icon: '', code: 'IC', colour: '#b6f25e' },
    { id: 'image', name: 'Image', icon: '', code: 'IM', colour: '#86a9ff' }
  ];
  const problemNames = [
    'Duplicate button style', 'Unlabelled form field', 'Mystery icon', 'Intrusive modal',
    'Nested accordion', 'Unnecessary carousel', 'Inconsistent navigation item', 'Urgent custom component'
  ];
  const rotationOffsets = [
    [{ x: 0, y: 0 }, { x: 0, y: -1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: -1, y: 0 }]
  ];
  const familyGlyphs = {
    button: '<rect x="3" y="7" width="18" height="10"/><line x1="7" y1="12" x2="17" y2="12"/>',
    field: '<rect x="3" y="5" width="18" height="14"/><line x1="7" y1="9" x2="7" y2="15"/><line x1="11" y1="12" x2="17" y2="12"/>',
    card: '<rect x="5" y="3" width="14" height="18"/><rect x="8" y="6" width="8" height="5"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="8" y1="18" x2="14" y2="18"/>',
    nav: '<line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><rect x="3" y="4" width="2" height="2"/><rect x="3" y="10" width="2" height="2"/><rect x="3" y="16" width="2" height="2"/>',
    modal: '<rect x="3" y="4" width="18" height="16"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="16" y1="5" x2="19" y2="7"/><line x1="19" y1="5" x2="16" y2="7"/>',
    alert: '<path d="M12 3L21 20H3Z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="18"/>',
    accordion: '<rect x="3" y="4" width="18" height="5"/><rect x="3" y="15" width="18" height="5"/><polyline points="16,6 18,8 20,6"/><polyline points="16,18 18,16 20,18"/>',
    search: '<rect x="4" y="4" width="12" height="12"/><line x1="15" y1="15" x2="21" y2="21"/>',
    icon: '<path d="M12 3L15 9L21 10L17 15L18 21L12 18L6 21L7 15L3 10L9 9Z"/>',
    image: '<rect x="3" y="4" width="18" height="16"/><polyline points="5,17 10,12 13,15 16,11 20,17"/><rect x="7" y="7" width="2" height="2"/>'
  };

  const screens = [...dialog.querySelectorAll('[data-debt-screen]')];
  const startButton = dialog.querySelector('[data-debt-start]');
  const pauseButton = dialog.querySelector('[data-debt-pause]');
  const resumeButton = dialog.querySelector('[data-debt-resume]');
  const pausePanel = dialog.querySelector('[data-debt-pause-panel]');
  const playfield = dialog.querySelector('#debt-playfield');
  const boardElement = dialog.querySelector('#debt-board');
  const nextElement = dialog.querySelector('#debt-next');
  const stephenElement = dialog.querySelector('.debt-stephen');
  const touchControls = dialog.querySelector('[data-debt-touch-controls]');
  const feedback = dialog.querySelector('#debt-feedback');
  const liveStatus = dialog.querySelector('#debt-live-status');
  const scoreOutput = dialog.querySelector('#debt-score');
  const levelOutput = dialog.querySelector('#debt-level');
  const patternsOutput = dialog.querySelector('#debt-patterns');
  const debtOutput = dialog.querySelector('#debt-meter-text');
  const debtProgress = dialog.querySelector('#debt-meter-progress');
  const finalScore = dialog.querySelector('#debt-final-score');
  const bestScore = dialog.querySelector('#debt-best-score');
  const finalPatterns = dialog.querySelector('#debt-final-patterns');
  const finalProblems = dialog.querySelector('#debt-final-problems');
  const finalChain = dialog.querySelector('#debt-final-chain');
  const finalLevel = dialog.querySelector('#debt-final-level');
  const resultTitle = dialog.querySelector('#debt-result-title');
  const arcadeTitle = document.querySelector('#arcade-title');
  const debtCard = document.querySelector('[data-game-card="design-debt"]');
  const reducedMotion = framework.isReducedMotion;
  let returnFocusTarget = null;
  let controlTimer = null;
  let tileSequence = 0;

  const game = {
    status: 'idle', board: [], piece: null, nextPair: null, score: 0, debt: START_DEBT,
    level: 1, patterns: 0, problemsRemoved: 0, largestChain: 0, placements: 0,
    placementsSinceClear: 0, lastClearAt: 0, startedAt: 0, lastFrame: 0,
    fallAccumulator: 0, passiveAccumulator: 0, frame: null, softDrop: false, pauseRequested: false
  };

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function switchScreen(name) {
    const labels = { instructions: 'debt-screen-title', playing: 'debt-playing-title', result: 'debt-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.debtScreen !== name; });
    dialog.dataset.activeScreen = name;
    dialog.setAttribute('aria-labelledby', labels[name]);
    requestAnimationFrame(() => {
      dialog.scrollTop = 0;
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
    requestAnimationFrame(() => {
      if (!window.matchMedia('(pointer: coarse)').matches) startButton?.focus({ preventScroll: true });
    });
    framework.playSound('open');
    framework.trackGameOpen('design-debt');
  }

  function closeGame(focusCards = false) {
    framework.trackGameExit('design-debt', game.score);
    resetGame();
    document.body.classList.remove('arcade-open');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    requestAnimationFrame(() => {
      if (focusCards && arcadeTitle) {
        arcadeTitle.setAttribute('tabindex', '-1');
        arcadeTitle.focus({ preventScroll: true });
        debtCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) returnFocusTarget.focus({ preventScroll: true });
    });
  }

  function resetGame() {
    window.cancelAnimationFrame(game.frame);
    window.clearInterval(controlTimer);
    controlTimer = null;
    Object.assign(game, {
      status: 'idle', board: emptyBoard(), piece: null, nextPair: null, score: 0, debt: START_DEBT,
      level: 1, patterns: 0, problemsRemoved: 0, largestChain: 0, placements: 0,
      placementsSinceClear: 0, lastClearAt: performance.now(), startedAt: 0, lastFrame: 0,
      fallAccumulator: 0, passiveAccumulator: 0, frame: null, softDrop: false, pauseRequested: false
    });
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    touchControls.inert = false;
    feedback.textContent = 'Create consistent patterns';
    feedback.className = 'debt-feedback';
    render();
    updateHud();
  }

  function activeFamilyCount() {
    return Math.min(familyDefinitions.length, 4 + Math.floor((game.level - 1) / 2));
  }

  function createTile(allowProblem = true) {
    const family = familyDefinitions[Math.floor(Math.random() * activeFamilyCount())];
    const problemChance = game.level < 2 || !allowProblem ? 0 : Math.min(0.2, 0.045 + (game.level * 0.018));
    const problem = Math.random() < problemChance;
    return {
      id: ++tileSequence,
      family: family.id,
      icon: family.icon,
      code: family.code,
      name: family.name,
      colour: family.colour,
      problem,
      problemName: problem ? problemNames[Math.floor(Math.random() * problemNames.length)] : ''
    };
  }

  function createPair() {
    const first = createTile();
    let second = createTile();
    let attempts = 0;
    while (second.family === first.family && attempts < 4) {
      second = createTile();
      attempts += 1;
    }
    return [first, second];
  }

  function spawnPiece() {
    const tiles = game.nextPair || createPair();
    game.nextPair = createPair();
    game.piece = { x: Math.floor(COLS / 2) - 1, y: 1, rotation: 0, tiles };
    renderNext();
    animateThrow();
    if (!canPlace(game.piece.x, game.piece.y, game.piece.rotation)) {
      finishGame();
      return false;
    }
    return true;
  }

  function pieceCells(x = game.piece.x, y = game.piece.y, rotation = game.piece.rotation) {
    return rotationOffsets[rotation].map((offset, index) => ({
      x: x + offset.x, y: y + offset.y, tile: game.piece.tiles[index]
    }));
  }

  function canPlace(x, y, rotation) {
    return pieceCells(x, y, rotation).every((cell) => (
      cell.x >= 0 && cell.x < COLS && cell.y < ROWS && (cell.y < 0 || !game.board[cell.y][cell.x])
    ));
  }

  function move(dx) {
    if (game.status !== 'playing' || !game.piece) return;
    if (canPlace(game.piece.x + dx, game.piece.y, game.piece.rotation)) {
      game.piece.x += dx;
      render();
      framework.playSound('select');
    }
  }

  function rotate() {
    if (game.status !== 'playing' || !game.piece) return;
    const nextRotation = (game.piece.rotation + 1) % rotationOffsets.length;
    const kick = [0, -1, 1].find((shift) => canPlace(game.piece.x + shift, game.piece.y, nextRotation));
    if (kick === undefined) {
      framework.playSound('bad');
      return;
    }
    game.piece.rotation = nextRotation;
    game.piece.x += kick;
    render();
    framework.playSound('select');
  }

  function dropStep(manual = false) {
    if (game.status !== 'playing' || !game.piece) return;
    if (canPlace(game.piece.x, game.piece.y + 1, game.piece.rotation)) {
      game.piece.y += 1;
      if (manual) game.score += 1;
      render();
      updateHud();
      return;
    }
    lockPiece();
  }

  async function lockPiece() {
    if (game.status !== 'playing' || !game.piece) return;
    const cells = pieceCells();
    if (cells.some((cell) => cell.y < 0)) {
      finishGame();
      return;
    }
    cells.forEach(({ x, y, tile }) => { game.board[y][x] = tile; });
    game.piece = null;
    game.status = 'resolving';
    game.placements += 1;
    game.placementsSinceClear += 1;
    const chainCount = await resolveMatches();
    if (game.status === 'ended' || game.status === 'idle') return;
    if (!chainCount) increaseDebt(debtFromPlacement());
    else game.placementsSinceClear = 0;
    if (game.debt >= 100) {
      finishGame();
      return;
    }
    game.status = 'playing';
    spawnPiece();
    render();
    updateHud();
    if (game.pauseRequested || document.hidden) {
      game.pauseRequested = false;
      pauseGame();
    }
  }

  function debtFromPlacement() {
    let highest = ROWS;
    let problems = 0;
    game.board.forEach((row, y) => row.forEach((tile) => {
      if (!tile) return;
      highest = Math.min(highest, y);
      if (tile.problem) problems += 1;
    }));
    const heightPressure = highest < 5 ? (5 - highest) * 1.4 : 0;
    return 2.4 + Math.min(5, game.placementsSinceClear * 0.45) + heightPressure + Math.min(3, problems * 0.4);
  }

  function increaseDebt(amount) {
    game.debt = Math.min(100, game.debt + amount);
    if (game.debt >= 72) setFeedback('Design debt increasing', 'is-warning');
    updateHud();
  }

  function connectedGroup(startX, startY, visited) {
    const first = game.board[startY][startX];
    const group = [];
    const queue = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);
    while (queue.length) {
      const current = queue.shift();
      group.push(current);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const x = current.x + dx;
        const y = current.y + dy;
        const key = `${x},${y}`;
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || visited.has(key)) return;
        const tile = game.board[y][x];
        if (!tile || tile.family !== first.family) return;
        visited.add(key);
        queue.push({ x, y });
      });
    }
    return group;
  }

  function findMatches() {
    const visited = new Set();
    const matches = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!game.board[y][x] || visited.has(`${x},${y}`)) continue;
        const group = connectedGroup(x, y, visited);
        if (group.length >= 4) matches.push(group);
      }
    }
    return matches;
  }

  async function resolveMatches() {
    let chain = 0;
    let totalGroups = 0;
    while (game.status === 'resolving') {
      const matches = findMatches();
      if (!matches.length) break;
      chain += 1;
      totalGroups += matches.length;
      game.largestChain = Math.max(game.largestChain, chain);
      const keys = new Set(matches.flat().map(({ x, y }) => `${x},${y}`));
      render(keys);
      await delay(reducedMotion ? 20 : 210);
      let cleared = 0;
      let problems = 0;
      keys.forEach((key) => {
        const [x, y] = key.split(',').map(Number);
        const tile = game.board[y][x];
        if (!tile) return;
        cleared += 1;
        if (tile.problem) problems += 1;
        game.board[y][x] = null;
      });
      matches.forEach(() => { game.patterns += 1; });
      game.problemsRemoved += problems;
      const sizeBonus = Math.max(0, cleared - (matches.length * 4)) * 5;
      game.score += (cleared * 10 * chain) + sizeBonus + (problems * 100);
      game.debt = Math.max(0, game.debt - (cleared * 1.8) - (chain * 4) - (problems * 7));
      game.lastClearAt = performance.now();
      updateLevel();
      setFeedback(feedbackFor(chain, cleared, problems), problems ? 'is-problem' : 'is-good');
      framework.playSound(chain > 1 ? 'success' : 'good');
      applyGravity();
      render();
      updateHud();
      await delay(reducedMotion ? 10 : 130);
    }
    return totalGroups ? chain : 0;
  }

  function feedbackFor(chain, cleared, problems) {
    if (problems) return 'Inconsistency removed';
    if (chain >= 4) return 'System thinking';
    if (chain === 3) return 'Design system';
    if (chain === 2) return 'Reusable pattern';
    if (cleared >= 7) return 'Reusable component';
    return 'Pattern created';
  }

  function applyGravity() {
    for (let x = 0; x < COLS; x += 1) {
      const tiles = [];
      for (let y = ROWS - 1; y >= 0; y -= 1) if (game.board[y][x]) tiles.push(game.board[y][x]);
      for (let y = ROWS - 1; y >= 0; y -= 1) game.board[y][x] = tiles[ROWS - 1 - y] || null;
    }
  }

  function updateLevel() {
    const nextLevel = Math.min(12, 1 + Math.floor(game.patterns / 5));
    if (nextLevel <= game.level) return;
    game.level = nextLevel;
    game.score += 250;
    game.debt = Math.max(0, game.debt - 10);
    setFeedback('Consistency bonus +250', 'is-good');
  }

  function fallDelay() {
    const elapsedBoost = Math.floor((performance.now() - game.startedAt) / 20000) * 45;
    return Math.max(140, 680 - ((game.level - 1) * 75) - elapsedBoost);
  }

  function runFrame(now) {
    if (game.status === 'playing') {
      const delta = Math.min(80, now - (game.lastFrame || now));
      game.fallAccumulator += delta;
      game.passiveAccumulator += delta;
      const interval = game.softDrop ? 70 : fallDelay();
      if (game.fallAccumulator >= interval) {
        game.fallAccumulator = 0;
        dropStep(game.softDrop);
      }
      if (game.passiveAccumulator >= 1000) {
        game.passiveAccumulator = 0;
        if (now - game.lastClearAt > 8000) increaseDebt(0.65 + (game.level * 0.05));
        if (game.debt >= 100) finishGame();
      }
    }
    game.lastFrame = now;
    if (game.status !== 'idle' && game.status !== 'ended') game.frame = requestAnimationFrame(runFrame);
  }

  function startGame() {
    resetGame();
    switchScreen('playing');
    game.status = 'playing';
    game.startedAt = performance.now();
    framework.trackGameStart('design-debt');
    game.lastClearAt = game.startedAt;
    game.nextPair = createPair();
    spawnPiece();
    game.frame = requestAnimationFrame(runFrame);
    setFeedback('Four component families active');
    announce('Create groups of four matching colours and icons. Keep design debt below one hundred percent.');
    playfield.focus({ preventScroll: true });
    framework.playSound('select');
  }

  function pauseGame() {
    if (game.status === 'resolving') {
      game.pauseRequested = true;
      return;
    }
    if (game.status !== 'playing') return;
    game.status = 'paused';
    pausePanel.hidden = false;
    pauseButton.disabled = true;
    touchControls.inert = true;
    framework.playSound('select');
    resumeButton?.focus({ preventScroll: true });
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = 'playing';
    game.lastFrame = performance.now();
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    touchControls.inert = false;
    framework.playSound('select');
    playfield.focus({ preventScroll: true });
  }

  function finishGame() {
    if (game.status === 'ended' || game.status === 'idle') return;
    game.status = 'ended';
    window.cancelAnimationFrame(game.frame);
    window.clearInterval(controlTimer);
    const completed = game.patterns >= 6;
    const saved = framework.saveGameProgress('design-debt', game.score, completed);
    framework.trackGameEnd('design-debt', {
      result: completed ? 'completed' : 'failed',
      score: game.score,
      patterns_created: game.patterns,
      level: game.level
    });
    resultTitle.textContent = game.debt >= 100 ? 'The product became unmanageable.' : 'The component grid reached the top.';
    finalScore.textContent = framework.formatScore(game.score);
    bestScore.textContent = framework.formatScore(saved.best);
    finalPatterns.textContent = String(game.patterns);
    finalProblems.textContent = String(game.problemsRemoved);
    finalChain.textContent = String(game.largestChain);
    finalLevel.textContent = String(game.level);
    switchScreen('result');
    framework.playSound('fail');
    requestAnimationFrame(() => {
      resultTitle.setAttribute('tabindex', '-1');
      resultTitle.focus();
      resultTitle.addEventListener('blur', () => resultTitle.removeAttribute('tabindex'), { once: true });
    });
  }

  function tileElement(tile, active = false, clearing = false) {
    const element = document.createElement('i');
    element.className = `debt-tile${active ? ' is-active' : ''}${tile.problem ? ' is-problem' : ''}${clearing ? ' is-clearing' : ''}`;
    element.style.setProperty('--tile-colour', tile.colour);
    element.dataset.family = tile.family;
    const icon = document.createElement('span');
    const code = document.createElement('span');
    icon.className = 'debt-tile-icon has-svg';
    code.className = 'debt-tile-code';
    icon.innerHTML = `<svg class="debt-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${familyGlyphs[tile.family] || familyGlyphs.icon}</svg>`;
    code.textContent = tile.code;
    element.append(icon, code);
    element.title = tile.problem ? `${tile.problemName}; match with ${tile.name}` : tile.name;
    element.setAttribute('aria-hidden', 'true');
    return element;
  }

  function render(clearingKeys = new Set()) {
    const fragment = document.createDocumentFragment();
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = document.createElement('span');
        cell.className = 'debt-cell';
        const tile = game.board[y]?.[x];
        if (tile) cell.append(tileElement(tile, false, clearingKeys.has(`${x},${y}`)));
        fragment.append(cell);
      }
    }
    boardElement.replaceChildren(fragment);
    if (game.piece) {
      pieceCells().forEach(({ x, y, tile }) => {
        if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return;
        boardElement.children[(y * COLS) + x]?.append(tileElement(tile, true));
      });
    }
    const occupied = game.board.flat().filter(Boolean).length;
    boardElement.setAttribute('aria-label', `Component grid with ${occupied} placed tiles. Design debt ${Math.round(game.debt)} percent.`);
  }

  function renderNext() {
    nextElement.replaceChildren();
    (game.nextPair || []).forEach((tile) => nextElement.append(tileElement(tile)));
  }

  function animateThrow() {
    if (reducedMotion || !stephenElement) return;
    nextElement.classList.remove('is-tossing');
    stephenElement.classList.remove('is-throwing');
    void nextElement.offsetWidth;
    nextElement.classList.add('is-tossing');
    stephenElement.classList.add('is-throwing');
    window.setTimeout(() => {
      nextElement.classList.remove('is-tossing');
      stephenElement.classList.remove('is-throwing');
    }, 420);
  }

  function updateHud() {
    scoreOutput.textContent = framework.formatScore(game.score);
    levelOutput.textContent = String(game.level);
    patternsOutput.textContent = String(game.patterns);
    const roundedDebt = Math.round(game.debt);
    debtOutput.textContent = `${roundedDebt}%`;
    debtProgress.value = roundedDebt;
    debtProgress.textContent = `${roundedDebt}% design debt`;
    debtProgress.setAttribute('aria-label', `Design debt ${roundedDebt} percent`);
  }

  function setFeedback(message, modifier = '') {
    feedback.textContent = message;
    feedback.className = `debt-feedback ${modifier}`.trim();
  }

  function announce(message) {
    liveStatus.textContent = '';
    requestAnimationFrame(() => { liveStatus.textContent = message; });
  }

  function delay(duration) {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  function runControl(action) {
    if (action === 'left') move(-1);
    else if (action === 'right') move(1);
    else if (action === 'rotate') rotate();
    else if (action === 'drop') dropStep(true);
  }

  function bindTouchControl(button) {
    const action = button.dataset.debtControl;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      runControl(action);
      if (action !== 'rotate') controlTimer = window.setInterval(() => runControl(action), action === 'drop' ? 75 : 135);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((eventName) => {
      button.addEventListener(eventName, () => {
        window.clearInterval(controlTimer);
        controlTimer = null;
      });
    });
  }

  document.querySelectorAll('[data-open-game="design-debt"]').forEach((button) => {
    button.addEventListener('click', () => openGame(button));
  });
  dialog.querySelectorAll('[data-debt-exit]').forEach((button) => button.addEventListener('click', framework.exitArcade));
  startButton?.addEventListener('click', () => framework.startCountdown(dialog, startGame));
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-debt-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-debt-choose]')?.addEventListener('click', framework.exitArcade);
  dialog.querySelectorAll('[data-debt-control]').forEach(bindTouchControl);

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (game.status === 'playing' || game.status === 'resolving') pauseGame();
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
      if (game.status === 'playing' || game.status === 'resolving') pauseGame();
      else if (game.status === 'paused') resumeGame();
      return;
    }
    if (game.status !== 'playing') return;
    if (key === 'arrowleft' && !event.repeat) { event.preventDefault(); move(-1); }
    else if (key === 'arrowright' && !event.repeat) { event.preventDefault(); move(1); }
    else if (key === ' ' && !event.repeat) { event.preventDefault(); rotate(); }
    else if (key === 'arrowdown') { event.preventDefault(); game.softDrop = true; }
  });
  document.addEventListener('keyup', (event) => {
    if (!dialog.open) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowdown') game.softDrop = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && (game.status === 'playing' || game.status === 'resolving')) pauseGame();
  });

  resetGame();
})();
