"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LuckyWheel, { WheelItem } from "@/components/LuckyWheel";
import WheelStage from "@/components/WheelStage";
import WheelBackgroundUpload from "@/components/WheelBackgroundUpload";
import WheelColorPicker from "@/components/WheelColorPicker";
import { createWheelAction } from "../../actions";
import { ArrowLeftIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon, WheelIcon } from "@/components/Icons";

const palette = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

const makeSlice = (index: number): WheelItem => ({
  id: crypto.randomUUID(),
  label: `Phần thưởng ${index + 1}`,
  color: palette[index % palette.length],
  weight: 1,
  enabled: true,
});

export default function CreateWheelClient() {
  const router = useRouter();
  const [name, setName] = useState("Vòng quay may mắn");
  const [isPublic, setIsPublic] = useState(true);
  const [slices, setSlices] = useState<WheelItem[]>(() => Array.from({ length: 6 }, (_, index) => makeSlice(index)));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const updateSlice = (id: string, changes: Partial<WheelItem>) => {
    setSlices((current) => current.map((slice) => slice.id === id ? { ...slice, ...changes } : slice));
  };

  const addSlice = () => setSlices((current) => [...current, makeSlice(current.length)]);
  const removeSlice = (id: string) => setSlices((current) => current.length > 2 ? current.filter((slice) => slice.id !== id) : current);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên cho vòng quay.");
      return;
    }
    if (slices.filter((slice) => slice.enabled).length < 2) {
      setError("Cần ít nhất 2 ô đang hoạt động để tạo vòng quay.");
      return;
    }

    setError("");
    setIsCreating(true);
    const result = await createWheelAction(name.trim(), JSON.stringify(slices), isPublic, backgroundImage);
    setIsCreating(false);
    if (result.success && result.wheelId) {
      router.push(`/admin/wheels/${result.wheelId}`);
    } else {
      setError(result.error || "Không thể tạo vòng quay. Vui lòng thử lại.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PlusIcon className="w-6 h-6" style={{ color: "#a78bfa" }} /> Tạo vòng quay mới
          </h2>
          <p style={{ color: "#9ca3af", marginTop: "0.35rem", fontSize: "0.9rem" }}>Tùy chỉnh nội dung và xem trước trước khi xuất bản.</p>
        </div>
        <Link href="/admin/wheels" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
          <ArrowLeftIcon className="w-5 h-5" /> Quay lại
        </Link>
      </div>

      {error && <div className="glass-panel" style={{ color: "#fca5a5", background: "rgba(239, 68, 68, 0.12)", padding: "0.8rem", marginBottom: "1rem" }}>{error}</div>}

      <div className="wheel-create-grid">
        <section className="glass-panel wheel-editor-preview" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center" }}>
          <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", gap: "0.5rem", alignItems: "center" }}><WheelIcon className="w-5 h-5" style={{ color: "#ec4899" }} /> Xem trước</h3>
            <span style={{ color: "#a78bfa", fontSize: "0.75rem", fontWeight: 700 }}>{slices.filter((slice) => slice.enabled).length} Ô HIỂN THỊ</span>
          </div>
          <WheelStage backgroundImage={backgroundImage} className="wheel-editor-stage"><div style={{ pointerEvents: "none" }}><LuckyWheel items={slices} isSpinning={false} onSpinComplete={() => {}} onSpinStart={() => {}} triggerSpinSignal={false} setTriggerSpinSignal={() => {}} customWinningIndex={null} /></div></WheelStage>
          <p style={{ color: "#9ca3af", fontSize: "0.8rem", textAlign: "center" }}>Bản xem trước sẽ cập nhật ngay khi bạn thay đổi các ô bên cạnh.</p>
        </section>

        <section className="wheel-editor-controls" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="glass-panel">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa", display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.2rem" }}><PencilIcon className="w-5 h-5" /> Thông tin cơ bản</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <label className="wheel-form-label">Tên vòng quay
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Quay số trúng quà" />
              </label>
              <label className="wheel-form-label">Chế độ hiển thị
                <select value={isPublic ? "public" : "private"} onChange={(event) => setIsPublic(event.target.value === "public")}>
                  <option value="public">Công khai — mọi người có thể truy cập</option>
                  <option value="private">Riêng tư — chỉ quản trị viên</option>
                </select>
              </label>
              <div className="wheel-form-label">Ảnh nền vòng quay
                <WheelBackgroundUpload value={backgroundImage} onChange={setBackgroundImage} onError={setError} />
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div><h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Các ô vòng quay</h3><p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.25rem" }}>Bật/tắt, đổi màu và đặt tỷ lệ xuất hiện.</p></div>
              <button type="button" className="btn btn-secondary" onClick={addSlice} style={{ padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}><PlusIcon className="w-4 h-4" /> Thêm ô</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", maxHeight: "330px", overflowY: "auto", paddingRight: "0.25rem" }}>
              {slices.map((slice, index) => <div key={slice.id} className="wheel-slice-row">
                <input aria-label={`Bật ô ${index + 1}`} type="checkbox" checked={slice.enabled} onChange={(event) => updateSlice(slice.id, { enabled: event.target.checked })} />
                <input aria-label={`Tên ô ${index + 1}`} type="text" value={slice.label} onChange={(event) => updateSlice(slice.id, { label: event.target.value })} />
                <WheelColorPicker label={`Màu ô ${index + 1}`} value={slice.color} onChange={(color) => updateSlice(slice.id, { color })} />
                <label className="wheel-weight">Tỷ lệ <strong>{slice.weight}</strong><input aria-label={`Tỷ lệ ô ${index + 1}`} type="range" min="1" max="10" value={slice.weight} onChange={(event) => updateSlice(slice.id, { weight: Number(event.target.value) })} /></label>
                <button type="button" aria-label={`Xóa ô ${index + 1}`} className="btn btn-danger" disabled={slices.length <= 2} onClick={() => removeSlice(slice.id)} style={{ padding: "0.35rem" }}><TrashIcon className="w-4 h-4" /></button>
              </div>)}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-primary" onClick={handleCreate} disabled={isCreating} style={{ flex: 1, padding: "0.85rem" }}><CheckIcon className="w-5 h-5" /> {isCreating ? "Đang tạo..." : "Tạo vòng quay"}</button>
            <Link href="/admin/wheels" className="btn btn-secondary" style={{ padding: "0.85rem 1.2rem" }}>Hủy</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
