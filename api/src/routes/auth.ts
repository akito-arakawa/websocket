import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate, signToken } from "../middleware/auth.js";
import type { User } from "../types/index.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    createdAt: user.created_at,
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(body.password, 10);

    try {
      const result = await query<User>(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, created_at`,
        [body.email, passwordHash, body.displayName],
      );

      const user = result.rows[0];
      const token = signToken({ sub: user.id, email: user.email });

      return reply.status(201).send({ user: toPublicUser(user), token });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        return reply.status(409).send({ error: "Email already registered" });
      }
      throw error;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const result = await query<User & { password_hash: string }>(
      `SELECT id, email, password_hash, display_name, created_at
       FROM users WHERE email = $1`,
      [body.email],
    );

    const user = result.rows[0];
    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = signToken({ sub: user.id, email: user.email });
    return { user: toPublicUser(user), token };
  });

  app.get("/auth/me", async (request, reply) => {
    const payload = await authenticate(request);
    if (!payload) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const result = await query<User>(
      `SELECT id, email, display_name, created_at FROM users WHERE id = $1`,
      [payload.sub],
    );

    const user = result.rows[0];
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return { user: toPublicUser(user) };
  });
}
