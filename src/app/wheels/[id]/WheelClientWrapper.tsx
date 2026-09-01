"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import LuckyWheel, { WheelItem } from "@/components/LuckyWheel";
import WheelStage from "@/components/WheelStage";
import { consumeSpinCreditAction, redeemSpinCodeAction, saveSpinAction } from "./actions";
import { ArrowLeftIcon } from "@/components/Icons";

interface WheelClientWrapperProps {
  wheelId: string;
  wheelName: string;
  creatorName: string;
  slices: WheelItem[];
  currentUser: { id: string; username: string; role: string } | null;
  customWinnerId?: string;
  hideOnWin?: boolean;
  backgroundImage?: string | null;
  initialUpdatedAt: string;
  initialCredits: number;
}

export default function WheelClientWrapper({
  wheelId,
  wheelName,
  creatorName,
  slices,
  currentUser,
  customWinnerId = "random",
  hideOnWin = false,
  backgroundImage,
  initialUpdatedAt,
  initialCredits,
}: WheelClientWrapperProps) {
  const [items, setItems] = useState<WheelItem[]>(slices);
  const [wheelConfig, setWheelConfig] = useState({ wheelName, customWinnerId, hideOnWin, backgroundImage, updatedAt: initialUpdatedAt });
  const [isSpinning, setIsSpinning] = useState(false);
  const [triggerSpin, setTriggerSpin] = useState(false);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const winAudioContextRef = useRef<AudioContext | null>(null);
  const spinCreditPromiseRef = useRef<Promise<boolean> | null>(null);
  const spinStartLockedRef = useRef(false);
  const spinCreditErrorRef = useRef("");
  const isAdminView = currentUser?.role === "admin";
  const [credits, setCredits] = useState(initialCredits);
  const [spinCode, setSpinCode] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isSpinStarting, setIsSpinStarting] = useState(false);
  // Show the guidance immediately for every regular visitor with no credits,
  // including guests. Guests will see that they need to sign in before using a code.
  const [showCodePrompt, setShowCodePrompt] = useState(Boolean(!isAdminView && initialCredits <= 0));

  // Sync slices prop updates
  useEffect(() => {
    setItems(slices);
  }, [slices]);

  // Poll only a small configuration payload. This makes changes saved by the
  // admin visible to active visitors within two seconds, without a refresh.
  useEffect(() => {
    let cancelled = false;
    const syncWheelConfig = async () => {
      if (document.visibilityState !== "visible" || isSpinning || isSpinStarting) return;
      try {
        const response = await fetch(`/api/wheels/${wheelId}`, { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as { name: string; slices: string; customWinnerId: string; hideOnWin: boolean; backgroundImage: string | null; updatedAt: string };
        if (cancelled || next.updatedAt === wheelConfig.updatedAt) return;
        const nextSlices = JSON.parse(next.slices) as WheelItem[];
        if (!Array.isArray(nextSlices)) return;
        setItems(nextSlices);
        setWheelConfig({ wheelName: next.name, customWinnerId: next.customWinnerId, hideOnWin: next.hideOnWin, backgroundImage: next.backgroundImage, updatedAt: next.updatedAt });
      } catch {
        // Keep the last known configuration if the visitor temporarily loses connection.
      }
    };
    const timer = window.setInterval(syncWheelConfig, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [wheelId, wheelConfig.updatedAt, isSpinning, isSpinStarting]);

  const activeItems = items.filter((item) => item.enabled);

  const getCustomWinningIndex = (): number | null => {
    if (wheelConfig.customWinnerId === "random") return null;
    const index = activeItems.findIndex((item) => item.id === wheelConfig.customWinnerId);
    return index !== -1 ? index : null;
  };

  const handleSpinStartClick = () => {
    if (activeItems.length === 0 || isSpinning || isSpinStarting || spinStartLockedRef.current) return;
    if (!currentUser) { setCodeMessage("Vui lòng đăng nhập và nhập mã quay trước khi quay."); setShowCodePrompt(true); return; }

    spinStartLockedRef.current = true;
    prepareWinningSound();
    setWinner(null);
    setTriggerSpin(true);

    // Start the animation immediately. The database credit check happens in
    // parallel and must complete successfully before the result is recorded.
    if (isAdminView) return;

    setIsSpinStarting(true);
    setCredits((current) => Math.max(0, current - 1));
    spinCreditErrorRef.current = "";
    const creditPromise = consumeSpinCreditAction()
      .then((creditResult) => {
        if ("success" in creditResult && creditResult.success) {
          setCredits(creditResult.remaining);
          return true;
        }
        spinCreditErrorRef.current = creditResult.error || "Không thể xác nhận lượt quay.";
        setCredits((current) => current + 1);
        return false;
      })
      .catch(() => {
        spinCreditErrorRef.current = "Không thể xác nhận lượt quay.";
        setCredits((current) => current + 1);
        return false;
      })
      .finally(() => setIsSpinStarting(false));
    spinCreditPromiseRef.current = creditPromise;
  };

  const redeemCode = async () => {
    setIsRedeeming(true); setCodeMessage("");
    const result = await redeemSpinCodeAction(spinCode);
    setIsRedeeming(false);
    if ("success" in result && result.success) { setCredits(result.remaining || 0); setSpinCode(""); setCodeMessage("Đã thêm lượt quay vào tài khoản."); setShowCodePrompt(false); }
    else setCodeMessage(result.error || "Không thể dùng mã.");
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
    const creditAccepted = await (spinCreditPromiseRef.current ?? Promise.resolve(true));
    spinCreditPromiseRef.current = null;
    spinStartLockedRef.current = false;
    setIsSpinning(false);
    if (!creditAccepted) {
      setCodeMessage(spinCreditErrorRef.current || "Bạn chưa có lượt quay. Hãy nhập mã quay mới.");
      setShowCodePrompt(true);
      return;
    }
    setWinner(wonItem);
    playWinningSound();

    // Save spin result in database
    await saveSpinAction(wheelId, wonItem.label);

    if (wheelConfig.hideOnWin) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.7rem" }}>
          <Link href={isAdminView ? "/admin/wheels" : "/"} className="btn btn-secondary" style={{ padding: "0.45rem 0.7rem", fontSize: "0.8rem" }}>
            <ArrowLeftIcon className="w-4 h-4" /> Quay về
          </Link>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "800" }}>{wheelConfig.wheelName}</h1>
          <span style={{ width: "91px" }} aria-hidden="true" />
        </div>
      </div>

      <div className="wheel-focused-view">
        {/* Left Column: Canvas, Spin Button, Winner Reveal */}
        <div className="wheel-focused-content" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {!isAdminView && <div className="glass-panel spin-code-entry"><div><strong>🔑 Nhập mã quay</strong><p>{currentUser ? `Lượt còn lại: ${credits}` : "Đăng nhập để sử dụng mã và bắt đầu quay."}</p></div><div style={{ display: "flex", gap: ".5rem" }}><input maxLength={10} placeholder="MÃ QUAY" value={spinCode} onChange={(e) => setSpinCode(e.target.value.toUpperCase())} disabled={!currentUser} /><button className="btn btn-secondary" onClick={redeemCode} disabled={!currentUser || !spinCode || isRedeeming}>{isRedeeming ? "Đang kiểm tra" : "Xác nhận"}</button></div>{codeMessage && <small>{codeMessage}</small>}</div>}
          <div className="glass-panel" style={{ textAlign: "center", padding: "0.75rem" }}>
            <WheelStage backgroundImage={wheelConfig.backgroundImage} className="wheel-view-stage">
              <LuckyWheel
              items={items}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              onSpinStart={handleSpinStart}
              triggerSpinSignal={triggerSpin}
              setTriggerSpinSignal={setTriggerSpin}
              customWinningIndex={getCustomWinningIndex()}
                large
                canSpin={!isSpinStarting && (isAdminView || Boolean(currentUser && credits > 0))}
                onSpinRequest={handleSpinStartClick}
              />
            </WheelStage>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: "1rem", fontSize: "1.2rem" }}
                onClick={handleSpinStartClick}
                disabled={isSpinning || isSpinStarting || activeItems.length === 0 || (!isAdminView && (!currentUser || credits <= 0))}
              >
                {isSpinning ? "Đang quay..." : "QUAY NGAY"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {winner && <div className="wheel-result-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setWinner(null); }} role="presentation">
        <div className="wheel-result-popup" role="dialog" aria-modal="true" aria-label="Kết quả vòng quay">
          <button type="button" className="wheel-result-close" onClick={() => setWinner(null)} aria-label="Đóng thông báo">×</button>
          <span className="wheel-result-sparkle">✦</span>
          <span className="wheel-result-title">CHÚC MỪNG!</span>
          <strong>{winner.label}</strong>
          <small>Bấm bên ngoài thông báo hoặc nút × để đóng</small>
        </div>
      </div>}
      {showCodePrompt && <button type="button" className="wheel-result-backdrop" onClick={() => setShowCodePrompt(false)} aria-label="Đóng thông báo mã quay"><span className="wheel-result-popup wheel-code-popup"><span className="wheel-result-sparkle">🔑</span><span className="wheel-result-title">CHƯA CÓ LƯỢT QUAY</span><strong>{currentUser ? "Hãy nhập mã quay để bắt đầu" : "Hãy đăng nhập và nhập mã quay"}</strong><small>{currentUser ? "Nhập mã ở khung phía trên, sau đó bấm Xác nhận." : "Đăng nhập để sử dụng mã quay và bắt đầu."}</small></span></button>}
    </div>
  );
}
