/**
 * 扫雷增强版 - 粒子效果系统
 */

export const ParticleManager = {
  canvas: null,
  ctx: null,
  particles: [],
  animating: false,
  container: null,

  /**
   * 初始化
   * @param {HTMLElement} container - 容器元素
   */
  init(container) {
    this.container = container;

    // 查找或创建canvas
    this.canvas = document.getElementById('particleCanvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'particleCanvas';
      this.canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:10;';
      if (container) container.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    // 监听容器大小变化
    window.addEventListener('resize', () => this.resize());
  },

  /**
   * 调整画布大小
   */
  resize() {
    if (!this.container || !this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  },

  /**
   * 创建粒子
   * @param {object} options - 粒子选项
   */
  createParticle(options) {
    const defaults = {
      x: 0, y: 0,
      vx: 0, vy: 0,
      size: 5,
      color: '#ffffff',
      life: 60,
      initialLife: 60,  // 记录初始生命周期，用于正确计算alpha
      gravity: 0.15,
      friction: 0.98,
      type: 'circle',
      rotation: 0,
      rotationSpeed: 0
    };
    const particle = { ...defaults, ...options };
    // 如果options中指定了life，更新initialLife
    if (options.life !== undefined) {
      particle.initialLife = options.life;
    }
    this.particles.push(particle);
  },

  /**
   * 动画循环
   */
  animate() {
    if (!this.animating || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 更新和绘制粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // 更新位置
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.rotationSpeed) p.rotation += p.rotationSpeed;

      // 绘制
      this.drawParticle(p);

      // 移除死亡粒子
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 继续动画
    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.animating = false;
    }
  },

  /**
   * 绘制单个粒子
   * @param {object} p - 粒子
   */
  drawParticle(p) {
    // 使用粒子的初始life计算alpha，避免life不是60时alpha值异常
    const initialLife = p.initialLife || p.life || 60;
    const alpha = Math.max(0, Math.min(1, p.life / initialLife));

    switch (p.type) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.hexToRgba(p.color, alpha);
        this.ctx.fill();
        break;

      case 'star':
        this.drawStar(p.x, p.y, p.size, alpha);
        break;

      case 'rect':
        this.ctx.fillStyle = this.hexToRgba(p.color, alpha);
        this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        break;

      case 'confetti':
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation || 0);
        this.ctx.fillStyle = this.hexToRgba(p.color, alpha);
        this.ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
        this.ctx.restore();
        break;
    }
  },

  /**
   * 绘制星星
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} size - 大小
   * @param {number} alpha - 透明度
   */
  drawStar(x, y, size, alpha) {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.hexToRgba('#ffcc00', alpha);

    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fill();
  },

  /**
   * 十六进制颜色转RGBA
   * @param {string} hex - 十六进制颜色
   * @param {number} alpha - 透明度
   * @returns {string}
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * 启动动画
   */
  startAnimation() {
    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  },

  /**
   * 胜利庆祝
   * @param {number} count - 粒子数量
   */
  celebrate(count = 50) {
    if (!this.canvas) return;

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#e94560'];
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;

      this.createParticle({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 40 + Math.random() * 40,
        gravity: 0.2,
        type: Math.random() > 0.5 ? 'confetti' : 'circle',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    this.startAnimation();
  },

  /**
   * 爆炸效果
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} count - 粒子数量
   */
  explode(x, y, count = 30) {
    if (!this.canvas) return;

    const colors = ['#e94560', '#ff7043', '#ff5722', '#795548', '#9e9e9e'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;

      this.createParticle({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 30 + Math.random() * 30,
        gravity: 0.3,
        friction: 0.95,
        type: 'rect'
      });
    }

    this.startAnimation();
  },

  /**
   * 连击火花
   * @param {number} level - 连击等级
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  comboEffect(level, x, y) {
    if (!this.canvas) return;

    const count = level * 5;
    const colors = ['#ffcc00', '#ff9500', '#ff6b00'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;

      this.createParticle({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 20 + Math.random() * 20,
        gravity: 0.1,
        friction: 0.95,
        type: 'circle'
      });
    }

    this.startAnimation();
  },

  /**
   * 道具特效
   * @param {string} type - 道具类型
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  powerupEffect(type, x, y) {
    if (!this.canvas) return;

    const effects = {
      sonar: () => this._sonarEffect(x, y),
      reveal: () => this._revealEffect(x, y),
      flag: () => this._flagEffect(x, y),
      shield: () => this._shieldEffect(x, y),
      hint: () => this._hintEffect(x, y),
      bomb: () => this._bombEffect(x, y)
    };

    if (effects[type]) effects[type]();
  },

  _sonarEffect(x, y) {
    // 声纳波纹效果
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createParticle({
          x, y,
          vx: 0, vy: 0,
          size: 10 + i * 20,
          color: '#e94560',
          life: 30,
          gravity: 0,
          type: 'circle'
        });
      }, i * 200);
    }
    this.startAnimation();
  },

  _revealEffect(x, y) {
    this.createParticle({
      x, y,
      vx: 0, vy: -2,
      size: 15,
      color: '#4fc3f7',
      life: 40,
      gravity: 0,
      type: 'circle'
    });
    this.startAnimation();
  },

  _flagEffect(x, y) {
    this.createParticle({
      x, y,
      vx: 0, vy: -1,
      size: 12,
      color: '#e94560',
      life: 25,
      gravity: 0,
      type: 'rect'
    });
    this.startAnimation();
  },

  _shieldEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.createParticle({
        x: x + Math.cos(angle) * 20,
        y: y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        size: 5,
        color: '#4fc3f7',
        life: 30,
        gravity: 0,
        type: 'circle'
      });
    }
    this.startAnimation();
  },

  _hintEffect(x, y) {
    this.createParticle({
      x, y,
      vx: 0, vy: 0,
      size: 20,
      color: '#ffeb3b',
      life: 20,
      gravity: 0,
      type: 'circle'
    });
    this.startAnimation();
  },

  _bombEffect(x, y) {
    // 爆炸效果
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 5;
      this.createParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: ['#ff6b35', '#ffcc00', '#ff5722', '#9e9e9e'][Math.floor(Math.random() * 4)],
        life: 40,
        gravity: 0.2,
        friction: 0.95,
        type: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }
    this.startAnimation();
  },

  /**
   * 清除所有粒子
   */
  clear() {
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  /**
   * 销毁
   */
  destroy() {
    this.clear();
    this.animating = false;
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }
};

export default ParticleManager;
