# 个人站设计规则

状态：v0.5（2026-10-28）。Phase 0 守卫、Phase 1 原子控件、Phase 2 字号阶梯、Phase 3 CI 加固、v0.5 交互层（卡片浮空、输入焦点、滚动渐隐、骨架扫光、筛选滑块）已落地；分支保护与视觉回归仍需外部配置或后续迭代。

本表是规则 ID 的唯一登记处：规则从这里派生；令牌值以 [globals.css](../../src/app/globals.css) 为准，行为以 [frontend-refactor-spec.md](../frontend-refactor-spec.md) 为准，结构以 [frontend-architecture.md](../frontend-architecture.md) 为准。

- 行为约定：[frontend-refactor-spec.md](../frontend-refactor-spec.md)
- 结构约定：[frontend-architecture.md](../frontend-architecture.md)
- 参考：Claude Design System 逆向分析手册（外部仓库 `Caho1/open-claude-ui` 的 `docs/v1`；本仓库不内置该目录）。数值默认直接采用；只有与本站字号、色板、控件尺寸绑定的部分改写，并在“决定”列注明。

## 使用方式

- 每条规则有 ID、依据、执行方式、决定。
- 执行方式：`令牌` / `check:design` / `test:ui` / `e2e` / `评审`。
- 新增或修改 UI 必须引用规则 ID；CI 失败信息引用 ID。
- 偏离规则必须在“决策台账”写明理由；默认答案是改代码，不是改规则。

## 一、视觉与排版

| ID      | 规则                                                                                                                     | 依据                              | 执行                  | 决定                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| VIS-01  | 画布 / 卡片 / 浮层用 3–4 级亮度差区分；卡片不叠阴影，浮层才用阴影                                                        | CDS 01 §1.2/1.4                   | 令牌 + 评审           | 采用层级语法，色值用本站暖色                                             |
| VIS-02  | 默认 1px 低对比 alpha 边框；高分屏 0.5px 发丝线；同一容器不套第二层边框                                                  | CDS 01 §1.4                       | 评审 + `check:design` | 采用                                                                     |
| VIS-03  | 单一强调色 + base / hover / soft 三态；只用于交互、焦点、关键信息                                                        | CDS 01 §1.2                       | 令牌                  | 采用结构，色值用 `#c2431f` / `#ed9478`                                   |
| VIS-04  | 圆角按控件尺寸分级；嵌套圆角 = 外圆角 − 内边距                                                                           | CDS 01 §1.3                       | 令牌 + 评审           | **直接采用原值**：2 / 4 / 6 / 8 / 10 / 12 / 16 / 18 / 20 / 24px，见 §5.1 |
| VIS-05  | 焦点必须可见；1x 屏 2px、2x+ 屏 1.5px 强调色环 + 柔光；焦点环对比 ≥3:1；全局 ring + 容器例外                             | CDS 01 §1.3.2/1.4.5 + WCAG 2.4.13 | axe + `test:ui`       | **调整后采用**，见 §5.2 / §5.2b                                          |
| VIS-06  | 卡片悬停上浮 1.5% Y / 0.5% X；只在不减动态且有 hover 的设备生效；键盘焦点同态；不加光晕或额外表面                        | CDS 02 §2.6                       | 评审 + `test:ui`      | **调整后采用**：只保留上浮，去掉暖色微光，不用 3D 透视                   |
| VIS-07  | 筛选列表的活动项用共享 `layoutId` 滑动胶囊；200ms 内完成位移；减动态直接切换                                             | CDS 01 §2.2                       | 评审                  | 采用；仅用于 Categories / Tags 这类短列表                                |
| TYPE-01 | 7 阶字号阶梯 + 卡片标题例外；字号照搬，CJK 行高例外：会话 14/24、文章 16/28、卡片标题 16/24；正文不用 mono，meta 用 mono | CDS 01 §1.5 + CJK 阅读            | 令牌 + `test:ui`      | **调整后采用**，见 §5.3                                                  |
| TYPE-02 | 间距由行高推导：段落 0.75×、条目 0.5×、区块 2–3×；禁止零散 magic number                                                  | CDS 03 §3.1                       | 令牌 + 评审           | 采用公式；会话区输出 18px / 12px，区块仍用 2–3×                          |

## 二、动效与状态

| ID       | 规则                                                                                                                    | 依据              | 执行                  | 决定                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------- | ------------------------------------------------------------- |
| MOT-01   | snap 120ms / base 200ms / sheet 300ms / settle 450ms；循环骨架 1600ms / 等待 1900ms / 流式光标 1400ms；同类交互同一角色 | CDS 04 / 08       | `check:design` + 评审 | 直接采用原值                                                  |
| MOT-02   | 固定 5–6 条缓动曲线（enter / out / snap / overshoot / pulse）；禁止手写新曲线                                           | CDS 04            | 令牌 + `check:design` | 直接采用原值                                                  |
| MOT-03   | 动效可打断；状态切换从当前值出发；新事件抢占旧动画，不排队重播                                                          | CDS 04 + Bot 规则 | 评审 + 单测           | 采用                                                          |
| MOT-04   | 减动态下内容与状态含义保留，只停装饰；每个无限动画有静态回退                                                            | WCAG + CDS 04     | `test:ui`             | 采用                                                          |
| STATE-01 | 空 / 加载 / 流式 / 错 / 完成五态成套，各有文案、视觉、aria                                                              | CDS 03            | e2e fixture + 评审    | 采用；现有 loading / streaming / error / complete，空会话待补 |
| STATE-02 | 等待态安静、非进度型；三点 1.9s（延迟 0.15 / 0.3s）；不显示百分比或进度环                                               | CDS 03 §3.2.1     | 评审 + `test:ui`      | 直接采用原值                                                  |
| STATE-03 | 骨架屏 105° 非线性扫光 1.6s；减动态隐藏扫光，保留静态占位块                                                             | CDS v2 §3.5       | `test:ui` + 评审      | 采用                                                          |

候选：**STATE-04** 复制/保存反馈 2.5s 衰减，同一操作不重复播报；可直接并进 STATE-02。

## 三、输入、滚动与可访问性

| ID      | 规则                                                                                                       | 依据                   | 执行             | 决定                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------- | ---------------------------------------------------- |
| INT-01  | 输入法守卫：`isComposing` / `keyCode 229` / `compositionend` 后 500ms 假回车；Enter 提交，Shift+Enter 换行 | CDS 03 §3.3.2          | 单测 + 评审      | 直接采用原值                                         |
| INT-02  | 自动跟随：40px 容差 + 150ms 用户滚动冷却；用户上滚后不抢视口                                               | CDS 06 §6.4            | 单测 / e2e       | 直接采用原值                                         |
| INT-03  | 可滚动方向 28px、7 档非线性渐隐；不可滚动时不显示                                                          | CDS 04 §4.3            | `test:ui` + 评审 | 直接采用原值；用背景色叠层实现，避免 mask 裁掉焦点环 |
| INT-04  | 正文 / 代码 / 表格各自内部滚动；320px 无整页横向滚动；长链接与行内代码可换行                               | 需求约定 + CDS 06 §6.5 | `test:ui`        | 采用（已有部分）                                     |
| INT-06  | 搜索框清除用站内图标按钮，有可访问名称，点击后焦点回到输入框；隐藏浏览器原生 search cancel                 | 用户反馈               | `test:ui`        | 采用                                                 |
| A11Y-01 | 所有交互元素有可访问名称与可见焦点；图标按钮必须有 `aria-label`；键盘顺序 = 视觉顺序                       | WCAG + CDS 08          | axe + e2e        | 采用                                                 |
| A11Y-02 | 正文 4.5:1，大字/图形 3:1；暗色不用纯黑/纯白；颜色不是唯一信息载体                                         | WCAG                   | axe + 评审       | 采用                                                 |

候选：**INT-05** 网格方向键漫游 + Home/End；先作为 A11Y-01 的子项，主题卡改动时升级为正式规则。

## 四、工程

| ID     | 规则                                                                     | 依据             | 执行                    | 决定                                                                  |
| ------ | ------------------------------------------------------------------------ | ---------------- | ----------------------- | --------------------------------------------------------------------- |
| ENG-01 | 颜色 / 间距 / 圆角 / 时长只能来自语义令牌；每条规则有 ID，CI 失败引用 ID | CDS 07/08 + 架构 | `check:design` + ESLint | 采用；颜色、未定义变量、任意圆角及任意/裸时长与缓动已自动化，间距待补 |

---

## 五、照搬值落地映射

### 5.1 圆角

直接采用 Claude 的阶梯：

| 令牌                | 值    | 用途                         |
| ------------------- | ----- | ---------------------------- |
| `--radius-xs`       | 2px   | 微型角标、焦点环内衬         |
| `--radius-sm`       | 4px   | 键帽、微标签、气泡聚合角     |
| `--radius-md`       | 6px   | 极小按钮、Prompt 胶囊        |
| `--radius-lg`       | 8px   | 标准按钮、表单输入框、下拉项 |
| `--radius-panel`    | 10px  | 子面板、附件条目、浮层       |
| `--radius-xl`       | 12px  | 代码块、卡片、抽屉           |
| `--radius-bubble`   | 18px  | 用户消息气泡                 |
| `--radius-composer` | 20px  | 底部输入框                   |
| `--radius-pill`     | 999px | 分段滑块、状态点             |

只保留已落地的阶梯；未使用的 16px / 24px 令牌已移除，出现模态框等新场景时再按语义补回。

**迁移影响**：现有 `--radius-sm/md/lg/xl` 的像素会整体下移一档（`md` 8→6、`lg` 12→8、`xl` 14→12）。不要只替换令牌值就结束——按组件语义重新选类名，例如标准按钮需要 8px 时用 `rounded-lg`，而不是继续用 `rounded-md`。

本站组件映射：

- 输入框：`rounded-[20px]`；
- 用户气泡：`rounded-[18px] rounded-br-[4px]`；
- 卡片 / 代码块：`rounded-xl`（12px）；
- 浮层 / 下拉：`rounded-[10px]`；
- 胶囊 / 状态点：`rounded-full`；
- 键帽 / 微标签：`rounded`（4px）；
- 极小按钮：`rounded-md`（6px）。

### 5.2 焦点环

Claude 的三层配方：

```css
--cds-focus-shadow:
  inset 0 0 0 1px var(--cds-surface-1), 0 0 0 1.5px var(--cds-clay),
  0 0 6px 1px rgba(217, 119, 87, 0.25);
```

网页端背景不固定，`inset` 垫片会依赖父级表面色，因此不做 1px 隔离，环从边框外缘起算。环宽按像素密度调整：2x 及以上用 1.5px，1x 用 2px。原因是 1.5px 在 1x 屏上常被舍入成不稳定结果，而 2px 在 2x 屏上又偏重；这是对 WCAG 2.4.13 与手册 1.5/2.0 两种说法的折中。

环必须用 `box-shadow` 的 spread 绘制，不能用 `outline`：Chromium 会把 `outline-width: 1.5px` 舍入成 1 CSS px，在 2x 屏只有 2 设备像素；同样 1.5px 的 `box-shadow` spread 会渲染为 3 设备像素，才符合“2x 屏 1.5px”的意图。`outline` 只保留为 forced-colors 回退。

```css
:root {
  --focus-ring-width: 2px;
  --focus-ring-glow: 0 0 6px 1px
    color-mix(in srgb, var(--accent) 25%, transparent);
}

@media (min-resolution: 2dppx) {
  :root {
    --focus-ring-width: 1.5px;
  }
}

:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow:
    0 0 0 var(--focus-ring-width) var(--accent),
    var(--focus-ring-glow);
}

:focus-visible[data-focus-ring="none"] {
  outline: none;
  box-shadow: none;
}

@media (forced-colors: active) {
  :focus-visible:not([data-focus-ring="none"]) {
    outline: 2px solid CanvasText;
    box-shadow: none;
  }
}
```

焦点规则放在 cascade layer 外，否则组件的 `shadow-*` / `ring-*` utility 在 utilities 层会压过它。需要把焦点交给容器的控件标记 `data-focus-ring="none"`，避免内外两个环。

这不是一条全局规则就能完成的事：

- 删除旧的全局 `outline-2 outline-offset-4`，以及 Button / Input / Select 的 `outline-none`、旧 `ring-*`；它们会压掉新的环。
- 逐组件补焦点：Button、Input、Select、Textarea、链接卡片、导航链接、Mermaid 控件。
- Composer 与 Notes 搜索框不再套硬环：控件标记 `data-focus-ring="none"`，用 `.field-shell` 做表面焦点（见 §5.2b）；其他控件仍走全局 `:focus-visible`。
- Select 用 `data-highlighted` 处理键盘高亮，不要复用 `:focus-visible`；`SelectItem` 标记 `data-focus-ring="none"`。
- 行内链接因跨行，额外加 `text-decoration: underline`，保证环不可见时仍有焦点提示。
- 不使用 `:focus`，只用 `:focus-visible`，避免鼠标点击出现焦点环。
- 焦点元素不要放在 `overflow: hidden` 容器里；必要时给父级留 2px 内边距。
- 焦点时环会替换组件自身的 `box-shadow`；需要同时保留阴影的浮层把环追加到原 `box-shadow` 列表。

### 5.2b 文本输入表面焦点

文本输入框是持续键盘交互的容器，点击即触发 `:focus-visible`，再套一个外部强调色硬环会与周围的卡片悬停语言冲突。v0.5 把 Composer 与 Notes 搜索框改为同一套“表面焦点”：焦点仍可见、可度量，但使用与卡片一致的边框 / 背景过渡。

```css
.field-shell {
  border: 1px solid var(--border-strong);
  background-color: var(--background);
  box-shadow: 0 1px 2px transparent;
  transition:
    border-color var(--duration-base) var(--ease-cds-out),
    background-color var(--duration-base) var(--ease-cds-out),
    box-shadow var(--duration-base) var(--ease-cds-out);
}

.field-shell:focus,
.field-shell:focus-within {
  border-color: color-mix(in srgb, var(--foreground) 50%, transparent);
  background-color: color-mix(in srgb, var(--muted) 52%, var(--background));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--foreground) 5%, transparent);
}
```

- 焦点只改 1px 边框到前景色 50%、表面提亮到 `muted` 52%，再加一层 5% 的前景色软阴影；不再用 inset 双线或强调色光晕。
- 前景色 50% 边框与画布对比约 3:1；整个输入表面的明度变化同时提供冗余提示。输入光标用 `caret-color: var(--accent)`，作为不增加视觉重量的焦点线索。
- 悬停与焦点都用 200ms `--ease-cds-out`，从当前值过渡；forced-colors 下保留 2px `CanvasText` 轮廓。
- Composer 用 `:focus-within`（焦点在内部 input）；Notes 搜索框直接把 `.field-shell` 放在 input 上，用 `:focus`；两者都标记 `data-focus-ring="none"`，避免内外双环。发送按钮与普通 Input 仍保留全局 `:focus-visible` 环。
- `tests/ui/focus.spec.ts` 锁定焦点前后的边框色、阴影变化与 200ms 过渡，并覆盖 Notes 搜索框。

### 5.3 字号与行高

直接采用 7 阶（卡片标题 16/24 是站内例外），网页不启用 `--cds-rem-scale`（16/17）。那是桌面宿主把 17px 基准压到 16px 的光学补偿，套到网页会让 14px 变成 12.24px。

| 阶梯       | 字号 / 行高     | 本站用途                                   |
| ---------- | --------------- | ------------------------------------------ |
| caption    | 11px / 16px     | 导航、时间、键帽、mono 微标签              |
| footnote   | 12px / 15px     | 次级说明、文件大小、免责声明               |
| code       | 12px / 16px     | 代码块、行内代码                           |
| body       | **14px / 24px** | 会话回答、用户气泡、输入框（桌面）、占位符 |
| prose      | **16px / 28px** | 文章正文                                   |
| heading    | 14px / 18px     | 分块小标题、设置项等密集 UI                |
| card-title | **16px / 24px** | 目录卡片、项目卡片标题                     |
| title      | 20px / 24px     | 应用内顶栏、项目主标题                     |

字号取手册“内容到排版矩阵”的实际渲染值；7 阶 token 在启用 16/17 光学缩放后会出现 13.18px 等中间值。本站不启用该缩放，按矩阵取整。

行高按 CJK 阅读调整：会话 14/24（密集场景可退到 14/22），文章 16/28，卡片标题 16/24。这是与 Claude 的明确差异，原因在决策台账；不要为了“照搬”把中文行高压回 20/24。

7 阶已落到 `@theme` 的 `--text-*`（含配套 `--text-*--line-height`），组件直接用 `text-body` / `text-prose` 等类；`tailwind-merge` 已识别这些名字，不要再写 `text-sm leading-*` 的组合。

配套约束：

- 输入框在 `<640px` 保底 16px，避免 iOS Safari 聚焦时自动缩放；`sm` 以上用 14/24；占位符 14px。
- 文章正文用 `text-prose`（16/28）；文章内代码用 `prose-code:text-code` / `prose-pre:text-code`（12/16）。h2/h3、引用、列表仍由 Typography 控制，不进入 7 阶。
- `font-variant-numeric: tabular-nums` 用于日期、数量、统计；
- `text-wrap: pretty` 用于回答段落，消除孤行；
- 行内图标 `vertical-align: -0.125em`，11–12px 小字用 `-0.075em`；
- 字体族继续用 Geist / Geist Mono，不引入 Anthropic 字体。

**展示型例外**：以下不进入 7 阶，保持编辑式版面或空间约束：

- 页面 H1：36/40；文章 H1：30/36（`sm` 以上 36/40）；首页自我介绍 H1 用 clamp。
- Thoughts 的月份分组标题：24/30（`sm` 以上 26/32）。
- About 统计大数字：36/40。
- 站点导航在 `<380px` 用 10/16，`min-[380px]` 到 `sm` 用 caption 11/16，`sm` 起用 body 14/24；320px 仍需保证五个导航项与右侧图标同排不溢出。

### 5.4 动效与交互常量

| 常量     | 值                                                                                            |
| -------- | --------------------------------------------------------------------------------------------- |
| 时长角色 | snap 120ms / base 200ms / sheet 300ms / settle 450ms；骨架 1600ms / 等待 1900ms / 光标 1400ms |
| 缓动     | enter `.22,1,.36,1`；out `.165,.84,.44,1`；pulse `.4,0,.2,1`                                  |
| 延迟     | 等待点 150ms / 300ms；文章标题 80ms                                                           |
| 滚动渐隐 | `--scroll-fade-size` 28px；7 档 alpha：.15 / .30 / .45 / .60 / .75 / .87 / 1.0                |
| 卡片悬停 | `scaleY(1.015) scaleX(1.005)`；200ms `--ease-cds-out`；减动态与触屏不位移                     |
| 筛选滑块 | 共享 `layoutId`；200ms `--ease-cds-out`；减动态时长 0                                         |
| 骨架扫光 | `--skeleton-angle` 105°；`--duration-skeleton` 1.6s 循环；减动态隐藏                          |
| 输入焦点 | 1px 前景色 50% 边框 + 表面提亮 + 5% 软阴影；200ms                                             |
| 等待点   | `--duration-waiting` 1.9s 循环；延迟 0.15s / 0.3s；点径 3px；间距 3.5px                       |
| 滚动跟随 | 40px 容差；150ms 冷却                                                                         |
| 输入法   | 合成结束后 500ms 内的 Enter 丢弃                                                              |
| 复制反馈 | 2.5s 衰减                                                                                     |
| 发丝线   | 2x 屏 0.5px；3x 屏 1/3px                                                                      |

弹簧：只采用 `320 / 28` 作为 settle 类交互；`600 / 30` 是语音/麦克风按钮的高频微弹，不用在通用 UI；Bot 的弹跳可以单独使用，因为它属于角色表达。

**减动态回退**：等待点这类无限动画不能只靠全局 `animation-duration: 0.01ms` 压掉；否则 100% 关键帧是透明时会直接不可见。迁移时给等待点保留一个静态可见点，或换成不依赖动画的静态图形。

### 5.5 迁移前提与已接入守卫（Phase 0）

已接入：

- `tailwind-merge` 已扩展 `theme.text` / `theme.radius`；`cn("text-body", "text-muted-foreground")` 与 `cn("rounded-md", "rounded-panel")` 有单测锁定。
- `npm run check:design`：扫描 `src` 的裸色值与未定义 CSS 变量（`ENG-01`），以及任意圆角 / 时长 / 缓动值（`VIS-04` / `MOT-01` / `MOT-02`）；同时拦截 CSS 里的裸时长、裸 `ease-*` / `cubic-bezier()`，以及 `duration-200` 这类未走令牌的 utility；令牌定义与减动态归零值放行，注释、局部自定义属性、vendor 目录不误报。
- `npm run test:ui`：无头 Playwright（desktop / mobile），覆盖 A11Y-01 名称、INT-04 320px、MOT-04 减动态、STATE-01 五态、VIS-05 的 1x / 2x 焦点环宽度、TYPE-01 的会话 / 卡片 / 文章字号与行高。
- `.github/workflows/ui.yml`：PR / push 到 main 跑 `design` 与 `ui` 两个 job；design job 含 `check:design`、Prettier、ESLint、类型与单测；UI job 注入 Turnstile 测试键、安装 Chromium，失败上传 `playwright-report` 与 `test-results`。

仍需人工完成：

- 在 GitHub 分支保护中把 `Design checks` / `UI tests` 设为 required；在 baseline 清零前保持非阻塞。
- `sync-writing` 用 `GITHUB_TOKEN` 直推 main，不会触发新的 workflow；给该 workflow 配 bypass，或改成 PR。
- 视觉回归、间距规则、多浏览器矩阵暂未接入。

### 5.6 v0.5 交互层映射

| 规则     | 实现                                                                     | 覆盖范围                                                        |
| -------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| VIS-05   | `.field-shell` + `data-focus-ring="none"`                                | Composer、Notes 搜索框；`tests/ui/focus.spec.ts`                |
| VIS-06   | `.card-lift`（纯上浮，无光晕）                                           | ArticleCard、ProjectCard；`group-hover` / `group-focus-visible` |
| VIS-07   | `FilterActivePill`（`motion` 共享 `layoutId`）                           | Notes 桌面端 Categories / Tags                                  |
| INT-03   | `.scroll-fade` 上下叠层 + `ResizeObserver` / `scroll` 同步               | 会话滚动区；`tests/ui/scroll-fade.spec.ts`                      |
| STATE-02 | `.waiting-dots` / `.waiting-dot` / `.stream-caret`                       | 等待态与流式光标；减动态静态回退                                |
| STATE-03 | `.skeleton-sweep`                                                        | Notes 搜索骨架；减动态隐藏扫光                                  |
| INT-06   | `DirectorySearch` 自定义清除按钮 + 隐藏 `::-webkit-search-cancel-button` | Notes / Thoughts 搜索；点击后回焦输入框                         |

动效令牌：`--ease-cds-enter / out / pulse`、`--duration-snap / base / sheet / settle`，以及组件级循环/尺寸 `--duration-skeleton / waiting / caret`、`--delay-*`、`--scroll-fade-size`、`--skeleton-angle`、`--waiting-dot-*` 均定义在 `globals.css`，都有实际消费方；未使用的 press 时长与 snap / overshoot 曲线已移除。Motion 组件需要的 JS 参数统一放在 `src/lib/motion.ts`（`LAYOUT_TRANSITION`、`HIGHLIGHT_TRANSITION`），经 `respectReducedMotion` 归零；Introduction、TopicShortcuts、FilterActivePill 不再内联时长或贝塞尔。渐变停靠百分比、关键帧位移与透明度属于组件几何，不提升为全局令牌。

---

## 六、决策台账

| 决策                           | 采用                                                                | 依据                              | 与 Claude 的差异                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 圆角                           | 实际使用 2 / 4 / 6 / 8 / 10 / 12 / 18 / 20 / 9999                   | CDS 01 §1.3                       | 16 / 24 暂无消费方，先移除，避免闲置令牌                                                                                       |
| 焦点环                         | 1x 屏 2px、2x+ 屏 1.5px 强调色环 + 柔光；全局 ring + 容器例外       | CDS 01 §1.3.2/1.4.5 + WCAG 2.4.13 | 厚度按分辨率调整；改实现方式，不改色相                                                                                         |
| Composer / 搜索框焦点          | 表面焦点：1px 前景色 50% 边框 + 表面提亮 + 5% 软阴影；200ms 过渡    | CDS 02 §2.6 + 用户反馈            | 点击输入框不再出现硬环或彩色光晕；焦点仍可见，其他控件保留全局环                                                               |
| 卡片悬停                       | 1.5% / 0.5% 上浮；键盘焦点同态                                      | CDS v2 §2.6                       | 去掉底部暖色微光；不采用 3D 透视与冷色底色；触屏与减动态不位移                                                                 |
| 滚动渐隐                       | 28px 7 档叠层，仅在可滚动方向出现                                   | CDS 04 §4.3                       | 用背景叠层替代 mask，防止裁掉滚动区焦点环                                                                                      |
| 筛选滑块                       | 共享 `layoutId` 的活动胶囊，200ms                                   | CDS 01 §2.2                       | 只用于短筛选列表；长列表与移动端 Select 不套用                                                                                 |
| 搜索清除                       | 站内 X 图标按钮；隐藏浏览器原生蓝色 cancel                          | 用户反馈                          | 清除只清搜索词，保留分类 / 标签；点击后回焦输入框                                                                              |
| 骨架扫光                       | 105°、1.6s；减动态静态占位                                          | CDS v2 §3.5                       | 不采用双模 Wave/Lockstep 全套，先上单模                                                                                        |
| 字号                           | 照搬 7 阶字号；CJK 行高例外：会话 14/24、文章 16/28、卡片标题 16/24 | CDS 01 §1.5 + CJK 阅读            | 行高与 Claude 不同；页面 H1 36px；文章 H1 30/36（sm 以上 36/40）；不启用 16/17 光学缩放；导航 320 10/16、380+ 11/16、sm+ 14/24 |
| 输入框移动端                   | `<640px` 保底 16px                                                  | iOS Safari 聚焦缩放               | 手册矩阵的移动端地板，补上漏项                                                                                                 |
| 表面与强调色                   | 采用层级语法；色值保留本站暖色                                      | CDS 01 §1.2                       | 色值不同                                                                                                                       |
| 动效                           | 直接采用时长与曲线                                                  | CDS 04                            | 通用 UI 不使用 600/30 弹簧                                                                                                     |
| 思考链路 / 模型切换 / 桌面窗口 | 不采用                                                              | —                                 | 不属于个人站产品结构                                                                                                           |

## 七、首批 CI 检查

对应 GitHub Actions 的第一版，只上这 7 条：

1. `ENG-01`：令牌外裸色值、未定义 `var(--token)`（已接入 `check:design`）；`VIS-04` / `MOT-01` / `MOT-02` 的任意圆角、任意/裸时长、任意/裸缓动已接入；禁用依赖与间距规则尚未自动化；
2. `INT-04`：320px 无整页横向滚动，文章代码块保持在视口内（已接入 `test:ui`）；
3. `MOT-04`：`prefers-reduced-motion` 下等待与流式内容可见（已接入 `test:ui`）；
4. `A11Y-01`：交互元素有可访问名称（已接入 axe）；
5. `STATE-01`：空 / 加载 / 流式 / 错 / 完成五态 fixture（已接入 `test:ui`）；
6. `VIS-05`：`:focus-visible` 在 1x / 2x 下的环宽与容器例外（已接入 `test:ui`）；
7. `TYPE-01`：会话、卡片、文章的关键字号 / 行高（已接入 `test:ui`）。
8. v0.5：`VIS-05` Composer / Notes 搜索框表面焦点、`INT-03` 滚动渐隐、`VIS-06` 卡片上浮、`STATE-02/03` 等待点与骨架扫光减动态回退（均已接入 `test:ui` 或评审清单）。
9. `INT-06`：搜索框清除按钮的可访问名称、清空值与回焦（已接入 `test:ui`）。

`test:ui` 与 `check:design` 已接入 `.github/workflows/ui.yml`；在 GitHub 分支保护里设 required 之前，先保持 advisory。其余规则先进评审清单，稳定后再升级为 CI。
