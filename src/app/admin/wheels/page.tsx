import React from "react";
import { db } from "@/lib/db";
import AdminWheelsClient from "./AdminWheelsClient";

export const metadata = {
  title: "Quản lý vòng quay - Bảng quản trị",
  description: "Quản lý và thiết lập danh sách vòng quay hoạt động."
};

export default async function AdminWheelsPage() {
  const wheels = await db.wheel.findMany({
    where: { isDeleted: false },
    include: {
      user: { select: { username: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // Convert Date objects to strings for Client Component serialization safety
  const serializedWheels = wheels.map((w) => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return <AdminWheelsClient initialWheels={serializedWheels} />;
}
