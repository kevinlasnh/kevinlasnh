# 发现与决策

## 需求
- 用户要求完整查看当前仓库，理解其用途后，在仓库根初始化 Agent Markdown。
- 根据全局规则，仓库根 `AGENTS.md` 与 `CLAUDE.md` 必须同时存在、内容完全一致，H1 为 `# Repository Agent Markdown`。
- 两份仓库根 Agent Markdown 必须加入 `.gitignore`；PWF 三件套不得忽略。
- 用户追加要求：记录当前进度，提交应入库的变更并推送到 `origin/main`。
- 用户要求恢复根 `README.md` 的全部展示功能，修复截图中的所有 error；仅在确实需要账号授权、密钥或人工配置时暂停请求协助，完成后记录进度并 push。

## 研究发现
- 归一化路径为 `/home/kevinlasnh/Projects/kevinlasnh`，未命中 Second Brain Path Guard。
- Git 仓库位于当前目录，当前分支为 `main`，与 `origin/main` 同步，初始工作区干净。
- 顶层包含 `README.md`、`assets/`、`.github/workflows/`、`profile-summary-card-output/` 和现有 `CLAUDE.md`。
- 现有 `CLAUDE.md` 将仓库描述为 `kevinlasnh/kevinlasnh` GitHub Profile README 仓库，但其 H1、同步状态和 Windows 本地路径均不符合当前要求。
- 初始状态不存在 `task_plan.md`、`findings.md`、`progress.md` 或 scoped PWF。
- Git 当前追踪 401 个文件：`profile-summary-card-output/` 391 个、`assets/` 6 个、`.github/` 2 个、根目录 2 个。
- 文件类型为 330 个 SVG、68 个 Markdown、2 个 YAML 工作流和 1 个 JPG；仓库主体是展示资源与自动生成的统计卡片，不是传统应用源码。
- `profile-summary-card-output/` 的结构可归纳为 65 套主题，每套 1 份 README 和 5 张 SVG，共 390 个生成文件，另有目录总 README。
- 根 `README.md` 约 7 KiB；生成目录总 README 约 64 KiB；二维码 JPG 约 118 KiB；单主题卡片大小和命名高度一致，适合通过结构化对比覆盖全部文件，而不是把 325 张生成 SVG 当作独立业务源码。
- 根 `README.md` 是实际展示入口，使用 GitHub Profile README 支持的 HTML/Markdown 组合，按浅色/深色主题切换本地头尾横幅和多项远程动态图片。
- 页面内容依次为动态欢迎语、访问量、技术栈、GitHub 统计/语言、奖杯、贡献蛇、活动图和联系方式；本地只承载 4 张头尾横幅、GitHub 动态图标和微信二维码，其余大多依赖第三方图片服务。
- 根 `README.md` 当前没有直接引用 `profile-summary-card-output/` 中的卡片；该目录更像生成器的完整产物/主题预览集合，而非主页当前布局的一部分。
- `.github/workflows/profile-summary-cards.yml` 在每天 UTC 00:00、手动触发和 `main` push 时运行，使用 `actions/checkout@v3` 与 `vn7n24fzkq/github-profile-summary-cards@release`，并授予 `contents: write` 以回写 65 套卡片。
- `.github/workflows/snake.yml` 触发条件相同，使用 `Platane/snk/svg-only@v3` 生成亮/暗两张贡献蛇 SVG，再由 `crazy-max/ghaction-github-pages@v3.1.0` 发布到 `output` 分支；根 README 直接引用该分支的 raw URL。
- 远程 `origin` 为 `https://github.com/kevinlasnh/kevinlasnh.git`；仓库名与 GitHub 用户名一致，因此根 README 会成为该账号的 GitHub 个人主页介绍。
- 最近提交几乎都是 `profile-summary-cards[bot]` 的每日卡片更新，夹有 `github-actions[bot]` 的 output 分支部署，说明自动化生成是仓库日常主要变更来源。
- 已确认 65 个主题目录，每个都包含固定命名的 `0-profile-details.svg`、`1-repos-per-language.svg`、`2-most-commit-language.svg`、`3-stats.svg`、`4-productive-time.svg` 和 `README.md`。
- `profile-summary-card-output/README.md` 共 267 行，结构是 7 行标题/提示，加上 65 个各占 4 行的主题预览块；每块链接该主题 README，并以内嵌 raw GitHub URL 展示 5 张卡片。
- 每个主题 README 都提供该主题的 5 张本地预览、可直接复制到其他 Markdown 的 raw URL 组合，以及单卡引用示例；这些都是生成器模板产物。
- 生成目录总 README 明确提示：若工作流只用默认 `GITHUB_TOKEN` 而非额外 Personal Access Token，可能只能完整显示 Top Languages 等公开信息。当前工作流确实只传入默认 `secrets.GITHUB_TOKEN`，Agent 不应擅自创建或要求泄露 PAT。
- 5 张卡片的固定语义分别是：账号/近一年贡献趋势、按仓库计的语言分布、按提交计的语言分布、汇总统计、按 UTC 小时计的提交活跃度；详情卡尺寸为 700×200，其余为 340×200。
- 代表性 `react` 主题表明所有卡片包含同一时点的数据快照（公开仓库、贡献、语言、Stars/Commits/PR/Issues 等），主题主要改变颜色和边框，不改变信息模型。
- 当前生成快照的语言前三为 Python、C、PowerShell；这些数值和排序由 Action 定期更新，Agent Markdown 应描述其生成性质，不固化易过期的具体统计值。
- 本地 5 个 SVG 均为 ASCII SVG；微信二维码是 950×1300 的 JFIF JPEG。头尾各有浅色/深色版本，另有一个 GitHub 动画图标。
- 已用 XML 解析器逐个校验全部 330 个 SVG，0 个无效文件；其中生成卡片恰为 65 张 700×200 详情卡和 260 张 340×200 其余卡片。
- 针对五种卡片分别抽取全部 65 个主题的文本节点后，每种都只有一个内容哈希，证明主题之间的数据与语义完全一致，仅视觉样式不同。
- 65 个主题目录与总 README 的 65 个主题标题集合完全一致，每个目录都恰有 6 个文件，没有缺失或多余产物。
- 四张 capsule wave 横幅均为 854×105、14 秒无限循环的双层渐变波浪；footer 通过 180° 旋转形成收尾方向，light/dark 版本只改变配色。
- `github-animated-white.svg` 使用两个 SVG mask 和 5 秒无限循环的描边/填充动画，在白色圆形背景中绘制深色 GitHub 标志。
- 微信二维码 JPG 已完成视觉检查：是 `kevinlasnh` 的微信名片二维码，根 README 的 WeChat badge 链接到该图，属于有意公开的联系方式素材。
- 通过本机 Chrome 将 5 个动态 SVG 渲染为临时静态帧后完成视觉核验：header 波浪从有色顶部过渡到白底，footer 为其上下反向；light 使用浅蓝/白，dark 使用深灰蓝/亮青；GitHub 图标在采样时处于轮廓绘制中，与源码动画吻合。
- 全部主题 README 在只规范化主题标题和路径后得到同一个哈希，确认 65 份说明均来自同一模板，没有内容漂移。
- 所有 401 个初始受控文件模式均为普通 `100644`，无可执行文件或 symlink；文本无 CRLF。325 个无末尾 LF 的文件恰对应生成的卡片 SVG，应保留生成器格式，避免无意义的全量格式化。
- main 有 185 个提交，仓库总历史含 output 分支为 186 个提交；其中 103 个由统计卡片 bot 生成，74 个来自 `kevinlasnh`，8 个来自旧作者名，output 分支当前是单个 Actions 部署提交。
- 仓库始建于 2025-12-22，2026-05-01 完成动态组件和 Actions 重构；2026-05-02 后主要由每日卡片更新驱动。现有 `CLAUDE.md` 也创建于 2026-05-01，仍被 Git 以普通文件追踪。
- `main` push 同时触发两条工作流：任何被推送的人工维护改动都可能紧接着产生统计卡片 bot 提交，并刷新 `output` 分支；排查“额外提交”时应先区分预期自动化和人工改动。
- 修正计数方式后，总 README 中每个主题都恰有 1 个本地 README 链接和 5 个 raw 卡片 URL，异常数为 0。
- 已从全部 68 个受控 Markdown 中抽取并解析 396 个相对路径引用，全部目标存在；根 README 的 6 个唯一相对资源也都位于 `assets/`。
- 根 README 依赖多个远程渲染服务，主要包括自托管 GitHub Stats/Activity Graph、Skillicons、Techstack Generator、raw GitHub、Shields、Typing SVG、访问量和奖杯服务；远程可用性不是本仓库本地测试能完全保证的。
- 两个 workflow YAML 均通过本地 YAML 语法解析。Actions 使用版本/通道标签（`actions/checkout@v3`、卡片生成器 `@release`、snake `@v3`、pages action `@v3.1.0`）而非 commit SHA；维护时不要无依据升级或重写自动化。
- `origin/output` 是由 Pages action 维护的单提交发布分支，当前只含两张 52,407 字节、880×192 的有效 SVG：浅色与深色贡献蛇；动画周期约 31.5 秒，颜色与 `snake.yml` 参数一致。
- output 分支两张蛇图已通过 Chrome 临时渲染帧视觉确认：均为贡献方格上的蓝色蛇，浅色版使用浅蓝方格，深色版使用深蓝方格；临时文件已清理。
- 新 `AGENTS.md` / `CLAUDE.md` 各 59 行，SHA-256 完全相同，H1 均为 `# Repository Agent Markdown`，编码为 UTF-8。
- `.gitignore` 已验证：两份 Agent Markdown 和 `.brv/` 被忽略；PWF 三件套与 `.github/workflows/` 不被忽略；现有两份 workflow 继续处于 Git 追踪中。
- 最终回归验证通过：工作区/索引 diff 无空白错误、两份 YAML 可解析、330/330 个 main 分支 SVG XML 有效、新增维护文件无行尾空白。
- 发布前必须重新 fetch：该仓库每天由 `profile-summary-cards[bot]` 更新，先前同步状态可能已经过时。
- 2026-07-31 发布前 fetch 发现 `origin/main` 比本地前进 1 个提交：`91db9539`（`profile-summary-cards[bot]`，`Generate profile summary cards`）；`origin/output` 也被 Action 强制刷新到 `21090aba`。提交前需要先确认远端 main 变更仅为预期生成产物，再安全整合。
- 已核对 `91db9539`：只修改 `profile-summary-card-output/` 下 130 个自动生成 SVG（65 个主题各自的详情卡与统计卡），与 `.gitignore`、PWF 和停止追踪 `CLAUDE.md` 的本地变更无路径重叠，可安全 fast-forward。
- 主发布提交 `473d2ac6` 已成功推送到 `origin/main`。push 随即触发卡片工作流，远端生成 `557e91b4`；已确认 `473d2ac6` 是其祖先，说明人工提交完整保留。
- `557e91b4` 仍只修改 `profile-summary-card-output/` 下 130 个自动生成 SVG（每主题的 stats 与 productive-time），属于预期 bot 回写；本地已 fast-forward 到该远端落点。
- 当前 README 的故障集中在三个自定义/公共 Vercel 图片服务：Stats 使用 `github-readme-stats-omega-three-23.vercel.app`，Trophy 使用 `github-profile-trophy.vercel.app`，Activity Graph 使用 `github-readme-activity-graph-xi-murex.vercel.app`。
- Git 历史显示 Stats 曾在 `47fe10e0` 改用仓库内 `profile-summary-card-output` 静态卡片，随后在 `1a1795ed` 切到自托管 Stats，并在 `4b3f0815` 调整为当前透明主题；恢复仓库内 Action 生成卡片是已有历史方案，不是缩减功能。
- 2026-07-31 查询 GitHub Actions：最近的 Profile Summary Cards 与 Snake 工作流（含本次 push 和每日 schedule）均成功，说明本地统计卡片生成链路和 `output` 分支贡献蛇链路当前健康；截图故障不来自这两条 Action。
- 直接端点探测确认 Shields 三个 badge、Komarev 访问量、Typing SVG、Skillicons 七个图标，以及 output 分支浅/深色贡献蛇均返回 HTTP 200 和有效 SVG。
- 当前环境对所有被测 `*.vercel.app` 域名统一出现 TLS `unexpected eof while reading`，不仅包括截图中故障的 Stats/Trophy/Activity Graph，也包括截图仍能显示的 Techstack Generator；因此该 curl 结果受环境链路影响，不能单独作为服务失效证据，后续改用 GitHub Camo/实际渲染内容验证。
- 通过 GitHub README HTML 取得实际 Camo URL 后复核：Techstack Generator 的 5 个 SVG 均为 HTTP 200 有效图片，属于视觉对比度问题而非破图。
- 同一 Camo 证据确认 Stats 的亮/暗统计卡和语言卡四个 URL 全部返回 775 字节错误 SVG，文本为 “Something went wrong!”；Trophy 的 Camo 请求返回 HTTP 502；Activity Graph 的亮/暗 URL都返回错误 SVG，文本为 “Can't fetch any contribution”。这三项故障已由 GitHub 实际渲染链路直接证实。
- 尝试通过 Tavily 查询当前维护端点时，服务返回账户用量上限错误，未取得搜索结果；候选服务研究改走 GitHub 官方 API/仓库 README，最终仍以 Camo 响应为准。
- `ryo-ma/github-profile-trophy` 官方 README 当前明确列出 16 个志愿者负载均衡端点，并提示主服务受成本与流量压力影响；奖杯修复应从该官方候选集选择经 GitHub Camo 实测健康的镜像，而不是继续依赖故障主端点。
- `Ashutosh00710/github-readme-activity-graph` 官方 README 明确声明 canonical deployment 已迁移到 `https://github-readme-activity-graph.vercel.app`；当前 README 使用的自定义 `-xi-murex` 域名并非官方推荐入口。
- 通过本机既有 `gh` 登录调用 GitHub Markdown API，再下载其生成的 Camo 响应，16 个官方 Trophy 镜像中有 7 个对当前参数返回 HTTP 200、有效 SVG 且无错误文本：`trophygithubreadmelang.cybee.dpdns.org`、`trophy.ryglcloud.net`、`github-profile-repo.vercel.app`、`github-profile-trophy-orcin-eta.vercel.app`、`trophy.benkou.dev`、`github-trophies.devomb.com`、`github-profile-trophy-unserori.vercel.app`；其余候选返回 404 或 502。
- canonical Activity Graph 的浅色与深色完整参数 URL 均经 GitHub Camo 返回 HTTP 200、17,862 字节有效 SVG，未包含贡献获取错误；替换域名即可保留现有布局与主题参数。
- 历史版本 `47fe10e0` 已证明根 README 可直接消费 Action 生成的本地 Stats 卡片；当前 `github/` 与 `github_dark/` 中的统计卡和提交语言卡尺寸均为 340×200，分别使用白色与 `#0d1117` 背景，适合通过 `<picture>` 做原生浅色/深色切换并保持两卡布局。
- 历史版本 `4b3f0815` 曾用单张 Skillicons 网格承载完整 13 项技术栈；恢复统一网格并显式设置 `theme=light` / `theme=dark`，可消除当前 Techstack Generator 首行在深色主题下的低对比度，同时保留原有技术项。
- 13 项统一 Skillicons 网格的 `theme=light` 与 `theme=dark` URL 均经 GitHub Camo 返回 HTTP 200、有效 SVG，固有尺寸同为 385.5×104.25；适合作为当前两行散图的主题自适应替代。
- 对三个健康的非主 Trophy 镜像补做直接请求，均返回同一份 50,478 字节有效奖杯 SVG；最终选择官方负载均衡列表中首个且 Camo/直连双重通过的 `trophygithubreadmelang.cybee.dpdns.org`，保留原 `algolia` 主题与布局参数。
- `%2C` 修复后，完整 README 经 GitHub Markdown API 渲染出 27 个 `img` / `source` 标签；其中 8 个本地相对图片目标全部存在，12 个唯一远程图片经实际代理请求全部为 HTTP 200 有效 SVG，错误文本命中数为 0。
- 确定性浅色/深色浏览器预览均无破图：浅色使用白底 `github` Stats 与浅色 Snake/Activity；深色使用 `github_dark` Stats 与深色 Snake/Activity；Trophy 在透明背景下两套主题均清晰，统一 Tech Stack 在深色背景下对比度充足。
- README 修复发布前 fetch 结果为 `HEAD...origin/main = 0/0`，远端 `main` 无新提交；`origin/output` 从旧 Action 发布点强制更新到新 Snake 产物，属于机器维护分支的预期行为，不需合并进 `main`。
- 修复提交 `d318d016` 已成功推送；其触发的 Profile Summary Cards 与 Snake 两条 Actions 均成功。统计卡工作流随后创建 `0ca04357`，只更新 65 个主题各 3 张生成 SVG，共 195 个文件；本地已 fast-forward，人工修复提交完整保留。
- 线上 `https://github.com/kevinlasnh` 返回 HTTP 200，并已包含健康 Trophy 镜像、canonical Activity Graph、`github` / `github_dark` 本地 Stats 路径；四个旧故障服务域名均未出现。远端 README blob `64c9a699806a0ce1de03eff5767eaf381dab96de` 与本地 `origin/main` 完全一致。
- 当前状态审计再次确认本地与 `origin/main` 同为 `b0e7bd1a`，工作区在审计写入前干净，README 修复的两条 Actions 仍显示成功，最终 `[skip ci]` checkpoint 没有新 Actions 运行。
- 当前线上 Profile README 文章包含 27 个 `img` / `source` 标签；12 个唯一外部图片实际响应全部为 HTTP 200 有效 SVG，旧故障域名、错误 SVG 文本和截断的 Skillicons 列表均为 0。
- X、Email、WeChat 三个联系方式链接均存在；WeChat GitHub 展示页返回 HTTP 200 HTML，底层 raw 二维码返回 HTTP 200 `image/jpeg`，大小 120,884 字节。线上本地图片引用均被 GitHub 正确展开到仓库 `raw/main` 路径。
- 当前线上 8 个唯一仓库本地 SVG（4 张头尾主题横幅、`github` / `github_dark` 两类 Stats 各 2 张）全部经 GitHub raw 路径返回 HTTP 200 且 XML 有效；远端 README blob SHA 继续与 `origin/main` 一致。
- 从实时 Profile HTML 提取 README 文章后重新执行确定性浅色/深色 Chrome 渲染，两套主题下所有展示组件均清晰完整；未发现用户截图中的 Stats 限流卡、Trophy 破图、Activity Graph 获取失败或 Tech Stack 深色不可见问题。临时审计文件已清理。

## 技术决策
| 决策 | 理由 |
|------|------|
| 先完成受控文件与历史审阅，再编写 Agent Markdown | 避免把表面目录结构误写成维护事实 |
| 明确记录 `.github/` 为隐藏目录追踪例外 | 其中工作流是仓库功能的一部分，不能按默认隐藏目录策略忽略 |
| 将 `profile-summary-card-output/` 标注为自动生成目录 | 提交历史和工作流均表明它由 GitHub Action 持续回写，不宜手工批量编辑 |
| 在维护说明中明确 push 的自动化副作用 | 两条工作流都监听 `main` push，正常提交会触发回写/发布，容易被误判为意外修改 |
| 将 `output` 分支标记为机器维护且禁止合并回 main | 分支仅承载 Action 发布的两张贡献蛇，根 README 通过 raw URL 消费它们 |
| `.gitignore` 使用 `.*/` 并以 `!.github/`、`!.github/**` 建立例外 | 满足所有隐藏目录默认忽略，同时保证 `.github/` 现有及未来工作流文件可追踪 |
| 从索引移除旧 `CLAUDE.md`，保留工作区并与 `AGENTS.md` 同步 | 落实仓库根 Agent Markdown 本地维护、不提交的约束 |
| 最终 PWF 发布 checkpoint 使用独立 `[skip ci]` 提交 | 记录真实 push 与 bot 回写结果，同时避免仅文档进度更新再次触发两条生成工作流 |
| Stats 改用本地 `github` / `github_dark` Action 产物 | 避开运行时 API 限流；卡片由当前健康的每日工作流更新，且能随 GitHub 明暗主题切换 |
| Trophy 使用 `trophygithubreadmelang.cybee.dpdns.org` | 该端点来自项目官方负载均衡清单，并通过 GitHub Camo 与直接请求双重验证 |
| Activity Graph 仅替换为 canonical 域名 | 维护方明确推荐该部署；现有颜色、尺寸和明暗主题参数无需改变 |
| Tech Stack 恢复统一 Skillicons 网格并显式传入主题 | 保留全部 13 项技术栈，同时修复当前混合来源图标在深色背景下的低对比度 |

## 遇到的问题
| 问题 | 解决方案 |
|------|---------|
| 只有 `CLAUDE.md`，缺少同步的 `AGENTS.md` | 最终以同一份新内容同步生成两份文件 |
| 环境未安装 ImageMagick，`identify` 无法运行 | 已由 `file` 获取二进制格式和 JPG 尺寸；后续用 XML 校验及现有图片查看工具覆盖 SVG/视觉检查 |
| 内置图片查看工具无法渲染仓库中的动态 SVG | 不重复直接打开；动画形态已从完整 SVG 源码确认，并查找现有本地渲染器作为可选补充 |
| 首次用 `grep -c` 校验主题 raw URL 时把“匹配行数”误当“出现次数” | 该结果不是仓库异常；改用 `grep -Fo` 统计每个实际匹配并重新验证 |
| `tavily-search` 返回 “request exceeds plan usage limit” | 停止重复搜索，使用 GitHub 原始仓库资料与 Camo 端点验证 |
| GitHub Markdown API 返回匿名速率限制 403 | 停止匿名 API 重试；先检查本机是否已有可安全复用的 `gh` 登录，再选择认证 API 或非 API 验证路径 |
| GitHub Markdown 渲染将 Skillicons `srcset` 中未编码的逗号视为图片候选分隔符 | `source` 的 canonical URL 被截断为 `i=python`；必须把图标列表逗号编码为 `%2C`，不能直接复用普通 `img src` 的写法 |
| Headless Chrome 默认继承宿主深色偏好，初次白底截图仍选择 dark source | GitHub markup/media 条件已单独验证；视觉回归改为对每个 `<picture>` 显式选择对应主题 source，避免把测试环境偏好误判为 README 缺陷 |
| 完成审计初版把 WeChat 链接的 GitHub blob 展示页要求为直接 JPEG | 这是验证器条件错误；README 链接的预期行为是打开 GitHub 图片展示页，应验证页面可达并另行核验其中的 raw JPEG |

## 资源
- 本地 Git 仓库及其受控文件、提交历史和配置。

## 视觉/浏览器发现
- JPG 微信名片已视觉确认；5 个动态 SVG 已通过 Chrome 临时渲染帧确认视觉方向、浅深色配色和绘制动画。临时预览已删除，仓库未产生资源改动。
- 用户提供的 GitHub 深色主题截图显示：本地头尾波浪、动态欢迎语、访问量、贡献蛇、Email/WeChat badge 可见；两张 GitHub Stats 均返回 “Something went wrong / Downtime due to GitHub API rate limiting”；GitHub Trophy 是破图；Activity Graph 返回 “Can't fetch any contribution. Please check your username”；技术栈首行部分图标在深色背景下对比度很低；X badge 的图形也需进一步确认。

---
*每执行2次查看/浏览器/搜索操作后更新此文件*
*防止视觉信息丢失*
