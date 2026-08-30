"use client";

import React, { useRef, useState } from "react";

interface WheelBackgroundUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onError: (message: string) => void;
}

async function optimiseImage(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = imageUrl;
  await image.decode();

  const maxDimension = 1280;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(imageUrl);

  let quality = 0.82;
  let result = canvas.toDataURL("image/webp", quality);
  while (result.length > 560_000 && quality > 0.42) {
    quality -= 0.1;
    result = canvas.toDataURL("image/webp", quality);
  }
  if (result.length > 700_000) throw new Error("Ảnh vẫn quá lớn sau khi nén. Hãy chọn ảnh có dung lượng nhỏ hơn.");
  return result;
}

export default function WheelBackgroundUpload({ value, onChange, onError }: WheelBackgroundUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Vui lòng chọn một tệp hình ảnh.");
      return;
    }

    setIsProcessing(true);
    try {
      onChange(await optimiseImage(file));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Không thể xử lý ảnh nền.");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  return (
    <div className="wheel-background-upload">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} hidden />
      <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()} disabled={isProcessing}>
        {isProcessing ? "Đang tối ưu ảnh..." : value ? "Thay ảnh nền" : "Tải ảnh nền"}
      </button>
      {value && <button type="button" className="wheel-remove-background" onClick={() => onChange(null)}>Bỏ ảnh</button>}
      <p>PNG, JPG hoặc WebP. Ảnh sẽ được nén trước khi lưu.</p>
    </div>
  );
}
