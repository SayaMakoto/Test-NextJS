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
}

export default function LuckyWheel({
  items,
  isSpinning,
  onSpinComplete,
  onSpinStart,
  triggerSpinSignal,
  setTriggerSpinSignal,
  customWinningIndex,
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
      ctx.fillStyle = item.color;
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
      const fontSize = activeItems.length > 15 ? 10 : activeItems.length > 10 ? 12 : 14;
      ctx.font = `bold ${fontSize}px var(--font-sans)`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Truncate text if it's too long
      let text = item.label;
      if (text.length > 15) {
        text = text.substring(0, 13) + "..";
      }

      ctx.fillText(text, radius - 24, 0);
      ctx.restore();
    });

    // 3. Draw Outer Glowing Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 8;
    ctx.stroke();

    // 4. Draw Flashing Bulbs on Ring
    const numBulbs = 20;
    const flashOffset = Math.floor(Date.now() / 250) % 2; // alternates every 250ms

    for (let i = 0; i < numBulbs; i++) {
      const bulbAngle = (i * (2 * Math.PI)) / numBulbs + (angle * Math.PI) / 180;
      const bulbX = centerX + radius * Math.cos(bulbAngle);
      const bulbY = centerY + radius * Math.sin(bulbAngle);

      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 4, 0, 2 * Math.PI);
      
      const isGlowing = (i + flashOffset) % 2 === 0;
      ctx.fillStyle = isGlowing ? "#fef08a" : "#71717a";
      if (isGlowing) {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#fef08a";
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fill();
      }
    }

    // 5. Draw Center Pin (Inner Hub)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#111827";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center jewel glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)";
    ctx.fillStyle = "#8b5cf6";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#8b5cf6";
    ctx.fill();
    ctx.restore();

    // 6. Draw Top Pointer Pin
    ctx.save();
    ctx.translate(centerX, centerY - radius - 5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, -24);
    ctx.lineTo(12, -24);
    ctx.closePath();
    ctx.fillStyle = "#ec4899"; // Accent color
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ec4899";
    ctx.fill();

    // Pointer border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

  }, [angle, activeItems]);

  // Minor loop to update the lightbulb animation when not spinning
  useEffect(() => {
    let animationId: number;
    const updateLights = () => {
      // Force redraw when idle so bulb lights flash
      if (!isSpinning) {
        setAngle((prev) => prev); 
      }
      animationId = requestAnimationFrame(updateLights);
    };
    animationId = requestAnimationFrame(updateLights);
    return () => cancelAnimationFrame(animationId);
  }, [isSpinning]);

  return (
    <div 
      className="wheel-canvas-container" 
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        aspectRatio: "1/1",
        margin: "0 auto",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: isSpinning ? "not-allowed" : "pointer",
        }}
        onClick={() => {
          if (!isSpinning) {
            setTriggerSpinSignal(true);
          }
        }}
      />
    </div>
  );
}
