import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { WheelIcon } from "@/components/Icons";
import Header from "@/components/Header";

export const metadata = {
  title: "Trang chủ - Lucky Wheel Hub",
  description: "Vòng quay may mắn trực tuyến, thiết lập tỉ lệ và cấu hình prank dễ dàng."
};

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

async function seedDefaultWheels(adminId: string) {
  try {
    const wheelCount = await db.wheel.count();
    if (wheelCount === 0) {
      const foodSlices = [
        { id: "1", label: "Bún Chả", color: "#6366f1", weight: 1, enabled: true },
        { id: "2", label: "Phở Bò", color: "#8b5cf6", weight: 1, enabled: true },
        { id: "3", label: "Cơm Tấm", color: "#d946ef", weight: 1, enabled: true },
        { id: "4", label: "Bánh Mì", color: "#ec4899", weight: 1, enabled: true },
        { id: "5", label: "Lẩu Thái", color: "#f43f5e", weight: 1, enabled: true },
        { id: "6", label: "Sushi", color: "#ef4444", weight: 1, enabled: true },
        { id: "7", label: "Gà Rán", color: "#f97316", weight: 1, enabled: true },
        { id: "8", label: "Pizza", color: "#eab308", weight: 1, enabled: true },
        { id: "9", label: "Mì Ý", color: "#10b981", weight: 1, enabled: true },
        { id: "10", label: "Gỏi Cuốn", color: "#06b6d4", weight: 1, enabled: true },
      ];

      const numberSlices = Array.from({ length: 10 }, (_, i) => ({
        id: (i + 1).toString(),
        label: `Số ${i + 1}`,
        color: i % 2 === 0 ? "#8b5cf6" : "#ec4899",
        weight: 1,
        enabled: true,
      }));

      await db.wheel.createMany({
        data: [
          {
            name: "Hôm nay ăn gì?",
            userId: adminId,
            slices: JSON.stringify(foodSlices),
            isPublic: true,
            isDeleted: false,
          },
          {
            name: "Vòng quay số may mắn (1 - 10)",
            userId: adminId,
            slices: JSON.stringify(numberSlices),
            isPublic: true,
            isDeleted: false,
          }
        ],
      });
      console.log("Default wheels seeded.");
    }
  } catch (e) {
    console.error("Default wheel seeding failed:", e);
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  
  // Seed default wheels under admin if none exist
  if (user) {
    await seedDefaultWheels(user.id);
  } else {
    // If no logged in user, fetch the admin user to seed under them
    const admin = await db.user.findUnique({ where: { username: "admin" } });
    if (admin) {
      await seedDefaultWheels(admin.id);
    }
  }

  // Await search params in Next.js 15+
  const params = await searchParams;
  const searchQuery = params.search || "";

  // Fetch public, non-deleted wheels
  const wheels = await db.wheel.findMany({
    where: {
      isPublic: true,
      isDeleted: false,
      name: {
        contains: searchQuery,
      },
    },
    include: {
      user: {
        select: { username: true }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="app-container">
      <Header user={user} />

      {/* Main Content Area */}
      <div className="glass-panel" style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "700" }}>
          Khám phá Vòng Quay Công Khai
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          Chọn một vòng quay dưới đây để bắt đầu chơi hoặc tìm kiếm theo tên vòng quay.
        </p>

        {/* Search Form */}
        <form method="GET" action="/" style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Tìm kiếm vòng quay theo tên..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Tìm kiếm
          </button>
          {searchQuery && (
            <Link href="/" className="btn btn-secondary">
              Xóa lọc
            </Link>
          )}
        </form>

        {/* Wheels List */}
        {wheels.length > 0 ? (
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
              gap: "1.5rem" 
            }}
          >
            {wheels.map((wheel) => {
              let sliceCount = 0;
              try {
                const slices = JSON.parse(wheel.slices);
                sliceCount = Array.isArray(slices) ? slices.filter((s: any) => s.enabled).length : 0;
              } catch (e) {}

              return (
                <div 
                  key={wheel.id} 
                  className="glass-panel" 
                  style={{ 
                    background: "rgba(255, 255, 255, 0.02)", 
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5rem" }}>{wheel.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "1rem" }}>
                      Tạo bởi: <strong style={{ color: "#a78bfa" }}>{wheel.user.username}</strong>
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      <span style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c084fc", fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                        🎯 {sliceCount} ô kích hoạt
                      </span>
                    </div>
                  </div>

                  <Link href={`/wheels/${wheel.id}`} className="btn btn-primary" style={{ width: "100%", padding: "0.6rem" }}>
                    QUAY NGAY
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <p style={{ color: "#9ca3af", marginBottom: "1rem" }}>Không tìm thấy vòng quay nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
}
