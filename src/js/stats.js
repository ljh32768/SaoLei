/**
 * 扫雷增强版 - 统计和成就系统
 */

import { formatTime, formatPercent, clamp } from './utils.js';

// 成就定义
export const ACHIEVEMENTS = {
  firstWin: { id: 'firstWin', name: '初次胜利', desc: '完成第一局游戏', icon: '🏆', unlocked: false },
  speedDemon: { id: 'speedDemon', name: '速度恶魔', desc: '30秒内完成初级', icon: '⚡', unlocked: false },
  speedMaster: { id: 'speedMaster', name: '速度大师', desc: '60秒内完成中级', icon: '🚀', unlocked: false },
  speedLegend: { id: 'speedLegend', name: '速度传奇', desc: '120秒内完成高级', icon: '✨', unlocked: false },
  perfectGame: { id: 'perfectGame', name: '完美游戏', desc: '不使用道具完成游戏', icon: '💎', unlocked: false },
  combo5: { id: 'combo5', name: '连击大师', desc: '达成5连击', icon: '🔥', unlocked: false },
  combo10: { id: 'combo10', name: '连击传奇', desc: '达成10连击', icon: '🌟', unlocked: false },
  adventurer: { id: 'adventurer', name: '冒险家', desc: '通关冒险模式', icon: '🗺️', unlocked: false },
  dailyStreak7: { id: 'dailyStreak7', name: '每日挑战者', desc: '连续7天完成每日挑战', icon: '📅', unlocked: false },
  minesweeper100: { id: 'minesweeper100', name: '揭雷专家', desc: '累计揭示100个非雷格子', icon: '⛏️', unlocked: false },
  minesweeper500: { id: 'minesweeper500', name: '揭雷大师', desc: '累计揭示500个非雷格子', icon: '🎯', unlocked: false }
};

export const StatsManager = {
  stats: null,
  achievements: null,
  storageManager: null,

  /**
   * 初始化
   * @param {object} storageManager - 存储管理器
   */
  init(storageManager) {
    this.storageManager = storageManager;
    this.stats = storageManager.loadStats();
    this.achievements = storageManager.loadAchievements();
    return this;
  },

  /**
   * 记录游戏结果
   * @param {boolean} isWin - 是否胜利
   * @param {number} seconds - 用时秒数
   * @param {string} difficulty - 难度
   * @param {number} maxCombo - 最高连击
   * @param {number} powerupsUsed - 使用的道具数
   * @param {number} minesRevealed - 揭示的格子数
   */
  recordGameResult(isWin, seconds, difficulty, maxCombo, powerupsUsed, minesRevealed) {
    this.stats.games++;
    this.stats.totalMinesRevealed += minesRevealed;

    if (isWin) {
      this.stats.wins++;

      // 更新最佳时间
      if (!this.stats.bestTime[difficulty] || seconds < this.stats.bestTime[difficulty]) {
        this.stats.bestTime[difficulty] = seconds;
      }
    }

    // 更新最高连击
    if (maxCombo > this.stats.combo) {
      this.stats.combo = maxCombo;
    }

    this.storageManager.saveStats(this.stats);

    // 检查成就
    return this.checkAchievements(isWin, seconds, difficulty, maxCombo, powerupsUsed, this.stats.totalMinesRevealed);
  },

  /**
   * 计算胜率
   * @returns {string}
   */
  getWinRate() {
    if (this.stats.games === 0) return '0%';
    return formatPercent(this.stats.wins, this.stats.games);
  },

  /**
   * 获取最佳时间
   * @param {string} difficulty - 难度
   * @returns {string}
   */
  getBestTime(difficulty) {
    const time = this.stats.bestTime[difficulty];
    return time !== null && time !== undefined ? formatTime(time) : '-';
  },

  /**
   * 获取所有难度中的最佳时间
   * @returns {string}
   */
  getOverallBestTime() {
    if (!this.stats.bestTime) return '-';
    const times = Object.values(this.stats.bestTime).filter(t => t !== null && t !== undefined);
    if (times.length === 0) return '-';
    const minTime = Math.min(...times);
    return formatTime(minTime);
  },

  /**
   * 更新统计显示
   */
  updateStatsDisplay() {
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setText('statGames', this.stats.games);
    setText('statWins', this.stats.wins);
    setText('statWinRate', this.getWinRate());
    setText('statBestTime', this.getOverallBestTime());
    setText('statCombo', this.stats.combo);
    setText('statMines', this.stats.totalMinesRevealed);

    setText('bestEasy', this.getBestTime('easy'));
    setText('bestMedium', this.getBestTime('medium'));
    setText('bestHard', this.getBestTime('hard'));
  },

  /**
   * 清除统计
   */
  clearStats() {
    this.storageManager.clearStats();
    this.stats = this.storageManager.loadStats();
    this.updateStatsDisplay();
  },

  /**
   * 检查成就
   * @param {boolean} isWin - 是否胜利
   * @param {number} seconds - 用时
   * @param {string} difficulty - 难度
   * @param {number} maxCombo - 最高连击
   * @param {number} powerupsUsed - 道具使用数
   * @param {number} totalMines - 累计揭雷
   * @returns {array} 新解锁的成就ID列表
   */
  checkAchievements(isWin, seconds, difficulty, maxCombo, powerupsUsed, totalMines) {
    const newlyUnlocked = [];

    // 初次胜利
    if (isWin && !this.achievements.firstWin) {
      this.achievements.firstWin = Date.now();
      newlyUnlocked.push('firstWin');
    }

    // 速度恶魔 - 30秒初级
    if (isWin && difficulty === 'easy' && seconds <= 30 && !this.achievements.speedDemon) {
      this.achievements.speedDemon = Date.now();
      newlyUnlocked.push('speedDemon');
    }

    // 速度大师 - 60秒中级
    if (isWin && difficulty === 'medium' && seconds <= 60 && !this.achievements.speedMaster) {
      this.achievements.speedMaster = Date.now();
      newlyUnlocked.push('speedMaster');
    }

    // 速度传奇 - 120秒高级
    if (isWin && difficulty === 'hard' && seconds <= 120 && !this.achievements.speedLegend) {
      this.achievements.speedLegend = Date.now();
      newlyUnlocked.push('speedLegend');
    }

    // 完美游戏 - 不使用道具胜利
    if (isWin && powerupsUsed === 0 && !this.achievements.perfectGame) {
      this.achievements.perfectGame = Date.now();
      newlyUnlocked.push('perfectGame');
    }

    // 连击大师 - 5连击
    if (maxCombo >= 5 && !this.achievements.combo5) {
      this.achievements.combo5 = Date.now();
      newlyUnlocked.push('combo5');
    }

    // 连击传奇 - 10连击
    if (maxCombo >= 10 && !this.achievements.combo10) {
      this.achievements.combo10 = Date.now();
      newlyUnlocked.push('combo10');
    }

    // 揭雷专家 - 100格
    if (totalMines >= 100 && !this.achievements.minesweeper100) {
      this.achievements.minesweeper100 = Date.now();
      newlyUnlocked.push('minesweeper100');
    }

    // 揭雷大师 - 500格
    if (totalMines >= 500 && !this.achievements.minesweeper500) {
      this.achievements.minesweeper500 = Date.now();
      newlyUnlocked.push('minesweeper500');
    }

    if (newlyUnlocked.length > 0) {
      this.storageManager.saveAchievements(this.achievements);
    }

    return newlyUnlocked;
  },

  /**
   * 检查冒险成就
   * @param {object} adventureProgress - 冒险进度
   * @param {object} dailyProgress - 每日进度
   * @returns {array}
   */
  checkSpecialAchievements(adventureProgress, dailyProgress) {
    const newlyUnlocked = [];

    // 冒险家 - 通关冒险
    if (adventureProgress &&
        adventureProgress.completedLevels.length === 8 &&
        !this.achievements.adventurer) {
      this.achievements.adventurer = Date.now();
      newlyUnlocked.push('adventurer');
    }

    // 每日挑战者 - 连续7天
    if (dailyProgress && dailyProgress.streak >= 7 && !this.achievements.dailyStreak7) {
      this.achievements.dailyStreak7 = Date.now();
      newlyUnlocked.push('dailyStreak7');
    }

    if (newlyUnlocked.length > 0) {
      this.storageManager.saveAchievements(this.achievements);
    }

    return newlyUnlocked;
  },

  /**
   * 显示成就弹窗
   * @param {string} achievementId - 成就ID
   * @returns {HTMLElement}
   */
  showAchievementPopup(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;

    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <span class="achievement-icon">${achievement.icon}</span>
      <div class="achievement-content">
        <h4>成就解锁：${achievement.name}</h4>
        <p>${achievement.desc}</p>
      </div>
    `;

    document.body.appendChild(popup);

    // 3秒后移除
    setTimeout(() => {
      popup.classList.add('removing');
      setTimeout(() => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
      }, 500);
    }, 3000);

    return popup;
  },

  /**
   * 获取已解锁成就
   * @returns {array}
   */
  getUnlockedAchievements() {
    return Object.keys(this.achievements).map(id => ({
      ...ACHIEVEMENTS[id],
      unlockedAt: this.achievements[id]
    }));
  },

  /**
   * 获取所有成就
   * @returns {object}
   */
  getAllAchievements() {
    return ACHIEVEMENTS;
  },

  /**
   * 获取成就进度
   * @returns {object}
   */
  getAchievementProgress() {
    const progress = {};
    Object.keys(ACHIEVEMENTS).forEach(id => {
      progress[id] = this.achievements[id] ? 100 : 0;
    });
    return progress;
  }
};

export default StatsManager;
