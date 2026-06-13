/**
 * 扫雷增强版 - 冒险模式
 */

import { ADVENTURE_LEVELS } from './game.js';

export const AdventureManager = {
  progress: null,

  /**
   * 初始化
   * @param {object} storageManager - 存储管理器
   * @returns {object} 冒险进度
   */
  init(storageManager) {
    this.progress = storageManager.loadAdventureProgress();
    return this.progress;
  },

  /**
   * 获取关卡
   * @param {number} idx - 关卡索引
   * @returns {object}
   */
  getLevel(idx) {
    return ADVENTURE_LEVELS[idx];
  },

  /**
   * 初始化冒险地图
   * @param {object} progress - 冒险进度
   * @param {Function} onLevelClick - 关卡点击回调
   * @returns {HTMLElement} 地图容器
   */
  initAdventureMap(progress, onLevelClick) {
    const container = document.createElement('div');
    container.className = 'adventure-map';

    ADVENTURE_LEVELS.forEach((level, idx) => {
      const node = document.createElement('div');
      node.className = 'adventure-node';
      node.textContent = level.boss ? '👹' : '💎';
      node.dataset.level = idx;

      if (progress.unlockedLevels.includes(idx)) {
        node.classList.add('unlocked');
        if (progress.completedLevels.includes(idx)) {
          node.classList.add('completed');
        } else if (progress.currentLevel === idx) {
          node.classList.add('current');
        }
        node.onclick = () => onLevelClick(idx);
      } else {
        node.classList.add('locked');
      }

      if (level.boss) {
        node.classList.add('boss');
      }

      container.appendChild(node);
    });

    return container;
  },

  /**
   * 开始冒险
   * @param {object} gameState - 游戏状态
   * @param {object} storageManager - 存储管理器
   * @returns {object}
   */
  startAdventure(gameState, storageManager) {
    this.progress = storageManager.loadAdventureProgress();
    return this.startAdventureLevel(this.progress.currentLevel, gameState, storageManager);
  },

  /**
   * 开始指定关卡
   * @param {number} idx - 关卡索引
   * @param {object} gameState - 游戏状态
   * @param {object} storageManager - 存储管理器
   * @returns {object}
   */
  startAdventureLevel(idx, gameState, storageManager) {
    const level = ADVENTURE_LEVELS[idx];
    if (!level) return null;

    gameState.setAdventureLevel(idx, level);
    this.progress.currentLevel = idx;
    storageManager.saveAdventureProgress(this.progress);

    return {
      level,
      idx,
      isBoss: level.boss
    };
  },

  /**
   * 完成关卡
   * @param {object} gameState - 游戏状态
   * @param {object} storageManager - 存储管理器
   * @returns {object}
   */
  completeAdventureLevel(gameState, storageManager) {
    const idx = gameState.currentAdventureLevel;
    const level = ADVENTURE_LEVELS[idx];

    if (!this.progress.completedLevels.includes(idx)) {
      this.progress.completedLevels.push(idx);
    }

    // 解锁下一关
    const nextIdx = idx + 1;
    if (nextIdx < ADVENTURE_LEVELS.length && !this.progress.unlockedLevels.includes(nextIdx)) {
      this.progress.unlockedLevels.push(nextIdx);
    }

    this.progress.currentLevel = nextIdx < ADVENTURE_LEVELS.length ? nextIdx : idx;
    storageManager.saveAdventureProgress(this.progress);

    const completed = this.progress.completedLevels.length === ADVENTURE_LEVELS.length;

    return {
      completed: true,
      level,
      idx,
      nextIdx: nextIdx < ADVENTURE_LEVELS.length ? nextIdx : null,
      allCompleted: completed
    };
  },

  /**
   * 失败关卡
   * @param {object} gameState - 游戏状态
   * @param {object} storageManager - 存储管理器
   * @returns {object}
   */
  failAdventureLevel(gameState, storageManager) {
    gameState.adventureHealth--;
    // 同步 health 字段
    gameState.health = gameState.adventureHealth;

    if (gameState.adventureHealth <= 0) {
      // 生命耗尽，重置关卡
      const level = ADVENTURE_LEVELS[gameState.currentAdventureLevel];
      gameState.adventureHealth = level.health;
      gameState.health = level.health;
      return {
        reset: true,
        health: gameState.adventureHealth,
        canRetry: true
      };
    }

    return {
      reset: false,
      health: gameState.adventureHealth,
      canRetry: true
    };
  },

  /**
   * 重置冒险进度
   * @param {object} storageManager - 存储管理器
   * @returns {object} 新的进度
   */
  resetProgress(storageManager) {
    this.progress = {
      currentLevel: 0,
      completedLevels: [],
      unlockedLevels: [0]
    };
    storageManager.saveAdventureProgress(this.progress);
    return this.progress;
  },

  /**
   * 检查关卡是否解锁
   * @param {number} idx - 关卡索引
   * @returns {boolean}
   */
  isLevelUnlocked(idx) {
    return this.progress && this.progress.unlockedLevels.includes(idx);
  },

  /**
   * 检查关卡是否完成
   * @param {number} idx - 关卡索引
   * @returns {boolean}
   */
  isLevelCompleted(idx) {
    return this.progress && this.progress.completedLevels.includes(idx);
  },

  /**
   * 获取进度百分比
   * @returns {number}
   */
  getProgressPercent() {
    if (!this.progress) return 0;
    return Math.round((this.progress.completedLevels.length / ADVENTURE_LEVELS.length) * 100);
  }
};

export default AdventureManager;
