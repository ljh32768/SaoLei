/**
 * 扫雷增强版 - 棋盘渲染模块
 */

export const BoardRenderer = {
  boardEl: null,
  mineCountEl: null,
  timerEl: null,
  msgEl: null,
  comboDisplayEl: null,
  healthBarEl: null,
  powerupBarEl: null,
  // 保存事件处理函数引用，用于解绑
  _clickHandler: null,
  _contextMenuHandler: null,
  _dblClickHandler: null,

  /**
   * 初始化
   * @param {object} elements - DOM元素对象
   */
  init(elements) {
    this.boardEl = elements.board;
    this.mineCountEl = elements.mineCount;
    this.timerEl = elements.timer;
    this.msgEl = elements.msg;
    this.comboDisplayEl = elements.comboDisplay;
    this.healthBarEl = elements.healthBar;
    this.powerupBarEl = elements.powerupBar;
  },

  /**
   * 渲染棋盘
   * @param {GameState} gameState - 游戏状态
   */
  renderBoard(gameState) {
    if (!this.boardEl) return;

    this.boardEl.style.setProperty('--cols', gameState.cols);
    this.boardEl.innerHTML = '';

    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const el = document.createElement('div');
        el.className = 'cell hidden';
        if (gameState.hexMode) el.classList.add('hex');
        el.dataset.r = r;
        el.dataset.c = c;
        this.boardEl.appendChild(el);
      }
    }

    // 渲染已揭示的格子
    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const cell = gameState.grid[r][c];
        if (cell.revealed || cell.flagged) {
          this.renderCell(r, c, gameState);
        }
      }
    }

    this.updateMineCount(gameState.getRemainingMines());
  },

  /**
   * 渲染单个格子
   * @param {number} r - 行
   * @param {number} c - 列
   * @param {GameState} gameState - 游戏状态
   */
  renderCell(r, c, gameState) {
    const el = this.getEl(r, c, gameState.cols);
    if (!el) return;

    const cell = gameState.grid[r][c];

    el.className = 'cell';
    if (gameState.hexMode) el.classList.add('hex');
    el.style.boxShadow = '';
    el.style.borderColor = '';
    el.textContent = '';

    if (cell.revealed) {
      el.classList.add('revealed');
      if (cell.mine) {
        if (cell.triggered && !gameState.gameOver) {
          // 护盾触发的地雷，显示为被保护状态
          el.classList.add('shield-blocked');
        } else if (cell.triggered) {
          el.classList.add('mine-trigger');
        } else {
          el.classList.add('mine-show');
        }
        el.textContent = '💣';
      } else if (cell.count > 0) {
        el.classList.add('n' + cell.count);
        el.textContent = cell.count;
      }
      if (cell.hinted) el.classList.add('hint');
    } else if (cell.flagged) {
      el.classList.add('hidden', 'flagged');
      if (cell.wrongFlag) el.classList.add('wrong-flag');
    } else {
      el.classList.add('hidden');
      if (cell.sonarHint) {
        el.style.boxShadow = 'inset 0 0 10px #e94560';
      }
    }
  },

  /**
   * 渲染所有格子
   * @param {GameState} gameState - 游戏状态
   */
  renderAll(gameState) {
    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        this.renderCell(r, c, gameState);
      }
    }
  },

  /**
   * 获取格子元素
   * @param {number} r - 行
   * @param {number} c - 列
   * @param {number} cols - 列数
   * @returns {HTMLElement}
   */
  getEl(r, c, cols) {
    if (!this.boardEl) return null;
    return this.boardEl.children[r * cols + c];
  },

  /**
   * 更新地雷计数
   * @param {number} count - 剩余地雷数
   */
  updateMineCount(count) {
    if (this.mineCountEl) {
      this.mineCountEl.textContent = count;
    }
  },

  /**
   * 更新计时器
   * @param {number} seconds - 秒数
   */
  updateTimer(seconds) {
    if (this.timerEl) {
      this.timerEl.textContent = seconds;
    }
  },

  /**
   * 更新连击显示
   * @param {number} combo - 连击数
   */
  updateComboDisplay(combo) {
    if (this.comboDisplayEl) {
      this.comboDisplayEl.textContent = combo > 0 ? `x${combo}` : '0';
      if (combo > 0) {
        this.comboDisplayEl.classList.add('combo-pop');
        setTimeout(() => this.comboDisplayEl.classList.remove('combo-pop'), 300);
      }
    }
  },

  /**
   * 更新生命条
   * @param {number} health - 当前生命值
   * @param {number} maxHealth - 最大生命值
   */
  updateHealthBar(health, maxHealth) {
    if (!this.healthBarEl) return;

    this.healthBarEl.innerHTML = '';
    this.healthBarEl.style.display = maxHealth > 0 ? 'flex' : 'none';

    for (let i = 0; i < maxHealth; i++) {
      const heart = document.createElement('span');
      heart.className = 'health-heart';
      heart.textContent = '❤️';
      if (i >= health) heart.classList.add('lost');
      this.healthBarEl.appendChild(heart);
    }
  },

  /**
   * 更新道具栏
   * @param {GameState} gameState - 游戏状态
   */
  updatePowerupBar(gameState) {
    if (!this.powerupBarEl) return;

    const buttons = this.powerupBarEl.querySelectorAll('.powerup-btn');
    buttons.forEach(btn => {
      const key = btn.dataset.key;
      const count = gameState.powerups[key] || 0;
      const countEl = btn.querySelector('.powerup-count');

      if (countEl) countEl.textContent = count;
      btn.disabled = count <= 0;

      if (gameState.activePowerup === key) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  /**
   * 初始化道具栏
   * @param {GameState} gameState - 游戏状态
   * @param {Function} onClick - 点击回调
   * @param {Function} onDoubleClick - 双击回调
   */
  initPowerupBar(gameState, onClick, onDoubleClick) {
    if (!this.powerupBarEl) return;

    this.powerupBarEl.innerHTML = '';

    const powerups = {
      sonar: { icon: '📡', name: '声纳', desc: '显示周围地雷位置' },
      reveal: { icon: '🔍', name: '揭示', desc: '安全揭示一个非地雷格子' },
      flag: { icon: '🚩', name: '旗帜', desc: '自动标记一个未发现的地雷' },
      shield: { icon: '🛡️', name: '护盾', desc: '抵挡一次地雷伤害' },
      hint: { icon: '💡', name: '提示', desc: '显示一个安全位置' },
      bomb: { icon: '💥', name: '炸弹', desc: '清除3x3区域' }
    };

    Object.entries(powerups).forEach(([key, p]) => {
      const btn = document.createElement('button');
      btn.className = 'powerup-btn';
      btn.dataset.key = key;
      btn.innerHTML = `${p.icon}<span class="powerup-count" id="count-${key}">${gameState.powerups[key]}</span>`;
      btn.title = `${p.name}: ${p.desc}\n双击使用`;
      btn.onclick = () => onClick(key);
      btn.ondblclick = (e) => {
        e.preventDefault();
        onDoubleClick(key);
      };
      this.powerupBarEl.appendChild(btn);
    });

    this.updatePowerupBar(gameState);
  },

  /**
   * 显示消息
   * @param {string} text - 消息文本
   * @param {string} type - 类型 (win/lose/info)
   */
  showMessage(text, type = 'info') {
    if (!this.msgEl) return;
    this.msgEl.textContent = text;
    this.msgEl.className = 'msg ' + type;
  },

  /**
   * 清空消息
   */
  clearMessage() {
    if (!this.msgEl) return;
    this.msgEl.textContent = '';
    this.msgEl.className = 'msg';
  },

  /**
   * 显示地雷计数动画
   * @param {number} value - 新值
   */
  showMineCountAnimation(value) {
    if (!this.mineCountEl) return;
    this.mineCountEl.style.animation = 'stat-update 0.3s ease-out';
    setTimeout(() => {
      this.mineCountEl.style.animation = '';
    }, 300);
  },

  /**
   * 绑定棋盘事件
   * @param {GameState} gameState - 游戏状态
   * @param {object} handlers - 事件处理函数
   */
  bindBoardEvents(gameState, handlers) {
    if (!this.boardEl) return;

    // 移除旧的事件监听器（如果存在），避免重复绑定
    if (this._clickHandler) {
      this.boardEl.removeEventListener('click', this._clickHandler);
    }
    if (this._contextMenuHandler) {
      this.boardEl.removeEventListener('contextmenu', this._contextMenuHandler);
    }
    if (this._dblClickHandler) {
      this.boardEl.removeEventListener('dblclick', this._dblClickHandler);
    }

    // 保存处理函数引用
    this._clickHandler = (e) => {
      if (e.button !== 0) return;
      const el = e.target.closest('.cell');
      if (!el) return;
      const r = +el.dataset.r, c = +el.dataset.c;
      if (isNaN(r) || isNaN(c)) return;
      handlers.onCellClick(r, c);
    };

    this._contextMenuHandler = (e) => {
      e.preventDefault();
      const el = e.target.closest('.cell');
      if (!el) return;
      const r = +el.dataset.r, c = +el.dataset.c;
      if (isNaN(r) || isNaN(c)) return;
      handlers.onCellRightClick(r, c);
    };

    this._dblClickHandler = (e) => {
      e.preventDefault();
      const el = e.target.closest('.cell');
      if (!el) return;
      const r = +el.dataset.r, c = +el.dataset.c;
      if (isNaN(r) || isNaN(c)) return;
      handlers.onCellDoubleClick(r, c);
    };

    // 绑定新的事件监听器
    this.boardEl.addEventListener('click', this._clickHandler);
    this.boardEl.addEventListener('contextmenu', this._contextMenuHandler);
    this.boardEl.addEventListener('dblclick', this._dblClickHandler);
  }
};

export default BoardRenderer;
