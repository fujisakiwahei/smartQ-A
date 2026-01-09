# Implementation Tasks: Widget Delivery

---

**Overview**:
埋め込み可能なチャットウィジェットのエンドツーエンドフローを実装します。これには、Vanilla JS ローダー、Iframe ベースのウィジェット UI、および安全な配信/検証バックエンドが含まれます。
また、`docs/ai-logic.md` で定義された AI RAG パイプラインも実装します。

**Dependencies**:

- **P0**: Firestore の `tenants`、`categories`、`knowledge_base` コレクション構造。
- **P0**: Gemini API アクセス (Gemini 3.0 Flash)。

---

- [x] 1. Backend: Widget Delivery & Validation
- [x] 1.1 Implement Widget UI Route with Referer Validation (P)

  - `/widget` エンドポイント用の Nitro ルートハンドラ/サーバーミドルウェアを作成する。
  - Firestore 内の `tenant_id` の存在チェックを行う検証ロジックを実装する。
  - `Referer` ヘッダーを `tenant.allowed_domains` と照合する検証を実装する。
  - 無効なリクエストやブロックされたドメインに対しては 403 Forbidden を返す。
  - 有効なリクエストに対して初期 HTML シェル（Nuxt ページエントリ）を提供する。
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Backend: Chat API & AI Pipeline
- [x] 2.1 Implement Chat API Structure

  - `/api/chat` エンドポイントを作成する。
  - `tenant_id` とリクエストボディ（`message`, `history`）を検証する。
  - `categories`、`knowledge_base`、`chat_logs` 用の Firestore 接続を設定する。
  - _Requirements: 4.2_

- [x] 2.2 Implement Step 1: Intent Analysis & Category Identification

  - プロンプト構築ロジックを管理する `app/server/utils/prompts.ts` を作成する。
  - `buildClassificationPrompt` 関数を実装する: ユーザーのクエリとカテゴリリストを受け取り、分類用のシステムプロンプトを返す。
  - `tenants/{id}/categories` からテナントの全カテゴリを取得する。
  - ユーティリティ関数を使用して、Gemini (thinking_level: minimal) 用のプロンプトを構築する。
  - 最適なカテゴリ（または「General/Other」）を選択するロジックを実装する。
  - _Requirements: 4.2 (AI Logic Step 1)_

- [x] 2.3 Implement Step 2 & 3: Context Retrieval & RAG Generation

  - 特定された `category_ids` でフィルタリングして `tenants/{id}/knowledge_base` をクエリする。
  - 取得した Q&A ペアを JSON 配列（例: `[{ "q": "...", "a": "..." }]`）に整形する。
  - `app/server/utils/prompts.ts` に `buildRAGPrompt` 関数を実装する: ユーザーのクエリと JSON コンテキストを受け取り、厳格な制約を持つシステムプロンプトを返す。
  - ユーティリティ関数を使用して、Gemini (thinking_level: low) 用のプロンプトを構築する。
  - 最終的な回答を生成する。
  - _Requirements: 4.2 (AI Logic Step 2 & 3)_

- [x] 2.4 Implement Step 4: Logging

  - `chat_logs` コレクションに対話を保存する。
  - `user_query`、`ai_response`、`detected_category_ids`、および `timestamp` を含める。
  - _Requirements: 4.2 (AI Logic Step 4)_

- [x] 3. Frontend: Widget Loader (Library)
- [x] 3.1 Develop Vanilla JS Loader Script (P)

  - 依存関係のないスタンドアロンなスクリプトとして `widget.js` を作成する。
  - script タグの `data-tenant-id` 属性から `tenant_id` を読み取るロジックを実装する。
  - `/widget` ルートを指す `<iframe>` を注入する DOM 操作を実装する。
  - Iframe に初期スタイル（固定配置、右下、最小化サイズ）を適用する。
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.5_

- [x] 3.2 Implement Cross-Origin Communication (PostMessage) (P)

  - Iframe からの `postMessage` イベントを処理するイベントリスナーを `widget.js` に追加する。
  - リサイズロジックを実装する: `open` イベントで Iframe のサイズを拡大し、`closed` イベントで縮小する。
  - モバイルビューポートの調整（全画面表示 vs ウィジェットサイズ）を処理する。
  - _Requirements: 3.2, 3.4_

- [ ] 4. Frontend: Widget UI (Iframe App)
- [ ] 4.1 Build Widget Layout & State Management (P)

  - ウィジェットアプリケーション用の Nuxt ページ/レイアウトを作成する。
  - `isOpen`、`messages`、`isLoading` の状態管理を実装する。
  - チャットウィンドウを切り替える `LauncherButton` コンポーネントを作成する。
  - メッセージリストと入力エリアを持つ `ChatWindow` コンポーネントを作成する。
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1_

- [ ] 4.2 Integrate Chat Logic & API

  - `ChatWindow` の入力を `/api/chat` エンドポイントに接続する。
  - API レスポンスを待機している間、ローディング状態を表示する。
  - メッセージ履歴にユーザーメッセージと AI の回答を表示する。
  - ウィジェットを開閉する際に親ローダーに通知するための `postMessage` トリガーを実装する。
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 5. Integration & Testing
- [x] 5.1 End-to-End Integration Verification
  - 有効なテスト `tenant_id` を使用して `widget.js` を埋め込んだテスト HTML ページを作成する。
  - Iframe が正しくロードされ、ランチャーが表示されることを確認する。
  - 開閉トグルをテストし、Iframe が正しくリサイズされることを確認する。
  - 完全なチャット会話フロー（ユーザー -> API -> AI -> ユーザー）を実行する。
  - AI ロジックを検証する: カテゴリ固有の質問をし、正しいナレッジが取得されていることを確認する（ログまたは回答品質を通じて）。
  - 検証をテストする: 許可されていないドメイン（または偽装された Referer）からウィジェットをロードし、403 を確認する。
  - _Requirements: 1.4, 2.3, 2.4, 3.2, 4.4_
