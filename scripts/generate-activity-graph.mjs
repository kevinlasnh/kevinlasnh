#!/usr/bin/env node
/**
 * 自托管活动图（Activity Graph）生成器
 *
 * 背景（本次新增的原因）：
 *   README 原来引用的第三方服务 github-readme-activity-graph.vercel.app 已经停用，
 *   访问时返回 HTTP 402「Payment required / DEPLOYMENT_DISABLED」，导致个人主页活动图整块空白。
 *   为了不再受任何第三方图床的额度与存活情况影响，这里改为和「贡献蛇」同样的思路：
 *   在 GitHub Actions 里自己生成 SVG，再发布到 output 分支供 README 以 raw 链接引用。
 *
 * 设计约束（刻意为之，请勿随手改动）：
 *   1. 零依赖：只用 Node 内置能力，不引入 npm 包，也不依赖任何第三方 Action，
 *      这样 CI 与本地都不会因为依赖失效或需要安装而失败。
 *   2. 零凭据：数据取自 GitHub 公开的 contributions HTML 端点（与登录页看到的热力图同源），
 *      不需要 PAT / Secret，符合仓库「不写入凭据」的约定。
 *   3. 深浅双版：一次生成 activity-graph.svg（浅色）与 activity-graph-dark.svg（深色），
 *      配色沿用 README 原第三方 URL 中的参数值，尽量保持视觉不变。
 *
 * 用法：
 *   node scripts/generate-activity-graph.mjs <username> <output-dir>
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// 画布与配色常量
// ---------------------------------------------------------------------------

const USERNAME = process.argv[2] || "kevinlasnh";
const OUT_DIR = path.resolve(process.argv[3] || "dist");

// viewBox 尺寸：沿用原第三方服务 1200x420 的比例，保证 README 里 width="97.5%" 的观感不变
const WIDTH = 1200;
const HEIGHT = 420;

// 绘图区内边距：左侧留给 Y 轴刻度，底部留给月份标签
const PAD = { top: 34, right: 26, bottom: 48, left: 52 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

// Y 轴刻度数量（含 0）
const Y_TICKS = 5;

/**
 * 两套主题的配色，直接继承原第三方 URL 的参数：
 *   light: color=57606A line=0969DA point=1E90FF area_color=87CEEB border_color=D0D7DE
 *   dark : color=E6F7FF line=00BFFF point=00D4FF area_color=1E90FF border_color=FFFFFF
 * 这里用字面色值而非 CSS 媒体查询，避免 GitHub Camo 代理下 prefers-color-scheme 失效。
 */
const THEMES = [
  {
    file: "activity-graph.svg",
    text: "#57606A",
    line: "#0969DA",
    point: "#1E90FF",
    area: "#87CEEB",
    border: "#D0D7DE",
    areaOpacity: 0.38,
    grid: "#D0D7DE",
    gridOpacity: 0.5,
  },
  {
    file: "activity-graph-dark.svg",
    text: "#E6F7FF",
    line: "#00BFFF",
    point: "#00D4FF",
    area: "#1E90FF",
    border: "#FFFFFF",
    areaOpacity: 0.32,
    grid: "#FFFFFF",
    gridOpacity: 0.16,
  },
];

// ---------------------------------------------------------------------------
// 数据获取与解析
// ---------------------------------------------------------------------------

/**
 * 抓取 GitHub 公开贡献日历页并解析为逐日贡献数。
 *
 * 该页面每个日期是一个 div.ContributionCalendar-day，带 data-date 与 data-level；
 * 精确次数写在紧随其后、以 for="<单元格id>" 关联的 <tool-tip> 文本里，形如：
 *   "5 contributions on January 25th." / "No contributions on September 21st."
 * 因此需要把 tooltip 按单元格 id 回填到对应日期上。
 *
 * @param {string} username GitHub 用户名
 * @returns {Promise<Array<{date: string, count: number}>>} 按日期升序排列的逐日数据
 */
async function fetchContributions(username) {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  const res = await fetch(url, {
    headers: {
      // 用普通 HTML 请求，避免拿到 JSON 变体；同时声明 UA，避免被边缘节点拦截
      Accept: "text/html",
      "User-Agent": "kevinlasnh-profile-activity-graph/1.0",
    },
  });
  if (!res.ok) {
    throw new Error(`拉取贡献数据失败：HTTP ${res.status} ${res.statusText} (${url})`);
  }
  const html = await res.text();

  // 第一步：单元格 id -> 日期，同时记录出现顺序（页面本身按周列排列，最后统一排序）
  const dateById = new Map();
  const cellRe =
    /<td[^>]*\bid="(contribution-day-component-[^"]+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g;
  for (const m of html.matchAll(cellRe)) {
    dateById.set(m[1], m[2]);
  }
  // 兼容 td 上属性顺序相反（data-date 在 id 之前）的情况
  if (dateById.size === 0) {
    const altRe =
      /<td[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*\bid="(contribution-day-component-[^"]+)"/g;
    for (const m of html.matchAll(altRe)) {
      dateById.set(m[2], m[1]);
    }
  }

  // 第二步：tooltip 文本 -> 次数，并以其 for 属性绑定的 id 回填日期
  const counts = new Map(); // date -> count
  const tipRe = /<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
  for (const m of html.matchAll(tipRe)) {
    const date = dateById.get(m[1]);
    if (!date) continue;
    const text = m[2];
    // "No contributions on ..." => 0；否则取开头的数字
    const num = /^(\d[\d,]*)\s+contribution/i.exec(text);
    counts.set(date, num ? Number(num[1].replace(/,/g, "")) : 0);
  }

  // 第三步：兜底。如果 tooltip 结构变化导致一个日期都没解析到，
  // 就用 data-level 近似（0-4 档），保证图表仍然能画出来而不是整体失败。
  if (counts.size === 0) {
    const levelRe =
      /id="(contribution-day-component-[^"]+)"[^>]*data-level="(\d+)"/g;
    for (const m of html.matchAll(levelRe)) {
      const date = dateById.get(m[1]);
      if (date) counts.set(date, Number(m[2]));
    }
    if (counts.size > 0) {
      console.warn("[warn] 未能解析精确贡献次数，已回退到 data-level 近似值。");
    }
  }

  if (counts.size === 0) {
    throw new Error("解析贡献数据失败：页面结构与预期不符，未取到任何日期数据。");
  }

  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// SVG 绘制
// ---------------------------------------------------------------------------

/**
 * 转义 XML 文本，避免用户名等外部输入破坏 SVG 结构。
 * @param {string} s
 */
function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[c]);
}

/**
 * 依据逐日数据生成一张活动图 SVG 字符串。
 *
 * @param {Array<{date: string, count: number}>} days 逐日贡献数据
 * @param {object} theme 主题配色
 * @param {string} username 用户名（仅用于无障碍标题）
 * @returns {string} SVG 文本
 */
function buildSvg(days, theme, username) {
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  // X 轴：每个自然日一个采样点，等距铺满绘图区
  const stepX = days.length > 1 ? PLOT_W / (days.length - 1) : PLOT_W;
  const xOf = (i) => PAD.left + i * stepX;
  // Y 轴：0 在底部，maxCount 在顶部；用 maxCount 归一化避免除零
  const yOf = (v) => PAD.top + PLOT_H - (v / maxCount) * PLOT_H;

  const points = days.map((d, i) => [xOf(i), yOf(d.count)]);

  // 面积路径：折线 + 右下 + 左下闭合，形成填充区域
  const areaPath =
    `M ${points[0][0].toFixed(2)} ${(PAD.top + PLOT_H).toFixed(2)} ` +
    points.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") +
    ` L ${points[points.length - 1][0].toFixed(2)} ${(PAD.top + PLOT_H).toFixed(2)} Z`;
  const linePath =
    `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} ` +
    points.slice(1).map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");

  const parts = [];

  // --- 背景与外框：bg_color=00000000（全透明）+ border_color，圆角沿用 radius=8 ---
  parts.push(
    `<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="8" ` +
      `fill="none" stroke="${theme.border}" stroke-opacity="0.65" />`
  );

  // --- 水平网格线与 Y 轴刻度（grid=true） ---
  const grid = [];
  const yLabels = [];
  for (let t = 0; t <= Y_TICKS; t++) {
    const value = Math.round((maxCount / Y_TICKS) * t);
    const y = yOf(value);
    grid.push(
      `<line x1="${PAD.left}" y1="${y.toFixed(2)}" x2="${(WIDTH - PAD.right).toFixed(2)}" y2="${y.toFixed(2)}" ` +
        `stroke="${theme.grid}" stroke-opacity="${theme.gridOpacity}" stroke-width="1" stroke-dasharray="3 4" />`
    );
    yLabels.push(
      `<text x="${PAD.left - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end" font-size="12" ` +
        `fill="${theme.text}" fill-opacity="0.75">${value}</text>`
    );
  }
  parts.push(`<g>${grid.join("")}</g>`);
  parts.push(`<g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${yLabels.join("")}</g>`);

  // --- 月份标签：在每个月第一天的位置打一个刻度并标注月份英文缩写 ---
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabels = [];
  const monthTicks = [];
  let lastMonth = null;
  days.forEach((d, i) => {
    const month = d.date.slice(0, 7);
    if (month === lastMonth) return;
    lastMonth = month;
    const x = xOf(i);
    monthTicks.push(
      `<line x1="${x.toFixed(2)}" y1="${PAD.top}" x2="${x.toFixed(2)}" y2="${(PAD.top + PLOT_H).toFixed(2)}" ` +
        `stroke="${theme.grid}" stroke-opacity="${theme.gridOpacity}" stroke-width="1" />`
    );
    // 首个标签若离左边界太近会与 Y 轴刻度重叠，最小保留少量缩进即可
    monthLabels.push(
      `<text x="${x.toFixed(2)}" y="${(HEIGHT - 16).toFixed(2)}" text-anchor="middle" font-size="12" ` +
        `fill="${theme.text}" fill-opacity="0.8">${monthNames[Number(d.date.slice(5, 7)) - 1]}</text>`
    );
  });
  parts.push(`<g>${monthTicks.join("")}</g>`);
  parts.push(
    `<g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${monthLabels.join("")}</g>`
  );

  // --- 面积与折线 ---
  parts.push(
    `<path d="${areaPath}" fill="${theme.area}" fill-opacity="${theme.areaOpacity}" stroke="none" />`
  );
  parts.push(
    `<path d="${linePath}" fill="none" stroke="${theme.line}" stroke-width="2" ` +
      `stroke-linejoin="round" stroke-linecap="round" />`
  );

  // --- 数据点：只在最近 14 天标记，避免 300+ 个圆点糊成一团（point 保持可见但不喧宾夺主） ---
  const dots = [];
  const dotFrom = Math.max(0, days.length - 14);
  for (let i = dotFrom; i < days.length; i++) {
    const [x, y] = points[i];
    dots.push(
      `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.6" fill="${theme.point}" />`
    );
  }
  parts.push(`<g>${dots.join("")}</g>`);

  // --- 无障碍：静态 SVG 无法显示 tooltip，用 <title> 提供整体说明 ---
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const title =
    `${escapeXml(username)} 最近一年贡献活动图：共 ${total} 次贡献，` +
    `单日最高 ${maxCount} 次（${days[0].date} 至 ${days[days.length - 1].date}）`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    parts.join("") +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[info] 拉取 ${USERNAME} 的公开贡献数据 ...`);
  const days = await fetchContributions(USERNAME);
  const total = days.reduce((s, d) => s + d.count, 0);
  console.log(
    `[info] 解析到 ${days.length} 天（${days[0].date} ~ ${days[days.length - 1].date}），合计 ${total} 次贡献。`
  );

  await mkdir(OUT_DIR, { recursive: true });
  for (const theme of THEMES) {
    const svg = buildSvg(days, theme, USERNAME);
    const file = path.join(OUT_DIR, theme.file);
    await writeFile(file, svg, "utf8");
    console.log(`[ok] 已生成 ${path.relative(process.cwd(), file)} (${Buffer.byteLength(svg)} bytes)`);
  }
}

main().catch((err) => {
  console.error(`[error] ${err.message}`);
  process.exit(1);
});
