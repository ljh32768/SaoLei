/**
 * 扫雷增强版 - 核心游戏逻辑
 */

// 道具配置
export const POWERUPS = {
  sonar: { icon: '📡', name: '声纳', desc: '显示周围地雷位置', cost: 3, maxStock: 5, cooldown: 3000 },
  reveal: { icon: '🔍', name: '揭示', desc: '安全揭示一个非地雷格子', cost: 2, maxStock: 5 },
  flag: { icon: '🚩', name: '旗帜', desc: '自动标记一个未发现的地雷', cost: 2, maxStock: 5 },
  shield: { icon: '🛡️', name: '护盾', desc: '抵挡一次地雷伤害', cost: 4, maxStock: 3 },
  hint: { icon: '💡', name: '提示', desc: '高亮显示一个安全位置', cost: 1, maxStock: 10 },
  bomb: { icon: '💥', name: '炸弹', desc: '清除3x3区域', cost: 5, maxStock: 2 }
};

// 难度配置
export const DIFF = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
};

// 冒险关卡配置
export const ADVENTURE_LEVELS = [
  { id: '1-1', name: '初入迷宫', rows: 8, cols: 8, mines: 8, health: 3, timeLimit: null, boss: false },
  { id: '1-2', name: '暗影之地', rows: 9, cols: 9, mines: 12, health: 3, timeLimit: 120, boss: false },
  { id: '1-3', name: '危机四伏', rows: 10, cols: 10, mines: 18, health: 3, timeLimit: null, boss: false },
  { id: '1-B', name: '守关 Boss', rows: 12, cols: 12, mines: 30, health: 2, timeLimit: 180, boss: true },
  { id: '2-1', name: '深层迷宫', rows: 12, cols: 12, mines: 25, health: 3, timeLimit: null, boss: false },
  { id: '2-2', name: '死亡边缘', rows: 14, cols: 14, mines: 35, health: 3, timeLimit: 200, boss: false },
  { id: '2-3', name: '绝境求生', rows: 15, cols: 15, mines: 45, health: 2, timeLimit: null, boss: false },
  { id: '2-B', name: '终极 Boss', rows: 16, cols: 16, mines: 60, health: 1, timeLimit: 300, boss: true }
];

/**
 * 游戏状态类
 */
export class GameState {
  constructor() {
    this.grid = [];
    this.rows = 9;
    this.cols = 9;
    this.totalMines = 10;
    this.flagCount = 0;
    this.revealedCount = 0;
    this.gameOver = false;
    this.firstClick = true;
    this.hexMode = false;
    this.health = 3;
    this.maxHealth = 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.consecutiveReveals = 0;
    this.powerups = { sonar: 3, reveal: 3, flag: 3, shield: 2, hint: 5, bomb: 1 };
    this.activePowerup = null;
    this.seconds = 0;
    this.timerInterval = null;
    this.currentAdventureLevel = null;
    this.adventureHealth = 3;
    this.adventureProgress = null;
    this.stats = null;
    this.dailyChallenge = null;
    this.shieldActive = false;
    this.timeLimit = null;
    this.isPaused = false;
    this.powerupsUsed = 0;
    this.dailyMode = false;
    this.dailySeed = null;

    // 回调函数
    this.onTimerUpdate = null;
    this.onGameOver = null;
    this.onWin = null;
    this.onCombo = null;
    this.onPowerupDrop = null;
    this.onTimeLimit = null;
  }

  /**
   * 初始化游戏
   * @param {boolean} fullReset - 是否完全重置
   * @param {object} difficulty - 难度配置 {rows, cols, mines}
   * @returns {GameState}
   */
  init(fullReset = false, difficulty = null) {
    if (fullReset || this.currentAdventureLevel === null) {
      this.powerups = { sonar: 3, reveal: 3, flag: 3, shield: 2, hint: 5, bomb: 1 };
      this.powerupsUsed = 0;
    }

    if (!this.currentAdventureLevel) {
      const d = difficulty || DIFF.easy;
      this.rows = d.rows;
      this.cols = d.cols;
      this.totalMines = d.mines;
      this.health = 3;
      this.maxHealth = 3;
      this.adventureHealth = 3;
    }

    this.flagCount = 0;
    this.revealedCount = 0;
    this.gameOver = false;
    this.firstClick = true;
    this.seconds = 0;
    this.consecutiveReveals = 0;
    this.combo = 0;
    this.activePowerup = null;
    this.shieldActive = false;
    this.sonarCooldown = false;
    this.isPaused = false;
    if (!this.currentAdventureLevel) {
      this.dailyMode = false;  // 重置每日挑战模式
      this.dailySeed = null;   // 重置每日挑战种子
      this.timeLimit = null;   // 重置时间限制
    }
    this.stopTimer();

    // 初始化网格
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = {
          mine: false,
          revealed: false,
          flagged: false,
          count: 0,
          hinted: false,
          sonarHint: false,
          wrongFlag: false,
          triggered: false
        };
      }
    }

    return this;
  }

  /**
   * 放置地雷
   * @param {number} safeR - 安全行（首次点击）
   * @param {number} safeC - 安全列（首次点击）
   */
  placeMines(safeR, safeC) {
    let placed = 0;
    const safeCells = new Set();
    const maxAttempts = this.rows * this.cols * 10; // 防止死循环
    let attempts = 0;

    // 安全区域（首次点击及周围）
    const addSafe = (r, c) => {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        safeCells.add(`${r},${c}`);
      }
    };

    // 添加安全区域
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        addSafe(safeR + dr, safeC + dc);
      }
    }

    // 随机放置地雷
    while (placed < this.totalMines && attempts < maxAttempts) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      attempts++;

      if (safeCells.has(`${r},${c}`)) continue;
      if (this.grid[r][c].mine) continue;

      this.grid[r][c].mine = true;
      placed++;
    }

    // 如果地雷数量不足，减少总数以避免死循环
    if (placed < this.totalMines) {
      console.warn(`只放置了 ${placed}/${this.totalMines} 颗地雷`);
      this.totalMines = placed;
    }

    // 计算每个格子的数字
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) continue;

        let cnt = 0;
        this._forNeighbors(r, c, (nr, nc) => {
          if (this.grid[nr][nc].mine) cnt++;
        });
        this.grid[r][c].count = cnt;
      }
    }
  }

  /**
   * 使用种子放置地雷（用于每日挑战）
   * @param {number} seed - 随机种子
   * @param {number} safeR - 安全行
   * @param {number} safeC - 安全列
   */
  placeMinesWithSeed(seed, safeR, safeC) {
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    let placed = 0;
    const safeCells = new Set();
    const maxAttempts = this.rows * this.cols * 10;
    let attempts = 0;

    const addSafe = (r, c) => {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        safeCells.add(`${r},${c}`);
      }
    };

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        addSafe(safeR + dr, safeC + dc);
      }
    }

    while (placed < this.totalMines && attempts < maxAttempts) {
      const r = Math.floor(rand() * this.rows);
      const c = Math.floor(rand() * this.cols);
      attempts++;

      if (safeCells.has(`${r},${c}`)) continue;
      if (this.grid[r][c].mine) continue;

      this.grid[r][c].mine = true;
      placed++;
    }

    // 如果地雷数量不足
    if (placed < this.totalMines) {
      console.warn(`只放置了 ${placed}/${this.totalMines} 颗地雷`);
      this.totalMines = placed;
    }

    // 计算数字
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) continue;

        let cnt = 0;
        this._forNeighbors(r, c, (nr, nc) => {
          if (this.grid[nr][nc].mine) cnt++;
        });
        this.grid[r][c].count = cnt;
      }
    }
  }

  /**
   * 遍历邻居
   * @private
   */
  _forNeighbors(r, c, fn) {
    if (this.hexMode) {
      // 六边形邻居方向 - 根据行奇偶性使用不同的偏移
      const isEvenRow = r % 2 === 0;
      const dirs = isEvenRow
        ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]]  // 偶数行
        : [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]];    // 奇数行
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          fn(nr, nc);
        }
      }
    } else {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            fn(nr, nc);
          }
        }
      }
    }
  }

  /**
   * 揭开格子
   * @param {number} r - 行
   * @param {number} c - 列
   * @param {boolean} fromPowerup - 是否来自道具
   * @param {boolean} isFloodFill - 是否flood fill调用
   * @returns {boolean}
   */
  reveal(r, c, fromPowerup = false, isFloodFill = false) {
    const cell = this.grid[r][c];
    if (cell.revealed || cell.flagged || this.gameOver || this.isPaused) return false;

    // 首次点击保护
    if (this.firstClick && !fromPowerup) {
      this.firstClick = false;

      if (this.dailyMode && this.dailySeed !== null) {
        this.placeMinesWithSeed(this.dailySeed, r, c);
      } else {
        this.placeMines(r, c);
      }

      this.startTimer();
    }

    // 处理地雷
    if (cell.mine && !fromPowerup) {
      if (this.shieldActive) {
        // 护盾触发，关闭护盾状态（道具数量在使用时已扣减）
        this.shieldActive = false;
        cell.revealed = true;
        cell.triggered = true;
        // 地雷不计入揭示计数
        return false;
      } else {
        this.triggerGameOver(r, c);
        return false;
      }
    }

    // 正常揭示
    cell.revealed = true;
    this.revealedCount++;

    // 连击系统
    if (!fromPowerup && !cell.mine) {
      this.consecutiveReveals++;
      if (this.consecutiveReveals >= 3) {
        const newCombo = Math.floor(this.consecutiveReveals / 3);
        if (newCombo !== this.combo) {
          this.combo = newCombo;
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;
          if (this.onCombo) this.onCombo(this.combo);

          // 15%概率掉落道具
          if (Math.random() < 0.15 && this.onPowerupDrop) {
            this.onPowerupDrop();
          }
        }
      }
    }

    // Flood fill
    if (cell.count === 0 && !fromPowerup) {
      this._forNeighbors(r, c, (nr, nc) => {
        const neighbor = this.grid[nr][nc];
        if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
          this.reveal(nr, nc, fromPowerup, true);
        }
      });
    }

    // 检查胜利
    if (!this.gameOver && this.revealedCount === this.rows * this.cols - this.totalMines) {
      this.triggerWin();
    }

    return true;
  }

  /**
   * 触发游戏结束
   * @param {number} triggerR - 触发行
   * @param {number} triggerC - 触发列
   */
  triggerGameOver(triggerR, triggerC) {
    this.gameOver = true;
    this.stopTimer();

    this.grid[triggerR][triggerC].revealed = true;
    this.grid[triggerR][triggerC].triggered = true;

    // 揭示所有地雷
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) {
          this.grid[r][c].revealed = true;
        }
      }
    }

    // 标记错误旗帜
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].flagged && !this.grid[r][c].mine) {
          this.grid[r][c].wrongFlag = true;
        }
      }
    }

    if (this.onGameOver) {
      this.onGameOver(triggerR, triggerC);
    }
  }

  /**
   * 触发胜利
   */
  triggerWin() {
    this.gameOver = true;
    this.stopTimer();

    // 自动标记剩余地雷
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine && !this.grid[r][c].flagged) {
          this.grid[r][c].flagged = true;
          this.flagCount++;
        }
      }
    }

    if (this.onWin) {
      this.onWin();
    }
  }

  /**
   * 切换旗帜
   * @param {number} r - 行
   * @param {number} c - 列
   * @returns {boolean}
   */
  toggleFlag(r, c) {
    const cell = this.grid[r][c];
    if (cell.revealed || this.gameOver || this.isPaused) return false;

    cell.flagged = !cell.flagged;
    this.flagCount += cell.flagged ? 1 : -1;

    return true;
  }

  /**
   * Chord功能（快速揭开周围）
   * @param {number} r - 行
   * @param {number} c - 列
   * @returns {boolean}
   */
  chord(r, c) {
    const cell = this.grid[r][c];
    if (!cell.revealed || cell.count === 0 || this.gameOver || this.isPaused) return false;

    let flaggedCount = 0;
    this._forNeighbors(r, c, (nr, nc) => {
      if (this.grid[nr][nc].flagged) flaggedCount++;
    });

    if (flaggedCount !== cell.count) return false;

    // 揭开周围未标记格子
    let revealedAny = false;
    this._forNeighbors(r, c, (nr, nc) => {
      const neighbor = this.grid[nr][nc];
      if (!neighbor.revealed && !neighbor.flagged) {
        if (this.reveal(nr, nc)) {
          revealedAny = true;
        }
      }
    });

    return revealedAny;
  }

  /**
   * 启动计时器
   */
  startTimer() {
    if (this.timerInterval) return;

    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.seconds++;
        if (this.onTimerUpdate) {
          this.onTimerUpdate(this.seconds);
        }

        // 检查时间限制
        if (this.timeLimit !== null && this.seconds >= this.timeLimit) {
          this.triggerTimeLimit();
        }
      }
    }, 1000);
  }

  /**
   * 停止计时器
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * 暂停游戏
   */
  pause() {
    this.isPaused = true;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * 继续游戏
   */
  resume() {
    if (this.isPaused && !this.gameOver && !this.firstClick) {
      this.isPaused = false;
      this.startTimer();
    }
  }

  /**
   * 时间限制触发
   */
  triggerTimeLimit() {
    this.gameOver = true;
    this.stopTimer();

    if (this.onTimeLimit) {
      this.onTimeLimit();
    }
    // 不调用 onGameOver，由 onTimeLimit 处理
  }

  /**
   * 设置难度
   * @param {number} rows - 行数
   * @param {number} cols - 列数
   * @param {number} mines - 地雷数
   */
  setDifficulty(rows, cols, mines) {
    this.rows = rows;
    this.cols = cols;
    this.totalMines = mines;
  }

  /**
   * 获取剩余地雷数
   * @returns {number}
   */
  getRemainingMines() {
    return this.totalMines - this.flagCount;
  }

  /**
   * 设置冒险关卡
   * @param {number} idx - 关卡索引
   * @param {object} level - 关卡配置
   */
  setAdventureLevel(idx, level) {
    this.currentAdventureLevel = idx;
    this.rows = level.rows;
    this.cols = level.cols;
    this.totalMines = level.mines;
    this.health = level.health;
    this.maxHealth = level.health;
    this.adventureHealth = level.health;
    this.timeLimit = level.timeLimit;
  }

  /**
   * 设置每日挑战模式
   * @param {number} seed - 种子
   */
  setDailyMode(seed) {
    this.dailyMode = true;
    this.dailySeed = seed;
    this.rows = 16;
    this.cols = 16;
    this.totalMines = 40;
  }
}

export default GameState;
