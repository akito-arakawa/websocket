# AWS デプロイ方針

7/12 までの現実的ゴールは **EC2 単体構成** とする。

## 構成図

```
[ユーザー]
    │
    ▼ HTTPS
[CloudFront] ──► [S3]          ← 静的ファイル（web ビルド成果物）
    │
    ▼ WSS / HTTPS
[ALB]
    │
    ▼
[EC2]  ← Docker（api コンテナ）
    │
    ▼
[RDS PostgreSQL]
```

## 各サービスの役割

### S3 + CloudFront
- `npm run build:web` の成果物を S3 に配置
- CloudFront で HTTPS 配信
- API へのプロキシは行わず、フロントから直接 ALB の URL を参照

### ALB（Application Load Balancer）
- HTTPS 終端（ACM 証明書）
- WebSocket 対応（スティッキーセッション推奨）
- タイムアウト: 3600 秒以上に設定

### EC2
- Amazon Linux 2023 または Ubuntu
- Docker + docker compose で API コンテナ起動
- セキュリティグループ: ALB からの 3000 番のみ許可

### RDS
- PostgreSQL 16
- `db.t3.micro`（無料枠内）
- EC2 と同一 VPC、プライベートサブネット推奨

## 環境変数（本番）

```env
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgres://user:pass@rds-endpoint:5432/chat
JWT_SECRET=<ランダムな長い文字列>
CORS_ORIGIN=https://your-cloudfront-domain.cloudfront.net
```

## デプロイ手順（概要）

1. RDS インスタンス作成、セキュリティグループ設定
2. EC2 起動、Docker インストール
3. `api/Dockerfile` でイメージビルド・起動
4. ALB 作成、ターゲットグループに EC2 登録
5. ACM で証明書取得、ALB に HTTPS リスナー追加
6. S3 バケット作成、CloudFront ディストリビューション設定
7. フロントの `VITE_API_URL` を ALB の URL に設定してビルド・デプロイ

## コスト目安（学習用・最小構成）

| サービス | 概算/月 |
|---------|--------|
| EC2 t3.micro | 無料枠 or ~$8 |
| RDS db.t3.micro | 無料枠 or ~$15 |
| ALB | ~$16 |
| S3 + CloudFront | 数ドル以下 |

**注意:** 使わないときは EC2 / RDS を停止してコストを抑える。

## Phase 2（余力）

- GitHub Actions で CI/CD
- ECR + ECS Fargate へ移行
- ElastiCache Redis で WS の水平スケール
