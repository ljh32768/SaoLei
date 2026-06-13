/**
 * 扫雷增强版 - 主入口文件
 */

import { GameState, DIFF, POWERUPS, ADVENTURE_LEVELS } from './game.js';
import { BoardRenderer } from './board.js';
import { PowerupManager } from './powerups.js';
import { AdventureManager } from './adventure.js';
import { StatsManager, ACHIEVEMENTS } from './stats.js';
import { DailyManager } from './daily.js';
import { audioManager } from './audio.js';
import { ParticleManager } from './particles.js';
import * as StorageManager from './storage.js';
import { formatTime, getDifficulty, getTodayString } from './utils.js';
import TutorialManager from './tutorial.js';

// ========== 全局状态 ==========
let gameState = new GameState();
let settings = {};
let stats = {};

// ========== DOM元素引用 ==========
const elements = {};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  loadSettings();
  initModules();
  initGame();
  bindEvents();
  initTabs();
  initThemeSelector();

  // 显示统计
  StatsManager.init(StorageManager);
  StatsManager.updateStatsDisplay();

  // 初始化冒险地图
  AdventureManager.init(StorageManager);
  renderAdventureMap();

  // 初始化每日挑战
  DailyManager.init(StorageManager);
  const dailyContainer = elements.dailyChallenge?.parentElement || document.getElementById('panel-daily');
  DailyManager.initDailyChallenge(dailyContainer);

  // 首次游戏显示教程
  if (TutorialManager.shouldShowTutorial()) {
    setTimeout(() => TutorialManager.startTutorial(), 500);
  }
});

/**
 * 初始化DOM元素引用
 */
function initElements() {
  elements.board = document.getElementById('board');
  elements.mineCount = document.getElementById('mineCount');
  elements.timer = document.getElementById('timer');
  elements.msg = document.getElementById('msg');
  elements.comboDisplay = document.getElementById('comboDisplay');
  elements.healthBar = document.getElementById('healthBar');
  elements.powerupBar = document.getElementById('powerupBar');
  elements.difficulty = document.getElementById('difficulty');
  elements.reset = document.getElementById('reset');
  elements.hexMode = document.getElementById('hexMode');
  elements.soundToggle = document.getElementById('soundToggle');
  elements.particleToggle = document.getElementById('particleToggle');
  elements.autoFlagToggle = document.getElementById('autoFlagToggle');
  elements.themeSelector = document.getElementById('themeSelector');
  elements.adventureMap = document.getElementById('adventureMap');
  elements.adventureTitle = document.getElementById('adventureTitle');
  elements.adventureDesc = document.getElementById('adventureDesc');
  elements.advLevel = document.getElementById('advLevel');
  elements.advHealth = document.getElementById('advHealth');
  elements.startAdventure = document.getElementById('startAdventure');
  elements.resetAdventure = document.getElementById('resetAdventure');
  elements.dailyChallenge = document.getElementById('dailyChallenge');
  elements.playDaily = document.getElementById('playDaily');
  elements.clearStats = document.getElementById('clearStats');
  elements.tutorialBtn = document.getElementById('tutorialBtn');
}

/**
 * 加载设置
 */
function loadSettings() {
  settings = StorageManager.loadSettings();
  stats = StorageManager.loadStats();

  // 应用设置
  applyTheme(settings.theme);
  if (elements.soundToggle) elements.soundToggle.checked = settings.sound;
  if (elements.particleToggle) elements.particleToggle.checked = settings.particles;
  if (elements.autoFlagToggle) elements.autoFlagToggle.checked = settings.autoFlag;
}

/**
 * 初始化各模块
 */
function initModules() {
  // 设置游戏回调
  gameState.onTimerUpdate = (s) => BoardRenderer.updateTimer(s);
  gameState.onGameOver = (r, c) => handleGameOver(r, c);
  gameState.onWin = () => handleWin();
  gameState.onCombo = (combo) => handleCombo(combo);
  gameState.onPowerupDrop = () => handlePowerupDrop();
  gameState.onTimeLimit = () => handleTimeLimit();

  // 初始化渲染器
  BoardRenderer.init(elements);
}

/**
 * 初始化游戏
 */
function initGame() {
  const diffValue = elements.difficulty?.value || 'easy';
  let diff;
  if (diffValue === 'custom') {
    const customConfig = {
      rows: parseInt(document.getElementById('customRows')?.value) || 12,
      cols: parseInt(document.getElementById('customCols')?.value) || 12,
      mines: parseInt(document.getElementById('customMines')?.value) || 20
    };
    diff = getDifficulty('custom', customConfig);
  } else {
    diff = getDifficulty(diffValue);
  }

  // 如果不在冒险模式中，清除冒险状态
  const activeTab = document.querySelector('.nav-tab.active');
  if (activeTab && activeTab.dataset.tab !== 'adventure' && !gameState.dailyMode) {
    gameState.currentAdventureLevel = null;
  }

  // 保存当前的六边形模式状态
  const currentHexMode = gameState.hexMode;
  gameState.init(true, diff);
  // 恢复六边形模式状态，而不是强制设为false
  gameState.hexMode = currentHexMode;

  BoardRenderer.renderBoard(gameState);
  BoardRenderer.initPowerupBar(gameState, handlePowerupClick, handlePowerupDoubleClick);

  // 冒险模式显示生命条，普通模式隐藏
  if (gameState.currentAdventureLevel !== null) {
    BoardRenderer.updateHealthBar(gameState.health, gameState.maxHealth);
  } else {
    BoardRenderer.updateHealthBar(0, 0);
  }

  BoardRenderer.clearMessage();

  // 初始化音频
  if (settings.sound) {
    audioManager.init();
  }

  // 初始化粒子
  if (settings.particles) {
    const container = document.querySelector('.board-container');
    if (container) ParticleManager.init(container);
  }
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 棋盘事件
  BoardRenderer.bindBoardEvents(gameState, {
    onCellClick: (r, c) => handleCellClick(r, c),
    onCellRightClick: (r, c) => handleCellRightClick(r, c),
    onCellDoubleClick: (r, c) => handleCellDoubleClick(r, c)
  });

  // 重置按钮
  elements.reset?.addEventListener('click', () => {
    audioManager.playSound('click');
    // 冒险模式下重置生命值
    if (gameState.currentAdventureLevel !== null) {
      const level = ADVENTURE_LEVELS[gameState.currentAdventureLevel];
      if (level) {
        gameState.health = level.health;
        gameState.maxHealth = level.health;
        gameState.adventureHealth = level.health;
      }
    }
    initGame();
  });

  // 六边形模式
  elements.hexMode?.addEventListener('click', () => {
    audioManager.playSound('click');
    gameState.hexMode = !gameState.hexMode;
    const hexBtn = elements.hexMode;
    if (gameState.hexMode) {
      hexBtn.textContent = '🔶 六边形 (开)';
    } else {
      hexBtn.textContent = '🔶 六边形';
    }
    initGame();
  });

  // 新手教程按钮
  elements.tutorialBtn?.addEventListener('click', () => {
    audioManager.playSound('click');
    TutorialManager.startTutorial();
  });

  // 难度选择
  elements.difficulty?.addEventListener('change', () => {
    audioManager.playSound('click');
    const customDiff = document.getElementById('customDiff');
    if (customDiff) {
      customDiff.style.display = elements.difficulty.value === 'custom' ? 'flex' : 'none';
    }
    initGame();
  });

  // 自定义难度输入变化
  ['customRows', 'customCols', 'customMines'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      if (elements.difficulty?.value === 'custom') {
        initGame();
      }
    });
  });

  // 暂停按钮
  const pauseBtn = document.getElementById('pauseBtn');
  let pauseOverlay = null;
  pauseBtn?.addEventListener('click', () => {
    if (gameState.gameOver || gameState.firstClick) return;

    if (!gameState.isPaused) {
      gameState.pause();
      audioManager.playSound('pause');
      pauseBtn.textContent = '▶️ 继续';

      // 创建暂停覆盖层
      pauseOverlay = document.createElement('div');
      pauseOverlay.className = 'pause-overlay';
      pauseOverlay.innerHTML = '<div class="pause-text">⏸️ 游戏暂停</div>';
      pauseOverlay.addEventListener('click', () => {
        gameState.resume();
        audioManager.playSound('resume');
        pauseBtn.textContent = '⏸️ 暂停';
        if (pauseOverlay) {
          pauseOverlay.remove();
          pauseOverlay = null;
        }
      });
      document.body.appendChild(pauseOverlay);
    } else {
      gameState.resume();
      audioManager.playSound('resume');
      pauseBtn.textContent = '⏸️ 暂停';
      if (pauseOverlay) {
        pauseOverlay.remove();
        pauseOverlay = null;
      }
    }
  });

  // 设置开关
  elements.soundToggle?.addEventListener('change', (e) => {
    settings.sound = e.target.checked;
    StorageManager.saveSettings(settings);
    if (settings.sound) audioManager.init();
  });

  elements.particleToggle?.addEventListener('change', (e) => {
    settings.particles = e.target.checked;
    StorageManager.saveSettings(settings);
  });

  elements.autoFlagToggle?.addEventListener('change', (e) => {
    settings.autoFlag = e.target.checked;
    StorageManager.saveSettings(settings);
  });

  // 音量滑块
  elements.volumeSlider = document.getElementById('volumeSlider');
  elements.volumeValue = document.getElementById('volumeValue');
  if (elements.volumeSlider) {
    // 从设置中恢复音量
    if (settings.volume !== undefined) {
      elements.volumeSlider.value = settings.volume;
      if (elements.volumeValue) {
        elements.volumeValue.textContent = settings.volume + '%';
      }
      audioManager.setVolume(settings.volume / 100);
    }

    elements.volumeSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value);
      settings.volume = vol;
      if (elements.volumeValue) {
        elements.volumeValue.textContent = vol + '%';
      }
      audioManager.setVolume(vol / 100);
      StorageManager.saveSettings(settings);
    });
  }

  // 导出数据按钮
  elements.exportData = document.getElementById('exportData');
  elements.exportData?.addEventListener('click', () => {
    try {
      const data = {
        settings: StorageManager.loadSettings(),
        stats: StorageManager.loadStats(),
        adventure: StorageManager.loadAdventureProgress(),
        daily: StorageManager.loadDailyProgress(),
        achievements: StorageManager.loadAchievements(),
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minesweeper-save-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      audioManager.playSound('click');
      if (BoardRenderer.showMessage) {
        BoardRenderer.showMessage('数据已导出', 'success');
      }
    } catch (err) {
      console.error('导出失败:', err);
      if (BoardRenderer.showMessage) {
        BoardRenderer.showMessage('导出失败', 'error');
      }
    }
  });

  // 导入数据按钮
  elements.importData = document.getElementById('importData');
  elements.importData?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const success = StorageManager.importData(evt.target.result);
      audioManager.playSound('click');
      if (BoardRenderer.showMessage) {
        if (success) {
          BoardRenderer.showMessage('数据已导入，请刷新页面', 'success');
        } else {
          BoardRenderer.showMessage('导入失败：文件格式错误', 'error');
        }
      }
    };
    reader.readAsText(file);
    // 重置input以便下次能再次选择同一文件
    e.target.value = '';
  });

  // 冒险模式按钮
  elements.startAdventure?.addEventListener('click', () => {
    audioManager.playSound('click');
    startAdventure();
  });

  elements.resetAdventure?.addEventListener('click', () => {
    if (confirm('确定要重置冒险模式进度吗？')) {
      audioManager.playSound('click');
      AdventureManager.resetProgress(StorageManager);
      renderAdventureMap();
    }
  });

  // 每日挑战按钮
  elements.playDaily?.addEventListener('click', () => {
    audioManager.playSound('click');
    startDailyChallenge();
  });

  // 清除统计
  elements.clearStats?.addEventListener('click', () => {
    if (confirm('确定要清除所有统计数据吗？')) {
      audioManager.playSound('click');
      StatsManager.clearStats();
    }
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // 忽略输入框中的按键事件
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    if (gameState.gameOver) return;

    switch (e.key.toLowerCase()) {
      case 'r':
        initGame();
        break;
      case 'h':
        usePowerup('hint');
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        const keys = ['sonar', 'reveal', 'flag', 'shield', 'hint', 'bomb'];
        const idx = parseInt(e.key) - 1;
        if (keys[idx]) {
          gameState.activePowerup = keys[idx];
          BoardRenderer.updatePowerupBar(gameState);
        }
        break;
      case 'escape':
        // 取消道具选择
        gameState.activePowerup = null;
        BoardRenderer.updatePowerupBar(gameState);
        break;
      case 'p':
        // 暂停/继续
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.click();
        break;
    }
  });
}

/**
 * 处理格子点击
 */
function handleCellClick(r, c) {
  if (gameState.isPaused) return;

  const cell = gameState.grid[r][c];

  // 处理道具目标选择（炸弹）
  if (gameState.activePowerup === 'bomb') {
    usePowerup('bomb', r, c);
    return;
  }

  // 如果格子已揭示，尝试chord
  if (cell.revealed) {
    if (gameState.chord(r, c)) {
      audioManager.playSound('chord');
      BoardRenderer.renderAll(gameState);
    }
    return;
  }

  // 使用道具
  if (gameState.activePowerup) {
    usePowerup(gameState.activePowerup, r, c);
    return;
  }

  // 正常揭示
  const wasShieldActive = gameState.shieldActive;
  const revealed = gameState.reveal(r, c);

  // 护盾触发：地雷被揭示但游戏未结束
  if (!revealed && cell.revealed && cell.mine && cell.triggered && wasShieldActive) {
    audioManager.playSound('shield');
    BoardRenderer.renderCell(r, c, gameState);
    BoardRenderer.showMessage('🛡️ 护盾抵挡了地雷！', 'info');
    setTimeout(() => BoardRenderer.clearMessage(), 2000);
    return;
  }

  if (revealed) {
    audioManager.playSound('reveal');

    // If first click or flood fill happened, re-render entire board
    if (gameState.grid[r][c].count === 0) {
      BoardRenderer.renderAll(gameState);
      audioManager.playSound('floodFill');
    } else {
      BoardRenderer.renderCell(r, c, gameState);
    }

    // 自动插旗模式：揭示后检查是否有可以自动标记的格子
    if (settings.autoFlag) {
      autoFlagCells();
    }

    if (settings.particles) {
      const el = BoardRenderer.getEl(r, c, gameState.cols);
      if (el) {
        const rect = el.getBoundingClientRect();
        const container = document.querySelector('.board-container');
        const containerRect = container.getBoundingClientRect();
        ParticleManager.powerupEffect('reveal',
          rect.left - containerRect.left + rect.width / 2,
          rect.top - containerRect.top + rect.height / 2
        );
      }
    }
  }
}

/**
 * 处理右键点击（标记）
 */
function handleCellRightClick(r, c) {
  if (gameState.isPaused) return;

  if (gameState.toggleFlag(r, c)) {
    audioManager.playSound('flag');
    BoardRenderer.renderCell(r, c, gameState);
    BoardRenderer.updateMineCount(gameState.getRemainingMines());
  }
}

/**
 * 处理双击
 */
function handleCellDoubleClick(r, c) {
  // 双击逻辑已在click中处理
}

/**
 * 自动插旗：检查所有已揭示的数字格子，如果周围未揭示格子数等于数字，自动标记
 */
function autoFlagCells() {
  let changed = false;

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.grid[r][c];
      if (!cell.revealed || cell.count === 0) continue;

      let unrevealedCount = 0;
      let flaggedCount = 0;
      const unrevealedCells = [];

      gameState._forNeighbors(r, c, (nr, nc) => {
        const neighbor = gameState.grid[nr][nc];
        if (!neighbor.revealed) {
          if (neighbor.flagged) {
            flaggedCount++;
          } else {
            unrevealedCount++;
            unrevealedCells.push({ r: nr, c: nc });
          }
        }
      });

      // 如果未揭示格子数 + 已标记数 === 数字，且还有未标记的，全部标记
      if (unrevealedCount > 0 && unrevealedCount + flaggedCount === cell.count) {
        for (const pos of unrevealedCells) {
          gameState.grid[pos.r][pos.c].flagged = true;
          gameState.flagCount++;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    BoardRenderer.renderAll(gameState);
    BoardRenderer.updateMineCount(gameState.getRemainingMines());
  }
}

/**
 * 处理道具点击
 */
function handlePowerupClick(key) {
  if (gameState.isPaused) return;
  PowerupManager.togglePowerup(key, gameState);
  BoardRenderer.updatePowerupBar(gameState);
}

/**
 * 处理道具双击（使用）
 */
function handlePowerupDoubleClick(key) {
  if (gameState.isPaused) return;
  usePowerup(key);
}

/**
 * 使用道具
 */
function usePowerup(key, targetR = null, targetC = null) {
  const result = PowerupManager.usePowerup(key, gameState, targetR, targetC);

  if (result.needTarget) {
    // 炸弹需要选择目标
    BoardRenderer.showMessage('点击棋盘选择炸弹目标位置', 'info');
    return;
  }

  if (result.success) {
    audioManager.playSound('powerup');

    if (key === 'sonar') {
      BoardRenderer.renderAll(gameState);
      setTimeout(() => BoardRenderer.renderAll(gameState), 3000);
    } else if (key === 'flag' && result.target) {
      BoardRenderer.renderCell(result.target.r, result.target.c, gameState);
      BoardRenderer.updateMineCount(gameState.getRemainingMines());
    } else if (key === 'hint' && result.target) {
      BoardRenderer.renderCell(result.target.r, result.target.c, gameState);
      setTimeout(() => {
        gameState.grid[result.target.r][result.target.c].hinted = false;
        BoardRenderer.renderCell(result.target.r, result.target.c, gameState);
      }, 3000);
    } else if (key === 'bomb' && result.result) {
      BoardRenderer.renderAll(gameState);
      if (settings.particles) {
        const el = BoardRenderer.getEl(targetR, targetC, gameState.cols);
        if (el) {
          const rect = el.getBoundingClientRect();
          const container = document.querySelector('.board-container');
          const containerRect = container.getBoundingClientRect();
          ParticleManager.powerupEffect('bomb',
            rect.left - containerRect.left + rect.width / 2,
            rect.top - containerRect.top + rect.height / 2
          );
        }
      }
    } else if (key === 'reveal') {
      BoardRenderer.renderAll(gameState);
    } else if (key === 'shield') {
      BoardRenderer.showMessage('🛡️ 护盾已激活！', 'info');
      setTimeout(() => BoardRenderer.clearMessage(), 2000);
    }

    BoardRenderer.updatePowerupBar(gameState);
  }
}

/**
 * 处理连击
 */
function handleCombo(combo) {
  audioManager.playSound('combo');
  BoardRenderer.updateComboDisplay(combo);

  if (settings.particles) {
    const board = document.querySelector('.board');
    if (board) {
      const rect = board.getBoundingClientRect();
      const container = document.querySelector('.board-container');
      const containerRect = container.getBoundingClientRect();
      ParticleManager.comboEffect(combo,
        rect.left - containerRect.left + rect.width / 2,
        rect.top - containerRect.top + rect.height / 2
      );
    }
  }
}

/**
 * 处理道具掉落
 */
function handlePowerupDrop() {
  const dropped = PowerupManager.dropPowerup(gameState);
  if (dropped) {
    audioManager.playSound('drop');
    BoardRenderer.updatePowerupBar(gameState);
    BoardRenderer.showMessage(`💎 获得 ${POWERUPS[dropped].name}！`, 'info');
    setTimeout(() => BoardRenderer.clearMessage(), 2000);
  }
}

/**
 * 处理游戏结束
 */
function handleGameOver(r, c) {
  audioManager.playSound('lose');
  BoardRenderer.renderAll(gameState);
  BoardRenderer.showMessage('💥 游戏结束！踩到雷了！', 'lose');

  if (settings.particles) {
    const el = BoardRenderer.getEl(r, c, gameState.cols);
    if (el) {
      const rect = el.getBoundingClientRect();
      const container = document.querySelector('.board-container');
      const containerRect = container.getBoundingClientRect();
      ParticleManager.explode(
        rect.left - containerRect.left + rect.width / 2,
        rect.top - containerRect.top + rect.height / 2
      );
    }
  }

  // 处理冒险模式
  if (gameState.currentAdventureLevel !== null) {
    const result = AdventureManager.failAdventureLevel(gameState, StorageManager);
    BoardRenderer.updateHealthBar(gameState.health, gameState.maxHealth);
    if (result.reset) {
      setTimeout(() => {
        BoardRenderer.showMessage('生命耗尽，关卡重置', 'lose');
        // 重置生命值后重新开始关卡
        const level = ADVENTURE_LEVELS[gameState.currentAdventureLevel];
        if (level) {
          gameState.health = level.health;
          gameState.maxHealth = level.health;
          gameState.adventureHealth = level.health;
        }
        initGame();
      }, 1500);
    }
  }

  // 处理每日挑战
  if (gameState.dailyMode) {
    DailyManager.failDaily();
    setTimeout(() => {
      BoardRenderer.showMessage(`剩余尝试：${DailyManager.progress.attempts}/3`, 'info');
    }, 1500);
  }

  // 记录统计
  const diffKey = gameState.dailyMode ? 'medium' : (elements.difficulty?.value || 'easy');
  StatsManager.recordGameResult(
    false,
    gameState.seconds,
    diffKey,
    gameState.maxCombo,
    gameState.powerupsUsed,
    gameState.revealedCount
  );
}

/**
 * 处理胜利
 */
function handleWin() {
  audioManager.playSound('win');
  BoardRenderer.renderAll(gameState);
  BoardRenderer.updateMineCount(gameState.getRemainingMines());
  BoardRenderer.showMessage(`🎉 恭喜！用时 ${gameState.seconds}秒`, 'win');

  if (settings.particles) {
    ParticleManager.celebrate(60);
  }

  // 检查成就
  const diffKey = gameState.dailyMode ? 'medium' : (elements.difficulty?.value || 'easy');
  const newAchievements = StatsManager.recordGameResult(
    true,
    gameState.seconds,
    diffKey,
    gameState.maxCombo,
    gameState.powerupsUsed,
    gameState.revealedCount
  );

  newAchievements.forEach(id => {
    StatsManager.showAchievementPopup(id);
    setTimeout(() => audioManager.playSound('achievement'), 500);
  });

  // 处理冒险模式
  if (gameState.currentAdventureLevel !== null) {
    const result = AdventureManager.completeAdventureLevel(gameState, StorageManager);
    renderAdventureMap();

    if (result.allCompleted) {
      setTimeout(() => {
        BoardRenderer.showMessage('🏆 恭喜通关冒险模式！', 'win');
      }, 2000);
    }
  }

  // 处理每日挑战
  if (gameState.dailyMode) {
    const streak = DailyManager.completeDaily();
    setTimeout(() => {
      BoardRenderer.showMessage(`🎉 每日挑战完成！连胜${streak}天`, 'win');
    }, 1000);
  }
}

/**
 * 处理时间限制
 */
function handleTimeLimit() {
  gameState.gameOver = true;
  gameState.stopTimer();
  audioManager.playSound('lose');
  BoardRenderer.renderAll(gameState);
  BoardRenderer.showMessage('⏰ 时间到！', 'lose');

  // 处理冒险模式
  if (gameState.currentAdventureLevel !== null) {
    const result = AdventureManager.failAdventureLevel(gameState, StorageManager);
    BoardRenderer.updateHealthBar(gameState.health, gameState.maxHealth);
    if (result.reset) {
      setTimeout(() => {
        BoardRenderer.showMessage('生命耗尽，关卡重置', 'lose');
        const level = ADVENTURE_LEVELS[gameState.currentAdventureLevel];
        if (level) {
          gameState.health = level.health;
          gameState.maxHealth = level.health;
          gameState.adventureHealth = level.health;
        }
        initGame();
      }, 1500);
    }
  }
}

/**
 * 初始化标签页
 */
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      document.querySelectorAll('.panel').forEach(t => t.classList.remove('active'));
      document.getElementById(`panel-${tabId}`)?.classList.add('active');

      document.querySelectorAll('.nav-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      if (tabId === 'stats') {
        StatsManager.updateStatsDisplay();
      } else if (tabId === 'adventure') {
        renderAdventureMap();
      } else if (tabId === 'daily') {
        DailyManager.initDailyChallenge(elements.dailyChallenge?.parentElement);
      }
    });
  });
}

/**
 * 渲染冒险地图
 */
function renderAdventureMap() {
  if (!elements.adventureMap) return;

  elements.adventureMap.innerHTML = '';
  const map = AdventureManager.initAdventureMap(AdventureManager.progress, (idx) => {
    audioManager.playSound('click');
    startAdventureLevel(idx);
  });

  elements.adventureMap.appendChild(map);
}

/**
 * 开始冒险关卡
 */
function startAdventureLevel(idx) {
  const result = AdventureManager.startAdventureLevel(idx, gameState, StorageManager);
  if (!result) return;

  // 初始化游戏状态（创建网格等），不重置道具
  gameState.init(false);

  // 切换到经典模式标签
  document.querySelector('[data-tab="classic"]')?.click();

  // 更新显示
  elements.healthBar.style.display = 'flex';
  BoardRenderer.updateHealthBar(result.level.health, result.level.health);
  BoardRenderer.renderBoard(gameState);
  BoardRenderer.initPowerupBar(gameState, handlePowerupClick, handlePowerupDoubleClick);
}

/**
 * 开始冒险
 */
function startAdventure() {
  const result = AdventureManager.startAdventure(gameState, StorageManager);
  if (result) {
    startAdventureLevel(result.idx);
  }
}

/**
 * 开始每日挑战
 */
function startDailyChallenge() {
  if (!DailyManager.canPlayDaily()) {
    BoardRenderer.showMessage('今日挑战次数已用完或已完成', 'info');
    return;
  }

  DailyManager.playDaily(gameState);
  // 保存每日挑战的设置，因为 init 会重置
  const dailyRows = gameState.rows;
  const dailyCols = gameState.cols;
  const dailyMines = gameState.totalMines;
  gameState.init(true, { rows: dailyRows, cols: dailyCols, mines: dailyMines });
  // 恢复每日挑战模式（init 会重置 dailyMode）
  gameState.dailyMode = true;
  gameState.dailySeed = DailyManager.getTodaySeed();

  document.querySelector('[data-tab="classic"]')?.click();

  BoardRenderer.renderBoard(gameState);
  BoardRenderer.initPowerupBar(gameState, handlePowerupClick, handlePowerupDoubleClick);
}

/**
 * 初始化主题选择器
 */
function initThemeSelector() {
  if (!elements.themeSelector) return;

  const themes = [
    { key: 'modern', color: '#0d1117' },
    { key: 'classic', color: '#1a1a2e' },
    { key: 'dark', color: '#0a0a0a' },
    { key: 'ocean', color: '#001a33' },
    { key: 'forest', color: '#0a1a0a' },
    { key: 'sunset', color: '#2a1a1a' },
    { key: 'purple', color: '#1a0a2a' }
  ];

  elements.themeSelector.innerHTML = '';
  themes.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'theme-btn' + (settings.theme === t.key ? ' active' : '');
    btn.style.background = t.color;
    btn.title = t.key;
    btn.onclick = () => {
      applyTheme(t.key);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    elements.themeSelector.appendChild(btn);
  });
}

/**
 * 应用主题
 */
function applyTheme(themeName) {
  document.body.classList.remove('theme-modern', 'theme-classic', 'theme-dark', 'theme-ocean',
    'theme-forest', 'theme-sunset', 'theme-purple');
  document.body.classList.add(`theme-${themeName}`);
  settings.theme = themeName;
  StorageManager.saveSettings(settings);
}

// 导出供其他模块使用
export {
  gameState,
  initGame,
  applyTheme
};
