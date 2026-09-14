(() => {
  const dialog = document.querySelector('#menu-dialog');
  const framework = window.UXArcade;
  if (!dialog || !framework) return;

  const screens = [...dialog.querySelectorAll('[data-menu-screen]')];
  const startButton = dialog.querySelector('[data-menu-start]');
  const pauseButton = dialog.querySelector('[data-menu-pause]');
  const resumeButton = dialog.querySelector('[data-menu-resume]');
  const pausePanel = dialog.querySelector('[data-menu-pause-panel]');
  const browser = dialog.querySelector('#menu-browser');
  const categoryGrid = dialog.querySelector('#menu-category-grid');
  const taskOutput = dialog.querySelector('#menu-task');
  const phaseOutput = dialog.querySelector('#menu-phase');
  const feedbackLine = dialog.querySelector('#menu-feedback-line');
  const scoreOutput = dialog.querySelector('#menu-score');
  const foundOutput = dialog.querySelector('#menu-round');
  const streakOutput = dialog.querySelector('#menu-streak');
  const timeOutput = dialog.querySelector('#menu-time');
  const timeProgress = dialog.querySelector('#menu-time-progress');
  const timerPanel = dialog.querySelector('.menu-timer');
  const liveStatus = dialog.querySelector('#menu-live-status');
  const resultTitle = dialog.querySelector('#menu-result-title');
  const resultCopy = dialog.querySelector('#menu-result-copy');
  const finalScore = dialog.querySelector('#menu-final-score');
  const bestScore = dialog.querySelector('#menu-best-score');
  const finalCorrect = dialog.querySelector('#menu-final-correct');
  const arcadeTitle = document.querySelector('#arcade-title');
  const menuCard = document.querySelector('[data-game-card="mega-menu-mayhem"]');
  const reducedMotion = framework.isReducedMotion;
  const touchFirst = window.matchMedia('(hover: none)').matches;
  const sessionDuration = 30000;
  const baseWrongTurnPenalty = 2000;
  const correctRouteBonus = 2000;

  const tasks = [
    {
      task: 'Find running shoes.', phase: 'Clear labels', answer: 'running-shoes',
      groups: [
        ['Shop', [['New arrivals', 'new'], ['Running shoes', 'running-shoes'], ['Jackets', 'jackets']]],
        ['Account', [['Sign in', 'sign-in'], ['Orders', 'orders'], ['Saved items', 'saved']]],
        ['Help', [['Delivery', 'delivery'], ['Returns', 'returns'], ['Contact', 'contact']]]
      ]
    },
    {
      task: 'Return a product.', phase: 'Buried route', answer: 'returns-refunds',
      groups: [
        ['Shop', [['Offers', 'offers'], ['Gift cards', 'gifts'], ['Stores', 'stores']]],
        ['Orders', [['Track an order', 'track'], ['Order history', 'history'], ['Change an order', 'change']]],
        ['Help', [['Delivery information', 'delivery-info'], ['Returns & refunds', 'returns-refunds'], ['Contact us', 'contact']]]
      ]
    },
    {
      task: 'Update your delivery address.', phase: 'Similar labels', answer: 'delivery-addresses',
      groups: [
        ['Your account', [['Profile', 'profile'], ['Delivery addresses', 'delivery-addresses'], ['Payment methods', 'payment']]],
        ['Orders', [['Change delivery', 'current-delivery'], ['Track order', 'track'], ['Order history', 'history']]],
        ['Help', [['Address help', 'address-help'], ['Delivery questions', 'delivery-help'], ['Contact', 'contact']]]
      ]
    },
    {
      task: 'Download an invoice.', phase: 'Wrong category', answer: 'invoice',
      groups: [
        ['Documents', [['Policies', 'policies'], ['Product guides', 'guides'], ['Downloads', 'downloads']]],
        ['Orders', [['Order details', 'details'], ['Download invoice', 'invoice'], ['Receipts', 'receipts']]],
        ['Business', [['Billing help', 'billing'], ['Tax settings', 'tax'], ['Statements', 'statements']]]
      ]
    },
    {
      task: 'Cancel a membership.', phase: 'Vague labels', answer: 'cancel-action',
      groups: [
        ['Account', [['Manage membership', 'upsell'], ['Cancel membership', 'cancel-action'], ['Billing', 'billing']]],
        ['Help', [['Cancellation guidance', 'cancel-article'], ['Cancellation policy', 'policy'], ['Contact', 'contact']]],
        ['Offers', [['Change plan', 'plan'], ['Pause membership', 'pause'], ['Member prices', 'prices']]]
      ]
    },
    {
      task: 'Find accessibility information.', phase: 'Buried language', answer: 'accessibility-info',
      groups: [
        ['About', [['Our story', 'story'], ['Jobs', 'jobs'], ['Inclusive hiring', 'hiring']]],
        ['The small print', [['Privacy', 'privacy'], ['Accessibility information', 'accessibility-info'], ['Terms', 'terms']]],
        ['Shop', [['Accessible products', 'products'], ['Filters', 'filters'], ['Size guide', 'size']]]
      ]
    },
    {
      task: 'Report a faulty product.', phase: 'Similar routes', answer: 'report-fault',
      groups: [
        ['After you buy', [['Product care', 'care'], ['Report a fault', 'report-fault'], ['Warranty', 'warranty']]],
        ['Help', [['Returns', 'returns'], ['Report a problem', 'article'], ['Chat', 'chat']]],
        ['Support', [['Technical support', 'technical'], ['Troubleshoot a fault', 'technical-fault'], ['Manuals', 'manuals']]]
      ]
    },
    {
      task: 'Speak to a person.', phase: 'Human hidden', answer: 'call-support',
      groups: [
        ['Help centre', [['Popular answers', 'answers'], ['Ask the chatbot', 'bot'], ['FAQs', 'faqs']]],
        ['Contact', [['Send a message', 'message'], ['Community', 'community'], ['Virtual assistant', 'assistant']]],
        ['Still stuck?', [['Call support', 'call-support'], ['Request a callback', 'callback'], ['Opening hours', 'hours']]]
      ]
    },
    {
      task: 'Reset your password.', phase: 'Security maze', answer: 'reset-password',
      groups: [
        ['Your account', [['Profile', 'profile'], ['Sign-in & security', 'security'], ['Communication settings', 'comms']]],
        ['Help centre', [['Reset your password', 'reset-password'], ['Unlock your account', 'unlock'], ['Sign-in problems', 'sign-in-help']]],
        ['Privacy', [['Your data', 'data'], ['Device history', 'devices'], ['Permissions', 'permissions']]]
      ]
    },
    {
      task: 'Check the size guide.', phase: 'Product detour', answer: 'size-guide',
      groups: [
        ['Shop', [['Clothing', 'clothing'], ['Collections', 'collections'], ['New this week', 'new-week']]],
        ['Before you buy', [['Size guide', 'size-guide'], ['Product information', 'product-info'], ['Stock checks', 'stock']]],
        ['Help', [['Fit advice', 'fit-advice'], ['Returns', 'returns'], ['Contact', 'contact']]]
      ]
    },
    {
      task: 'Track your delivery.', phase: 'Status overload', answer: 'track-delivery',
      groups: [
        ['Orders', [['Order history', 'history'], ['Track delivery', 'track-delivery'], ['Change an order', 'change-order']]],
        ['Delivery', [['Delivery options', 'options'], ['Estimated times', 'estimates'], ['Courier information', 'couriers']]],
        ['Help', [['Where is my order?', 'where-order'], ['Late deliveries', 'late'], ['Missing items', 'missing']]]
      ]
    },
    {
      task: 'Delete your account.', phase: 'Exit concealed', answer: 'delete-account',
      groups: [
        ['Account', [['Your details', 'details'], ['Account controls', 'controls'], ['Delete account', 'delete-account']]],
        ['Privacy', [['Download your data', 'download-data'], ['Data choices', 'choices'], ['Cookie settings', 'cookies']]],
        ['Help', [['Close membership', 'close-membership'], ['Leaving us', 'leaving'], ['Contact support', 'support']]]
      ]
    },
    {
      task: 'Redeem a gift card.', phase: 'Payment puzzle', answer: 'redeem-gift-card',
      groups: [
        ['Shop', [['Gift cards', 'gift-cards'], ['Offers', 'offers'], ['Member prices', 'member-prices']]],
        ['Checkout help', [['Payment methods', 'payment-methods'], ['Redeem a gift card', 'redeem-gift-card'], ['Promotional codes', 'promo-codes']]],
        ['Account', [['Credit balance', 'credit'], ['Saved payments', 'saved-payments'], ['Billing history', 'billing-history']]]
      ]
    },
    {
      task: 'Find a store’s opening hours.', phase: 'Location loop', answer: 'store-hours',
      groups: [
        ['Visit us', [['Find a store', 'find-store'], ['Store opening hours', 'store-hours'], ['Accessibility in store', 'store-access']]],
        ['About', [['Our locations', 'locations'], ['Where we work', 'work'], ['Contact us', 'contact']]],
        ['Help', [['Holiday opening', 'holiday'], ['Collection points', 'collection'], ['Local services', 'local']]]
      ]
    },
    {
      task: 'Download a returns label.', phase: 'Returns maze', answer: 'returns-label',
      groups: [
        ['Orders', [['Order details', 'order-details'], ['Previous returns', 'previous-returns'], ['Receipts', 'receipts']]],
        ['Returns', [['Start a return', 'start-return'], ['Download returns label', 'returns-label'], ['Refund status', 'refund-status']]],
        ['Delivery help', [['Parcel guidance', 'parcel'], ['Printer-free returns', 'printer-free'], ['Drop-off points', 'drop-off']]]
      ]
    },
    {
      task: 'Stop promotional emails.', phase: 'Preference fog', answer: 'email-preferences',
      groups: [
        ['Your account', [['Profile', 'profile'], ['Email preferences', 'email-preferences'], ['Notification history', 'notifications']]],
        ['Privacy', [['Marketing choices', 'marketing-choices'], ['Cookie controls', 'cookie-controls'], ['Data permissions', 'data-permissions']]],
        ['Help', [['Unsubscribe help', 'unsubscribe-help'], ['Missing emails', 'missing-emails'], ['Contact', 'contact']]]
      ]
    },
    {
      task: 'Replace a damaged item.', phase: 'Support shuffle', answer: 'replace-damaged',
      groups: [
        ['After delivery', [['Report damage', 'report-damage'], ['Replace a damaged item', 'replace-damaged'], ['Missing parts', 'missing-parts']]],
        ['Returns', [['Return an item', 'return-item'], ['Refund options', 'refund-options'], ['Exchange sizes', 'exchange-size']]],
        ['Product help', [['Care instructions', 'care'], ['Warranty', 'warranty'], ['Repairs', 'repairs']]]
      ]
    },
    {
      task: 'Review your privacy controls.', phase: 'Small-print finale', answer: 'privacy-controls',
      groups: [
        ['Privacy', [['Privacy notice', 'privacy-notice'], ['Privacy controls', 'privacy-controls'], ['Data requests', 'data-requests']]],
        ['Account', [['Security', 'security'], ['Connected apps', 'connected-apps'], ['Sign-in history', 'sign-in-history']]],
        ['Legal', [['Terms of use', 'terms'], ['Cookie policy', 'cookie-policy'], ['Consent records', 'consent-records']]]
      ]
    },
    {
      task: 'Find directions to your nearest store.', phase: 'Location language', answer: 'store-directions',
      groups: [
        ['Stores', [['Find a location', 'find-location'], ['Directions to a store', 'store-directions'], ['Store services', 'store-services']]],
        ['Visit us', [['Opening hours', 'opening-hours'], ['Parking information', 'parking'], ['Accessibility', 'accessibility']]],
        ['Help', [['Delivery areas', 'delivery-areas'], ['Collection points', 'collection-points'], ['Contact a store', 'contact-store']]]
      ]
    },
    {
      task: 'Register for the newsletter.', phase: 'Sign-up scattered', answer: 'newsletter-register',
      groups: [
        ['Stay in touch', [['Register for the newsletter', 'newsletter-register'], ['Follow us', 'social'], ['Latest stories', 'stories']]],
        ['Your account', [['Communication settings', 'communication-settings'], ['Create an account', 'create-account'], ['Saved interests', 'interests']]],
        ['Offers', [['Member rewards', 'rewards'], ['Email-only offers', 'email-offers'], ['Promotion terms', 'promotion-terms']]]
      ]
    }
  ];

  const game = {
    status: 'idle', score: 0, found: 0, streak: 0, tasksShown: 0,
    taskIndex: 0, sessionElapsed: 0, sessionStartedAt: 0, frame: null,
    locked: false, shuffleCount: 0, pointerShuffleArmed: false,
    timers: [], focusBeforePause: null, keyboardMode: false, taskOrder: [], taskCursor: 0
  };
  let returnFocusTarget;

  function switchScreen(name) {
    const labels = { instructions: 'menu-screen-title', playing: 'menu-playing-title', result: 'menu-result-title' };
    screens.forEach((screen) => { screen.hidden = screen.dataset.menuScreen !== name; });
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
        menuCard?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        arcadeTitle.addEventListener('blur', () => arcadeTitle.removeAttribute('tabindex'), { once: true });
      } else if (returnFocusTarget?.isConnected) {
        returnFocusTarget.focus({ preventScroll: true });
      }
    });
  }

  function clearRuntime() {
    window.cancelAnimationFrame(game.frame);
    game.frame = null;
    game.timers.forEach((timer) => window.clearTimeout(timer));
    game.timers = [];
  }

  function resetGame() {
    clearRuntime();
    Object.assign(game, {
      status: 'idle', score: 0, found: 0, streak: 0, tasksShown: 0,
      taskIndex: 0, sessionElapsed: 0, sessionStartedAt: 0, locked: false,
      shuffleCount: 0, pointerShuffleArmed: false, focusBeforePause: null, keyboardMode: false,
      taskOrder: [], taskCursor: 0
    });
    pausePanel.hidden = true;
    pauseButton.disabled = false;
    categoryGrid.inert = false;
    categoryGrid.replaceChildren();
    phaseOutput.classList.remove('is-unstable');
    timerPanel.classList.remove('is-low');
    feedbackLine.textContent = 'The answer is in here somewhere.';
    updateHud(0);
  }

  function startGame() {
    resetGame();
    if (tasks.some((task) => !validateTask(task))) {
      feedbackLine.textContent = 'This menu has failed its route check.';
      announce('The game could not start because a task has no unique correct route.');
      return;
    }
    switchScreen('playing');
    game.status = 'playing';
    game.taskOrder = shuffle(tasks.map((_, index) => index));
    game.taskCursor = 0;
    game.sessionStartedAt = performance.now();
    loadTask();
    game.frame = window.requestAnimationFrame(runFrame);
    framework.playSound('select');
    announce('Thirty seconds. Find as many destinations as you can.');
  }

  function loadTask(message = 'The answer is in here somewhere.') {
    if (game.status !== 'playing') return;
    clearInstability();
    if (game.taskCursor >= game.taskOrder.length) {
      const previousTask = game.taskIndex;
      game.taskOrder = shuffle(tasks.map((_, taskIndex) => taskIndex));
      if (game.taskOrder[0] === previousTask) game.taskOrder.push(game.taskOrder.shift());
      game.taskCursor = 0;
    }
    game.taskIndex = game.taskOrder[game.taskCursor];
    game.taskCursor += 1;
    game.locked = false;
    game.shuffleCount = 0;
    const task = tasks[game.taskIndex];
    game.pointerShuffleArmed = Boolean(task.unstable && !reducedMotion);
    taskOutput.textContent = task.task;
    phaseOutput.textContent = task.phase;
    phaseOutput.classList.toggle('is-unstable', Boolean(task.unstable));
    feedbackLine.textContent = message;
    browser.scrollTop = 0;
    renderMenu(task);
    scheduleTouchInstability();
    if (game.keyboardMode) {
      window.requestAnimationFrame(() => categoryGrid.querySelector('.menu-destination')?.focus({ preventScroll: true }));
    } else {
      window.requestAnimationFrame(() => taskOutput.focus({ preventScroll: true }));
    }
  }

  function renderMenu(task) {
    const groups = game.tasksShown >= tasks.length ? shuffle(task.groups) : [...task.groups];
    const fragment = document.createDocumentFragment();
    groups.forEach((group, categoryIndex) => {
      const [titleText, rawLinks] = group;
      const panel = document.createElement('section');
      const title = document.createElement('h4');
      const list = document.createElement('ul');
      const titleId = `menu-category-${game.tasksShown}-${categoryIndex}`;
      const links = game.tasksShown >= tasks.length ? shuffle(rawLinks) : rawLinks;
      panel.className = 'menu-category';
      panel.dataset.shortcut = String(categoryIndex + 1);
      panel.setAttribute('aria-labelledby', titleId);
      title.id = titleId;
      title.textContent = `${categoryIndex + 1}. ${titleText}`;
      panel.append(title);
      links.forEach(([label, destination]) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'menu-destination';
        button.textContent = label;
        button.setAttribute('aria-label', `${label}, in ${titleText}`);
        button.addEventListener('click', () => chooseDestination(destination, button));
        item.append(button);
        list.append(item);
      });
      panel.append(list);
      fragment.append(panel);
    });
    categoryGrid.replaceChildren(fragment);
  }

  function validateTask(task) {
    const matches = task.groups.flatMap(([, links]) => links).filter(([, destination]) => destination === task.answer);
    return matches.length === 1;
  }

  function runFrame(now) {
    if (game.status !== 'playing') return;
    const elapsed = game.sessionElapsed + ((now - game.sessionStartedAt) * getTimerRate());
    updateHud(elapsed);
    if (elapsed >= sessionDuration) {
      finishGame();
      return;
    }
    game.frame = window.requestAnimationFrame(runFrame);
  }

  function chooseDestination(destination, button) {
    if (game.status !== 'playing' || game.locked || button.classList.contains('is-wrong')) return;
    const task = tasks[game.taskIndex];
    if (destination === task.answer) {
      captureElapsed();
      game.sessionElapsed = Math.max(0, game.sessionElapsed - correctRouteBonus);
      game.locked = true;
      game.found += 1;
      game.streak += 1;
      game.score += 150 + Math.min(180, (game.streak - 1) * 20) + (game.taskIndex * 15);
      game.tasksShown += 1;
      framework.playSound('good');
      announce(`Destination found. Two seconds restored. ${game.found} found.`);
      updateHud(getElapsed());
      window.requestAnimationFrame(() => loadTask(`Correct route. +2 seconds. Countdown now ${getTimerRate().toFixed(1)}× speed.`));
      return;
    }

    captureElapsed();
    const wrongTurnPenalty = getWrongTurnPenalty();
    game.sessionElapsed += wrongTurnPenalty;
    game.score = Math.max(0, game.score - 40);
    game.streak = 0;
    button.classList.add('is-wrong');
    button.setAttribute('aria-disabled', 'true');
    feedbackLine.textContent = `Wrong turn. ${wrongTurnPenalty / 1000} seconds lost.`;
    framework.playSound('bad');
    announce(`Wrong turn. Forty points and ${wrongTurnPenalty / 1000} seconds lost.`);
    updateHud(game.sessionElapsed);
    if (game.sessionElapsed >= sessionDuration) finishGame();
  }

  function getElapsed() {
    return game.status === 'playing'
      ? game.sessionElapsed + ((performance.now() - game.sessionStartedAt) * getTimerRate())
      : game.sessionElapsed;
  }

  function getTimerRate() {
    return Math.min(1.85, 1 + (game.found * 0.08));
  }

  function getWrongTurnPenalty() {
    return Math.min(5000, baseWrongTurnPenalty + (Math.floor(game.found / 3) * 1000));
  }

  function captureElapsed() {
    if (game.status !== 'playing') return;
    const now = performance.now();
    game.sessionElapsed += (now - game.sessionStartedAt) * getTimerRate();
    game.sessionStartedAt = now;
  }

  function updateHud(elapsed) {
    const remaining = Math.max(0, sessionDuration - elapsed);
    scoreOutput.textContent = framework.formatScore(game.score);
    foundOutput.textContent = String(game.found);
    streakOutput.textContent = String(game.streak);
    timeOutput.textContent = `${Math.ceil(remaining / 1000)}s · ${getTimerRate().toFixed(1)}×`;
    timeProgress.max = sessionDuration;
    timeProgress.value = remaining;
    timeProgress.textContent = `${Math.ceil(remaining / 1000)} seconds remaining`;
    timerPanel.classList.toggle('is-low', remaining <= 5000);
  }

  function pauseGame() {
    if (game.status !== 'playing') return;
    game.focusBeforePause = document.activeElement;
    captureElapsed();
    clearRuntime();
    game.status = 'paused';
    categoryGrid.inert = true;
    pausePanel.hidden = false;
    announce('Game paused.');
    window.requestAnimationFrame(() => resumeButton?.focus());
  }

  function resumeGame() {
    if (game.status !== 'paused') return;
    game.status = 'playing';
    game.sessionStartedAt = performance.now();
    categoryGrid.inert = false;
    pausePanel.hidden = true;
    game.frame = window.requestAnimationFrame(runFrame);
    scheduleTouchInstability();
    announce('Game resumed.');
    window.requestAnimationFrame(() => {
      if (game.focusBeforePause?.isConnected && categoryGrid.contains(game.focusBeforePause)) {
        game.focusBeforePause.focus({ preventScroll: true });
      } else {
        taskOutput.focus({ preventScroll: true });
      }
    });
  }

  function clearInstability() {
    game.timers.forEach((timer) => window.clearTimeout(timer));
    game.timers = [];
  }

  function scheduleTimer(callback, delay) {
    const timer = window.setTimeout(() => {
      game.timers = game.timers.filter((id) => id !== timer);
      if (game.status === 'playing') callback();
    }, delay);
    game.timers.push(timer);
  }

  function scheduleTouchInstability() {
    const task = tasks[game.taskIndex];
    if (!touchFirst || reducedMotion || !task.unstable || game.shuffleCount >= task.unstable) return;
    scheduleTimer(() => {
      if (!categoryGrid.contains(document.activeElement)) shuffleMenu();
    }, 1400);
  }

  function handlePointerEntry(event) {
    const task = tasks[game.taskIndex];
    if (event.pointerType !== 'mouse' || !game.pointerShuffleArmed || game.status !== 'playing' || reducedMotion || !task.unstable || categoryGrid.contains(document.activeElement)) return;
    game.pointerShuffleArmed = false;
    scheduleTimer(() => {
      if (!categoryGrid.contains(document.activeElement)) shuffleMenu();
    }, 110);
  }

  function shuffleMenu() {
    const task = tasks[game.taskIndex];
    const panels = [...categoryGrid.children];
    if (panels.length < 2 || game.shuffleCount >= (task.unstable || 0)) return;
    const reordered = shuffle(panels);
    if (reordered.every((panel, index) => panel === panels[index])) reordered.push(reordered.shift());
    reordered.forEach((panel, index) => {
      panel.dataset.shortcut = String(index + 1);
      const heading = panel.querySelector('h4');
      heading.textContent = `${index + 1}. ${heading.textContent.replace(/^\d+\.\s*/, '')}`;
      categoryGrid.append(panel);
    });
    game.shuffleCount += 1;
    categoryGrid.classList.remove('is-shuffling');
    void categoryGrid.offsetWidth;
    categoryGrid.classList.add('is-shuffling');
    phaseOutput.textContent = 'Layout shifted';
    feedbackLine.textContent = 'The menu moved. The task did not.';
    framework.playSound('bad');
    announce('The menu changed order. The task has not changed.');
  }

  function finishGame() {
    if (game.status !== 'playing') return;
    clearRuntime();
    game.status = 'ended';
    const savedProgress = framework.saveGameProgress('mega-menu-mayhem', game.score, true);
    if (game.found >= 9) {
      resultTitle.textContent = 'You found the useful route.';
      resultCopy.textContent = 'You navigated the vague labels and crowded categories. Clear information architecture should be less exciting.';
    } else if (game.found >= 5) {
      resultTitle.textContent = 'The destination was in there somewhere.';
      resultCopy.textContent = 'You found several routes despite a menu working hard to turn simple tasks into detective work.';
    } else {
      resultTitle.textContent = 'The menu became the task.';
      resultCopy.textContent = 'When people have to learn the navigation before using the service, the structure needs work.';
    }
    finalScore.textContent = framework.formatScore(game.score);
    bestScore.textContent = framework.formatScore(savedProgress.best);
    finalCorrect.textContent = String(game.found);
    switchScreen('result');
    framework.playSound('success');
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

  document.querySelectorAll('[data-open-game="mega-menu-mayhem"]').forEach((button) => {
    button.addEventListener('click', () => openGame(button));
  });
  dialog.querySelectorAll('[data-menu-exit]').forEach((button) => {
    button.addEventListener('click', framework.exitArcade);
  });
  startButton?.addEventListener('click', () => framework.startCountdown(dialog, startGame));
  pauseButton?.addEventListener('click', pauseGame);
  resumeButton?.addEventListener('click', resumeGame);
  categoryGrid.addEventListener('pointermove', handlePointerEntry);
  dialog.querySelector('[data-menu-play-again]')?.addEventListener('click', startGame);
  dialog.querySelector('[data-menu-choose]')?.addEventListener('click', framework.exitArcade);

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
    if (!dialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'p') {
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
    if (key === 'tab' || key.startsWith('arrow') || /^[1-5]$/.test(key)) game.keyboardMode = true;
    if (/^[1-5]$/.test(key)) {
      const category = categoryGrid.querySelector(`[data-shortcut="${key}"]`);
      const firstLink = category?.querySelector('.menu-destination');
      if (firstLink) {
        event.preventDefault();
        firstLink.focus({ preventScroll: true });
        firstLink.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      }
      return;
    }
    const currentLink = event.target instanceof Element ? event.target.closest('.menu-destination') : null;
    if (!currentLink || !categoryGrid.contains(currentLink)) return;
    const currentCategory = currentLink.closest('.menu-category');
    const categories = [...categoryGrid.querySelectorAll('.menu-category')];
    const links = [...currentCategory.querySelectorAll('.menu-destination')];
    const linkIndex = links.indexOf(currentLink);
    let target;
    if (key === 'arrowdown') target = links[(linkIndex + 1) % links.length];
    else if (key === 'arrowup') target = links[(linkIndex - 1 + links.length) % links.length];
    else if (key === 'arrowright' || key === 'arrowleft') {
      const direction = key === 'arrowright' ? 1 : -1;
      const categoryIndex = categories.indexOf(currentCategory);
      const nextCategory = categories[(categoryIndex + direction + categories.length) % categories.length];
      const nextLinks = [...nextCategory.querySelectorAll('.menu-destination')];
      target = nextLinks[Math.min(linkIndex, nextLinks.length - 1)];
    }
    if (target) {
      event.preventDefault();
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && game.status === 'playing') pauseGame();
  });
})();
