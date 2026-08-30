"use client";

import React, { useState, useEffect } from "react";
import LuckyWheel, { WheelItem } from "@/components/LuckyWheel";

// 10 Default items with distinct nice colors
const DEFAULT_ITEMS: WheelItem[] = [
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

export default function Home() {
  const [items, setItems] = useState<WheelItem[]>(DEFAULT_ITEMS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [triggerSpin, setTriggerSpin] = useState(false);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  
  // Settings
  const [hideOnWin, setHideOnWin] = useState(false);
  const [customWinnerId, setCustomWinnerId] = useState<string>("random");
  
  // Real-time Event Logs to simulate backend sync
  const [logs, setLogs] = useState<string[]>([
    "Phòng chơi đã được khởi tạo.",
    "Host: Đang sử dụng chế độ tỉ lệ đều nhau (1:1).",
  ]);

  const activeItems = items.filter((item) => item.enabled);

  const addLog = (message: string) => {
    const timeStr = new Date().toLocaleTimeString("vi-VN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [`[${timeStr}] ${message}`, ...prev.slice(0, 15)]);
  };

  // Convert custom winner ID to index in the activeItems list
  const getCustomWinningIndex = (): number | null => {
    if (customWinnerId === "random") return null;
    const index = activeItems.findIndex((item) => item.id === customWinnerId);
    return index !== -1 ? index : null;
  };

  // Handle spin initiation
  const handleSpinStartClick = () => {
    if (activeItems.length === 0) return;
    setWinner(null);
    setTriggerSpin(true);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
    addLog("Vòng quay đã bắt đầu xoay...");
  };

  const handleSpinComplete = (wonItem: WheelItem) => {
    setIsSpinning(false);
    setWinner(wonItem);
    addLog(`Chúc mừng! Vòng quay dừng lại ở: [${wonItem.label}]`);

    // Hide item after winning if setting enabled
    if (hideOnWin) {
      setTimeout(() => {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === wonItem.id ? { ...item, enabled: false } : item
          )
        );
        addLog(`Đã tự động ẩn mục [${wonItem.label}] theo cài đặt.`);
      }, 1000);
    }
  };

  // Manage items
  const handleAddItem = () => {
    const colors = [
      "#3b82f6", "#14b8a6", "#f43f5e", "#a855f7", 
      "#eab308", "#10b981", "#f97316", "#06b6d4"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newItem: WheelItem = {
      id: Date.now().toString(),
      label: `Mục mới ${items.length + 1}`,
      color: randomColor,
      weight: 1,
      enabled: true,
    };
    setItems((prev) => [...prev, newItem]);
    addLog(`Đã thêm mục mới: "${newItem.label}"`);
  };

  const handleUpdateItem = (id: string, updates: Partial<WheelItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // If weight was updated, log it to show real-time effect
          if (updates.weight !== undefined) {
            addLog(`Host điều chỉnh tỉ lệ "${item.label}" -> ${updates.weight}x`);
          }
          if (updates.enabled !== undefined) {
            addLog(`Host ${updates.enabled ? "bật" : "tắt"} mục "${item.label}"`);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (itemToDelete) {
      addLog(`Đã xoá mục: "${itemToDelete.label}"`);
    }
  };

  const handleReset = () => {
    setItems(DEFAULT_ITEMS);
    setWinner(null);
    setCustomWinnerId("random");
    addLog("Đã thiết lập lại vòng quay về mặc định (10 mục tỉ lệ đều).");
  };

  const handleResetWeights = () => {
    setItems((prev) => prev.map((item) => ({ ...item, weight: 1 })));
    addLog("Đã thiết lập lại tất cả tỉ lệ về đều nhau (1x).");
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Vòng Quay May Mắn</h1>
      </header>

      <div className="dashboard-grid">
        {/* Left Column: Wheel and Live Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ textAlign: "center", position: "relative" }}>
            <LuckyWheel
              items={items}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              onSpinStart={handleSpinStart}
              triggerSpinSignal={triggerSpin}
              setTriggerSpinSignal={setTriggerSpin}
              customWinningIndex={getCustomWinningIndex()}
            />

            <div style={{ marginTop: "1.5rem" }}>
              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: "1rem", fontSize: "1.2rem" }}
                onClick={handleSpinStartClick}
                disabled={isSpinning || activeItems.length === 0}
              >
                {isSpinning ? "Đang quay..." : "QUAY NGAY"}
              </button>
            </div>
          </div>

          {/* Winner Reveal Card */}
          {winner && (
            <div 
              className="glass-panel" 
              style={{ 
                border: "2px solid #8b5cf6",
                background: "rgba(139, 92, 246, 0.1)",
                textAlign: "center",
                animation: "pulse 2s infinite"
              }}
            >
              <h3 style={{ color: "#a78bfa", marginBottom: "0.25rem" }}>Kết Quả Vòng Quay</h3>
              <p style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff" }}>
                {winner.label}
              </p>
            </div>
          )}

          {/* Real-time Activity Log (Simulating WebSocket client updates) */}
          <div className="glass-panel" style={{ padding: "1.2rem" }}>
            <h4 style={{ color: "#ec4899", marginBottom: "0.75rem", fontSize: "0.95rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              📡 Nhật Ký Phòng Chơi (Real-time Simulation)
            </h4>
            <div 
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                color: "#10b981",
                background: "#080c14",
                padding: "1rem",
                borderRadius: "8px",
                height: "160px",
                overflowY: "auto",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                lineHeight: "1.5"
              }}
            >
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: "0.25rem", opacity: Math.max(1 - index * 0.15, 0.3) }}>
                  {log}
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", color: varColor("text-secondary"), marginTop: "0.5rem" }}>
              💡 Khi host thay đổi cấu hình, thông báo sẽ lập tức truyền xuống thiết bị của tất cả mọi người chơi trong phòng.
            </p>
          </div>
        </div>

        {/* Right Column: Settings & Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Host Panel: Simulated Mini Window */}
          <div className="glass-panel" style={{ border: "1px solid rgba(236, 72, 153, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "#ec4899", fontSize: "1.2rem", fontWeight: "700" }}>
                🛡️ Cửa Sổ Của Host (Quick Tuner)
              </h3>
              <span 
                style={{ 
                  background: "rgba(236, 72, 153, 0.15)", 
                  color: "#ec4899", 
                  padding: "0.2rem 0.5rem", 
                  borderRadius: "4px", 
                  fontSize: "0.7rem", 
                  fontWeight: "bold" 
                }}
              >
                LIVE SYNC
              </span>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "1.2rem" }}>
              Giả lập quyền điều khiển từ xa của Host. Mọi điều chỉnh về tỉ lệ hoặc khoá ô sẽ thay đổi thuật toán quay tức thì.
            </p>

            {/* Quick Probability Adjusters */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {items.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.02)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.03)"
                  }}
                >
                  <span style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                    <span style={{ textDecoration: item.enabled ? "none" : "line-through", color: item.enabled ? "#fff" : "#6b7280" }}>
                      {item.label}
                    </span>
                  </span>
                  
                  {item.enabled ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af", width: "40px", textAlign: "right" }}>
                        x{item.weight}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={item.weight}
                        onChange={(e) => handleUpdateItem(item.id, { weight: Number(e.target.value) })}
                        style={{ width: "80px", accentColor: "#ec4899", cursor: "pointer" }}
                        disabled={isSpinning}
                      />
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Đã tắt</span>
                  )}
                </div>
              ))}
            </div>

            <hr style={{ border: "0", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "1.2rem 0" }} />

            {/* Host Rigging: Force specific result (Cheat Mode for demo) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#a78bfa" }}>
                🎯 Chỉ định kết quả trước (Cheat/Prank Mode):
              </label>
              <select
                value={customWinnerId}
                onChange={(e) => {
                  setCustomWinnerId(e.target.value);
                  const selectedName = e.target.value === "random" ? "Ngẫu Nhiên" : items.find(i => i.id === e.target.value)?.label;
                  addLog(`Host cấu hình mục trúng bắt buộc: "${selectedName}"`);
                }}
                disabled={isSpinning}
              >
                <option value="random">Lấy ngẫu nhiên theo tỉ lệ</option>
                {activeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    Chỉ định dừng ở: {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Editor and Settings */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1rem" }}>
              ⚙️ Cấu Hình Chung
            </h3>

            {/* Hide item checkbox */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="switch-container">
                <span className="switch">
                  <input
                    type="checkbox"
                    checked={hideOnWin}
                    onChange={(e) => {
                      setHideOnWin(e.target.checked);
                      addLog(`Đã ${e.target.checked ? "bật" : "tắt"} tính năng tự động ẩn ô trúng giải.`);
                    }}
                  />
                  <span className="slider" />
                </span>
                <span>Ẩn mục đã trúng giải sau khi dừng</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={handleResetWeights} style={{ flex: 1, padding: "0.5rem 0.25rem", fontSize: "0.85rem" }}>
                Tỉ lệ đều nhau
              </button>
              <button className="btn btn-danger" onClick={handleReset} style={{ flex: 1, padding: "0.5rem 0.25rem", fontSize: "0.85rem" }}>
                Khởi tạo lại
              </button>
            </div>

            {/* List of items editor */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h4 style={{ fontSize: "1rem" }}>Danh sách các ô ({items.length})</h4>
              <button className="btn btn-secondary" onClick={handleAddItem} style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}>
                + Thêm ô
              </button>
            </div>

            <div 
              style={{ 
                maxHeight: "300px", 
                overflowY: "auto", 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.5rem",
                paddingRight: "0.25rem"
              }}
            >
              {items.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    padding: "0.4rem",
                    borderRadius: "6px"
                  }}
                >
                  {/* Enable checkbox */}
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => handleUpdateItem(item.id, { enabled: e.target.checked })}
                    disabled={isSpinning}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />

                  {/* Label Text Input */}
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateItem(item.id, { label: e.target.value })}
                    disabled={isSpinning}
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", flex: 1 }}
                  />

                  {/* Color Picker */}
                  <input
                    type="color"
                    value={item.color}
                    onChange={(e) => handleUpdateItem(item.id, { color: e.target.value })}
                    disabled={isSpinning}
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      border: "none", 
                      background: "none", 
                      cursor: "pointer", 
                      padding: 0 
                    }}
                  />

                  {/* Delete Button */}
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={isSpinning || items.length <= 1}
                    style={{ padding: "0.4rem 0.6rem" }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helpers
function varColor(variableName: string) {
  return `var(--${variableName})`;
}
