# 个人站内容目录与点击去向研究

观察日期：2026-09-21。范围：三个开发者本人网站，两个项目目录例子、一个文章目录例子。通过在线页面、实际链接跳转和站点直接返回的 HTML 核查；没有做浏览器截图验收，因此不据此断言像素外观或动效。

研究问题：项目是否必须经过站内介绍页；项目和笔记的条目应展示什么；完整目录能否独立于首页问答访问。本研究不决定框架、Bot 或文章公开范围。

## 1. Anthony Fu：项目名称和短说明直接链接到项目目的地

### 观察事实

- [Projects 页面](https://antfu.me/projects) 按 Current Focus、Vite Ecosystem、DevTools 等分组展示项目；顶部导航直接链接到该目录。条目包含图标、项目名和简短用途说明。
- 该页面返回的 HTML 使用 `project-grid` 网格和作为条目容器的 `<a class="item ...">`；名称、说明属于同一个链接。这里可确认是可点击的网格条目，不据此称它是与本站原型相同的描边卡片。来源：[Projects](https://antfu.me/projects)。
- 实际点击 Devframe 条目进入 [GitHub 仓库](https://github.com/devframes/devframe)；点击 Vitest 条目进入 [Vitest 官网](https://vitest.dev/)。两项都没有先经过 antfu.me 的项目介绍页。其目录 HTML 中相应链接设置了 `target="_blank"`。来源：[Projects](https://antfu.me/projects)。
- 目录开头说明范围包含本人创建或维护的项目；部分条目进一步标明参与角色，例如 Nuxt 标注 Team member，magic-string 标注 Maintainer。当前目录主要按生态和用途分组，没有观察到全页统一分成“本人创建／参与贡献”两大区，不能把角色标注解读成这样的分类体系。来源：[Projects](https://antfu.me/projects)。

### 对本站的推论

项目卡片可以是“项目名＋一句用途或本人贡献说明＋明确的目的地”，主链接直接去 GitHub；只有项目本身更适合官网时才配置官网链接。该例说明不必为每个开源项目先写站内介绍页，不代表所有项目都应去 GitHub。依据：[Anthony Fu 项目目录](https://antfu.me/projects)。

对于本站的 Apache 项目，可在短说明中写清本人角色或已核实贡献，避免将参与的社区项目描述为本人独立创建；这借鉴的是条目内标明关系的方式，不要求新增一套目录分类。依据：[Anthony Fu 项目目录](https://antfu.me/projects)。

## 2. Tania Rascia：项目卡片可区分源码、演示和可选介绍文章

### 观察事实

- [Projects 页面](https://www.taniarascia.com/projects/) 的站点导航提供独立 Projects 入口。每项展示年份、项目名称、短说明及相关链接；直接返回的 HTML 以 `<div class="card">` 组织项目，以 `card-header` 标记标题链接。
- TakeNote 卡片显示年份 2020、名称和简短笔记应用说明。标题和 Source 都进入 [GitHub 仓库](https://github.com/taniarascia/takenote)；Article 进入[本站介绍文章](https://www.taniarascia.com/building-takenote/)；Demo 链接到[应用地址](https://takenote.dev/)。这三种目的地在卡片内分别标注，标题不是站内文章入口。来源：[Projects](https://www.taniarascia.com/projects/)。
- 不是每个项目都有介绍文章。例如 Laconia 在目录中展示标题、年份、说明和 Source，没有 Article 或 Demo 入口。来源：[Projects](https://www.taniarascia.com/projects/)。
- TakeNote 的 Demo 链接已跟随打开，但网页读取工具没有提取出正文；这里只确认其实际链接目的地，不断言应用功能可用。

### 对本站的推论

优先保持一项一卡、一个明确主目的地；项目确实已有可用演示或相关笔记时，再提供相应次级链接。不要为了整齐而强制给每张项目卡片创建介绍页，也不要把源码、演示、站内文章混成同一种“详情”。依据：[Tania 项目目录](https://www.taniarascia.com/projects/)。

## 3. Josh W. Comeau：文章目录展示标题和摘要，正文留在站内

### 观察事实

- [首页的 Articles and Tutorials](https://www.joshwcomeau.com/) 是连续文章条目。每项有标题、摘要和 Read more，部分条目另有副标题。返回的 HTML 用 `<article>` 包裹条目；本研究将它称为文章摘要列表，不泛称所有条目都是描边卡片。
- 以 Getting Started with Anchor Positioning 为例，标题和 Read more 都指向[站内文章正文](https://www.joshwcomeau.com/css/anchor-positioning/)。正文包含分类、发表和更新时间、目录及完整教程；摘要不代替正文。来源：[首页](https://www.joshwcomeau.com/)、[文章页](https://www.joshwcomeau.com/css/anchor-positioning/)。
- 首页提供 Browse By Category，其中 CSS 实际进入[独立 CSS 文章目录](https://www.joshwcomeau.com/css/)。本次没有验证动态 Show more 加载的全集，不将首页当前条目视为完整文章档案。来源：[首页](https://www.joshwcomeau.com/)。

### 对本站的推论

笔记卡片使用“标题＋摘要”，点击进入站内正文，与用户当前方向一致；首页问答返回精选的相关笔记，Notes 目录负责完整浏览。卡片只是本站选定的呈现形式，借鉴的是该站“摘要入口到站内完整正文”的关系。依据：[Josh 首页](https://www.joshwcomeau.com/)、[CSS 目录](https://www.joshwcomeau.com/css/)。

## 对本站的收敛建议

以下是结合本轮用户要求形成的方案推论，不是三个参考网站已经实现了同一种首页会话：

- **Projects 目录**：一项一卡，展示项目名及短说明；点击目的地按项目配置，允许直接进入 GitHub。已有真实演示或相关文章时才增加次级入口。依据：[Anthony Fu](https://antfu.me/projects)、[Tania Rascia](https://www.taniarascia.com/projects/)。
- **Notes 目录**：一篇一卡，展示标题及摘要；点击进入站内正文。依据：[Josh W. Comeau](https://www.joshwcomeau.com/)。
- **顶部菜单**：直接进入对应的完整目录，不触发问答。独立目录入口有 [Anthony Fu Projects](https://antfu.me/projects) 和 [Tania Projects](https://www.taniarascia.com/projects/) 的直接例证。
- **首页主题与输入**：按本轮用户要求进入累积会话，每次展示短回答和相关项目、笔记卡片；同一内容在会话与完整目录中使用相同目的地。累积会话来自用户要求，本次三个站点没有被当作该行为的证据。
- **项目与笔记不强求相同去向**：项目允许站外目的地；笔记进入本站正文。是否为个别项目另写介绍文章，只由该项目已有内容及展示需要决定。

## 核查边界

- `/tutorials/` 未能通过网页工具访问，因此 Josh 案例改用已实际打开的首页文章列表与 `/css/` 分类目录，没有将不可访问路径当作有效目录。
- 仅研究以上三个站点；GitHub 仓库、项目官网和正文页只作为它们的实际链接目的地核实，未扩展为额外案例研究。
- 尚未据此确定本站最终路径命名、摘要长度、目录筛选方式、外链是否统一新标签打开、会话跨页返回与刷新后的保留方式。
