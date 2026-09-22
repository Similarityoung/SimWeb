# 协作约定

- 用中文沟通，结论先行，简洁说明取舍、改动和验证结果。
- 先了解现有实现与参考，再确定整体结构和关键交互；只确认影响正确性的缺口，已明确的事项直接推进。
- 新方案落地前，先在线查阅官方文档或权威一手资料，结合项目约束讨论适用性与取舍，明确依据后再实施。
- 前端修改前对照[需求约定](docs/frontend-refactor-spec.md)和[架构设计](docs/frontend-architecture.md)。按职责组织文件，保持数据来源唯一、模块依赖清晰；拆分依据职责，而非单纯行数。
- 保留已认可的视觉风格，以使用体验和一致性判断原型与现有实现的取舍，合适的设计继续保留。
- 优先复用已选技术栈和组件；为明确的扩展需求保留接口，当前实现保持简单。
- 视觉与交互修改后检查实际页面和小屏表现，并验证受影响的关键流程；审查结论以代码和验证结果为依据。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
