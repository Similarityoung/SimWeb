# 个人站 2.0 前端架构方案

状态：四模块结构已实现；会话生命周期、字段来源、引用校验与模块导入约束已落实，完整阅读返回流程已有桌面和移动端验证。

## 研究依据

已核对 [Next.js 官方目录组织](https://nextjs.org/docs/app/getting-started/project-structure)及[服务端与客户端组件](https://nextjs.org/docs/app/getting-started/server-and-client-components)说明，并阅读两套实际源码：

- [Bulletproof React 的 Next 路由](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/src/app/app/discussions/page.tsx)负责预取与组装，业务列表、数据查询及 hook 在对应 feature 内。参考其职责划分与导入约束；不引入本站不需要的认证、数据查询框架和缓存设施，也不照搬其禁止所有跨 feature 依赖的规则。
- [Lee Robinson 博客模板的正文呈现](https://github.com/leerob/next-mdx-blog/blob/fd03371e3c90481a8447904e1b548e4c0327b7db/mdx-components.tsx)集中维护文章元素样式，内容页面独立。借鉴内容与呈现分离，不因此将现有 Markdown 改为 MDX。

完整研究、固定提交链接和版本适用范围见 [架构研究记录](research/frontend-architecture.md)。以下四模块方案为结合本站需求形成的建议，不是这些仓库逐字采用的结构。

## 目标与输入输出

本次让首页会话、内容目录、正文阅读和 Bot 能各自迭代。输入为个人资料、项目条目、已选中的现有 Markdown 文章、预写回答，以及原型 Bot 引擎；输出为首页、三个内容目录、文章正文和 About Me 页面。原始文章保留，先用少量明确非草稿的文章完成开发。

已有原型的 `main.jsx` 同时管理输入、会话、等待状态、定时器、滚动、Bot 反馈、导航与整页视图；`content.js` 同时混合主题导航、问答模板与内容链接。2.0 按这些职责实际变化的位置组织代码。

## 推荐目录

```text
content/
  writing/                     Markdown 文章源文件

src/
  app/
    layout.tsx                 字体、全站外壳、读取公开摘要并承载会话 Provider
    globals.css                主题变量、基础样式与必要动画
    page.tsx                   组装首页
    projects/page.tsx          项目完整目录
    notes/page.tsx             技术笔记目录
    notes/[slug]/page.tsx      技术笔记正文
    thoughts/page.tsx          随笔目录
    thoughts/[slug]/page.tsx   随笔正文
    about/page.tsx             静态个人介绍
    dev/bot/page.tsx           仅开发环境的 Bot 试播入口，生产环境返回 404

  features/
    home/
      home-experience.tsx      组装首页交互区
      use-conversation.ts     提问、累积会话、等待、清空与请求生命周期
      conversation-provider.tsx 共享布局中的会话宿主及首页导航经历
      home-visit.ts           首次进入与阅读返回的纯状态转换
      answer-question.ts      统一回答函数，首版查询预写内容
      answer-chunks.ts        保留字词与 Unicode 的展示分块
      answer-presentation.ts  阶段、分块与逐张卡片的时间线，纯函数
      use-answer-presentation.ts 最新回答的唯一展示调度与取消
      presets.ts              预写问答与主题匹配规则
      types.ts                问题、回答、消息与内容引用
      components/             介绍区、主题入口、会话记录、回答分块展示、输入框
      answer-question.test.ts 问答模块的行为验证

    projects/
      data.ts                 项目条目、本人角色与明确跳转目的地
      types.ts                项目数据契约
      project-card.tsx        首页和目录共用的项目卡片
      project-directory.tsx  项目目录视图

    writing/
      entries.ts              开发样本清单、slug、文章种类与摘要
      content.server.ts       读取、校验、解析 Markdown；提供目录与正文查询
      types.ts                ArticleSummary 与文章种类等公开数据契约
      article-card.tsx        首页和目录共用的标题摘要卡片
      article-directory.tsx  Notes / Thoughts 共用的目录视图
      article-reader.tsx      服务端 Markdown 正文渲染
      content.test.ts         收录范围、草稿排除和正文查询验证

    bot/
      bot.tsx                 对外 React 入口，仅接收表现状态等必要参数
      behavior.ts             每个场景的 1～2 个候选、时长、优先级与冷却
      scene-controller.ts     动作裁决纯函数，无队列
      use-bot-scenes.ts       场景信号、计时器、主题和可见性订阅
      character.tsx           内部 SVG 宿主、引擎生命周期与场景切换
      runtime.client.ts       浏览器引擎加载与类型
      bot-preview.tsx         开发用候选动作与尺寸试播
      vendor/                 八个原引擎文件及来源说明，仅由本模块访问

  components/
    ui/                       shadcn 基础组件
    site/                     全站导航、主题 Provider 与明暗切换等跨页面外壳
  config/
    site.ts                   站点身份、公开个人资料与导航定义
  lib/
    utils.ts                  cn 等与具体业务无关的纯工具

tests/
  e2e/                        跨页导航、问答累积和阅读路径
```

只在实际出现对应职责时创建文件。`features` 内按业务放置视图、状态、数据与验证；不另建全站的 `hooks`、`services` 或通用 `types` 目录来分散同一业务。About Me 首版是静态内容，可留在路由页面，不为了目录对称另设业务模块。

## 模块职责与依赖

| 模块 | 对外提供 | 不应承担 |
| --- | --- | --- |
| app | 路由、metadata、服务端取数、页面组装 | 关键词匹配、Markdown 解析实现、Bot 动画细节 |
| home | 首页交互、会话与回答函数 | 文件系统访问、文章正文解析、项目数据的第二份副本 |
| projects | 项目条目、卡片和目录 | 会话状态与 Bot 动作 |
| writing | 文章查询、摘要卡片、正文渲染 | 首页问答规则 |
| bot | 由表现状态驱动的角色 | 判断访客问题或读取业务内容 |
| components/ui | 通用基础控件 | 项目、文章、会话等业务判断 |

依赖方向：

```text
app ──> home ──> projects 的卡片 / 公开类型
 │       ├────> writing 的卡片 / 公开类型
 │       └────> bot
 ├────> projects 的数据 / 目录
 └────> writing 的服务端查询 / 目录 / 正文

业务视图 ──> components/ui + lib
```

`projects`、`writing`、`bot` 不反向引用 `home`，业务模块不引用 `app`。这里允许 `home` 作为组合模块使用另外三个模块的明确公开入口；不为追求禁止所有跨模块 import 而额外添加转发层。模块内部文件不作为其他模块随意引用的公共接口。

## 三个关键接口

### 内容接口：同一条内容，只维护一次

文章源文位于 `content/writing`。标题、日期、标签、draft 和正文只从原文读取；样本清单只记录稳定 ID、文件名、所属 Notes / Thoughts、slug 和用于卡片的摘要。服务端查询模块负责校验收录项和 `draft: false`，只给目录和首页返回公开摘要；完整正文只用于正文页。收录清单不重复维护标题和日期。

内容引用使用判别联合：`{ type: 'project', id } | { type: 'article', id }`。回答生成前校验预写模板中的引用，展示时按类型在同一公开目录中解析；不存在的 ID 报错，不生成失效卡片或静默丢弃。文章 ID、分类内 slug 与项目 ID 必须唯一。

项目数据集中在 `projects/data.ts`。问答模板只引用项目或文章 ID，不再复制标题、摘要和链接。首页回答与完整目录使用同一条目和同一个卡片组件，只有布局密度不同。

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

自动睡眠仍归同一个场景系统：sleep 的 duration 为 null，表示持续至显式活动或业务状态改变；wake 只接受睡眠中的唤醒，播放 3 秒，后续活动不会重新开始。睡眠拒绝随机表情和系统主题等背景事件，回答及明确业务状态变化可打断。`use-bot-scenes.ts` 管理 60 秒睡眠的闲置计时，指针、键盘、触摸与滚轮活动重置时间，回答中暂停，后台和卸载清理。Effect Event 读取最新睡眠状态，避免表情轮换重置计时，也避免鼠标每次移动都派发动画事件。减少动态效果时保留静态闭眼，活动直接恢复。home 和 Bot 公共接口不增加状态或参数；不恢复鼠标位置跟随。依据 [React useEffectEvent](https://react.dev/reference/react/useEffectEvent) 与 [MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)。

`bot.tsx` 使用原生 button 的 onClick 触发弹跳，兼容鼠标、触摸、Enter / Space；不维护多击、长按、拖动或手动休眠手势，也不拦截滚动。短动作有冷却，点击可打断完成动作，新回答始终抢占。依据 [MDN click 事件](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event)。

`character.tsx` 只承载 SVG 与引擎生命周期，加载完成后才启动首次出现动作。原八个引擎文件继续只在客户端加载；所有眼型播放清单排除 7、8，平静状态固定基础眼型，仅保留呼吸与眨眼，五种待机表情使用各自的眼睛与身体姿态，本站关闭情绪自带的随机花式动作。状态切换清理粒子与旋转速度，防止旧彩带残留。主题通过 CSS 变量换色，场景层监听已解析主题以触发惊讶，不重建引擎。页面隐藏时暂停绘制。Character 初始化时固定关闭 followPointer，动态效果偏好切换只调整 reduceMotion，不重新启用跟随；主题卡片与输入框的关注由 home 合并，统一驱动倾听。其他模块不访问引擎实例或 window.GROK_*。

引擎的 `setState(name)` 保持单一接口：从当前已渲染的眼睛轮廓平滑转向目标，打断未完成的过渡时先取当前轮廓再更改目标。表情带来的大小变化沿用原有 eyeScale 弹簧，移除随变形进度重置的额外 7% 放大，避免中断时尺寸跳变。初始化直接采用初始状态的眼型；睡眠／醒来沿用 pose 中与眼睑同步的时序。celebrate 在播放清单中固定单个表情，避免短动作末尾又随机起一轮眼型变形。业务层不传眼型参数、不增加定时器；眼睛的平滑交接继续复用已有弹簧与帧时钟，依据 [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)。

开发路由保留 24 种素材动作（含平静、五种待机表情、睡着／醒来、完成动画）与 192 / 54 / 43px 尺寸试播；实际场景通过真实首页验证。进度环已移除；雷达、口述和嗡鸣仅留在素材预览，自动嗡鸣的场景、计时器及避让冷却已删除，正常回答只用书写。该路由生产返回 404。

卡片悬停／聚焦与输入框聚焦由 home 合并为同一个 listening mood，直接复用 Bot 的基础状态；移除 explore 场景、等待计时器、冷却以及跨模块的 exploreKey 参数。TopicShortcuts 只报告鼠标悬停，卡片与 Composer 的键盘焦点在 home 的共享输入区域统一处理，用 relatedTarget 区分内部切换与真正离开，悬停与焦点不会互相清空；卡片之间和卡片到输入框的连续切换不重新启动角色状态。点击卡片时消费其关注信号，回答期间不积压装饰反馈，输入框继续允许起草下一条问题。依据 [React 焦点事件文档](https://react.dev/reference/react-dom/components/common#focusevent-handler)。

倾听姿态在引擎内使用 dtState 驱动一次约 550ms 的点头，随后只保留轻微呼吸与眨眼，眼型及视线固定。持续聚焦和输入不会重新进入状态或循环点头；重新进入倾听时可再次回应。沿用已有状态切换与帧时钟，不增加 home 信号、React 状态或计时器，减少动态效果仍由统一渲染层处理。依据 [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)按经过时间推进动作，避免不同刷新率改变动作时长。

首页介绍区与会话顶部之间的位置、尺寸过渡归 `home/components/introduction.tsx` 管理：Motion 测量布局，只在 compact 状态变化时移动同一个 Bot，保持 SVG 和引擎实例连续。清空时反向返回，追问不重播，减少动态效果时立即切换。角色内部动作仍归 bot，不向会话 Hook 添加动画状态。

主题入口的共享高亮归 `home/components/topic-shortcuts.tsx`：组件只保存视觉悬停与键盘焦点，以同一个 Motion layoutId 在卡片之间移动底板，跨间隙保持上一个目标，键盘焦点优先，离开后清除；点击消费高亮，禁用期间不显示。首页双列／四列与会话紧凑布局复用这一实现，颜色、边框和图标使用 Tailwind，减少动态效果时直接定位。不改变 Bot 关注接口或会话数据。视觉参考用户提供的 Visual Atlas `anchor-positioning-hover-cards`；实现依据 [Motion 共享布局动画](https://motion.dev/docs/react-layout-animations#shared-layout-animations)，复用已安装依赖，不增加坐标测量 Hook 或全局样式。

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
| 增加项目或改仓库链接 | projects/data.ts | 目录与回答出现相同条目和目的地 |
| 调整笔记卡片样式 | writing/article-card.tsx | 首页与两类目录同步变化 |
| 增加开发样本 | writing/entries.ts + 原 Markdown | 非草稿校验、目录与直接正文访问 |
| 调整问答匹配或接入 AI | home/answer-question.ts 及其内部实现 | 从问题得到正确回答和有效内容引用 |
| 改 Bot 动作或更换引擎 | bot 内部 | 状态映射、卸载、键盘/减少动态效果 |
| 调整顶部菜单 | config/site.ts + components/site | 顶部点击进入目录而非触发问答 |

ESLint 的 `no-restricted-imports` 已固化关键依赖方向，并以 `server-only` 检查服务端模块误用。架构测试验证别名与相对路径导入限制。测试命令递归发现 `src` 内的模块测试及根 `tests` 中的工具测试，端到端测试独立运行。模块测试围绕对外行为编写；端到端测试验证“首页提问 → 笔记卡片 → 正文 → 返回首页”，以及会话累积、刷新清空和移动端。

## 当前工作区状态

按后续反馈恢复完成转身时的彩带：复用引擎原有旋转特效，停转后自然收尾，落地单独释放粒子。37 项模块测试、lint、类型检查、格式检查、构建及 18 项相关桌面／手机端到端测试通过，包含两个旋转方向、彩带／粒子阶段中断清理和眼睛裁剪；实际检查 1440px 与 390px 首页。

综合审查见 [2026-09-22 审查记录](reviews/frontend-review-2026-09-22.md)。本轮修复失败后基础心情未恢复的问题：failed 仅触发一次短警报，结束后恢复待机／倾听。37 项模块／架构测试、88 项桌面／手机回归及 lint、类型、格式、构建检查通过；新增眼睛裁剪检查，无职责越界或复制业务实现的确认问题。无效文章的 Next 内部日志已记录，HTTP 404 与页面行为正常。

Next.js 页面、四个业务模块与共享组件已完成首版实现，Bot 引擎隔离在 bot/vendor，只在浏览器加载。原文没有修改，开发版只读取 4 篇明确非草稿的选稿。`npm run check` 包含 lint、类型检查、37 项模块及架构测试和生产构建；`npm run test:e2e` 包含桌面与手机共 90 项用例，覆盖原有阅读与会话路径、Bot 移动、多场景与点击、正常回答固定书写及完成转身、跳跃与粒子、五种完整待机表情轮换与抢占、自动睡眠／单次唤醒、逐张卡片和无进度环、焦点优先级、取消旧调度、减少动态效果下静止 SVG 与持续文字输出、主题切换，以及开发预览的生产隔离。

完成动作本轮验证：`check`（36 项模块／架构测试、lint、类型检查和生产构建）及格式检查通过。30 项相关桌面／手机端到端用例首轮通过 29 项；短暂粒子的取消检查改为逐帧等待，桌面和手机复跑均通过。已验证先转一圈、再跳一次、落地后才产生粒子，追问／清空立即清理，减少动态效果下角色静止。实际检查 1440px 与 390px 首页，无横向溢出；截图为 `.local/qa/bot-complete-particles-{preview,desktop,mobile}.png`。改动限于 Bot 配置、内部引擎和预览及相关验证，home 与公共接口不变。

自动睡眠本轮验证：`check`（34 项模块／架构测试及生产构建）与格式检查通过；56 项 Bot 桌面／手机用例首轮 55 项通过，旧回答用例增加“首次出现结束”的等待条件后，4 项对应两端用例复跑通过。新增 12 项端到端测试覆盖 60 秒阈值、活动重置、持续睡眠、单次唤醒、输入／回答接管、后台与导航清理及减少动态效果。实际检查 1440px 睡眠和 390px 睡眠／触摸唤醒，无横向溢出；截图为 `.local/qa/bot-auto-sleep-desktop.png`、`bot-auto-{sleep,wake}-mobile.png`。桌面实测使用真实 60 秒等待；手机视觉检查仅缩短独立测试标签页的等待，完整计时由生产端到端测试验证。本轮实现集中在 bot 配置、控制器、Hook 与预览，没有修改 home、公共接口或引擎。

原型审查后的视觉取舍见 [specification](frontend-refactor-spec.md#原型审查后的取舍2026-09-21)。输入草稿在首页视图统一管理，Composer 接收 value / onChange；useConversation 继续只管理消息与请求。介绍区自己测量文字高度来控制 Bot 比例，共享高亮采用 Tailwind 选择器，均未增加全局状态或业务模块依赖。

2026-09-21 验证：上述检查全部通过，格式检查通过；浏览器实际检查首页、累积回答、目录与正文，长回答保留最新问题在可视区。加入 Bot 布局动画后，本地生产构建的 Lighthouse 移动端两次测量 Performance 为 86 / 98，LCP 为 4.3 / 2.3 秒；第二次在结束其他浏览器检查后单独执行。两次 Accessibility / Best Practices / SEO 均为 100，CLS 均为 0。此前未加布局动画的测量 Performance 为 100、LCP 1.9 秒；新依赖使总传输量由约 291 KiB 增至 331 KiB。本地测量有波动，不代表线上部署后的性能保证。截图与报告位于被忽略的 `.local/qa/`。

回答分块展示完成后，11 项模块测试、22 项端到端测试、lint、类型检查、格式检查及生产构建全部通过；桌面和手机浏览器检查了输出中与完成后的状态。此次本地 Lighthouse 移动端测量 Performance 99，其余 Accessibility / Best Practices / SEO 均为 100，LCP 2.1 秒、CLS 0，报告为 `.local/qa/lighthouse-answer-stream.json`。

暗色主题完成后，原有 22 项交互用例与新增 6 项主题用例均已验证通过，模块测试、lint、类型检查、格式检查及构建通过。实际检查了桌面/手机暗色首页、回答卡片、文章和代码块；暗色文字与背景/卡片的最低配色对比度约 6.67:1。此次本地 Lighthouse 移动端测量 Performance 97，Accessibility / Best Practices / SEO 均为 100，LCP 2.5 秒、CLS 0，报告为 `.local/qa/lighthouse-dark-theme.json`。

2026-09-22 场景编排验证：16 项模块测试、38 项桌面／手机端到端测试、lint、类型检查、格式检查及生产构建通过。浏览器逐一试播 16 种候选，确认基本外形保持 blob、无无效 SVG 数据；对照 25 种眼型定位并排除 7、8。Notes 三张卡片约 4.5 秒显示完成，截图位于 `.local/qa/bot-scene-*` 与 `bot-preview-*`。本轮未重新测量 Lighthouse，历史性能报告不代表此次变更的测量结果。

同日动作收敛后验证：模块测试、lint、类型检查、格式检查及构建通过；端到端首轮 36 项通过，2 项因测试轮询错过 300ms 单卡窗口失败，改为逐帧观察后两项均通过。桌面 1440px 与手机 390px 实测每轮只有一个输出动作，结束后回到 idle；无进度环、无横向溢出，开发预览剩余 15 种候选。

2026-09-22 多场景实现：26 项模块测试通过；端到端首轮 52 项通过，闲置用例因模拟时钟晚于页面计时器安装而失败，修正后桌面／手机均通过；新增故障注入覆盖警报与后续提问，修正测试中与 Next 路由播报器冲突的 alert 选择范围后两项通过，合计 56 项覆盖。浏览器实际验证桌面 1440px、手机 390px、明暗主题及角色手势。截图为 `.local/qa/bot-many-scenes-*`。

生产构建首页初始 JS 的逐文件 gzip 合计从 241,226 增至 243,659 字节（约 +2.4 KiB，不含异步引擎、CSS 与字体），没有新增依赖。构建仍将首页、目录与收录文章预生成；Bot 与预写问答在客户端执行，点击不调用模型或 Vercel Function。Vercel 通过 [CDN 缓存静态资源](https://vercel.com/docs/caching/cdn-cache)，真实线上首屏与设备绘制性能需部署后测量，本轮未部署或重测 Lighthouse。

2026-09-22 点击与完成彩带收敛：28 项模块／架构测试、58 项桌面／手机端到端测试、lint、类型检查、格式检查和生产构建全部通过。浏览器检查了 1440px 与 390px、明暗主题、庆祝彩带和待机眼型轮换；未出现横向溢出。新增完成信号不改变卡片可用时间，删除多手势 Hook，未增加依赖。截图位于 `.local/qa/bot-ribbons-*` 与 `bot-idle-expressions.png`。

随后按用户试播反馈，将完成彩带改为约 2 秒 humming，主体保持正面轻晃；仅调整 Bot 场景配置及相关说明／验证。28 项模块测试、lint、类型检查、格式检查和构建通过。30 项 Bot 桌面／手机用例首轮 29 项通过；点击用例因操作后才安装模拟时钟影响冷却时间，改为导航前安装后两端复跑通过。实际检查截图为 `.local/qa/bot-complete-humming-*`。
