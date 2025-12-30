# 機能詳細：ウィジェット配信 (Widget Delivery)

## 1. 配信メカニズム

- **Loader**: 1 行の `<script src=".../widget.js"></script>` タグを提供。
- **Iframe 生成**: `widget.js` が `document.createElement('iframe')` を行い、DOM の末尾に挿入。
- **CSS 分離**: Iframe を使用することで、親サイトの CSS と競合させずに独自の Tailwind デザインを維持する。

## 2. Iframe 通信 (Window Communication)

- **メッセージ交換**: `postMessage` API を使用。
- **イベント種類**:
  - `OPEN_WIDGET`: ウィジェットを展開（Iframe の幅・高さを拡大）。
  - `CLOSE_WIDGET`: ウィジェットを最小化（アイコン表示のみ）。
  - `LOAD_COMPLETE`: サーバー側での初期化完了を親に通知。

## 3. UI/UX 演出

- **ローディング**: AI が考えている間（ステップ 1・2 の実行中）は「考え中...」の進捗ステータスを UI に表示。
