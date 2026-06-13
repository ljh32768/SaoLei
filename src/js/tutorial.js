/**
 * 扫雷增强版 - 新手引导教程
 */

import * as StorageManager from './storage.js';

export const TutorialManager = {
  currentStep: 0,
  overlay: null,
  panel: null,
  isActive: false,

  TUTORIAL_STEPS: [
    { id: 1, title: '欢迎来到扫雷增强版！', content: '这是一个增强版的扫雷游戏，包含道具系统、冒险模式和每日挑战。', action: 'next' },
    { id: 2, title: '基本操作', content: '左键点击格子揭开，右键点击标记旗帜（紫色背景）。数字表示周围地雷数量。', action: 'next' },
    { id: 3, title: '首次点击保护', content: '第一次点击永远不会踩到地雷，所以放心大胆地开始吧！', action: 'next' },
    { id: 4, title: '道具系统', content: '游戏中有6种道具：声纳(雷达)、揭示(安全格子)、旗帜(自动标记)、护盾(保护)、提示(引导)、炸弹(清除)。双击道具按钮使用。', action: 'next' },
    { id: 5, title: '连击系统', content: '连续揭开多个格子会触发连击！3个格子=1连击，连击时有概率获得道具掉落。', action: 'next' },
    { id: 6, title: '冒险模式', content: '冒险模式有8个关卡，包含2个Boss关卡。每关有生命值限制，失败会扣血。通关解锁成就！', action: 'next' },
    { id: 7, title: '每日挑战', content: '每天有一个固定布局的挑战，全球玩家面对相同谜题。每天3次机会，连续完成记录连胜！', action: 'next' },
    { id: 8, title: '键盘快捷键', content: 'R重新开始、H使用提示、1-6选择道具、Esc取消道具选择。', action: 'next' },
    { id: 9, title: '开始游戏吧！', content: '准备好开始你的扫雷之旅了吗？点击下方按钮开始！', action: 'startGame' }
  ],

  /**
   * 检查是否应该显示教程
   * @returns {boolean}
   */
  shouldShowTutorial() {
    const settings = StorageManager.loadSettings();
    return !settings.tutorialCompleted;
  },

  /**
   * 开始教程
   */
  startTutorial() {
    if (this.isActive) return;
    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
  },

  /**
   * 创建覆盖层
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    document.body.appendChild(this.overlay);
  },

  /**
   * 显示步骤
   * @param {number} stepIndex - 步骤索引
   */
  showStep(stepIndex) {
    if (stepIndex >= this.TUTORIAL_STEPS.length) {
      this.endTutorial();
      return;
    }

    this.currentStep = stepIndex;
    const step = this.TUTORIAL_STEPS[stepIndex];

    // 移除旧面板
    if (this.panel) {
      this.panel.remove();
    }

    // 创建新面板
    this.panel = document.createElement('div');
    this.panel.className = 'tutorial-panel';
    this.panel.innerHTML = `
      <div class="tutorial-title">${step.title}</div>
      <div class="tutorial-content">${step.content}</div>
      <div class="tutorial-buttons">
        ${stepIndex > 0 ? '<button class="tutorial-btn tutorial-prev">上一步</button>' : ''}
        <button class="tutorial-btn tutorial-skip">跳过教程</button>
        ${step.action === 'startGame'
          ? '<button class="tutorial-btn tutorial-start">开始游戏</button>'
          : '<button class="tutorial-btn tutorial-next">下一步</button>'
        }
      </div>
    `;

    // 绑定按钮事件
    this.panel.querySelector('.tutorial-skip')?.addEventListener('click', () => this.skipTutorial());
    this.panel.querySelector('.tutorial-next')?.addEventListener('click', () => this.nextStep());
    this.panel.querySelector('.tutorial-prev')?.addEventListener('click', () => this.prevStep());
    this.panel.querySelector('.tutorial-start')?.addEventListener('click', () => this.startGame());

    this.overlay.appendChild(this.panel);

    // 高亮相关元素
    this.highlightElements(step.action);
  },

  /**
   * 下一步
   */
  nextStep() {
    this.showStep(this.currentStep + 1);
  },

  /**
   * 上一步
   */
  prevStep() {
    this.showStep(this.currentStep - 1);
  },

  /**
   * 跳过教程
   */
  skipTutorial() {
    this.markTutorialCompleted();
    this.endTutorial();
  },

  /**
   * 开始游戏
   */
  startGame() {
    this.markTutorialCompleted();
    this.endTutorial();
    // 切换到经典模式标签
    document.querySelector('[data-tab="classic"]')?.click();
  },

  /**
   * 标记教程已完成
   */
  markTutorialCompleted() {
    const settings = StorageManager.loadSettings();
    settings.tutorialCompleted = true;
    StorageManager.saveSettings(settings);
  },

  /**
   * 结束教程
   */
  endTutorial() {
    this.isActive = false;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.removeHighlights();
  },

  /**
   * 高亮元素
   * @param {string} action - 动作类型
   */
  highlightElements(action) {
    this.removeHighlights();

    switch (action) {
      case 'showPowerups':
        document.getElementById('powerupBar')?.classList.add('tutorial-highlight');
        break;
      case 'showAdventureTab':
        document.querySelector('.app-header')?.classList.add('tutorial-highlight');
        break;
      case 'showDailyTab':
        document.querySelector('.app-header')?.classList.add('tutorial-highlight');
        break;
      case 'startGame':
        document.querySelector('.board-wrapper')?.classList.add('tutorial-highlight');
        break;
    }
  },

  /**
   * 移除高亮
   */
  removeHighlights() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }
};

export default TutorialManager;
