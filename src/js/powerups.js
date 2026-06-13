/**
 * 扫雷增强版 - 道具系统
 */

import { POWERUPS } from './game.js';

export const PowerupManager = {
  /**
   * 激活声纳
   * @param {GameState} gameState - 游戏状态
   * @returns {boolean}
   */
  activateSonar(gameState) {
    // 声纳不能在第一次点击前使用
    if (gameState.firstClick) return false;
    if (gameState.powerups.sonar <= 0) return false;

    // 为所有未揭示、未标记的格子应用声纳提示
    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const cell = gameState.grid[r][c];
        if (!cell.revealed && !cell.flagged) {
          cell.sonarHint = cell.mine;
        }
      }
    }

    // 消耗声纳道具并启动冷却
    gameState.powerups.sonar--;
    gameState.sonarCooldown = true;
    setTimeout(() => {
      // 清除声纳提示
      for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
          gameState.grid[r][c].sonarHint = false;
        }
      }
      // 结束冷却
      gameState.sonarCooldown = false;
    }, 3000);

    return true;
  },

  /**
   * 使用揭示
   * @param {GameState} gameState - 游戏状态
   * @returns {boolean}
   */
  useReveal(gameState) {
    const safeCells = [];

    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const cell = gameState.grid[r][c];
        if (!cell.revealed && !cell.flagged && !cell.mine) {
          safeCells.push({ r, c });
        }
      }
    }

    if (safeCells.length === 0) return false;

    const target = safeCells[Math.floor(Math.random() * safeCells.length)];
    gameState.reveal(target.r, target.c, true);
    return true;
  },

  /**
   * 使用旗帜
   * @param {GameState} gameState - 游戏状态
   * @returns {object|null}
   */
  useFlag(gameState) {
    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const cell = gameState.grid[r][c];
        if (!cell.revealed && !cell.flagged && cell.mine) {
          cell.flagged = true;
          gameState.flagCount++;
          return { r, c };
        }
      }
    }
    return null;
  },

  /**
   * 使用护盾
   * @param {GameState} gameState - 游戏状态
   * @returns {boolean}
   */
  useShield(gameState) {
    if (gameState.shieldActive) return false;
    gameState.shieldActive = true;
    return true;
  },

  /**
   * 检查是否有护盾
   * @param {GameState} gameState - 游戏状态
   * @returns {boolean}
   */
  hasShield(gameState) {
    return gameState.shieldActive;
  },

  /**
   * 消耗护盾
   * @param {GameState} gameState - 游戏状态
   */
  consumeShield(gameState) {
    gameState.shieldActive = false;
    gameState.powerups.shield--;
  },

  /**
   * 使用提示
   * @param {GameState} gameState - 游戏状态
   * @returns {object|null} - 提示位置或null
   */
  useHint(gameState) {
    // 寻找有数字揭示格子的安全邻居
    const hintCells = [];

    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const cell = gameState.grid[r][c];
        if (cell.revealed && cell.count > 0) {
          // 使用 _forNeighbors 兼容六边形模式
          gameState._forNeighbors(r, c, (nr, nc) => {
            const neighbor = gameState.grid[nr][nc];
            if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
              hintCells.push({ r: nr, c: nc });
            }
          });
        }
      }
    }

    // 如果没有，找任意安全格子
    if (hintCells.length === 0) {
      for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
          const cell = gameState.grid[r][c];
          if (!cell.revealed && !cell.flagged && !cell.mine) {
            hintCells.push({ r, c });
          }
        }
      }
    }

    if (hintCells.length === 0) return null;

    const target = hintCells[Math.floor(Math.random() * hintCells.length)];
    gameState.grid[target.r][target.c].hinted = true;

    // 3秒后清除提示
    setTimeout(() => {
      if (gameState.grid[target.r] && gameState.grid[target.r][target.c]) {
        gameState.grid[target.r][target.c].hinted = false;
      }
    }, 3000);

    return target;
  },

  /**
   * 使用炸弹
   * @param {GameState} gameState - 游戏状态
   * @param {number} targetR - 目标行
   * @param {number} targetC - 目标列
   * @returns {object}
   */
  useBomb(gameState, targetR, targetC) {
    const revealed = [];
    const triggered = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = targetR + dr, nc = targetC + dc;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          const cell = gameState.grid[nr][nc];
          if (!cell.revealed && !cell.flagged) {
            if (cell.mine) {
              cell.revealed = true;
              cell.triggered = true;
              gameState.revealedCount++;
              triggered.push({ r: nr, c: nc });
            } else {
              gameState.reveal(nr, nc, true);
              revealed.push({ r: nr, c: nc });
            }
          }
        }
      }
    }

    return { revealed, triggered };
  },

  /**
   * 切换道具选择
   * @param {string} key - 道具key
   * @param {GameState} gameState - 游戏状态
   */
  togglePowerup(key, gameState) {
    if (gameState.activePowerup === key) {
      gameState.activePowerup = null;
    } else {
      gameState.activePowerup = key;
    }
  },

  /**
   * 使用道具
   * @param {string} key - 道具key
   * @param {GameState} gameState - 游戏状态
   * @param {number|null} targetR - 目标行（炸弹需要）
   * @param {number|null} targetC - 目标列（炸弹需要）
   * @returns {object|false} - 使用结果
   */
  usePowerup(key, gameState, targetR = null, targetC = null) {
    if (gameState.powerups[key] <= 0 || gameState.gameOver) return false;

    const oldActive = gameState.activePowerup;
    gameState.activePowerup = null;

    let result = { used: true, key };

    switch (key) {
      case 'sonar':
        result.success = this.activateSonar(gameState);
        break;
      case 'reveal':
        result.success = this.useReveal(gameState);
        if (result.success) gameState.powerups.reveal--;
        break;
      case 'flag':
        result.target = this.useFlag(gameState);
        result.success = result.target !== null;
        if (result.success) gameState.powerups.flag--;
        break;
      case 'shield':
        result.success = this.useShield(gameState);
        if (result.success) gameState.powerups.shield--;
        break;
      case 'hint':
        result.target = this.useHint(gameState);
        result.success = result.target !== null;
        if (result.success) gameState.powerups.hint--;
        break;
      case 'bomb':
        if (targetR !== null && targetC !== null) {
          result.result = this.useBomb(gameState, targetR, targetC);
          result.success = true;
          gameState.powerups.bomb--;
        } else {
          // 需要选择目标
          gameState.activePowerup = key;
          return { needTarget: true, key };
        }
        break;
    }

    if (result.success) {
      gameState.powerupsUsed++;
    }

    return result;
  },

  /**
   * 道具掉落
   * @param {GameState} gameState - 游戏状态
   * @returns {string|null} - 掉落的道具key或null
   */
  dropPowerup(gameState) {
    const keys = Object.keys(POWERUPS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    if (gameState.powerups[randomKey] < POWERUPS[randomKey].maxStock) {
      gameState.powerups[randomKey]++;
      return randomKey;
    }

    return null;
  }
};

export default PowerupManager;
