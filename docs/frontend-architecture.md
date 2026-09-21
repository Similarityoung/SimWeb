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
  posts/                       原始 Markdown，继续保留

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

  features/
    home/
      home-experience.tsx      组装首页交互区
      use-conversation.ts     提问、累积会话、等待、清空与请求生命周期
      conversation-provider.tsx 共享布局中的会话宿主，生命周期与当前标签页一致
      answer-question.ts      统一回答函数，首版查询预写内容
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
      runtime.client.ts       浏览器引擎加载与类型；生命周期在 bot.tsx
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

文章源文继续位于 `content/posts`。标题、日期、标签、draft 和正文只从原文读取；样本清单只记录稳定 ID、文件名、所属 Notes / Thoughts、slug 和用于卡片的摘要。服务端查询模块负责校验收录项和 `draft: false`，只给目录和首页返回公开摘要；完整正文只用于正文页。收录清单不重复维护标题和日期。

内容引用使用判别联合：`{ type: 'project', id } | { type: 'article', id }`。回答生成前校验预写模板中的引用，展示时按类型在同一公开目录中解析；不存在的 ID 报错，不生成失效卡片或静默丢弃。文章 ID、分类内 slug 与项目 ID 必须唯一。

项目数据集中在 `projects/data.ts`。问答模板只引用项目或文章 ID，不再复制标题、摘要和链接。首页回答与完整目录使用同一条目和同一个卡片组件，只有布局密度不同。

### 回答接口：页面只消费回答结果

外部形状为 `answerQuestion(question, catalog, signal?): Promise<Answer>`。请求包含问题和可选的明确主题，catalog 是共享的公开摘要，signal 用于取消请求；回答包含简短文本和内容引用。首版只实现本地预写问答。

用户已明确要求未来 AI 扩展，因此保留这一个稳定入口；未来若接模型，增加服务端调用并在此处接入。当前不建设 provider 插件体系、模型基类、依赖注入容器、后台配额系统或流式协议。若未来流式交互改变产品契约，再单独设计该扩展。

`use-conversation.ts` 仅负责消息、请求状态、提交与清空。匹配和内容引用属于回答函数；滚动、输入焦点和卡片排版属于视图；动作及动画生命周期属于 Bot。首版不增加全站状态库。

会话由 `home` 内的 React Context Provider 管理，在所有站内页面共享的根布局中挂载。通过 Next Link 在同一标签页切换目录和正文后返回首页，会话仍在；完整刷新、关闭标签页或主动清空会重置会话。不使用 localStorage、sessionStorage 或服务端存储。请求处理中离开首页仍由共享宿主持有请求；清空或宿主卸载时取消当前请求，迟到的结果不得恢复已清空消息。

预写回答的分块输出是首页的展示行为：`AnswerContent` 负责文本块追加、完成后展示内容卡片以及定时器清理；`answer-chunks.ts` 仅生成本地模拟片段和节奏，不是模型 tokenizer 或网络协议实现。完整 Answer 仍由回答函数一次返回，useConversation 不管理输出光标、分块进度或展示等待。HomeExperience 记录本次挂载前已有的消息 ID，使导航返回时历史回答不重播；快速追问时旧回答补全，最新回答分块显示。减少动态效果不跳过文本分块，只停用装饰过渡。

### Bot 接口：业务只传状态

首页将交互状态映射为 idle / listening / thinking 等表现状态。Bot 模块内部处理八个文件的加载顺序、浏览器全局对象、SVG、pointer、动画帧、减少动态效果、页面可见性和销毁。其他模块不访问引擎实例或 `window.GROK_*`。

首页介绍区与会话顶部之间的位置、尺寸过渡归 `home/components/introduction.tsx` 管理：Motion 测量布局，只在 compact 状态变化时移动同一个 Bot，保持 SVG 和引擎实例连续。清空时反向返回，追问不重播，减少动态效果时立即切换。角色内部动作仍归 bot，不向会话 Hook 添加动画状态。

## Next.js 的服务端与客户端约束

- 路由和正文默认在服务端执行；交互集中在首页体验和 Bot 等确有需要的客户端入口。
- `content.server.ts` 使用 `server-only` 防止被客户端导入，文件读取和 Markdown 解析不会进入首页浏览器包。
- 服务端给首页传递的是可序列化的公开摘要，不传正文、文件路径、未选中的文章或草稿。
- `article-card.tsx` 只依赖公开数据类型、基础组件和链接组件，可供首页交互与服务端目录共同使用。
- 不用一个混合导出的 `index.ts` 同时暴露内容查询、正文解析与客户端卡片。服务端查询入口与浏览器可用入口保持明确分离。
- `globals.css` 仅保留主题定义、基础样式和必要关键帧。业务布局使用 Tailwind，shadcn 提供基础组件，不承担问答或内容规则。

主题使用 next-themes，由根布局组装 `components/site/theme-provider.tsx`，默认跟随系统，页头 `theme-toggle.tsx` 切换明暗。只有手动主题偏好以 `simweb-theme` 写入 localStorage，会话仍不持久化。首屏脚本在绘制前设置 html 的主题 class，按钮的图标和可访问名称用 CSS 明暗变体切换，避免服务端与客户端根据不同主题渲染不同 DOM。Bot 通过现有 inkFlat / eyeColor 参数引用局部 CSS 变量，不依赖主题 Context，也不因换色重建引擎。文章正文通过 Typography 暗色变体和语义颜色适配。

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

Next.js 页面、四个业务模块与共享组件已完成首版实现，Bot 引擎隔离在 bot/vendor，只在浏览器加载。原文没有修改，开发版只读取 4 篇明确非草稿的选稿。`npm run check` 包含 lint、类型检查、11 项模块及架构测试和生产构建；`npm run test:e2e` 包含桌面与手机共 28 项用例，包括草稿清空、长连续字符换行、Bot 连续移动及返回、回答分块追加、卡片显示时机、追问和清空中断、导航返回不重播、减少动态效果，以及主题切换、系统跟随、偏好保留、Bot 连续性和 320px 导航的验证。

原型审查后的视觉取舍见 [specification](frontend-refactor-spec.md#原型审查后的取舍2026-09-21)。输入草稿在首页视图统一管理，Composer 接收 value / onChange；useConversation 继续只管理消息与请求。介绍区自己测量文字高度来控制 Bot 比例，共享高亮采用 Tailwind 选择器，均未增加全局状态或业务模块依赖。

2026-09-21 验证：上述检查全部通过，格式检查通过；浏览器实际检查首页、累积回答、目录与正文，长回答保留最新问题在可视区。加入 Bot 布局动画后，本地生产构建的 Lighthouse 移动端两次测量 Performance 为 86 / 98，LCP 为 4.3 / 2.3 秒；第二次在结束其他浏览器检查后单独执行。两次 Accessibility / Best Practices / SEO 均为 100，CLS 均为 0。此前未加布局动画的测量 Performance 为 100、LCP 1.9 秒；新依赖使总传输量由约 291 KiB 增至 331 KiB。本地测量有波动，不代表线上部署后的性能保证。截图与报告位于被忽略的 `.local/qa/`。

原 Hugo 的 `public/` 是被忽略且含本地生成页面的构建产物，已移至 `/tmp/simweb-hugo-generated.YW3g0q/public` 保留，以免 Next.js 把它作为公开静态文件提供。旧 Hugo 模板和配置不参与新构建，已有 PaperMod 子模块状态保持原样。已配置 Vercel 构建入口，尚未执行线上部署；正式发布内容范围留待确认。

回答分块展示完成后，11 项模块测试、22 项端到端测试、lint、类型检查、格式检查及生产构建全部通过；桌面和手机浏览器检查了输出中与完成后的状态。此次本地 Lighthouse 移动端测量 Performance 99，其余 Accessibility / Best Practices / SEO 均为 100，LCP 2.1 秒、CLS 0，报告为 `.local/qa/lighthouse-answer-stream.json`。

暗色主题完成后，原有 22 项交互用例与新增 6 项主题用例均已验证通过，模块测试、lint、类型检查、格式检查及构建通过。实际检查了桌面/手机暗色首页、回答卡片、文章和代码块；暗色文字与背景/卡片的最低配色对比度约 6.67:1。此次本地 Lighthouse 移动端测量 Performance 97，Accessibility / Best Practices / SEO 均为 100，LCP 2.5 秒、CLS 0，报告为 `.local/qa/lighthouse-dark-theme.json`。
