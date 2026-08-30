"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UsersIcon, ChartBarIcon } from "@/components/Icons";
import { updateUserRoleAction } from "../actions";

interface SerializedSpin {
  id: string;
  wheelId: string;
  userId: string | null;
  resultLabel: string;
  createdAt: string;
  wheel: { name: string };
}

interface SerializedUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  spins: SerializedSpin[];
}

interface UsersClientProps {
  initialUsers: SerializedUser[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<SerializedUser[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<SerializedUser | null>(null);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "member" : "admin";
    if (!confirm(`Bạn có chắc chắn muốn đổi vai trò của người dùng này thành ${nextRole === "admin" ? "Admin" : "Member"}?`)) {
      return;
    }
    const result = await updateUserRoleAction(userId, nextRole);
    if (result.success) {
      setMessage({ success: "Đã cập nhật vai trò người dùng thành công." });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, role: nextRole } : null);
      }
      router.refresh();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage({ error: result.error || "Không thể cập nhật vai trò." });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <UsersIcon className="w-6 h-6" style={{ color: "#ec4899" }} /> Quản Lý Người Dùng Hệ Thống
      </h2>

      <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Danh sách tất cả người dùng đã đăng ký tài khoản. Nhấn "Xem lịch sử" để xem chi tiết kết quả và hoạt động quay của từng tài khoản.
      </p>

      {message?.success && (
        <div className="glass-panel" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.15)", marginBottom: "1rem", padding: "0.8rem" }}>
          {message.success}
        </div>
      )}
      {message?.error && (
        <div className="glass-panel" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.15)", marginBottom: "1rem", padding: "0.8rem" }}>
          {message.error}
        </div>
      )}

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: selectedUser ? "1.2fr 1fr" : "1fr", 
          gap: "1.5rem",
          alignItems: "start"
        }}
      >
        {/* Users Table */}
        <div className="glass-panel" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Mã User</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Tên người dùng</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Email</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Vai trò</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>Lượt quay</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      background: selectedUser?.id === user.id ? "rgba(139, 92, 246, 0.08)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#9ca3af" }}>
                      {user.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "600" }}>{user.username}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#9ca3af" }}>{user.email}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span 
                          style={{ 
                            fontSize: "0.75rem", 
                            padding: "0.2rem 0.5rem", 
                            borderRadius: "4px",
                            background: user.role === "admin" ? "rgba(236, 72, 153, 0.15)" : "rgba(255, 255, 255, 0.08)",
                            color: user.role === "admin" ? "#f472b6" : "#9ca3af"
                          }}
                        >
                          {user.role}
                        </span>
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="btn btn-secondary"
                          style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem", display: "inline-flex", alignItems: "center" }}
                        >
                          Đổi
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>
                      {user.spins.length}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="btn btn-secondary" 
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem", margin: "0 auto" }}
                      >
                        <ChartBarIcon className="w-4 h-4" /> Xem lịch sử
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                    Không có người dùng nào đăng ký.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected User Spins History List */}
        {selectedUser && (
          <div className="glass-panel" style={{ border: "1px solid rgba(139, 92, 246, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#a78bfa", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ChartBarIcon className="w-5 h-5" /> Lịch Sử Quay của {selectedUser.username}
              </h3>
              <button 
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "1rem" }}>
              Tổng cộng có <strong>{selectedUser.spins.length}</strong> lượt quay được thực hiện bởi người dùng này:
            </p>

            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.6rem", 
                maxHeight: "380px", 
                overflowY: "auto",
                paddingRight: "0.25rem"
              }}
            >
              {selectedUser.spins.length > 0 ? (
                selectedUser.spins.map((spin) => {
                  const date = new Date(spin.createdAt);
                  const time = date.toLocaleString("vi-VN", { hour12: false });
                  return (
                    <div 
                      key={spin.id}
                      style={{ 
                        background: "rgba(0,0,0,0.2)",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.03)",
                        fontSize: "0.85rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ color: "#ec4899" }}>{spin.wheel.name}</span>
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{time}</span>
                      </div>
                      <p>
                        Kết quả quay: <strong style={{ color: "#10b981" }}>{spin.resultLabel}</strong>
                      </p>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: "0.85rem", color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                  Người dùng này chưa chơi lượt quay nào.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
