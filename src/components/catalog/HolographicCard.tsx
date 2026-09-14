"use client";

import React, { useState, useRef, useCallback } from "react";

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  isCollectible?: boolean;
}

export function HolographicCard({
  children,
  className = "",
  isCollectible = true,
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isCollectible) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation angles (max +/- 12 degrees)
    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);

    // Glare position in percentages
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.55 });
  }, [isCollectible]);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  if (!isCollectible) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
      }}
      className={`relative select-none transition-transform duration-150 ${className}`}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
          transition: rotateX === 0 && rotateY === 0 ? "transform 0.5s ease-out" : "none",
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-md group"
      >
        {children}

        {/* Dynamic Holographic Iridescent Foil Overlay */}
        <div
          aria-hidden="true"
          style={{
            opacity: glarePosition.opacity,
            background: `
              radial-gradient(
                circle at ${glarePosition.x}% ${glarePosition.y}%,
                rgba(255, 255, 255, 0.45) 0%,
                rgba(255, 107, 53, 0.25) 20%,
                rgba(31, 58, 95, 0.2) 40%,
                rgba(255, 215, 0, 0.25) 60%,
                transparent 80%
              ),
              linear-gradient(
                ${rotateY * 8 + 120}deg,
                rgba(255, 0, 128, 0.15),
                rgba(0, 200, 255, 0.15),
                rgba(255, 220, 0, 0.15)
              )
            `,
            mixBlendMode: "color-dodge",
            transition: "opacity 0.25s ease-out",
          }}
          className="pointer-events-none absolute inset-0 z-30 rounded-2xl"
        />

        {/* Shimmer Border Edge */}
        <div
          aria-hidden="true"
          style={{
            opacity: glarePosition.opacity > 0 ? 0.8 : 0,
            transition: "opacity 0.3s ease-out",
          }}
          className="pointer-events-none absolute inset-0 z-30 rounded-2xl border border-white/60 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)]"
        />
      </div>
    </div>
  );
}
