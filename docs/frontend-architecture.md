# 个人站 2.0 前端架构方案

状态：保留 home / projects / writing / bot 的职责边界，采用常见的 Next.js `app / components / lib` 目录；会话生命周期、字段来源、引用校验与模块导入约束已落实，完整阅读返回流程已有桌面和移动端验证。

## 研究依据

[Next.js 官方目录说明](https://nextjs.org/docs/app/getting-started/project-structure)不规定唯一组织法，支持在 `app` 内共置路由私有代码；以下是结合本站规模作出的选择。官方 [Dashboard 教程](https://nextjs.org/learn/dashboard-app/getting-started)把路由、界面和数据操作分别放在 `app`、`ui`、`lib`；[Vercel Commerce](https://github.com/vercel/commerce)及 [shadcn/ui 网站](https://github.com/shadcn-ui/ui/blob/main/CONTRIBUTING.md)也使用 `app`、`components`、`lib` 等常见目录。`features` 是 [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)等项目采用的另一种业务内聚方式，并非 Next.js 约定。详细的原始研究见[架构研究记录](research/frontend-architecture.md)；目录命名调整不改变其中关于业务边界和服务端／客户端边界的结论。

## 目标与输入输出

本次让首页会话、内容目录、正文阅读和 Bot 能各自迭代。输入为个人资料、项目条目、从 `Obisidian-Open` 同步的公开 Markdown 文章、模型回答，以及原型 Bot 引擎；输出为首页、三个内容目录、文章正文和 About Me 页面。文章原稿留在源仓库，本站仅缓存已发布内容。

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
      conversation.ts         SDK Chat、成功判定及短历史投影
      topics.ts               快捷入口元数据
      catalog.ts              真实目录引用校验与解析
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
    answer/                    schema、服务端上下文与模型流服务
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

| 位置                      | 对外提供                                 | 不应承担                                         |
| ------------------------- | ---------------------------------------- | ------------------------------------------------ |
| app 路由文件              | 路由、metadata、服务端取数、页面组装     | 关键词匹配、Markdown 解析实现、Bot 动画细节      |
| app/_home                 | 首页交互、会话与回答函数                 | 文件系统访问、文章正文解析、项目数据的第二份副本 |
| components/projects       | 项目卡片和目录                           | 会话状态与项目事实数据                           |
| components/writing        | 文章卡片、目录、正文                     | 首页问答规则和文件读取                           |
| components/bot            | 由表现状态驱动的角色                     | 判断访客问题或读取业务内容                       |
| lib/projects、lib/writing | 事实数据、文章校验、服务端查询和公开类型 | React 视图与路由                                 |
| components/ui             | 通用基础控件                             | 项目、文章、会话等业务判断                       |

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

文章原稿位于 `Obisidian-Open`，本站 `content` 整个目录只缓存已发布 Markdown，同步时会被整体替换。每篇候选文章须有布尔 `draft`；公开文章须有 `title`、`type`、`date`、`summary`、`slug`。`type` 只能为 Notes / Thoughts；`categories` 和 `tags` 是可选字符串数组，`aliases` 不参与本站契约。`slug` 全局唯一且就是文章 ID，使用小写英文字母、数字和连字符。`catalog.ts` 是同步脚本与服务端查询共享的解析和校验入口；目录和首页只接收公开摘要，服务端用正文生成阅读页、有界检索摘录和公开全文索引；页面 props 只传摘要，浏览器搜索时可按需获取索引中的正文数据。

`content.server.ts` 从公开文章源路径生成双链目标索引，`wiki-links.ts` 在正文 Markdown 语法树中将双链转成站内链接；目标不存在时构建失败。目录卡片和首页不接收该索引，代码块保留原文。

内容引用使用判别联合：`{ type: 'project', id } | { type: 'article', id }`。服务端校验模型引用属于本次提供的公开资料，展示时按类型在同一公开目录中解析；不存在的 ID 报错，不生成失效卡片或静默丢弃。文章 ID、分类内 slug 与项目 ID 必须唯一。

项目数据集中在 `lib/projects/data.ts`。每项用可序列化的 `icon` 名称指定图标，卡片组件映射为静态导入的 Lucide 组件；`href` 可省略，无公开链接时渲染展示卡片，有链接时保留外链和跳转箭头。Projects 入口固定展示全部项目；Notes / Thoughts 入口在服务端按日期倒序取前三篇，再随机取剩余两篇。项目与文章只有一份事实源，首页与完整目录使用同一条目和卡片组件。

Projects 目录由 `ProjectDirectory` 用单列列表装配 `ProjectCard` 的 `directory` 样式，后者共用项目数据、图标映射与链接语义，默认 `compact` 样式继续服务首页回答。目录复用现有 `ui/card.tsx`，与 Notes 使用同一细边框、主题背景和圆角，取消阴影，卡片间距为 16px。项目名作为 h2，角色位于名称下方；桌面图标占独立列，简介与标签对齐标题，小屏简介与标签横跨全部列。仅可点击项目显示箭头及悬停、键盘焦点反馈，不增加客户端状态或依赖。组件与布局依据 [shadcn Card](https://ui.shadcn.com/docs/components/radix/card) 和 [Tailwind 响应式布局](https://tailwindcss.com/docs/responsive-design)，PageShell 的说明为可选，目录 H1 继续由共享 PageTitle 统一。设计以保留风格为准，DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY 为 4 / 2 / 4，已有项目图标承担视觉识别，交互仅用颜色反馈。

### 回答接口：页面只消费回答结果

`POST /api/answer` 接受严格的 `question` 判别联合（topic 或 text）、可选的上一轮成功问答 `previous`，以及有序的 `lastShownReferences`。长度限制分别为当前问题 300、上一轮问题 300、回答 1,200 字符及最多五个引用；路由按实际流读取字节限制 16 KiB，并验证启用开关、JSON 和同源。

`lib/answer/schema.ts` 用 Zod 定义两端契约与标准入口问题。`context.server.ts` 在一次公开快照上完成最新加随机选择、关键词检索、指代定位和候选引用校验；个人简介与全部项目常驻上下文，普通正文最多三篇，每篇 900 字符。`writing/search.server.ts` 仍拥有排序和摘录算法。无文章命中不提前拒绝个人/项目问题。ID、唯一标题、明确序号及唯一对象指代可以定位；其他承接问题要求澄清。

`service.server.ts` 负责短提示词及一次 `streamText + Output.object`，使用 `@ai-sdk/deepseek` 直连，关闭推理、重试和自动续写。它把 SDK 已解析的部分对象映射为固定 ID 的 `data-answer`，不手写 SSE 或部分 JSON 解析。最终必须没有上游错误、finishReason 为 stop、schema 与候选引用均有效，才发 complete 与正常 finish；错误事件后出现合法 JSON/stop 仍失败。总超时 30 秒与 request.signal 共同传递给上游。路由只完成 HTTP 检查、调用服务和返回 SDK UI 流。

`_home/conversation.ts` 创建 SDK Chat，使用 DefaultChatTransport 将完整消息投影成短请求。只有完整业务结果、正常 stop 且无 error/abort/disconnect 才确认成功；卡片从公开目录解析，未完成结果没有卡片，也不进入短历史。`use-conversation.ts` 在共享根布局 Provider 内使用 useChat 订阅这唯一消息源，视图消息是派生结果，不另存一份会话。清空停止并替换 Chat 实例，旧回调只能影响旧实例；卸载停止请求。

会话在同标签页站内导航中保留，刷新、关闭标签页或清空重置，不使用 localStorage、sessionStorage 或服务端持久化。请求处理中离开首页仍继续接收，返回显示真实进度。页面保留完整会话，每次只上传上一轮成功问答和最近非空卡片列表。客户端历史仅辅助理解，不是作者事实。

`AnswerContent` 直接展示已到达的文字，卡片等待客户端确认正常结束后一次呈现。已删除预写回答、分类轮选、模拟分块、展示时间线和计时 Hook。HomeExperience 只在请求中禁止提交；起草、Bot、清空、阅读返回继续复用原交互。流更新不会强制抢回上滚位置，读屏不逐块重复全文。完成动作只对当前页面新完成的回答触发，返回历史不重播。

回答模块可以依赖 projects、writing 和配置，资料模块不能反向依赖 answer；浏览器只能导入 answer/schema，不能导入服务端上下文/provider。没有新增向量库、工具循环、模型基类或全站状态库。依赖依据、选择边界与验收见[实施计划](personal-agent-plan.md)，部署设置见[AI 问答设置](ai-answer-setup.md)。

### Bot 接口：业务只传状态

首页传入 mood、activityKey、completed（本轮正常展示完成）、failed（本轮回答失败）、arrival（首次进入／阅读返回），不传正文或卡片进度。正常回答固定书写，未匹配回答困惑。`home-visit.ts` 在共享 Provider 中记录导航经历：仅首次首页出现播放生成，访问笔记／随笔正文后返回播放欢迎；目录往返不重播，刷新重置。该记录与会话消息分开，不进入 useConversation。

Bot 内 `behavior.ts` 定义候选及生命周期：待机有五种完整表情，其他交互场景最多两个候选。`scene-controller.ts` 集中处理优先级、冷却、完成去重与过期事件。`use-bot-scenes.ts` 连接语义信号、主题、可见性和定时器，动作仅在接受事件时抽取，不维护待播队列。回答抢占并丢弃低优先级反馈；只有明确的 completed 信号按 activityKey 消费一次，才播放约 2.4 秒 celebrate：带着彩带转一圈、轻跳一次，落地后释放少量粒子。清空、错误及未匹配不触发，隐藏时消费并丢弃，不补播。动画计时只在 Bot 内，卡片可用时间不受其影响。倾听时拒绝待机表情与低优先级装饰动作。failed 作为一次结果信号按 activityKey 去重，基础 mood 由输入焦点和卡片关注共同决定；警报结束后恢复待机／倾听，错误文案继续显示，焦点变化不重播警报。

待机完整表情由同一场景系统调度：平静 20～30 秒后从 happy／curious／shy／proud／playful 中选一次，保持 2.5 秒再恢复平静。idle-expression 优先级最低，控制器拒绝非 idle 或已有动作时的迟到事件；Hook 在探索、输入、隐藏或卸载时清理待机定时器，并监听原生 MediaQueryList change，在减少动态效果时停止轮换。恢复后重新等待，不补播。不新增 home 状态或对外参数。生命周期依据 [React useEffect](https://react.dev/reference/react/useEffect) 与 [MDN change 事件](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/change_event)。

自动休眠仍归同一个场景系统：sleep 的 duration 为 null，表示持续至显式活动或业务状态改变；wake 只接受休眠中的苏醒，使用原引擎 `spawning` 的粒子聚拢效果约 2 秒，随后恢复待机并展开身体，后续活动不会重新开始。休眠拒绝随机表情和系统主题等背景事件，回答及明确业务状态变化可打断。`use-bot-scenes.ts` 管理 60 秒休眠的闲置计时，指针、键盘、触摸与滚轮活动重置时间，回答中暂停，后台和卸载清理。Effect Event 读取最新休眠状态，避免表情轮换重置计时，也避免鼠标每次移动都派发动画事件。减少动态效果时保留静态休眠形态，活动直接恢复。首次进入时由 reducer 初始状态直接启动 `spawning`，引擎将首帧设为聚拢中心的小形态，五颗粒子向内汇集后才展开，避免先缩小再变大；从休眠唤醒时沿用当前缩小进度，并切换到同一聚拢图层。home 和 Bot 公共接口不增加状态或参数；不恢复鼠标位置跟随。依据 [React useEffectEvent](https://react.dev/reference/react/useEffectEvent) 与 [MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)。

`bot.tsx` 使用原生 button 的 onClick 触发弹跳，兼容鼠标、触摸、Enter / Space；不维护多击、长按、拖动或手动休眠手势，也不拦截滚动。短动作有冷却，点击可打断完成动作，新回答始终抢占。依据 [MDN click 事件](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event)。

`character.tsx` 只承载 SVG 与引擎生命周期，加载完成后才启动首次出现动作。原八个引擎文件继续只在客户端加载；所有眼型播放清单排除 7、8，平静状态固定基础眼型，仅保留呼吸与眨眼，五种待机表情使用各自的眼睛与身体姿态，本站关闭情绪自带的随机花式动作。状态切换清理粒子与旋转速度，防止旧彩带残留。主题通过 CSS 变量换色，场景层监听已解析主题以触发惊讶，不重建引擎。页面隐藏时暂停绘制。动态效果偏好切换只调整 reduceMotion；主题卡片与输入框的关注由 home 合并，统一驱动倾听。其他模块不访问引擎实例或 window.GROK_*。

引擎固定使用 blob 外形，只保留本站和开发预览实际调用的状态、暂停与动态效果设置；原换形、鼠标跟随、引导轮播、自动特技和配色接口已删除。`setState(name)` 保持单一接口：从当前已渲染的眼睛轮廓平滑转向目标，打断未完成的过渡时先取当前轮廓再更改目标。表情带来的大小变化沿用原有 eyeScale 弹簧，移除随变形进度重置的额外 7% 放大，避免中断时尺寸跳变。初始化直接采用初始状态的眼型；旧 sleeping／waking 仍作为素材预览，但首页生命周期不再使用其闭眼时序。celebrate 在播放清单中固定单个表情，避免短动作末尾又随机起一轮眼型变形。业务层不传眼型参数、不增加定时器；眼睛的平滑交接继续复用已有弹簧与帧时钟，依据 [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)。

`fx.js` 的 `OverlayLayer` 统一持有形态弹簧、交叉混合、旋转和图层时钟。初始化、唤醒及动作打断都经过 `setState`，只有初始尺寸不同；`update` 推进过渡，`frame` 计算一次供身体与装饰共用的帧数据。聚拢粒子与休眠圆环使用同一活动场景策略，退出后停止装饰，身体继续平滑展开；其他图层退场沿用原时钟。`character.js` 负责角色编排，不再另行维护图层状态。数学运算统一复用 `GROK_MATH`，SVG 元素创建复用特效层已有函数，缩放数据只由 `tables.js` 维护；`motion-timing.ts` 的聚拢时长同时供场景调度和绘制使用。

庆祝被打断时把跳跃高度和转角交给现有位移、旋转弹簧收回，取消旧彩带与落地事件。书写结束先展开身体并收稳形态切换的转角，再播放完整的一圈转身与跳跃，仍在原 2.4 秒完成场景内结束。测试通过 `tests/e2e/bot-runtime.ts` 的 fixture 复用真实引擎、手动时钟、逐帧采样与资源清理，页面准备和浏览器信号操作放在 `bot-page.ts`。覆盖 43 / 54 / 192px 连续切换、30 / 60 / 120Hz 庆祝时序、入场抢占与睡眠唤醒。依据 [Playwright fixtures](https://playwright.dev/docs/test-fixtures)。

开发路由保留 24 种素材动作（含平静、五种待机表情、睡着／醒来、完成动画）与 192 / 54 / 43px 尺寸试播；实际场景通过真实首页验证。进度环已移除；雷达、口述和嗡鸣仅留在素材预览，自动嗡鸣的场景、计时器及避让冷却已删除，正常回答只用书写。该路由生产返回 404。

卡片悬停／聚焦与输入框聚焦由 home 合并为同一个 listening mood，直接复用 Bot 的基础状态；移除 explore 场景、等待计时器、冷却以及跨模块的 exploreKey 参数。TopicShortcuts 只报告鼠标悬停，卡片与 Composer 的键盘焦点在 home 的共享输入区域统一处理，用 relatedTarget 区分内部切换与真正离开，悬停与焦点不会互相清空；卡片之间和卡片到输入框的连续切换不重新启动角色状态。点击卡片时消费其关注信号，回答期间不积压装饰反馈，输入框继续允许起草下一条问题。依据 [React 焦点事件文档](https://react.dev/reference/react-dom/components/common#focusevent-handler)。

倾听姿态在引擎内使用 dtState 驱动一次约 550ms 的点头，随后只保留轻微呼吸与眨眼，眼型及视线固定。持续聚焦和输入不会重新进入状态或循环点头；重新进入倾听时可再次回应。沿用已有状态切换与帧时钟，不增加 home 信号、React 状态或计时器，减少动态效果仍由统一渲染层处理。依据 [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)按经过时间推进动作，避免不同刷新率改变动作时长。

首页介绍区与会话顶部之间的位置、尺寸过渡归 `app/_home/components/introduction.tsx` 管理：Motion 测量布局，只在 compact 状态变化时移动同一个 Bot，保持 SVG 和引擎实例连续。清空时反向返回，追问不重播，减少动态效果时立即切换。角色内部动作仍归 bot，不向会话 Hook 添加动画状态。

主题入口的共享高亮归 `app/_home/components/topic-shortcuts.tsx`：组件只保存视觉悬停与键盘焦点，以同一个 Motion layoutId 在卡片之间移动底板，跨间隙保持上一个目标，键盘焦点优先，离开后清除；点击消费高亮，禁用期间不显示。首页双列／四列与会话紧凑布局复用这一实现，颜色、边框和图标使用 Tailwind，减少动态效果时直接定位。不改变 Bot 关注接口或会话数据。视觉参考用户提供的 Visual Atlas `anchor-positioning-hover-cards`；实现依据 [Motion 共享布局动画](https://motion.dev/docs/react-layout-animations#shared-layout-animations)，复用已安装依赖，不增加坐标测量 Hook 或全局样式。

## 文章目录与阅读来源

全站横向容器由 globals.css 的 `site-container` utility 定义，导航、首页、目录和 404 共用宽度与侧边距。`site/page-shell.tsx` 的 PageFrame 统一目录页与 About Me 的纵向间距，导航下保留小屏 16px、桌面 24px 的顶部 padding，PageShell 与 DirectoryFrame 复用；首页 Bot 布局独立，正文保留独立阅读宽度。Button 的 ghost 变体集中定义灰色悬停与文字颜色，调用处仅指定尺寸，不重复覆盖配色。依据 [Tailwind 自定义 utility](https://tailwindcss.com/docs/adding-custom-styles#adding-custom-utilities) 与 [padding](https://tailwindcss.com/docs/padding)。

正文换行和语法配色限定在 `writing/article-reader.module.css`。阅读容器使用 overflow-wrap: anywhere，pre 恢复 normal 并沿用 Typography 的内部滚动；rehype-highlight 继续在服务端生成 token，CSS 按明暗主题设置配色，不增加客户端高亮器。依据 [MDN overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap) 与 [rehype-highlight CSS](https://github.com/rehypejs/rehype-highlight#css)。

两个目录由 `app/_writing/directory.tsx` 的 `WritingDirectory({ kind })` 统一装配：读取摘要，以共享规则生成静态默认页，再用 Suspense 承载 `directory.client.tsx`。后者负责 Notes 输入草稿与检索状态，以及两目录的 URL、分页和 DOM 定位；不重复筛选、排序或分页。Thoughts 查询由共享规则规范为仅含页码，因此始终同步浏览摘要，不调用搜索。两页面继续导出各自 metadata，标题下说明可省略。

`lib/writing/directory.ts` 是目录规则的唯一入口：规范化查询、统计当前栏目的元数据、按条件取交集、日期排序、固定每页 10 条。readDirectoryQuery、directoryHref 与 browseDirectory 共用栏目的查询规则：Notes 支持 q/category/tag/page，Thoughts 只接受 page，输入中其余条件不影响结果也不进入阅读返回链接。无搜索词时同步处理摘要；有搜索词时由 `search.client.ts` 懒加载 Pagefind，先过滤全部命中，再用同一分页规则只读取当前页最多 10 个句柄的 data()。Pagefind 的内部 ID 不能当文章 ID；通过 meta.articleId 校验并映射现有摘要，类型或 URL 不符整页失败。data() 可能包含完整搜索文本，并非只有短摘录。Agent 的 search.server.ts 仍只负责回答中的前三篇摘录。

`components/writing/article-directory.tsx` 展示 DirectoryPage，Notes 用单列卡片与搜索骨架；Thoughts 分页后按年月分组，桌面与小屏均为单列归档，最左侧细竖线连接月份节点。日期使用 time 的 YYYY-MM datetime，完整英文月份位于文章上方，使用 24px / 26px 中等字重作为视觉锚点，年份以 12px 等宽小字跟在右侧。条目只呈现 16px 常规字重标题与 14px 次要颜色摘要，内容限制行宽并提供悬停与焦点反馈。月份之间留出 36px / 40px 间距，组内条目沿同一边缘排列。依据 [HTML time](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time) 与 [Tailwind 响应式布局](https://tailwindcss.com/docs/responsive-design)。

`directory-controls.tsx` 的 DirectoryFrame 复用 PageFrame / PageTitle：Notes 提供搜索与侧栏布局；Thoughts 只输出标题和列表，不渲染搜索、筛选及标题分隔线。共享分页只在超过一页时出现，Thoughts 不使用横向分隔线。筛选、搜索、已选条件与分页控件不持有业务状态。Notes 桌面两个筛选都展开，小屏复用 ui/select.tsx 的 shadcn / Radix Select，库承担交互、定位和焦点管理，本站适配主题与点击区域。依据 [shadcn Select](https://ui.shadcn.com/docs/components/radix/select) 与 [Radix Select](https://www.radix-ui.com/primitives/docs/components/select)。ArticleCard 用显式 layout 区分 Notes 目录和首页卡片，共用事实数据、链接和阅读来源。

URL 是已提交条件的事实源，草稿不覆盖历史导航。原生 History 与 useSearchParams 同步；连续输入 replace，筛选、翻页、清空 push。输入法期间不提交半成品，筛选提交合并当前草稿，Back/Forward 取消旧定时器。一个请求代次共同约束列表、错误、页码规范化和定位，旧搜索不能更改新状态。静态 HTML 仍是默认首屏，带参数直达由客户端恢复，不能理解为按条件 SSR。sitemap 保留全部文章发现路径。

`lib/writing/reading-location.ts` 集中编码和解析结构化 ReadingOrigin：conversation 或 directory + query。卡片与正文页首共享此契约；返回目录路径由文章 kind 推导，锚点由 ID 推导，不接受自由 returnTo。`app/_writing/article-return-link.tsx` 读取当前会话是否存在，然后调用纯来源规则；首页只传 origin 字面量，不导入目录内部实现。从搜索结果返回须等待条目挂载再一次性滚动并恢复焦点，用户操作或新导航取消旧定位；正文双链与页尾完整目录仍不携带来源。

构建使用固定版本 Pagefind Node API，从共享 catalog.ts 的公开内容生成自定义记录，过滤字段是 kind/category/tag。`scripts/index-writing.ts` 在专属临时目录完成后替换 public/pagefind，任何 errors 阻止启动或构建；predev/prebuild 调用唯一 index:writing 命令，同步脚本不重复生成。生成物忽略 Git 与 ESLint。本地内容更新后重启服务并刷新；不引入 watcher、外层版本 manifest 或跨部署旧标签页一致性协议。公开索引不可加载时明确提示刷新。

索引 language 为 zh，根 HTML 声明 zh-CN，英文界面局部使用 en，文章内容保留中文声明。临时真实试验发现根语言 en 会对连续中文词扩大匹配，语言策略需在真实页面一并验证。依赖依据：[Pagefind Node API](https://pagefind.app/docs/node-api/)、[Search API](https://pagefind.app/docs/api/)、[多语言说明](https://pagefind.app/docs/multilingual/)；Next 行为按仓库安装版本文档核对。

## Next.js 的服务端与客户端约束

- 路由和正文默认在服务端执行；交互集中在首页体验和 Bot 等确有需要的客户端入口。
- `content.server.ts` 使用 `server-only` 防止被客户端导入，文件读取和 Markdown 解析不会进入首页浏览器包。
- 服务端给首页传递的是可序列化的公开摘要，不传正文、文件路径或草稿；模型只收到本次选中的文章资料。
- `article-card.tsx` 只依赖公开数据类型、基础组件和链接组件，可供首页交互与服务端目录共同使用。
- 文章打开动效由 `article-card-link.tsx` 的小型客户端入口与服务端 `article-reader.tsx` 的标题区共享 React ViewTransition 名称；只给实际点击的卡片命名，避免会话中重复文章冲突。正文解析仍在服务端，浏览器不支持视图过渡或用户要求减少动态效果时直接导航。依据 [Next.js 视图过渡指南](https://nextjs.org/docs/app/guides/view-transitions)。
- 不用一个混合导出的 `index.ts` 同时暴露内容查询、正文解析与客户端卡片。服务端查询入口与浏览器可用入口保持明确分离。
- `globals.css` 仅保留主题定义、基础样式、全站容器 utility 和必要关键帧。业务布局使用 Tailwind，shadcn 提供基础组件，不承担问答或内容规则。

主题使用 next-themes，由根布局组装 `components/site/theme-provider.tsx`，默认跟随系统，页头 `theme-toggle.tsx` 切换明暗。只有手动主题偏好以 `simweb-theme` 写入 localStorage，会话仍不持久化。首屏脚本在绘制前设置 html 的主题 class，按钮的图标和可访问名称用 CSS 明暗变体切换，避免服务端与客户端根据不同主题渲染不同 DOM。Bot 的渲染层通过现有 inkFlat / eyeColor 参数引用局部 CSS 变量；场景层监听主题变化，换色不重建引擎。文章正文通过 Typography 暗色变体和语义颜色适配。

## 修改与验证如何集中

问题规范化、长度上限和两端回答契约统一在 `lib/answer/schema.ts`，AI 开关统一在 `config/ai.server.ts`；正文两类路由共用 `app/_writing/article-route.tsx`。Projects / About 使用 `components/site/page-shell.tsx`，Notes / Thoughts 由 DirectoryFrame 分别管理搜索侧栏与极简时间轴外壳。检索与页面查询从 `content.server.ts` 的同一入口读取当前公开内容。

`lib/browser-signals.ts` 使用 React useSyncExternalStore 统一动态效果偏好与页面可见性订阅。Character、场景 Hook、介绍布局和主题高亮全部消费该入口；引擎暂停、场景取消、布局变化仍各归其生命周期，不重建引擎。已安装 Motion 的 useReducedMotion 不会在偏好改变后更新组件，因此仅保留 Motion 的布局动画能力。CSS 媒体规则继续处理 CSS 动画。

| 未来变更                 | 主要修改位置                           | 验证                               |
| ------------------------ | -------------------------------------- | ---------------------------------- |
| 增加项目或改仓库链接     | lib/projects/data.ts                   | 目录与回答出现相同条目和目的地     |
| 调整笔记卡片样式         | components/writing/article-card.tsx    | 首页与两类目录同步变化             |
| 新增或撤下文章           | 源仓库 frontmatter + 内容同步          | 元数据校验、目录与直接正文访问     |
| 调整模型上下文或问答范围 | lib/answer/{context,service}.server.ts | 有界上下文、拒答、真实流与有效引用 |
| 改 Bot 动作或更换引擎    | components/bot 内部                    | 状态映射、卸载、键盘/减少动态效果  |
| 调整顶部菜单             | config/site.ts + components/site       | 顶部点击进入目录而非触发问答       |

ESLint 的 `no-restricted-imports` 已固化关键依赖方向，并以 `server-only` 检查服务端模块误用。架构测试验证别名与相对路径导入限制。测试命令递归发现 `src` 内的模块测试及根 `tests` 中的工具测试；`.client.test.ts` 使用普通 React 条件，其余保持 react-server 条件，端到端测试独立运行。模块测试围绕对外行为编写；端到端测试验证“首页提问 → 笔记卡片 → 正文 → 返回首页”，以及会话累积、刷新清空和移动端。
