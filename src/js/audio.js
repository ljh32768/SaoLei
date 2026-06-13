/**
 * 扫雷增强版 - Web Audio API 音效系统
 */

class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.gainNode = null;
    this._volume = 0.5;
    this._muted = false;
    this._initialized = false;
  }

  /**
   * 初始化音频上下文
   */
  init() {
    if (this._initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return;
      }

      this.audioCtx = new AudioContext();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this._volume;
      this.gainNode.connect(this.audioCtx.destination);
      this._initialized = true;
    } catch (e) {
      console.error('音频初始化失败:', e);
    }
  }

  /**
   * 确保音频上下文已初始化
   */
  _ensureInit() {
    if (!this._initialized) {
      this.init();
    }
    // 如果上下文被挂起（如页面后台），尝试恢复
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * 设置音量
   * @param {number} vol - 音量 0-1
   */
  setVolume(vol) {
    this._volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && !this._muted) {
      this.gainNode.gain.setValueAtTime(this._volume, this.audioCtx.currentTime);
    }
  }

  /**
   * 获取当前音量
   * @returns {number}
   */
  getVolume() {
    return this._volume;
  }

  /**
   * 静音
   */
  mute() {
    this._muted = true;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    }
  }

  /**
   * 取消静音
   */
  unmute() {
    this._muted = false;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this._volume, this.audioCtx.currentTime);
    }
  }

  /**
   * 切换静音状态
   */
  toggleMute() {
    if (this._muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /**
   * 获取是否静音
   * @returns {boolean}
   */
  isMuted() {
    return this._muted;
  }

  /**
   * 创建振荡器
   * @param {string} type - 波形类型
   * @param {number} frequency - 频率
   * @param {number} duration - 持续时间（秒）
   * @param {number} attack - 起音时间
   * @param {number} decay - 衰减时间
   */
  _playOscillator(type, frequency, duration, attack = 0.01, decay = 0.1) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + attack + decay);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);

    // 自动清理
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, duration * 1000 + 100);
  }

  /**
   * 播放白噪声
   * @param {number} duration - 持续时间
   * @param {number} filterFreq - 低通滤波器频率
   */
  _playNoise(duration, filterFreq = 1000) {
    if (!this.audioCtx) return;

    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    noise.start();
    noise.stop(this.audioCtx.currentTime + duration);
  }

  /**
   * 播放音效
   * @param {string} type - 音效类型
   */
  playSound(type) {
    this._ensureInit();
    if (!this.audioCtx || this._muted) return;

    switch (type) {
      case 'click':
        // 短促高频点击声
        this._playOscillator('square', 800, 0.05, 0.005, 0.04);
        break;

      case 'reveal':
        // 柔和揭示声
        this._playOscillator('sine', 400, 0.15, 0.02, 0.1);
        break;

      case 'flag':
        // 旗帜标记声
        this._playOscillator('square', 300, 0.08, 0.005, 0.05);
        break;

      case 'win':
        // 胜利欢快序列
        this._playVictorySequence();
        break;

      case 'lose':
        // 失败爆炸声
        this._playOscillator('sawtooth', 200, 0.3, 0.01, 0.25);
        this._playNoise(0.3, 200);
        break;

      case 'powerup':
        // 道具使用魔法音
        this._playOscillator('triangle', 500, 0.2, 0.02, 0.15);
        setTimeout(() => this._playOscillator('triangle', 800, 0.15, 0.02, 0.1), 50);
        break;

      case 'combo':
        // 连击上升音
        this._playComboSound();
        break;

      case 'shield':
        // 护盾保护声
        this._playOscillator('sine', 600, 0.15, 0.05, 0.08);
        break;

      case 'explosion':
        // 爆炸音效
        this._playNoise(0.4, 150);
        this._playOscillator('sawtooth', 100, 0.4, 0.01, 0.35);
        break;

      case 'hint':
        // 提示清脆声
        this._playOscillator('sine', 880, 0.1, 0.005, 0.08);
        break;

      case 'bomb':
        // 炸弹音效
        this._playNoise(0.5, 300);
        this._playOscillator('sawtooth', 80, 0.5, 0.05, 0.4);
        break;

      case 'pause':
        // 暂停音效
        this._playOscillator('sine', 300, 0.2, 0.02, 0.1);
        break;
      case 'resume':
        // 继续音效
        this._playOscillator('sine', 600, 0.2, 0.02, 0.1);
        break;
      case 'floodFill':
        // 连续揭示音效（快速）
        for (let i = 0; i < 3; i++) {
          this._playOscillator('square', 500 + i * 100, 0.07, 0.005, 0.05);
        }
        break;
      case 'chord':
        // chord快速揭开
        this._playOscillator('sine', 350, 0.08, 0.005, 0.05);
        break;

      case 'achievement':
        // 成就解锁
        this._playAchievementSound();
        break;

      case 'flag-mark':
        // 自动旗帜标记
        this._playOscillator('square', 350, 0.06, 0.005, 0.04);
        break;

      case 'drop':
        // 道具掉落
        this._playOscillator('sine', 600, 0.1, 0.02, 0.06);
        setTimeout(() => this._playOscillator('sine', 400, 0.1, 0.02, 0.06), 50);
        break;
    }
  }

  /**
   * 播放胜利序列
   */
  _playVictorySequence() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    let delay = 0;
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._playOscillator('sine', freq, 0.12, 0.01, 0.1);
      }, delay);
      delay += 100;
    });
  }

  /**
   * 播放连击音效（根据连击等级）
   */
  _playComboSound() {
    const baseFreq = 400;
    const freqs = [baseFreq, baseFreq * 1.2, baseFreq * 1.5, baseFreq * 2];
    let delay = 0;
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        this._playOscillator('square', freq, 0.08, 0.005, 0.05);
      }, delay);
      delay += 50;
    });
  }

  /**
   * 播放成就解锁音效
   */
  _playAchievementSound() {
    const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
    let delay = 0;
    notes.forEach((freq) => {
      setTimeout(() => {
        this._playOscillator('triangle', freq, 0.15, 0.02, 0.1);
      }, delay);
      delay += 120;
    });
  }
}

// 导出单例
export const audioManager = new AudioManager();
export default audioManager;

// 也导出类以便需要时创建新实例
export { AudioManager };
