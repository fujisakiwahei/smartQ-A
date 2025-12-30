# Database Schema (Firestore)

## tenants (Collection)
- `name`: string (企業名)
- `allowed_domains`: array (許可ドメインリスト)
- `theme_color`: string (ウィジェットカラー)
- `created_at`: timestamp

### tenants/{id}/categories (Sub-collection)
- `name`: string (カテゴリ名)
- `description`: string (AI補足説明：最大350文字)

### tenants/{id}/knowledge_base (Sub-collection)
- `question`: string
- `answer`: string
- `category_ids`: array (関連カテゴリID)

## chat_logs (Collection)
- `tenant_id`: string (参照)
- `user_query`: string
- `ai_response`: string
- `detected_category`: string
- `timestamp`: timestamp
