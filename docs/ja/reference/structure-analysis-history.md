# 構造分析の履歴

- 简体中文: [结构分析历史](../../zh-CN/reference/structure-analysis-history.md)
- 最終更新: 2026-03-07

> 履歴文書です。現在の構成は [モジュールマップ](../architecture/module-map.md) を優先してください。

## 目的

初期の構造分析で議論されていた問題意識と分割方針を残しておきます。

## 適用範囲

- 現在のディレクトリ構成の背景理解
- FSD 的な再編方針の追跡

## 参照根拠

- 旧 `STRUCTURE_ANALYSIS.md`
- 現在のディレクトリ走査

## 関連文書

- [モジュールマップ](../architecture/module-map.md)
- [システム構成](../architecture/system-architecture.md)

## まだ有効な指摘

- `features/` と `domain/` へ分ける方向自体は妥当
- 共通 UI と業務エディタの混在は保守性を下げる
- 型、hook、service の散逸は境界を曖昧にする

## 変化した点

- 既に `features/`, `domain/`, `lib/api/` などの分離は部分的に実現済み
- 旧文書の「これから移す」は現状にはそのまま当てはまらない

## 今も残る構造課題

- `components/ui/` が依然として肥大化している
- page 層と route handler の責務整理が途中
- 設定型とレンダリング実装のズレが残っている
