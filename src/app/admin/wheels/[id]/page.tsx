import React from "react";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import AdminWheelEditClient from "./AdminWheelEditClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const wheel = await db.wheel.findUnique({ where: { id } });
  return {
    title: wheel ? `Chỉnh sửa ${wheel.name} - Bảng quản trị` : "Chỉnh sửa vòng quay - Bảng quản trị"
  };
}

export default async function AdminWheelEditPage({ params }: PageProps) {
  const { id } = await params;
  
  const wheel = await db.wheel.findUnique({
    where: { id },
    include: {
      user: { select: { username: true } }
    }
  });

  if (!wheel || wheel.isDeleted) {
    notFound();
  }

  const serializedWheel = {
    ...wheel,
    createdAt: wheel.createdAt.toISOString(),
    updatedAt: wheel.updatedAt.toISOString(),
  };

  return <AdminWheelEditClient initialWheel={serializedWheel} />;
}
