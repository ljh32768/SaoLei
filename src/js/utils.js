/**
 * 扫雷增强版 - 工具函数模块
 */

export const DIFF = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
};

/**
 * 遍历邻居格子
 * @param {number} r - 当前行
 * @param {number} c - 当前列
 * @param {function} fn - 回调函数 (nr, nc) => void
 * @param {boolean} hexMode - 是否六边形模式
 * @param {number} rows - 总行数
 * @param {number} cols - 总列数
 */
export function forNeighbors(r, c, fn, hexMode = false, rows = 0, cols = 0) {
  if (hexMode) {
    // 六边形邻居方向 - 根据行奇偶性使用不同的偏移
    // 偶数行（offset-rendered方式）
    const isEvenRow = r % 2 === 0;
    const dirs = isEvenRow
      ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]]  // 偶数行
      : [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]];    // 奇数行
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        fn(nr, nc);
      }
    }
  } else {
    // 标准方形邻居方向
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          fn(nr, nc);
        }
      }
    }
  }
}

/**
 * 格式化时间显示
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化字符串
 */
export function formatTime(seconds) {
  if (seconds === null || seconds === undefined || seconds < 0) return '-';

  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}分${s}秒` : `${m}分`;
  } else {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}时${m}分` : `${h}时`;
  }
}

/**
 * 格式化时间为 MM:SS 格式
 * @param {number} seconds - 秒数
 * @returns {string} - "MM:SS" 格式
 */
export function formatTimeMMSS(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * 获取难度配置
 * @param {string} difficulty - 难度字符串 (easy/medium/hard/custom)
 * @param {object} customConfig - 自定义配置 {rows, cols, mines}
 * @returns {object} - {rows, cols, mines}
 */
export function getDifficulty(difficulty, customConfig = null) {
  if (difficulty === 'custom' && customConfig) {
    return {
      rows: clamp(customConfig.rows || 12, 5, 30),
      cols: clamp(customConfig.cols || 12, 5, 50),
      mines: clamp(customConfig.mines || 20, 1, (customConfig.rows || 12) * (customConfig.cols || 12) - 9)
    };
  }
  if (difficulty === 'custom') {
    return { rows: 12, cols: 12, mines: 20 };
  }
  return DIFF[difficulty] || DIFF.easy;
}

/**
 * 基于日期生成种子
 * @param {Date} date - 日期对象，默认为今天
 * @returns {number} - 整数种子
 */
export function generateSeedFromDate(date = null) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return year * 10000 + month * 100 + day;
}

/**
 * 创建种子随机函数（线性同余生成器）
 * @param {number} seed - 种子
 * @returns {function} - 返回0-1的随机数
 */
export function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * 限制数值范围
 * @param {number} val - 值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * 深拷贝对象
 * @param {*} obj - 源对象
 * @returns {*} - 拷贝
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 随机整数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（不包含）
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 防抖函数
 * @param {function} fn - 目标函数
 * @param {number} delay - 延迟毫秒
 * @returns {function}
 */
export function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {function} fn - 目标函数
 * @param {number} interval - 间隔毫秒
 * @returns {function}
 */
export function throttle(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 打乱数组（Fisher-Yates算法）
 * @param {array} arr - 源数组
 * @returns {array} - 打乱后的新数组
 */
export function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 打乱数组（使用种子）
 * @param {array} arr - 源数组
 * @param {number} seed - 种子
 * @returns {array} - 打乱后的新数组
 */
export function shuffleArraySeeded(arr, seed) {
  const rand = seededRandom(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 检查两个数组是否相等
 * @param {array} a - 数组A
 * @param {array} b - 数组B
 * @returns {boolean}
 */
export function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/**
 * 获取今天的日期字符串
 * @returns {string} - "YYYY-MM-DD"
 */
export function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 比较两个日期是否是同一天
 * @param {Date} d1 - 日期1
 * @param {Date} d2 - 日期2
 * @returns {boolean}
 */
export function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * 格式化数字为带千分位的字符串
 * @param {number} num - 数字
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toLocaleString('zh-CN');
}

/**
 * 百分比计算
 * @param {number} part - 部分值
 * @param {number} total - 总值
 * @param {number} decimals - 小数位数
 * @returns {string}
 */
export function formatPercent(part, total, decimals = 0) {
  if (total === 0) return '0%';
  const pct = (part / total * 100).toFixed(decimals);
  return `${pct}%`;
}
