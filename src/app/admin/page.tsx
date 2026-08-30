import React from "react";
import { db } from "@/lib/db";
import { ChartBarIcon, ArrowPathIcon } from "@/components/Icons";

export const metadata = {
  title: "Thống kê hệ thống - Bảng quản trị",
  description: "Bảng điều khiển quản trị thống kê hệ thống Lucky Wheel."
};

export default async function AdminDashboardPage() {
  const totalSpins = await db.spinHistory.count();
  const totalWheels = await db.wheel.count({ where: { isDeleted: false } });
  const totalTrashWheels = await db.wheel.count({ where: { isDeleted: true } });
  const totalUsers = await db.user.count();

  // Fetch 5 most recent spins across all wheels
  const recentSpins = await db.spinHistory.findMany({
    include: {
      wheel: { select: { name: true } },
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ChartBarIcon className="w-6 h-6" style={{ color: "#a78bfa" }} /> Báo cáo Thống kê Hệ thống
      </h2>

      {/* Grid of stats cards */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1rem",
          marginBottom: "2rem" 
        }}
      >
        <div className="glass-panel" style={{ background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.1)" }}>
          <h4 style={{ color: "#a78bfa", fontSize: "0.85rem", textTransform: "uppercase" }}>Tổng lượt chơi</h4>
          <p style={{ fontSize: "2rem", fontWeight: "800", marginTop: "0.5rem" }}>{totalSpins}</p>
        </div>

        <div className="glass-panel" style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
          <h4 style={{ color: "#10b981", fontSize: "0.85rem", textTransform: "uppercase" }}>Vòng quay hoạt động</h4>
          <p style={{ fontSize: "2rem", fontWeight: "800", marginTop: "0.5rem" }}>{totalWheels}</p>
        </div>

        <div className="glass-panel" style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.1)" }}>
          <h4 style={{ color: "#fbbf24", fontSize: "0.85rem", textTransform: "uppercase" }}>Người dùng đăng ký</h4>
          <p style={{ fontSize: "2rem", fontWeight: "800", marginTop: "0.5rem" }}>{totalUsers}</p>
        </div>
      </div>

      {/* Recent spins activity */}
      <div className="glass-panel" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ArrowPathIcon className="w-5 h-5" style={{ color: "#a78bfa" }} /> Hoạt động lượt quay gần đây
        </h3>

        {recentSpins.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {recentSpins.map((spin) => {
              const date = new Date(spin.createdAt);
              const time = date.toLocaleString("vi-VN", { hour12: false });
              return (
                <div 
                  key={spin.id}
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    background: "rgba(0,0,0,0.2)",
                    padding: "0.8rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.03)"
                  }}
                >
                  <div style={{ fontSize: "0.9rem" }}>
                    Người chơi <strong style={{ color: "#a78bfa" }}>{spin.user?.username || "Khách"}</strong> vừa quay trúng 
                    <strong style={{ color: "#10b981" }}> {spin.resultLabel} </strong> 
                    trên vòng quay <span style={{ color: "#ec4899" }}>"{spin.wheel.name}"</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{time}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "#9ca3af", textAlign: "center", padding: "1.5rem" }}>
            Chưa có lịch sử lượt quay nào trên toàn hệ thống.
          </p>
        )}
      </div>
    </div>
  );
}
