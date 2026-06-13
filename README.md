# 扫雷增强版 v2.0

## 项目结构

```
扫雷/
├── index.html              # 主入口页面
├── src/
│   ├── favicon.svg          # 网站图标
│   ├── css/
│   │   ├── base.css        # 基础样式
│   │   ├── themes.css      # 主题系统（6种主题）
│   │   └── animations.css  # 动画效果
│   └── js/
│       ├── main.js         # 主入口模块
│       ├── game.js         # 核心游戏逻辑
│       ├── board.js        # 棋盘渲染
│       ├── powerups.js     # 道具系统
│       ├── adventure.js     # 冒险模式
│       ├── stats.js         # 统计+成就系统
│       ├── daily.js         # 每日挑战
│       ├── storage.js       # 本地存储
│       ├── audio.js         # Web Audio API音效
│       ├── particles.js     # 粒子效果系统
│       ├── utils.js         # 工具函数
│       └── tutorial.js      # 新手引导
├── doc/
│   └── improve.md           # 改进计划文档
└── README.md                # 本文件
```

## 功能特性

### 经典模式
- 初级/中级/高级三种难度
- 自定义难度
- 六边形模式
- 首次点击保护

### 道具系统（6种）
- 📡 声纳：显示地雷位置3秒
- 🔍 揭示：安全揭示一个格子
- 🚩 旗帜：自动标记一个地雷
- 🛡️ 护盾：抵挡一次伤害
- 💡 提示：高亮安全位置
- 💥 炸弹：清除3x3区域

### 冒险模式
- 8个关卡（含2个Boss关）
- 生命值系统
- 时间限制关卡
- 进度保存

### 每日挑战
- 基于日期的固定种子
- 每日3次尝试机会
- 连胜记录

### 统计与成就
- 游戏次数、胜率、最佳时间
- 连击记录
- 11种成就系统
- 数据导出/导入

### 视觉与交互
- 6种主题（经典、暗黑、海洋、森林、日落、紫色）
- 粒子效果系统
- Web Audio API音效
- 键盘快捷键（R重开/H提示/1-6道具/Esc取消）
- 新手引导教程

## 技术栈

- 纯原生 JavaScript（ES6+）
- CSS Variables 主题系统
- Web Audio API 音效合成
- Canvas 粒子效果
- localStorage 数据持久化
- ES6 Modules 模块化

## 运行方式

直接在浏览器中打开 `index.html` 即可。

由于使用了 ES6 Modules，建议通过本地服务器运行：

```bash
# 使用 Python 3
python -m http.server 8000

# 或使用 Node.js
npx serve .
```

然后访问 http://localhost:8000/

## 浏览器兼容性

- Chrome/Edge 60+
- Firefox 60+
- Safari 12+

## 改进记录

### v2.0 更新
1. ✅ 代码模块化重构（单HTML拆分为13个模块）
2. ✅ 补全所有缺失函数（声纳、揭示、旗帜、护盾、提示、炸弹等）
3. ✅ Web Audio API音效系统（12种音效）
4. ✅ 粒子效果系统（胜利庆祝、爆炸、连击火花等）
5. ✅ 成就系统（11种成就）
6. ✅ 键盘快捷键支持
7. ✅ 首次点击保护
8. ✅ Chord功能（快速揭开周围）
9. ✅ 数据导出/导入
10. ✅ 新手引导教程

## 许可证

MIT License
