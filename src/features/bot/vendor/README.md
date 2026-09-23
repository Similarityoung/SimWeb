# Bot 引擎来源与本站适配

这八个引擎文件来自 `visual-atlas/cases/grok-icon-study/source/replica` 的 Grok Bot 学习复刻。角色造型、商标、几何数据及原始素材归 xAI 或相应权利人所有；原项目声明仅供学习参考，请勿商用或再分发。本站在原型基础上作个人站适配，此说明不代表取得额外授权。

引擎只由 `src/features/bot/runtime.client.ts` 在浏览器加载。首页动作的选择、优先级与计时位于 `bot/behavior.ts`、`scene-controller.ts` 和 `use-bot-scenes.ts`；本目录只负责绘制和状态过渡。

本站对原引擎的改动集中在：

- `tables.js` 从眼型播放清单排除 7、8；平静待机固定基础眼型，其余完整表情保留。
- `pose.js`、`eyes.js` 与 `character.js` 处理倾听点头、眼睛过渡、减少动态效果、状态中断和首次入场形态。
- `tricks.js`、`fx.js` 处理完成时的单次转身、跳跃、彩带与落地粒子；停止后清理残留。
- 首次入场及休眠苏醒复用 `spawning` 的聚拢粒子。中途打断休眠时沿用当前身体尺寸，粒子在身体尚大时绘于前方以保持可见。

未进入正式互动的原始动作仍可在仅开发环境开放的 `/dev/bot` 中试播。
