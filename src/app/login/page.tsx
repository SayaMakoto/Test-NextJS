"use client";

import React, { useActionState } from "react";
import { loginAction } from "@/lib/auth";
import Link from "next/link";
import { HomeIcon } from "@/components/Icons";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  React.useEffect(() => {
    document.title = "Đăng nhập - Lucky Wheel Hub";
  }, []);

  return (
    <div 
      style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "75vh",
        padding: "2rem 1rem"
      }}
    >
      <div className="glass-panel" style={{ width: "100%", maxWidth: "420px" }}>
        <h2 
          style={{ 
            textAlign: "center", 
            marginBottom: "1.5rem", 
            fontSize: "1.75rem",
            fontWeight: "800",
            background: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Đăng Nhập Hệ Thống
        </h2>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem", fontWeight: "600" }}>
              Tên đăng nhập hoặc Email
            </label>
            <input 
              type="text" 
              name="usernameOrEmail" 
              placeholder="Nhập tên đăng nhập hoặc email..." 
              required 
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "0.4rem", fontWeight: "600" }}>
              Mật khẩu
            </label>
            <input 
              type="password" 
              name="password" 
              placeholder="Nhập mật khẩu..." 
              required 
              style={{ width: "100%" }}
            />
          </div>

          {state?.error && (
            <p style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "center", fontWeight: "500" }}>
              ❌ {state.error}
            </p>
          )}

          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={isPending} 
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            {isPending ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.85rem", marginTop: "1.5rem", color: "#9ca3af" }}>
          Chưa có tài khoản?{" "}
          <Link href="/register" style={{ color: "#a78bfa", textDecoration: "underline", fontWeight: "600" }}>
            Đăng ký tài khoản mới
          </Link>
        </p>

        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "1rem 0" }} />

        <p style={{ textAlign: "center", fontSize: "0.85rem", margin: 0 }}>
          <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem", margin: "0 auto" }}>
            <HomeIcon className="w-4 h-4" /> Quay về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
