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

## Turnstile 与访问资格

快捷问题和自由提问共用访问资格。首次提交先请求 `/api/answer/access`：有效资格直接继续；缺失或过期时，浏览器才创建 Turnstile challenge，并把单次 token 仅交给握手 POST。服务端调用 Siteverify，要求成功、当前 hostname 和 `answer` action 一致，随后设置短期签名 Cookie。接着浏览器才发送 `/api/answer`；该问答路由只验证 Cookie，不接受或复用 Turnstile token。验证完成前不会启动模型。

凭据为固定 6 小时有效的 HMAC-SHA256 签名声明，包含版本、请求 hostname 和过期时间。使用现有 `TURNSTILE_SECRET_KEY` 签名，无额外存储或基础设施；缺少密钥时失败关闭。Cookie 为 host-only、`HttpOnly`、`SameSite=Lax`、`Path=/api`，HTTPS 加 `Secure`。不滑动续期，不存储在会话历史；到期后下次提交需重新验证。清空会话只取消当前浏览器/上游请求，不撤销 Cookie；站内导航与同一浏览器其他标签页共享该域 Cookie。两个域名分别持有 host-only Cookie。

签名 Cookie 是可转移的 bearer 凭据：持有人可在有效期内复制并使用，服务端无状态设计不能即时撤销或实现精确可扣减次数额度。Cookie 不是用户身份或一人一份的配额；滥用仍依赖 `/api/answer` 上的边缘限流和模型供应商控制。通用网络/模型错误不自动重试；只有明确资格缺失时才执行握手，不会重发问答或追加消息。

本地 E2E 先用 `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` 构建，再运行 `npm run test:e2e`。测试 fixture 控制 challenge 与模型流，模块测试也使用受控 Siteverify 响应，不需要生产密钥、不产生 DeepSeek 费用。需要真实测试 widget 时，使用官方测试站点密钥及对应测试 secret；测试响应的固定 hostname/action 不能用于生产，也不能因此放宽生产校验。官方依据：[客户端渲染](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)、[服务端验证](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)（token 300 秒且单次使用）、[测试密钥](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)、[Turnstile Free](https://developers.cloudflare.com/turnstile/plans/)；Vercel [WAF 限流](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) 在 Hobby 可用，但计数按区域追踪、允许请求按量收费。

部署检查（尚未在线核验或变更）：逐一检查 `www.simi.host` Cloudflare 与 `sim-web.vercel.app` Vercel 上实际 `/api/answer` WAF 条件、计数方式、窗口及动作。历史记录的 Cloudflare 每 IP 十秒一次和 Vercel 十分钟六次不是已核验现状；确认首次验证握手（`/api/answer/access`）不会被错误纳入 answer 规则，且有效 Cookie 的连续问答仍受限流。不要将公开可达的握手路由列为模型调用依据；`/api/answer` 无有效资格始终拒绝。记录两入口验收结果后再发布生产变更。

性能测量边界：分别记录用户点击、资格查询、必要时 challenge 完成、握手结束、问答请求发出、首个流数据到达和首字显示。首次请求的验证时间与之后的模型首段等待分开统计；本地受控 fixture 仅验证事件顺序和重复调用，不代表线上性能 SLA，也不能用于声称模型延迟改善。

2026-10-28 本地 production 构建浏览器验收：官方测试 widget 实际生成 token，Siteverify 与 DeepSeek 使用仓库外测试脚本注入的受控响应，真实路由负责签发和校验 Cookie。以下均为相对点击的毫秒数，每种场景仅一次样本；流首段是 SDK start 事件，首字需要等上游 JSON 解析到 text 字段。

| 阶段                 | 首次无资格 | 有效资格追问 |
| -------------------- | ---------: | -----------: |
| 资格查询完成         |         23 |           74 |
| Turnstile token 完成 |      3,651 |       不需要 |
| 握手完成             |      3,664 |       不需要 |
| 问答请求发出         |      3,664 |           74 |
| 首段流数据           |      3,694 |          140 |
| 首字显示             |      4,027 |          472 |

本地确认：首次只握手一次，追问不再触发 challenge/Siteverify；清空和刷新重置消息但保留资格，同域另一标签页可直接提问；320px 页面无整页横向滚动。模块测试覆盖固定到期、伪造、缺失及错误 hostname 凭据，客户端测试覆盖握手失败和取消时迟到 token。桌面/小屏 E2E 覆盖流中禁止重复提交、清空取消与导航保留请求。真实模型延迟、生产 WAF 命中和生产 HTTPS Cookie 仍需部署前验收，不能将这些本地结果视为线上全流程通过。
