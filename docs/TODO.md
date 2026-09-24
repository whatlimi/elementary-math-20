# TODO

> 两池：需求（用户面向）+ 技术债（内部）。绝不混池。meta-schema §4/§7。
> 一个话题攒到 ≥2 个需求点、或全池 ≥3 点时，提醒批设计可以启动（用户拍板）。

## 需求池（Requirements）

- [ ] **math-20** 初始化入口的产品化（当前用 `?init` URL 参数，较隐蔽，待定是否要可见按钮）— `open`
- [ ] **zentao-tool** 连真实禅道验证 `/users`、任务类型、项目 vs 执行的环境假设
- [ ] **song-english-vocab** 用户在**本机**跑一次 `node scripts/fetch-lyrics.mjs` 抓齐 45 首歌词（沙箱内直连歌词 API 被拦）→ 然后写 `scripts/extract-vocab.mjs` 产出每首歌词表

## 技术债池（Tech debt）

- [ ] **math-20.html** 无留存自动化测试脚本（历史验证为一次性 DOM mock，未入库）
- [ ] **验证基线缺失**：本仓库无统一 test/lint/build 信号，仅 `scripts/check-docs.mjs` 做文档机检
- [ ] 历史原型 / 备份文件搁置（`style-A/B-entrance` 等），是否清理待用户拍板 — `open`