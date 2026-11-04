/**
 * WebSocket クライアント（自分で実装する）
 *
 * 実装ガイド: docs/websocket-events.md
 * Issue: GitHub の phase-5 以降を参照
 */

import type { ServerWsMessage } from "../types";

type MessageHandler = (message: ServerWsMessage) => void;

export class ChatSocket {
  on(_handler: MessageHandler): () => void {
    // TODO: Issue #9 で実装
    return () => {};
  }

  connect(_token: string): void {
    // TODO: Issue #9 で実装
  }

  disconnect(): void {
    // TODO: Issue #9 で実装
  }

  join(_groupId: string): void {
    // TODO: Issue #9 で実装
  }

  leave(_groupId: string): void {
    // TODO: Issue #9 で実装
  }

  sendMessage(_groupId: string, _content: string): void {
    // TODO: Issue #9 で実装
  }

  markRead(_groupId: string, _messageId: string): void {
    // TODO: Issue #9 で実装
  }
}
