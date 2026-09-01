"use server";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.JWT_SECRET || "secret-jwt-key-lucky-wheel-12345";
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "session-token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; role: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (err) {
    return null;
  }
}

// Seed admin user helper
async function ensureAdminSeeded() {
  try {
    const adminExists = await db.user.findUnique({
      where: { username: "admin" },
    });
    if (!adminExists) {
      const hashedPassword = await hashPassword("admin");
      await db.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
          username: "admin",
          email: "admin@wheel.com",
          password: hashedPassword,
          role: "admin",
        },
      });
      console.log("Default admin seeded: admin / admin");
    }
  } catch (e) {
    // Catch parallel write collisions silently
  }
}

// Retrieve the current logged-in user
export async function getCurrentUser() {
  await ensureAdminSeeded();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, username: true, email: true, role: true, isBanned: true },
    });
    // A blocked account cannot keep using an old session token.
    return user?.isBanned ? null : user;
  } catch (e) {
    return null;
  }
}

// Register Server Action
export async function registerAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!username || !email || !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin đăng ký." };
  }

  try {
    // Check if user exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return { error: "Tên đăng nhập hoặc Email đã tồn tại." };
    }

    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "member",
      },
    });

    // Create session token
    const token = await signToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });
  } catch (e) {
    return { error: "Đã xảy ra lỗi hệ thống khi đăng ký." };
  }

  redirect("/");
}

// Login Server Action
export async function loginAction(prevState: any, formData: FormData) {
  await ensureAdminSeeded();
  
  const usernameOrEmail = formData.get("usernameOrEmail") as string;
  const password = formData.get("password") as string;

  if (!usernameOrEmail || !password) {
    return { error: "Vui lòng nhập tên đăng nhập và mật khẩu." };
  }

  let isAdmin = false;

  try {
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ],
      },
    });

    if (!user) {
      return { error: "Tên đăng nhập hoặc mật khẩu không chính xác." };
    }

    if (user.isBanned) {
      return { error: "Tài khoản này đã bị đưa vào danh sách đen. Vui lòng liên hệ quản trị viên." };
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return { error: "Tên đăng nhập hoặc mật khẩu không chính xác." };
    }

    isAdmin = user.role === "admin";

    const token = await signToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });
  } catch (e) {
    return { error: "Đã xảy ra lỗi hệ thống khi đăng nhập." };
  }

  if (isAdmin) {
    redirect("/admin");
  } else {
    redirect("/");
  }
}

// Logout Server Action
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
