import type { WebSocket } from "ws";
import { verifyToken } from "../middleware/auth.js";
import { pl } from "zod/v4/locales";

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

interface AuthenticatedSocket extends WebSocket {
    userId?: string;
}

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
  socket: AuthenticatedSocket,
  _token: string | null,
): void {
  if (!_token) {
    socket.close(4001, "Missing token");
    return;
  }

  let payload;
  try {
    payload = verifyToken(_token);    
  } catch (err) {
    console.log("verify failed:", err); 
    socket.close(4001, "Invalid token");
    return;
  }

  socket.userId = payload.sub;
  socket.send(JSON.stringify({ type: "connected", userId: payload.sub }));
}
