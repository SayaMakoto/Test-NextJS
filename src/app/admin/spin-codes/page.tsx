import { db } from "@/lib/db";
import SpinCodesClient from "./SpinCodesClient";

export const metadata = { title: "Quản lý mã quay - Bảng quản trị" };

export default async function SpinCodesPage() {
  const codes = await db.spinCode.findMany({ orderBy: { createdAt: "desc" } });
  return <SpinCodesClient initialCodes={codes.map((code) => ({ ...code, createdAt: code.createdAt.toISOString() }))} />;
}
