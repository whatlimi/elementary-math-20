# math-20 — 设计

> 设计文档（how）。需求见 [requirements/math-20.md](../requirements/math-20.md)。
> 本文记录的是「从现在开始」的决策与关键替代方案；旧代码不做逐行考古（§10.2）。

## Goal

一个自包含、无依赖、儿童友好的 20 以内加减法练习单页应用，核心是
「通关收集伙伴 + 答错动画教学 + 独立学习记录 + 数据侧边栏」四件事，且中断可恢复。

## Current state

- 单文件 `math-20.html`，约 1700 行，内联两段 `<script>`：`#pure-logic`（纯逻辑、
  与 DOM 无关，可独立 `new Function()` 校验）与 `#dom-logic`（DOM/状态/事件）。
- 状态存 `localStorage`，key 前缀 `math20_`：cookies / companion / muted / perfect /
  lit / progress / history。
- 无构建系统、无留念的自动化测试（历史验证为一次性 DOM mock）。

## Approach

- **两段式脚本**：纯逻辑与 DOM 逻辑分离，是唯一可机检的验证切面
  （`new Function(code)` 做语法门）。
- **localStorage 单点状态**：所有持久化走 `LS` 对象映射的 key。
- **学习记录模型**：每条记录含 `id / status(ongoing|done|abandoned) / snapshot /
  questions / roundLog / q` 字段。`LS.progress` 只存「当前 ongoing 记录 id」，
  记录本体存进 `LS.history`，实现「每次开始独立成条 + 中断可续 + 完成后归档」。
- **状态快照**：`makeSnapshot()` 序列化 `litBuddies / cookies / perfectSets /
  companionIdx / totalCorrect`，点击历史记录可整体恢复到当时。
- **侧边栏**：数据分析与学习记录共用 `.stats-backdrop/.stats-panel` 结构，右侧滑入，
  点空白遮罩关闭。

### 决策记录（含被否决替代）

1. **学习记录存哪里**：进度并入 `LS.history`（当前 id 用 `LS.progress` 指针），
   每条独立带快照。
   - 否决：单独 `LS.progress` 存一份进度 + `LS.history` 存结果。缺点——中断后开始
     新套会覆盖旧进度，历史里的「进行中」记录无法追溯各自状态。
2. **创建新记录的时机**：用 `needNewRecord` 标志位，在「开始/下一套/重做/点历史重做」
   入口置位，`startRound()` 内才真正 `createRecord()`，并顺带把旧 ongoing 标记为
   abandoned。
   - 否决：`startRound()` 内无条件创建。缺点——`restoreProgress()` 恢复进度的路径
     也会走 `startRound()` 从而误建新记录；多条 ongoing 堆积。
3. **答错讲解形态**：方块图 + 分步动画，不给文字罪因。
   - 否决：文字解释行（exTip/explainLine）。用户 2026-09-11 拍板去掉；后又拍板动画
     回填（2026-09-18）。
4. **解锁机制**：一套全对点亮一只（20 只候选可自选目标）。
   - 否决：攒饼干按 cost 解锁（2026-09-18 变更）。
5. **初始化**：URL 参数 `?init` 清空 `math20_` 数据后 `location.replace`。
   - 否决：独立 `init.html` 页面（已合并进来，减少一个文件）。

## Affected files

- `math-20.html` — 唯一源码文件，全部改动落在它。

## Acceptance criteria

- `node -e` 包 `new Function` 校验 `#pure-logic` 与 `#dom-logic` 语法均通过。
- `node scripts/check-docs.mjs docs` 无 error（允许 warning）。
- 20 套通关、伙伴点亮、学习记录三态切换、`?init` 清空、回封面确认均无回归。

## Open items

- `open` 初始化入口是否要可见按钮（当前仅 `?init` 隐蔽参数）。
- `open` math-20 是否补入库的自动化验证脚本。