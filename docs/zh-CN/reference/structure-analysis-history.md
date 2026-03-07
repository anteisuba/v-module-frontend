# 结构分析历史

- 日本語: [構造分析の履歴](../../ja/reference/structure-analysis-history.md)
- 最后更新: 2026-03-07

> 历史记录，可能与当前目录不完全一致。当前结构请以 [模块地图](../architecture/module-map.md) 为准。

## 用途

保留早期结构分析里的判断、分层建议和迁移背景。

## 适用范围

- 理解为什么目录会呈现当前形态
- 回看早期的 FSD 改造目标

## 来源依据

- 原 `STRUCTURE_ANALYSIS.md`
- 当前目录扫描

## 相关链接

- [模块地图](../architecture/module-map.md)
- [系统架构](../architecture/system-architecture.md)

## 历史分析中仍然有效的观点

- `features/` 和 `domain/` 分层方向是对的
- 通用 UI 与业务编辑器混放会增加维护成本
- 类型、hook、服务如果不收敛，会让边界持续模糊

## 已经变化的部分

- 仓库现在已经有 `features/`、`domain/`、`lib/api/` 等明显分层，不再是纯扁平结构
- 某些早期“待迁移”问题已经部分落地，不应直接照搬旧目录建议

## 当前仍需关注的结构问题

- `components/ui/` 依然过重
- 页面层与 route handler 的职责边界不完全统一
- 配置类型与实际渲染器行为存在漂移
