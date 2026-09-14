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
  const checkpointWindow = dialog.querySelector('.human-checkpoint-window');
  const checkpointStage = dialog.querySelector('#human-checkpoint-stage');
  const checkpointTitle = dialog.querySelector('#human-checkpoint-title');
  const checkpointIntro = dialog.querySelector('#human-checkpoint-intro');
  const checkpointBody = dialog.querySelector('#human-checkpoint-body');
  const checkpointFeedback = dialog.querySelector('#human-checkpoint-feedback');
  const checkpointTimer = dialog.querySelector('#human-checkpoint-timer');
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
  const JUMP_SPEED = 830;
  const GRAVITY = 1750;
  const JUMP_BUFFER = 180;
  const CHECKPOINT_DURATION = 10000;
  const CHECKPOINT_READING_TIME = 3000;

  const platformBlueprint = [
    { id: 'ground-1', x: 0, width: 560, bottom: 0, height: 40, kind: 'ground' },

    { id: 'ground-2', x: 560, width: 245, bottom: 0, height: 40, kind: 'ground' },
    { id: 'faded-2a', x: 790, width: 150, bottom: 145, height: 22, kind: 'faded', label: '1.3:1' },
    { id: 'faded-2b', x: 965, width: 86, bottom: 265, height: 22, kind: 'faded', label: '1.2:1' },
    { id: 'faded-2c', x: 1060, width: 60, bottom: 145, height: 22, kind: 'faded', label: '1.1:1' },

    { id: 'ground-3', x: 1120, width: 390, bottom: 0, height: 40, kind: 'ground' },
    { id: 'climb-3a', x: 1480, width: 105, bottom: 145, height: 22, kind: 'ledge' },
    { id: 'climb-3b', x: 1575, width: 105, bottom: 285, height: 22, kind: 'ledge' },

    { id: 'ground-4', x: 1680, width: 165, bottom: 0, height: 40, kind: 'ground' },
    { id: 'image-step-1', x: 1845, width: 76, bottom: 110, height: 28, kind: 'tile', label: 'Unstable', fragile: true },
    { id: 'image-step-2', x: 1941, width: 76, bottom: 230, height: 28, kind: 'tile', label: 'Collapses', fragile: true },
    { id: 'image-step-3', x: 2037, width: 76, bottom: 355, height: 28, kind: 'tile', label: 'Keep moving', fragile: true },
    { id: 'image-step-4', x: 2133, width: 133, bottom: 485, height: 28, kind: 'tile', label: 'Last tile', fragile: true },

    { id: 'ground-5', x: 2260, width: 200, bottom: 0, height: 40, kind: 'ground' },
    { id: 'climb-5a', x: 2440, width: 115, bottom: 95, height: 22, kind: 'ledge' },
    { id: 'climb-5-recovery', x: 2580, width: 95, bottom: 70, height: 22, kind: 'faded', label: 'Second chance' },
    { id: 'climb-5b', x: 2530, width: 205, bottom: 220, height: 22, kind: 'ledge' },
    { id: 'climb-5c', x: 2675, width: 110, bottom: 340, height: 22, kind: 'ledge' },
    { id: 'climb-5d', x: 2755, width: 69, bottom: 465, height: 22, kind: 'ledge' },
    { id: 'finish-ground', x: 2820, width: 200, bottom: 0, height: 40, kind: 'ground' }
  ];

  const obstacleBlueprint = [
    { id: 'popup', type: 'popup', x: 270, width: 82, bottom: 40, height: 72, clearAt: 540, label: 'Pop-up', vaultable: true, hitInset: 8, cycle: 2400 },
    { id: 'faded-platform', type: 'platform', clearAt: 1100, label: 'Faded platform' },
    { id: 'cookie', type: 'cookie', x: 1325, width: 100, bottom: 40, height: 64, clearAt: 1660, label: 'Cookie banner', vaultable: true, hitInset: 10 },
    { id: 'image-platforms', type: 'platform', clearAt: 2240, label: 'Unstable image tiles' },
    { id: 'verify', type: 'moving', x: 2630, width: 60, bottom: 242, height: 54, clearAt: 2800, label: 'Moving Verify button', range: 30, vaultable: true, hitInset: 7 }
  ];

  const gateBlueprint = [
    { x: 560, label: 'Portraits' },
    { x: 1120, label: 'Signal scramble' },
    { x: 1680, label: 'Traffic lights' },
    { x: 2260, label: 'Bike crossing' },
    { x: 2820, label: 'Crack code' }
  ];

  const checkpointBlueprint = [
    {
      kind: 'portraits',
      title: 'Find the real Stephen.',
      intro: 'Every portrait looks familiar. Look for helmets, antennas, mechanical arms or metal torsos, then check the spelling.',
      principle: 'Only one portrait is fully human. Find Stephen with no robotic detail and the word HUMAN spelt correctly.',
      correct: [7]
    },
    {
      kind: 'signal',
      title: 'Repeat the signal.',
      intro: 'Watch the transmission, then rebuild it after the controls shuffle. Match one sequence to unlock the route.',
      principle: 'Watch one shuffled sequence, then tap the symbols in the exact order they appeared.',
      duration: 15000,
      rounds: [
        ['diamond', 'circle', 'square', 'triangle']
      ]
    },
    {
      kind: 'images',
      variant: 'traffic',
      title: 'Select all traffic lights.',
      intro: 'Real signals now share their colours with robot faces. Check all four rows carefully.',
      principle: 'Select only real traffic lights. The robot heads borrow similar colours, lights and silhouettes to distract you.',
      sources: ['light-classic', 'robot-eyes', 'robot-wide', 'robot-stack', 'light-pedestrian', 'robot-box', 'robot-double', 'robot-signal', 'light-hanging', 'robot-antenna', 'light-single', 'robot-tall'],
      correct: [0, 4, 8, 10]
    },
    {
      kind: 'road',
      title: 'Cross the road on your bike.',
      intro: 'Reach the opposite pavement across five lanes before the timer expires. Traffic has not read the usability guidance.',
      principle: 'Move Stephen from Start to Website across five lanes without touching a car. You have three tries.'
    },
    {
      kind: 'pin',
      title: 'Crack the four-digit PIN.',
      intro: 'Use the colour clues to unlock the website. Green is correct and in place; yellow belongs somewhere else.',
      principle: 'Use the starter clue to test four-digit codes. Green is the right digit in the right place, yellow is in the code but misplaced, and grey is not in the code.',
      pin: '4271',
      duration: 30000
    }
  ];

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function randomiseCheckpoints() {
    checkpointBlueprint[0].correct = [Math.floor(Math.random() * 9)];
    checkpointBlueprint[1].rounds = [shuffle(['circle', 'triangle', 'diamond', 'square'])];

    const shuffledTraffic = shuffle([
      'light-classic', 'robot-eyes', 'robot-wide', 'robot-stack',
      'light-pedestrian', 'robot-box', 'robot-double', 'robot-signal',
      'light-hanging', 'robot-antenna', 'light-single', 'robot-tall'
    ]);
    checkpointBlueprint[2].sources = shuffledTraffic;
    checkpointBlueprint[2].correct = shuffledTraffic.reduce((indices, source, index) => {
      if (source.startsWith('light-')) indices.push(index);
      return indices;
    }, []);

    const starterCode = '1234';
    let pin = starterCode;
    while (pin === starterCode) pin = shuffle(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, 4).join('');
    checkpointBlueprint[4].pin = pin;
  }

  const game = {
    status: 'idle', resumeState: 'playing', x: 24, y: 40, velocityY: 0,
    grounded: true, facing: 1, cameraX: 0, checkpointX: 24,
    checks: 0, obstaclesCleared: 0, patience: 3, score: 0, errors: 0,
    elapsed: 0, startedAt: 0, lastFrame: 0, frame: null, hitUntil: 0,
    platforms: [], obstacles: [], gates: [], selectedTiles: new Set(), collapseTimers: [], checkpointTimerId: null, checkpointDeadline: 0, checkpointRemaining: CHECKPOINT_DURATION, checkpointReadTimerId: null, checkpointReadDeadline: 0, checkpointReadRemaining: CHECKPOINT_READING_TIME, checkpointDuration: CHECKPOINT_DURATION, checkpointReading: false, checkpointWarmup: false
  };
  const controls = { left: false, right: false, jumpUntil: 0 };
  let returnFocusTarget;

  function switchScreen(name) {
    const labels = { instructions: 'captcha-screen-title', playing: 'captcha-playing-title', result: 'captcha-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.captchaScreen !== name; });
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
    window.clearInterval(game.checkpointTimerId);
    game.checkpointTimerId = null;
    window.clearTimeout(game.checkpointReadTimerId);
    game.checkpointReadTimerId = null;
  }

  function resetGame() {
    clearRuntime();
    clearControls();
    Object.assign(game, {
      status: 'idle', resumeState: 'playing', x: 24, y: 40, velocityY: 0,
      grounded: true, facing: 1, cameraX: 0, checkpointX: 24,
      checks: 0, obstaclesCleared: 0, patience: 3, score: 0, errors: 0,
      elapsed: 0, startedAt: 0, lastFrame: 0, frame: null, hitUntil: 0,
      platforms: [], obstacles: [], gates: [], selectedTiles: new Set(), collapseTimers: [], checkpointTimerId: null, checkpointDeadline: 0, checkpointRemaining: CHECKPOINT_DURATION, checkpointReadTimerId: null, checkpointReadDeadline: 0, checkpointReadRemaining: CHECKPOINT_READING_TIME, checkpointDuration: CHECKPOINT_DURATION, checkpointReading: false, checkpointWarmup: false
    });
    platformLayer.replaceChildren();
    obstacleLayer.replaceChildren();
    coinLayer.replaceChildren();
    gateLayer.replaceChildren();
    checkLayer.replaceChildren();
    checkpointBody.replaceChildren();
    checkpointWindow?.querySelectorAll('.human-checkpoint-read-gate, .human-checkpoint-countdown').forEach((item) => item.remove());
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
    randomiseCheckpoints();
    switchScreen('playing');
    buildWorld();
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
    const verticalScale = Math.min(1.35, Math.max(0.52, (viewport.clientHeight - 90) / 620));
    const scaleBottom = (value) => Math.round(value * verticalScale);

    game.platforms = platformBlueprint.map((data) => {
      const element = document.createElement('i');
      const platform = { ...data, bottom: scaleBottom(data.bottom), element, collapsed: false, collapseQueued: false, collapseTimer: null };
      element.className = `captcha-platform captcha-platform-${data.kind}`;
      if (platform.fragile) element.classList.add('is-fragile');
      element.style.left = `${data.x}px`;
      element.style.bottom = `${platform.bottom}px`;
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
      const obstacle = { ...data, bottom: scaleBottom(data.bottom || 0), baseBottom: scaleBottom(data.bottom || 0), baseX: data.x, element };
      element.className = `human-level-obstacle is-${data.type}`;
      element.style.left = `${data.x}px`;
      element.style.bottom = `${obstacle.bottom}px`;
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
    updatePopupObstacle(elapsed);
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
      if (landing.kind === 'faded') landing.element.classList.add('is-activated');
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

  function updatePopupObstacle(elapsed) {
    const popup = game.obstacles.find((obstacle) => obstacle.type === 'popup');
    if (!popup?.element) return;
    if (reducedMotion) {
      popup.bottom = popup.baseBottom;
      popup.element.style.bottom = `${popup.bottom}px`;
      return;
    }
    const phase = (elapsed % popup.cycle) / popup.cycle;
    let rise = 0;
    if (phase < 0.16) rise = phase / 0.16;
    else if (phase < 0.55) rise = 1;
    else if (phase < 0.72) rise = 1 - ((phase - 0.55) / 0.17);
    popup.bottom = popup.baseBottom - popup.height + 12 + ((popup.height - 12) * rise);
    popup.element.style.bottom = `${popup.bottom}px`;
    popup.element.classList.toggle('is-rising', phase < 0.16);
    popup.element.classList.toggle('is-lowered', phase >= 0.72);
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
    startCheckpointReading(index, checkpoint.duration || CHECKPOINT_DURATION);
    framework.playSound('open');
    announce(`Checkpoint ${index + 1} of 5. Read first. ${checkpoint.principle}`);
    checkpointTitle.setAttribute('tabindex', '-1');
    window.requestAnimationFrame(() => checkpointTitle.focus({ preventScroll: true }));
  }

  function focusCheckpointControl() {
    window.requestAnimationFrame(() => checkpointBody.querySelector('input:not([type="hidden"]), button, [tabindex="0"]')?.focus({ preventScroll: true }));
  }

  function startCheckpointReading(index, duration = CHECKPOINT_DURATION) {
    window.clearInterval(game.checkpointTimerId);
    game.checkpointTimerId = null;
    window.clearTimeout(game.checkpointReadTimerId);
    game.checkpointDuration = duration;
    game.checkpointReading = true;
    game.checkpointWarmup = false;
    game.checkpointReadRemaining = CHECKPOINT_READING_TIME;
    game.checkpointReadDeadline = 0;
    checkpointBody.inert = true;
    checkpointTimer.textContent = 'Read first';
    checkpointTimer.classList.remove('is-mid', 'is-low');
    checkpointTimer.classList.add('is-reading');
    checkpointWindow?.querySelectorAll('.human-checkpoint-read-gate, .human-checkpoint-countdown').forEach((item) => item.remove());
    const gate = document.createElement('section');
    gate.className = 'human-checkpoint-read-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'human-read-first-title');
    gate.innerHTML = `<span>Checkpoint ${index + 1} · Read first</span><h4 id="human-read-first-title">${checkpointBlueprint[index].title}</h4><p>${checkpointBlueprint[index].principle}</p>`;
    const ready = document.createElement('button');
    ready.type = 'button';
    ready.textContent = "I'm ready";
    gate.append(ready);
    checkpointWindow?.append(gate);
    ready.addEventListener('click', () => {
      gate.remove();
      startCheckpointCountdown(index, duration);
    }, { once: true });
    window.requestAnimationFrame(() => ready.focus({ preventScroll: true }));
  }

  function startCheckpointCountdown(index, duration) {
    game.checkpointWarmup = true;
    checkpointTimer.textContent = 'Get ready';
    const countdown = document.createElement('div');
    countdown.className = 'human-checkpoint-countdown';
    countdown.setAttribute('role', 'status');
    countdown.setAttribute('aria-live', 'assertive');
    checkpointWindow?.append(countdown);
    const steps = ['3', '2', '1', 'GO'];
    let step = 0;
    const advance = () => {
      if (game.status !== 'challenge' || !countdown.isConnected) return;
      countdown.textContent = steps[step];
      framework.playSound(step === steps.length - 1 ? 'good' : 'select');
      announce(steps[step] === 'GO' ? 'Go.' : steps[step]);
      step += 1;
      if (step < steps.length) {
        game.checkpointReadTimerId = window.setTimeout(advance, 650);
        return;
      }
      game.checkpointReadTimerId = window.setTimeout(() => {
        countdown.remove();
        game.checkpointReadTimerId = null;
        if (game.status !== 'challenge') return;
        game.checkpointReading = false;
        game.checkpointWarmup = false;
        game.checkpointReadRemaining = 0;
        checkpointBody.inert = false;
        if (checkpointBlueprint[index]?.kind === 'signal') {
          checkpointBody.querySelector('.human-signal-form')?.dispatchEvent(new CustomEvent('human-checkpoint-ready'));
          return;
        }
        startCheckpointTimer(index, duration);
        announce(`Go. ${Math.round(duration / 1000)} seconds.`);
        focusCheckpointControl();
      }, 500);
    };
    advance();
  }

  function startCheckpointTimer(index, duration = CHECKPOINT_DURATION) {
    window.clearTimeout(game.checkpointReadTimerId);
    game.checkpointReadTimerId = null;
    window.clearInterval(game.checkpointTimerId);
    game.checkpointReading = false;
    game.checkpointWarmup = false;
    game.checkpointDuration = duration;
    checkpointBody.inert = false;
    checkpointTimer.classList.remove('is-reading');
    game.checkpointRemaining = duration;
    game.checkpointDeadline = performance.now() + duration;
    const tick = () => {
      const remaining = Math.max(0, game.checkpointDeadline - performance.now());
      game.checkpointRemaining = remaining;
      checkpointTimer.textContent = `${Math.ceil(remaining / 1000)}s`;
      checkpointTimer.classList.toggle('is-mid', remaining <= 7000 && remaining > 3000);
      checkpointTimer.classList.toggle('is-low', remaining <= 3000);
      if (remaining > 0 || game.status !== 'challenge') return;
      window.clearInterval(game.checkpointTimerId);
      game.checkpointTimerId = null;
      game.errors += 1;
      game.patience = Math.max(0, game.patience - 1);
      game.score = Math.max(0, game.score - 75);
      if (game.patience === 0) {
        finishGame(false, 'patience');
        return;
      }
      const resetDuration = checkpointBlueprint[index].duration || CHECKPOINT_DURATION;
      checkpointFeedback.textContent = `Time expired and cost one patience. Resetting with ${Math.round(resetDuration / 1000)} seconds; ${game.patience} patience remaining.`;
      framework.playSound('bad');
      game.selectedTiles = new Set();
      renderCheckpoint(checkpointBlueprint[index], index);
      updateHud(getElapsed());
      startCheckpointReading(index, resetDuration);
    };
    tick();
    game.checkpointTimerId = window.setInterval(tick, 200);
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
    if (checkpoint.kind === 'signal') {
      renderSignalCheck(form, checkpoint, index);
      checkpointBody.append(form);
      return;
    }
    if (checkpoint.kind === 'code') renderCode(form, checkpoint.code);
    if (checkpoint.kind === 'images') renderImageCheck(form, checkpoint);
    if (checkpoint.kind === 'road') {
      renderRoadCheck(form, checkpoint, index);
      checkpointBody.append(form);
      return;
    }
    if (checkpoint.kind === 'pin') {
      renderPinCheck(form, checkpoint, index);
      checkpointBody.append(form);
      return;
    }
    if (checkpoint.kind === 'final') renderFinalCheck(form, checkpoint);
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'human-verify-button';
    submit.textContent = index === 4 ? 'Complete verification' : 'Verify and continue';
    form.append(submit);
    checkpointBody.append(form);
  }

  function renderSignalCheck(form, checkpoint, index) {
    const symbols = {
      circle: { glyph: '●', label: 'Circle' },
      triangle: { glyph: '▲', label: 'Triangle' },
      diamond: { glyph: '◆', label: 'Diamond' },
      square: { glyph: '■', label: 'Square' }
    };
    const stage = document.createElement('div');
    const display = document.createElement('div');
    const answer = document.createElement('div');
    const pad = document.createElement('div');
    const status = document.createElement('p');
    const solved = document.createElement('input');
    let round = 0;
    let choice = [];
    let locked = true;

    form.classList.add('human-signal-form');
    stage.className = 'human-signal-stage';
    display.className = 'human-signal-display';
    answer.className = 'human-signal-answer';
    pad.className = 'human-signal-pad';
    status.className = 'human-signal-status';
    status.setAttribute('aria-live', 'polite');
    solved.type = 'hidden';
    solved.name = 'signalSolved';
    solved.value = 'no';
    stage.append(display, answer);

    const schedule = (callback, delay) => window.setTimeout(() => {
      if (!form.isConnected || game.status === 'idle' || game.status === 'ended') return;
      if (game.status === 'paused' || game.checkpointReading) {
        schedule(callback, 120);
        return;
      }
      if (game.status === 'challenge') callback();
    }, delay);

    const setPadDisabled = (disabled) => {
      pad.querySelectorAll('button').forEach((button) => { button.disabled = disabled; });
    };

    const renderAnswer = (sequence) => {
      answer.replaceChildren();
      sequence.forEach((id) => {
        const token = document.createElement('span');
        token.className = `is-${id}`;
        token.textContent = symbols[id].glyph;
        token.setAttribute('aria-label', symbols[id].label);
        answer.append(token);
      });
    };

    const showRound = (withCountdown = false) => {
      const sequence = checkpoint.rounds[round];
      choice = [];
      locked = true;
      setPadDisabled(true);
      answer.replaceChildren();
      display.className = 'human-signal-display';
      let position = 0;
      const reveal = () => {
        if (position >= sequence.length) {
          display.textContent = '?';
          display.className = 'human-signal-display is-ready';
          locked = false;
          setPadDisabled(false);
          startCheckpointTimer(index, checkpoint.duration || CHECKPOINT_DURATION);
          status.textContent = `Round ${round + 1}: rebuild the ${sequence.length}-symbol signal.`;
          pad.querySelector('button')?.focus({ preventScroll: true });
          return;
        }
        const id = sequence[position];
        display.textContent = symbols[id].glyph;
        display.className = `human-signal-display is-${id} is-flashing`;
        framework.playSound('select');
        position += 1;
        schedule(() => {
          display.textContent = '';
          display.className = 'human-signal-display';
          schedule(reveal, 220);
        }, 680);
      };
      const beginReveal = () => {
        status.textContent = `Watch the ${sequence.length}-symbol signal.`;
        display.textContent = '';
        display.className = 'human-signal-display';
        schedule(reveal, 350);
      };

      if (!withCountdown) {
        beginReveal();
        return;
      }

      let count = 3;
      const countdown = () => {
        display.textContent = count > 0 ? String(count) : 'GO';
        display.className = count > 0 ? 'human-signal-display is-ready' : 'human-signal-display is-correct';
        status.textContent = count > 0 ? `Get ready. ${count}` : 'Go. Watch the signal.';
        framework.playSound(count > 0 ? 'select' : 'good');
        if (count > 0) {
          count -= 1;
          schedule(countdown, 720);
          return;
        }
        schedule(beginReveal, 620);
      };
      schedule(countdown, 300);
    };

    form.addEventListener('human-checkpoint-ready', () => showRound(false), { once: true });

    Object.entries(symbols).forEach(([id, data]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `is-${id}`;
      button.innerHTML = `<span aria-hidden="true">${data.glyph}</span><small>${data.label}</small>`;
      button.setAttribute('aria-label', `Add ${data.label}`);
      button.disabled = true;
      button.addEventListener('click', () => {
        if (locked) return;
        choice.push(id);
        renderAnswer(choice);
        framework.playSound('select');
        const sequence = checkpoint.rounds[round];
        if (choice.length < sequence.length) return;
        locked = true;
        setPadDisabled(true);
        if (!choice.every((value, position) => value === sequence[position])) {
          window.clearInterval(game.checkpointTimerId);
          game.checkpointTimerId = null;
          game.checkpointRemaining = checkpoint.duration || CHECKPOINT_DURATION;
          game.checkpointWarmup = true;
          checkpointTimer.textContent = 'Get ready';
          checkpointTimer.classList.remove('is-mid', 'is-low');
          checkpointTimer.classList.add('is-reading');
          display.textContent = '×';
          display.className = 'human-signal-display is-wrong';
          status.textContent = 'Signal scrambled. Full timer restored. Get ready to watch again.';
          framework.playSound('bad');
          schedule(() => showRound(true), 650);
          return;
        }
        display.textContent = '✓';
        display.className = 'human-signal-display is-correct';
        framework.playSound('good');
        if (round < checkpoint.rounds.length - 1) {
          round += 1;
          status.textContent = 'Signal matched. One harder round remains.';
          schedule(showRound, 620);
          return;
        }
        solved.value = 'yes';
        status.textContent = 'Transmission restored. Route unlocked.';
        schedule(() => verifyCheckpoint(form, checkpoint, index), 420);
      });
      pad.append(button);
    });

    form.append(stage, pad, status, solved);
  }

  function renderPortraitCheck(form, checkpoint) {
    const instruction = document.createElement('p');
    const grid = document.createElement('div');
    const wrongLabels = shuffle(['HUM4N', 'HUNAN', 'HUMAM', 'HUMAN?', 'HU8AN', 'HUM-AN', 'HUMAИ', 'HVMAN']);
    const robotDetails = ['head', 'arm', 'torso', 'legs', 'head', 'arm', 'torso', 'legs', 'head'];
    const robotSprites = shuffle([0, 1, 2, 3, 5, 6, 7, 8]);
    const robotDetailLabels = {
      head: 'robot head',
      arm: 'mechanical arm',
      torso: 'metal torso',
      legs: 'mechanical legs'
    };
    instruction.className = 'human-image-instruction';
    instruction.textContent = 'Select the fully human Stephen. The robots have integrated mechanical head, arm, torso or legs, plus a misspelt label.';
    grid.className = 'human-portrait-grid';

    let wrongLabelIndex = 0;
    let robotSpriteIndex = 0;
    Array.from({ length: 9 }, (_, index) => index).forEach((index) => {
      const tile = document.createElement('button');
      const face = document.createElement('span');
      const caption = document.createElement('small');
      const isHuman = checkpoint.correct.includes(index);
      const label = isHuman ? 'HUMAN' : wrongLabels[wrongLabelIndex++];
      const robotDetail = robotDetails[index];
      const robotSprite = isHuman ? null : robotSprites[robotSpriteIndex++];
      tile.type = 'button';
      tile.className = `human-portrait-tile robot-variant-${index + 1}${isHuman ? ' is-human' : ''}`;
      tile.setAttribute('aria-label', isHuman
        ? `Portrait ${index + 1}: Stephen with no robot features, labelled ${label}`
        : `Portrait ${index + 1}: Stephen-like character with a ${robotDetailLabels[robotDetail]}, labelled ${label}`);
      tile.setAttribute('aria-pressed', 'false');
      face.className = 'human-portrait-face';
      face.setAttribute('aria-hidden', 'true');
      face.innerHTML = isHuman
        ? '<i class="human-robot-sprite robot-sprite-4"></i>'
        : `<i class="human-robot-sprite robot-sprite-${robotSprite}"></i>`;
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
    const ghostCharacters = { U: 'V', X: 'K', 4: 'A', Z: '2', 7: 'T' };
    visual.className = `human-distorted-code${code === 'HUMAN' ? '' : ' is-noisy'}`;
    visual.setAttribute('role', 'img');
    visual.setAttribute('aria-label', `Code ${code.split('').join(' ')}`);
    visual.innerHTML = [...code]
      .map((character) => `<span data-ghost="${ghostCharacters[character] || '·'}">${character}</span>`)
      .join('') + '<i></i><i></i><b aria-hidden="true"></b>';
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
    instruction.textContent = 'Select the three traffic lights and two bicycles. Do not select the robot.';
    form.append(instruction, createTileGrid(checkpoint));
    renderCode(form, checkpoint.code);
    const label = document.createElement('label');
    label.className = 'human-final-confirmation';
    label.innerHTML = '<input type="checkbox" name="confirmed"><span>I confirm I completed both tests myself.</span>';
    form.append(label);
  }

  function createTileGrid(checkpoint) {
    const grid = document.createElement('div');
    grid.className = `human-image-grid${checkpoint.blurry ? ' is-blurry' : ''}${checkpoint.variant === 'traffic' ? ' is-traffic-grid' : ''}`;
    checkpoint.sources.forEach((source, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'human-image-tile';
      const subject = typeof source === 'string'
        ? (source.startsWith('light') ? 'traffic light' : 'robot head with signal-like features')
        : source === 3 ? 'traffic light' : source === 7 ? 'bicycle' : 'different object';
      tile.setAttribute('aria-label', `Image tile ${index + 1}: ${subject}`);
      tile.setAttribute('aria-pressed', 'false');
      if (typeof source === 'string') renderTrafficObject(tile, source);
      else setTileBackground(tile, source);
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

  function renderTrafficObject(tile, source) {
    const object = document.createElement('i');
    const isLight = source.startsWith('light');
    object.className = `human-traffic-object ${isLight ? 'is-light' : 'is-robot'} ${source}`;
    object.setAttribute('aria-hidden', 'true');
    object.innerHTML = isLight
      ? '<b></b><b></b><b></b><em></em>'
      : '<em></em><b></b><b></b><i></i>';
    tile.append(object);
  }

  function renderRoadCheck(form, checkpoint, index) {
    const instruction = document.createElement('p');
    const road = document.createElement('div');
    const bike = document.createElement('i');
    const status = document.createElement('p');
    const crossed = document.createElement('input');
    const controlsWrap = document.createElement('div');
    const roadState = { row: 0, column: 1, attempts: 3, locked: false, hitUntil: 0, moveUntil: 0 };

    form.classList.add('human-road-form');
    instruction.className = 'human-image-instruction';
    instruction.textContent = 'Guide Stephen across five lanes. Avoid the moving traffic.';
    road.className = 'human-bike-road';
    road.tabIndex = 0;
    road.setAttribute('role', 'application');
    road.setAttribute('aria-label', 'Road crossing game. Use arrow controls to move Stephen.');
    road.innerHTML = '<span class="human-road-safe is-top">Website</span><span class="human-road-lane lane-5"><b></b></span><span class="human-road-lane lane-4"><b></b></span><span class="human-road-lane lane-3"><b></b></span><span class="human-road-lane lane-2"><b></b></span><span class="human-road-lane lane-1"><b></b></span><span class="human-road-safe is-bottom">Start</span>';
    bike.className = 'human-road-player';
    bike.setAttribute('aria-hidden', 'true');
    road.append(bike);
    status.className = 'human-road-status';
    status.textContent = 'Tries 3/3. Reach the website.';
    crossed.type = 'hidden';
    crossed.name = 'crossed';
    crossed.value = 'no';
    controlsWrap.className = 'human-road-controls';

    const updateBike = () => {
      bike.style.setProperty('--bike-row', roadState.row);
      bike.style.setProperty('--bike-column', roadState.column);
    };
    const collides = () => {
      const bikeRect = bike.getBoundingClientRect();
      return [...road.querySelectorAll(`.lane-${roadState.row} b`)].some((car) => {
        const carRect = car.getBoundingClientRect();
        return bikeRect.right > carRect.left + 4 && bikeRect.left < carRect.right - 4;
      });
    };
    const handleCollision = (now) => {
      if (roadState.locked || now < roadState.hitUntil) return;
      roadState.hitUntil = now + 700;
      roadState.attempts -= 1;
      road.classList.remove('is-hit');
      void road.offsetWidth;
      road.classList.add('is-hit');
      framework.playSound('bad');
      if (roadState.attempts > 0) {
        roadState.row = 0;
        roadState.column = 1;
        roadState.moveUntil = now + 350;
        updateBike();
        status.textContent = `Traffic hit. Back to the start. ${roadState.attempts}/3 tries left.`;
        window.requestAnimationFrame(() => road.focus({ preventScroll: true }));
        return;
      }

      roadState.locked = true;
      game.errors += 1;
      game.patience = Math.max(0, game.patience - 1);
      game.score = Math.max(0, game.score - 75);
      updateHud(getElapsed());
      if (game.patience === 0) {
        finishGame(false, 'patience');
        return;
      }
      status.textContent = 'Three hits. Resetting the crossing with three new tries.';
      document.removeEventListener('keydown', handleRoadKey);
      window.setTimeout(() => {
        if (!road.isConnected || game.status !== 'challenge') return;
        renderCheckpoint(checkpoint, index);
        startCheckpointReading(index, checkpoint.duration || CHECKPOINT_DURATION);
      }, 650);
    };
    const monitorTraffic = (now) => {
      if (!road.isConnected) {
        document.removeEventListener('keydown', handleRoadKey);
        return;
      }
      if (game.status === 'paused') {
        window.requestAnimationFrame(monitorTraffic);
        return;
      }
      if (game.status !== 'challenge') {
        document.removeEventListener('keydown', handleRoadKey);
        return;
      }
      if (roadState.locked) return;
      if (roadState.row > 0 && roadState.row < 6 && collides()) handleCollision(now);
      window.requestAnimationFrame(monitorTraffic);
    };
    const move = (rowDelta, columnDelta) => {
      const now = performance.now();
      if (roadState.locked || game.status !== 'challenge' || game.checkpointReading || now < roadState.moveUntil) return;
      const nextColumn = Math.max(0, Math.min(2, roadState.column + columnDelta));
      const nextRow = Math.max(0, Math.min(6, roadState.row + rowDelta));
      if (nextColumn === roadState.column && nextRow === roadState.row) return;
      roadState.moveUntil = now + 180;
      roadState.column = nextColumn;
      roadState.row = nextRow;
      updateBike();
      framework.playSound('select');
      window.setTimeout(() => {
        if (!road.isConnected || roadState.locked) return;
        if (roadState.row === 6) {
          roadState.locked = true;
          document.removeEventListener('keydown', handleRoadKey);
          crossed.value = 'yes';
          road.classList.add('is-crossed');
          status.textContent = 'Road crossed.';
          framework.playSound('good');
          window.setTimeout(() => {
            if (road.isConnected && game.status === 'challenge') verifyCheckpoint(form, checkpoint, index);
          }, 320);
        } else {
          status.textContent = `Lane ${roadState.row} of 5. ${roadState.attempts}/3 tries left.`;
        }
      }, 110);
    };
    function handleRoadKey(event) {
      const moves = { ArrowLeft: [0, -1], ArrowUp: [1, 0], ArrowRight: [0, 1], ArrowDown: [-1, 0] };
      if (!road.isConnected || game.status !== 'challenge' || !moves[event.key]) return;
      event.preventDefault();
      if (event.repeat) return;
      move(...moves[event.key]);
    }

    [['←', 0, -1, 'Cycle left'], ['↑', 1, 0, 'Cycle forwards'], ['→', 0, 1, 'Cycle right']].forEach(([label, row, column, ariaLabel]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.setAttribute('aria-label', ariaLabel);
      button.addEventListener('click', () => move(row, column));
      controlsWrap.append(button);
    });
    document.addEventListener('keydown', handleRoadKey);

    updateBike();
    form.append(instruction, road, status, crossed, controlsWrap);
    window.requestAnimationFrame(monitorTraffic);
  }

  function scorePinGuess(guess, pin) {
    const result = Array(pin.length).fill('absent');
    const remaining = {};
    [...pin].forEach((digit, index) => {
      if (guess[index] === digit) result[index] = 'exact';
      else remaining[digit] = (remaining[digit] || 0) + 1;
    });
    [...guess].forEach((digit, index) => {
      if (result[index] === 'exact' || !remaining[digit]) return;
      result[index] = 'present';
      remaining[digit] -= 1;
    });
    return result;
  }

  function renderPinCheck(form, checkpoint, index) {
    const hint = document.createElement('p');
    const board = document.createElement('div');
    const controlsWrap = document.createElement('div');
    const entryWrap = document.createElement('label');
    const entryDisplay = document.createElement('span');
    const input = document.createElement('input');
    const button = document.createElement('button');
    const status = document.createElement('p');
    const solved = document.createElement('input');
    const maxGuesses = 4;
    let guesses = 0;
    let locked = false;

    form.classList.add('human-pin-form');
    hint.className = 'human-pin-hint';
    hint.textContent = 'Starter clue supplied. Digits do not repeat.';
    board.className = 'human-pin-board';
    board.setAttribute('aria-live', 'polite');
    controlsWrap.className = 'human-pin-controls';
    entryWrap.className = 'human-pin-entry';
    entryDisplay.className = 'human-pin-entry-digits';
    entryDisplay.setAttribute('aria-hidden', 'true');
    entryDisplay.innerHTML = '<i>–</i><i>–</i><i>–</i><i>–</i>';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]{4}';
    input.maxLength = 4;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Enter a four-digit PIN');
    input.placeholder = '';
    button.type = 'button';
    button.textContent = 'Test code';
    status.className = 'human-pin-status';
    status.textContent = 'Four guesses remaining.';
    solved.type = 'hidden';
    solved.name = 'pinSolved';
    solved.value = 'no';
    entryWrap.append(entryDisplay, input);

    const updateEntry = () => {
      const digits = input.value.replace(/\D/g, '').slice(0, 4);
      input.value = digits;
      [...entryDisplay.children].forEach((tile, digitIndex) => {
        tile.textContent = digits[digitIndex] || '–';
        tile.classList.toggle('is-filled', Boolean(digits[digitIndex]));
      });
    };
    input.addEventListener('input', updateEntry);

    const appendGuess = (guess, label) => {
      const row = document.createElement('div');
      const result = scorePinGuess(guess, checkpoint.pin);
      const rowLabel = document.createElement('small');
      row.className = 'human-pin-row';
      rowLabel.textContent = label;
      row.append(rowLabel);
      [...guess].forEach((digit, digitIndex) => {
        const tile = document.createElement('span');
        tile.className = `human-pin-digit is-${result[digitIndex]}`;
        tile.textContent = digit;
        tile.setAttribute('aria-label', `${digit}, ${result[digitIndex] === 'exact' ? 'correct position' : result[digitIndex] === 'present' ? 'wrong position' : 'not in code'}`);
        row.append(tile);
      });
      board.append(row);
    };

    const failAndReset = () => {
      locked = true;
      input.disabled = true;
      button.disabled = true;
      game.errors += 1;
      game.patience = Math.max(0, game.patience - 1);
      game.score = Math.max(0, game.score - 75);
      updateHud(getElapsed());
      if (game.patience === 0) {
        finishGame(false, 'patience');
        return;
      }
      status.textContent = `Code locked. Resetting with four guesses; ${game.patience} patience remaining.`;
      framework.playSound('bad');
      window.setTimeout(() => {
        if (!form.isConnected || game.status !== 'challenge') return;
        renderCheckpoint(checkpoint, index);
        startCheckpointReading(index, checkpoint.duration || CHECKPOINT_DURATION);
      }, 750);
    };

    const submitGuess = () => {
      if (locked) return;
      const guess = input.value.replace(/\D/g, '').slice(0, 4);
      input.value = guess;
      if (guess.length !== 4) {
        status.textContent = 'Enter exactly four numbers.';
        framework.playSound('bad');
        return;
      }
      guesses += 1;
      appendGuess(guess, `Guess ${guesses}`);
      input.value = '';
      updateEntry();
      if (guess === checkpoint.pin) {
        locked = true;
        solved.value = 'yes';
        input.disabled = true;
        button.disabled = true;
        status.textContent = 'PIN cracked. Website unlocked.';
        framework.playSound('good');
        window.setTimeout(() => {
          if (form.isConnected && game.status === 'challenge') verifyCheckpoint(form, checkpoint, index);
        }, 450);
        return;
      }
      framework.playSound('select');
      if (guesses >= maxGuesses) {
        failAndReset();
        return;
      }
      status.textContent = `${maxGuesses - guesses} guess${maxGuesses - guesses === 1 ? '' : 'es'} remaining.`;
      input.focus({ preventScroll: true });
    };

    appendGuess('1234', 'Starter');
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 4);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      submitGuess();
    });
    button.addEventListener('click', submitGuess);
    controlsWrap.append(entryWrap, button);
    form.append(hint, board, controlsWrap, status, solved);
  }

  function setTileBackground(element, source) {
    const crops = [
      ['5%', '3%'],
      ['61%', '49%'],
      ['83%', '57%'],
      ['7%', '57%'],
      ['44%', '17%'],
      ['1%', '90%'],
      ['100%', '77%'],
      ['37%', '60%'],
      ['49%', '89%']
    ];
    const [x, y] = crops[source] || crops[0];
    element.style.setProperty('--tile-x', x);
    element.style.setProperty('--tile-y', y);
  }

  function verifyCheckpoint(form, checkpoint, index) {
    let correct = false;
    if (checkpoint.kind === 'portraits') correct = selectedTilesAreCorrect(checkpoint.correct);
    if (checkpoint.kind === 'signal') correct = form.elements.signalSolved?.value === 'yes';
    if (checkpoint.kind === 'code') correct = normaliseCode(form.elements.code?.value) === checkpoint.code;
    if (checkpoint.kind === 'images') correct = selectedTilesAreCorrect(checkpoint.correct);
    if (checkpoint.kind === 'road') correct = form.elements.crossed?.value === 'yes';
    if (checkpoint.kind === 'pin') correct = form.elements.pinSolved?.value === 'yes';
    if (checkpoint.kind === 'final') {
      correct = selectedTilesAreCorrect(checkpoint.correct)
        && normaliseCode(form.elements.code?.value) === checkpoint.code
        && Boolean(form.elements.confirmed?.checked);
    }

    if (!correct) {
      game.errors += 1;
      game.score = Math.max(0, game.score - 50);
      if (checkpoint.kind === 'portraits' || checkpoint.kind === 'images' || checkpoint.kind === 'final') {
        const missed = checkpoint.correct.filter((tile) => !game.selectedTiles.has(tile));
        const extras = [...game.selectedTiles].filter((tile) => !checkpoint.correct.includes(tile));
        const details = [];
        if (missed.length) details.push(`${missed.length} required tile${missed.length === 1 ? ' is' : 's are'} missing`);
        if (extras.length) details.push(`${extras.length} extra tile${extras.length === 1 ? ' is' : 's are'} selected`);
        if (checkpoint.kind === 'final' && normaliseCode(form.elements.code?.value) !== checkpoint.code) details.push('the character code is incorrect');
        if (checkpoint.kind === 'final' && !form.elements.confirmed?.checked) details.push('the confirmation box is unticked');
        checkpointFeedback.textContent = details.length ? `${details.join('; ')}. Try again.` : 'That selection did not pass. Try again.';
        form.querySelectorAll('.human-image-tile, .human-portrait-tile').forEach((tile, tileIndex) => {
          tile.classList.toggle('is-error', game.selectedTiles.has(tileIndex) && !checkpoint.correct.includes(tileIndex));
          tile.classList.toggle('is-missed', checkpoint.correct.includes(tileIndex) && !game.selectedTiles.has(tileIndex));
        });
      } else if (checkpoint.kind === 'road') {
        checkpointFeedback.textContent = 'Cross the road on the bike before continuing.';
      } else {
        checkpointFeedback.textContent = 'Verification failed. The answer is still in front of you.';
      }
      framework.playSound('bad');
      announce(checkpointFeedback.textContent);
      updateHud(getElapsed());
      return;
    }

    const gate = game.gates[index];
    window.clearInterval(game.checkpointTimerId);
    game.checkpointTimerId = null;
    window.clearTimeout(game.checkpointReadTimerId);
    game.checkpointReadTimerId = null;
    game.checkpointReading = false;
    game.checkpointWarmup = false;
    checkpointBody.inert = false;
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
      'Time the opening stretch and jump the rising pop-up.',
      'Climb into the low-contrast route. Each platform brightens when you land.',
      'Vault the cookie banner, then jump towards the traffic lights.',
      'Keep moving across the unstable CAPTCHA tiles, then cross the road by bike.',
      'Dodge the moving Verify button and reach the PIN terminal.',
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
    if (game.status === 'challenge') {
      if (game.checkpointReading) {
        game.checkpointReadRemaining = Math.max(0, game.checkpointReadDeadline - performance.now());
        window.clearTimeout(game.checkpointReadTimerId);
        game.checkpointReadTimerId = null;
      } else if (!game.checkpointWarmup) {
        game.checkpointRemaining = Math.max(0, game.checkpointDeadline - performance.now());
        window.clearInterval(game.checkpointTimerId);
        game.checkpointTimerId = null;
      }
    }
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
    if (game.status === 'challenge') {
      if (game.checkpointReading) startCheckpointReading(game.checks, game.checkpointDuration, game.checkpointReadRemaining || CHECKPOINT_READING_TIME);
      else if (!game.checkpointWarmup) startCheckpointTimer(game.checks, game.checkpointRemaining || CHECKPOINT_DURATION);
    }
    touchControls.inert = game.status === 'challenge';
    playfield.setAttribute('tabindex', game.status === 'playing' ? '0' : '-1');
    pausePanel.hidden = true;
    announce('Game resumed.');
    game.frame = window.requestAnimationFrame(runFrame);
    window.requestAnimationFrame(() => {
      if (game.status === 'challenge' && game.checkpointReading) checkpointTitle.focus({ preventScroll: true });
      else if (game.status === 'challenge') focusCheckpointControl();
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
  startButton?.addEventListener('click', () => {
    if (typeof framework.startCountdown === 'function') {
      framework.startCountdown(dialog, startGame);
      return;
    }
    startGame();
  });
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  dialog.querySelector('[data-captcha-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-captcha-choose]')?.addEventListener('click', framework.exitArcade);
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
