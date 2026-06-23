import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config.js";
import type { JwtPayload } from "../types/index.js";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function authenticate(
  request: FastifyRequest,
): Promise<JwtPayload | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
