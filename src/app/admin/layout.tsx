import React from "react";
import Link from "next/link";
import { getCurrentUser, logoutAction } from "@/lib/auth";
import { ChartBarIcon, WheelIcon, UsersIcon, KeyIcon } from "@/components/Icons";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Admin header */}
      <header 
        className="glass-panel" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          margin: "1rem", 
          padding: "1rem 2rem", 
          borderRadius: "12px" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2 
            style={{ 
              fontSize: "1.25rem", 
              fontWeight: "800", 
              background: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}
          >
            🛡️ BẢNG QUẢN TRỊ ADMIN
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Tài khoản: <strong style={{ color: "#fff" }}>{user?.username}</strong>
          </span>
          <form action={logoutAction}>
            <button className="btn btn-danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
              Đăng xuất
            </button>
          </form>
        </div>
      </header>

      {/* Admin main area */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "240px 1fr", 
          gap: "1.5rem", 
          margin: "0 1rem 1rem 1rem",
          alignItems: "stretch",
          flex: 1
        }}
      >
        {/* Sidebar */}
        <aside className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem", height: "100%" }}>
          <Link href="/admin" className="btn btn-secondary" style={{ justifyContent: "flex-start", width: "100%", textAlign: "left", gap: "0.75rem" }}>
            <ChartBarIcon className="w-5 h-5" /> Thống kê chung
          </Link>
          <Link href="/admin/wheels" className="btn btn-secondary" style={{ justifyContent: "flex-start", width: "100%", textAlign: "left", gap: "0.75rem" }}>
            <WheelIcon className="w-5 h-5" /> Quản lý vòng quay
          </Link>
          <Link href="/admin/users" className="btn btn-secondary" style={{ justifyContent: "flex-start", width: "100%", textAlign: "left", gap: "0.75rem" }}>
            <UsersIcon className="w-5 h-5" /> Quản lý người dùng
          </Link>
          <Link href="/admin/spin-codes" className="btn btn-secondary" style={{ justifyContent: "flex-start", width: "100%", textAlign: "left", gap: "0.75rem" }}>
            <KeyIcon className="w-5 h-5" /> Quản lý mã quay
          </Link>
        </aside>

        {/* Content panel */}
        <main className="glass-panel" style={{ minHeight: "70vh", padding: "1.5rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
