# 产品实现历史

- 日本語: [実装履歴](../../ja/history/product-implementation-history.md)
- 最后更新: 2026-03-07

> 历史记录，可能已过期。当前实现以 [当前状态](../overview/current-status.md) 和代码为准。

## 用途

概括项目从基础页面配置走到新闻、博客、商店和订单的实现脉络。

## 适用范围

- 回看功能演进
- 判断哪些文档是实施记录而不是当前规范

## 来源依据

- 原 `MIGRATION_SUMMARY.md`
- 原 `BLOG_SHOP_IMPLEMENTATION.md`
- 原 `PUBLIC_PAGES_IMPLEMENTATION.md`

## 相关链接

- [项目概览](../overview/project-overview.md)
- [当前状态](../overview/current-status.md)

## 演进摘要

- 第一阶段：用户系统与页面配置系统落地，公开页使用 `publishedConfig`
- 第二阶段：新闻系统加入后台管理和公开列表 / 详情页
- 第三阶段：博客和商店模型加入 Prisma，公开内容页与后台管理页同步增加
- 第四阶段：订单模型与基础下单流程加入，但闭环仍未完全打磨

## 历史文档中最值得保留的结论

- Blog / Shop / Order 已经不是纯计划，而是实际落在 schema、路由和前端页面上的能力
- 历史文档描述了“创建了哪些文件”，适合回溯，不适合当作当前规范
- 订单、支付、邮件通知和导出一直是延后项

## 当前应如何使用这些历史信息

- 需要确认“是否曾设计过”时看历史文档
- 需要确认“现在能不能用”时看 [当前状态](../overview/current-status.md)
