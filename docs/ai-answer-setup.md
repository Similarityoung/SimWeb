# 公开 AI 问答

首页的预写主题回答不调用模型；具体的自由提问才会从公开文章检索片段并调用 DeepSeek。服务端限制问题长度、请求体大小、引用文章数量和输出 token；密钥只保存在 Vercel Production 的 `DEEPSEEK_API_KEY` Secret 中。`DEEPSEEK_PUBLIC_ENABLED=true` 是部署时的开关；关闭时保留预写回答。

当前流量有两个入口，各自需要限流：

- `www.simi.host` 经 Cloudflare 代理。在 `simi.host` 的速率限制规则中，`URI 路径` 等于 `/api/answer`，按 IP 计数，10 秒内允许 1 次，超出后阻止 10 秒。Cloudflare Free 目前在控制台只提供这个窗口和阻止时间。已用连续请求验证第二次返回 429。
- `sim-web.vercel.app` 直达 Vercel。在项目 Firewall 中，`Request Path` 等于 `/api/answer` 且 `Method` 等于 `POST`，按 IP 固定窗口 10 分钟允许 6 次，超出后返回 429。已用连续请求验证第七次返回 429。Cloudflare 代理会影响 Vercel 对真实访客 IP 的识别，因此不能只依赖这一层保护主域名。

上线前确认 DeepSeek 账户的预付余额和自动充值设置符合愿意承担的费用上限；限流不等于每日或全站费用上限。设置开关后重新部署，再从主域名验证一次正常回答、无匹配内容、超长输入、跨站请求和预写主题卡，并观察两处 WAF 命中与 DeepSeek 消耗。共享 IP 的访客可能共用额度。模型回答目前完整返回后由页面分块呈现，尚非真实 token 流。

依据：[Cloudflare 速率限制](https://developers.cloudflare.com/waf/rate-limiting-rules/)、[Vercel 反向代理说明](https://vercel.com/docs/security/reverse-proxy/)、[Vercel WAF 限流](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)、[DeepSeek 模型与价格](https://api-docs.deepseek.com/quick_start/pricing/)、[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)。
