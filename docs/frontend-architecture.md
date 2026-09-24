# 个人站 2.0 前端架构方案

状态：保留 home / projects / writing / bot 的职责边界，采用常见的 Next.js `app / components / lib` 目录；会话生命周期、字段来源、引用校验与模块导入约束已落实，完整阅读返回流程已有桌面和移动端验证。

## 研究依据

[Next.js 官方目录说明](https://nextjs.org/docs/app/getting-started/project-structure)不规定唯一组织法，支持在 `app` 内共置路由私有代码；以下是结合本站规模作出的选择。官方 [Dashboard 教程](https://nextjs.org/learn/dashboard-app/getting-started)把路由、界面和数据操作分别放在 `app`、`ui`、`lib`；[Vercel Commerce](https://github.com/vercel/commerce)及 [shadcn/ui 网站](https://github.com/shadcn-ui/ui/blob/main/CONTRIBUTING.md)也使用 `app`、`components`、`lib` 等常见目录。`features` 是 [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)等项目采用的另一种业务内聚方式，并非 Next.js 约定。详细的原始研究见[架构研究记录](research/frontend-architecture.md)；目录命名调整不改变其中关于业务边界和服务端／客户端边界的结论。

## 目标与输入输出

本次让首页会话、内容目录、正文阅读和 Bot 能各自迭代。输入为个人资料、项目条目、从 `Obisidian-Open` 同步的公开 Markdown 文章、预写回答，以及原型 Bot 引擎；输出为首页、三个内容目录、文章正文和 About Me 页面。文章原稿留在源仓库，本站仅缓存已发布内容。

已有原型的 `main.jsx` 同时管理输入、会话、等待状态、定时器、滚动、Bot 反馈、导航与整页视图；`content.js` 同时混合主题导航、问答模板与内容链接。2.0 按这些职责实际变化的位置组织代码。

## 推荐目录

```text
content/                     已发布 Markdown 的同步缓存，整个目录由同步脚本管理

src/
  app/
    layout.tsx                 字体、全站外壳、读取公开摘要并承载会话 Provider
    globals.css                主题变量、基础样式与必要动画
    page.tsx                   组装首页
    _home/                     首页私有代码，不生成路由
      home-experience.tsx      首页交互区
      conversation-provider.tsx 共享布局中的会话宿主
      use-conversation.ts     消息、请求状态、提交与清空
      answer-question.ts      预写回答与内容引用
      answer-presentation.ts  文本和卡片展示时间线
      components/             介绍区、主题入口、会话、输入框
    projects/page.tsx          项目完整目录
    notes/page.tsx             技术笔记目录
    notes/[slug]/page.tsx      技术笔记正文
    thoughts/page.tsx          随笔目录
    thoughts/[slug]/page.tsx   随笔正文
    about/page.tsx             静态个人介绍
    dev/bot/page.tsx           仅开发环境的 Bot 试播入口

  components/
    bot/                       角色入口、交互场景、引擎与 vendor 素材
    projects/                  首页和目录共用的项目卡片与目录视图
    writing/                   首页和目录共用的文章卡片、目录与正文
    ui/                        shadcn 基础组件
    site/                      全站导航与主题

  lib/
    projects/                  项目数据与公开类型
    writing/                   frontmatter 校验、服务端读取与公开类型
    utils.ts                   跨业务纯工具
  config/
    site.ts                   站点身份、个人资料与导航

scripts/
  sync-writing.ts             校验源仓库后替换本站文章缓存

.github/workflows/
  sync-writing.yml            定时与手动内容同步、构建验证、提交

tests/
  e2e/                        跨页导航、问答累积和阅读路径
```

`_home` 使用 Next.js 的私有文件夹约定，供根布局和首页共用且不暴露路由。项目与文章的 UI 在 `components`，事实数据和服务端读取在 `lib`；同一领域仍各有独立子目录，不把状态、解析或动画塞回 `page.tsx`。只在实际出现职责时创建文件。

## 模块职责与依赖

| 位置 | 对外提供 | 不应承担 |
| --- | --- | --- |
| app 路由文件 | 路由、metadata、服务端取数、页面组装 | 关键词匹配、Markdown 解析实现、Bot 动画细节 |
| app/_home | 首页交互、会话与回答函数 | 文件系统访问、文章正文解析、项目数据的第二份副本 |
| components/projects | 项目卡片和目录 | 会话状态与项目事实数据 |
| components/writing | 文章卡片、目录、正文 | 首页问答规则和文件读取 |
| components/bot | 由表现状态驱动的角色 | 判断访客问题或读取业务内容 |
| lib/projects、lib/writing | 事实数据、文章校验、服务端查询和公开类型 | React 视图与路由 |
| components/ui | 通用基础控件 | 项目、文章、会话等业务判断 |

依赖方向：

```text
app 路由 ──> app/_home、components/{projects,writing,bot}、lib/{projects,writing}
app/_home ──> components/{projects,writing} 的卡片、components/bot 的入口、lib 的公开类型
components/{projects,writing} ──> 对应 lib 的公开类型
lib ──> 不依赖 app 和 components
```

`app/_home` 只能使用项目与文章的公开类型和卡片，以及 Bot 对外入口，不导入文章 loader 或引擎内部文件。`components/ui` 和全站外壳不反向依赖业务目录。ESLint 对这些路径加约束；`server-only` 保护正文查询的运行边界，不为目录更名增加转发层。

## 三个关键接口

### 内容接口：同一条内容，只维护一次

文章原稿位于 `Obisidian-Open`，本站 `content` 整个目录只缓存已发布 Markdown，同步时会被整体替换。每篇候选文章须有布尔 `draft`；公开文章须有 `title`、`type`、`date`、`summary`、`slug`。`type` 只能为 Notes / Thoughts；`categories` 和 `tags` 是可选字符串数组，`aliases` 不参与本站契约。`slug` 全局唯一且就是文章 ID，使用小写英文字母、数字和连字符。`catalog.ts` 是同步脚本与服务端查询共享的解析和校验入口；目录和首页只接收公开摘要，正文只用于正文页。

内容引用使用判别联合：`{ type: 'project', id } | { type: 'article', id }`。回答生成前校验预写模板中的引用，展示时按类型在同一公开目录中解析；不存在的 ID 报错，不生成失效卡片或静默丢弃。文章 ID、分类内 slug 与项目 ID 必须唯一。

项目数据集中在 `lib/projects/data.ts`。项目问答模板只引用项目 ID；Notes / Thoughts 的普通主题回答从对应公开目录选取最新三篇，因而源仓库文章增删不会留下静态文章 ID。首页回答与完整目录使用同一条目和同一个卡片组件，只有布局密度不同。

### 回答接口：页面只消费回答结果

外部形状为 `answerQuestion(question, catalog, signal?): Promise<Answer>`。请求包含问题和可选的明确主题，catalog 是共享的公开摘要，signal 用于取消请求；回答包含 kind（answer / unmatched）、简短文本和内容引用。回答函数负责分类，视图不通过提示文案猜测是否匹配。首版只实现本地预写问答。

用户已明确要求未来 AI 扩展，因此保留这一个稳定入口；未来若接模型，增加服务端调用并在此处接入。当前不建设 provider 插件体系、模型基类、依赖注入容器、后台配额系统或流式协议。若未来流式交互改变产品契约，再单独设计该扩展。

`use-conversation.ts` 仅负责消息、请求状态、提交与清空。匹配和内容引用属于回答函数；滚动、输入焦点和卡片排版属于视图；动作及动画生命周期属于 Bot。首版不增加全站状态库。

会话由 `home` 内的 React Context Provider 管理，在所有站内页面共享的根布局中挂载。通过 Next Link 在同一标签页切换目录和正文后返回首页，会话仍在；完整刷新、关闭标签页或主动清空会重置会话。不使用 localStorage、sessionStorage 或服务端存储。请求处理中离开首页仍由共享宿主持有请求；清空或宿主卸载时取消当前请求，迟到的结果不得恢复已清空消息。

预写回答的分块输出是首页的展示行为：`answer-presentation.ts` 从完整 Answer 生成提交、输出、逐张卡片和完成的时间线；`use-answer-presentation.ts` 是最新回答唯一的计时与取消宿主，记录挂载时已有的消息 ID，并向视图提供阶段、文字长度和卡片数量。`AnswerContent` 只渲染该进度，HomeExperience 将尚未完成的正常回答映射为 responding，未匹配回答为 unmatched，不逐阶段更换动作。`answer-chunks.ts` 生成本地模拟片段，不是模型 tokenizer 或网络协议实现。

完整 Answer 仍由回答函数一次返回，useConversation 不管理展示进度或动画计时。快速追问补全旧回答与卡片，清空或离开首页取消旧调度，导航返回直接显示历史内容。迟到的真实回答在数据就绪后开始输出，不将提交反馈重复播放。典型短回答及卡片约 4～6 秒完成，卡片出现即可点击；正常完成后向 Bot 传完成标记，在内容已可用的同时播放一轮带彩带转身、单次跳跃与落地粒子，再恢复待机／倾听。减少动态效果保留文本与卡片节奏，只停用装饰运动。

### Bot 接口：业务只传状态

首页传入 mood、activityKey、completed（本轮正常展示完成）、failed（本轮回答失败）、arrival（首次进入／阅读返回），不传正文或卡片进度。正常回答固定书写，未匹配回答困惑。`home-visit.ts` 在共享 Provider 中记录导航经历：仅首次首页出现播放生成，访问笔记／随笔正文后返回播放欢迎；目录往返不重播，刷新重置。该记录与会话消息分开，不进入 useConversation。

Bot 内 `behavior.ts` 定义候选及生命周期：待机有五种完整表情，其他交互场景最多两个候选。`scene-controller.ts` 集中处理优先级、冷却、完成去重与过期事件。`use-bot-scenes.ts` 连接语义信号、主题、可见性和定时器，动作仅在接受事件时抽取，不维护待播队列。回答抢占并丢弃低优先级反馈；只有明确的 completed 信号按 activityKey 消费一次，才播放约 2.4 秒 celebrate：带着彩带转一圈、轻跳一次，落地后释放少量粒子。清空、错误及未匹配不触发，隐藏时消费并丢弃，不补播。动画计时只在 Bot 内，卡片可用时间不受其影响。倾听时拒绝待机表情与低优先级装饰动作。failed 作为一次结果信号按 activityKey 去重，基础 mood 由输入焦点和卡片关注共同决定；警报结束后恢复待机／倾听，错误文案继续显示，焦点变化不重播警报。

待机完整表情由同一场景系统调度：平静 20～30 秒后从 happy／curious／shy／proud／playful 中选一次，保持 2.5 秒再恢复平静。idle-expression 优先级最低，控制器拒绝非 idle 或已有动作时的迟到事件；Hook 在探索、输入、隐藏或卸载时清理待机定时器，并监听原生 MediaQueryList change，在减少动态效果时停止轮换。恢复后重新等待，不补播。不新增 home 状态或对外参数。生命周期依据 [React useEffect](https://react.dev/reference/react/useEffect) 与 [MDN change 事件](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/change_event)。

自动休眠仍归同一个场景系统：sleep 的 duration 为 null，表示持续至显式活动或业务状态改变；wake 只接受休眠中的苏醒，使用原引擎 `spawning` 的粒子聚拢效果约 2 秒，随后恢复待机并展开身体，后续活动不会重新开始。休眠拒绝随机表情和系统主题等背景事件，回答及明确业务状态变化可打断。`use-bot-scenes.ts` 管理 60 秒休眠的闲置计时，指针、键盘、触摸与滚轮活动重置时间，回答中暂停，后台和卸载清理。Effect Event 读取最新休眠状态，避免表情轮换重置计时，也避免鼠标每次移动都派发动画事件。减少动态效果时保留静态休眠形态，活动直接恢复。首次进入时由 reducer 初始状态直接启动 `spawning`，引擎将首帧设为聚拢中心的小形态，五颗粒子向内汇集后才展开，避免先缩小再变大；从休眠唤醒时沿用当前缩小进度，并切换到同一聚拢图层。home 和 Bot 公共接口不增加状态或参数；不恢复鼠标位置跟随。依据 [React useEffectEvent](https://react.dev/reference/react/useEffectEvent) 与 [MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)。

`bot.tsx` 使用原生 button 的 onClick 触发弹跳，兼容鼠标、触摸、Enter / Space；不维护多击、长按、拖动或手动休眠手势，也不拦截滚动。短动作有冷却，点击可打断完成动作，新回答始终抢占。依据 [MDN click 事件](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event)。

`character.tsx` 只承载 SVG 与引擎生命周期，加载完成后才启动首次出现动作。原八个引擎文件继续只在客户端加载；所有眼型播放清单排除 7、8，平静状态固定基础眼型，仅保留呼吸与眨眼，五种待机表情使用各自的眼睛与身体姿态，本站关闭情绪自带的随机花式动作。状态切换清理粒子与旋转速度，防止旧彩带残留。主题通过 CSS 变量换色，场景层监听已解析主题以触发惊讶，不重建引擎。页面隐藏时暂停绘制。Character 初始化时固定关闭 followPointer，动态效果偏好切换只调整 reduceMotion，不重新启用跟随；主题卡片与输入框的关注由 home 合并，统一驱动倾听。其他模块不访问引擎实例或 window.GROK_*。

引擎的 `setState(name)` 保持单一接口：从当前已渲染的眼睛轮廓平滑转向目标，打断未完成的过渡时先取当前轮廓再更改目标。表情带来的大小变化沿用原有 eyeScale 弹簧，移除随变形进度重置的额外 7% 放大，避免中断时尺寸跳变。初始化直接采用初始状态的眼型；旧 sleeping／waking 仍作为素材预览，但首页生命周期不再使用其闭眼时序。celebrate 在播放清单中固定单个表情，避免短动作末尾又随机起一轮眼型变形。业务层不传眼型参数、不增加定时器；眼睛的平滑交接继续复用已有弹簧与帧时钟，依据 [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)。

开发路由保留 24 种素材动作（含平静、五种待机表情、睡着／醒来、完成动画）与 192 / 54 / 43px 尺寸试播；实际场景通过真实首页验证。进度环已移除；雷达、口述和嗡鸣仅留在素材预览，自动嗡鸣的场景、计时器及避让冷却已删除，正常回答只用书写。该路由生产返回 404。

卡片悬停／聚焦与输入框聚焦由 home 合并为同一个 listening mood，直接复用 Bot 的基础状态；移除 explore 场景、等待计时器、冷却以及跨模块的 exploreKey 参数。TopicShortcuts 只报告鼠标悬停，卡片与 Composer 的键盘焦点在 home 的共享输入区域统一处理，用 relatedTarget 区分内部切换与真正离开，悬停与焦点不会互相清空；卡片之间和卡片到输入框的连续切换不重新启动角色状态。点击卡片时消费其关注信号，回答期间不积压装饰反馈，输入框继续允许起草下一条问题。依据 [React 焦点事件文档](https://react.dev/reference/react-dom/components/common#focusevent-handler)。

倾听姿态在引擎内使用 dtState 驱动一次约 550ms 的点头，随后只保留轻微呼吸与眨眼，眼型及视线固定。持续聚焦和输入不会重新进入状态或循环点头；重新进入倾听时可再次回应。沿用已有状态切换与帧时钟，不增加 home 信号、React 状态或计时器，减少动态效果仍由统一渲染层处理。依据 [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)按经过时间推进动作，避免不同刷新率改变动作时长。

首页介绍区与会话顶部之间的位置、尺寸过渡归 `app/_home/components/introduction.tsx` 管理：Motion 测量布局，只在 compact 状态变化时移动同一个 Bot，保持 SVG 和引擎实例连续。清空时反向返回，追问不重播，减少动态效果时立即切换。角色内部动作仍归 bot，不向会话 Hook 添加动画状态。

主题入口的共享高亮归 `app/_home/components/topic-shortcuts.tsx`：组件只保存视觉悬停与键盘焦点，以同一个 Motion layoutId 在卡片之间移动底板，跨间隙保持上一个目标，键盘焦点优先，离开后清除；点击消费高亮，禁用期间不显示。首页双列／四列与会话紧凑布局复用这一实现，颜色、边框和图标使用 Tailwind，减少动态效果时直接定位。不改变 Bot 关注接口或会话数据。视觉参考用户提供的 Visual Atlas `anchor-positioning-hover-cards`；实现依据 [Motion 共享布局动画](https://motion.dev/docs/react-layout-animations#shared-layout-animations)，复用已安装依赖，不增加坐标测量 Hook 或全局样式。

## Next.js 的服务端与客户端约束

- 路由和正文默认在服务端执行；交互集中在首页体验和 Bot 等确有需要的客户端入口。
- `content.server.ts` 使用 `server-only` 防止被客户端导入，文件读取和 Markdown 解析不会进入首页浏览器包。
- 服务端给首页传递的是可序列化的公开摘要，不传正文、文件路径、未选中的文章或草稿。
- `article-card.tsx` 只依赖公开数据类型、基础组件和链接组件，可供首页交互与服务端目录共同使用。
- 不用一个混合导出的 `index.ts` 同时暴露内容查询、正文解析与客户端卡片。服务端查询入口与浏览器可用入口保持明确分离。
- `globals.css` 仅保留主题定义、基础样式和必要关键帧。业务布局使用 Tailwind，shadcn 提供基础组件，不承担问答或内容规则。

主题使用 next-themes，由根布局组装 `components/site/theme-provider.tsx`，默认跟随系统，页头 `theme-toggle.tsx` 切换明暗。只有手动主题偏好以 `simweb-theme` 写入 localStorage，会话仍不持久化。首屏脚本在绘制前设置 html 的主题 class，按钮的图标和可访问名称用 CSS 明暗变体切换，避免服务端与客户端根据不同主题渲染不同 DOM。Bot 的渲染层通过现有 inkFlat / eyeColor 参数引用局部 CSS 变量；场景层监听主题变化，换色不重建引擎。文章正文通过 Typography 暗色变体和语义颜色适配。

## 修改与验证如何集中

| 未来变更 | 主要修改位置 | 验证 |
| --- | --- | --- |
| 增加项目或改仓库链接 | lib/projects/data.ts | 目录与回答出现相同条目和目的地 |
| 调整笔记卡片样式 | components/writing/article-card.tsx | 首页与两类目录同步变化 |
| 新增或撤下文章 | 源仓库 frontmatter + 内容同步 | 元数据校验、目录与直接正文访问 |
| 调整问答匹配或接入 AI | app/_home/answer-question.ts 及其内部实现 | 从问题得到正确回答和有效内容引用 |
| 改 Bot 动作或更换引擎 | components/bot 内部 | 状态映射、卸载、键盘/减少动态效果 |
| 调整顶部菜单 | config/site.ts + components/site | 顶部点击进入目录而非触发问答 |

ESLint 的 `no-restricted-imports` 已固化关键依赖方向，并以 `server-only` 检查服务端模块误用。架构测试验证别名与相对路径导入限制。测试命令递归发现 `src` 内的模块测试及根 `tests` 中的工具测试，端到端测试独立运行。模块测试围绕对外行为编写；端到端测试验证“首页提问 → 笔记卡片 → 正文 → 返回首页”，以及会话累积、刷新清空和移动端。
