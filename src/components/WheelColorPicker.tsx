"use client";

import { useEffect, useRef, useState } from "react";

const popularColors = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e", "#64748b",
];

interface WheelColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

export default function WheelColorPicker({ value, onChange, label }: WheelColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="wheel-color-picker" ref={pickerRef}>
      <button type="button" className="wheel-color-trigger" onClick={() => setIsOpen((open) => !open)} aria-label={`${label}: mở bảng màu`} aria-expanded={isOpen}>
        <span style={{ background: value }} />
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen && <div className="wheel-color-menu" aria-label="Màu phổ biến">
        <div className="wheel-color-presets">
          {popularColors.map((color) => <button key={color} type="button" aria-label={`Chọn màu ${color}`} title={color} className={value.toLowerCase() === color ? "is-selected" : ""} style={{ background: color }} onClick={() => { onChange(color); setIsOpen(false); }} />)}
        </div>
        <label className="wheel-custom-color">Màu khác <input aria-label={label} type="color" value={value} onChange={(event) => onChange(event.target.value)} /></label>
      </div>
      }
    </div>
  );
}
