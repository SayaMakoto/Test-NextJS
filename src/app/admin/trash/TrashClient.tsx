"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WheelItem } from "@/components/LuckyWheel";
import { restoreWheelAction, hardDeleteWheelAction } from "../actions";
import Link from "next/link";
import { TrashIcon, ArrowLeftIcon, ArrowPathIcon, EyeIcon } from "@/components/Icons";

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

interface TrashClientProps {
  initialWheels: SerializedWheel[];
}

export default function TrashClient({ initialWheels }: TrashClientProps) {
  const router = useRouter();
  const [wheels, setWheels] = useState<SerializedWheel[]>(initialWheels);
  const [selectedWheel, setSelectedWheel] = useState<SerializedWheel | null>(null);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);

  React.useEffect(() => {
    setWheels(initialWheels);
  }, [initialWheels]);

  const showMessage = (msg: { error?: string; success?: string }) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleRestore = async (id: string) => {
    const result = await restoreWheelAction(id);
    if (result.success) {
      showMessage({ success: "Đã khôi phục vòng quay thành công." });
      setWheels((prev) => prev.filter((w) => w.id !== id));
      if (selectedWheel?.id === id) setSelectedWheel(null);
      router.refresh();
    } else {
      showMessage({ error: result.error || "Không thể khôi phục vòng quay." });
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN vòng quay này và lịch sử của nó. Bạn có chắc chắn?")) return;
    const result = await hardDeleteWheelAction(id);
    if (result.success) {
      showMessage({ success: "Đã xóa vĩnh viễn vòng quay." });
      setWheels((prev) => prev.filter((w) => w.id !== id));
      if (selectedWheel?.id === id) setSelectedWheel(null);
      router.refresh();
    } else {
      showMessage({ error: result.error || "Không thể xóa vĩnh viễn." });
    }
  };

  let selectedSlices: WheelItem[] = [];
  if (selectedWheel) {
    try {
      selectedSlices = JSON.parse(selectedWheel.slices);
    } catch (e) {}
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrashIcon className="w-6 h-6" style={{ color: "#f87171" }} /> Thùng Rác Vòng Quay
        </h2>
        <Link 
          href="/admin/wheels" 
          className="btn btn-secondary" 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ArrowLeftIcon className="w-5 h-5" /> Quay Lại Quản Lý
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

      <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Danh sách các vòng quay đã bị xoá mềm. Bạn có thể xem chi tiết nội dung, khôi phục hoạt động hoặc xoá bỏ vĩnh viễn chúng khỏi hệ thống.
      </p>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: selectedWheel ? "1fr 1fr" : "1fr", 
          gap: "1.5rem",
          alignItems: "start"
        }}
      >
        {/* Trash list table */}
        <div className="glass-panel" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Tên vòng quay</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Người tạo</th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {wheels.length > 0 ? (
                wheels.map((wheel) => (
                  <tr 
                    key={wheel.id} 
                    style={{ 
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      background: selectedWheel?.id === wheel.id ? "rgba(239, 68, 68, 0.05)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "600" }}>{wheel.name}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#a78bfa" }}>{wheel.user.username}</td>
                    <td style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                      <button 
                        onClick={() => setSelectedWheel(wheel)}
                        className="btn btn-secondary" 
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <EyeIcon className="w-4 h-4" /> Xem chi tiết
                      </button>
                      <button 
                        onClick={() => handleRestore(wheel.id)}
                        className="btn btn-primary" 
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                      >
                        <ArrowPathIcon className="w-4 h-4" /> Khôi phục
                      </button>
                      <button 
                        onClick={() => handleHardDelete(wheel.id)}
                        className="btn btn-danger" 
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <TrashIcon className="w-4 h-4" /> Xóa vĩnh viễn
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                    Thùng rác trống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected wheel preview panel */}
        {selectedWheel && (
          <div className="glass-panel" style={{ border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f87171", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <EyeIcon className="w-5 h-5" /> Chi Tiết Vòng Quay Đang Xem
              </h3>
              <button 
                onClick={() => setSelectedWheel(null)}
                style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.95rem" }}>Tên: <strong>{selectedWheel.name}</strong></p>
              <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                Người tạo: {selectedWheel.user.username} | Trạng thái cũ: {selectedWheel.isPublic ? "Công khai" : "Riêng tư"}
              </p>
            </div>

            <h4 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.5rem" }}>Các ô của vòng quay ({selectedSlices.length})</h4>
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.4rem", 
                maxHeight: "220px", 
                overflowY: "auto",
                background: "rgba(0,0,0,0.15)",
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.03)"
              }}
            >
              {selectedSlices.map((slice) => (
                <div 
                  key={slice.id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    fontSize: "0.85rem",
                    opacity: slice.enabled ? 1 : 0.5
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: slice.color }} />
                    <span>{slice.label}</span>
                  </span>
                  <span style={{ color: "#9ca3af" }}>Tỉ lệ: x{slice.weight} {slice.enabled ? "" : "(Tắt)"}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button 
                onClick={() => handleRestore(selectedWheel.id)}
                className="btn btn-primary" 
                style={{ flex: 1, padding: "0.5rem" }}
              >
                Khôi phục vòng quay
              </button>
              <button 
                onClick={() => handleHardDelete(selectedWheel.id)}
                className="btn btn-danger" 
                style={{ flex: 1, padding: "0.5rem" }}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
