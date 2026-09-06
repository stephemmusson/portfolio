(() => {
  const dialog = document.querySelector('#captcha-dialog');
  const framework = window.UXArcade;
  if (!dialog || !framework) return;

  const screens = [...dialog.querySelectorAll('[data-captcha-screen]')];
  const startButton = dialog.querySelector('[data-captcha-start]');
  const pauseButton = dialog.querySelector('[data-captcha-pause]');
  const resumeButton = dialog.querySelector('[data-captcha-resume]');
  const pausePanel = dialog.querySelector('[data-captcha-pause-panel]');
  const playfield = dialog.querySelector('#captcha-playfield');
  const viewport = dialog.querySelector('#captcha-world-viewport');
  const world = dialog.querySelector('#captcha-world');
  const platformLayer = dialog.querySelector('#captcha-platform-layer');
  const obstacleLayer = dialog.querySelector('#captcha-obstacle-layer');
  const coinLayer = dialog.querySelector('#captcha-coin-layer');
  const gateLayer = dialog.querySelector('#captcha-gate-layer');
  const checkLayer = dialog.querySelector('#captcha-check-layer');
  const player = dialog.querySelector('#captcha-player');
  const touchControls = dialog.querySelector('[data-captcha-touch-controls]');
  const checkpointOverlay = dialog.querySelector('[data-human-checkpoint]');
  const checkpointStage = dialog.querySelector('#human-checkpoint-stage');
  const checkpointTitle = dialog.querySelector('#human-checkpoint-title');
  const checkpointIntro = dialog.querySelector('#human-checkpoint-intro');
  const checkpointBody = dialog.querySelector('#human-checkpoint-body');
  const checkpointFeedback = dialog.querySelector('#human-checkpoint-feedback');
  const missionOutput = dialog.querySelector('#captcha-mission-text');
  const scoreOutput = dialog.querySelector('#captcha-score');
  const checksOutput = dialog.querySelector('#captcha-checks');
  const obstaclesOutput = dialog.querySelector('#captcha-obstacles');
  const patienceOutput = dialog.querySelector('#captcha-patience');
  const progressOutput = dialog.querySelector('#captcha-progress');
  const progressText = dialog.querySelector('#captcha-progress-text');
  const timeOutput = dialog.querySelector('#captcha-time');
  const liveStatus = dialog.querySelector('#captcha-live-status');
  const resultKicker = dialog.querySelector('#captcha-result-kicker');
  const resultTitle = dialog.querySelector('#captcha-result-title');
  const resultCopy = dialog.querySelector('#captcha-result-copy');
  const finalScore = dialog.querySelector('#captcha-final-score');
  const bestScore = dialog.querySelector('#captcha-best-score');
  const finalChecks = dialog.querySelector('#captcha-final-checks');
  const arcadeTitle = document.querySelector('#arcade-title');
  const captchaCard = document.querySelector('[data-game-card="captcha-boss"]');
  const reducedMotion = framework.isReducedMotion;

  const WORLD_WIDTH = 3020;
  const FINISH_X = 2920;
  const PLAYER_WIDTH = 34;
  const PLAYER_HEIGHT = 48;
  const SESSION_DURATION = 90000;
  const MOVE_SPEED = 300;
  const JUMP_SPEED = 740;
  const GRAVITY = 1750;
  const JUMP_BUFFER = 180;

  const platformBlueprint = [
    { id: 'ground-1', x: 0, width: 600, bottom: 0, height: 40, kind: 'ground' },
    { id: 'ground-2a', x: 600, width: 100, bottom: 0, height: 40, kind: 'ground' },
    { id: 'faded-bridge', x: 700, width: 150, bottom: 72, height: 20, kind: 'faded', label: '1.8:1' },
    { id: 'ground-2b', x: 850, width: 310, bottom: 0, height: 40, kind: 'ground' },
    { id: 'ground-3', x: 1160, width: 580, bottom: 0, height: 40, kind: 'ground' },
    { id: 'ground-4a', x: 1740, width: 70, bottom: 0, height: 40, kind: 'ground' },
    { id: 'image-step-1', x: 1810, width: 105, bottom: 62, height: 28, kind: 'tile', tile: 3 },
    { id: 'image-step-2', x: 1925, width: 105, bottom: 108, height: 28, kind: 'tile', tile: 4, fragile: true },
    { id: 'image-step-3', x: 2040, width: 105, bottom: 62, height: 28, kind: 'tile', tile: 7 },
    { id: 'ground-4b', x: 2145, width: 175, bottom: 0, height: 40, kind: 'ground' },
    { id: 'ground-5', x: 2320, width: 700, bottom: 0, height: 40, kind: 'ground' }
  ];

  const obstacleBlueprint = [
    { id: 'popup', type: 'popup', x: 320, width: 108, bottom: 40, height: 76, clearAt: 452, label: 'Pop-up', vaultable: true, hitInset: 8 },
    { id: 'faded-platform', type: 'platform', clearAt: 865, label: 'Faded platform' },
    { id: 'cookie', type: 'cookie', x: 1390, width: 142, bottom: 40, height: 48, clearAt: 1560, label: 'Cookie banner', vaultable: true, hitInset: 14 },
    { id: 'image-platforms', type: 'platform', clearAt: 2160, label: 'Unstable image tiles' },
    { id: 'verify', type: 'moving', x: 2490, width: 88, bottom: 40, height: 56, clearAt: 2670, label: 'Moving Verify button', range: 74, vaultable: true, hitInset: 8 }
  ];

  const gateBlueprint = [
    { x: 560, label: 'Portraits' },
    { x: 1120, label: 'Letters' },
    { x: 1680, label: 'Traffic lights' },
    { x: 2260, label: 'Bicycles' },
    { x: 2820, label: 'Final check' }
  ];

  const checkpointBlueprint = [
    {
      kind: 'portraits',
      title: 'Select the one human.',
      intro: 'The robots have adopted glasses, beards and several unhelpful labels.',
      correct: [7]
    },
    {
      kind: 'code',
      title: 'Type what you see.',
      intro: 'The letters have been made less readable for security.',
      code: 'UX42'
    },
    {
      kind: 'images',
      title: 'Select all traffic lights.',
      intro: 'Three tiles contain the same traffic light from slightly different crops.',
      sources: [3, 0, 4, 3, 8, 1, 7, 2, 3],
      correct: [0, 3, 8]
    },
    {
      kind: 'images',
      title: 'Select every bicycle.',
      intro: 'The extra blur is apparently important.',
      sources: [7, 4, 7, 0, 8, 7, 3, 2, 7],
      correct: [0, 2, 5, 8],
      blurry: true
    },
    {
      kind: 'final',
      title: 'Complete all verification methods.',
      intro: 'One test was no longer considered sufficient.',
      sources: [3, 7, 4, 0, 3, 2, 7, 8, 3],
      correct: [0, 1, 4, 6, 8],
      code: 'HUMAN'
    }
  ];

  const game = {
    status: 'idle', resumeState: 'playing', x: 60, y: 40, velocityY: 0,
    grounded: true, facing: 1, cameraX: 0, checkpointX: 60,
    checks: 0, obstaclesCleared: 0, patience: 3, score: 0, errors: 0,
    elapsed: 0, startedAt: 0, lastFrame: 0, frame: null, hitUntil: 0,
    platforms: [], obstacles: [], gates: [], selectedTiles: new Set(), collapseTimers: []
  };
  const controls = { left: false, right: false, jumpUntil: 0 };
  let returnFocusTarget;

  function switchScreen(name) {
    const labels = { instructions: 'captcha-screen-title', playing: 'captcha-playing-title', result: 'captcha-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.captchaScreen !== name; });
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
        captchaCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) {
        returnFocusTarget.focus({ preventScroll: true });
      }
    });
  }

  function clearRuntime() {
    window.cancelAnimationFrame(game.frame);
    game.frame = null;
    game.collapseTimers.forEach((timer) => window.clearTimeout(timer));
    game.collapseTimers = [];
  }

  function resetGame() {
    clearRuntime();
    clearControls();
    Object.assign(game, {
      status: 'idle', resumeState: 'playing', x: 60, y: 40, velocityY: 0,
      grounded: true, facing: 1, cameraX: 0, checkpointX: 60,
      checks: 0, obstaclesCleared: 0, patience: 3, score: 0, errors: 0,
      elapsed: 0, startedAt: 0, lastFrame: 0, frame: null, hitUntil: 0,
      platforms: [], obstacles: [], gates: [], selectedTiles: new Set(), collapseTimers: []
    });
    platformLayer.replaceChildren();
    obstacleLayer.replaceChildren();
    coinLayer.replaceChildren();
    gateLayer.replaceChildren();
    checkLayer.replaceChildren();
    checkpointBody.replaceChildren();
    checkpointOverlay.hidden = true;
    checkpointOverlay.inert = false;
    checkpointFeedback.textContent = '';
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    touchControls.inert = false;
    playfield.setAttribute('tabindex', '0');
    world.style.width = `${WORLD_WIDTH}px`;
    world.style.transform = 'translateX(0)';
    player.className = 'captcha-player';
    renderPlayer();
    updateMission();
    updateHud(0);
  }

  function startGame() {
    resetGame();
    buildWorld();
    switchScreen('playing');
    game.status = 'playing';
    game.startedAt = performance.now();
    game.lastFrame = game.startedAt;
    updateHud(0);
    updateCamera();
    playfield.focus({ preventScroll: true });
    framework.playSound('select');
    announce('Level started. Jump the pop-up and find the human at checkpoint one.');
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function buildWorld() {
    game.platforms = platformBlueprint.map((data) => {
      const element = document.createElement('i');
      const platform = { ...data, element, collapsed: false, collapseQueued: false, collapseTimer: null };
      element.className = `captcha-platform captcha-platform-${data.kind}`;
      element.style.left = `${data.x}px`;
      element.style.bottom = `${data.bottom}px`;
      element.style.width = `${data.width}px`;
      element.style.height = `${data.height}px`;
      if (Number.isInteger(data.tile)) {
        setTileBackground(element, data.tile);
      }
      if (data.label) {
        const label = document.createElement('span');
        label.textContent = data.label;
        element.append(label);
      }
      platformLayer.append(element);
      return platform;
    });

    game.obstacles = obstacleBlueprint.map((data) => {
      if (data.type === 'platform') return { ...data, element: null };
      const element = document.createElement('div');
      const obstacle = { ...data, baseX: data.x, element };
      element.className = `human-level-obstacle is-${data.type}`;
      element.style.left = `${data.x}px`;
      element.style.bottom = `${data.bottom}px`;
      element.style.width = `${data.width}px`;
      element.style.height = `${data.height}px`;
      if (data.type === 'popup') element.innerHTML = '<span>×</span><strong>Wait.</strong><small>Before you continue</small>';
      if (data.type === 'cookie') element.innerHTML = '<strong>Cookies</strong><small>Manage 94 partners</small>';
      if (data.type === 'moving') element.innerHTML = '<strong>Verify</strong><small>Still moving</small>';
      obstacleLayer.append(element);
      return obstacle;
    });

    game.gates = gateBlueprint.map((data, index) => {
      const element = document.createElement('i');
      const gate = { ...data, required: index + 1, element };
      element.className = 'captcha-gate human-checkpoint-gate';
      element.style.left = `${data.x}px`;
      element.innerHTML = `<span>${data.label}</span><strong>${index + 1}</strong>`;
      gateLayer.append(element);
      return gate;
    });

    const markers = document.createDocumentFragment();
    gateBlueprint.forEach((gate, index) => {
      const marker = document.createElement('i');
      marker.className = 'human-checkpoint-marker';
      marker.style.left = `${gate.x - 72}px`;
      marker.style.bottom = '48px';
      marker.textContent = `CHECK ${index + 1}`;
      markers.append(marker);
    });
    checkLayer.append(markers);
  }

  function runFrame(now) {
    if (game.status !== 'playing' && game.status !== 'challenge') return;
    const elapsed = getElapsed(now);
    updateHud(elapsed);
    if (elapsed >= SESSION_DURATION) {
      finishGame(false, 'time');
      return;
    }
    const delta = Math.min(0.035, Math.max(0, (now - game.lastFrame) / 1000));
    game.lastFrame = now;
    updateMovingObstacle(elapsed);
    if (game.status === 'playing') {
      updatePlayer(delta, now);
      if (game.status === 'playing') updateCamera();
    }
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function updatePlayer(delta, now) {
    const direction = Number(controls.right) - Number(controls.left);
    const previousY = game.y;
    if (direction) {
      game.x += direction * MOVE_SPEED * delta;
      game.facing = direction;
    }
    if (controls.jumpUntil >= now && game.grounded) {
      game.velocityY = JUMP_SPEED;
      game.grounded = false;
      controls.jumpUntil = 0;
      framework.playSound('select');
    }
    if (controls.jumpUntil < now) controls.jumpUntil = 0;
    game.velocityY -= GRAVITY * delta;
    game.y += game.velocityY * delta;
    game.grounded = false;

    const landing = findLanding(previousY);
    if (landing) {
      game.y = landing.bottom + landing.height;
      game.velocityY = 0;
      game.grounded = true;
      if (landing.fragile && !landing.collapseQueued) queueCollapse(landing);
    }

    game.x = Math.max(0, Math.min(FINISH_X + 35, game.x));
    if (now >= game.hitUntil) detectPhysicalObstacle(now);
    if (game.status !== 'playing') return;
    if (game.y < -90) {
      losePatience('The platform stopped being a platform.', now);
      return;
    }
    updateObstacleProgress();
    checkForCheckpoint();
    if (game.status !== 'playing') return;
    if (game.checks === 5 && game.x >= FINISH_X) finishGame(true, 'finish');
    renderPlayer(direction);
  }

  function findLanding(previousY) {
    if (game.velocityY > 0) return null;
    const candidates = game.platforms.filter((platform) => {
      if (platform.collapsed) return false;
      const top = platform.bottom + platform.height;
      const horizontal = game.x + PLAYER_WIDTH > platform.x + 3 && game.x < platform.x + platform.width - 3;
      return horizontal && previousY >= top - 5 && game.y <= top;
    });
    return candidates.sort((a, b) => (b.bottom + b.height) - (a.bottom + a.height))[0] || null;
  }

  function queueCollapse(platform) {
    platform.collapseQueued = true;
    platform.element.classList.add('is-warning');
    const timer = window.setTimeout(() => {
      platform.collapseTimer = null;
      if (game.status === 'idle' || game.status === 'ended') return;
      platform.collapsed = true;
      platform.element.classList.add('is-collapsed');
    }, reducedMotion ? 650 : 420);
    platform.collapseTimer = timer;
    game.collapseTimers.push(timer);
  }

  function restoreFragilePlatforms() {
    game.platforms.filter((platform) => platform.fragile).forEach((platform) => {
      if (platform.collapseTimer) {
        window.clearTimeout(platform.collapseTimer);
        game.collapseTimers = game.collapseTimers.filter((timer) => timer !== platform.collapseTimer);
        platform.collapseTimer = null;
      }
      platform.collapsed = false;
      platform.collapseQueued = false;
      platform.element.classList.remove('is-warning', 'is-collapsed');
    });
  }

  function updateMovingObstacle(elapsed) {
    const moving = game.obstacles.find((obstacle) => obstacle.type === 'moving');
    if (!moving?.element) return;
    moving.x = reducedMotion ? moving.baseX : moving.baseX + (Math.sin(elapsed / 520) * moving.range);
    moving.element.style.left = `${moving.x}px`;
  }

  function detectPhysicalObstacle(now) {
    const obstacle = game.obstacles.find((item) => (
      item.element
      && overlaps(item)
      && !canClearObstacle(item)
    ));
    if (obstacle) losePatience(`${obstacle.label} blocked the route.`, now);
  }

  function canClearObstacle(item) {
    if (!item.vaultable) return false;
    const obstacleTop = item.bottom + item.height;
    return game.velocityY > 0 || game.y >= obstacleTop - 14;
  }

  function updateObstacleProgress() {
    while (game.obstaclesCleared < obstacleBlueprint.length && game.x > obstacleBlueprint[game.obstaclesCleared].clearAt) {
      game.obstaclesCleared += 1;
      game.score += 50;
      framework.playSound('good');
      announce(`Obstacle ${game.obstaclesCleared} of 5 cleared.`);
    }
  }

  function checkForCheckpoint() {
    if (game.checks >= game.gates.length) return;
    const gate = game.gates[game.checks];
    if (game.x + PLAYER_WIDTH < gate.x) return;
    game.x = gate.x - PLAYER_WIDTH;
    game.y = 40;
    game.velocityY = 0;
    game.grounded = true;
    renderPlayer();
    openCheckpoint(game.checks);
  }

  function openCheckpoint(index) {
    const checkpoint = checkpointBlueprint[index];
    if (!checkpoint) return;
    game.status = 'challenge';
    clearControls();
    touchControls.inert = true;
    playfield.setAttribute('tabindex', '-1');
    game.selectedTiles = new Set();
    checkpointStage.textContent = `Checkpoint ${index + 1} of 5`;
    checkpointTitle.textContent = checkpoint.title;
    checkpointIntro.textContent = checkpoint.intro;
    checkpointFeedback.textContent = '';
    renderCheckpoint(checkpoint, index);
    checkpointOverlay.hidden = false;
    framework.playSound('open');
    announce(`Checkpoint ${index + 1} of 5. ${checkpoint.title}`);
    window.requestAnimationFrame(() => checkpointBody.querySelector('input, button')?.focus({ preventScroll: true }));
  }

  function renderCheckpoint(checkpoint, index) {
    checkpointBody.replaceChildren();
    const form = document.createElement('form');
    form.className = 'human-captcha-form';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      verifyCheckpoint(form, checkpoint, index);
    });

    if (checkpoint.kind === 'portraits') renderPortraitCheck(form, checkpoint);
    if (checkpoint.kind === 'code') renderCode(form, checkpoint.code);
    if (checkpoint.kind === 'images') renderImageCheck(form, checkpoint);
    if (checkpoint.kind === 'final') renderFinalCheck(form, checkpoint);
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'human-verify-button';
    submit.textContent = index === 4 ? 'Complete verification' : 'Verify and continue';
    form.append(submit);
    checkpointBody.append(form);
  }

  function renderPortraitCheck(form, checkpoint) {
    const instruction = document.createElement('p');
    const grid = document.createElement('div');
    const labels = ['HU-M4N', 'HUM-AN', 'H-U-MN', 'HUMAN?', 'HU8AN', 'HUM-4N', 'HUMAN', 'HUMAN', 'HVMAN'];
    instruction.className = 'human-image-instruction';
    instruction.textContent = 'Select one portrait. The labels have not been independently verified.';
    grid.className = 'human-portrait-grid';

    labels.forEach((label, index) => {
      const tile = document.createElement('button');
      const face = document.createElement('span');
      const caption = document.createElement('small');
      const isHuman = checkpoint.correct.includes(index);
      tile.type = 'button';
      tile.className = `human-portrait-tile${isHuman ? ' is-human' : ''}`;
      tile.setAttribute('aria-label', isHuman
        ? `Portrait ${index + 1}: bearded person wearing glasses`
        : `Portrait ${index + 1}: robot styled with glasses and a beard`);
      tile.setAttribute('aria-pressed', 'false');
      face.className = 'human-portrait-face';
      face.setAttribute('aria-hidden', 'true');
      face.innerHTML = isHuman ? '<i></i>' : '<b></b><i></i>';
      caption.textContent = label;
      tile.append(face, caption);
      tile.addEventListener('click', () => {
        game.selectedTiles = new Set([index]);
        grid.querySelectorAll('.human-portrait-tile').forEach((candidate, candidateIndex) => {
          const selected = candidateIndex === index;
          candidate.classList.toggle('is-selected', selected);
          candidate.setAttribute('aria-pressed', String(selected));
        });
        framework.playSound('select');
      });
      grid.append(tile);
    });

    form.append(instruction, grid);
  }

  function renderCode(form, code) {
    const visual = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    visual.className = 'human-distorted-code';
    visual.setAttribute('role', 'img');
    visual.setAttribute('aria-label', `Code ${code.split('').join(' ')}`);
    visual.innerHTML = [...code].map((character) => `<span>${character}</span>`).join('') + '<i></i><i></i>';
    label.className = 'human-code-label';
    label.htmlFor = 'human-code-input';
    label.textContent = 'Enter the characters';
    input.id = 'human-code-input';
    input.name = 'code';
    input.type = 'text';
    input.autocomplete = 'off';
    input.autocapitalize = 'characters';
    input.maxLength = code.length;
    input.required = true;
    form.append(visual, label, input);
  }

  function renderImageCheck(form, checkpoint) {
    const instruction = document.createElement('p');
    instruction.className = 'human-image-instruction';
    instruction.textContent = checkpoint.title;
    form.append(instruction, createTileGrid(checkpoint));
  }

  function renderFinalCheck(form, checkpoint) {
    const instruction = document.createElement('p');
    instruction.className = 'human-image-instruction';
    instruction.textContent = 'Select every traffic light and bicycle.';
    form.append(instruction, createTileGrid(checkpoint));
    renderCode(form, checkpoint.code);
    const label = document.createElement('label');
    label.className = 'human-final-confirmation';
    label.innerHTML = '<input type="checkbox" name="confirmed"><span>I confirm I completed both tests myself.</span>';
    form.append(label);
  }

  function createTileGrid(checkpoint) {
    const grid = document.createElement('div');
    grid.className = `human-image-grid${checkpoint.blurry ? ' is-blurry' : ''}`;
    checkpoint.sources.forEach((source, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'human-image-tile';
      const subject = source === 3 ? 'traffic light' : source === 7 ? 'bicycle' : 'different object';
      tile.setAttribute('aria-label', `Image tile ${index + 1}: ${subject}`);
      tile.setAttribute('aria-pressed', 'false');
      setTileBackground(tile, source);
      const number = document.createElement('span');
      number.textContent = String(index + 1);
      tile.append(number);
      tile.addEventListener('click', () => {
        if (game.selectedTiles.has(index)) game.selectedTiles.delete(index);
        else game.selectedTiles.add(index);
        const selected = game.selectedTiles.has(index);
        tile.classList.toggle('is-selected', selected);
        tile.setAttribute('aria-pressed', String(selected));
        framework.playSound('select');
      });
      grid.append(tile);
    });
    return grid;
  }

  function setTileBackground(element, source) {
    const column = source % 3;
    const row = Math.floor(source / 3);
    element.style.setProperty('--tile-x', `${column * 50}%`);
    element.style.setProperty('--tile-y', `${row * 50}%`);
  }

  function verifyCheckpoint(form, checkpoint, index) {
    let correct = false;
    if (checkpoint.kind === 'portraits') correct = selectedTilesAreCorrect(checkpoint.correct);
    if (checkpoint.kind === 'code') correct = normaliseCode(form.elements.code?.value) === checkpoint.code;
    if (checkpoint.kind === 'images') correct = selectedTilesAreCorrect(checkpoint.correct);
    if (checkpoint.kind === 'final') {
      correct = selectedTilesAreCorrect(checkpoint.correct)
        && normaliseCode(form.elements.code?.value) === checkpoint.code
        && Boolean(form.elements.confirmed?.checked);
    }

    if (!correct) {
      game.errors += 1;
      game.score = Math.max(0, game.score - 50);
      checkpointFeedback.textContent = checkpoint.kind === 'portraits' || checkpoint.kind === 'images' || checkpoint.kind === 'final'
        ? 'That selection did not pass. Review every tile and try again.'
        : 'Verification failed. The answer is still in front of you.';
      framework.playSound('bad');
      announce(checkpointFeedback.textContent);
      updateHud(getElapsed());
      return;
    }

    const gate = game.gates[index];
    game.checks += 1;
    game.score += 200 + (index * 100);
    game.checkpointX = gate.x + 24;
    game.x = game.checkpointX;
    game.y = 40;
    game.velocityY = 0;
    game.grounded = true;
    gate.element.classList.add('is-open');
    checkpointFeedback.textContent = 'Verification accepted.';
    checkpointOverlay.hidden = true;
    checkpointBody.replaceChildren();
    touchControls.inert = false;
    playfield.setAttribute('tabindex', '0');
    game.status = 'playing';
    game.lastFrame = performance.now();
    updateMission();
    updateHud(getElapsed());
    updateCamera();
    renderPlayer();
    framework.playSound('success');
    announce(`Checkpoint ${game.checks} of 5 passed. Continue to the next obstacle.`);
    window.requestAnimationFrame(() => playfield.focus({ preventScroll: true }));
  }

  function selectedTilesAreCorrect(correctTiles) {
    return game.selectedTiles.size === correctTiles.length && correctTiles.every((tile) => game.selectedTiles.has(tile));
  }

  function normaliseCode(value = '') {
    return value.trim().replace(/\s+/g, '').toUpperCase();
  }

  function overlaps(item) {
    const hitInset = item.hitInset || 0;
    return game.x + PLAYER_WIDTH - hitInset > item.x
      && game.x + hitInset < item.x + item.width
      && game.y + PLAYER_HEIGHT > item.bottom
      && game.y < item.bottom + item.height;
  }

  function losePatience(message, now = performance.now()) {
    if (game.status !== 'playing' || now < game.hitUntil) return;
    game.patience -= 1;
    game.score = Math.max(0, game.score - 75);
    framework.playSound('bad');
    if (game.patience <= 0) {
      finishGame(false, 'patience');
      return;
    }
    game.hitUntil = now + 900;
    game.x = game.checkpointX;
    game.y = 40;
    game.velocityY = 0;
    game.grounded = true;
    restoreFragilePlatforms();
    player.classList.remove('is-hit');
    void player.offsetWidth;
    player.classList.add('is-hit');
    updateCamera();
    updateHud(getElapsed());
    renderPlayer();
    announce(`${message} Patience ${game.patience} of 3. Returned to the last checkpoint.`);
  }

  function renderPlayer(direction = 0) {
    player.style.left = `${game.x}px`;
    player.style.bottom = `${game.y}px`;
    player.classList.toggle('is-facing-left', game.facing < 0);
    player.classList.toggle('is-running', Boolean(direction && game.grounded));
    player.classList.toggle('is-jumping', !game.grounded);
  }

  function updateCamera() {
    const maxCamera = Math.max(0, WORLD_WIDTH - viewport.clientWidth);
    game.cameraX = Math.min(maxCamera, Math.max(0, game.x - (viewport.clientWidth * 0.34)));
    world.style.transform = `translateX(${-game.cameraX}px)`;
  }

  function updateMission() {
    const missions = [
      'Jump the pop-up, then find the human hidden among robots.',
      'Cross the faded platform, then type the distorted letters.',
      'Jump the cookie banner, then find every traffic light.',
      'Cross the unstable image tiles, then find the blurry bicycles.',
      'Jump the moving Verify button, then complete the final combined check.',
      'All five checks passed. Reach the website.'
    ];
    missionOutput.textContent = missions[game.checks];
  }

  function getElapsed(now = performance.now()) {
    return game.status === 'playing' || game.status === 'challenge'
      ? game.elapsed + (now - game.startedAt)
      : game.elapsed;
  }

  function updateHud(elapsed) {
    const remaining = Math.max(0, SESSION_DURATION - elapsed);
    const progress = Math.min(100, Math.round((game.x / FINISH_X) * 100));
    scoreOutput.textContent = framework.formatScore(game.score);
    checksOutput.textContent = String(game.checks);
    obstaclesOutput.textContent = String(game.obstaclesCleared);
    patienceOutput.textContent = `${game.patience}/3`;
    patienceOutput.classList.toggle('is-low', game.patience <= 1);
    progressOutput.value = progress;
    progressOutput.textContent = `${progress}% complete`;
    progressText.textContent = `${progress}%`;
    timeOutput.textContent = `${Math.ceil(remaining / 1000)}s`;
  }

  function clearControls() {
    controls.left = false;
    controls.right = false;
    controls.jumpUntil = 0;
  }

  function pauseGame() {
    if (game.status !== 'playing' && game.status !== 'challenge') return;
    game.resumeState = game.status;
    game.elapsed = getElapsed();
    window.cancelAnimationFrame(game.frame);
    game.frame = null;
    game.status = 'paused';
    clearControls();
    checkpointOverlay.inert = true;
    touchControls.inert = true;
    playfield.setAttribute('tabindex', '-1');
    pausePanel.hidden = false;
    announce('Game paused.');
    window.requestAnimationFrame(() => resumeButton?.focus());
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = game.resumeState;
    game.startedAt = performance.now();
    game.lastFrame = game.startedAt;
    checkpointOverlay.inert = false;
    touchControls.inert = game.status === 'challenge';
    playfield.setAttribute('tabindex', game.status === 'playing' ? '0' : '-1');
    pausePanel.hidden = true;
    announce('Game resumed.');
    game.frame = window.requestAnimationFrame(runFrame);
    window.requestAnimationFrame(() => {
      if (game.status === 'challenge') checkpointBody.querySelector('input, button')?.focus({ preventScroll: true });
      else playfield.focus({ preventScroll: true });
    });
  }

  function finishGame(completed, reason) {
    if (!['playing', 'challenge'].includes(game.status)) return;
    game.elapsed = getElapsed();
    clearRuntime();
    clearControls();
    game.status = 'ended';
    checkpointOverlay.hidden = true;
    if (completed) {
      const timeBonus = Math.ceil(Math.max(0, SESSION_DURATION - game.elapsed) / 1000) * 15;
      game.score += timeBonus + (game.patience * 100);
    }
    const savedProgress = framework.saveGameProgress('captcha-boss', game.score, completed);
    if (completed) {
      resultKicker.textContent = 'Humanity provisionally confirmed';
      resultTitle.textContent = 'Apparently, yes.';
      resultCopy.textContent = 'Verification complete. Your session has expired. Please try again.';
    } else if (reason === 'time') {
      resultKicker.textContent = 'Session timed out';
      resultTitle.textContent = 'Still unverified.';
      resultCopy.textContent = `You passed ${game.checks} of 5 checks before the verification window closed.`;
    } else {
      resultKicker.textContent = 'Patience depleted';
      resultTitle.textContent = 'Humanity remains unconfirmed.';
      resultCopy.textContent = `You passed ${game.checks} of 5 checks before the interface exhausted the available patience.`;
    }
    finalScore.textContent = framework.formatScore(game.score);
    bestScore.textContent = framework.formatScore(savedProgress.best);
    finalChecks.textContent = `${game.checks}/5`;
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

  document.querySelectorAll('[data-open-game="captcha-boss"]').forEach((button) => {
    button.addEventListener('click', () => openGame(button));
  });
  dialog.querySelectorAll('[data-captcha-exit]').forEach((button) => {
    button.addEventListener('click', framework.exitArcade);
  });
  startButton?.addEventListener('click', startGame);
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-captcha-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-captcha-choose]')?.addEventListener('click', () => closeGame(true));
  bindHoldControl(dialog.querySelector('[data-captcha-control="left"]'), 'left');
  bindHoldControl(dialog.querySelector('[data-captcha-control="right"]'), 'right');
  dialog.querySelector('[data-captcha-control="jump"]')?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    controls.jumpUntil = performance.now() + JUMP_BUFFER;
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (game.status === 'playing' || game.status === 'challenge') pauseGame();
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
      if (game.status === 'playing' || game.status === 'challenge') {
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
      controls.jumpUntil = performance.now() + JUMP_BUFFER;
    }
  });
  document.addEventListener('keyup', (event) => {
    if (!dialog.open) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') controls.left = false;
    if (key === 'arrowright' || key === 'd') controls.right = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && (game.status === 'playing' || game.status === 'challenge')) pauseGame();
  });
  window.addEventListener('resize', () => {
    if (!['playing', 'challenge', 'paused'].includes(game.status)) return;
    updateCamera();
  });
})();
