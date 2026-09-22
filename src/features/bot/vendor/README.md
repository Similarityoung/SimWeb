# Grok Bot 角色复刻（仅供学习参考）

> 素材归 xAI / 相应权利人所有。  
> 本仓库仅供学习参考，请勿商用或再分发。

这是对 **Grok Bot.app v0.18.0** 登录页角色动效的学习复刻，用于研究状态机、弹簧动画、多边形眼睛等实现。

## 打开

浏览器打开 [`replica/index.html`](./replica/index.html)。

登录页原参数：`sizePx: 64`、`color: "black"`、`shape: "blob"`。  
`pjn(n) = n%2===0 ? idle : cSe[(n-1)/2]`，间隔 `1200ms`。  
playground 有意从 curious 起播；点「登录轮换」才按 `pjn(0)=idle` 重来。大预览默认开指针跟随，源码默认关。

## 项目结构

| 路径 | 内容 |
|---|---|
| `replica/index.html` | L1 舞台 |
| `replica/src/` | 拆开的引擎：character / pose / tricks / eyes / fx / math / tables |
| `replica/geometry-data.js` | `u3` 25 眼、`Jo` 18 身形、`snt` 11 色 |
| `replica/grok-blob-idle.svg` | 静态 blob + idle `u3[0]` |
| `extracted/` | 从主包抽出的学习参考片段 |
| `extract-asar.js` | 解包辅助脚本（按需使用） |
| `assets/icon.iconset/`、`assets/app-icon-256.png` | Dock / 应用内静态商标（不是角色引擎） |

## 免责声明

- 本仓库仅用于学习参考。
- 所有角色造型、商标、图标、几何数据及从应用包中提取的内容，均归 xAI / 相应权利人所有。
- 请勿用于商业用途，请勿再分发。
- 请勿将本仓库内容当作自己的商标或原创素材发布。

## 本站适配（2026-09-22）

保留原几何数据与状态，在引擎中做以下局部改动：`tables.js` 从播放清单排除用户指定的眼型 7、8，并将待机扩为 9 种温和眼型、5～9 秒轮换；`character.js` 提供 `autoTricks` 控制，并在减少动态效果时固定绘制姿态，切换状态时清理粒子；`fx.js` 清理粒子时同时重置旋转速度记录，避免中止后的彩带残留。本站已撤下进度环，原始动作库仍保留。场景选择与回答展示仍位于 vendor 之外。

完成反馈使用单次 `celebrate`：`tricks.js` 的 `spinHop` 按时间戳先转一圈、再轻跳一次；`character.js` 在落地时释放 14 个低速粒子，消费后不重复，旋转阶段复用原引擎的单组彩带，停转后自然消退。`pose.js` 取消此状态的额外上下摆动，`fx.js` 为实际粒子添加观测标记。时长、优先级与中止仍归外部 Bot 场景控制器。
