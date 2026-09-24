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
| 文章元数据校验、Markdown 读取、卡片与正文 | `src/features/writing` |
| 已发布 Markdown 的同步缓存 | `content/writing` |
| Bot 组件、浏览器引擎与生命周期 | `src/features/bot` |
| shadcn 基础组件、全站导航 | `src/components` |
| 个人资料与菜单 | `src/config/site.ts` |

完整职责与依赖约束见 [架构文档](docs/frontend-architecture.md)。ESLint 限制跨模块导入，服务端正文入口使用 `server-only`。

## 修改内容

- 项目编辑 `src/features/projects/data.ts`，卡片直达配置的 GitHub 或官网。
- 文章原稿以 [Obisidian-Open](https://github.com/Similarityoung/Obisidian-Open) 为准；`content/writing` 是已发布文章的同步缓存。每篇候选文章须明确 `draft: true|false`；公开文章须提供 `title`、`type: notes|thoughts`、`date`、`summary`、全局唯一的英文小写连字符 `slug`。`categories` 表示 Go、Dubbo 等主题，`tags` 可选；两者均使用字符串数组。根目录 README 与 `_Templates` 不参与同步，`aliases` 不再使用。
- 本站只缓存源仓库中 `draft: false` 的文章。Notes/Thoughts 首页卡片自动选取各自最新的 3 篇公开文章，不维护人工选稿清单。项目引用仍通过 ID 校验。回答接口为 `answerQuestion(question, catalog, signal?)`。
- 手动检查源仓库：`npm run sync:writing -- /path/to/Obisidian-Open`，然后运行 `npm run check`。脚本先校验全部候选文章；任何缺失字段或重复 slug 都会阻止替换当前缓存。

同一标签页内通过站内链接进入目录或正文再返回首页，会话保留；刷新或主动清空会重置。不写入浏览器存储。文章目录与会话复用相同摘要和卡片。

新回答按提交、文本分块、逐张完整卡片的顺序展示；典型短回答及卡片约 4～6 秒完成。Bot 正常回答固定书写，未匹配问题显示困惑，持续到全部内容展示完；正常回答完成后播放约 2.4 秒的带彩带转身、单次跳跃与落地粒子，再恢复待机／倾听，不显示进度环。卡片出现即可点击。快速追问会补全旧回答，导航返回时历史回答不重播；减少动态效果时仍保留分块输出。该效果不调用模型；回答函数明确返回是否匹配的分类。

主题默认跟随系统，页头太阳/月亮按钮可切换明暗。手动选择以 `simweb-theme` 保存到 localStorage，刷新和站内跳转会保留；会话仍仅保存在内存。主题变量位于 `src/app/globals.css`，Provider 与按钮位于 `src/components/site`。

## 首页 Bot 互动

- 首次进入生成；主题卡片悬停／聚焦和输入框聚焦共用倾听反馈，进入时轻点头一次，随后保持安静的眼型与视线，仅保留轻微呼吸和眨眼。卡片之间或卡片与输入框之间连续切换不重播点头，离开所有关注目标后恢复待机。
- Bot 不跟随鼠标位置；待机表情、卡片悬停与输入框聚焦反馈继续保留。
- 正常回答固定书写；未覆盖问题困惑，真正失败短暂警报。
- 阅读正文后返回开心／通知，换主题惊讶；嗡鸣仅保留在开发预览，不自动触发。
- 连续 60 秒无鼠标、键盘、触摸或滚轮活动时睡着；活动后聚拢苏醒约 2 秒再恢复待机／倾听。回答会立即接管，连续活动不重播醒来；后台不累计时间，返回重新计时。
- 点击 Bot 只会弹跳，键盘 Enter / Space 同样可激活；无三击、拖动、长按或手动休眠手势。
- 正常回答与卡片完成后播放约 2.4 秒完成动画：带着彩带转一圈、轻跳一次，落地后散出少量彩色粒子。待机平静 20～30 秒后随机呈现开心／好奇／害羞／得意／俏皮中的一种约 2.5 秒，眼睛与轻微姿态一起变化，再回到平静；交互会立即接管。
- 回答优先，彩蛋不插队、不积压；减少动态效果保留文字节奏，角色静止。

## Bot 动作预览

开发服务器运行时访问 `/dev/bot`，试播 24 种动作（含平静、五种待机表情、睡着／醒来与完成动画）及 192 / 54 / 43px 尺寸；从预览页返回首页可测试完整流程。生产环境该路由返回 404。动作候选及睡眠时长在 `src/features/bot/behavior.ts`，展示节奏在 `src/features/home/answer-presentation.ts`；引擎内已排除用户指定的眼型 7、8。

## 验证

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm run format:check
```

`check` 执行 lint、类型检查、模块及架构测试、生产构建。模块测试就近放在 `src`，测试脚本也递归查找 `tests`；端到端测试独立运行，需要先完成构建，覆盖桌面与手机的提问、阅读、返回、刷新和清空。

## Vercel

仓库已提供 Next.js 的 `vercel.json`，安装命令为 `npm ci`，构建命令为 `npm run build`。当前没有必需环境变量。`.github/workflows/sync-writing.yml` 在默认分支每天北京时间 10:17 及手动触发时检出两个公开仓库，校验、构建并仅在内容变化时提交到 SimWeb `main`。Vercel Git 集成连接 SimWeb 且生产分支为 `main` 后，内容提交会触发部署。源仓库的元数据整理完成并通过首次手动同步前，不切换 2.0 到 `main`。

原型 Bot 的来源声明见 [vendor/README.md](src/features/bot/vendor/README.md)。
