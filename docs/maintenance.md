# 维护指南

本页集中记录内容更新、验证和部署操作；运行入口见 [README](../README.md)，模块职责与行为分别以[架构设计](frontend-architecture.md)和[需求约定](frontend-refactor-spec.md)为准。

## 修改资料与文章

- 个人资料与导航编辑 [src/config/site.ts](../src/config/site.ts)，项目编辑 [src/lib/projects/data.ts](../src/lib/projects/data.ts)。
- 文章原稿维护在 [Obisidian-Open](https://github.com/Similarityoung/Obisidian-Open)。本站 `content/` 整个目录是已发布文章的同步缓存，会被整体替换，不在其中手工维护文件。
- 字段、公开范围与双链规则见[内容接口](frontend-architecture.md#内容接口同一条内容只维护一次)，校验入口是 [catalog.ts](../src/lib/writing/catalog.ts)。`type` 的实际值为 `notes` / `thoughts`；源仓库根目录的 `README.md`、各级 `AGENTS.md` 和以 `.` 或 `_` 开头的条目（含 `_Templates`）不参与同步。

在本站仓库根目录执行，将示例路径替换为源仓库的本地路径：

```sh
npm run sync:writing -- /path/to/Obisidian-Open
npm run check
```

[同步脚本](../scripts/sync-writing.ts)先校验候选文章，再仅复制 `draft: false` 的内容；缺失必要字段、重复 slug 或没有公开文章都会阻止替换缓存。正文双链目标是否存在由构建校验，不能只以同步命令成功作为发布依据。

## 更新搜索索引

`npm run dev` 和 `npm run build` 通过 `predev` / `prebuild` 自动运行 `index:writing`，无需额外搜索服务或模型密钥。也可单独生成：

```sh
npm run index:writing
```

[索引脚本](../scripts/index-writing.ts)生成的 `public/pagefind/` 不提交 Git。同步或修改文章后，重启开发服务并刷新浏览器。索引含可公开下载的正文搜索数据；Notes 按需加载，Thoughts 目录不使用搜索。查询与索引边界见[文章目录与阅读来源](frontend-architecture.md#文章目录与阅读来源)。

## 验证与预览

命令以 [package.json](../package.json) 为准：

```sh
npm run check
npm run format:check
```

`check` 依次执行 ESLint、类型检查、模块及架构测试和生产构建。模块测试由 [scripts/test.mjs](../scripts/test.mjs)递归发现 `src/` 与 `tests/` 下的 `.test.ts`；端到端测试独立运行。`format:check` 当前不包含 Markdown，文档修改可单独运行 `npx prettier --check README.md docs/maintenance.md`（或替换为本次修改的 Markdown 路径）。

浏览器测试使用生产构建。先安装 Chromium，并在构建时设置公开的 Turnstile 测试站点密钥，再运行测试：

```sh
npx playwright install chromium
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
npm run test:e2e
```

[Playwright 配置](../playwright.config.ts)自动启动本地生产服务，覆盖桌面与移动端。[问答测试夹具](../tests/e2e/answer-fixture.ts)模拟 Turnstile 脚本及回答流，不需要真实模型密钥，也不验证线上防护或真实模型效果；配置与验收边界见 [AI 问答设置](ai-answer-setup.md)。测试站点密钥不要用于生产。

人工生产预览使用 `npm run build` 后运行 `npm start`，打开 [http://localhost:3000](http://localhost:3000)。Bot 动作试播需改用 `npm run dev`，访问 [http://localhost:3000/dev/bot](http://localhost:3000/dev/bot)；生产环境该路由返回 404。动作参数和场景规则已有[架构说明](frontend-architecture.md#bot-接口业务只传状态)，不在此重复维护。

## 自动同步与部署

[sync-writing.yml](../.github/workflows/sync-writing.yml)在默认分支每天北京时间 10:17 及手动触发时检出本站与文章源仓库，运行同步和 `npm run check`，仅在内容变化时提交 `content/` 到 SimWeb `main`。手动触发也会写入 `main`，不只是检查任务。

[vercel.json](../vercel.json)指定 Next.js、`npm ci` 和 `npm run build`。现有部署约定是由 Vercel Git 集成跟随 `main`，因此内容同步提交也会触发部署；项目连接与生产分支需在 Vercel 项目中确认，不能仅凭仓库文件判断线上状态。基础站点不要求环境变量；公开问答的密钥、Turnstile、限流和费用检查统一见 [AI 问答设置](ai-answer-setup.md)，这里的本地检查不替代上线验收。

旧 Hugo 版以 [`v1.0` 标签](https://github.com/Similarityoung/SimWeb/tree/v1.0)留档。
