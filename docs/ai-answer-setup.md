# 公开 AI 问答

首页四个快捷入口与自由提问统一调用 DeepSeek，每次交互只做一次生成，无自动重试、预写回答或本地回退。仅回答作者、项目和已发布文章相关问题；关闭推理，使用真实流式文字，正常完成后显示经校验的卡片。实现与契约见[架构](frontend-architecture.md)和[实施计划](personal-agent-plan.md)。

## 本地配置

在未跟踪的 `.env.local` 中配置 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_PUBLIC_ENABLED=true`，模板见仓库 `.env.example`，然后重启 `npm run dev`。不要把密钥放在 `NEXT_PUBLIC_*`、浏览器请求或 Git 中。未配置/未启用时接口返回 503，页面说明暂不可用，所有公开目录仍能访问。

本地验证使用 `http://localhost:3000/`。当前开发环境下，使用 `127.0.0.1:3000` 访问页面会使浏览器 Origin 与 Next 构造的请求 URL 不一致，被既有同源校验返回 403；使用 localhost 已验证正常。

当前实现使用 `ai@7.0.118`、`@ai-sdk/react@4.0.121`、`@ai-sdk/deepseek@3.0.54`、`zod@4.6.5` 和 `deepseek-flash`。provider 显式传入 `thinking.type=disabled`、stream 和 JSON object 模式。JSON schema 会由 provider 注入 system 消息，实际输入成本还包括 schema、公开资料、短历史；精确消耗以真实 API usage 为准。

服务端限制：请求体 16 KiB，当前/历史问题各 300 字符，历史及生成回答 1,200 字符，最近卡片最多五条，正文最多三篇各 900 字符，输出最多 2,048 tokens，总生成超时 30 秒。模型失败、限流、截断或取消不会产生成功卡片/历史。提示词约束不是自然语言事实正确性的绝对保证，须单独做真实模型验收。

## 线上入口

生产密钥保存在 Vercel Secret 中，`DEEPSEEK_PUBLIC_ENABLED=true` 控制启用。以下是此前记录的部署配置，本轮没有重新核验或修改线上规则：

- `www.simi.host` 经 Cloudflare 代理：`URI 路径` 等于 `/api/answer`，按 IP 计数，10 秒允许一次，超出阻止 10 秒。
- `sim-web.vercel.app` 直达 Vercel：`Request Path` 等于 `/api/answer` 且 `Method` 等于 `POST`，按 IP 固定窗口 10 分钟允许六次，超出返回 429。

所有快捷入口现在也消耗模型额度。上线前核验连续追问在上述规则下的实际行为、两处 WAF 命中、DeepSeek 余额及费用上限；共享 IP 可能共用额度，限流不等于每日总费用上限。线上启用和规则修改不由本地实现自动执行。

## 验证

运行 `npm run check`、`npm run format:check` 和 `npm run test:e2e`。服务端测试用真实 DeepSeek provider 解析受控 HTTP 数据，浏览器测试通过 SDK 生成的 UI 流验证渐进文字、完整终态、清空、导航和短请求，不消耗真实 API。

2026-09-29 在 Next dev 和 production 模式以本地受控上游验证了正常 SSE 流及“浏览器中断 → route request.signal → 上游连接关闭”。随后按用户授权配置本地密钥，完成三次真实 DeepSeek 浏览器问答：Notes 渐进输出并显示五张卡片；“第二篇展开讲讲”正确定位《评估与观测》，内容与公开正文一致；天气问题被拒答且没有卡片。密钥文件已确认被 Git 忽略，权限为 0600。

此次 Notes 卡片选择正确，但引导文字偏向概括项目经历，尚未逐项介绍所选笔记；这属于后续提示词效果调整项。About、Projects、闲鱼职责、通用编码和提示词注入尚未做真实模型专项验收；未采集 API usage，不能据此报告精确 token 或费用。没有修改线上 WAF 或部署。

依据：[AI SDK DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)、[AI SDK UI 数据流](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data)、[DeepSeek API](https://api-docs.deepseek.com/api/create-chat-completion/)、[Cloudflare 速率限制](https://developers.cloudflare.com/waf/rate-limiting-rules/)、[Vercel WAF 限流](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)。

## Turnstile 请求验证

快捷问题和自由提问共用同一验证入口。配置 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`（公开站点密钥）和 `TURNSTILE_SECRET_KEY`（仅服务端）；二者都需配置到 Vercel 的目标环境后重新构建。生产组件允许 `simi.host`、`www.simi.host` 和 `sim-web.vercel.app`，本地使用 Cloudflare 官方测试密钥。

每次提交创建新 challenge，令牌只通过 `x-turnstile-token` 请求头传给 `/api/answer`，不进入会话历史或模型上下文。接口在调用模型前执行 Siteverify，并验证 hostname 等于当前请求域名、action 为 `answer`。缺少/无效令牌返回 403，未配置密钥或验证服务不可用返回 503，验证请求上限 4 秒；失败时不调用模型。浏览器验证等待上限 30 秒，清空会话取消验证，站内导航保留验证过程。仅需要用户交互时显示组件。

本地端到端测试在构建时设 `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`，测试夹具模拟第三方脚本及 AI 响应，不消耗模型额度。实际验证依据 [客户端文档](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) 和 [服务端文档](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。
