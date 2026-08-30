import React from "react";

interface WheelStageProps {
  backgroundImage?: string | null;
  className?: string;
  children: React.ReactNode;
}

export default function WheelStage({ backgroundImage, className = "", children }: WheelStageProps) {
  return (
    <div className={`wheel-stage ${className}`}>
      {backgroundImage && <img className="wheel-stage-background" src={backgroundImage} alt="Nền vòng quay" />}
      <div className="wheel-stage-shade" />
      <div className="wheel-stage-content">{children}</div>
    </div>
  );
}
