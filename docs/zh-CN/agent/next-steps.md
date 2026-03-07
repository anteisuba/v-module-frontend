# 后续建议摘要

- 最后更新：2026-03-07
- 角色：AI / 代理视角的优先级摘要，不是 canonical backlog
- canonical backlog：[`../overview/backlog.md`](../overview/backlog.md)

## P0

- 给后台 Dashboard 增加订单入口，修复“能力已存在但不可发现”的问题
- 清理 `/blog`、`/shop` 的硬编码用户重定向，明确通用入口策略
- 处理 `PageConfig.links` 与渲染器行为不一致的问题
- 建立最小测试基线，至少覆盖认证、公开页读取和订单创建

## P1

- 实现订单详情页、搜索、过滤和导出
- 增加订单创建 / 状态更新通知邮件
- 明确支付集成方案
- 为评论补齐审核后台
- 把 `MediaAsset` 扩展成真正可选择的媒体库 UI

## P2

- 购物车和多商品结账
- 库存预警
- 直播日程模块
- 更完整的 SEO、监控、日志和错误追踪

## 使用约束

- 如果只需要排期或背景，请读这个文件
- 如果要改优先级或确认正式计划，请回到 [`../overview/backlog.md`](../overview/backlog.md)
