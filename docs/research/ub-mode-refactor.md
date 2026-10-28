# ub-mode 安装与边界简化记录

日期：2026-10-28。范围：当前访问资格和问答会话实现。

## 安装与依据

- 按上游 README 将原版 SKILL.md 安装到 `.agents/skills/ub-mode/`，在同目录 SOURCE.md 固定来源提交，在 AGENTS.md 加入项目约定。
- 使用上游的 Boundary Discipline、Subtract Before You Add 和 Refactoring：入口校验一次，内部依赖契约，以行为测试约束重构。
- 实施前核对本地 Next.js Route Handlers 指南和当前 AI SDK 源码。`Output.object` 的 `parseCompleteOutput` 调用 `safeValidateTypes`，所以最终结果无需在 context 模块重复 `answerSchema.parse`。

## 改动及原因

- 删除提交 Hook 的 questionSchema 解析：自由输入已在 Composer 规范化，主题入口使用固定枚举。
- 删除短历史投影的 answerRequestSchema 解析：消息来自上述入口，成功回答已通过流入口和生命周期检查；HTTP 路由仍校验收到的请求。
- 删除模型业务层的 answerSchema 解析：SDK 已完成结构校验；本轮引用范围和澄清规则仍由业务层负责。
- 删除资格查询的共享 Promise 及清理分支：同步提交门禁已禁止同一个 Chat 并发发送；清空创建新实例。
- 合并 HTTP 状态到用户错误的映射，避免三处维护。
- Cookie 验签后使用本站声明类型，删除重复字段形状检查及无法由签发器产生的 JSON 解析兜底；保留签名前的长度、格式和常量时间签名比较，以及版本、hostname、固定到期检查。
- 补充非法流数据测试时发现 SDK 的 schema 类型键与运行时查找键不同，原配置未实际校验。先确认测试失败，再以两个键指向同一 schema 修复入口；未在下游另加校验。
- 保留清空/取消后的迟到响应保护、正常终态判定，以及过时浏览器目录的引用检查：这些检查分别负责生命周期和跨部署目录差异。

## 验证

- 重构前补充模型结构拒绝与取消场景，确认原行为；非法客户端流测试复现现有入口配置问题。
- 最终 82 项服务端/模块测试、18 项客户端测试通过；lint、typecheck、format:check、构建和 diff whitespace 检查通过。
- 问答流与阅读返回的桌面/移动端 E2E 共 30 项通过，包含并发提交门禁、清空取消、导航中继续请求、异常流不出卡片、刷新重置和小屏换行。使用受控上游，不消耗真实模型额度。
- Dryer 在四个修改的生产文件中按 0.8 阈值扫描，无重复候选。
- Mutator 首轮执行 154 个变异，杀死 110 个，44 个存活。补充指代和主题分流行为测试后，上下文模块从 42/64（65.6%）提高到 59/64（92.2%）；结合未变动文件的首轮结果，总计 127/154（82.5%），仍有 27 个存活，未宣称变异门禁通过。
- 上下文剩余五个变异经检查在当前输入契约下等价：正则捕获字符串不会为空；最多五个引用时无效数组下标仍为 undefined；已知 article 目标的可选链不会改变结果；引用数组的 `??` / `||` 对数组等价。其他文件仍有等价变异与尚未覆盖的情况，不把存活数当成已确认缺陷数。
- Crapper 使用 c8 的 LCOV 报告：validateAnswer 6.2、shortRequest 8.5；createConversation 25.0、locateTarget 21.0、buildAnswerContext 21.0、exchanges 11.0、verifyAccessPass 11.0，尚未满足所有函数 `<10`。useConversation 的 20.0 来自 Node 测试未渲染 Hook，不能据此声称浏览器无覆盖；其交互由 E2E 验证。本次保持边界简化范围，不为压低分数额外拆分旧编排逻辑。

## 工具与操作记录

- 网络获取上游 Git 仓库时重试 HTTP/1.1；确认真实提交后安装，没有执行上游安装脚本。上游未提供独立 LICENSE 文件，此事实记录于 SOURCE.md。
- 配套工具安装在临时 Python 3.12 虚拟环境，没有修改项目依赖；版本为 Crapper `6fd92c4`、Dryer `66ff6d2`、Mutator `a5a0cb8`。解析器首次下载失败后使用现有代理重试成功。
- 先跑新增边界测试，再做生产重构；客户端非法流测试由失败转为通过。对变异暴露的真实行为覆盖缺口增加指代和集合选择测试，再差分运行变异。
- 生成的覆盖率 HTML 不进入仓库；质量工具快照和测试原始输出保留于本工作区已忽略的 `.local/ub-mode-validation/`。清理本轮生成物，没有移除其他工作树或改动。
- skill 安装与代码简化分开提交，继续使用 `feature/issue-1-access-pass` 和草稿 PR #5；不按上游通用推送说明直接改主分支。
