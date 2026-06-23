import type { WebSocket } from "ws";
import { verifyToken } from "../middleware/auth.js";
import { query } from "../db/index.js";
import type { Message } from "../types/index.js";

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

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  joinedGroups?: Set<string>;
}

const rooms = new Map<string, Set<AuthenticatedSocket>>();

function getRoom(groupId: string): Set<AuthenticatedSocket> {
  let room = rooms.get(groupId);
  if (!room) {
    room = new Set();
    rooms.set(groupId, room);
  }
  return room;
}

function broadcast(groupId: string, message: ServerMessage, exclude?: AuthenticatedSocket) {
  const room = rooms.get(groupId);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const client of room) {
    if (client !== exclude && client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId],
  );
  return result.rows.length > 0;
}

export async function handleWebSocketMessage(
  socket: AuthenticatedSocket,
  raw: string,
): Promise<void> {
  if (!socket.userId) {
    socket.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
    return;
  }

  let message: ClientMessage;
  try {
    message = JSON.parse(raw) as ClientMessage;
  } catch {
    socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
    return;
  }

  switch (message.type) {
    case "join": {
      if (!(await isGroupMember(message.groupId, socket.userId))) {
        socket.send(JSON.stringify({ type: "error", message: "Not a group member" }));
        return;
      }
      socket.joinedGroups ??= new Set();
      socket.joinedGroups.add(message.groupId);
      getRoom(message.groupId).add(socket);
      socket.send(JSON.stringify({ type: "joined", groupId: message.groupId }));
      break;
    }

    case "leave": {
      socket.joinedGroups?.delete(message.groupId);
      rooms.get(message.groupId)?.delete(socket);
      socket.send(JSON.stringify({ type: "left", groupId: message.groupId }));
      break;
    }

    case "send_message": {
      const content = message.content.trim();
      if (!content) {
        socket.send(JSON.stringify({ type: "error", message: "Empty message" }));
        return;
      }

      if (!(await isGroupMember(message.groupId, socket.userId))) {
        socket.send(JSON.stringify({ type: "error", message: "Not a group member" }));
        return;
      }

      const insertResult = await query<Message>(
        `INSERT INTO messages (group_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, group_id, user_id, content, created_at`,
        [message.groupId, socket.userId, content],
      );

      const row = insertResult.rows[0];
      const userResult = await query<{ display_name: string }>(
        `SELECT display_name FROM users WHERE id = $1`,
        [socket.userId],
      );

      const payload: MessagePayload = {
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        displayName: userResult.rows[0].display_name,
        content: row.content,
        createdAt: row.created_at,
      };

      broadcast(message.groupId, { type: "message", message: payload });
      break;
    }

    case "mark_read": {
      if (!(await isGroupMember(message.groupId, socket.userId))) {
        socket.send(JSON.stringify({ type: "error", message: "Not a group member" }));
        return;
      }

      await query(
        `UPDATE group_members
         SET last_read_message_id = $1
         WHERE group_id = $2 AND user_id = $3`,
        [message.messageId, message.groupId, socket.userId],
      );

      broadcast(message.groupId, {
        type: "read_receipt",
        groupId: message.groupId,
        userId: socket.userId,
        messageId: message.messageId,
      });
      break;
    }

    default:
      socket.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
  }
}

export function handleWebSocketConnection(
  socket: AuthenticatedSocket,
  token: string | null,
): void {
  if (!token) {
    socket.close(4001, "Missing token");
    return;
  }

  try {
    const payload = verifyToken(token);
    socket.userId = payload.sub;
    socket.joinedGroups = new Set();
    socket.send(JSON.stringify({ type: "connected", userId: payload.sub }));
  } catch {
    socket.close(4001, "Invalid token");
    return;
  }

  socket.on("message", (data) => {
    void handleWebSocketMessage(socket, data.toString());
  });

  socket.on("close", () => {
    if (!socket.joinedGroups) return;
    for (const groupId of socket.joinedGroups) {
      rooms.get(groupId)?.delete(socket);
    }
  });
}
