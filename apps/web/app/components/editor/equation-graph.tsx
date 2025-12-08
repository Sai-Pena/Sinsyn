"use client";

import type React from "react";

import { useEffect, useRef, useCallback } from "react";
import { evaluate } from "mathjs";

interface EquationGraphProps {
  equation: string;
  dX: number;
  xValue: number;
  showBeatTicks: boolean;
  enabledTicks?: boolean[];
  onTickToggle?: (tickIndex: number) => void;
  domainL?: number;
  domainR?: number;
}

export function EquationGraph({
  equation,
  dX,
  xValue,
  showBeatTicks,
  enabledTicks,
  onTickToggle,
  domainL = 1,
  domainR = 500,
}: EquationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const HzMin = 16.35;
  const HzMax = 7902.13;

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!showBeatTicks || !onTickToggle) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const clickX = (event.clientX - rect.left) * scaleX;

      const width = canvas.width;

      // Find which tick was clicked (within a tolerance)
      let tickIndex = 0;
      for (let x = domainL; x <= domainR; x += dX) {
        const px = ((x - domainL) / (domainR - domainL)) * width;
        const tolerance = 15; // pixels

        if (Math.abs(clickX - px) < tolerance) {
          onTickToggle(tickIndex);
          return;
        }
        tickIndex++;
      }
    },
    [showBeatTicks, onTickToggle, domainL, domainR, dX]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;

    // Draw equation curve
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let px = 0; px <= width; px += 1) {
      const xVal = domainL + (px / width) * (domainR - domainL);
      try {
        let yVal = evaluate(equation, { x: xVal }) ?? 0;
        yVal = Math.min(Math.max(yVal, HzMin), HzMax);
        const y = height - (yVal / 1000) * (height / 2);
        if (px === 0) {
          ctx.moveTo(px, y);
        } else {
          ctx.lineTo(px, y);
        }
      } catch {
        // Skip invalid points
      }
    }
    ctx.stroke();

    // Draw beat ticks with enabled/disabled state
    if (showBeatTicks) {
      let tickIndex = 0;
      for (let x = domainL; x <= domainR; x += dX) {
        const px = ((x - domainL) / (domainR - domainL)) * width;
        const isEnabled = enabledTicks?.[tickIndex] ?? true;
        const isActive = Math.abs(x - xValue) < dX / 2;

        if (isActive) {
          ctx.strokeStyle = `rgba(255, 0, 0, 1)`;
          ctx.lineWidth = 2;
        } else if (isEnabled) {
          ctx.strokeStyle = `rgba(34, 197, 94, 0.6)`;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();

        if (isEnabled) {
          try {
            let yVal = evaluate(equation, { x }) ?? 0;
            yVal = Math.min(Math.max(yVal, HzMin), HzMax);
            const y = height - (yVal / 1000) * (height / 2);

            ctx.fillStyle = isActive
              ? "rgba(255, 0, 0, 1)"
              : "rgba(34, 197, 94, 0.8)";
            ctx.beginPath();
            ctx.arc(px, y, isActive ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
          } catch {
            // Skip
          }
        } else {
          try {
            let yVal = evaluate(equation, { x }) ?? 0;
            yVal = Math.min(Math.max(yVal, HzMin), HzMax);
            const y = height - (yVal / 1000) * (height / 2);

            ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, y, 4, 0, Math.PI * 2);
            ctx.stroke();
          } catch {
            // Skip
          }
        }

        tickIndex++;
      }
    }
  }, [equation, xValue, showBeatTicks, dX, domainL, domainR, enabledTicks]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      onClick={handleCanvasClick}
      className="border border-border rounded-lg w-full cursor-crosshair"
    />
  );
}
