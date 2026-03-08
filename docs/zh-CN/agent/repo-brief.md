# 仓库摘要

- 最后更新：2026-03-08
- 角色：AI / 代理的快速项目概览，不替代正式长文档
- 正式来源：[`../overview/project-overview.md`](../overview/project-overview.md)、[`../overview/current-status.md`](../overview/current-status.md)

## 一句话定位

这是一个基于 Next.js App Router 的多用户创作者站点系统，覆盖公开页、后台 CMS、新闻、博客、商店和订单基础流程。

## 目标和边界

- 目标：让单个创作者通过一套后台维护自己的公开主页和内容模块
- 当前产品边界：认证、页面配置、新闻、博客、评论审核、商品、订单、媒体上传已经落地
- 当前不应误判为已完成的能力：购物车、多支付通道/退款后台、媒体库 UI、Turnstile / 验证码、更广泛自动化测试

## 当前能力

- 用户注册、登录、退出、密码重置
- `/u/[slug]` 配置驱动公开页
- 页面配置读写会自动清理 legacy `links` section，不再留下空白公开卡片
- 已接入 `vitest` 最小测试基线，覆盖认证、公开页读取、公开结账、订单详情、订单筛选导出、订单通知降级和评论审核 API
- 公开下单成功页已可读取订单详情，使用 `orderId + buyerEmail` 作为访客访问边界
- 卖家后台订单列表已支持搜索、状态过滤和 CSV 导出
- 订单创建和状态更新已接入邮件通知，邮件失败只降级记录日志，不回滚订单流程
- 已接入 Stripe Checkout + Webhook：公开结账会创建 Checkout Session，支付成功后回写订单并触发邮件通知
- 后台 CMS / 博客 / 商店编辑已统一为 tab + 折叠面板骨架，保留草稿保存和发布能力
- 新闻列表 / 详情 / 后台编辑
- 博客列表 / 详情 / 点赞 / 评论提交，评论默认进入审核队列；卖家后台可在 `/admin/comments` 审核与删除
- 商品管理、商店列表/详情背景编辑、公开商品展示、公开结账下单、卖家订单管理
- 媒体上传，本地文件系统和 Cloudflare R2 双分支

## 当前已知缺口

- `MediaAsset` 已落库，但没有真正的媒体库界面
- `pnpm lint` 不通过，自动化测试覆盖面仍然偏窄

## AI 阅读顺序

1. [`./repo-map.md`](./repo-map.md)
2. [`./workflows.md`](./workflows.md)
3. 对应局部 `CLAUDE.md`
4. 需要长解释时再回到 `docs/zh-CN/*`
