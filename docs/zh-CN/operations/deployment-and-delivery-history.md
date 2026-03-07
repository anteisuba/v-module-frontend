# 部署与投递历史

- 日本語: [デプロイと配信の履歴](../../ja/operations/deployment-and-delivery-history.md)
- 最后更新: 2026-03-07

> 历史记录，可能与当前代码不完全一致。当前推荐做法以 [部署与环境变量](./deployment-and-env.md) 为准。

## 用途

保留旧部署、邮件、R2 和域名投递相关文档的背景信息，避免历史决策丢失。

## 适用范围

- 历史部署追溯
- 邮件投递方案回顾
- R2 接入背景理解

## 来源依据

- 原 `DEPLOYMENT_*`
- 原 `SMTP_SETUP_GUIDE.md`
- 原 `RESEND_*`
- 原 `CLOUDFLARE_R2_SETUP.md`

## 相关链接

- [部署与环境变量](./deployment-and-env.md)
- [文档迁移映射表](../reference/doc-migration-map.md)

## 保留的历史要点

- 项目曾以 Vercel + PostgreSQL + 自定义域名为默认生产方案
- 邮件投递曾同时保留 Resend 与 SMTP 两条路径
- R2 被选作生产上传存储，开发环境允许回退到本地文件系统
- 历史文档里存在详细的域名验证、DNS 配置、部署检查表与 checklist

## 已被新文档吸收的内容

- 当前部署拓扑与环境变量：见 [部署与环境变量](./deployment-and-env.md)
- 当前对象存储和上传链路：见 [数据库与基础设施](../development/database-and-infra.md)
- 当前产品状态：见 [当前状态](../overview/current-status.md)
