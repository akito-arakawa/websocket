import type { WebSocket } from "ws";

/**
 * WebSocket サーバー実装（自分で実装する）
 *
 * 実装ガイド: docs/websocket-events.md
 * Issue: GitHub の phase-1 以降を参照
 */

export type ClientMessage =
  | { type: "join"; groupId: string }
  | { type: "leave"; groupId: string }
  | { type: "send_message"; groupId: string; content: string }
  | { type: "mark_read"; groupId: string; messageId: string };

export type ServerMessage =
  | { type: "connected"; userId: string }
  | { type: "joined"; groupId: string }
  | { type: "left"; groupId: string }
  | { type: "message"; message: MessagePayload }
  | { type: "read_receipt"; groupId: string; userId: string; messageId: string }
  | { type: "error"; message: string };

export interface MessagePayload {
  id: string;
  groupId: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

export async function handleWebSocketMessage(
  _socket: WebSocket,
  _raw: string,
): Promise<void> {
  // TODO: Issue #5 以降で実装
}

export function handleWebSocketConnection(
  socket: WebSocket,
  _token: string | null,
): void {
  // TODO: Issue #3, #4 で実装
  socket.close(1011, "WebSocket not implemented yet");
}
