# Repository Agent Markdown

## 仓库定位

- 这是 GitHub 特殊个人主页仓库 `kevinlasnh/kevinlasnh`。GitHub 会把 `main` 分支根目录的 `README.md` 渲染到 `https://github.com/kevinlasnh` 顶部。
- 本仓库是展示与自动生成资源仓库，不是应用程序：没有包管理器、编译入口、运行时服务或单元测试套件。
- 主页由手工维护的 Markdown/HTML、本地 SVG/JPG 素材、第三方动态图片服务，以及 `output` 分支上的贡献蛇与自托管活动图共同组成。

## 内容归属

| 路径或分支 | 归属 | 维护规则 |
|---|---|---|
| `README.md` | 人工维护 | 主页唯一入口；编辑时保留 GitHub 支持的 Markdown/HTML 混合布局、浅色/深色 `<picture>` 回退和现有对齐比例。 |
| `assets/` | 人工维护 | 包含浅色/深色头尾波浪、GitHub 动画图标和微信二维码；改名时同步更新 `README.md` 的相对引用。 |
| `.github/workflows/` | 人工维护 | 定义统计卡片生成、贡献蛇与自托管活动图的发布；这是隐藏目录默认忽略规则的明确 Git 跟踪例外。 |
| `scripts/generate-activity-graph.mjs` | 人工维护 | 自托管活动图生成器：零依赖、零凭据，抓取 GitHub 公开贡献数据后输出浅色/深色 SVG。仅在 `snake.yml` 的 Actions 步骤里调用，本地可手动运行调试。 |
| `profile-summary-card-output/` | Action 生成、`main` 跟踪 | 每个主题包含 5 张统计 SVG 和 1 份说明；不要手工批量编辑、格式化或修补，除非用户明确要求恢复或检查生成产物。根 README 当前不消费这些卡片。 |
| `output` 分支 | Action 生成 | 发布 `github-snake.svg`、`github-snake-dark.svg`、`activity-graph.svg` 和 `activity-graph-dark.svg`；不要手工提交，也不要合并回 `main`。 |
| `task_plan.md`、`findings.md`、`progress.md` | Agent 任务记忆 | 必须由 Git 跟踪，不得加入 `.gitignore`；按全局 PWF 规则增量维护。 |

## 自动化行为

- 两条工作流都支持手动触发、每天 UTC 00:00 定时触发，并监听 `main` push。
- `profile-summary-cards.yml` 使用仓库所有者作为用户名，借助 `GITHUB_TOKEN` 回写 `profile-summary-card-output/`。正常 push 后出现 `profile-summary-cards[bot]` 提交属于预期行为。
- `snake.yml` 先在 Actions 内用 `scripts/generate-activity-graph.mjs` 生成浅色/深色活动图，再生成浅色/深色贡献蛇，两类产物写入同一个 `dist/`，最后由 Pages action 一次性发布到 `output` 分支；根 README 使用 raw GitHub URL 读取这四个文件。
  - 之所以把活动图并进 `snake.yml` 而不是新开一条工作流：两条工作流都向同一个 `output` 分支发布，各自推送时容易清掉对方目录里的文件，因此必须共用一次发布。
  - 活动图**不再依赖任何第三方图床服务**。历史上 README 引用的 `github-readme-activity-graph.vercel.app` 已返回 HTTP 402 `DEPLOYMENT_DISABLED` 导致整块图空白，不要回退到该服务或其它来路不明的个人实例。
- 修改并推送任意受控文件都会触发上述自动化。排查额外提交或分支变化时，先区分预期 bot 输出与人工改动。
- 工作流需要 `contents: write`。未经用户明确要求，不改变触发范围、写权限、目标分支或 Action 版本。
- 不把 Personal Access Token、私钥或其他凭据写入仓库；工作流中只保留 GitHub Secrets 表达式。不要为补全私有统计擅自创建、索取或提交 PAT。

## 编辑约定

- 文本使用 UTF-8 + LF，并保持既有文件风格。生成卡片 SVG 是单行且通常无末尾换行，不要对其做全量换行或格式化归一化。
- 根 README 中的长查询 URL、URL 编码、行内图标和宽度比例会直接影响 GitHub 渲染；只做任务所需的最小改动，避免无关重排。
- 新增本地图片时使用相对路径，提供有意义的 `alt`；需要适配主题时沿用 `<picture>` 中 dark source、light source、fallback image 的结构。
- 远程统计卡、徽章等仍由第三方服务实时渲染，本地只能验证 URL 与标记结构；替换服务或域名前应核对浅色/深色效果、参数和失效回退。
- 活动图已改为自托管，因此修改它时要改 `scripts/generate-activity-graph.mjs`，并在本地重新生成、用浏览器渲染确认浅色/深色两版都清晰可读，而不是只改 README 里的 URL。
- 邮箱与微信二维码是当前有意公开的主页联系方式，但不要在未获用户明确要求时扩展、复制或更改个人信息。
- 不提交临时截图、浏览器渲染产物或生成器调试文件。

## 验证方式

仓库没有传统测试命令。按改动范围执行以下检查：

```bash
git diff --check
ruby -e 'require "yaml"; ARGV.each { |file| YAML.parse_file(file) }' .github/workflows/*.yml
while IFS= read -r file; do xmllint --noout "$file" || exit 1; done < <(git ls-files '*.svg')
cmp -s AGENTS.md CLAUDE.md
git check-ignore -q AGENTS.md || echo "AGENTS.md 未被忽略（预期）"
git check-ignore -q CLAUDE.md || echo "CLAUDE.md 未被忽略（预期）"
git ls-files --error-unmatch AGENTS.md CLAUDE.md
node scripts/generate-activity-graph.mjs kevinlasnh /tmp/activity-graph-check
xmllint --noout /tmp/activity-graph-check/*.svg
```

- 修改 Markdown 后，确认所有新增相对路径存在，并检查 GitHub 的浅色与深色渲染。
- 修改 SVG 后，至少做 XML 解析；涉及动画、尺寸或配色时，再用浏览器渲染代表帧检查。
- 修改工作流后，先做 YAML 语法检查；远端行为最终以 GitHub Actions 运行结果为准，不为测试擅自 push 或手动触发工作流。

## Git 与忽略规则

- 根目录 `AGENTS.md` 与 `CLAUDE.md` 是 Agent 配置：必须同时存在、内容完全一致、H1 保持为 `# Repository Agent Markdown`。
  - 二者**纳入 Git 跟踪、提交与 push**（与全局 AGENTS.md 的「仓库根 agent markdown 默认纳入跟踪」一致）。此前的 `/AGENTS.md`、`/CLAUDE.md` 忽略规则已从 `.gitignore` 移除，不要重新加回。
  - 修改其中任一份时必须同步另一份，保持逐字节一致。
- 仓库内隐藏目录默认忽略；`.github/` 是唯一当前明确需要 Git 跟踪的隐藏目录例外。新增其他隐藏目录追踪例外前，先更新本文件并说明原因。
- `.brv` 含本地 worktree 指针，必须保持忽略。PWF 三件套位于根目录且必须跟踪。
- 提交前查看 `git status`，避免把 bot 生成的大批卡片变化与人工主页改动混在同一提交中。
