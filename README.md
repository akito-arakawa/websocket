# WebSocket Chat App

リアルタイムグループチャットアプリ（学習用）

プロジェクトパス: `~/mypro/websocket`

## 構成

```
mypro/websocket/
├── web/          # React + Vite + TypeScript（フロントエンド）
├── api/          # Node + Fastify + ws + PostgreSQL（バックエンド）
├── docs/         # 設計・スケジュール・イベント仕様
└── docker-compose.yml
```

## 機能（予定）

- アカウント作成・ログイン（JWT）
- グループ作成・参加
- リアルタイムチャット（WebSocket）
- 既読表示

## 前提

- Node.js 20+
- Docker（PostgreSQL 用）

## セットアップ

```bash
cd ~/mypro/websocket

# 依存関係インストール
npm install

# PostgreSQL 起動
npm run db:up

# API（別ターミナル）
cp api/.env.example api/.env
npm run dev:api

# Web（別ターミナル）
npm run dev:web
```

## 開発 URL

| サービス | URL |
|---------|-----|
| Web | http://localhost:5173 |
| API | http://localhost:3000 |
| WebSocket | ws://localhost:3000/ws |
| PostgreSQL | localhost:5432 |

## ドキュメント

- [アーキテクチャ](./docs/architecture.md)
- [DB スキーマ](./docs/database.md)
- [WebSocket イベント](./docs/websocket-events.md)
- [開発スケジュール](./docs/schedule.md)
- [AWS デプロイ方針](./docs/aws-deployment.md)

## 技術スタック

| 層 | 技術 |
|----|------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Fastify, ws, TypeScript |
| Database | PostgreSQL |
| Deploy | EC2, RDS, S3, CloudFront, ALB |
