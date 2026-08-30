"use client";

import React, { useRef, useEffect, useState } from "react";

export interface WheelItem {
  id: string;
  label: string;
  color: string;
  weight: number;
  enabled: boolean;
}

interface LuckyWheelProps {
  items: WheelItem[];
  isSpinning: boolean;
  onSpinComplete: (item: WheelItem) => void;
  onSpinStart: () => void;
  triggerSpinSignal: boolean; // Toggle to start spin
  setTriggerSpinSignal: (val: boolean) => void;
  customWinningIndex: number | null; // Set by host to manipulate result
  large?: boolean;
  canSpin?: boolean;
  onSpinRequest?: () => void;
}

export default function LuckyWheel({
  items,
  isSpinning,
  onSpinComplete,
  onSpinStart,
  triggerSpinSignal,
  setTriggerSpinSignal,
  customWinningIndex,
  large = false,
  canSpin = true,
  onSpinRequest,
}: LuckyWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Animation values
  const [angle, setAngle] = useState(0);
  const activeItems = items.filter((item) => item.enabled);

  // Play tick sound when crossing segment boundary
  const lastTickSegmentRef = useRef<number>(-1);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playTickSound = (frequency = 800) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "suspended") return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Audio context might be blocked or failed
    }
  };

  // Run the spin animation
  const spin = (winningIndex: number) => {
    if (activeItems.length === 0) return;

    onSpinStart();

    const duration = 5000; // 5 seconds
    const startTimestamp = performance.now();
    const startAngle = angle % 360;

    // Standard slices: calculate arc size
    const sliceAngle = 360 / activeItems.length;

    // Target stop angle calculation
    // The pointer is at the top (90 degrees in standard Canvas, which is 270 degrees)
    // We want the winning slice to align with the top pointer (270 deg)
    // Formula: (270 - sliceCenterAngle) % 360
    const targetSliceCenter = (winningIndex * sliceAngle) + (sliceAngle / 2);
    
    // We add multiple full rotations (e.g. 5 full spins = 1800 deg)
    const extraSpins = 6 * 360;
    const targetAngle = extraSpins + (270 - targetSliceCenter);
    const totalRotation = targetAngle - startAngle;

    lastTickSegmentRef.current = -1;

    const animate = (now: number) => {
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuart formula: 1 - (1 - progress)^4
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentAngle = startAngle + totalRotation * easeProgress;

      setAngle(currentAngle);

      // Calculate current slice at pointer for tick sounds
      // Pointer is at 270 degrees
      const normalizedAngle = (currentAngle % 360 + 360) % 360;
      const pointerAngle = (270 - normalizedAngle + 360) % 360;
      const currentSegment = Math.floor(pointerAngle / sliceAngle) % activeItems.length;

      if (currentSegment !== lastTickSegmentRef.current && progress < 0.99) {
        lastTickSegmentRef.current = currentSegment;
        // Pitch goes down slightly as wheel slows
        const pitch = 700 + (1 - progress) * 300;
        playTickSound(pitch);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished
        setTriggerSpinSignal(false);
        onSpinComplete(activeItems[winningIndex]);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Trigger spin based on signal
  useEffect(() => {
    if (triggerSpinSignal && !isSpinning && activeItems.length > 0) {
      initAudio();
      
      // Determine winner based on probability weights
      let chosenIndex = 0;
      if (customWinningIndex !== null && customWinningIndex >= 0 && customWinningIndex < activeItems.length) {
        chosenIndex = customWinningIndex;
      } else {
        const totalWeight = activeItems.reduce((acc, item) => acc + item.weight, 0);
        let randomVal = Math.random() * totalWeight;
        
        for (let i = 0; i < activeItems.length; i++) {
          randomVal -= activeItems[i].weight;
          if (randomVal <= 0) {
            chosenIndex = i;
            break;
          }
        }
      }

      spin(chosenIndex);
    }
  }, [triggerSpinSignal]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Redraw canvas when items or angle changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays (Retina)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    if (activeItems.length === 0) {
      // Draw placeholder
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Không có ô nào kích hoạt", centerX, centerY);
      return;
    }

    const sliceAngle = (2 * Math.PI) / activeItems.length;
    const radAngle = (angle * Math.PI) / 180;

    // 1. Draw Shadow Glow behind the wheel
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = "rgba(139, 92, 246, 0.25)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#0c0d14";
    ctx.fill();
    ctx.restore();

    // 2. Draw Slices
    activeItems.forEach((item, i) => {
      const startAngle = i * sliceAngle + radAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice sector
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      const sliceGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sliceGradient.addColorStop(0, "rgba(255, 255, 255, 0.24)");
      sliceGradient.addColorStop(0.12, item.color);
      sliceGradient.addColorStop(1, item.color);
      ctx.fillStyle = sliceGradient;
      ctx.fill();

      // Divider lines
      ctx.strokeStyle = "rgba(11, 15, 25, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Slice Text labels
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.fillStyle = "#ffffff";
      // Text shadow for readability
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      
      // Responsive dynamic font sizing based on slice count
      const fontSize = activeItems.length > 15 ? 11 : activeItems.length > 10 ? 14 : 17;
      ctx.font = `bold ${fontSize}px var(--font-sans)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Truncate text if it's too long
      let text = item.label;
      if (text.length > 18) {
        text = text.substring(0, 16) + "..";
      }

      ctx.fillText(text, radius * 0.58, 0);
      ctx.restore();
    });

    // 3. Draw clean outer frame; the moving neon outline is rendered as a CSS layer.
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(15, 23, 42, 0.94)";
    ctx.lineWidth = 14;
    ctx.stroke();

    // 4. Draw the multi-layer center hub.
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 43, 0, 2 * Math.PI);
    const outerHubGradient = ctx.createRadialGradient(centerX - 12, centerY - 12, 2, centerX, centerY, 43);
    outerHubGradient.addColorStop(0, "#f5d0fe");
    outerHubGradient.addColorStop(0.22, "#e879f9");
    outerHubGradient.addColorStop(0.58, "#7c3aed");
    outerHubGradient.addColorStop(1, "#2e1065");
    ctx.fillStyle = outerHubGradient;
    ctx.shadowBlur = 24;
    ctx.shadowColor = "rgba(217, 70, 239, 0.7)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 31, 0, 2 * Math.PI);
    const innerHubGradient = ctx.createLinearGradient(centerX - 20, centerY - 20, centerX + 25, centerY + 25);
    innerHubGradient.addColorStop(0, "#1e1b4b");
    innerHubGradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = innerHubGradient;
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 27, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(196, 181, 253, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#fef3c7";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#fbbf24";
    ctx.font = "800 9px var(--font-sans)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", centerX, centerY - 9);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.font = "800 8px var(--font-sans)";
    ctx.fillText("QUAY", centerX, centerY + 7);
    ctx.restore();

    // 5. Draw Top Pointer Pin
    ctx.save();
    ctx.translate(centerX, centerY - radius - 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-15, -30);
    ctx.lineTo(15, -30);
    ctx.closePath();
    ctx.fillStyle = "#f43f5e";
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#f43f5e";
    ctx.fill();

    // Pointer border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

  }, [angle, activeItems]);

  return (
    <div 
      className="wheel-canvas-container" 
      style={{
        position: "relative",
        width: "100%",
        maxWidth: large ? "600px" : "420px",
        aspectRatio: "1/1",
        margin: "0 auto",
      }}
    >
      <div className="wheel-neon-orbit" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: isSpinning || !canSpin ? "not-allowed" : "pointer",
          position: "relative",
          zIndex: 1,
        }}
        onClick={() => {
          if (!isSpinning && canSpin) {
            if (onSpinRequest) onSpinRequest();
            else setTriggerSpinSignal(true);
          }
        }}
      />
    </div>
  );
}
