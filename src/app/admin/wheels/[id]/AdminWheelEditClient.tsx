"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LuckyWheel, { WheelItem } from "@/components/LuckyWheel";
import WheelStage from "@/components/WheelStage";
import WheelBackgroundUpload from "@/components/WheelBackgroundUpload";
import WheelColorPicker from "@/components/WheelColorPicker";
import { updateWheelAction } from "../../actions";
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  PlusIcon, 
  TrashIcon, 
  KeyIcon, 
  AdjustmentsHorizontalIcon,
  WheelIcon
} from "@/components/Icons";

interface SerializedWheel {
  id: string;
  name: string;
  userId: string;
  slices: string;
  isPublic: boolean;
  isDeleted: boolean;
  customWinnerId: string;
  hideOnWin: boolean;
  backgroundImage: string | null;
  createdAt: string;
  updatedAt: string;
  user: { username: string };
}

interface AdminWheelEditClientProps {
  initialWheel: SerializedWheel;
}

export default function AdminWheelEditClient({ initialWheel }: AdminWheelEditClientProps) {
  const router = useRouter();
  const [wheelName, setWheelName] = useState(initialWheel.name);
  const [isPublic, setIsPublic] = useState(initialWheel.isPublic);
  const [slices, setSlices] = useState<WheelItem[]>(() => {
    try {
      return JSON.parse(initialWheel.slices);
    } catch (e) {
      return [];
    }
  });

  // Prank settings
  const [customWinnerId, setCustomWinnerId] = useState(initialWheel.customWinnerId || "random");
  const [hideOnWin, setHideOnWin] = useState(initialWheel.hideOnWin || false);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(initialWheel.backgroundImage);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = (msg: { error?: string; success?: string }) => {
    setMessage(msg);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => () => { if (messageTimerRef.current) clearTimeout(messageTimerRef.current); }, []);

  const handleUpdateSlice = (id: string, updates: Partial<WheelItem>) => {
    setSlices((prev) =>
      prev.map((slice) => (slice.id === id ? { ...slice, ...updates } : slice))
    );
  };

  const handleAddSlice = () => {
    const nextId = (Math.max(0, ...slices.map((s) => Number(s.id) || 0)) + 1).toString();
    const newSlice: WheelItem = {
      id: nextId,
      label: `Mục số ${nextId}`,
      color: slices.length % 2 === 0 ? "#8b5cf6" : "#ec4899",
      weight: 1,
      enabled: true,
    };
    setSlices((prev) => [...prev, newSlice]);
  };

  const handleDeleteSlice = (id: string) => {
    if (slices.length <= 1) return;
    setSlices((prev) => prev.filter((s) => s.id !== id));
    // If the custom winner was this slice, reset it
    if (customWinnerId === id) {
      setCustomWinnerId("random");
    }
  };

  const handleSave = async () => {
    if (!wheelName.trim()) {
      showMessage({ error: "Tên vòng quay không được để trống." });
      return;
    }
    if (slices.length === 0) {
      showMessage({ error: "Vòng quay phải có ít nhất 1 ô." });
      return;
    }

    setIsSaving(true);
    const result = await updateWheelAction(
      initialWheel.id,
      wheelName,
      JSON.stringify(slices),
      isPublic,
      customWinnerId,
      hideOnWin,
      backgroundImage
    );
    setIsSaving(false);

    if (result.success) {
      showMessage({ success: "Đã cập nhật cấu hình vòng quay và chế độ Prank thành công!" });
      router.refresh();
    } else {
      showMessage({ error: result.error || "Có lỗi xảy ra khi lưu cấu hình." });
    }
  };

  const activeItems = slices.filter((s) => s.enabled);

  return (
    <div>
      {/* Header with back button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <PencilIcon className="w-6 h-6" style={{ color: "#a78bfa" }} /> Thiết lập vòng quay: {initialWheel.name}
        </h2>
        <Link href="/admin/wheels" className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ArrowLeftIcon className="w-5 h-5" /> Quay Lại
        </Link>
      </div>

      {message && <div className={`admin-toast ${message.success ? "admin-toast-success" : "admin-toast-error"}`} role={message.error ? "alert" : "status"}>
        <span>{message.success || message.error}</span>
        <button type="button" onClick={() => setMessage(null)} aria-label="Đóng thông báo">×</button>
      </div>}

      {/* Main split grid */}
      <div className="wheel-edit-layout"
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1.2fr", 
          gap: "1.5rem",
          alignItems: "start"
        }}
      >
        {/* Left Column: Visual Wheel Preview */}
        <div className="glass-panel wheel-editor-preview" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
            <WheelIcon className="w-5 h-5" style={{ color: "#ec4899" }} /> Xem trước vòng quay
          </h3>
          <WheelStage backgroundImage={backgroundImage} className="wheel-editor-stage"><div style={{ pointerEvents: "none", opacity: 0.9 }}><LuckyWheel
              items={slices}
              isSpinning={false}
              onSpinComplete={() => {}}
              onSpinStart={() => {}}
              triggerSpinSignal={false}
              setTriggerSpinSignal={() => {}}
              customWinningIndex={null}
            /></div></WheelStage>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
            (Vòng quay hiển thị trực quan tỷ lệ, kích thước và màu sắc thực tế dựa trên bảng cấu hình bên phải)
          </p>
        </div>

        {/* Right Column: Editor Controls & Prank Settings */}
        <div className="wheel-editor-controls" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Wheel configuration panel */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1.2rem", color: "#a78bfa", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PencilIcon className="w-5 h-5" /> Cấu hình cơ bản
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
                  Tên vòng quay:
                </label>
                <input
                  type="text"
                  value={wheelName}
                  onChange={(e) => setWheelName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>Ảnh nền vòng quay:</label>
                <WheelBackgroundUpload value={backgroundImage} onChange={setBackgroundImage} onError={(error) => showMessage({ error })} />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
                  Chế độ hiển thị:
                </label>
                <select 
                  value={isPublic ? "public" : "private"}
                  onChange={(e) => setIsPublic(e.target.value === "public")}
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                >
                  <option value="public">Công khai (Public)</option>
                  <option value="private">Riêng tư (Private)</option>
                </select>
              </div>
            </div>

            {/* Slices section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700" }}>Danh sách các ô ({slices.length})</h4>
              <button 
                className="btn btn-secondary" 
                onClick={handleAddSlice} 
                style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <PlusIcon className="w-3 h-3" /> Thêm ô
              </button>
            </div>

            {/* Slices list */}
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.5rem", 
                maxHeight: "420px", 
                overflowY: slices.length > 6 ? "auto" : "visible",
                paddingRight: "0.25rem",
                marginBottom: "1.5rem"
              }}
            >
              {slices.map((slice) => (
                <div 
                  key={slice.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.4rem", 
                    background: "rgba(255,255,255,0.02)",
                    padding: "0.4rem",
                    borderRadius: "6px"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={slice.enabled}
                    onChange={(e) => handleUpdateSlice(slice.id, { enabled: e.target.checked })}
                    style={{ cursor: "pointer", width: "14px", height: "14px" }}
                  />

                  <input
                    type="text"
                    value={slice.label}
                    onChange={(e) => handleUpdateSlice(slice.id, { label: e.target.value })}
                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem", flex: 1 }}
                  />

                  <WheelColorPicker label={`Màu ô ${slice.label}`} value={slice.color} onChange={(color) => handleUpdateSlice(slice.id, { color })} />

                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", width: "16px", textAlign: "right" }}>
                      {slice.weight}
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={slice.weight}
                      onChange={(e) => handleUpdateSlice(slice.id, { weight: Number(e.target.value) })}
                      style={{ width: "45px", accentColor: "#8b5cf6", cursor: "pointer" }}
                    />
                  </div>

                  <button 
                    onClick={() => handleDeleteSlice(slice.id)}
                    className="btn btn-danger" 
                    style={{ padding: "0.3rem 0.4rem", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                    disabled={slices.length <= 1}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Host Controls & Prank settings */}
          <div className="glass-panel" style={{ border: "1px solid rgba(236, 72, 153, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "#ec4899", fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <KeyIcon className="w-5 h-5" /> Bảng điều khiển Host (Prank Mode)
              </h3>
              <span style={{ background: "rgba(236, 72, 153, 0.15)", color: "#ec4899", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "bold" }}>
                CẤU HÌNH BÍ MẬT
              </span>
            </div>

            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "1rem" }}>
              Thiết lập kết quả dừng được định sẵn cho vòng quay. Người dùng thông thường sẽ không nhìn thấy bảng này.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a78bfa", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.3rem" }}>
                  <AdjustmentsHorizontalIcon className="w-4 h-4" /> Chỉ định kết quả dừng (Cheat Mode):
                </label>
                <select
                  value={customWinnerId}
                  onChange={(e) => setCustomWinnerId(e.target.value)}
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                >
                  <option value="random">Lấy ngẫu nhiên theo tỉ lệ thực tế</option>
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      Chỉ định dừng ở ô: {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="switch-container">
                  <span className="switch">
                    <input
                      type="checkbox"
                      checked={hideOnWin}
                      onChange={(e) => setHideOnWin(e.target.checked)}
                    />
                    <span className="slider" />
                  </span>
                  <span style={{ fontSize: "0.85rem" }}>Ẩn ô này khỏi vòng quay sau khi trúng giải</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={isSaving}
              style={{ flex: 1, padding: "0.8rem", fontSize: "1rem" }}
            >
              {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
            </button>
            <Link 
              href="/admin/wheels" 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: "0.8rem", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Hủy bỏ
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
