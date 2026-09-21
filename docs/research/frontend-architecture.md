# 个人站前端架构研究

观察日期：2026-09-21。范围：Next.js 官方文档与两个公开仓库的真实目录、路由和实现文件。本轮仅研究，不决定页面视觉、不实施产品代码。

## 结论

**建议采用小规模业务模块：`home / projects / writing / bot`，由 `app` 负责路由与服务端组装。** 模块内把视图、状态和数据操作放在相邻文件；共享基础 UI 仍可放 `components/ui`，但不把所有业务组件、Hooks、请求统一堆进全局技术目录。

这是结合本站需求作出的推论，不是 Next.js 强制的目录规范。需要保留的边界是：服务端内容读取 → 公开摘要 → 首页会话和完整目录；下层业务模块不依赖首页。无需引入完整 FSD 分层、全局状态库、通用 service/repository 框架。

## 一手证据

### 1. Next.js：目录自由，运行边界必须明确

- 官方明确表示不规定项目组织方式；`app` 内的文件可与路由共置，只有 `page`、`route` 等约定文件暴露路由；`_components` 这类私有目录只是可选组织方式。因此，把薄路由留在 `app`、业务实现放 `features` 是合理选择，而非框架要求。[Project structure and organization](https://nextjs.org/docs/app/getting-started/project-structure)
- `page`、`layout` 默认是 Server Components。状态、事件和浏览器 API 放在 Client Components；`'use client'` 标记模块依赖边界，其导入的模块会进入客户端依赖图。服务端组件通过 `children` 等传入已渲染内容，是另一种组合方式，并不意味着客户端可以直接导入服务端模块。[Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- 在服务端专用模块中导入 `server-only`，客户端误导入时产生构建错误。仅用 `*.server.ts` 命名或约定“不要导入”不能替代这一保护。[Preventing environment poisoning](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)

**本站推论：** 不给整个 `app/page.tsx` 加 `'use client'`。路由在服务端读取公开内容摘要，传给首页交互组件；首页只掌握需要展示的数据，不导入读取 Markdown、文件系统或完整文章的模块。

### 2. Bulletproof React：业务代码就近组织，跨模块组合有明确落点

核查分支：`master`；固定提交：`9506629ed003a561c6627735480cce4994244bb4`。

- [真实 `src` 目录](https://github.com/alan2207/bulletproof-react/tree/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/src)含 `app`、`features` 和共享基础目录；[`features/discussions`](https://github.com/alan2207/bulletproof-react/tree/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/src/features/discussions)实际只有 `api`、`components` 两个子目录，没有为每种技术预建一层。
- [讨论列表路由 `page.tsx`](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/src/app/app/discussions/page.tsx)负责 metadata、查询预取和 HydrationBoundary；[路由私有 `discussions.tsx`](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/src/app/app/discussions/_components/discussions.tsx)组合讨论创建、讨论列表，并连接评论预取行为。
- [列表视图](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/src/features/discussions/components/discussions-list.tsx)从本 feature 的 API 文件导入查询 Hook，管理加载和分页呈现；[查询实现](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/src/features/discussions/api/get-discussions.ts)把请求、query options 和 Hook 放在一起，依赖共享 HTTP/query 基础设施。业务关联没有被全局 `services`、`hooks` 目录拆散。
- [作者的组织指南](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/project-structure.md)建议按需创建子目录、直接导入文件；[实际 ESLint 配置](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/.eslintrc.cjs)禁止 feature 间互相导入，也禁止 feature 反向导入 `app`，跨 feature 组合落在上面的路由私有组件。

**适用限度：** 该示例的 [package.json](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app/package.json)使用 Next 14、React 18，是目录和依赖组织的证据，不是本站当前 Next API、依赖版本或客户端查询库的模板。

**本站推论：** 学习业务内聚与依赖方向，不照搬“所有 feature 绝不互相引用”。本站的首页是组合功能，可明确允许 `home → projects/writing` 的公开类型和纯卡片；`projects/writing → home` 禁止。这样能复用同一张卡片，避免为满足形式上的隔离引入卡片注册器或多层包装。

### 3. Lee Robinson 的小型内容站模板：内容需求简单时，结构也可以简单

观察到 [`leerob/site`](https://github.com/leerob/site) 当前重定向为 `leerob/next-mdx-blog`。以下核查的是这个公开博客模板，不据此描述作者当前线上个人站。分支：`main`；固定提交：`fd03371e3c90481a8447904e1b548e4c0327b7db`。

- [真实 `app` 目录](https://github.com/leerob/next-mdx-blog/tree/fd03371e3c90481a8447904e1b548e4c0327b7db/app)包含主页 MDX、布局、sitemap，以及 `n` 下的文章路由。[首页](https://github.com/leerob/next-mdx-blog/blob/fd03371e3c90481a8447904e1b548e4c0327b7db/app/page.mdx)直接列出文章链接；[单篇文章](https://github.com/leerob/next-mdx-blog/blob/fd03371e3c90481a8447904e1b548e4c0327b7db/app/n/1/page.mdx)将 metadata 和正文共置。
- [`next.config.ts`](https://github.com/leerob/next-mdx-blog/blob/fd03371e3c90481a8447904e1b548e4c0327b7db/next.config.ts)用 `@next/mdx` 把 MDX 接入路由；[`mdx-components.tsx`](https://github.com/leerob/next-mdx-blog/blob/fd03371e3c90481a8447904e1b548e4c0327b7db/mdx-components.tsx)集中提供正文排版、链接和代码高亮。不是把正文渲染散落到每一页。
- [`app/sitemap.ts`](https://github.com/leerob/next-mdx-blog/blob/fd03371e3c90481a8447904e1b548e4c0327b7db/app/sitemap.ts)在服务端用文件系统枚举 MDX 路径来生成 sitemap；这里读的是路由目录，不是可供客户端调用的文章查询服务。

**本站推论：** 共享正文呈现和集中读取内容值得采用；逐篇建立 `app/.../page.mdx` 不适合直接照搬到本站既有 Markdown 内容。本站还需要 Notes/Thoughts 目录和会话中的摘要卡片，因此保留一个 `writing` 业务模块读取现有内容、生成摘要并呈现正文，比增加 CMS、全局 store 或多层内容框架更直接。

## 推荐结构与职责

以下是讨论用的模块边界，不是要求一次创建所有文件，也不在此确定旧文章 URL 的迁移规则。

```text
src/
  app/
    layout.tsx                # 全站壳与导航
    page.tsx                  # 读取公开摘要，组装首页
    projects/page.tsx         # 项目完整目录
    notes/...                 # Notes 目录与正文路由
    thoughts/...              # Thoughts 目录与正文路由
  features/
    home/
      home-page.tsx           # 首页交互组合
      conversation.tsx        # 消息列表与输入呈现
      use-conversation.ts     # 累积会话、提交和响应状态
      reply.ts                # 当前预写回复；唯一未来 AI 接口
    projects/
      data.ts                 # 项目事实、归属、点击地址
      types.ts
      project-card.tsx        # 首页与目录共用
      project-directory.tsx
    writing/
      server.ts               # server-only：读取/筛选/解析内容
      types.ts                # 可公开摘要等纯类型
      article-card.tsx        # 首页与目录共用
      article-directory.tsx
      article-body.tsx        # 正文统一呈现
    bot/
      bot.tsx                 # 浏览器交互封装
      vendor/                 # 原型依赖的内部实现
  components/ui/              # shadcn 等基础控件
  lib/cn.ts                   # 少量真正跨业务的工具
content/                      # 既有 Markdown 内容来源
```

职责按变化原因划分：更换会话行为主要修改 `home`；增添项目主要修改 `projects`；改变文章元数据和解析主要修改 `writing`；Bot 生命周期集中在 `bot`。不以固定行数或“每个组件一个目录”作为拆分标准；只有独立状态、独立业务职责或真实复用才产生新文件。

### 服务端与客户端约束

1. `writing/server.ts` 顶部导入 `server-only`，由路由、metadata、构建期参数生成等服务端入口直接导入。公开摘要类型独立，不从 loader 文件导出供客户端使用。
2. `article-card.tsx`、`project-card.tsx` 只依赖数据 props、链接和基础 UI，不导入 loader、文件系统或首页状态。它们没有浏览器需求时不加 `'use client'`，可由服务端目录使用，也可被首页客户端依赖图使用。
3. 不建立同时导出 `server.ts`、卡片和类型的通用 `index.ts`。服务端入口与客户端可用文件直接导入，防止通过 barrel 把运行边界重新混合。
4. 路由只向首页传筛选后的公开摘要和项目数据。草稿、完整 Markdown 正文、读取配置不应随着会话组件传到浏览器。服务端读取产生摘要和正文两种输出，首页只取前者。

### 数据和卡片如何共用

项目和文章都只有一个事实来源。每项拥有稳定 ID；目录用同一份公开数据渲染完整列表，预写回答只关联这些 ID，首页按 ID 取出对象并交给同一张卡片。不要在回答文案里再维护一份标题、摘要和 URL。

项目卡片使用数据中明确的目标地址，可直达 GitHub、项目官网或已有介绍页；不强制增加本站项目详情页。文章卡片使用同一篇正文的站内地址。Notes 与 Thoughts 先作为 `writing` 内的内容分类，共用解析和正文能力，不因为有两个菜单就复制两套内容系统。

依赖方向允许：`app → 各业务模块`、`home → projects/writing 的公开模型与卡片`、`home → bot`、`各模块 → 基础 UI/工具`。`projects`、`writing`、`bot` 不反向依赖 `home`，基础 UI 不依赖业务模块。可以用少量针对路径的 lint 规则表达这些具体边界，无需引入架构框架。

### 唯一未来 AI 接口

`home/reply.ts` 提供一个异步回答函数：输入当前消息和必要会话上下文，输出回答文本与关联内容 ID。首版实现仍是已确认的预写回复；`use-conversation.ts` 只调用这个函数并追加消息，不自行匹配项目、拼接卡片或直接耦合某个 AI SDK。

将来接入 AI 时，在这个函数后接服务端调用，再按真实需求增加服务端接口。现在不建立空 API 路由、多个 provider、适配器注册表、数据库或流式协议。聊天状态先留在首页模块；跨路由或刷新持久化是独立产品决定，不能从“会话累积”自动推导。

## 后续实现的验证标准

- 服务端 loader 被客户端误导入时构建失败；常规构建通过。
- 首页回答与完整目录显示相同 ID 的相同卡片、摘要和点击目标。
- 写作读取确实过滤非公开内容；客户端首页数据不包含正文或草稿。
- 路由仅承担读取、metadata 与组装；会话状态、回答逻辑、内容解析各自有明确归属。

以上是后续验证计划，本轮没有执行产品构建或测试。
