import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";
import type { Group } from "../types/index.js";

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

const joinGroupSchema = z.object({
  groupId: z.string().uuid(),
});

export async function groupRoutes(app: FastifyInstance) {
  app.post("/groups", async (request, reply) => {
    const payload = await authenticate(request);
    if (!payload) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const body = createGroupSchema.parse(request.body);

    const groupResult = await query<Group>(
      `INSERT INTO groups (name, created_by)
       VALUES ($1, $2)
       RETURNING id, name, created_by, created_at`,
      [body.name, payload.sub],
    );

    const group = groupResult.rows[0];

    await query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
      [group.id, payload.sub],
    );

    return reply.status(201).send({
      group: {
        id: group.id,
        name: group.name,
        createdBy: group.created_by,
        createdAt: group.created_at,
      },
    });
  });

  app.get("/groups", async (request, reply) => {
    const payload = await authenticate(request);
    if (!payload) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const result = await query<Group>(
      `SELECT g.id, g.name, g.created_by, g.created_at
       FROM groups g
       INNER JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [payload.sub],
    );

    return {
      groups: result.rows.map((group) => ({
        id: group.id,
        name: group.name,
        createdBy: group.created_by,
        createdAt: group.created_at,
      })),
    };
  });

  app.post("/groups/join", async (request, reply) => {
    const payload = await authenticate(request);
    if (!payload) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const body = joinGroupSchema.parse(request.body);

    const groupResult = await query<Group>(
      `SELECT id, name, created_by, created_at FROM groups WHERE id = $1`,
      [body.groupId],
    );

    if (groupResult.rows.length === 0) {
      return reply.status(404).send({ error: "Group not found" });
    }

    await query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [body.groupId, payload.sub],
    );

    const group = groupResult.rows[0];
    return {
      group: {
        id: group.id,
        name: group.name,
        createdBy: group.created_by,
        createdAt: group.created_at,
      },
    };
  });
}
