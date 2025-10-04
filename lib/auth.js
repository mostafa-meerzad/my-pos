// lib/auth.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!NEXTAUTH_SECRET) throw new Error("JWT_SECRET not set");

export async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}
export function signToken(user) {
  return jwt.sign({ sub: user.id, roleId: user.roleId }, NEXTAUTH_SECRET, {
    expiresIn: "7d",
  });
}
export function verifyToken(token) {
  return jwt.verify(token, NEXTAUTH_SECRET);
}

export async function getUserFromToken(token) {
  const decoded = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    include: { role: true },
  });
  return user;
}

export function checkPermission(role, permission) {
  if (!role) return false;
  if (Array.isArray(role.permissions) && role.permissions.includes("*"))
    return true;
  const perms = role.permissions ?? [];
  return perms.includes(permission);
}
