import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";
import type { Message } from "../types/index.js";

const listMessagesSchema = z.object({
  groupId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(100).default(50),
  before: z.string().uuid().optional(),
});

export async function messageRoutes(app: FastifyInstance) {
  app.get("/messages", async (request, reply) => {
    const payload = await authenticate(request);
    if (!payload) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const params = listMessagesSchema.parse(request.query);

    const memberCheck = await query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [params.groupId, payload.sub],
    );

    if (memberCheck.rows.length === 0) {
      return reply.status(403).send({ error: "Not a group member" });
    }

    const values: unknown[] = [params.groupId, params.limit + 1];
    let beforeClause = "";

    if (params.before) {
      beforeClause = `AND m.created_at < (
        SELECT created_at FROM messages WHERE id = $3
      )`;
      values.push(params.before);
    }

    const result = await query<Message & { display_name: string }>(
      `SELECT m.id, m.group_id, m.user_id, m.content, m.created_at,
              u.display_name
       FROM messages m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.group_id = $1 ${beforeClause}
       ORDER BY m.created_at DESC
       LIMIT $2`,
      values,
    );

    const hasMore = result.rows.length > params.limit;
    const messages = result.rows.slice(0, params.limit).reverse();

    return {
      messages: messages.map((message) => ({
        id: message.id,
        groupId: message.group_id,
        userId: message.user_id,
        displayName: message.display_name,
        content: message.content,
        createdAt: message.created_at,
      })),
      hasMore,
    };
  });
}
