(() => {
  const gameScripts = {
    'captcha-boss': 'captcha-boss.js?v=66',
    'white-space-race': 'white-space-race.js?v=11',
    'pac-facts': 'pac-facts.js?v=56',
    'design-debt': 'design-debt.js?v=64',
    'scope-invaders': 'scope-invaders.js?v=55',
    'contrast-crash': 'contrast-crash.js?v=55',
    'mega-menu-mayhem': 'mega-menu-mayhem.js?v=55'
  };
  const loading = new Map();

  const ensureGameMarkup = (gameId) => {
    const template = document.querySelector(`template[data-game-template="${gameId}"]`);
    if (!template) return;
    template.replaceWith(template.content.cloneNode(true));
  };

  const loadGame = (gameId) => {
    if (!gameScripts[gameId]) return Promise.resolve();
    if (loading.has(gameId)) return loading.get(gameId);
    ensureGameMarkup(gameId);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = gameScripts[gameId];
      script.async = true;
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    });
    loading.set(gameId, promise);
    return promise;
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-game]');
    const gameId = trigger?.dataset.openGame;
    if (!trigger || !gameScripts[gameId] || trigger.dataset.gameReady === 'true') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    trigger.disabled = true;
    loadGame(gameId).then(() => {
      trigger.dataset.gameReady = 'true';
      trigger.disabled = false;
      trigger.click();
    }).catch(() => { trigger.disabled = false; });
  }, true);
})();
