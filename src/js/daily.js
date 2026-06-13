/**
 * 扫雷增强版 - 每日挑战模块
 */

import { generateSeedFromDate, getTodayString, isSameDay } from './utils.js';

export const DailyManager = {
  progress: null,
  storageManager: null,

  /**
   * 初始化
   * @param {object} storageManager - 存储管理器
   * @returns {object}
   */
  init(storageManager) {
    this.storageManager = storageManager;
    this.progress = storageManager.loadDailyProgress();
    this.checkDailyReset();
    return this;
  },

  /**
   * 检查是否需要重置每日进度
   */
  checkDailyReset() {
    const today = getTodayString();
    if (this.progress.lastDate !== today) {
      // 新的一天
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = this.progress.lastDate ===
        `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      // 如果不是连续，重置streak
      if (!wasYesterday && !this.progress.completed) {
        this.progress.streak = 0;
      }

      this.progress.completed = false;
      this.progress.attempts = 0;
      this.progress.seed = generateSeedFromDate();
      this.progress.lastDate = today;
      this.storageManager.saveDailyProgress(this.progress);
    }
  },

  /**
   * 获取今日种子
   * @returns {number}
   */
  getTodaySeed() {
    return this.progress.seed || generateSeedFromDate();
  },

  /**
   * 初始化每日挑战显示
   * @param {HTMLElement} container - 容器
   */
  initDailyChallenge(container) {
    if (!container) return; // 安全处理：容器不存在则直接返回

    const today = getTodayString();
    const seed = this.getTodaySeed();

    const dateEl = container.querySelector('#dailyDate');
    const descEl = container.querySelector('#dailyDesc');
    const attemptsEl = container.querySelector('#dailyAttempts');
    const challengeEl = container.querySelector('#dailyChallenge');

    if (dateEl) dateEl.textContent = today;
    if (descEl) {
      descEl.textContent = this.progress.completed
        ? '🎉 今日挑战已完成！'
        : `挑战种子：${seed}\n中级难度（16×16，40雷）`;
    }
    if (attemptsEl) {
      attemptsEl.textContent = `今日尝试：${this.progress.attempts}/3`;
    }

    if (challengeEl) {
      if (this.progress.completed) {
        challengeEl.classList.add('completed');
      } else {
        challengeEl.classList.remove('completed');
      }
    }
  },

  /**
   * 是否可以进行挑战
   * @returns {boolean}
   */
  canPlayDaily() {
    return !this.progress.completed && this.progress.attempts < 3;
  },

  /**
   * 开始每日挑战
   * @param {object} gameState - 游戏状态
   * @returns {boolean}
   */
  playDaily(gameState) {
    if (!this.canPlayDaily()) return false;

    gameState.setDailyMode(this.getTodaySeed());
    return true;
  },

  /**
   * 记录一次尝试
   */
  recordAttempt() {
    this.progress.attempts++;
    this.storageManager.saveDailyProgress(this.progress);
  },

  /**
   * 完成挑战
   * @returns {number} 连胜天数
   */
  completeDaily() {
    if (!this.progress.completed) {
      this.progress.completed = true;
      this.progress.streak++;
      this.storageManager.saveDailyProgress(this.progress);
    }
    return this.progress.streak;
  },

  /**
   * 失败处理
   * @returns {object}
   */
  failDaily() {
    this.recordAttempt();

    const canRetry = this.progress.attempts < 3;
    return {
      attempts: this.progress.attempts,
      canRetry,
      maxAttempts: 3
    };
  },

  /**
   * 获取连胜天数
   * @returns {number}
   */
  getStreak() {
    return this.progress.streak || 0;
  },

  /**
   * 重置连胜
   */
  resetStreak() {
    this.progress.streak = 0;
    this.storageManager.saveDailyProgress(this.progress);
  },

  /**
   * 获取当前状态
   * @returns {object}
   */
  getStatus() {
    return {
      completed: this.progress.completed,
      attempts: this.progress.attempts,
      streak: this.progress.streak,
      canPlay: this.canPlayDaily()
    };
  }
};

export default DailyManager;
