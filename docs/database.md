# データベース設計

## ER 図

```mermaid
erDiagram
    users ||--o{ group_members : joins
    users ||--o{ messages : sends
    users ||--o{ groups : creates
    groups ||--o{ group_members : has
    groups ||--o{ messages : contains
    messages ||--o| group_members : last_read

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar display_name
        timestamptz created_at
    }

    groups {
        uuid id PK
        varchar name
        uuid created_by FK
        timestamptz created_at
    }

    group_members {
        uuid group_id PK,FK
        uuid user_id PK,FK
        timestamptz joined_at
        uuid last_read_message_id FK
    }

    messages {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        text content
        timestamptz created_at
    }
```

## テーブル説明

### users
ユーザーアカウント。パスワードは bcrypt ハッシュで保存。

### groups
チャットグループ。作成者は自動的にメンバーになる。

### group_members
グループとユーザーの多対多。`last_read_message_id` で既読位置を管理。

### messages
グループ内のメッセージ。時系列で取得するため `(group_id, created_at)` にインデックス。

## 既読の仕組み

メッセージごとに既読レコードを作るのではなく、**メンバーごとに最後に読んだメッセージ ID** を保持する方式を採用。

- ユーザー A がメッセージ M を読んだ → `group_members.last_read_message_id = M.id`
- 他メンバーへ WebSocket で `read_receipt` を broadcast
- UI 側で「自分より後のメッセージを読んでいるか」を判定

## スキーマファイル

初期化 SQL: `api/src/db/schema.sql`  
Docker Compose 起動時に自動適用される。
