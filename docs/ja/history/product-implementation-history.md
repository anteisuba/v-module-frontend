# 実装履歴

- 简体中文: [产品实现历史](../../zh-CN/history/product-implementation-history.md)
- 最終更新: 2026-03-07

> 履歴文書です。現行仕様は [現状](../overview/current-status.md) とコードを優先してください。

## 目的

ページ設定中心のシステムが、ニュース、ブログ、ショップ、注文まで拡張されてきた経緯を整理します。

## 適用範囲

- 機能進化の振り返り
- 古い実装記録の読み分け

## 参照根拠

- 旧 `MIGRATION_SUMMARY.md`
- 旧 `BLOG_SHOP_IMPLEMENTATION.md`
- 旧 `PUBLIC_PAGES_IMPLEMENTATION.md`

## 関連文書

- [プロジェクト概要](../overview/project-overview.md)
- [現状](../overview/current-status.md)

## 進化の流れ

- 第1段階: ユーザー機能とページ設定システム
- 第2段階: ニュース管理と公開ニュースページ
- 第3段階: ブログとショップの Prisma モデル、公開ページ、管理画面
- 第4段階: 注文モデルと基本注文フロー。ただし閉ループは未完成

## 履歴文書から読み取れる重要点

- Blog / Shop / Order は計画だけではなく、実際に schema、route、UI まで入っている
- 古い文書は「どのファイルを作ったか」の記録として有用
- 注文、決済、メール、エクスポートは継続的に後回しになっている

## 利用方針

- 「過去に設計されたか」を確認したい時に履歴文書を見る
- 「今使えるか」を確認したい時は [現状](../overview/current-status.md) を見る
