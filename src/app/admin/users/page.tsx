import React from "react";
import { db } from "@/lib/db";
import UsersClient from "./UsersClient";

export const metadata = {
  title: "Quản lý người dùng - Bảng quản trị",
  description: "Quản lý thông tin và phân quyền người dùng trong hệ thống."
};

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    include: {
      spins: {
        include: {
          wheel: {
            select: { name: true }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Serialize Date objects to strings for Client Component boundary safety
  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    spins: user.spins.map((spin) => ({
      ...spin,
      createdAt: spin.createdAt.toISOString(),
    })),
  }));

  return <UsersClient initialUsers={serializedUsers} />;
}
