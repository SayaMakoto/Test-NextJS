"use client";

import React, { useState, useEffect, useRef } from "react";
import LuckyWheel, { WheelItem } from "@/components/LuckyWheel";
import { saveSpinAction } from "./actions";
import { ChartBarIcon } from "@/components/Icons";

interface SpinHistoryEntry {
  id: string;
  resultLabel: string;
  createdAt: Date;
  user: { username: string } | null;
}

interface WheelClientWrapperProps {
  wheelId: string;
  wheelName: string;
  creatorName: string;
  slices: WheelItem[];
  history: SpinHistoryEntry[];
  currentUser: { id: string; username: string; role: string } | null;
  customWinnerId?: string;
  hideOnWin?: boolean;
}

export default function WheelClientWrapper({
  wheelId,
  wheelName,
  creatorName,
  slices,
  history,
  currentUser,
  customWinnerId = "random",
  hideOnWin = false,
}: WheelClientWrapperProps) {
  const [items, setItems] = useState<WheelItem[]>(slices);
  const [isSpinning, setIsSpinning] = useState(false);
  const [triggerSpin, setTriggerSpin] = useState(false);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const winAudioContextRef = useRef<AudioContext | null>(null);
  const isAdminView = currentUser?.role === "admin";

  // Sync slices prop updates
  useEffect(() => {
    setItems(slices);
  }, [slices]);

  const activeItems = items.filter((item) => item.enabled);

  const getCustomWinningIndex = (): number | null => {
    if (customWinnerId === "random") return null;
    const index = activeItems.findIndex((item) => item.id === customWinnerId);
    return index !== -1 ? index : null;
  };

  const handleSpinStartClick = () => {
    if (activeItems.length === 0) return;
    prepareWinningSound();
    setWinner(null);
    setTriggerSpin(true);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
  };

  const prepareWinningSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!winAudioContextRef.current) winAudioContextRef.current = new AudioContextClass();
      const context = winAudioContextRef.current;
      if (context.state === "suspended") void context.resume();
      return context;
    } catch {
      return null;
    }
  };

  const playWinningSound = () => {
    try {
      const context = prepareWinningSound();
      if (!context) return;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + index * 0.14;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.32);
      });
    } catch {
      // Sound is an enhancement; browsers can block Web Audio in some cases.
    }
  };

  const handleSpinComplete = async (wonItem: WheelItem) => {
    setIsSpinning(false);
    setWinner(wonItem);
    playWinningSound();

    // Save spin result in database
    await saveSpinAction(wheelId, wonItem.label);

    if (hideOnWin) {
      setTimeout(() => {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === wonItem.id ? { ...item, enabled: false } : item
          )
        );
      }, 1000);
    }
  };

  return (
    <div>
      {/* Title banner */}
      <div 
        style={{ 
          textAlign: "center", 
          marginBottom: "2rem",
          background: "rgba(255,255,255,0.01)",
          padding: "1rem",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.03)"
        }}
      >
        <h1 style={{ fontSize: "2.2rem", fontWeight: "800", marginBottom: "0.5rem" }}>{wheelName}</h1>
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
          Tác giả: <strong style={{ color: "#a78bfa" }}>{creatorName}</strong> 
          {currentUser ? ` • Đang chơi với tư cách: ${currentUser.username} (${currentUser.role})` : " • Đang chơi ẩn danh"}
        </p>
      </div>

      <div className={isAdminView ? "admin-wheel-view" : "dashboard-grid"}>
        {/* Left Column: Canvas, Spin Button, Winner Reveal */}
        <div className={isAdminView ? "admin-wheel-content" : undefined} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ textAlign: "center", padding: isAdminView ? "2rem" : undefined }}>
            <LuckyWheel
              items={items}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              onSpinStart={handleSpinStart}
              triggerSpinSignal={triggerSpin}
              setTriggerSpinSignal={setTriggerSpin}
              customWinningIndex={getCustomWinningIndex()}
              large={isAdminView}
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

          {winner && (
            <div 
              className="glass-panel" 
              style={{ 
                border: "2px solid #ec4899",
                background: "rgba(236, 72, 153, 0.1)",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#f472b6", marginBottom: "0.25rem" }}>Kết quả nhận được</h3>
              <p style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff" }}>
                {winner.label}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Spin History */}
        {!isAdminView && <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Spin History Panel */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ChartBarIcon className="w-5 h-5" /> Lịch Sử Lượt Quay Gần Đây
            </h3>

            {history.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {history.map((entry) => {
                  const date = new Date(entry.createdAt);
                  const time = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div 
                      key={entry.id}
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        background: "rgba(255, 255, 255, 0.02)",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.85rem"
                      }}
                    >
                      <div>
                        <strong style={{ color: "#fff" }}>{entry.resultLabel}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.15rem" }}>
                          Quay bởi: <span style={{ color: "#a78bfa" }}>{entry.user?.username || "Khách"}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{time}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "#9ca3af", textAlign: "center", padding: "1rem" }}>
                Chưa có lượt quay nào được ghi nhận. Hãy quay lượt đầu tiên!
              </p>
            )}
          </div>

        </div>}
      </div>
    </div>
  );
}
