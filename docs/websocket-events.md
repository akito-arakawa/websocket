# WebSocket イベント仕様

接続 URL: `ws://localhost:3000/ws?token=<JWT>`

すべて JSON 形式。`type` フィールドでイベントを識別する。

---

## クライアント → サーバー

### join
グループルームに参加する。

```json
{
  "type": "join",
  "groupId": "uuid"
}
```

### leave
グループルームから退出する。

```json
{
  "type": "leave",
  "groupId": "uuid"
}
```

### send_message
メッセージを送信する。

```json
{
  "type": "send_message",
  "groupId": "uuid",
  "content": "こんにちは"
}
```

### mark_read
既読位置を更新する。

```json
{
  "type": "mark_read",
  "groupId": "uuid",
  "messageId": "uuid"
}
```

---

## サーバー → クライアント

### connected
接続成功。

```json
{
  "type": "connected",
  "userId": "uuid"
}
```

### joined
ルーム参加成功。

```json
{
  "type": "joined",
  "groupId": "uuid"
}
```

### left
ルーム退出成功。

```json
{
  "type": "left",
  "groupId": "uuid"
}
```

### message
新着メッセージ（ルーム内全員へ broadcast）。

```json
{
  "type": "message",
  "message": {
    "id": "uuid",
    "groupId": "uuid",
    "userId": "uuid",
    "displayName": "太郎",
    "content": "こんにちは",
    "createdAt": "2026-06-23T12:00:00.000Z"
  }
}
```

### read_receipt
既読更新（ルーム内全員へ broadcast）。

```json
{
  "type": "read_receipt",
  "groupId": "uuid",
  "userId": "uuid",
  "messageId": "uuid"
}
```

### error
エラー。

```json
{
  "type": "error",
  "message": "Not a group member"
}
```

---

## REST API 一覧

| Method | Path | 説明 |
|--------|------|------|
| POST | `/auth/register` | ユーザー登録 |
| POST | `/auth/login` | ログイン |
| GET | `/auth/me` | 自分の情報 |
| POST | `/groups` | グループ作成 |
| GET | `/groups` | 参加グループ一覧 |
| POST | `/groups/join` | グループ参加 |
| GET | `/messages?groupId=&limit=&before=` | メッセージ履歴 |
| GET | `/health` | ヘルスチェック |
