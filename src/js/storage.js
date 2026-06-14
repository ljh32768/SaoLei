/**
 * 扫雷增强版 - 本地存储管理模块
 */

const KEYS = {
  stats: 'minesweeper_stats',
  adventure: 'minesweeper_adventure',
  daily: 'minesweeper_daily',
  settings: 'minesweeper_settings',
  achievements: 'minesweeper_achievements',
  tutorial: 'minesweeper_tutorial'
};

/**
 * 加载统计数据
 * @returns {object} 统计数据
 */
export function loadStats() {
  try {
    const data = localStorage.getItem(KEYS.stats);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载统计数据失败:', e);
  }
  return {
    games: 0,
    wins: 0,
    bestTime: { easy: null, medium: null, hard: null },
    combo: 0,
    totalMinesRevealed: 0,
    powerupsUsed: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    hasFlaglessMediumPlus: false,
    hasHexHard: false,
    hasSpeedNinja: false,
    hasFirstClickWin: false,
    totalPowerupsCollected: 0,
    totalGameTimeSeconds: 0
  };
}

/**
 * 保存统计数据
 * @param {object} stats - 统计数据
 */
export function saveStats(stats) {
  try {
    localStorage.setItem(KEYS.stats, JSON.stringify(stats));
  } catch (e) {
    console.error('保存统计数据失败:', e);
  }
}

/**
 * 清除统计数据
 */
export function clearStats() {
  try {
    localStorage.removeItem(KEYS.stats);
  } catch (e) {
    console.error('清除统计数据失败:', e);
  }
}

/**
 * 加载冒险进度
 * @returns {object} 冒险进度
 */
export function loadAdventureProgress() {
  try {
    const data = localStorage.getItem(KEYS.adventure);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载冒险进度失败:', e);
  }
  return {
    currentLevel: 0,
    completedLevels: [],
    unlockedLevels: [0]
  };
}

/**
 * 保存冒险进度
 * @param {object} progress - 冒险进度
 */
export function saveAdventureProgress(progress) {
  try {
    localStorage.setItem(KEYS.adventure, JSON.stringify(progress));
  } catch (e) {
    console.error('保存冒险进度失败:', e);
  }
}

/**
 * 加载每日挑战进度
 * @returns {object} 每日挑战进度
 */
export function loadDailyProgress() {
  try {
    const data = localStorage.getItem(KEYS.daily);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载每日挑战进度失败:', e);
  }
  return {
    seed: null,
    completed: false,
    attempts: 0,
    lastDate: null,
    streak: 0
  };
}

/**
 * 保存每日挑战进度
 * @param {object} progress - 每日挑战进度
 */
export function saveDailyProgress(progress) {
  try {
    localStorage.setItem(KEYS.daily, JSON.stringify(progress));
  } catch (e) {
    console.error('保存每日挑战进度失败:', e);
  }
}

/**
 * 加载设置偏好
 * @returns {object} 设置
 */
export function loadSettings() {
  try {
    const data = localStorage.getItem(KEYS.settings);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载设置失败:', e);
  }
  return {
    sound: true,
    particles: true,
    autoFlag: false,
    theme: 'modern',
    volume: 50,
    tutorialCompleted: false
  };
}

/**
 * 保存设置偏好
 * @param {object} settings - 设置
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch (e) {
    console.error('保存设置失败:', e);
  }
}

/**
 * 加载成就数据
 * @returns {object} 已解锁成就ID对象
 */
export function loadAchievements() {
  try {
    const data = localStorage.getItem(KEYS.achievements);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载成就失败:', e);
  }
  return {};
}

/**
 * 保存成就数据
 * @param {object} achievements - 成就对象 {id: timestamp}
 */
export function saveAchievements(achievements) {
  try {
    localStorage.setItem(KEYS.achievements, JSON.stringify(achievements));
  } catch (e) {
    console.error('保存成就失败:', e);
  }
}

/**
 * 导出所有数据
 * @returns {string} JSON字符串
 */
export function exportData() {
  const data = {
    stats: loadStats(),
    adventure: loadAdventureProgress(),
    daily: loadDailyProgress(),
    settings: loadSettings(),
    achievements: loadAchievements(),
    exportDate: new Date().toISOString(),
    version: '2.0'
  };
  return JSON.stringify(data, null, 2);
}

/**
 * 导入数据
 * @param {string} jsonStr - JSON字符串
 * @returns {boolean} 是否成功
 */
export function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);

    // 验证导入的数据
    if (typeof data !== 'object' || data === null) {
      console.error('导入失败：数据格式错误');
      return false;
    }

    // 验证 stats
    if (data.stats) {
      if (typeof data.stats !== 'object') {
        console.error('导入失败：stats 格式错误');
        return false;
      }
      if (typeof data.stats.games !== 'number' || data.stats.games < 0) data.stats.games = 0;
      if (typeof data.stats.wins !== 'number' || data.stats.wins < 0) data.stats.wins = 0;
      if (typeof data.stats.combo !== 'number' || data.stats.combo < 0) data.stats.combo = 0;
      if (typeof data.stats.totalMinesRevealed !== 'number' || data.stats.totalMinesRevealed < 0) {
        data.stats.totalMinesRevealed = 0;
      }
      if (!data.stats.bestTime || typeof data.stats.bestTime !== 'object') {
        data.stats.bestTime = { easy: null, medium: null, hard: null };
      }
    }

    // 验证 settings
    if (data.settings) {
      if (typeof data.settings !== 'object') {
        console.error('导入失败：settings 格式错误');
        return false;
      }
    }

    // 验证 achievements
    if (data.achievements) {
      if (typeof data.achievements !== 'object') {
        console.error('导入失败：achievements 格式错误');
        return false;
      }
    }

    // 验证 daily
    if (data.daily) {
      if (typeof data.daily !== 'object') {
        console.error('导入失败：daily 格式错误');
        return false;
      }
      if (typeof data.daily.attempts !== 'number' || data.daily.attempts < 0) {
        data.daily.attempts = 0;
      }
    }

    // 验证 adventure
    if (data.adventure) {
      if (typeof data.adventure !== 'object') {
        console.error('导入失败：adventure 格式错误');
        return false;
      }
    }

    // 验证通过后保存
    if (data.stats) saveStats(data.stats);
    if (data.adventure) saveAdventureProgress(data.adventure);
    if (data.daily) saveDailyProgress(data.daily);
    if (data.settings) saveSettings(data.settings);
    if (data.achievements) saveAchievements(data.achievements);
    return true;
  } catch (e) {
    console.error('导入数据失败:', e);
    return false;
  }
}

/**
 * 清除所有数据（重置）
 */
export function clearAllData() {
  try {
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.error('清除数据失败:', e);
  }
}

/**
 * 获取已使用的存储空间（字节）
 * @returns {number}
 */
export function getStorageSize() {
  let total = 0;
  for (const key of Object.values(KEYS)) {
    const item = localStorage.getItem(key);
    if (item) {
      total += item.length * 2; // UTF-16 encoding
    }
  }
  return total;
}

/**
 * 存储管理器对象（便于导入使用）
 */
export const StorageManager = {
  loadStats,
  saveStats,
  clearStats,
  loadAdventureProgress,
  saveAdventureProgress,
  loadDailyProgress,
  saveDailyProgress,
  loadSettings,
  saveSettings,
  loadAchievements,
  saveAchievements,
  exportData,
  importData,
  clearAllData,
  getStorageSize
};

export default StorageManager;
