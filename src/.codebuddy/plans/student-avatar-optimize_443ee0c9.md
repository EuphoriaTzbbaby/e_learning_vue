---
name: student-avatar-optimize
overview: 对学生布局头像区域综合优化：加大头像+光晕边框、在线状态绿点、悬停动画、卡片式重设计，适配暗色模式
design:
  styleKeywords:
    - Glassmorphism
    - Micro-interaction
    - Neon Glow
    - Capsule Card
    - Breathing Animation
  fontSystem:
    fontFamily: "-apple-system, BlinkMacSystemFont"
    heading:
      size: 14px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#409EFF"
      - "#66B1FF"
      - "#79BBFF"
    background:
      - rgba(255,255,255,0.12)
      - rgba(255,255,255,0.20)
    text:
      - "#FFFFFF"
      - rgba(255,255,255,0.75)
    functional:
      - "#52C41A"
      - "#FFFFFF"
      - rgba(64,158,255,0.45)
todos:
  - id: refactor-avatar-template
    content: 重构头像区域模板：替换el-avatar为avatar-wrapper结构，添加在线状态点和文字容器
    status: completed
  - id: rewrite-avatar-styles
    content: 重写全套CSS：胶囊毛玻璃卡片、光晕边框、悬停缩放旋转动画、呼吸灯关键帧
    status: completed
    dependencies:
      - refactor-avatar-template
  - id: add-dark-mode-styles
    content: 在App.vue补充所有新增头像元素的html.dark暗色模式样式
    status: completed
    dependencies:
      - rewrite-avatar-styles
---

## Product Overview

对 StudentLayout.vue 顶部导航栏右侧的头像区域进行综合视觉优化，打造精致、现代化的用户信息展示与交互区域。

## Core Features

- **头像加大 + 光晕边框**：头像从 `size="small"` (24px) 升级到 36px，添加圆形渐变光晕边框效果（蓝色主题色发光），提升视觉层次感
- **在线状态指示器**：头像右下角添加绿色呼吸光点，表示在线状态
- **悬停动画**：鼠标悬停时头像放大(scale 1.08) + 轻微旋转(3deg) + 光晕增强的微交互动画，过渡平滑自然
- **卡片式重新设计**：将 `.user-trigger` 从简单的圆角条改为精致的毛玻璃/半透明胶囊卡片风格，包含头像容器、用户名、下拉箭头
- **暗色模式适配**：在 App.vue 中为所有新增样式添加 `html.dark` 兼容

## Tech Stack

- Vue 3 + TypeScript + Element Plus (`el-dropdown`)
- 纯 CSS 实现（scoped 样式 + App.vue 全局暗色模式覆盖）
- CSS 动画：`transition`, `transform: scale()/rotate()`, `box-shadow` 光晕, `@keyframes` 呼吸灯动画

## Implementation Approach

纯 CSS 重构 + 模板微调。不引入新依赖，完全基于现有技术栈通过模板结构调整和 CSS 样式增强实现。

### 关键技术决策：

1. **放弃 el-avatar 的自定义限制**：el-avatar 的 size prop 难以精确控制光晕和状态点定位，改用原生 `<img>` 包裹在自定义 `.avatar-wrapper` 中获得完全样式控制权
2. **CSS 变量统一主题色**：光晕颜色使用 header 一致的 `#409eff` 蓝色系
3. **GPU 加速动画**：全部使用 transform/opacity 做动画避免触发 layout/paint；呼吸动画仅作用于 box-shadow 和 opacity

### 数据流不变

currentUser / userAvatar / username 来源不变，无需修改 script 逻辑

## Implementation Notes

- **修改范围控制**：仅修改 StudentLayout.vue 模板第28-40行和样式第294-315行区域，以及 App.vue 新增暗色样式
- **el-avatar 替换为 img**：用 `<img :src="userAvatar" />` + `.avatar-wrapper` 容器替代 el-avatar，确保光晕环和状态点精确定位
- **header 高度兼容**：header height=60px，优化后头像区域总高度控制在 44px 以内（36px 头像 + padding），不撑开 header
- **下拉菜单保持不变**：el-dropdown 及 dropdown-menu 不改，只美化 trigger 部分

## Architecture Design

### 文件变更清单

```
src/
├── layouts/
│   └── StudentLayout.vue    # [MODIFY] 头像区域模板重构 + 样式全面升级
└── App.vue                  # [MODIFY] 新增头像相关暗色模式全局样式覆盖
```

### 组件结构变化（头像区域）

```
修改前:
.el-dropdown > span.user-trigger
  └─ el-avatar(size="small")
  └─ span.username
  └─ el-icon(ArrowDown)

修改后:
.el-dropdown > div.user-trigger (胶囊卡片)
  └─ div.avatar-wrapper (相对定位容器)
      ├─ img.avatar-img (36px 圆形头像)
      └─ span.online-status (绝对定位 绿色呼吸点)
  └─ div.user-info-text
      ├─ span.username
      └─ el-icon(ArrowDown)
```

采用现代 Glassmorphism（玻璃拟态）+ 微交互设计语言，与现有蓝色主题 header 协调统一。头像区域升级为具有层次感的胶囊卡片，通过光影、动效传递精致感。

仅涉及 StudentLayout.vue 顶部导航栏右上角的用户头像触发器区块。

### Block 1: 头像容器 (.avatar-wrapper)

36x36px 圆形容器 position:relative。内层 img 圆形 object-fit:cover，带 2px 渐变蓝边框(#409eff→#66b1ff)。外层 box-shadow 扩散发光 rgba(64,158,255,0.45)，hover 时增强。右下角 10x10px 绿点(#52c41a)白色描边2px，@keyframes pulse 2s 呼吸动画。

### Block 2: 用户信息文字 (.user-info-text)

font-weight 600 / 14px / #fff / max-width 90px 省略。ArrowDown 图标 12px / rgba(255,255,255,0.75) / margin-left 4px / hover rotate 180°。

### Block 3: 整体触发器 (.user-trigger)

flex + gap:10px + padding:6px 16px。背景 rgba(255,255,255,0.12) + backdrop-filter:blur(8px) 毛玻璃。border-radius:24px 大胶囊 + border 1px rgba(255,255,255,0.18)。hover 时 background 提升至 0.2；img scale(1.08) rotate(3deg)；光晕扩大增强。全局 transition 0.35s cubic-bezier(0.4,0,0.2,1)。