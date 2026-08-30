"use client";

import React, { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth";
import { WheelIcon, HomeIcon, UsersIcon } from "@/components/Icons";

interface HeaderProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleShowProfile = () => {
    if (!user) return;
    alert(
      `👤 THÔNG TIN CÁ NHÂN\n\n` +
      `• Tên tài khoản: ${user.username}\n` +
      `• Địa chỉ email: ${user.email}\n` +
      `• Vai trò hệ thống: ${user.role === "admin" ? "Quản trị viên (Admin)" : "Thành viên (Member)"}`
    );
  };

  const handleShowSupport = () => {
    alert(
      `📞 LIÊN HỆ HỖ TRỢ\n\n` +
      `• Email hỗ trợ: support@luckywheel.com\n` +
      `• Hotline kỹ thuật: 1900 1234 (8:00 - 22:00)\n` +
      `• Hỗ trợ trực tuyến: Phục vụ 24/7`
    );
  };

  return (
    <header 
      className="glass-panel" 
      style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "2rem", 
        padding: "1rem 1.5rem",
        position: "relative"
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link 
          href="/" 
          style={{ 
            fontSize: "1.5rem", 
            fontWeight: "800", 
            background: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem" 
          }}
        >
          <WheelIcon className="w-6 h-6" style={{ color: "#ec4899" }} /> Lucky Wheel Hub
        </Link>

        {/* Navigation Items */}
        <nav style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
          <Link href="/" style={{ fontSize: "0.9rem", color: "#d1d5db", fontWeight: "600", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#a78bfa"} onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}>
            Trang chủ
          </Link>
          <Link href="/" style={{ fontSize: "0.9rem", color: "#d1d5db", fontWeight: "600", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#a78bfa"} onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}>
            Vòng quay
          </Link>
        </nav>
      </div>

      {/* User Login/Dropdown Menu */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user ? (
          <div 
            style={{ position: "relative" }}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            {/* Avatar Circle */}
            <div 
              style={{ 
                width: "36px", 
                height: "36px", 
                borderRadius: "50%", 
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)", 
                color: "#ffffff", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontWeight: "700", 
                fontSize: "1rem", 
                cursor: "pointer",
                boxShadow: "0 0 10px rgba(139, 92, 246, 0.4)",
                textTransform: "uppercase",
                userSelect: "none"
              }}
            >
              {user.username.charAt(0)}
            </div>

            {/* Hover Dropdown Menu */}
            {showDropdown && (
              <div 
                style={{ 
                  position: "absolute", 
                  top: "100%", 
                  right: 0, 
                  width: "220px", 
                  paddingTop: "0.5rem", // Bridge gap preventing hover loss
                  zIndex: 999,
                }}
              >
                <div 
                  className="glass-panel"
                  style={{ 
                    padding: "0.75rem", 
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)", 
                    background: "rgba(17, 24, 39, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem"
                  }}
                >
                  <div style={{ padding: "0.25rem 0.5rem 0.5rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "0.25rem" }}>
                    <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.username}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.email}
                    </div>
                    <span 
                      style={{ 
                        display: "inline-block", 
                        fontSize: "0.65rem", 
                        padding: "0.1rem 0.35rem", 
                        borderRadius: "4px", 
                        background: user.role === "admin" ? "rgba(236, 72, 153, 0.2)" : "rgba(255,255,255,0.08)", 
                        color: user.role === "admin" ? "#f472b6" : "#9ca3af",
                        marginTop: "0.3rem",
                        fontWeight: "bold"
                      }}
                    >
                      {user.role === "admin" ? "ADMIN" : "MEMBER"}
                    </span>
                  </div>

                  {user.role === "admin" && (
                    <Link 
                      href="/admin" 
                      className="btn btn-secondary" 
                      style={{ 
                        width: "100%", 
                        justifyContent: "flex-start", 
                        padding: "0.4rem 0.6rem", 
                        fontSize: "0.8rem", 
                        gap: "0.4rem",
                        background: "rgba(139, 92, 246, 0.1)",
                        color: "#c084fc",
                        borderColor: "rgba(139, 92, 246, 0.2)"
                      }}
                    >
                      Bảng quản trị
                    </Link>
                  )}

                  <button 
                    onClick={handleShowProfile}
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "flex-start", padding: "0.4rem 0.6rem", fontSize: "0.8rem", gap: "0.4rem" }}
                  >
                    Thông tin cá nhân
                  </button>

                  <button 
                    onClick={handleShowSupport}
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "flex-start", padding: "0.4rem 0.6rem", fontSize: "0.8rem", gap: "0.4rem" }}
                  >
                    Liên hệ hỗ trợ
                  </button>

                  <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.25rem 0" }} />

                  <form action={logoutAction} style={{ width: "100%" }}>
                    <button 
                      type="submit" 
                      className="btn btn-danger" 
                      style={{ width: "100%", justifyContent: "center", padding: "0.4rem 0.6rem", fontSize: "0.8rem" }}
                    >
                      Đăng xuất
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              Đăng nhập
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
