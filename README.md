# 我来到，我看见，我记录

羡青山有思，白鹤忘机。

个人站 2.0：Next.js App Router、React、TypeScript、Tailwind CSS 和 shadcn/ui。首页用预写问答引导访客浏览项目与文章，暂不调用 AI。

## 本地运行

使用 Node.js 22 或更高版本：

```sh
npm ci
npm run dev
```

打开 http://localhost:3000。生产预览使用 `npm run build` 后运行 `npm start`。

## 代码位置

| 内容 | 位置 |
| --- | --- |
| 路由、服务端取数、共享布局 | `src/app` |
| 首页、会话、预写回答 | `src/features/home` |
| 项目清单、项目卡片与目录 | `src/features/projects` |
| 文章选稿、Markdown 读取、卡片与正文 | `src/features/writing` |
| Bot 组件、浏览器引擎与生命周期 | `src/features/bot` |
| shadcn 基础组件、全站导航 | `src/components` |
| 个人资料与菜单 | `src/config/site.ts` |

完整职责与依赖约束见 [架构文档](docs/frontend-architecture.md)。ESLint 限制跨模块导入，服务端正文入口使用 `server-only`。

## 修改内容

- 项目编辑 `src/features/projects/data.ts`，卡片直达配置的 GitHub 或官网。
- 原文章保留在 `content/posts`。标题、日期、标签和正文由 Markdown 提供；`src/features/writing/entries.ts` 只维护选稿、ID、分类、slug 和摘要。仅接受明确 `draft: false` 的选稿。
- 当前选入 4 篇开发样本，尚不是正式发布清单。未收录文章没有公开页面。
- 预写问答在 `src/features/home/presets.ts`，只用带类型的 ID 引用内容；失效引用会使构建失败。回答接口为 `answerQuestion(question, catalog, signal?)`。

同一标签页内通过站内链接进入目录或正文再返回首页，会话保留；刷新或主动清空会重置。不写入浏览器存储。文章目录与会话复用相同摘要和卡片。

新回答在展示层模拟流式文本块追加，完成后出现关联卡片。快速追问会补全旧回答，导航返回时历史回答不重播；减少动态效果时仍保留分块输出。该效果不调用模型，也不改变回答接口。

主题默认跟随系统，页头太阳/月亮按钮可切换明暗。手动选择以 `simweb-theme` 保存到 localStorage，刷新和站内跳转会保留；会话仍仅保存在内存。主题变量位于 `src/app/globals.css`，Provider 与按钮位于 `src/components/site`。

## 验证

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm run format:check
```

`check` 执行 lint、类型检查、模块及架构测试、生产构建。模块测试就近放在 `src`，测试脚本也递归查找 `tests`；端到端测试独立运行，需要先完成构建，覆盖桌面与手机的提问、阅读、返回、刷新和清空。

## Vercel

仓库已提供 Next.js 的 `vercel.json`，安装命令为 `npm ci`，构建命令为 `npm run build`。当前没有必需环境变量。正式发布前确定选稿清单，并核对 `src/config/site.ts` 的站点地址和资料；本次未执行线上部署。

旧 Hugo 模板和配置仍保留在仓库，但不参与 Next.js 构建。不要将旧 Hugo 生成物放入 Next.js 的 `public/`。原型 Bot 的来源声明保留在 [vendor/README.md](src/features/bot/vendor/README.md)。
