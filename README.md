# 我来到，我看见，我记录

羡青山有思，白鹤忘机。

个人站 2.0，记录我做的项目、写的技术笔记（Notes）与随笔（Thoughts）。首页有互动 Bot，也可启用基于公开资料的 AI 问答。

访问：[simi.host](https://simi.host)。

核心技术栈：Next.js App Router、React、TypeScript、Tailwind CSS、shadcn/ui；全文搜索使用 Pagefind，可选问答使用 AI SDK 与 DeepSeek。

## 快速开始

使用 Node.js 22 或更高版本，在仓库根目录运行：

```sh
npm ci
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。基础站点运行与构建无需环境变量；项目、文章目录、正文及 Notes 搜索不依赖 AI 配置。

## 可选 AI 问答

启用后，首页四个快捷入口和自由提问均调用 DeepSeek，文字真实流式返回，正常完成并通过校验后展示卡片；没有预写回答或本地回退。

参照 [.env.example](.env.example)，在未跟踪的 `.env.local` 中配置：

- AI：`DEEPSEEK_API_KEY`、`DEEPSEEK_PUBLIC_ENABLED=true`。
- 请求验证：`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`。

配置后重启开发服务；生产环境需重新构建。完整步骤、Turnstile 本地测试说明及公开启用前的限流与费用检查见 [AI 问答设置](docs/ai-answer-setup.md)。未配置时问答不可用，不影响目录阅读；不要提交密钥。

## 文档导航

- [维护指南](docs/maintenance.md)：修改资料、同步文章、更新索引、验证与部署。
- [架构设计](docs/frontend-architecture.md)：目录职责、文章字段与链接校验、搜索索引、回答接口与会话边界。
- [需求约定](docs/frontend-refactor-spec.md)：目录与阅读流程、Bot 互动、开发预览与主题行为。

Bot 素材的来源、权利声明与本站适配见 [引擎说明](src/components/bot/vendor/README.md)。
