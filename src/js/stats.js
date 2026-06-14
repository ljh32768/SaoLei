/**
 * 扫雷增强版 - 统计和成就系统
 */

// StatsManager.js
import { formatTime, formatPercent, clamp } from './utils.js';

let winRateChartInstance = null;

// 成就定义
export const ACHIEVEMENTS = {
  // 普通成就
  firstWin: { id: 'firstWin', name: '初次胜利', desc: '完成第一局游戏', icon: '🏆', unlocked: false, hidden: false, category: 'basic' },
  speedDemon: { id: 'speedDemon', name: '速度恶魔', desc: '30秒内完成初级', icon: '⚡', unlocked: false, hidden: false, category: 'speed' },
  speedMaster: { id: 'speedMaster', name: '速度大师', desc: '60秒内完成中级', icon: '🚀', unlocked: false, hidden: false, category: 'speed' },
  speedLegend: { id: 'speedLegend', name: '速度传奇', desc: '120秒内完成高级', icon: '✨', unlocked: false, hidden: false, category: 'speed' },
  perfectGame: { id: 'perfectGame', name: '完美游戏', desc: '不使用道具完成游戏', icon: '💎', unlocked: false, hidden: false, category: 'skill' },
  combo5: { id: 'combo5', name: '连击大师', desc: '达成5连击', icon: '🔥', unlocked: false, hidden: false, category: 'skill' },
  combo10: { id: 'combo10', name: '连击传奇', desc: '达成10连击', icon: '🌟', unlocked: false, hidden: false, category: 'skill' },
  adventurer: { id: 'adventurer', name: '冒险家', desc: '通关冒险模式', icon: '🗺️', unlocked: false, hidden: false, category: 'adventure' },
  dailyStreak7: { id: 'dailyStreak7', name: '每日挑战者', desc: '连续7天完成每日挑战', icon: '📅', unlocked: false, hidden: false, category: 'daily' },
  minesweeper100: { id: 'minesweeper100', name: '揭雷专家', desc: '累计揭示100个非雷格子', icon: '⛏️', unlocked: false, hidden: false, category: 'basic' },
  minesweeper500: { id: 'minesweeper500', name: '揭雷大师', desc: '累计揭示500个非雷格子', icon: '🎯', unlocked: false, hidden: false, category: 'basic' },

  // 进阶/隐藏成就
  winStreak5: { id: 'winStreak5', name: '五连胜', desc: '连续赢得5局游戏', icon: '🏅', unlocked: false, hidden: false, category: 'advance' },
  noFlagWin: { id: 'noFlagWin', name: '无旗大师', desc: '不使用标记完成中级以上难度', icon: '⛳', unlocked: false, hidden: false, category: 'skill' },
  pixelPerfect: { id: 'pixelPerfect', name: '像素完美', desc: '完成中级以上难度且揭开顺序完美', icon: '🔍', unlocked: false, hidden: false, category: 'skill' },
  marathoner: { id: 'marathoner', name: '马拉松选手', desc: '累计游戏时间超过24小时', icon: '⏱️', unlocked: false, hidden: false, category: 'advance' },
  treasureHunter: { id: 'treasureHunter', name: '宝藏猎人', desc: '累计收集50个道具', icon: '💰', unlocked: false, hidden: false, category: 'advance' },
  dailyStreak30: { id: 'dailyStreak30', name: '月度达人', desc: '连续30天完成每日挑战', icon: '📆', unlocked: false, hidden: false, category: 'daily' },

  // 隐藏成就 (未解锁时不显示详情)
  secretNinja: { id: 'secretNinja', name: '???', desc: '???', icon: '❓', unlocked: false, hidden: true, category: 'secret', realName: '忍者', realDesc: '在5秒内完成初级', realIcon: '🥷' },
  secretLucky: { id: 'secretLucky', name: '???', desc: '???', icon: '❓', unlocked: false, hidden: true, category: 'secret', realName: '幸运星', realDesc: '首点击即获胜', realIcon: '🍀' },
  secretMaster: { id: 'secretMaster', name: '???', desc: '???', icon: '❓', unlocked: false, hidden: true, category: 'secret', realName: '扫雷宗师', realDesc: '解锁所有普通成就', realIcon: '👑' },
  secretHex: { id: 'secretHex', name: '???', desc: '???', icon: '❓', unlocked: false, hidden: true, category: 'secret', realName: '几何大师', realDesc: '在六边形模式下完成高级', realIcon: '🔯' }
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
  recordGameResult(isWin, seconds, difficulty, maxCombo, powerupsUsed, minesRevealed, flagCount = 0, isHexMode = false) {
    this.stats.games++;
    this.stats.totalMinesRevealed += minesRevealed;
    this.stats.powerupsUsed += powerupsUsed;
    this.stats.totalGameTimeSeconds = (this.stats.totalGameTimeSeconds || 0) + seconds;

    if (isWin) {
      this.stats.wins++;
      this.stats.currentWinStreak = (this.stats.currentWinStreak || 0) + 1;
      if (this.stats.currentWinStreak > (this.stats.bestWinStreak || 0)) {
        this.stats.bestWinStreak = this.stats.currentWinStreak;
      }

      if (!this.stats.bestTime[difficulty] || seconds < this.stats.bestTime[difficulty]) {
        this.stats.bestTime[difficulty] = seconds;
      }

      if (flagCount === 0 && difficulty !== 'easy') {
        this.stats.hasFlaglessMediumPlus = true;
      }

      if (isHexMode && difficulty === 'hard') {
        this.stats.hasHexHard = true;
      }
    } else {
      this.stats.currentWinStreak = 0;
    }

    if (maxCombo > this.stats.combo) {
      this.stats.combo = maxCombo;
    }

    this.storageManager.saveStats(this.stats);

    return this.checkAchievements(isWin, seconds, difficulty, maxCombo, powerupsUsed, this.stats.totalMinesRevealed, isHexMode);
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

  updateCharts() {
    const totalGames = this.stats.games;
    const wins = this.stats.wins;
    const losses = totalGames - wins;

    if (totalGames === 0) {
      this.renderEmptyChart();
      return;
    }

    if (winRateChartInstance) {
      winRateChartInstance.data.datasets[0].data = [wins, losses];
      winRateChartInstance.update();
    } else {
      this.initCharts(wins, losses);
    }
  },

  initCharts(wins, losses) {
    const ctx = document.getElementById('winRateChart')?.getContext('2d');
    if (!ctx) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const accent = rootStyle.getPropertyValue('--accent').trim() || '#58a6ff';
    const danger = rootStyle.getPropertyValue('--danger').trim() || '#e94560';

    winRateChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['胜利', '失败'],
        datasets: [{
          data: [wins, losses],
          backgroundColor: ['#58a6ff', '#30363d'],
          borderColor: '#0d1117',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'var(--text-secondary)',
              font: { size: 12, family: 'Inter, system-ui, sans-serif' },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              pointRadius: 6
            }
          },
          tooltip: {
            backgroundColor: 'rgba(13, 17, 23, 0.9)',
            titleColor: '#c9d1d9',
            bodyColor: '#c9d1d9',
            borderColor: 'rgba(138, 180, 248, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.chart._metasets[context.datasetIndex].total;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  },

  renderEmptyChart() {
    const ctx = document.getElementById('winRateChart')?.getContext('2d');
    if (!ctx) return;

    if (winRateChartInstance) {
      winRateChartInstance.destroy();
      winRateChartInstance = null;
    }
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

    this.updateCharts();
    this.renderAchievementsPanel();
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
  checkAchievements(isWin, seconds, difficulty, maxCombo, powerupsUsed, totalMines, isHexMode = false) {
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

    // 五连胜
    if ((this.stats.currentWinStreak || 0) >= 5 && !this.achievements.winStreak5) {
      this.achievements.winStreak5 = Date.now();
      newlyUnlocked.push('winStreak5');
    }

    // 无旗大师 - 中级以上不用旗获胜
    if (this.stats.hasFlaglessMediumPlus && !this.achievements.noFlagWin) {
      this.achievements.noFlagWin = Date.now();
      newlyUnlocked.push('noFlagWin');
    }

    // 马拉松选手 - 累计游戏时间超过24小时
    if ((this.stats.totalGameTimeSeconds || 0) >= 86400 && !this.achievements.marathoner) {
      this.achievements.marathoner = Date.now();
      newlyUnlocked.push('marathoner');
    }

    // 宝藏猎人 - 累计收集50个道具
    if ((this.stats.totalPowerupsCollected || 0) >= 50 && !this.achievements.treasureHunter) {
      this.achievements.treasureHunter = Date.now();
      newlyUnlocked.push('treasureHunter');
    }

    // 隐藏成就 - 忍者：5秒内完成初级
    if (isWin && difficulty === 'easy' && seconds <= 5 && !this.achievements.secretNinja) {
      this.achievements.secretNinja = Date.now();
      newlyUnlocked.push('secretNinja');
    }

    // 隐藏成就 - 几何大师：六边形模式完成高级
    if (isWin && isHexMode && difficulty === 'hard' && !this.achievements.secretHex) {
      this.achievements.secretHex = Date.now();
      newlyUnlocked.push('secretHex');
    }

    // 隐藏成就 - 幸运星：首点击即获胜
    if (isWin && this.stats.hasFirstClickWin && !this.achievements.secretLucky) {
      this.achievements.secretLucky = Date.now();
      newlyUnlocked.push('secretLucky');
    }

    // 检查宗师成就（所有普通成就解锁）
    if (!this.achievements.secretMaster) {
      const normalIds = Object.keys(ACHIEVEMENTS).filter(id => !ACHIEVEMENTS[id].hidden && id !== 'secretMaster');
      const allNormalUnlocked = normalIds.every(id => this.achievements[id]);
      if (allNormalUnlocked) {
        this.achievements.secretMaster = Date.now();
        newlyUnlocked.push('secretMaster');
      }
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

    // 月度达人 - 连续30天
    if (dailyProgress && dailyProgress.streak >= 30 && !this.achievements.dailyStreak30) {
      this.achievements.dailyStreak30 = Date.now();
      newlyUnlocked.push('dailyStreak30');
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

    const isUnlocked = !!this.achievements[achievementId];
    const displayIcon = achievement.hidden && isUnlocked ? achievement.realIcon : achievement.icon;
    const displayName = achievement.hidden && isUnlocked ? achievement.realName : achievement.name;
    const displayDesc = achievement.hidden && isUnlocked ? achievement.realDesc : achievement.desc;

    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <span class="achievement-icon">${displayIcon}</span>
      <div class="achievement-content">
        <h4>成就解锁：${displayName}</h4>
        <p>${displayDesc}</p>
      </div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.classList.add('removing');
      setTimeout(() => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
      }, 500);
    }, 3000);

    return popup;
  },

  getUnlockedAchievements() {
    return Object.keys(this.achievements)
      .filter(id => ACHIEVEMENTS[id])
      .map(id => ({
        ...ACHIEVEMENTS[id],
        unlockedAt: this.achievements[id]
      }));
  },

  getAllAchievements() {
    return ACHIEVEMENTS;
  },

  getAchievementProgress() {
    const progress = {};
    Object.keys(ACHIEVEMENTS).forEach(id => {
      progress[id] = this.achievements[id] ? 100 : 0;
    });
    return progress;
  },

  recordPowerupCollect() {
    this.stats.totalPowerupsCollected = (this.stats.totalPowerupsCollected || 0) + 1;
    this.storageManager.saveStats(this.stats);
  },

  renderAchievementsPanel(filter = 'all') {
    const grid = document.getElementById('achievementGrid');
    const summary = document.getElementById('achievementSummary');
    if (!grid) return;

    const total = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = Object.keys(ACHIEVEMENTS).filter(id => this.achievements[id]).length;
    const lockedCount = total - unlockedCount;
    const secretUnlocked = Object.keys(ACHIEVEMENTS)
      .filter(id => ACHIEVEMENTS[id].hidden && this.achievements[id]).length;

    if (summary) {
      summary.innerHTML = `
        <span>已解锁 <strong>${unlockedCount}</strong>/${total}</span>
        <span>未解锁 <strong>${lockedCount}</strong></span>
        ${secretUnlocked > 0 ? `<span>秘密 <strong>${secretUnlocked}</strong></span>` : ''}
      `;
    }

    const entries = Object.entries(ACHIEVEMENTS);

    const filtered = entries.filter(([id, ach]) => {
      const isUnlocked = !!this.achievements[id];
      if (filter === 'unlocked') return isUnlocked;
      if (filter === 'locked') return !isUnlocked;
      return true;
    });

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="achievement-empty">${filter === 'unlocked' ? '暂无已解锁的成就' : '所有成就都已解锁！'}</div>`;
      return;
    }

    filtered.forEach(([id, ach]) => {
      const isUnlocked = !!this.achievements[id];
      const isHidden = ach.hidden;
      const card = document.createElement('div');

      let displayIcon, displayName, displayDesc, cardClass, badgeText, badgeClass;

      if (isHidden && !isUnlocked) {
        displayIcon = '❓';
        displayName = '???';
        displayDesc = '未解锁的秘密成就';
        cardClass = 'achievement-card secret locked';
        badgeText = '秘密';
        badgeClass = 'achievement-card-badge locked-badge';
      } else if (isHidden && isUnlocked) {
        displayIcon = ach.realIcon;
        displayName = ach.realName;
        displayDesc = ach.realDesc;
        cardClass = 'achievement-card unlocked';
        badgeText = '已解锁';
        badgeClass = 'achievement-card-badge unlocked-badge';
      } else if (isUnlocked) {
        displayIcon = ach.icon;
        displayName = ach.name;
        displayDesc = ach.desc;
        cardClass = 'achievement-card unlocked';
        badgeText = '已解锁';
        badgeClass = 'achievement-card-badge unlocked-badge';
      } else {
        displayIcon = ach.icon;
        displayName = ach.name;
        displayDesc = ach.desc;
        cardClass = 'achievement-card locked';
        badgeText = '未解锁';
        badgeClass = 'achievement-card-badge locked-badge';
      }

      const unlockedAt = this.achievements[id];
      const dateStr = unlockedAt
        ? new Date(unlockedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

      card.className = cardClass;
      card.innerHTML = `
        <div class="achievement-card-icon">${displayIcon}</div>
        <div class="achievement-card-body">
          <div class="achievement-card-name">${displayName}</div>
          <div class="achievement-card-desc">${displayDesc}</div>
          ${dateStr ? `<div class="achievement-card-date">${dateStr}</div>` : ''}
        </div>
        <div class="${badgeClass}">${badgeText}</div>
      `;

      grid.appendChild(card);
    });
  },

  bindAchievementFilters() {
    const btns = document.querySelectorAll('.achievement-filter-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderAchievementsPanel(btn.dataset.cat);
      });
    });
  }
};

export default StatsManager;
