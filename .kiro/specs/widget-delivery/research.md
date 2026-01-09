# Research & Design Decisions Template

---

**目的**: 技術設計に情報を与える発見事項、アーキテクチャの調査、および根拠を記録する。

**使用法**:

- 発見フェーズ中の調査活動と結果を記録する。
- `design.md` に記載するには詳細すぎる設計上の決定事項のトレードオフを文書化する。
- 将来の監査や再利用のための参照情報や証拠を提供する。

---

## Summary

- **Feature**: `widget-delivery`
- **Discovery Scope**: Complex Integration
- **Key Findings**:
  - **Iframe Isolation**: 最大限の CSS/JS 分離とセキュリティ簡素化（Same-Origin API 呼び出し）のために選択されました。
  - **Referer Validation**: ウィジェットのエントリーポイント（`/widget`ページ）を保護するために有効ですが、厳格なプライバシー設定に対するフォールバック/エラー処理が必要です。
  - **Nuxt Integration**: ウィジェット UI は、既存のビルドシステムを活用した、特殊なレイアウトを持つ標準的な Nuxt ページとして実装可能です。

## Research Log

### Widget Architecture (Iframe vs Shadow DOM)

- **Context**: スタイルの分離と応答性を確保しつつ、クライアントサイトにウィジェットを埋め込む方法を決定する必要がある。
- **Sources Consulted**: 埋め込み型ウィジェットパターン（Intercom, Drift）の一般的知識、ブラウザセキュリティ仕様。
- **Findings**:
  - **Shadow DOM**: スタイルの分離には適しているが、一部のグローバルスタイル（フォント、rem）を継承する可能性がある。JS はメインスレッドを共有し、グローバルスコープの競合の可能性がある。ポリフィルが必要な場合は複雑になる。
  - **Iframe**: 完全な分離。親の CSS はウィジェットに影響せず、ウィジェットの JS も親と競合しない。
  - **Communication**: Iframe のリサイズ（拡大/縮小）には`postMessage`が必要。
- **Implications**: 「一度書けばどこでも動く（Write once, run anywhere）」を保証し、スタイルの漏れを防ぐために、メインコンテンツには **Iframe** を使用する。Iframe の作成と`postMessage`によるリサイズを処理するために、軽量な **Loader Script** を使用する。

### Security & Validation

- **Context**: 許可されていないサイトがウィジェットを使用（クォータ/データの盗用）するのを防ぐ必要がある。
- **Findings**:
  - **Iframe Loading**: ブラウザは Iframe ソースをロードする際に`Referer`ヘッダーを送信する。
  - **API Calls**: Iframe が API と同じドメインでホストされている場合、リクエストは Same-Origin となる。ウィジェット内部の複雑な CORS 設定は不要。
  - **Referer Spoofing**: 標準的なブラウザナビゲーション（Iframe ロード）では偽装が困難。
- **Implications**: ウィジェット HTML を提供する **Server Middleware**（またはルートハンドラ）で`Referer`チェックを実装する。

## Architecture Pattern Evaluation

| Option              | Description                                                         | Strengths                          | Risks / Limitations                                       | Notes                              |
| ------------------- | ------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------- | ---------------------------------- |
| **Shadow DOM**      | Shadow Root を使用してホスト DOM 内にウィジェットを直接レンダリング | シームレスなリサイズ、リソース共有 | CSS 漏れ（フォント）、Z-index 競合、JS 競合               | 分離リスクのため却下               |
| **Iframe (Chosen)** | 別のウィンドウコンテキストでウィジェットをレンダリング              | 完全な分離、Same-Origin API        | リサイズに`postMessage`が必要、メモリオーバーヘッドが高い | チャットウィジェットの標準パターン |

## Design Decisions

### Decision: Iframe-based Delivery

- **Context**: 「ホストページのスタイルからの分離」と堅牢なセキュリティの要件。
- **Alternatives Considered**:
  1. **Shadow DOM**: 軽量だがスタイルの競合リスクがある。
  2. **Raw HTML injection**: 競合とセキュリティ問題のリスクが高い。
- **Selected Approach**: サーバーでホストされているウィジェット UI を指す **Iframe** を注入する **Loader Script** (`widget.js`) を使用する。
- **Rationale**: クラス最高の分離性。API セキュリティ（Same-Origin）を簡素化できる。
- **Trade-offs**: 初回ロードがわずかに遅い（Iframe への HTTP リクエスト）、リサイズの複雑さ（`postMessage`ブリッジが必要）。

### Decision: Server-Side Referer Validation

- **Context**: 許可されていないドメインによるウィジェットの埋め込みを防止する。
- **Selected Approach**: Iframe コンテンツを提供するルート（`/widget`）が、Firestore 内の`tenants.allowed_domains`リストに対して`Referer`ヘッダーを検証する。
- **Rationale**: 許可されていないサイトでのウィジェットの読み込み自体を阻止できる。
- **Trade-offs**: 厳格な「No Referrer」ポリシーを持つユーザーはウィジェットをブロックする可能性がある（B2B ツールとしては許容されるエッジケース）。

### Decision: Loader Script Configuration

- **Context**: `tenant_id`をどのように渡すか。
- **Selected Approach**: `script`タグ属性（例: `data-tenant-id="xyz"`）またはグローバル設定オブジェクト。
- **Rationale**: 標準的で、クライアントがコピー＆ペーストしやすい。

## Risks & Mitigations

- **Risk 1**: Iframe の Z-index がホストサイトの要素と競合する。
  - **Mitigation**: Loader Script で Z-index を設定可能にし、デフォルトで高い安全な値（例: 2147483647）にする。
- **Risk 2**: Iframe のモバイル対応。
  - **Mitigation**: Loader Script がビューポートを検出し、Iframe のサイズ/位置を調整する（例: オープン時はモバイルで全画面表示）。
- **Risk 3**: Cloud Functions/Serverless のコールドスタート遅延。
  - **Mitigation**: Iframe HTML に軽量な Nuxt Nitro ルートを使用し、静的アセットを強力にキャッシュする。

## References

- [MDN: Iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- [MDN: Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
