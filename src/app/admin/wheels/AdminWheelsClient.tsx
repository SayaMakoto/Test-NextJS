"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { softDeleteWheelAction } from "../actions";
import { WheelIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon } from "@/components/Icons";
import AdminPagination from "@/components/AdminPagination";

interface SerializedWheel {
  id: string;
  name: string;
  userId: string;
  slices: string;
  isPublic: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: { username: string };
}

interface AdminWheelsClientProps {
  initialWheels: SerializedWheel[];
}

export default function AdminWheelsClient({ initialWheels }: AdminWheelsClientProps) {
  const pageSize = 10;
  const router = useRouter();
  const [wheels, setWheels] = useState<SerializedWheel[]>(initialWheels);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(wheels.length / pageSize));
  const pagedWheels = wheels.slice((page - 1) * pageSize, page * pageSize);

  // Synchronize component state with prop updates
  React.useEffect(() => {
    setWheels(initialWheels);
    setPage(1);
  }, [initialWheels]);

  React.useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const showMessage = (msg: { error?: string; success?: string }) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn di chuyển vòng quay này vào Thùng rác?")) return;
    const result = await softDeleteWheelAction(id);
    if (result.success) {
      showMessage({ success: "Đã di chuyển vòng quay vào Thùng rác." });
      setWheels((prev) => prev.filter((w) => w.id !== id));
      router.refresh();
    } else {
      showMessage({ error: result.error || "Không thể xóa vòng quay." });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <WheelIcon className="w-6 h-6" style={{ color: "#a78bfa" }} /> Quản Lý Vòng Quay Hệ Thống
        </h2>
        <Link 
          href="/admin/trash" 
          className="btn btn-secondary" 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            background: "rgba(239, 68, 68, 0.08)", 
            border: "1px solid rgba(239, 68, 68, 0.15)", 
            color: "#f87171" 
          }}
        >
          <TrashIcon className="w-5 h-5" /> Thùng Rác
        </Link>
      </div>

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

      {/* Create Form + Wheels Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div className="glass-panel" style={{ background: "rgba(139, 92, 246, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PlusIcon className="w-5 h-5" style={{ color: "#a78bfa" }} /> Tạo vòng quay mới
            </h3>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Thiết lập các ô, màu sắc và chế độ hiển thị trước khi tạo.</p>
          </div>
          <Link href="/admin/wheels/create" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            <PlusIcon className="w-4 h-4" /> Tạo vòng quay
          </Link>
        </div>

        {/* Wheels list table */}
        <div className="glass-panel" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Tên vòng quay</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Người tạo</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Trạng thái</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {wheels.length > 0 ? (
                pagedWheels.map((wheel) => (
                  <tr 
                    key={wheel.id} 
                    style={{ 
                      borderBottom: "1px solid rgba(255,255,255,0.05)"
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "600" }}>{wheel.name}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#a78bfa" }}>{wheel.user.username}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span 
                        style={{ 
                          fontSize: "0.75rem", 
                          padding: "0.2rem 0.5rem", 
                          borderRadius: "4px",
                          background: wheel.isPublic ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
                          color: wheel.isPublic ? "#34d399" : "#9ca3af"
                        }}
                      >
                        {wheel.isPublic ? "Public" : "Private"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                      <Link 
                        href={`/wheels/${wheel.id}`} 
                        target="_blank"
                        className="btn btn-secondary" 
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <EyeIcon className="w-4 h-4" /> Xem
                      </Link>
                      <Link 
                        href={`/admin/wheels/${wheel.id}`}
                        className="btn btn-primary" 
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <PencilIcon className="w-4 h-4" /> Sửa
                      </Link>
                      <button 
                        onClick={() => handleSoftDelete(wheel.id)}
                        className="btn btn-danger" 
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <TrashIcon className="w-4 h-4" /> Xoá
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                    Không có vòng quay nào hoạt động.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} totalItems={wheels.length} pageSize={pageSize} onPageChange={setPage} />
      </div>
    </div>
  );
}
