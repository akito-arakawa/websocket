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

<<<<<<< Updated upstream
=======
const rooms = new Map<string, Set<AuthenticatedSocket>>();

function broadcast(
  groupId: string,
  message: ServerMessage,
  exclude?: AuthenticatedSocket,
) {
  // 1. ルームを取り出す
  const room = rooms.get(groupId); // Set { socketA, socketB, socketC }
  if (!room) return;

  // 2. 文字列にする（全員同じ内容なので1回だけ）
  const data = JSON.stringify(message);

  // 3. ルームの socket を1つずつ取り出す
  for (const client of room) {
    // 4. 送ってよい相手にだけ送る
    if (client === exclude) continue; // 除外対象なら、次の人へ
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  // TODO: Issue #5 以降で実装
=======
  let message: ClientMessage;
  try {
    message = JSON.parse(raw);
  } catch {
    socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
    return;
  }
  const groupId = message.groupId;
  const userId = socket.userId;
  if (message.type === "join") {
    const result = await query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId],
    );
    if (result.rows.length === 0) {
      socket.send(
        JSON.stringify({ type: "error", message: "Not a group member" }),
      );
      return;
    }

    let room = rooms.get(groupId);
    if (!room) {
      room = new Set<AuthenticatedSocket>();
      rooms.set(groupId, room);
    }
    room.add(socket);

    socket.send(JSON.stringify({ type: "joined", groupId }));
  }

  if (message.type === "leave") {
    rooms.get(groupId)?.delete(socket);
    socket.send(JSON.stringify({ type: "left", groupId }));
  }
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    payload = verifyToken(_token);    
=======
    payload = verifyToken(token);
>>>>>>> Stashed changes
  } catch (err) {
    console.log("verify failed:", err);
    socket.close(4001, "Invalid token");
    return;
  }

  socket.userId = payload.sub;
  socket.send(JSON.stringify({ type: "connected", userId: payload.sub }));
<<<<<<< Updated upstream
=======

  socket.on("message", (data) => {
    handleWebSocketMessage(socket, data.toString()).catch((err) =>
      console.error(err),
    );
  });

  socket.on("close", () => {
    for (const [, room] of rooms) {
      room.delete(socket);
    }
  });
>>>>>>> Stashed changes
}
