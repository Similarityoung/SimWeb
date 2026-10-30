# 协作约定

- 用中文沟通，结论先行，简洁说明取舍、改动和验证结果。
- 先了解现有实现与参考，再确定整体结构和关键交互；只确认影响正确性的缺口，已明确的事项直接推进。
- 新方案落地前，先在线查阅官方文档或权威一手资料，结合项目约束讨论适用性与取舍，明确依据后再实施。
- 前端修改前对照[需求约定](docs/frontend-refactor-spec.md)、[架构设计](docs/frontend-architecture.md)和[设计规则](docs/design/rules.md)；新增或修改 UI 引用规则 ID。按职责组织文件，保持数据来源唯一、模块依赖清晰；拆分依据职责，而非单纯行数。
- 保留已认可的视觉风格，以使用体验和一致性判断原型与现有实现的取舍，合适的设计继续保留。
- 优先复用已选技术栈和组件；为明确的扩展需求保留接口，当前实现保持简单。
- 修改代码时使用项目级 [ub-mode](.agents/skills/ub-mode/SKILL.md)：外部数据在入口校验，内部信任已校验的契约；不逐层重复解析，不用防御分支掩盖内部不变量问题。
- 视觉与交互修改后检查实际页面和小屏表现，并验证受影响的关键流程；审查结论以代码和验证结果为依据。

## 开发与维护

- 项目使用 Node.js 22+。本地开发运行 `npm ci`、`npm run dev`；`npm run build` 后可用 `npm start` 启动生产预览。基础站点不需要环境变量。
- 首页 AI 问答为可选能力。配置项见 `.env.example`，完整启用、Turnstile、限流与费用说明见 `docs/ai-answer-setup.md`；不要提交密钥。不要将尚未实现的 issue 方案描述为现有行为。
- 个人资料与导航维护在 `src/config/site.ts`，项目数据在 `src/lib/projects/data.ts`。文章原稿来自 `Obisidian-Open`；`content/` 是自动替换的已发布文章缓存，不要手工维护。同步使用 `npm run sync:writing -- /path/to/Obisidian-Open`，公开字段及双链规则见 `docs/frontend-architecture.md`。
- `npm run dev` 与 `npm run build` 会自动生成 Pagefind 索引；修改文章后重启开发服务并刷新。可用 `npm run index:writing` 单独更新，生成物 `public/pagefind/` 不提交。
- 验证使用 `npm run check` 与 `npm run format:check`；浏览器回归使用 `npm run test:e2e`，需先准备生产构建和 Chromium。端到端测试以测试 Turnstile 站点密钥构建，不需要真实 AI 密钥；详情见 `docs/ai-answer-setup.md`。
- `/dev/bot` 仅开发环境可用。GitHub Actions 会定时或手动同步文章并检查；Vercel 部署配置以 `vercel.json` 为准。不要未经明确授权修改线上部署、密钥或限流规则。
- 目录职责、回答/会话接口、Bot 行为和页面验收标准分别以 `docs/frontend-architecture.md`、`docs/frontend-refactor-spec.md` 为准；避免重复维护同一规则。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
