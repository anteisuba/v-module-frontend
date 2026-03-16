# Scripts 兼容层说明

> 最后更新：2026-03-16

本目录包含构建和开发时的兼容层脚本。每个脚本存在的原因和移除条件如下。

---

## `run-node-tool.mjs`

**用途：** 包装 `next`、`playwright` 等 CLI 工具的启动入口，注入 `preload-baseline-warning.cjs` 以静默 `baseline-browser-mapping` 的过期数据警告。

**存在原因：** `baseline-browser-mapping`（`daisyui` 传递依赖）在版本数据过期时会向 stderr 输出警告，干扰 CI 日志和开发体验。通过 `NODE_OPTIONS=--require=preload` 拦截 `console.warn`。

**移除条件：**
- `baseline-browser-mapping` 移除了过期警告行为，或
- `daisyui` 不再依赖 `baseline-browser-mapping`，或
- 项目不再使用 `daisyui`

**影响范围：** `pnpm dev`、`pnpm build`、`pnpm test:e2e`

---

## `preload-baseline-warning.cjs`

**用途：** 被 `run-node-tool.mjs` 通过 `--require` 注入。设置环境变量 `BROWSERSLIST_IGNORE_OLD_DATA=1` 和 `BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA=1`，并过滤包含 `[baseline-browser-mapping]` 的 `console.warn` 调用。

**存在原因：** 与 `run-node-tool.mjs` 相同。

**移除条件：** 与 `run-node-tool.mjs` 相同，两者一起移除。

---

## `run-prisma-generate.mjs`

**用途：** 包装 `prisma generate --no-hints`，隐藏 Prisma CLI 的更新提示。

**存在原因：** Prisma CLI 在 `generate` 时输出版本更新提示，通过 `PRISMA_HIDE_UPDATE_MESSAGE=1` 静默。直接在 `package.json` 中设置该环境变量不够可靠（跨平台兼容问题），故用脚本包装。

**移除条件：**
- Prisma CLI 提供了原生的静默选项（如 `--quiet`），或
- `pnpm` 支持在 `scripts` 中可靠地内联环境变量（跨平台）

**影响范围：** `pnpm build`、`pnpm postinstall`

---

## `apply-migrations.ts`

**用途：** 自定义的数据库迁移运行器，替代 `prisma migrate deploy`。

**存在原因：**
1. 支持旧数据库的基线化（legacy baseline bootstrapping）：自动检测已有表结构并标记历史迁移为已应用
2. 逐语句执行迁移 SQL，对"对象已存在"等错误进行容错处理（`42P07`、`42701` 等 PostgreSQL 错误码）
3. 使用 SHA-256 校验和验证迁移文件完整性
4. 维护独立的 `app_migrations` 表追踪迁移状态

**移除条件：**
- 所有生产数据库已完成基线化（不再有 legacy 数据库），且
- `prisma migrate deploy` 满足所有运维需求（容错、校验等）

**影响范围：** `pnpm db:migrate`、`pnpm db:migrate:status`、CI 流水线

---

## `clear-rate-limit.ts`

**用途：** 清除数据库中的 rate limiting 记录。运维辅助脚本。

**存在原因：** 开发和运维中偶尔需要手动清除被限流的 IP/用户记录。

**移除条件：** 非兼容层脚本，按需保留。
