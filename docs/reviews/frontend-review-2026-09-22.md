# 前端架构、需求与交互审查

范围：`feature/react-tailwind-refactor` 当前完整前端，以及 `39c4adc` 后的未提交改动。以会话中的最新决定和 `frontend-refactor-spec.md` 当前约定为准，不将已被替代的早期动画方案作为缺陷。

方法：code-review 的结构／需求两轴独立审查，codebase-design 判断职责与复用，OCR delegate 生成文件和规则清单；主审查在浏览器验证行为，并复核修复。没有调用外部 LLM 服务。

## Standards：结构与复用

没有发现需要修复的模块越界或重复业务实现。保留 `home / projects / writing / bot`，依赖限制由 ESLint 和架构测试约束。

| 位置 | 当前行数 | 职责判断 |
| --- | ---: | --- |
| `bot/use-bot-scenes.ts` | 181 | 场景订阅、计时与清理；裁决规则已分离，无需为行数再拆 |
| `bot/scene-controller.ts` | 159 | 纯状态转换、优先级与结果去重 |
| `home/home-experience.tsx` | 123 | 首页组合及业务信号映射 |
| `home/use-answer-presentation.ts` | 71 | 唯一回答展示调度 |
| `home/use-conversation.ts` | 67 | 消息、请求和取消，不混入动画 |
| `bot/vendor/src/character.js` | 874 | 原角色引擎调度；原有 857 行 |
| `bot/vendor/src/fx.js` | 910 | 原绘制／特效引擎；原有 908 行 |

大文件主要来自已隔离的原引擎，不是新增页面业务集中在一个文件。眼睛、姿态、动作和数学运算已有独立文件；若以后大幅修改特效引擎，再按变化职责拆分。本轮没有机械拆文件。

复用核查：

- 首页和目录直接共用 `ProjectCard`、`ArticleCard`，没有另写相同卡片。
- 项目数据只有一份；文章标题、日期、标签和正文来自原 Markdown。预写回答仅保存内容 ID。
- Notes／Thoughts 共用读取、目录和正文渲染。两个短正文路由只做 Next 路由组装。
- 首页与开发预览共用 `Character`；home 不访问引擎实例或 vendor。
- 原 `components/answer-chunks.ts` 移到 home 内复用，没有保留两份实现。

结构轴：0 项需修复问题；原引擎体量是维护关注点，不作为本轮缺陷。

## Spec：需求与缺陷

发现并修复 **1 项 P2**：失败警报结束后，基础心情仍被首页永久映射为 `error`。虽然 Bot 看起来已经回到 idle，输入框聚焦不会倾听，也不会继续随机待机表情。

修复将失败改为按回答 ID 消费一次的 `failed` 信号，基础心情仍由输入焦点决定；警报时长、优先级及去重归 Bot。错误文案持续显示，聚焦、清空、新提问和后台恢复不重播旧警报。没有让 home 接管动画定时器。

| 已确认要求 | 核查结果 |
| --- | --- |
| 会话累计；同标签页阅读返回保留，刷新／清空重置 | 实现及回归覆盖 |
| 菜单打开完整目录；项目去 GitHub，笔记展示标题摘要并进入正文 | 实现及阅读路径覆盖 |
| 本地块状输出、逐张卡片；减少动态效果不跳过文字输出 | 统一展示调度，未接入真实模型 |
| 正常回答只书写；完成单圈、单跳、落地粒子一次 | 场景及逐帧回归覆盖 |
| 无进度环、无鼠标位置跟随；保留主题探索和输入倾听 | 实现及交互回归覆盖 |
| 专用手势只点击弹跳 | 无三击、拖拽、长按业务手势 |
| 待机轮换五种完整表情 | 眼睛与姿态共同变化，非仅轮换眼型 |
| 60 秒无操作睡眠；活动后单次醒来，回答立即接管 | 计时、后台、清空及导航回归覆盖 |
| 只排除指定眼型 7／8，不删其他整套动作 | 所有 39 状态统一过滤；模块测试覆盖 |
| 眼睛不能画出身体轮廓 | 每帧更新真实轮廓裁剪；新增明暗主题、桌面／手机检查 |
| 错误短暂提示后恢复正常互动 | 本轮 P2 已修复，并补恢复／聚焦／重试回归 |
| 动画优先级、旧计时取消、历史不重播 | 控制器及端到端回归覆盖 |

需求轴：1 项 P2，已修复；本轮未发现其他可证实的需求缺失。

## 眼睛与浏览器检查

静态眼睛、五种待机表情、睡眠、倾听等状态的补充几何采样未发现眼睛路径越出身体。转身时，眼睛会绕到侧后方，此时必须由身体轮廓遮挡；不能把未裁剪路径的外接框误判为实际越界。

已有 `clipPath` 每帧同步身体的真实路径，眼睛和身体共享变换坐标。新增回归持续检查从书写、变形、转身到待机期间的裁剪引用、路径同步与有限坐标，覆盖明暗主题和两种视口。本轮没有发现眼睛实际绘制到身体之外，因此保留现有渲染实现。

另实测了桌面提问→笔记正文→返回会话、小屏暗色布局，以及故障后恢复输入倾听，未见横向溢出。截图保存在忽略目录 `.local/qa/review-*.png`。

依据：[MDN clipPath](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/clipPath)说明裁剪限制实际绘制区域，不改变几何包围框；[React reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)用于集中维护状态转换。

## 非阻塞的框架日志项

另发现 1 项低优先级日志问题：生产版 Next.js 16.3.5 访问未收录的 `/notes/not-selected`、`/thoughts/not-selected` 时会记录 `Internal: NoFallbackError`。独立启动生产服务复核：已收录文章返回 200；未收录文章正确返回 404、本站“页面不存在”内容及 noindex；普通不存在地址也返回 404。未复现 500 或页面崩溃。该日志与禁止动态参数的静态文章路由有关，保留现有路由契约，记录为后续框架版本复核项。

## 验证与覆盖

- `npm run check`：lint、类型检查、37 项模块／架构测试和生产构建通过。
- `npm run format:check`：通过。
- 完整生产端到端回归：88 项桌面／手机用例全部通过（2.8 分钟），其中 4 项新增眼睛裁剪检查覆盖明暗主题。
- OCR 初始清单：27 项，审查 26 项，跳过 1 项，覆盖率 96.3%；当前前端可审查生产文件覆盖率 100%。跳过项是任务开始前已有的 `themes/PaperMod` 旧 Hugo 子模块指针变更，与本轮 Next 前端无关，不纳入提交。
- OCR 默认排除的测试、需求和架构文档也已人工审阅；新增眼睛回归与错误恢复修复已复核。

26 项生产文件清单按职责分组：Bot 入口、运行时加载、behavior、preview、Character、controller、Hook；vendor 的 character／fx／pose／tables／tricks；开发预览路由；home 的回答函数、answer-content、introduction、topic-shortcuts、transcript、provider、experience、presets、types、answer-chunks、answer-presentation、home-visit、use-answer-presentation。

这些结论限于当前实现、测试路径及 Chromium 桌面／手机视口，不意味着证明所有浏览器和未来内容都没有缺陷。
