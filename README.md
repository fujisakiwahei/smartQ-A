# Smart Q&A System

AIを活用した汎用型チャットボットSaaS。Webサイトに1行のタグを設置するだけで、企業独自の知識に基づいた自動回答を実現します。

## 📁 ドキュメント・ディレクトリ構成
詳細な設計書は `docs/` ディレクトリに集約されています。
- [全体仕様書](./docs/spec.md) : プロダクトビジョンと機能一覧
- [DB設計書](./docs/db-schema.md) : Firestoreのコレクション・フィールド定義
- [AIロジック](./docs/ai-logic.md) : Gemini 3.0 Flash のプロンプト定義
- [UI定義書](./docs/admin-ui.md) : 管理画面およびウィジェットの画面構成

## 🔐 環境変数の管理 (Secrets Management)
本プロジェクトでは、APIキー等の秘匿情報を以下のルールで管理します。

### ローカル環境 (`.env`)
プロジェクト直下の `.env` にて管理します（Git管理対象外）。
- `GEMINI_API_KEY`: Gemini APIキー
- `FIREBASE_CONFIG`: Firebase接続用JSONオブジェクト

### 本番環境 (Vercel)
Vercel Project Settings > Environment Variables にて、上記と同一のキー名で設定します。
- **注意**: 本番環境では安全のため、APIキーの「ドメイン制限」をGoogle Cloud側で設定することを推奨します。

## 🛡 テナント識別ロジック (Domain-based Auth)
1. `widget.js` が実行時に `window.location.hostname` を取得。
2. サーバーサイドで Firestore の `tenants` コレクションにある `allowed_domains` 配列と照合。
3. 照合が成功した `tenant_id` に紐づく `knowledge_base` を AI の回答コンテキストとして注入します。
