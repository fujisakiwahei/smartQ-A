# 🧭 Client Admin（利用企業向け管理画面）仕様書

---

## ✨ このドキュメントの目的

---

このドキュメントは「利用企業向け管理画面（Client Admin）」について、**初心者でも運用・改修できる**ことを目的に、実装の全体像・画面仕様・データ構造・認証の仕組み・型定義・スタイリング方針を**冗長なくらい**網羅して説明します。

このプロジェクトでは Nuxt（Nuxt UI）＋ Firebase（Auth / Firestore）を使っています。

---

## 🗺️ 全体像（ざっくり何が出来る？）

---

Client Admin は、ログインした利用企業が「自社の AI ボット運用」を管理する画面です。

- **ダッシュボード**: 指定期間の稼働状況（総対話数、解決率、カテゴリ比率、推移、未解決候補）
- **カテゴリ管理**: AI の分類ラベル（name/description）CRUD
- **Q&A 管理**: ナレッジ（question/answer/category_ids）CRUD
- **ウィジェット設定**: テーマカラー設定、埋め込みタグ表示
- **対話ログ**: フィルタ付き一覧＋詳細

---

## 🧱 実装ファイル一覧（どのファイルが何担当？）

---

### 🧩 1) ルーティング（pages）

---

- `app/pages/tenant-admin/index.vue`

  - Client Admin の入口
  - ログイン済み＋テナント解決済みなら自動で `/tenant-admin/{tenantId}/dashboard` に遷移
  - 未ログインなら「ログインへ」ボタンを表示

- `app/pages/tenant-admin/login.vue`

  - **メール/パスワードログイン画面**
  - `signInWithEmailAndPassword` でログイン
  - ログイン後、ユーザー UID に紐づくテナントが見つからない場合はログアウトしてエラー表示

- `app/pages/tenant-admin/[tenantId]/index.vue`

  - `/tenant-admin/{tenantId}` に来たら `/dashboard` へリダイレクト

- `app/pages/tenant-admin/[tenantId]/dashboard.vue`

  - ダッシュボード（分析・統計）

- `app/pages/tenant-admin/[tenantId]/categories.vue`

  - カテゴリ管理（CRUD / リアルタイム反映）

- `app/pages/tenant-admin/[tenantId]/knowledge.vue`

  - Q&A 管理（CRUD / 複数カテゴリ紐付け / リアルタイム反映）

- `app/pages/tenant-admin/[tenantId]/widget.vue`

  - ウィジェット設定（テーマカラー更新 / 埋め込みタグ表示＋コピー）

- `app/pages/tenant-admin/[tenantId]/chat-logs.vue`
  - 対話ログビューア（フィルタ / 一覧 / 詳細）

---

### 🧠 2) 認証とテナント解決（plugins / middleware / composables）

---

- `app/plugins/tenant-admin-auth-state.client.ts`

  - **Auth の状態監視（onAuthStateChanged）**
  - ログイン/ログアウトを検知し、ログイン時に **UID → tenantId/tenantName を解決**してセッションに保存

- `app/middleware/tenant-admin-auth.ts`

  - **Client Admin 用の認証ガード**
  - 未ログインなら `/tenant-admin/login` へリダイレクト
  - `tenantId` が URL とセッションで食い違ったら **正しい tenantId に矯正**

- `app/composables/useTenantAdminSession.ts`
  - Client Admin で使う「セッション状態」を Nuxt の `useState` で保持（グローバルに共有される）
  - さらに `resolveTenantByUid(db, uid)` で Firestore からテナントを検索する

---

### 🧩 3) 共通 UI シェル（components）

---

- `app/components/tenant-admin/TenantAdminShell.vue`
  - サイドナビ＋ヘッダーを共通化したレイアウト部品
  - ヘッダーに **企業名（tenant.name）** を表示
  - 右上ボタンは **ログアウト**（`signOut` → `/tenant-admin/login`）

---

## 🔐 認証・テナント紐付け仕様（ここが一番重要）

---

### ✅ 要件

---

> `tenants` の `tenant_uid` が Firebase Authentication の `user.uid` に 1:1 で紐づく。  
> そのユーザーでログインしたら、紐づけ済みテナントとして管理画面に入れる。

### 🧠 実装の考え方（なぜこうしてる？）

---

Client Admin は「URL の tenantId を信用しない」ほうが安全です。

- URL に `tenantId` が書けてしまうと、悪意あるユーザーが他社の tenantId を入れられる可能性がある
- なので **ログインユーザーの uid から tenantId を必ず確定**します
- さらに middleware で URL を矯正し、**常に「本人の tenantId」に固定**します

### 🔄 実際のフロー（ログイン〜画面表示）

---

1. ユーザーが `/tenant-admin/login` でメール/パスワードを入力
2. Firebase Auth でログイン成功 → `user.uid` が確定
3. `tenant-admin-auth-state.client.ts` が `onAuthStateChanged` を受け取り、
   - Firestore の `tenants` を検索して **tenant を解決**
   - `useTenantAdminSession()` の state に保存
4. 各ページ（`/tenant-admin/[tenantId]/*`）は `definePageMeta({ middleware: "tenant-admin-auth" })` で保護されており、
   - 未ログインなら `/tenant-admin/login`
   - tenant 解決済みなら続行
   - URL の `tenantId` が本人の tenant と違えば **正しい tenantId にリダイレクト**

---

## 🗃️ Firestore データ仕様（Client Admin で使うもの）

---

基本は `docs/db-schema.md` の通りです。

### 🏢 tenants（企業設定）

---

- コレクション: `tenants`
- ドキュメント ID: `tenantId`
- 主に使うフィールド
  - `name: string`（企業名）
  - `theme_color: string`（プリセット識別子：basic/emerald/rose 等）
  - `allowed_domains: string[]`（ウィジェット許可ドメイン）
  - `tenant_uid: string`（Auth の uid と 1:1）

> 補足：移行や互換のために `admin_uid` でもフォールバック検索しています（`resolveTenantByUid` 内）。

### 🏷️ categories（カテゴリ）

---

- パス: `tenants/{tenantId}/categories`
- フィールド
  - `name: string`
  - `description: string`（最大 350 文字）

### 📚 knowledge_base（Q&A）

---

- パス: `tenants/{tenantId}/knowledge_base`
- フィールド
  - `question: string`
  - `answer: string`
  - `category_ids: string[]`（複数カテゴリ対応）

### 💬 chat_logs（対話ログ）

---

- コレクション: `chat_logs`（グローバル）
- フィールド（最低限）
  - `tenant_id: string`
  - `user_query: string`
  - `ai_response: string`
  - `detected_category_ids: string[]`
  - 日時は環境差があるため **`created_at` or `timestamp`** のどちらでも動くよう実装側で吸収

---

## 🧾 型定義（TypeScript の型はどうしてる？）

---

このプロジェクトは「大規模な共通型ファイル」を作るのではなく、**ページ内で必要最小限の型を定義**しています（初心者には追いやすい）。

### 🧠 セッションの型（共通）

---

場所: `app/composables/useTenantAdminSession.ts`

- `TenantAdminTenant`
  - `id: string`
  - `name?: string`
  - `theme_color?: string`

### 🏷️ カテゴリ（ページ内）

---

- `categories.vue` / `knowledge.vue` / `chat-logs.vue` / `dashboard.vue` で使う

例（概念）:

- `id: string`
- `name: string`
- `description: string`

### 📚 ナレッジ（ページ内）

---

例（概念）:

- `id: string`
- `question: string`
- `answer: string`
- `category_ids: string[]`

### 💬 ログ（ページ内）

---

例（概念）:

- `id: string`
- `tenant_id: string`
- `user_query: string`
- `ai_response: string`
- `detected_category_ids: string[]`
- `created_at?: any`
- `timestamp?: any`

> `created_at`/`timestamp` は Firestore Timestamp の可能性があるため、`any` として扱い、`toDate()` があるかで判定しています。

---

## 🎨 スタイリング方針（どういうルールで UI 作ってる？）

---

### 🧩 基本コンポーネントは Nuxt UI

---

UI は `@nuxt/ui` のコンポーネントを中心に構成しています。

- `UCard`, `UButton`, `UBadge`, `UInput`, `UFormGroup`, `USpin`, `UIcon` など

### 🎨 レイアウトは Tailwind（ただし grid より flex を優先）

---

- 指示に合わせて **grid より flex を優先**しています
- ページ構造は原則:
  - `section` で区切る
  - 各セクションに `${セクション名}Inner` のクラスを付ける

例（概念）:

- `<section class="clientAdminDashboard">`
  - `<div class="clientAdminDashboardInner">`

### 🧷 フォームの textarea について

---

Nuxt UI の `UTextarea` を使わず、プレーンな `<textarea>` を使っています（依存や挙動差を避けつつ、最大文字数などを制御しやすい）。

### 🧼 色・テーマ

---

テーマカラーのプリセットは `app/utils/constants.ts` の `COLOR_OPTIONS` に定義しています。

---

## 📊 ダッシュボード仕様（何をどう集計してる？）

---

場所: `app/pages/tenant-admin/[tenantId]/dashboard.vue`

### 📅 期間選択

---

- `fromDate` と `toDate`（`YYYY-MM-DD`）で管理
- 初期値は **直近 7 日**
- ボタンで **直近 7 日 / 直近 30 日** を一発設定

### 🧮 サマリーメトリクス

---

- 総対話数: `filteredLogs.length`
- 未解決数: `ai_response` に **「答えられません」** を含むログ数
- 解決数: `総対話数 - 未解決数`
- 解決率: `解決数 / 総対話数`

### 🥧 円グラフ

---

外部のグラフライブラリは入れず、SVG の donut（ドーナツグラフ）を描画しています。

- 円周長 \( c = 2 \pi r \)
- `stroke-dasharray` と `stroke-dashoffset` を使って、割合をリングに描画

### 📊 棒グラフ（推移）

---

- 日別 or 時間別
- Firestore のクエリ側では期間絞り込みをしていません（日時フィールドが揺れているため）
- 一旦全部購読して、クライアント側で期間フィルタと集計をしています

### 🧩 未解決候補抽出

---

- 未解決ログの `user_query` を小文字化して同一視し、頻度順に上位 10 件を表示
- ボタン
  - 「質問コピー」
  - 「Q&A 追加へ」（knowledge ページへの導線）

---

## 🏷️ カテゴリ管理仕様（CRUD ＋ 350 文字）

---

場所: `app/pages/tenant-admin/[tenantId]/categories.vue`

- 追加/編集/削除
- Description は **最大 350 文字**
  - 文字数カウンタを表示
  - 超過時はエラー表示＆保存禁止
- **onSnapshot** で即時反映（保存 → 一覧が瞬時に更新される）

---

## 📚 Q&A 管理仕様（CRUD ＋複数カテゴリ）

---

場所: `app/pages/tenant-admin/[tenantId]/knowledge.vue`

- 追加/編集/削除
- 質問/回答は必須
- 関連カテゴリは **1 つ以上必須**
- カテゴリはチェックボックスで複数選択
- **onSnapshot** で即時反映
- キーワード検索（質問/回答/カテゴリ名）

---

## 🎛️ ウィジェット設定仕様（テーマ＋埋め込みタグ）

---

場所: `app/pages/tenant-admin/[tenantId]/widget.vue`

### 🎨 テーマカラー

---

- プリセットから選択 → `tenants/{tenantId}` の `theme_color` を更新
- 保存ボタンで `updateDoc`

### 🧾 埋め込みタグ

---

- 表示するタグは以下形式（tenantId を埋め込み）

```html
<script
  src="https://smart-qa-widget.vercel.app/widget.js"
  id="smart-qa-loader"
  data-tenant-id="TENANT_ID"
></script>
```

#### ⚠️ Vue SFC の注意点

---

SFC（`.vue`）内の `<script setup>` で **`</script>` という文字列をそのまま書くと**、Vue のパーサが「スクリプト終了」と誤認して壊れる場合があります。

そのため、実装では以下のように **文字列を分割**して生成しています。

（例：概念）

- `"</" + "script>"` のようにして回避

---

## 🔍 対話ログビューア仕様（フィルタ＋詳細）

---

場所: `app/pages/tenant-admin/[tenantId]/chat-logs.vue`

### ✅ フィルタ

---

- 期間（開始/終了）
- カテゴリ
- キーワード（質問/回答）

### 🧾 一覧＋詳細

---

- 左: 一覧（クリックで選択）
- 右: 詳細（日時、質問、回答、カテゴリ）

### 🕒 日時フィールドの揺れ対応

---

ログの日時が `created_at` と `timestamp` で揺れていても動くように、

- `created_at` を優先
- なければ `timestamp`
- `toDate()` があれば Firestore Timestamp とみなして Date に変換

という吸収ロジックで表示/ソートしています。

---

## 🧪 よくあるトラブルシュート（初心者向け）

---

### 😵 ログインできるのにテナントに入れない

---

- `tenants/{tenantId}` に `tenant_uid` が入っているか確認
  - 値は Firebase Auth の `user.uid` と一致している必要があります

### 😵 ログが 0 件でダッシュボードが空

---

- `chat_logs` に `tenant_id = tenantId` のログが存在するか確認
- 日時フィールドが `created_at` / `timestamp` のどちらかで入っているか確認

### 😵 カテゴリが出ない / Q&A のカテゴリ選択ができない

---

- `tenants/{tenantId}/categories` にデータがあるか確認

---

## ✅ まとめ（この仕様書の読み方）

---

初心者の方は、次の順で読むと理解が早いです。

- ① 認証とテナント解決（`tenant-admin-auth-state.client.ts` / `tenant-admin-auth.ts` / `useTenantAdminSession.ts`）
- ② `TenantAdminShell.vue`（共通 UI）
- ③ categories / knowledge（CRUD の基本）
- ④ chat-logs（フィルタ＋詳細）
- ⑤ dashboard（集計＋グラフ）

