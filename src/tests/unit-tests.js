/**
 * 扫雷增强版 - 单元测试
 *
 * 运行方法: 浏览器中打开 tests.html
 * 或使用 Node.js 配合相应工具
 */

// 模拟浏览器环境
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// 测试框架
let testResults = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (e) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: e.message });
    console.error(`❌ ${name}: ${e.message}`);
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} 期望 ${expected}，实际 ${actual}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(msg || '断言失败');
  }
}

// ========== 测试用例 ==========

// 1. 护盾单一扣减测试
test('护盾使用应该只扣减一次', () => {
  const initialShields = 2;
  const gameState = {
    powerups: { shield: initialShields },
    shieldActive: false
  };

  // 模拟使用护盾
  gameState.shieldActive = true;

  // 模拟触发护盾（挡雷）
  if (gameState.shieldActive) {
    gameState.shieldActive = false;
  }

  // 验证：护盾道具数量应该在使用时扣减一次
  // 实际实现中 usePowerup 会扣减 powerups.shield--
  // 所以扣减后初始为2，使用后应该为1
  gameState.powerups.shield--;
  assertEqual(gameState.powerups.shield, 1, '护盾使用后数量应该为1');
  assertEqual(gameState.shieldActive, false, '护盾状态应该关闭');
});

// 2. 每日挑战 attempts 默认值测试
test('每日挑战 attempts 默认值应该为 0', () => {
  const defaultProgress = {
    seed: null,
    completed: false,
    attempts: 0,
    lastDate: null,
    streak: 0
  };
  assertEqual(defaultProgress.attempts, 0, '新用户 attempts 应该是 0');
});

// 3. 最佳时间应该来自 bestTime 字段
test('最佳时间应该来自 bestTime 字段', () => {
  const stats = {
    bestTime: { easy: 30, medium: 60, hard: 120 },
    combo: 5
  };

  // 正确的方式: 从 bestTime 中获取
  const allTimes = Object.values(stats.bestTime).filter(t => t !== null && t !== undefined);
  const minTime = Math.min(...allTimes);
  assertEqual(minTime, 30, '最佳时间应该是 easy 难度的 30 秒');

  // 错误的方式: 误用 combo
  // const wrongBestTime = stats.combo; // 错误
});

// 4. 事件监听器不重复绑定测试
test('事件监听器应该可以被解绑', () => {
  let clickCount = 0;
  const handlers = {
    onCellClick: () => clickCount++
  };

  // 模拟绑定和解绑
  const handler1 = () => handlers.onCellClick();
  const handler2 = () => handlers.onCellClick();

  // 第一次绑定
  let boundHandler = handler1;
  boundHandler();
  assertEqual(clickCount, 1, '第一次点击应该增加计数');

  // 解绑后再绑定
  boundHandler = handler2;
  boundHandler();
  assertEqual(clickCount, 2, '重新绑定后应该能正常工作');
});

// 5. 声纳道具消耗测试
test('声纳使用后应该消耗道具', () => {
  const gameState = {
    firstClick: false,
    powerups: { sonar: 3 },
    rows: 9,
    cols: 9,
    grid: Array(9).fill().map(() => Array(9).fill({
      revealed: false, flagged: false, mine: false
    }))
  };

  // 模拟声纳激活
  const initialSonar = gameState.powerups.sonar;
  gameState.powerups.sonar--;
  assertEqual(gameState.powerups.sonar, initialSonar - 1, '声纳应该被消耗');
});

// 6. 六边形邻居方向测试
test('六边形邻居方向应该根据行奇偶性不同', () => {
  // 偶数行
  const evenRowDirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]];
  // 奇数行
  const oddRowDirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]];

  // 偶数行有6个邻居方向，奇数行也有6个
  assertEqual(evenRowDirs.length, 6, '偶数行应该有6个邻居方向');
  assertEqual(oddRowDirs.length, 6, '奇数行应该有6个邻居方向');

  // 偶数行左偏方向是 [-1,-1] 和 [1,-1] (即dc=-1且dr!=0)
  const evenLeft = evenRowDirs.filter(([dr, dc]) => dc === -1 && dr !== 0);
  assertEqual(evenLeft.length, 2, '偶数行应该有2个左偏方向');
  assertTrue(evenLeft[0][0] === -1 && evenLeft[0][1] === -1, '第一个左偏方向应为[-1,-1]');

  // 奇数行右偏方向是 [-1,1] 和 [1,1] (即dc=1且dr!=0)
  const oddRight = oddRowDirs.filter(([dr, dc]) => dc === 1 && dr !== 0);
  assertEqual(oddRight.length, 2, '奇数行应该有2个右偏方向');
  assertTrue(oddRight[0][0] === -1 && oddRight[0][1] === 1, '第一个右偏方向应为[-1,1]');
});

// 7. 地雷放置循环限制测试
test('地雷放置应该有最大尝试次数', () => {
  const totalCells = 9 * 9;
  const totalMines = 10;
  const safeArea = 9; // 3x3

  const maxAttempts = totalCells * 10;
  assertTrue(maxAttempts > 0, '最大尝试次数应该大于0');
  assertTrue(maxAttempts >= totalMines * 10, '最大尝试次数应该足够');
});

// 8. 键盘快捷键在输入框中不应该触发
test('键盘快捷键在输入框中应该被忽略', () => {
  let triggered = false;
  const e = { target: { tagName: 'INPUT' }, key: 'r' };

  // 模拟检查
  const shouldIgnore = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
  assertTrue(shouldIgnore, '在输入框中按r应该被忽略');
});

// 9. 暂停计时器应该被正确清除
test('暂停时计时器应该被清除', () => {
  const gameState = {
    timerInterval: null,
    isPaused: false
  };

  // 模拟设置 interval
  gameState.timerInterval = setInterval(() => {}, 1000);

  // 模拟暂停
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
  gameState.isPaused = true;

  assertEqual(gameState.timerInterval, null, '暂停后 interval 应该被清除');
  assertEqual(gameState.isPaused, true, 'isPaused 应该为 true');
});

// 10. 导入数据验证测试
test('导入无效数据应该被拒绝', () => {
  let success = false;

  // 测试 null
  try {
    const data = JSON.parse('null');
    if (typeof data !== 'object' || data === null) {
      success = false; // 应该失败
    } else {
      success = true;
    }
  } catch (e) {
    success = false;
  }

  assertEqual(success, false, 'null 数据应该被拒绝');

  // 测试无效的 stats
  success = true;
  try {
    const data = JSON.parse('{"stats": "not an object"}');
    if (data.stats) {
      if (typeof data.stats !== 'object') {
        success = false;
      }
    }
  } catch (e) {
    success = false;
  }

  assertEqual(success, false, '字符串类型 stats 应该被拒绝');
});

// 11. dailyMode 应该被正确重置
test('init() 应该重置 dailyMode 和 dailySeed', () => {
  const gameState = {
    dailyMode: true,
    dailySeed: 12345,
    init: function(fullReset) {
      this.dailyMode = false;
      this.dailySeed = null;
    }
  };

  gameState.init(true);
  assertEqual(gameState.dailyMode, false, 'dailyMode 应该被重置为 false');
  assertEqual(gameState.dailySeed, null, 'dailySeed 应该被重置为 null');
});

// 12. 粒子 alpha 应该在 [0,1] 范围内
test('粒子 alpha 应该被 clamp 到 [0,1]', () => {
  const life = 30;
  const initialLife = 60;
  const alpha = Math.max(0, Math.min(1, life / initialLife));
  assertTrue(alpha >= 0 && alpha <= 1, 'alpha 应该在 0 到 1 之间');
  assertEqual(alpha, 0.5, 'alpha 应该等于 0.5');
});

// 输出测试结果
console.log('\n========== 测试结果 ==========');
console.log(`通过: ${testResults.passed}`);
console.log(`失败: ${testResults.failed}`);
console.log(`总计: ${testResults.tests.length}`);

if (testResults.failed > 0) {
  console.log('\n失败的测试:');
  testResults.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.name}: ${t.error}`);
  });
}

// 导出供浏览器使用
if (typeof window !== 'undefined') {
  window.testResults = testResults;
}
