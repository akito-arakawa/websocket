# アーキテクチャ

## 概要

ブラウザは REST API で認証・グループ管理・履歴取得を行い、WebSocket でリアルタイム通信を行う。

```
┌─────────────┐     HTTPS/REST      ┌─────────────┐
│   Browser   │ ──────────────────► │   Fastify   │
│  (React)    │                     │   API+WS    │
│             │ ◄──── WebSocket ──► │             │
└─────────────┘                     └──────┬──────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ PostgreSQL  │
                                    └─────────────┘
```

## ディレクトリ構成

```
web/                    # フロントエンド
  src/
    lib/                # API / WebSocket クライアント
    components/         # UI コンポーネント
    pages/              # 画面

api/                    # バックエンド
  src/
    routes/             # REST エンドポイント
    ws/                 # WebSocket ハンドラ
    db/                 # DB 接続・スキーマ
    middleware/         # 認証など

docs/                   # 設計ドキュメント
```

## 認証フロー

1. `POST /auth/register` または `POST /auth/login` で JWT を取得
2. REST リクエストは `Authorization: Bearer <token>` ヘッダー
3. WebSocket は `ws://host/ws?token=<jwt>` で接続

## チャットフロー

1. グループ作成 / 参加（REST）
2. WebSocket 接続後 `join` イベントでルーム参加
3. `send_message` で送信 → DB 保存 → ルーム内 broadcast
4. `mark_read` で既読更新 → ルーム内 broadcast

## ローカル開発

```bash
docker compose up -d postgres   # DB
npm run dev:api                 # :3000
npm run dev:web                 # :5173
```

## 本番（AWS 予定）

| コンポーネント | サービス |
|---------------|---------|
| フロント | S3 + CloudFront |
| API + WS | EC2 + ALB |
| DB | RDS PostgreSQL |

詳細は [aws-deployment.md](./aws-deployment.md) を参照。
